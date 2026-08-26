<?php

namespace App\Console\Commands;

use App\Models\Donation;
use App\Models\Foundation;
use App\Models\TenantBillingLedger;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateMonthlyBillingProformasCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'donatio:generate-monthly-billing {--period= : Período en formato YYYY-MM (ej. 2026-08)}';

    /**
     * The console command description.
     */
    protected $description = 'Consolida las donaciones del mes y genera el libro mayor de comisiones SaaS multi-moneda para cada fundación';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $period = $this->option('period') ?: now()->subMonth()->format('Y-m');
        $exchangeRate = (float) config('donatio.usd_exchange_rate', 6.96);

        $this->info("Iniciando consolidación de liquidaciones para el período: {$period} (T/C USD: {$exchangeRate} BOB)");

        $foundations = Foundation::all();

        foreach ($foundations as $foundation) {
            $this->line("Procesando {$foundation->name} (ID: {$foundation->id})...");

            // Obtener donaciones completadas del período sin ledger asignado
            $donations = Donation::withoutGlobalScopes()
                ->where('foundation_id', $foundation->id)
                ->where('status', 'completed')
                ->whereRaw("to_char(paid_at, 'YYYY-MM') = ?", [$period])
                ->get();

            $this->line(" - Donaciones encontradas: {$donations->count()}");

            $totalGrossBob = 0.0;
            $totalSaasFeeBob = 0.0;

            foreach ($donations as $donation) {
                $amountInBob = $donation->currency === 'USD' ? ((float) $donation->amount * $exchangeRate) : (float) $donation->amount;
                $saasFeeInBob = $donation->currency === 'USD' ? ((float) $donation->saas_fee_amount * $exchangeRate) : (float) $donation->saas_fee_amount;

                $totalGrossBob += $amountInBob;
                $totalSaasFeeBob += $saasFeeInBob;

                // Asegurar que cada donación tenga su ledger atómico
                TenantBillingLedger::firstOrCreate(
                    [
                        'foundation_id' => $foundation->id,
                        'donation_id'   => $donation->id,
                    ],
                    [
                        'gross_amount'        => $donation->amount,
                        'saas_fee_percentage' => ($donation->payment_method === 'card') ? (float) $foundation->saas_fee_card : (float) $foundation->saas_fee_qr,
                        'saas_fee_amount'     => $donation->saas_fee_amount,
                        'billing_period'      => $period,
                        'status'              => 'pending',
                    ]
                );
            }

            $this->info("✓ Consolidado {$foundation->name}: Recaudado ~Bs. " . number_format($totalGrossBob, 2) . " | Comisión SaaS: Bs. " . number_format($totalSaasFeeBob, 2));
        }

        $this->info("Proceso de consolidación mensual completado exitosamente.");
        return Command::SUCCESS;
    }
}
