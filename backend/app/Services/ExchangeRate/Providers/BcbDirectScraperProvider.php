<?php

namespace App\Services\ExchangeRate\Providers;

use App\Contracts\ExchangeRateProviderInterface;
use App\DTOs\ExchangeRateDto;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BcbDirectScraperProvider implements ExchangeRateProviderInterface
{
    protected string $url;

    public function __construct(?string $url = null)
    {
        $this->url = $url ?? config('services.bcb.url', 'https://www.bcb.gob.bo');
    }

    public function getProviderName(): string
    {
        return 'BCB_DIRECT';
    }

    public function fetchRate(): ?ExchangeRateDto
    {
        try {
            $response = Http::timeout(8)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept'     => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                ])
                ->get($this->url);

            if (!$response->successful()) {
                Log::warning('BcbDirectScraperProvider returned non-200 status', [
                    'status' => $response->status(),
                ]);
                return null;
            }

            $html = $response->body();

            // Buscar patrones típicos del tipo de cambio oficial en el portal del BCB (ej: Compra 11.83 / Venta 11.93 o 6.86 / 6.96)
            $buyMatch = [];
            $sellMatch = [];

            if (preg_match('/(?:compra|compra\s*:)\s*<\/?[^>]*>\s*([0-9]{1,2}[.,][0-9]{2,4})/i', $html, $buyMatch)) {
                $buyRate = (float) str_replace(',', '.', $buyMatch[1]);
            } else {
                return null;
            }

            if (preg_match('/(?:venta|venta\s*:)\s*<\/?[^>]*>\s*([0-9]{1,2}[.,][0-9]{2,4})/i', $html, $sellMatch)) {
                $sellRate = (float) str_replace(',', '.', $sellMatch[1]);
            } else {
                $sellRate = round($buyRate + 0.10, 4);
            }

            return new ExchangeRateDto(
                buyRate: $buyRate,
                sellRate: $sellRate,
                effectiveDate: now()->toDateString(),
                source: $this->getProviderName(),
                rawPayload: ['scraped_url' => $this->url, 'buy' => $buyRate, 'sell' => $sellRate],
                currencyPair: 'USD/BOB',
            );
        } catch (\Throwable $e) {
            Log::error('BcbDirectScraperProvider exception during scraping', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
