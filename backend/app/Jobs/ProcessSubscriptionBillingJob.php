<?php

namespace App\Jobs;

use App\Models\Donation;
use App\Models\Subscription;
use App\Models\TenantBillingLedger;
use App\Services\ATC\AtcCybersourceAdapter;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class ProcessSubscriptionBillingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $subscriptionId,
        public string $billingDate
    ) {}

    /**
     * Execute the job with Rate Limiting (10 req/s to ATC) and Dynamic Distributed Locking.
     */
    public function handle(AtcCybersourceAdapter $gateway): void
    {
        // 1. Rate Limiter Redis: Máximo 10 transacciones por segundo hacia Cybersource
        Redis::throttle('atc_cybersource_billing')
            ->allow(10)
            ->every(1)
            ->then(function () use ($gateway) {
                $this->executeBilling($gateway);
            }, function () {
                // Si excede la tasa de 10 req/s, liberar el job para reintento en 2 segundos
                $this->release(2);
            });
    }

    /**
     * Ejecuta el cobro recurrente con candado distribuido e idempotencia.
     */
    protected function executeBilling(AtcCybersourceAdapter $gateway): void
    {
        $subscription = Subscription::withoutGlobalScopes()
            ->with(['foundation', 'donor', 'campaign'])
            ->find($this->subscriptionId);

        if (!$subscription || $subscription->status !== 'active') {
            return;
        }

        // 2. Candado distribuido obtenido DENTRO del Job al momento de ejecución
        $lockKey = "subscription-billing-{$subscription->id}-{$this->billingDate}";
        $lock = Cache::lock($lockKey, 120);

        if (!$lock->get()) {
            Log::warning("Suscripción #{$subscription->id} ya está siendo procesada por otro worker.");
            return;
        }

        $idempotencyKey = "SUB-{$subscription->id}-{$this->billingDate}";

        try {
            $tenant = $subscription->foundation;

            // Contexto RLS del Tenant
            app()->instance('current_tenant', $tenant);
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("SET app.current_tenant_id = '{$tenant->id}'");
            }

            Log::info("Procesando débito recurrente Job para Suscripción #{$subscription->id} (Tenant: {$tenant->name}, Monto: {$subscription->currency} {$subscription->amount})");

            // 3. Ejecutar cobro MIT en Cybersource
            $result = $gateway->processRecurringMit($subscription, $idempotencyKey);

            if (($result['status'] ?? '') === 'completed') {
                DB::transaction(function () use ($subscription, $tenant, $result, $idempotencyKey) {
                    // Liquidación financiera inmutable
                    $settlement = $tenant->calculateSettlement((float) $subscription->amount, 'card');

                    // Crear registro de donación completada
                    $donation = Donation::create([
                        'foundation_id'               => $tenant->id,
                        'donor_id'                    => $subscription->donor_id,
                        'campaign_id'                 => $subscription->campaign_id,
                        'subscription_id'             => $subscription->id,
                        'merchant_reference_number'   => $idempotencyKey,
                        'cybersource_request_id'      => $result['cybersource_request_id'] ?? null,
                        'amount'                      => $subscription->amount,
                        'saas_fee_amount'             => $settlement['saas_fee_amount'],
                        'atc_fee_estimated_amount'    => $settlement['atc_fee_estimated_amount'],
                        'net_estimated_to_foundation' => $settlement['net_estimated_to_foundation'],
                        'currency'                    => $subscription->currency ?? 'BOB',
                        'payment_method'              => 'card',
                        'donation_type'               => 'subscription_recurring',
                        'status'                      => 'completed',
                        'paid_at'                     => now(),
                        'raw_gateway_response'        => $result['raw_gateway_response'] ?? null,
                    ]);

                    // Incrementar recaudación si tiene campaña
                    if ($subscription->campaign_id && $subscription->campaign) {
                        $subscription->campaign->increment('current_amount', $subscription->amount);
                    }

                    // Registrar comisión SaaS
                    $feePercentage = (float) ($tenant->saas_fee_card ?? config('donatio.default_saas_fee_card', 2.00));

                    TenantBillingLedger::create([
                        'foundation_id'       => $tenant->id,
                        'donation_id'         => $donation->id,
                        'gross_amount'        => $subscription->amount,
                        'saas_fee_percentage' => $feePercentage,
                        'saas_fee_amount'     => $settlement['saas_fee_amount'],
                        'billing_period'      => now()->format('Y-m'),
                        'status'              => 'pending',
                    ]);

                    // Actualizar fecha de siguiente cobro y resetear fallos
                    $subscription->update([
                        'next_billing_date'     => now()->parse($subscription->next_billing_date)->addMonth(),
                        'last_billed_at'        => now(),
                        'failed_attempts_count' => 0,
                    ]);
                });

                Log::info("✓ Cobro exitoso para suscripción #{$subscription->id}");
            } else {
                throw new Exception("Cobro rechazado por el banco.");
            }
        } catch (Exception $e) {
            $failedAttempts = $subscription->failed_attempts_count + 1;
            $newStatus = $failedAttempts >= 3 ? 'failed' : 'active';

            $subscription->update([
                'failed_attempts_count' => $failedAttempts,
                'status'                => $newStatus,
            ]);

            // Si alcanzó 3 fallos consecutivos, generar token de reactivación de 72h
            if ($failedAttempts >= 3) {
                $token = $subscription->getOrGenerateReactivationToken();
                Log::warning("Suscripción #{$subscription->id} marcada como fallida. Token de reactivación generado: {$token}");
            }

            Log::error("✗ Error procesando suscripción #{$subscription->id}: {$e->getMessage()}");
        } finally {
            $lock->release();
        }
    }
}
