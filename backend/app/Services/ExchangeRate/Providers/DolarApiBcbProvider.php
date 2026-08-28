<?php

namespace App\Services\ExchangeRate\Providers;

use App\Contracts\ExchangeRateProviderInterface;
use App\DTOs\ExchangeRateDto;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DolarApiBcbProvider implements ExchangeRateProviderInterface
{
    protected string $endpoint;

    public function __construct(?string $endpoint = null)
    {
        $this->endpoint = $endpoint ?? config('services.dolarapi.endpoint', 'https://bo.dolarapi.com/v1/dolares/oficial');
    }

    public function getProviderName(): string
    {
        return 'BCB_DOLARAPI';
    }

    public function fetchRate(): ?ExchangeRateDto
    {
        try {
            $response = Http::timeout(5)
                ->retry(2, 200, throw: false)
                ->acceptJson()
                ->get($this->endpoint);

            if (!$response->successful()) {
                Log::warning('DolarApiBcbProvider returned non-200 status', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return null;
            }

            $data = $response->json();

            if (!isset($data['compra'], $data['venta'])) {
                Log::warning('DolarApiBcbProvider payload missing compra/venta keys', ['data' => $data]);
                return null;
            }

            $buyRate = (float) $data['compra'];
            $sellRate = (float) $data['venta'];
            
            // Si venta viene igual a compra (común en APIs sin spread), aplicar el spread oficial de Bs 0.10 del BCB
            if ($sellRate === $buyRate) {
                $sellRate = round($buyRate + 0.10, 4);
            }

            $rawDate = $data['fechaActualizacion'] ?? null;
            $effectiveDate = $rawDate ? substr($rawDate, 0, 10) : now()->toDateString();

            return new ExchangeRateDto(
                buyRate: $buyRate,
                sellRate: $sellRate,
                effectiveDate: $effectiveDate,
                source: $this->getProviderName(),
                rawPayload: $data,
                currencyPair: 'USD/BOB',
            );
        } catch (\Throwable $e) {
            Log::error('DolarApiBcbProvider exception during rate fetch', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
