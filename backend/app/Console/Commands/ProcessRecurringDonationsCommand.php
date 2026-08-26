<?php

namespace App\Console\Commands;

use App\Models\Donation;
use App\Models\Subscription;
use App\Models\TenantBillingLedger;
use App\Services\ATC\AtcCybersourceAdapter;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessRecurringDonationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'donatio:process-recurring-donations';

    /**
     * The console command description.
     */
    protected $description = 'Procesa los cobros automáticos diarios (MIT 02:00 AM) de socios recurrentes con idempotencia';

    /**
     * Execute the console command.
     */
    public function handle(AtcCybersourceAdapter $gateway): int
    {
        $today = now()->toDateString();
        $this->info("Iniciando procesamiento de cobros recurrentes para la fecha: {$today}");

        // Buscar suscripciones activas que deban cobrarse hoy
        $subscriptions = Subscription::withoutGlobalScopes()
            ->where('status', 'active')
            ->where('next_billing_date', '<=', $today)
            ->with(['foundation', 'donor'])
            ->get();

        $this->info("Total de suscripciones a procesar: {$subscriptions->count()}");

        $processed = 0;
        $failed = 0;

        foreach ($subscriptions as $subscription) {
            $lockKey = "subscription-billing-{$subscription->id}-{$today}";
            $lock = Cache::lock($lockKey, 120);

            if (!$lock->get()) {
                $this->warn("Suscripción #{$subscription->id} ya está siendo procesada por otro worker.");
                continue;
            }

            $idempotencyKey = "SUB-{$subscription->id}-{$today}";

            try {
                $tenant = $subscription->foundation;

                // Establecer contexto de tenant para el cobro
                app()->instance('current_tenant', $tenant);
                if (DB::getDriverName() === 'pgsql') {
                    DB::statement("SET app.current_tenant_id = '{$tenant->id}'");
                }

                $this->line("Procesando suscripción #{$subscription->id} (Tenant: {$tenant->name}, Monto: {$subscription->currency} {$subscription->amount})...");

                // Ejecutar cobro MIT en Cybersource
                $result = $gateway->processRecurringMit($subscription, $idempotencyKey);

                if (($result['status'] ?? '') === 'completed') {
                    DB::transaction(function () use ($subscription, $tenant, $result, $idempotencyKey) {
                        // 1. Calcular liquidación inmutable
                        $settlement = $tenant->calculateSettlement((float) $subscription->amount, 'card');

                        // 2. Crear registro de donación completada
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

                        // 3. Incrementar recaudación si tiene campaña
                        if ($subscription->campaign_id && $subscription->campaign) {
                            $subscription->campaign->increment('current_amount', $subscription->amount);
                        }

                        // 4. Registrar comisión SaaS
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

                        // 4. Actualizar fecha de siguiente cobro y resetear fallos
                        $subscription->update([
                            'next_billing_date'     => now()->parse($subscription->next_billing_date)->addMonth(),
                            'last_billed_at'        => now(),
                            'failed_attempts_count' => 0,
                        ]);
                    });

                    $this->info("✓ Cobro exitoso para suscripción #{$subscription->id}");
                    $processed++;
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

                // Si alcanzó 3 fallos, generar token de reactivación
                if ($failedAttempts >= 3) {
                    $token = $subscription->getOrGenerateReactivationToken();
                    Log::warning("Suscripción #{$subscription->id} marcada como fallida. Token de reactivación generado: {$token}");
                }

                $this->error("✗ Error procesando suscripción #{$subscription->id}: {$e->getMessage()}");
                $failed++;
            } finally {
                $lock->release();
            }
        }

        $this->info("Resumen de ejecución: {$processed} procesados exitosamente, {$failed} fallidos.");

        return Command::SUCCESS;
    }
}
