<?php

namespace App\Services\ATC;

use App\Models\Foundation;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class Atc3dsService
{
    /**
     * Paso 1: Setup Service (/risk/v1/authentication-setups)
     * Inicia la sesión 3DS2 con Cybersource para obtener el JWT token de Cardinal Cruise.
     */
    public static function setupSession(Foundation $tenant, string $referenceCode, ?array $cardData = null): array
    {
        $path = '/risk/v1/authentication-setups';
        $payload = [
            'clientReferenceInformation' => [
                'code' => $referenceCode,
            ],
        ];

        if ($cardData) {
            $payload['paymentInformation'] = [
                'card' => array_filter([
                    'number'          => $cardData['card_number'] ?? null,
                    'expirationMonth' => $cardData['expiration_month'] ?? null,
                    'expirationYear'  => $cardData['expiration_year'] ?? null,
                ]),
            ];
        }

        // En entorno sandbox con credenciales de prueba, responder de inmediato
        if ($tenant->is_sandbox) {
            return [
                'accessToken'             => 'sandbox_jwt_' . Str::random(40),
                'referenceId'             => 'SANDBOX-REF-' . strtoupper(Str::random(12)),
                'deviceDataCollectionUrl' => 'https://centinelapistag.cardinalcommerce.com/V1/Cruise/Collect',
                'merchantReferenceNumber' => $referenceCode,
            ];
        }

        try {
            $response = AtcSignatureService::request($tenant, 'POST', $path, $payload);
            $authInfo = $response['consumerAuthenticationInformation'] ?? [];

            return [
                'accessToken'             => $authInfo['accessToken'] ?? ($response['accessToken'] ?? null),
                'referenceId'             => $authInfo['referenceId'] ?? ($response['referenceId'] ?? null),
                'deviceDataCollectionUrl' => $authInfo['deviceDataCollectionUrl'] ?? ($response['deviceDataCollectionUrl'] ?? 'https://centinelapistag.cardinalcommerce.com/V1/Cruise/Collect'),
                'merchantReferenceNumber' => $referenceCode,
            ];
        } catch (Exception $e) {
            Log::warning("Cybersource 3DS2 setupSession: " . $e->getMessage());

            if ($tenant->is_sandbox) {
                Log::info("Sandbox Mode activo: Retornando sesión 3DS2 simulada para {$tenant->name}");
                return [
                    'accessToken'             => 'sandbox_jwt_' . Str::random(40),
                    'referenceId'             => 'SANDBOX-REF-' . strtoupper(Str::random(12)),
                    'deviceDataCollectionUrl' => 'https://centinelapistag.cardinalcommerce.com/V1/Cruise/Collect',
                    'merchantReferenceNumber' => $referenceCode,
                ];
            }

            throw $e;
        }
    }

    /**
     * Paso 3: Check Enrollment Service (/risk/v1/authentications)
     * Evalúa si la tarjeta requiere Challenge (Step-Up) o aprueba vía Frictionless.
     */
    public static function checkEnrollment(Foundation $tenant, array $data): array
    {
        $path = '/risk/v1/authentications';
        $rawSessionId = !empty($data['fingerprint_session_id']) 
            ? $data['fingerprint_session_id'] 
            : ($tenant->atc_merchant_id . '_' . Str::uuid()->toString());

        // Sanitizar sesión para ThreatMetrix si ya contiene el prefijo del merchantId
        $merchantId = (string) $tenant->atc_merchant_id;
        if (!empty($merchantId) && str_starts_with($rawSessionId, $merchantId)) {
            $rawSessionId = substr($rawSessionId, strlen($merchantId));
        }

        $payload = [
            'clientReferenceInformation' => [
                'code' => $data['merchant_reference_number'] ?? ('ATC-REF-' . strtoupper(Str::random(10))),
            ],
            'orderInformation' => [
                'amountDetails' => [
                    'currency'    => $data['currency'] ?? 'BOB',
                    'totalAmount' => number_format((float) $data['amount'], 2, '.', ''),
                ],
                'billTo' => self::buildBillToPayload($data),
            ],
            'paymentInformation' => [
                'card' => [
                    'number'          => $data['card_number'] ?? null,
                    'expirationMonth' => $data['expiration_month'] ?? null,
                    'expirationYear'  => $data['expiration_year'] ?? null,
                    'securityCode'    => $data['cvv'] ?? null,
                ],
            ],
            'buyerInformation' => [
                'mobilePhone' => !empty($data['phone']) ? $data['phone'] : '70000000',
            ],
            'deviceInformation' => [
                'fingerprintSessionId' => $rawSessionId,
            ],
            'consumerAuthenticationInformation' => [
                'referenceId' => $data['reference_id'] ?? null,
                'returnUrl'   => $data['return_url'] ?? (config('app.url') . '/api/v1/donations/stepup-return'),
            ],
        ];

        // En entorno sandbox con credenciales demo, simular según el tipo de tarjeta (Frictionless vs Challenge)
        if ($tenant->is_sandbox) {
            $cleanNumber = preg_replace('/\D/', '', $data['card_number'] ?? '');
            $isChallengeCard = str_ends_with($cleanNumber, '0002');

            if ($isChallengeCard) {
                return [
                    'success'                     => true,
                    'isChallengeRequired'         => true,
                    'status'                      => 'PENDING_AUTHENTICATION',
                    'stepUpJwt'                   => 'sandbox_stepup_jwt_' . Str::random(30),
                    'acsUrl'                      => 'https://centinelapistag.cardinalcommerce.com/V2/Cruise/StepUp',
                    'stepUpUrl'                   => 'https://centinelapistag.cardinalcommerce.com/V2/Cruise/StepUp',
                    'authenticationTransactionId' => 'auth_tx_' . Str::random(16),
                ];
            }

            return [
                'success'                    => true,
                'isChallengeRequired'        => false,
                'status'                     => 'AUTHENTICATION_SUCCESSFUL',
                'eci'                        => str_starts_with($cleanNumber, '5') ? '02' : '05',
                'cavv'                       => 'AAABBBCCC111222333==',
                'threeDSServerTransactionId' => '3ds_tx_' . Str::random(16),
                'specificationVersion'       => '2.2.0',
            ];
        }

        try {
            $response = AtcSignatureService::request($tenant, 'POST', $path, $payload);
            $authInfo = $response['consumerAuthenticationInformation'] ?? [];
            $status = $response['status'] ?? ($authInfo['status'] ?? 'FAILED');

            $rawEci = $authInfo['eci'] ?? ($authInfo['eciRaw'] ?? ($authInfo['ecommerceIndicator'] ?? null));
            $cardNum = $data['card_number'] ?? '';
            $eciCode = is_numeric($rawEci) ? str_pad((string)$rawEci, 2, '0', STR_PAD_LEFT) : (str_starts_with($cardNum, '5') ? '02' : '05');

            if ($status === 'AUTHENTICATION_SUCCESSFUL') {
                return [
                    'success'                    => true,
                    'isChallengeRequired'        => false,
                    'status'                     => 'AUTHENTICATION_SUCCESSFUL',
                    'eci'                        => $eciCode,
                    'cavv'                       => $authInfo['cavv'] ?? $authInfo['token'] ?? $authInfo['ucafAuthenticationData'] ?? null,
                    'xid'                        => $authInfo['xid'] ?? null,
                    'veresEnrolled'              => $authInfo['veresEnrolled'] ?? 'Y',
                    'threeDSServerTransactionId' => $authInfo['threeDSServerTransactionId'] ?? null,
                    'specificationVersion'       => $authInfo['specificationVersion'] ?? '2.2.0',
                ];
            } elseif ($status === 'PENDING_AUTHENTICATION') {
                return [
                    'success'                     => true,
                    'isChallengeRequired'         => true,
                    'status'                      => 'PENDING_AUTHENTICATION',
                    'stepUpJwt'                   => $authInfo['accessToken'] ?? null,
                    'acsUrl'                      => $authInfo['acsUrl'] ?? null,
                    'stepUpUrl'                   => 'https://centinelapistag.cardinalcommerce.com/V2/Cruise/StepUp',
                    'authenticationTransactionId' => $authInfo['authenticationTransactionId'] ?? null,
                ];
            }

            return [
                'success'             => false,
                'isChallengeRequired' => false,
                'status'              => $status,
                'message'             => 'La tarjeta no pudo ser autenticada por el banco emisor.',
                'raw'                 => $response,
            ];
        } catch (Exception $e) {
            Log::warning("Cybersource checkEnrollment error: " . $e->getMessage());

            if ($tenant->is_sandbox) {
                return [
                    'success'                    => true,
                    'isChallengeRequired'        => false,
                    'status'                     => 'AUTHENTICATION_SUCCESSFUL',
                    'eci'                        => str_starts_with($data['card_number'] ?? '', '5') ? '02' : '05',
                    'cavv'                       => 'AAABBBCCC111222333==',
                    'threeDSServerTransactionId' => '3ds_tx_' . Str::random(16),
                    'specificationVersion'       => '2.2.0',
                ];
            }

            throw $e;
        }
    }

    /**
     * Paso 5: Validation Service (/risk/v1/authentication-results)
     * Valida el resultado del desafío completado por el cliente en el modal Step-Up.
     */
    public static function validateChallenge(Foundation $tenant, array $data): array
    {
        $path = '/risk/v1/authentication-results';
        $payload = [
            'clientReferenceInformation' => [
                'code' => $data['merchant_reference_number'] ?? ('ATC-REF-' . strtoupper(Str::random(10))),
            ],
            'consumerAuthenticationInformation' => [
                'authenticationTransactionId' => $data['authentication_transaction_id'] ?? $data['authenticationTransactionId'],
            ],
        ];

        try {
            $response = AtcSignatureService::request($tenant, 'POST', $path, $payload);
            $authInfo = $response['consumerAuthenticationInformation'] ?? [];
            $status = $authInfo['status'] ?? ($response['status'] ?? 'FAILED');
            $eci = $authInfo['eci'] ?? ($authInfo['eciRaw'] ?? ($authInfo['ecommerceIndicator'] ?? '05'));

            return [
                'success'                    => ($status === 'AUTHENTICATION_SUCCESSFUL'),
                'status'                     => $status,
                'eci'                        => $eci,
                'cavv'                       => $authInfo['cavv'] ?? $authInfo['token'] ?? $authInfo['ucafAuthenticationData'] ?? null,
                'xid'                        => $authInfo['xid'] ?? null,
                'threeDSServerTransactionId' => $authInfo['threeDSServerTransactionId'] ?? null,
                'specificationVersion'       => $authInfo['specificationVersion'] ?? '2.2.0',
                'raw'                        => $response,
            ];
        } catch (Exception $e) {
            if ($tenant->is_sandbox) {
                return [
                    'success' => true,
                    'status'  => 'AUTHENTICATION_SUCCESSFUL',
                    'eci'     => '05',
                    'cavv'    => 'AAABBBCCC111222333==',
                ];
            }
            throw $e;
        }
    }

    /**
     * Construye la estructura billTo dinámica para cumplir con AVS de Cybersource.
     */
    public static function buildBillToPayload(array $data): array
    {
        $country = !empty($data['country']) ? strtoupper($data['country']) : 'BO';
        $state = !empty($data['state']) ? strtoupper($data['state']) : ($country === 'BO' ? 'L' : ($country === 'US' ? 'FL' : 'NA'));
        if ($country === 'US' && strlen($state) > 2) {
            $state = substr($state, 0, 2);
        }
        $locality = !empty($data['locality']) ? $data['locality'] : ($country === 'BO' ? 'La Paz' : 'Miami');
        $address1 = !empty($data['address1']) ? $data['address1'] : 'Av. Principal 123';
        $postalCode = !empty($data['postal_code']) ? $data['postal_code'] : ($country === 'BO' ? '0000' : ($country === 'US' ? '33101' : '00000'));

        $fullName = $data['donor_name'] ?? ($data['first_name'] ?? 'Donante Anónimo');
        $nameParts = explode(' ', trim($fullName));
        $firstName = $data['first_name'] ?? ($nameParts[0] ?? 'Donante');
        $lastName = $data['last_name'] ?? (isset($nameParts[1]) ? implode(' ', array_slice($nameParts, 1)) : 'Solidario');

        return [
            'firstName'          => $firstName,
            'lastName'           => $lastName,
            'email'              => !empty($data['donor_email']) ? $data['donor_email'] : (!empty($data['email']) ? $data['email'] : 'donante@donatio.lat'),
            'address1'           => $address1,
            'locality'           => $locality,
            'administrativeArea' => $state,
            'state'              => $state,
            'postalCode'         => $postalCode,
            'country'            => $country,
        ];
    }
}
