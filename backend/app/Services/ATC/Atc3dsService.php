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
     * Inicia la sesión 3DS2 con Cybersource para obtener el JWT token real de Cardinal Cruise.
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

        $response = AtcSignatureService::request($tenant, 'POST', $path, $payload);
        $authInfo = $response['consumerAuthenticationInformation'] ?? [];

        return [
            'accessToken'             => $authInfo['accessToken'] ?? ($response['accessToken'] ?? null),
            'referenceId'             => $authInfo['referenceId'] ?? ($response['referenceId'] ?? null),
            'deviceDataCollectionUrl' => $authInfo['deviceDataCollectionUrl'] ?? ($response['deviceDataCollectionUrl'] ?? 'https://centinelapistag.cardinalcommerce.com/V1/Cruise/Collect'),
            'merchantReferenceNumber' => $referenceCode,
        ];
    }

    /**
     * Paso 3: Check Enrollment Service (/risk/v1/authentications)
     * Evalúa si la tarjeta requiere Challenge (Step-Up) o aprueba vía Frictionless en Cybersource.
     */
    public static function checkEnrollment(Foundation $tenant, array $data): array
    {
        $path = '/risk/v1/authentications';
        
        $rawSessionId = !empty($data['fingerprint_session_id']) 
            ? $data['fingerprint_session_id'] 
            : (!empty($data['fingerprintSessionId']) ? $data['fingerprintSessionId'] : Str::uuid()->toString());

        // Sanitización obligatoria del fingerprintSessionId para ThreatMetrix
        $merchantId = (string) ($tenant->atc_merchant_id ?: config('services.atc.merchant_id', 'redenlace_000021'));
        if (!empty($merchantId) && str_starts_with($rawSessionId, $merchantId)) {
            $rawSessionId = substr($rawSessionId, strlen($merchantId));
        }
        $rawSessionId = ltrim($rawSessionId, '_');

        $referenceNo = $data['merchant_reference_number'] ?? ($data['merchantReferenceNumber'] ?? ('ATC-REF-' . strtoupper(Str::random(10))));

        $payload = [
            'clientReferenceInformation' => [
                'code' => $referenceNo,
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
                'referenceId' => $data['reference_id'] ?? ($data['referenceId'] ?? null),
                'returnUrl'   => $data['return_url'] ?? ($data['returnUrl'] ?? (config('app.url') . '/api/v1/donations/stepup-return')),
            ],
        ];

        $maskedPayload = $payload;
        if (isset($maskedPayload['paymentInformation']['card']['number'])) {
            $cNum = (string) $maskedPayload['paymentInformation']['card']['number'];
            $maskedPayload['paymentInformation']['card']['number'] = substr($cNum, 0, 6) . '******' . substr($cNum, -4);
        }
        if (isset($maskedPayload['paymentInformation']['card']['securityCode'])) {
            $maskedPayload['paymentInformation']['card']['securityCode'] = '***';
        }
        Log::info('[ATC CheckEnrollment Payload]: ' . json_encode($maskedPayload));

        $response = AtcSignatureService::request($tenant, 'POST', $path, $payload);
        Log::info('[ATC CheckEnrollment Raw Response]: ' . json_encode($response));

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
                'cavv'                       => $authInfo['cavv'] ?? ($authInfo['token'] ?? ($authInfo['ucafAuthenticationData'] ?? null)),
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
                'stepUpUrl'                   => $authInfo['stepUpUrl'] ?? 'https://centinelapistag.cardinalcommerce.com/V2/Cruise/StepUp',
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
    }

    /**
     * Paso 5: Validation Service (/risk/v1/authentication-results)
     * Valida el resultado del desafío completado por el cliente en el modal Step-Up con Cybersource.
     */
    public static function validateChallenge(Foundation $tenant, array $data): array
    {
        $path = '/risk/v1/authentication-results';
        $payload = [
            'clientReferenceInformation' => [
                'code' => $data['merchant_reference_number'] ?? ($data['merchantReferenceNumber'] ?? ('ATC-REF-' . strtoupper(Str::random(10)))),
            ],
            'consumerAuthenticationInformation' => [
                'authenticationTransactionId' => $data['authentication_transaction_id'] ?? ($data['authenticationTransactionId'] ?? null),
            ],
        ];

        $response = AtcSignatureService::request($tenant, 'POST', $path, $payload);
        $authInfo = $response['consumerAuthenticationInformation'] ?? [];
        $status = $authInfo['status'] ?? ($response['status'] ?? 'FAILED');
        $eci = $authInfo['eci'] ?? ($authInfo['eciRaw'] ?? ($authInfo['ecommerceIndicator'] ?? '05'));

        return [
            'success'                    => ($status === 'AUTHENTICATION_SUCCESSFUL'),
            'status'                     => $status,
            'eci'                        => is_numeric($eci) ? str_pad((string)$eci, 2, '0', STR_PAD_LEFT) : $eci,
            'cavv'                       => $authInfo['cavv'] ?? ($authInfo['token'] ?? ($authInfo['ucafAuthenticationData'] ?? null)),
            'xid'                        => $authInfo['xid'] ?? null,
            'threeDSServerTransactionId' => $authInfo['threeDSServerTransactionId'] ?? null,
            'specificationVersion'       => $authInfo['specificationVersion'] ?? '2.2.0',
            'raw'                        => $response,
        ];
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

        $fullName = $data['donor_name'] ?? ($data['cardholderName'] ?? ($data['first_name'] ?? 'Donante'));
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
