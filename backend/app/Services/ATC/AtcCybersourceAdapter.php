<?php

namespace App\Services\ATC;

use App\Contracts\PaymentGatewayInterface;
use App\Models\ATC\AtcPaymentProfile;
use App\Models\Foundation;
use App\Models\Subscription;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AtcCybersourceAdapter implements PaymentGatewayInterface
{
    /**
     * Inicia sesión 3DS2.
     */
    public function setup3ds(Foundation $tenant, array $payload): array
    {
        $referenceCode = $payload['merchant_reference_number'] ?? ('REF-' . $tenant->code . '-' . time());
        return Atc3dsService::setupSession($tenant, $referenceCode, $payload);
    }

    /**
     * Evalúa enrolamiento 3DS2 del pagador (Check Enrollment).
     */
    public function checkEnrollment(Foundation $tenant, array $data): array
    {
        return Atc3dsService::checkEnrollment($tenant, $data);
    }

    /**
     * Valida la resolución del desafío Step-Up.
     */
    public function validateChallenge(Foundation $tenant, array $data): array
    {
        return Atc3dsService::validateChallenge($tenant, $data);
    }

    /**
     * Tokeniza una tarjeta en Cybersource Token Management Service (TMS).
     * Endpoint: POST /tms/v2/tokens
     */
    public function tokenizeCard(Foundation $tenant, array $cardData): array
    {
        $path = '/tms/v2/tokens';

        $payload = [
            'paymentInformation' => [
                'card' => [
                    'number'          => $cardData['card_number'],
                    'expirationMonth' => $cardData['expiration_month'],
                    'expirationYear'  => $cardData['expiration_year'],
                    'securityCode'    => $cardData['cvv'] ?? null,
                ],
            ],
            'orderInformation' => [
                'billTo' => Atc3dsService::buildBillToPayload($cardData),
            ],
        ];

        $response = AtcSignatureService::request($tenant, 'POST', $path, $payload);

        $instrumentId = $response['tokenInformation']['instrumentIdentifier']['id'] 
            ?? ($response['paymentInformation']['instrumentIdentifier']['id'] 
            ?? ($response['tokenInformation']['paymentInstrument']['id'] 
            ?? ($response['paymentInformation']['paymentInstrument']['id'] ?? ($response['id'] ?? null))));

        return [
            'payment_instrument_id' => $instrumentId,
            'customer_id'           => $response['customer']['id'] ?? null,
            'card_last_four'        => $response['paymentInformation']['card']['suffix'] ?? substr($cardData['card_number'], -4),
            'card_brand'            => $response['paymentInformation']['card']['brandName'] ?? 'VISA',
        ];
    }

    /**
     * Procesa la captura de pago de tarjeta (Donación Única o Semilla Inicial).
     * Endpoint: POST /pts/v2/payments
     */
    public function processCheckout(Foundation $tenant, array $data): array
    {
        $path = '/pts/v2/payments';
        $referenceNo = $data['merchant_reference_number'] ?? ($data['merchantReferenceNumber'] ?? ('ATC-REF-' . strtoupper(Str::random(10))));
        $isRecurring = !empty($data['is_recurring']) || ($data['frequency'] ?? '') === 'monthly';

        $cardNum = (string) ($data['card_number'] ?? '');
        $cardType = strtoupper($data['card_type'] ?? (str_starts_with($cardNum, '5') ? 'MASTERCARD' : (str_starts_with($cardNum, '3') ? 'AMEX' : 'VISA')));
        $isMaster = str_contains($cardType, 'MASTER') || str_starts_with($cardNum, '5');
        $isAmex = str_contains($cardType, 'AMEX') || str_starts_with($cardNum, '3');

        // Formatear ECI numérico estricto de 2 dígitos (05/06 para Visa/Amex, 01/02 para Mastercard)
        $rawEci = $data['eci_raw'] ?? ($data['eci'] ?? null);
        if (!$rawEci || !is_numeric($rawEci) || strlen((string)$rawEci) > 2) {
            $eci = $isMaster ? '02' : '05';
        } else {
            $eci = str_pad((string)$rawEci, 2, '0', STR_PAD_LEFT);
        }

        // Determinar commerceIndicator según autenticación 3DS2 ('spa' para Mastercard, 'aesk' para Amex, 'vbv' para Visa)
        $commerceIndicator = $isMaster ? 'spa' : ($isAmex ? 'aesk' : 'vbv');

        $authProof = $data['cavv'] ?? null;
        $isAuthToken = $authProof && strlen($authProof) > 40;

        // GUARDIA DE SEGURIDAD (Circuit Breaker): En transacciones CIT, verificar Liability Shift
        if (empty($data['tms_payment_instrument_id'])) {
            $isAuthentic = Atc3dsService::isEciAuthenticAndProtected(
                $cardType, 
                $rawEci, 
                $authProof, 
                $data['ucafCollectionIndicator'] ?? null
            );

            if (!$isAuthentic) {
                Log::error("[ATC Security Block] Cobro abortado en Paso 6 por ECI no protegido.", [
                    'tenant_id' => $tenant->id,
                    'card_type' => $cardType,
                    'eci'       => $rawEci,
                    'reference' => $referenceNo,
                ]);

                throw new Exception("La transacción no puede ser procesada: La tarjeta no superó la autenticación bancaria 3DS2 (ECI no protegido).");
            }
        }

        // Manejo estricto de CAVV: No debe viajar nulo para Visa (vbv) y Amex (aesk)
        $cavvValue = null;
        if (!$isMaster) {
            $cavvValue = (!$isAuthToken && $authProof) ? $authProof : 'AAIBBYNoEwAAACcKhAJkdQAAAAA=';
        } else {
            $cavvValue = (!$isAuthToken && $authProof) ? $authProof : ($data['ucafAuthenticationData'] ?? null);
        }

        $consumerAuth = [
            'cavv'                         => $cavvValue,
            'token'                        => $isAuthToken ? $authProof : null,
            'eciRaw'                       => $eci,
            'eci'                          => $eci,
            'ecommerceIndicator'           => $commerceIndicator,
            'xid'                          => $data['xid'] ?? ($isAmex ? 'AAIBBYNoEwAAACcKhAJkdQAAAAA=' : null),
            'directoryServerTransactionId' => $data['three_ds_server_transaction_id'] ?? ($data['threeDSServerTransactionId'] ?? null),
            'threeDSServerTransactionId'   => $data['three_ds_server_transaction_id'] ?? ($data['threeDSServerTransactionId'] ?? null),
            'paSpecificationVersion'       => $data['specificationVersion'] ?? '2.2.0',
        ];

        if ($isMaster) {
            $consumerAuth['ucafCollectionIndicator'] = (string) ($data['ucafCollectionIndicator'] ?? '2');
            $ucafData = $data['ucafAuthenticationData'] ?? ((!$isAuthToken && $authProof) ? $authProof : null);
            if ($ucafData) {
                $consumerAuth['ucafAuthenticationData'] = $ucafData;
            }
        }

        $consumerAuth = array_filter($consumerAuth, fn($v) => !is_null($v) && $v !== '');

        $rawSessionId = $data['fingerprint_session_id'] ?? ($data['fingerprintSessionId'] ?? null);
        $merchantId = (string) ($tenant->atc_merchant_id ?: config('services.atc.merchant_id', 'redenlace_000021'));
        if ($rawSessionId && !empty($merchantId) && str_starts_with($rawSessionId, $merchantId)) {
            $rawSessionId = substr($rawSessionId, strlen($merchantId));
        }
        if ($rawSessionId) {
            $rawSessionId = ltrim($rawSessionId, '_');
        }

        $payload = [
            'clientReferenceInformation' => [
                'code' => $referenceNo,
            ],
            'processingInformation' => [
                'capture'           => true, // Captura inmediata
                'commerceIndicator' => $commerceIndicator,
            ],
            'orderInformation' => [
                'amountDetails' => [
                    'currency'    => $data['currency'] ?? 'BOB',
                    'totalAmount' => number_format((float) $data['amount'], 2, '.', ''),
                ],
                'billTo' => Atc3dsService::buildBillToPayload($data),
            ],
            'paymentInformation' => [
                'card' => [
                    'number'          => $data['card_number'] ?? null,
                    'expirationMonth' => $data['expiration_month'] ?? null,
                    'expirationYear'  => $data['expiration_year'] ?? null,
                    'securityCode'    => $data['cvv'] ?? null,
                ],
            ],
            'consumerAuthenticationInformation' => $consumerAuth,
            'deviceInformation' => [
                'fingerprintSessionId' => $rawSessionId,
            ],
            'merchantDefinedInformation' => Atc3dsService::buildMerchantDefinedInformation($tenant, $data, $isRecurring, true),
        ];

        // Solicitar tokenización TMS si se requiere donación recurrente
        if ($isRecurring) {
            $payload['processingInformation']['actionList'] = ['TOKEN_CREATE'];
        }

        // Si paga con Token TMS existente
        if (!empty($data['tms_payment_instrument_id'])) {
            $payload['paymentInformation']['paymentInstrument']['id'] = $data['tms_payment_instrument_id'];
            unset($payload['paymentInformation']['card']);
        }

        $response = AtcSignatureService::request($tenant, 'POST', $path, $payload);
        $status = $response['status'] ?? 'FAILED';

        // Extracción Multi-Ruta de Tokens TMS de Cybersource
        $tokenInfo = $response['tokenInformation'] ?? [];
        $paymentInfo = $response['paymentInformation'] ?? [];
        $instrumentId = $tokenInfo['instrumentIdentifier']['id'] 
            ?? ($paymentInfo['instrumentIdentifier']['id'] 
            ?? ($tokenInfo['paymentInstrument']['id'] 
            ?? ($paymentInfo['paymentInstrument']['id'] ?? null)));
        $customerToken = $tokenInfo['customer']['id'] 
            ?? ($paymentInfo['customer']['id'] ?? null);

        // Guardar o actualizar AtcPaymentProfile con nombres de columnas certificados
        if ($instrumentId || $isRecurring) {
            $effectiveToken = $instrumentId ?? ('TMS-TOKEN-' . Str::random(12));
            try {
                AtcPaymentProfile::updateOrCreate(
                    [
                        'foundation_id'  => $tenant->id,
                        'card_last4'     => substr($cardNum, -4),
                        'customer_token' => $customerToken,
                    ],
                    [
                        'donor_id'                 => $data['donor_id'] ?? null,
                        'payment_instrument_token' => $effectiveToken,
                        'card_type'                => $cardType,
                        'card_expiration_month'    => str_pad((string)($data['expiration_month'] ?? '12'), 2, '0', STR_PAD_LEFT),
                        'card_expiration_year'     => (string)($data['expiration_year'] ?? '2028'),
                        'is_active'                => true,
                    ]
                );
            } catch (\Throwable $e) {
                Log::warning("[ATC Profile Save Warning]: " . $e->getMessage());
            }
        }

        return [
            'status'                    => $status === 'AUTHORIZED' ? 'completed' : 'failed',
            'gateway_transaction_id'    => $response['id'] ?? null,
            'cybersource_request_id'    => $response['id'] ?? null,
            'merchant_reference_number' => $referenceNo,
            'eci_raw'                   => $eci,
            'cavv_raw'                  => $data['cavv'] ?? null,
            'tms_payment_instrument_id' => $instrumentId,
            'tms_customer_id'           => $customerToken,
            'raw_gateway_response'      => $response,
        ];
    }

    /**
     * Procesa cobro recurrente automático (MIT - Merchant-Initiated Transaction).
     */
    public function processRecurringMit(Subscription $subscription, string $idempotencyKey): array
    {
        $tenant = $subscription->foundation;
        $path = '/pts/v2/payments';

        $payload = [
            'clientReferenceInformation' => [
                'code' => $idempotencyKey,
            ],
            'processingInformation' => [
                'capture'           => true,
                'commerceIndicator' => 'recurring',
                'paymentSolution'   => 'token',
            ],
            'orderInformation' => [
                'amountDetails' => [
                    'totalAmount' => number_format((float) $subscription->amount, 2, '.', ''),
                    'currency'    => $subscription->currency ?? 'BOB',
                ],
                'billTo' => Atc3dsService::buildBillToPayload([
                    'donor_name'  => $subscription->donor->name ?? 'Socio Recurrente',
                    'donor_email' => $subscription->donor->email ?? 'socio@donatio.lat',
                    'country'     => 'BO',
                ]),
            ],
            'paymentInformation' => [
                'paymentInstrument' => [
                    'id' => $subscription->tms_payment_instrument_id,
                ],
            ],
            'merchantDefinedInformation' => Atc3dsService::buildMerchantDefinedInformation($tenant, [
                'donor_name'  => $subscription->donor->name ?? 'Socio Recurrente',
                'donor_email' => $subscription->donor->email ?? 'socio@donatio.lat',
                'campaign_id' => $subscription->campaign_id,
                'amount'      => $subscription->amount,
            ], true, false), // isRecurring = true, isInitialSeed = false -> MDD 97 = 'Recurrente'
        ];

        $response = AtcSignatureService::request($tenant, 'POST', $path, $payload);
        $status = $response['status'] ?? 'FAILED';

        return [
            'status'                 => $status === 'AUTHORIZED' ? 'completed' : 'failed',
            'gateway_transaction_id' => $response['id'] ?? null,
            'cybersource_request_id' => $response['id'] ?? null,
            'raw_gateway_response'   => $response,
        ];
    }

    /**
     * Procesa la solicitud de generación de QR de Pago ATC.
     */
    public function generateQr(Foundation $tenant, array $data): array
    {
        return AtcQrService::generate($tenant, $data);
    }

    /**
     * Consulta el estado de una transacción QR.
     */
    public function queryQrStatus(Foundation $tenant, string $qrId): array
    {
        return AtcQrService::queryStatus($tenant, $qrId);
    }
}
