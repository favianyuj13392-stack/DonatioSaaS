<?php

namespace App\Console\Commands;

use App\Services\ExchangeRate\ExchangeRateService;
use Illuminate\Console\Command;

class SyncExchangeRateCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'donatio:sync-exchange-rate 
                            {--force : Forzar sincronización}
                            {--manual-buy= : Establecer tasa de compra manual para emergencias}
                            {--manual-sell= : Establecer tasa de venta manual para emergencias}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza el Tipo de Cambio Oficial BCB (USD/BOB) mediante cascada resiliente de proveedores.';

    /**
     * Execute the console command.
     */
    public function handle(ExchangeRateService $service): int
    {
        $this->info('🔄 Iniciando sincronización del Tipo de Cambio Oficial BCB (USD/BOB)...');

        $manualBuy = $this->option('manual-buy');
        $manualSell = $this->option('manual-sell');

        if ($manualBuy && $manualSell) {
            $record = $service->setManualRate((float) $manualBuy, (float) $manualSell);
            $this->warn("⚠️  Tasa establecida manualmente: Compra: Bs. {$record->buy_rate} | Venta: Bs. {$record->sell_rate} [{$record->source}]");
            return self::SUCCESS;
        }

        $record = $service->syncRate('USD/BOB', (bool) $this->option('force'));

        if (!$record) {
            $this->error('❌ No se pudo sincronizar la tasa oficial y no hay registros previos en base de datos.');
            return self::FAILURE;
        }

        $this->table(
            ['Par', 'Compra BCB', 'Venta BCB', 'Fecha Vigencia', 'Fuente', 'Es Fallback'],
            [[
                $record->currency_pair,
                'Bs. ' . number_format((float) $record->buy_rate, 4),
                'Bs. ' . number_format((float) $record->sell_rate, 4),
                $record->effective_date?->toDateString(),
                $record->source,
                $record->is_fallback ? 'SÍ (Failover)' : 'NO (Primario)',
            ]]
        );

        $this->info('✅ Cotización oficial sincronizada y persistida exitosamente en PostgreSQL.');

        return self::SUCCESS;
    }
}
