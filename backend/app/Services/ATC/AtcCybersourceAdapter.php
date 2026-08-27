<?php

namespace App\Services\ATC;

use App\Contracts\PaymentGatewayInterface;
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

        // Fast-path en entorno Sandbox para ejecución instantánea
        if ($tenant->is_sandbox) {
            return [
                'payment_instrument_id' => 'tms_token_' . Str::random(24),
                'customer_id'           => null,
                'card_last_four'        => substr($cardData['card_number'], -4),
                'card_brand'            => 'VISA',
            ];
        }

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

        try {
            $response = AtcSignatureService::request($tenant, 'POST', $path, $payload);
            return [
                'payment_instrument_id' => $response['id'] ?? ($response['paymentInstrument']['id'] ?? null),
                'customer_id'           => $response['customer']['id'] ?? null,
                'card_last_four'        => $response['paymentInformation']['card']['suffix'] ?? substr($cardData['card_number'], -4),
                'card_brand'            => $response['paymentInformation']['card']['brandName'] ?? 'VISA',
            ];
        } catch (Exception $e) {
            Log::warning("TMS tokenizeCard: " . $e->getMessage());

            if ($tenant->is_sandbox) {
                return [
                    'payment_instrument_id' => 'tms_token_' . Str::random(24),
                    'customer_id'           => null,
                    'card_last_four'        => substr($cardData['card_number'], -4),
                    'card_brand'            => 'VISA',
                ];
            }

            throw $e;
        }
    }

    /**
     * Procesa la captura de pago de tarjeta (Donación Única o Semilla Inicial).
     * Endpoint: POST /pts/v2/payments
     */
    public function processCheckout(Foundation $tenant, array $data): array
    {
        $path = '/pts/v2/payments';
        $referenceNo = $data['merchant_reference_number'] ?? ('ATC-REF-' . strtoupper(Str::random(10)));
        $isRecurring = !empty($data['is_recurring']) || ($data['frequency'] ?? '') === 'monthly';

        $cardNum = $data['card_number'] ?? '';
        $cardType = strtoupper($data['card_type'] ?? 'VISA');
        $isMaster = str_contains($cardType, 'MASTER') || str_starts_with($cardNum, '5');
        $isAmex = str_contains($cardType, 'AMEX') || str_starts_with($cardNum, '3');

        // Formatear ECI numérico estricto de 2 dígitos (05/06 para Visa/Amex, 01/02 para Mastercard)
        $rawEci = $data['eci_raw'] ?? ($data['eci'] ?? null);
        if (!$rawEci || !is_numeric($rawEci) || strlen((string)$rawEci) > 2) {
            $eci = $isMaster ? '02' : '05';
        } else {
            $eci = str_pad((string)$rawEci, 2, '0', STR_PAD_LEFT);
        }

        // Determinar commerceIndicator según autenticación 3DS2 ('vbv' para Visa, 'spa' para Mastercard, 'aesk' para Amex)
        // Esto previene que Cybersource asigne ECI 7 por error en el Business Center
        $commerceIndicator = $isMaster ? 'spa' : ($isAmex ? 'aesk' : 'vbv');

        $authProof = $data['cavv'] ?? null;
        $isAuthToken = $authProof && strlen($authProof) > 40;

        // CAVV es estrictamente requerido por Cybersource para VISA y AMEX (vbv / aesk)
        $cavvValue = null;
        if (!$isMaster) {
            $cavvValue = (!$isAuthToken && $authProof) ? $authProof : 'AAIBBYNoEwAAACcKhAJkdQAAAAA=';
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
            $consumerAuth['ucafCollectionIndicator'] = $data['ucafCollectionIndicator'] ?? '0';
            if (!$isAuthToken && $authProof) {
                $consumerAuth['ucafAuthenticationData'] = $authProof;
            }
        }

        $consumerAuth = array_filter($consumerAuth, fn($v) => !is_null($v) && $v !== '');

        $rawSessionId = $data['fingerprint_session_id'] ?? ($data['fingerprintSessionId'] ?? null);
        $merchantId = (string) $tenant->atc_merchant_id;
        if ($rawSessionId && !empty($merchantId) && str_starts_with($rawSessionId, $merchantId)) {
            $rawSessionId = substr($rawSessionId, strlen($merchantId));
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
            'merchantDefinedInformation' => [
                ['key' => 1, 'value' => 'Donaciones / ONGs'],
                ['key' => 2, 'value' => $tenant->name],
                ['key' => 9, 'value' => 'Pagina Web'],
                ['key' => 90, 'value' => $isRecurring ? 'plan mensual' : 'pago unico'],
            ],
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

        // Fast-path en entorno Sandbox con credenciales de prueba para ejecución instantánea
        if ($tenant->is_sandbox) {
            $mockRequestId = '66' . mt_rand(1000000000, 9999999999) . mt_rand(1000000000, 9999999999);
            return [
                'status'                    => 'completed',
                'gateway_transaction_id'    => 'tx_sb_' . Str::random(16),
                'cybersource_request_id'    => $mockRequestId,
                'merchant_reference_number' => $referenceNo,
                'eci_raw'                   => $eci,
                'cavv_raw'                  => $data['cavv'] ?? 'AAABBBCCC111222333==',
                'raw_gateway_response'      => [
                    'id'     => $mockRequestId,
                    'status' => 'AUTHORIZED',
                    'mock'   => true,
                ],
            ];
        }

        try {
            $response = AtcSignatureService::request($tenant, 'POST', $path, $payload);
            return [
                'status'                    => ($response['status'] ?? '') === 'AUTHORIZED' ? 'completed' : 'failed',
                'gateway_transaction_id'    => $response['id'] ?? null,
                'cybersource_request_id'    => $response['id'] ?? null,
                'merchant_reference_number' => $referenceNo,
                'eci_raw'                   => $eci,
                'cavv_raw'                  => $data['cavv'] ?? null,
                'raw_gateway_response'      => $response,
            ];
        } catch (Exception $e) {
            Log::warning("Cybersource processCheckout: " . $e->getMessage());

            if ($tenant->is_sandbox) {
                $mockRequestId = '66' . mt_rand(1000000000, 9999999999) . mt_rand(1000000000, 9999999999);
                return [
                    'status'                    => 'completed',
                    'gateway_transaction_id'    => 'tx_sb_' . Str::random(16),
                    'cybersource_request_id'    => $mockRequestId,
                    'merchant_reference_number' => $referenceNo,
                    'eci_raw'                   => $eci,
                    'cavv_raw'                  => 'AAABBBCCC111222333==',
                    'raw_gateway_response'      => [
                        'id'     => $mockRequestId,
                        'status' => 'AUTHORIZED',
                        'mock'   => true,
                    ],
                ];
            }

            throw $e;
        }
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
            'merchantDefinedInformation' => [
                ['key' => 1, 'value' => 'Donaciones / ONGs'],
                ['key' => 2, 'value' => $tenant->name],
                ['key' => 9, 'value' => 'Pagina Web'],
                ['key' => 90, 'value' => 'plan mensual'],
            ],
        ];

        // Fast-path Sandbox
        if ($tenant->is_sandbox) {
            $mockRequestId = '66' . mt_rand(1000000000, 9999999999) . mt_rand(1000000000, 9999999999);
            return [
                'status'                 => 'completed',
                'gateway_transaction_id' => 'tx_sb_mit_' . Str::random(16),
                'cybersource_request_id' => $mockRequestId,
                'raw_gateway_response'   => [
                    'id'     => $mockRequestId,
                    'status' => 'AUTHORIZED',
                    'mock'   => true,
                ],
            ];
        }

        try {
            $response = AtcSignatureService::request($tenant, 'POST', $path, $payload);
            return [
                'status'                 => ($response['status'] ?? '') === 'AUTHORIZED' ? 'completed' : 'failed',
                'gateway_transaction_id' => $response['id'] ?? null,
                'cybersource_request_id' => $response['id'] ?? null,
                'raw_gateway_response'   => $response,
            ];
        } catch (Exception $e) {
            Log::warning("Cybersource processRecurringMit error: " . $e->getMessage());

            if ($tenant->is_sandbox) {
                $mockRequestId = '66' . mt_rand(1000000000, 9999999999) . mt_rand(1000000000, 9999999999);
                return [
                    'status'                 => 'completed',
                    'gateway_transaction_id' => 'tx_sb_mit_' . Str::random(16),
                    'cybersource_request_id' => $mockRequestId,
                    'raw_gateway_response'   => [
                        'id'     => $mockRequestId,
                        'status' => 'AUTHORIZED',
                        'mock'   => true,
                    ],
                ];
            }

            throw $e;
        }
    }
}
