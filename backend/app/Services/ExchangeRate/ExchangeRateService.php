<?php

namespace App\Services\ExchangeRate;

use App\Contracts\ExchangeRateProviderInterface;
use App\DTOs\ExchangeRateDto;
use App\Models\ExchangeRate;
use App\Services\ExchangeRate\Providers\BcbDirectScraperProvider;
use App\Services\ExchangeRate\Providers\CucuBcbProvider;
use App\Services\ExchangeRate\Providers\DolarApiBcbProvider;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ExchangeRateService
{
    /** @var ExchangeRateProviderInterface[] */
    protected array $providers;

    protected float $minSanityRate = 6.80;
    protected float $maxSanityRate = 25.00;
    protected string $cacheKey = 'exchange_rate:USD_BOB';
    protected int $cacheTtlSeconds = 86400; // 24 hours

    public function __construct(array $providers = [])
    {
        $this->providers = !empty($providers) ? $providers : [
            new CucuBcbProvider(),
            new DolarApiBcbProvider(),
            new BcbDirectScraperProvider(),
        ];
    }

    /**
     * Sincroniza la tasa oficial ejecutando la cascada de proveedores con control de sanidad.
     */
    public function syncRate(string $pair = 'USD/BOB', bool $force = false): ?ExchangeRate
    {
        $dto = null;
        $isFallback = false;

        foreach ($this->providers as $index => $provider) {
            $candidateDto = $provider->fetchRate();

            if ($candidateDto !== null) {
                if ($candidateDto->isValidSanityRange($this->minSanityRate, $this->maxSanityRate)) {
                    $dto = $candidateDto;
                    $isFallback = ($index > 0);
                    break;
                }

                Log::critical('ExchangeRateService: Provider returned rate outside sanity bounds', [
                    'provider' => $provider->getProviderName(),
                    'buy'      => $candidateDto->buyRate,
                    'sell'     => $candidateDto->sellRate,
                ]);
            }
        }

        if ($dto === null) {
            Log::error('ExchangeRateService: All exchange rate providers failed or returned invalid data.');
            return $this->getLatestConfirmedRate($pair);
        }

        // Persistir en base de datos PostgreSQL de forma inmutable / idempotente
        $record = ExchangeRate::updateOrCreate(
            [
                'currency_pair'  => $pair,
                'effective_date' => $dto->effectiveDate,
            ],
            [
                'buy_rate'    => $dto->buyRate,
                'sell_rate'   => $dto->sellRate,
                'source'      => $dto->source,
                'is_fallback' => $isFallback,
                'raw_payload' => $dto->rawPayload,
            ]
        );

        // Actualizar caché de alto rendimiento
        $this->cacheRate($record);

        return $record;
    }

    /**
     * Obtiene el tipo de cambio oficial de venta vigente para conversiones USD -> BOB.
     */
    public function getCurrentSellRate(string $pair = 'USD/BOB'): float
    {
        $cached = Cache::get($this->cacheKey);
        if ($cached && isset($cached['sell_rate'])) {
            return (float) $cached['sell_rate'];
        }

        $latest = $this->getLatestConfirmedRate($pair);
        if ($latest) {
            $this->cacheRate($latest);
            return (float) $latest->sell_rate;
        }

        // Valor de respaldo histórico seguro si la base de datos estuviese vacía
        return 11.93;
    }

    /**
     * Convierte un monto en USD a BOB usando la tasa oficial de venta vigente.
     */
    public function convertUsdToBob(float $usdAmount, string $pair = 'USD/BOB'): array
    {
        $latest = $this->getLatestConfirmedRate($pair);
        $sellRate = $latest ? (float) $latest->sell_rate : $this->getCurrentSellRate($pair);
        $bobAmount = round($usdAmount * $sellRate, 2);

        return [
            'usd_amount'             => $usdAmount,
            'sell_rate'              => $sellRate,
            'bob_amount'             => $bobAmount,
            'effective_date'         => $latest?->effective_date?->toDateString() ?? now()->toDateString(),
            'source'                 => $latest?->source ?? 'SYSTEM_FALLBACK',
            'is_fallback'            => $latest?->is_fallback ?? false,
        ];
    }

    /**
     * Registra manualmente una tasa de cambio (Manual Override para emergencias o feriados).
     */
    public function setManualRate(float $buyRate, float $sellRate, ?string $effectiveDate = null, string $pair = 'USD/BOB'): ExchangeRate
    {
        $date = $effectiveDate ?? now()->toDateString();

        $record = ExchangeRate::updateOrCreate(
            [
                'currency_pair'  => $pair,
                'effective_date' => $date,
            ],
            [
                'buy_rate'    => $buyRate,
                'sell_rate'   => $sellRate,
                'source'      => 'MANUAL_OVERRIDE',
                'is_fallback' => false,
                'raw_payload' => ['authorized_by' => 'SUPER_ADMIN_MANUAL'],
            ]
        );

        $this->cacheRate($record);

        return $record;
    }

    /**
     * Obtiene el último registro confirmado desde PostgreSQL.
     */
    public function getLatestConfirmedRate(string $pair = 'USD/BOB'): ?ExchangeRate
    {
        return ExchangeRate::latestForPair($pair)->first();
    }

    protected function cacheRate(ExchangeRate $rate): void
    {
        Cache::put($this->cacheKey, [
            'buy_rate'       => (float) $rate->buy_rate,
            'sell_rate'      => (float) $rate->sell_rate,
            'effective_date' => $rate->effective_date?->toDateString(),
            'source'         => $rate->source,
        ], $this->cacheTtlSeconds);
    }
}
