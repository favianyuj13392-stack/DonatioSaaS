<?php

namespace App\Services\ATC;

use App\Models\Campaign;
use App\Models\Donation;
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

        $cardNumber = $cardData['card_number'] ?? ($cardData['cardNumber'] ?? null);
        $expMonth   = $cardData['expiration_month'] ?? ($cardData['expirationMonth'] ?? null);
        $expYear    = $cardData['expiration_year'] ?? ($cardData['expirationYear'] ?? null);

        if ($cardNumber && $expMonth && $expYear) {
            $payload['paymentInformation'] = [
                'card' => [
                    'number'          => (string) $cardNumber,
                    'expirationMonth' => str_pad((string) $expMonth, 2, '0', STR_PAD_LEFT),
                    'expirationYear'  => (string) $expYear,
                ],
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
        $isRecurring = !empty($data['is_recurring']) || ($data['frequency'] ?? '') === 'monthly';

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
            'merchantDefinedInformation' => self::buildMerchantDefinedInformation($tenant, $data, $isRecurring, true),
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
        $cardNum = (string) ($data['card_number'] ?? '');
        $cardType = $data['card_type'] ?? (str_starts_with($cardNum, '5') ? 'MASTERCARD' : (str_starts_with($cardNum, '3') ? 'AMEX' : 'VISA'));

        $normalizedEci = is_numeric($rawEci) ? str_pad((string)((int)$rawEci), 2, '0', STR_PAD_LEFT) : null;
        $cavv = $authInfo['cavv'] ?? ($authInfo['ucafAuthenticationData'] ?? ($authInfo['token'] ?? null));
        $ucafIndicator = $authInfo['ucafCollectionIndicator'] ?? (str_starts_with($cardNum, '5') ? '2' : null);
        $veresEnrolled = $authInfo['veresEnrolled'] ?? null;

        $isAuthentic = self::isEciAuthenticAndProtected($cardType, $rawEci, $cavv, $ucafIndicator, $veresEnrolled);

        if ($status === 'AUTHENTICATION_SUCCESSFUL') {
            // Si Cybersource dice exitoso pero el ECI es inválido (07, 00, sin cavv/aav) -> BLOQUEAR
            if (!$isAuthentic) {
                Log::warning("[ATC CheckEnrollment ECI Block] Tarjeta sin Liability Shift rechazada:", [
                    'tenant_id'     => $tenant->id,
                    'card_type'     => $cardType,
                    'rawEci'        => $rawEci,
                    'normalizedEci' => $normalizedEci,
                    'reference'     => $referenceNo,
                ]);

                return [
                    'success'                 => false,
                    'isChallengeRequired'     => false,
                    'status'                  => 'AUTHENTICATION_FAILED_ECI',
                    'eci'                     => $normalizedEci ?: '07',
                    'merchantReferenceNumber' => $referenceNo,
                    'message'                 => 'La tarjeta no pudo ser verificada de forma segura por su banco emisor (3DS2 no superado). Por favor intente con otra tarjeta.',
                    'raw'                     => $response,
                ];
            }

            return [
                'success'                    => true,
                'isChallengeRequired'        => false,
                'status'                     => 'AUTHENTICATION_SUCCESSFUL',
                'eci'                        => $normalizedEci ?: (str_starts_with($cardNum, '5') ? '02' : (str_starts_with($cardNum, '3') ? '06' : '05')),
                'cavv'                       => $cavv,
                'ucafAuthenticationData'     => $authInfo['ucafAuthenticationData'] ?? null,
                'ucafCollectionIndicator'    => $ucafIndicator,
                'xid'                        => $authInfo['xid'] ?? null,
                'veresEnrolled'              => $veresEnrolled ?? 'Y',
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
        $referenceNo = $data['merchant_reference_number'] ?? ($data['merchantReferenceNumber'] ?? ('ATC-REF-' . strtoupper(Str::random(10))));

        $payload = [
            'clientReferenceInformation' => [
                'code' => $referenceNo,
            ],
            'consumerAuthenticationInformation' => [
                'authenticationTransactionId' => $data['authentication_transaction_id'] ?? ($data['authenticationTransactionId'] ?? null),
            ],
        ];

        $response = AtcSignatureService::request($tenant, 'POST', $path, $payload);
        $authInfo = $response['consumerAuthenticationInformation'] ?? [];
        $status = $response['status'] ?? ($authInfo['status'] ?? 'FAILED');
        $rawEci = $authInfo['eci'] ?? ($authInfo['eciRaw'] ?? ($authInfo['ecommerceIndicator'] ?? null));
        $normalizedEci = is_numeric($rawEci) ? str_pad((string)((int)$rawEci), 2, '0', STR_PAD_LEFT) : null;
        $cavv = $authInfo['cavv'] ?? ($authInfo['ucafAuthenticationData'] ?? ($authInfo['token'] ?? null));
        $ucafIndicator = $authInfo['ucafCollectionIndicator'] ?? '2';
        $cardNum = (string) ($data['card_number'] ?? '');
        $cardType = $data['card_type'] ?? (str_starts_with($cardNum, '5') ? 'MASTERCARD' : (str_starts_with($cardNum, '3') ? 'AMEX' : 'VISA'));

        $isAuthentic = ($status === 'AUTHENTICATION_SUCCESSFUL') && self::isEciAuthenticAndProtected($cardType, $rawEci, $cavv, $ucafIndicator);

        if (!$isAuthentic) {
            return [
                'success'             => false,
                'isChallengeRequired' => false,
                'status'              => 'AUTHENTICATION_FAILED_ECI',
                'eci'                 => $normalizedEci ?: '07',
                'message'             => 'El desafío de seguridad 3DS2 no fue superado o fue rechazado por el banco emisor.',
                'raw'                 => $response,
            ];
        }

        $isMaster = str_contains(strtoupper($cardType), 'MASTER') || str_starts_with($cardNum, '5') || $normalizedEci === '02' || $normalizedEci === '01';

        return [
            'success'                    => true,
            'isChallengeRequired'        => false,
            'status'                     => $status,
            'eci'                        => $normalizedEci ?: ($isMaster ? '02' : '05'),
            'cavv'                       => $cavv,
            'ucafAuthenticationData'     => $authInfo['ucafAuthenticationData'] ?? null,
            'ucafCollectionIndicator'    => $ucafIndicator,
            'xid'                        => $authInfo['xid'] ?? null,
            'threeDSServerTransactionId' => $authInfo['threeDSServerTransactionId'] ?? null,
            'specificationVersion'       => $authInfo['specificationVersion'] ?? '2.2.0',
            'raw'                        => $response,
        ];
    }

    /**
     * Valida si el ECI y los datos de autenticación 3DS2 cumplen con el estándar estricto de Liability Shift.
     * Retorna false para ECI 07/00/vacío o tarjetas no autenticadas, bloqueando el avance al cobro.
     */
    public static function isEciAuthenticAndProtected(
        string $cardType,
        ?string $rawEci,
        ?string $cavv,
        ?string $ucafIndicator = null,
        ?string $veresEnrolled = null
    ): bool {
        $normalizedEci = null;
        if (!is_null($rawEci) && is_numeric($rawEci)) {
            $normalizedEci = str_pad((string)((int)$rawEci), 2, '0', STR_PAD_LEFT);
        }

        $cardUpper = strtoupper($cardType);
        $isMaster = str_contains($cardUpper, 'MASTER') || str_starts_with($cardUpper, '5') || $normalizedEci === '02' || $normalizedEci === '01' || $ucafIndicator === '2';
        $isAmex = str_contains($cardUpper, 'AMEX') || str_starts_with($cardUpper, '3');

        // Si veresEnrolled es 'N' o 'R' (Rechazado / No enrolado), es inválido
        if (in_array(strtoupper((string)$veresEnrolled), ['N', 'R'])) {
            return false;
        }

        if ($isMaster) {
            // Mastercard: Válido solo si ECI es '02' o '01' con CAVV/UCAF
            if ($normalizedEci === '00' || $normalizedEci === '07') {
                return false;
            }
            if ($normalizedEci === '02' || $normalizedEci === '01') {
                return !empty($cavv);
            }
            if ($ucafIndicator === '2' && !empty($cavv)) {
                return true;
            }
            return false;
        } elseif ($isAmex) {
            // American Express: Válido si ECI es '05' o '06' con CAVV o Token SafeKey > 30 chars
            if ($normalizedEci === '07' || $normalizedEci === '00') {
                return false;
            }
            if (in_array($normalizedEci, ['05', '06']) && !empty($cavv)) {
                return true;
            }
            if (!empty($cavv) && strlen((string)$cavv) > 30) {
                return true;
            }
            return false;
        } else {
            // VISA: Válido solo si ECI es '05' o '06' Y tiene CAVV
            if ($normalizedEci === '07' || $normalizedEci === '00') {
                return false;
            }
            return in_array($normalizedEci, ['05', '06']) && !empty($cavv);
        }
    }

    /**
     * Construye los 14 MDDs oficiales requeridos por ATC Red Enlace para la Vertical J (Servicios ONG - Rubro 8398).
     */
    public static function buildMerchantDefinedInformation(
        Foundation $tenant,
        array $data,
        bool $isRecurring = false,
        bool $isInitialSeed = true
    ): array {
        $user = auth('sanctum')->user() ?? auth()->user();
        $isLoggedIn = !is_null($user);

        // MDD 1: ¿Usuario Logueado? (SI / NO)
        $mdd1 = $isLoggedIn ? 'SI' : 'NO';

        // MDD 2: Fecha creación cuenta (d/m/Y)
        $mdd2 = ($isLoggedIn && $user->created_at) ? $user->created_at->format('d/m/Y') : now()->format('d/m/Y');

        // MDD 4: Fecha última donación (d/m/Y)
        $lastDonationDate = now()->format('d/m/Y');
        try {
            if ($isLoggedIn) {
                $lastTx = Donation::where('foundation_id', $tenant->id)
                    ->where('status', 'completed')
                    ->latest('id')
                    ->first();
                if ($lastTx && $lastTx->created_at) {
                    $lastDonationDate = $lastTx->created_at->format('d/m/Y');
                }
            }
        } catch (\Throwable $e) {
            $lastDonationDate = now()->format('d/m/Y');
        }
        $mdd4 = $lastDonationDate;

        // MDD 5: Antigüedad de la cuenta en días (Entero)
        $mdd5 = ($isLoggedIn && $user->created_at) ? (string) $user->created_at->diffInDays(now()) : '0';

        // MDD 7: Nombre comercial del comercio (Tenant)
        $mdd7 = $tenant->legal_name ?: ($tenant->name ?: 'Donatio');

        // MDD 11: Documento del donante (CI/DNI o 'NA')
        $donorDoc = !empty($data['ci']) ? trim((string)$data['ci']) : (!empty($user->ci) ? trim((string)$user->ci) : 'NA');
        $mdd11 = $donorDoc ?: 'NA';

        // MDD 12: Teléfono alternativo
        $phone = !empty($data['phone']) ? trim((string)$data['phone']) : (!empty($data['donor_phone']) ? trim((string)$data['donor_phone']) : '70000000');
        $mdd12 = $phone ?: '70000000';

        // MDD 15: ID de Usuario
        if ($isLoggedIn) {
            $mdd15 = "USER-{$user->id}";
        } else {
            $email = $data['donor_email'] ?? ($data['email'] ?? '');
            $guestIdentifier = !empty($email) ? substr(md5(strtolower(trim($email))), 0, 8) : strtoupper(Str::random(8));
            $mdd15 = "GUEST-{$guestIdentifier}";
        }

        // MDD 23: Identificador / Tipo de Login
        $mdd23 = $isLoggedIn ? ($user->provider ?? 'Email') : 'Guest';

        // MDD 87: ID del servicio / Campaña
        $campaignId = $data['campaign_id'] ?? null;
        $mdd87 = !empty($campaignId) ? "CAMP-{$campaignId}" : 'CAMP-GRAL';

        // MDD 88: Nombre del servicio / Campaña
        $campaignName = $data['campaign_name'] ?? null;
        if (!$campaignName && !empty($campaignId)) {
            $campaign = Campaign::find($campaignId);
            if ($campaign) {
                $campaignName = $campaign->title ?? $campaign->name;
            }
        }
        $mdd88 = $campaignName ?: 'Donacion General';

        // MDD 90: Tipo de servicio ('Donacion Mensual' o 'Donacion Unica')
        $mdd90 = $isRecurring ? 'Donacion Mensual' : 'Donacion Unica';

        // MDD 95: returnUrl (URL de retorno del comercio)
        $mdd95 = config('app.frontend_url', config('app.url')) . '/donar';

        // MDD 97: Tipo de Transacción para Débito Automático ('Semilla' o 'Recurrente')
        $mdd97 = $isRecurring ? ($isInitialSeed ? 'Semilla' : 'Recurrente') : 'Semilla';

        $rawMdds = [
            1  => self::sanitizeMddValue($mdd1, 5),
            2  => self::sanitizeMddValue($mdd2, 10),
            4  => self::sanitizeMddValue($mdd4, 10),
            5  => self::sanitizeMddValue($mdd5, 10),
            7  => self::sanitizeMddValue($mdd7, 50),
            11 => self::sanitizeMddValue($mdd11, 50),
            12 => self::sanitizeMddValue($mdd12, 50),
            15 => self::sanitizeMddValue($mdd15, 50),
            23 => self::sanitizeMddValue($mdd23, 50),
            87 => self::sanitizeMddValue($mdd87, 50),
            88 => self::sanitizeMddValue($mdd88, 50),
            90 => self::sanitizeMddValue($mdd90, 50),
            95 => self::sanitizeMddValue($mdd95, 100),
            97 => self::sanitizeMddValue($mdd97, 50),
        ];

        // UTM tracking variables as custom MDDs (98 to 101)
        if (!empty($data['utm_source'])) {
            $rawMdds[98] = self::sanitizeMddValue('utm_source:' . $data['utm_source'], 100);
        }
        if (!empty($data['utm_campaign'])) {
            $rawMdds[99] = self::sanitizeMddValue('utm_campaign:' . $data['utm_campaign'], 100);
        }
        if (!empty($data['utm_medium'])) {
            $rawMdds[100] = self::sanitizeMddValue('utm_medium:' . $data['utm_medium'], 100);
        }
        if (!empty($data['utm_content'])) {
            $rawMdds[101] = self::sanitizeMddValue('utm_content:' . $data['utm_content'], 100);
        }

        $formatted = [];
        foreach ($rawMdds as $key => $val) {
            $formatted[] = [
                'key'   => (string) $key,
                'value' => (string) $val,
            ];
        }

        return $formatted;
    }

    /**
     * Sanitiza y trunca el valor de un MDD para cumplir con Cybersource Decision Manager.
     */
    public static function sanitizeMddValue(?string $value, int $maxLength = 50): string
    {
        if (is_null($value) || $value === '') {
            return 'NA';
        }

        $cleaned = trim(preg_replace('/[\r\n\t]+/', ' ', (string) $value));
        return mb_substr($cleaned, 0, $maxLength, 'UTF-8');
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
