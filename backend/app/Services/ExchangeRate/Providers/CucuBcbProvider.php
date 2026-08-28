<?php

namespace App\Services\ExchangeRate\Providers;

use App\Contracts\ExchangeRateProviderInterface;
use App\DTOs\ExchangeRateDto;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CucuBcbProvider implements ExchangeRateProviderInterface
{
    protected string $endpoint;

    public function __construct(?string $endpoint = null)
    {
        $this->endpoint = $endpoint ?? config('services.cucu.endpoint', 'https://apibcb.cucu.bo/api/v1/tc/usd');
    }

    public function getProviderName(): string
    {
        return 'BCB_CUCU';
    }

    public function fetchRate(): ?ExchangeRateDto
    {
        try {
            $response = Http::timeout(5)
                ->retry(2, 200, throw: false)
                ->acceptJson()
                ->get($this->endpoint);

            if (!$response->successful()) {
                Log::warning('CucuBcbProvider returned non-200 status', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return null;
            }

            $data = $response->json();
            $tcOficial = $data['tc_oficial'] ?? null;

            if (!$tcOficial || !isset($tcOficial['compra'], $tcOficial['venta'])) {
                Log::warning('CucuBcbProvider payload missing tc_oficial structure', ['data' => $data]);
                return null;
            }

            $buyRate = (float) $tcOficial['compra'];
            $sellRate = (float) $tcOficial['venta'];
            $effectiveDate = (string) ($tcOficial['fecha'] ?? now()->toDateString());

            return new ExchangeRateDto(
                buyRate: $buyRate,
                sellRate: $sellRate,
                effectiveDate: $effectiveDate,
                source: $this->getProviderName(),
                rawPayload: $data,
                currencyPair: 'USD/BOB',
            );
        } catch (\Throwable $e) {
            Log::error('CucuBcbProvider exception during rate fetch', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
