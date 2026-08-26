<?php

namespace App\Contracts;

use App\Models\Donation;
use App\Models\Foundation;
use App\Models\Subscription;

interface PaymentGatewayInterface
{
    /**
     * Inicia la sesión de autenticación 3DS2 con Cybersource (Cardinal Cruise).
     *
     * @param Foundation $tenant
     * @param array $payload
     * @return array ['accessToken' => string, 'referenceId' => string, 'deviceDataCollectionUrl' => string]
     */
    public function setup3ds(Foundation $tenant, array $payload): array;

    /**
     * Procesa la captura del pago de tarjeta con autenticación 3DS2 (Donación Única o Inicial).
     *
     * @param Foundation $tenant
     * @param array $data
     * @return array
     */
    public function processCheckout(Foundation $tenant, array $data): array;

    /**
     * Tokeniza la tarjeta en Cybersource Token Management Service (TMS) para socios recurrentes.
     *
     * @param Foundation $tenant
     * @param array $cardData
     * @return array ['payment_instrument_id' => string, 'customer_id' => ?string]
     */
    public function tokenizeCard(Foundation $tenant, array $cardData): array;

    /**
     * Ejecuta el cobro recurrente automático (MIT - Merchant-Initiated Transaction).
     *
     * @param Subscription $subscription
     * @param string $idempotencyKey
     * @return array
     */
    public function processRecurringMit(Subscription $subscription, string $idempotencyKey): array;
}
