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

        $this->info("Iniciando consolidación inmutable de liquidaciones para el período: {$period}");

        $foundations = Foundation::all();

        foreach ($foundations as $foundation) {
            $this->line("Procesando {$foundation->name} (ID: {$foundation->id})...");

            // Consulta SQL limpia y de bajo consumo sobre montos inmutables en BOB
            $stats = Donation::withoutGlobalScopes()
                ->where('foundation_id', $foundation->id)
                ->where('status', 'completed')
                ->whereRaw("to_char(paid_at, 'YYYY-MM') = ?", [$period])
                ->selectRaw('
                    COUNT(*) as total_count,
                    COALESCE(SUM(amount_bob), 0.00) as total_gross_bob,
                    COALESCE(SUM(saas_fee_amount), 0.00) as total_saas_fee_bob
                ')
                ->first();

            $totalGrossBob = (float) $stats->total_gross_bob;
            $totalSaasFeeBob = (float) $stats->total_saas_fee_bob;
            $donationsCount = (int) $stats->total_count;

            $this->line(" - Donaciones encontradas: {$donationsCount}");

            // Asegurar que cada donación tenga su ledger atómico en base a moneda nacional BOB
            $donations = Donation::withoutGlobalScopes()
                ->where('foundation_id', $foundation->id)
                ->where('status', 'completed')
                ->whereRaw("to_char(paid_at, 'YYYY-MM') = ?", [$period])
                ->get();

            foreach ($donations as $donation) {
                TenantBillingLedger::firstOrCreate(
                    [
                        'foundation_id' => $foundation->id,
                        'donation_id'   => $donation->id,
                    ],
                    [
                        'gross_amount'        => (float) ($donation->amount_bob ?? $donation->amount),
                        'saas_fee_percentage' => ($donation->payment_method === 'card') ? (float) $foundation->saas_fee_card : (float) $foundation->saas_fee_qr,
                        'saas_fee_amount'     => (float) $donation->saas_fee_amount,
                        'billing_period'      => $period,
                        'status'              => 'pending',
                    ]
                );
            }

            $this->info("✓ Consolidado {$foundation->name}: Recaudado Bs. " . number_format($totalGrossBob, 2) . " | Comisión SaaS: Bs. " . number_format($totalSaasFeeBob, 2));
        }

        $this->info("Proceso de consolidación mensual completado exitosamente.");
        return Command::SUCCESS;
    }
}
