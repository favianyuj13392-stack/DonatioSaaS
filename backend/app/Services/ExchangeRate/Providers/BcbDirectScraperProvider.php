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

            $buyRate = null;
            $sellRate = null;
            $effectiveDate = null;

            // 1. Intentar extraer mediante la estructura moderna del portal BCB (.bcb-tco-num y datetime)
            $rateMatch = [];
            $dateMatch = [];

            if (preg_match('/class=["\'](?:[^"\']*\s)?bcb-tco-num(?:\s[^"\']*)?["\']>([0-9]{1,2}[.,][0-9]{2,4})</i', $html, $rateMatch)) {
                $baseRate = (float) str_replace(',', '.', $rateMatch[1]);
                $buyRate = $baseRate;
                // En el régimen flexible oficial del BCB (RD 88/2026), la cotización base es compra y la venta referencial es compra + 0.10
                $sellRate = round($baseRate + 0.10, 4);

                if (preg_match('/<time[^>]*datetime=["\']([0-9]{4}-[0-9]{2}-[0-9]{2})["\']/i', $html, $dateMatch)) {
                    $effectiveDate = $dateMatch[1];
                }
            } else {
                // 2. Fallback a patrones heredados del portal (Compra / Venta explícitos, con o sin etiquetas HTML intermedias)
                $buyMatch = [];
                $sellMatch = [];

                if (preg_match('/(?:compra|compra\s*:)(?:[^0-9]{0,60})([0-9]{1,2}[.,][0-9]{2,4})/i', $html, $buyMatch)) {
                    $buyRate = (float) str_replace(',', '.', $buyMatch[1]);
                }

                if (preg_match('/(?:venta|venta\s*:)(?:[^0-9]{0,60})([0-9]{1,2}[.,][0-9]{2,4})/i', $html, $sellMatch)) {
                    $sellRate = (float) str_replace(',', '.', $sellMatch[1]);
                } elseif ($buyRate !== null) {
                    $sellRate = round($buyRate + 0.10, 4);
                }
            }

            if ($buyRate === null || $sellRate === null) {
                Log::warning('BcbDirectScraperProvider could not parse exchange rate from HTML');
                return null;
            }

            return new ExchangeRateDto(
                buyRate: $buyRate,
                sellRate: $sellRate,
                effectiveDate: $effectiveDate ?? now()->toDateString(),
                source: $this->getProviderName(),
                rawPayload: [
                    'scraped_url'    => $this->url,
                    'buy'            => $buyRate,
                    'sell'           => $sellRate,
                    'effective_date' => $effectiveDate,
                ],
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
