<?php

namespace App\Console\Commands;

use App\Services\ExchangeRate\ExchangeRateService;
use App\Services\ExchangeRate\Providers\BcbDirectScraperProvider;
use App\Services\ExchangeRate\Providers\CucuBcbProvider;
use App\Services\ExchangeRate\Providers\DolarApiBcbProvider;
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
                            {--test-all : Probar y mostrar el estado de las 3 fuentes simultáneamente}
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
        $this->info('🔄 Iniciando motor de Tipo de Cambio Oficial BCB (USD/BOB)...');

        if ($this->option('test-all')) {
            $this->warn('🔍 Diagnosticando las 3 fuentes oficiales en vivo:');
            
            $providers = [
                'Primario (CUCU API)'        => new CucuBcbProvider(),
                'Secundario (DolarApi)'      => new DolarApiBcbProvider(),
                'Terciario (BCB Scraper)'    => new BcbDirectScraperProvider(),
            ];

            $rows = [];
            foreach ($providers as $label => $provider) {
                $start = microtime(true);
                $dto = $provider->fetchRate();
                $elapsed = round((microtime(true) - $start) * 1000, 1);

                if ($dto) {
                    $rows[] = [
                        $label,
                        $dto->source,
                        '🟢 DISPONIBLE',
                        'Bs. ' . number_format($dto->buyRate, 4),
                        'Bs. ' . number_format($dto->sellRate, 4),
                        "{$elapsed} ms",
                    ];
                } else {
                    $rows[] = [
                        $label,
                        $provider->getProviderName(),
                        '🔴 FALLÓ / TIMEOUT',
                        'N/A',
                        'N/A',
                        "{$elapsed} ms",
                    ];
                }
            }

            $this->table(['Nivel de Respaldo', 'Identificador', 'Estado', 'Compra', 'Venta', 'Latencia'], $rows);
            return self::SUCCESS;
        }

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
