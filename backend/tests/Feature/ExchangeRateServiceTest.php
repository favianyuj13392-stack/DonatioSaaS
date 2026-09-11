<?php

namespace Tests\Feature;

use App\Contracts\ExchangeRateProviderInterface;
use App\DTOs\ExchangeRateDto;
use App\Models\ExchangeRate;
use App\Services\ExchangeRate\ExchangeRateService;
use App\Services\ExchangeRate\Providers\BcbDirectScraperProvider;
use App\Services\ExchangeRate\Providers\CucuBcbProvider;
use App\Services\ExchangeRate\Providers\DolarApiBcbProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ExchangeRateServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_bcb_direct_provider_fetches_and_parses_modern_markup_correctly(): void
    {
        $html = <<<'HTML'
        <article class="bcb-kpi2-card is-tc-oficial">
            <div class="bcb-kpi2-hd">
                <time datetime="2026-09-11">VIERNES 11 DE SEPTIEMBRE, 2026</time>
            </div>
            <div class="bcb-kpi2-body">
                <div class="bcb-tco-value">
                    <div class="bcb-tco-amount">
                        <span class="bcb-tco-num">12,04</span>
                    </div>
                </div>
            </div>
        </article>
        HTML;

        Http::fake([
            'https://www.bcb.gob.bo*' => Http::response($html, 200),
        ]);

        $provider = new BcbDirectScraperProvider();
        $dto = $provider->fetchRate();

        $this->assertNotNull($dto);
        $this->assertEquals(12.04, $dto->buyRate);
        $this->assertEquals(12.14, $dto->sellRate);
        $this->assertEquals('2026-09-11', $dto->effectiveDate);
        $this->assertEquals('BCB_DIRECT', $dto->source);
        $this->assertTrue($dto->isValidSanityRange());
    }

    public function test_bcb_direct_provider_falls_back_to_legacy_markup(): void
    {
        $html = <<<'HTML'
        <div class="cotizaciones">
            <p>Tipo de cambio oficial Compra: 6.86</p>
            <p>Tipo de cambio oficial Venta: 6.96</p>
        </div>
        HTML;

        Http::fake([
            'https://www.bcb.gob.bo*' => Http::response($html, 200),
        ]);

        $provider = new BcbDirectScraperProvider();
        $dto = $provider->fetchRate();

        $this->assertNotNull($dto);
        $this->assertEquals(6.86, $dto->buyRate);
        $this->assertEquals(6.96, $dto->sellRate);
        $this->assertEquals('BCB_DIRECT', $dto->source);
        $this->assertTrue($dto->isValidSanityRange());
    }

    public function test_cucu_provider_fetches_and_parses_rate_correctly(): void
    {
        Http::fake([
            'https://apibcb.cucu.bo/api/v1/tc*' => Http::response([
                'tc_oficial' => [
                    'compra' => 11.83,
                    'venta'  => 11.93,
                    'fecha'  => '2026-08-28',
                ],
            ], 200),
        ]);

        $provider = new CucuBcbProvider();
        $dto = $provider->fetchRate();

        $this->assertNotNull($dto);
        $this->assertEquals(11.83, $dto->buyRate);
        $this->assertEquals(11.93, $dto->sellRate);
        $this->assertEquals('2026-08-28', $dto->effectiveDate);
        $this->assertEquals('BCB_CUCU', $dto->source);
        $this->assertTrue($dto->isValidSanityRange());
    }

    public function test_failover_to_dolarapi_when_bcb_direct_and_cucu_fail(): void
    {
        Http::fake([
            'https://www.bcb.gob.bo*' => Http::response(null, 500),
            'https://apibcb.cucu.bo/api/v1/tc*' => Http::response(null, 500),
            'https://bo.dolarapi.com/v1/dolares/oficial*' => Http::response([
                'compra'             => 11.83,
                'venta'              => 11.93,
                'fechaActualizacion' => '2026-08-28T12:00:00.000Z',
            ], 200),
        ]);

        $service = new ExchangeRateService();
        $record = $service->syncRate();

        $this->assertNotNull($record);
        $this->assertEquals(11.83, (float) $record->buy_rate);
        $this->assertEquals(11.93, (float) $record->sell_rate);
        $this->assertEquals('BCB_DOLARAPI', $record->source);
        $this->assertTrue($record->is_fallback);
    }

    public function test_sanity_check_rejects_out_of_bounds_rates(): void
    {
        $mockCorruptProvider = new class implements ExchangeRateProviderInterface {
            public function fetchRate(): ?ExchangeRateDto {
                return new ExchangeRateDto(
                    buyRate: 1.50, // Corrupt / out of bounds (< 6.80)
                    sellRate: 1.60,
                    effectiveDate: '2026-08-28',
                    source: 'CORRUPT_SOURCE'
                );
            }
            public function getProviderName(): string {
                return 'CORRUPT_SOURCE';
            }
        };

        $service = new ExchangeRateService([$mockCorruptProvider]);
        $record = $service->syncRate();

        // No debe guardar la tasa corrupta
        $this->assertNull($record);
        $this->assertDatabaseCount('exchange_rates', 0);
    }

    public function test_database_persistence_and_redis_caching(): void
    {
        $html = <<<'HTML'
        <article class="bcb-kpi2-card is-tc-oficial">
            <div class="bcb-kpi2-hd">
                <time datetime="2026-09-11">VIERNES 11 DE SEPTIEMBRE, 2026</time>
            </div>
            <div class="bcb-kpi2-body">
                <div class="bcb-tco-value">
                    <div class="bcb-tco-amount">
                        <span class="bcb-tco-num">12,04</span>
                    </div>
                </div>
            </div>
        </article>
        HTML;

        Http::fake([
            'https://www.bcb.gob.bo*' => Http::response($html, 200),
        ]);

        $service = new ExchangeRateService();
        $record = $service->syncRate();

        $this->assertNotNull($record);
        $this->assertDatabaseHas('exchange_rates', [
            'currency_pair'  => 'USD/BOB',
            'effective_date' => '2026-09-11',
            'source'         => 'BCB_DIRECT',
        ]);

        $this->assertEquals(12.14, $service->getCurrentSellRate());
    }

    public function test_usd_to_bob_conversion_for_donations(): void
    {
        ExchangeRate::create([
            'currency_pair'  => 'USD/BOB',
            'buy_rate'       => 11.83,
            'sell_rate'      => 11.93,
            'effective_date' => '2026-08-28',
            'source'         => 'BCB_CUCU',
            'is_fallback'    => false,
        ]);

        $service = new ExchangeRateService();
        $conversion = $service->convertUsdToBob(100.00);

        $this->assertEquals(100.00, $conversion['usd_amount']);
        $this->assertEquals(11.93, $conversion['sell_rate']);
        $this->assertEquals(1193.00, $conversion['bob_amount']); // 100 * 11.93
        $this->assertEquals('2026-08-28', $conversion['effective_date']);
    }

    public function test_manual_override_rate_setting(): void
    {
        $service = new ExchangeRateService();
        $record = $service->setManualRate(12.00, 12.10, '2026-08-29');

        $this->assertEquals(12.00, (float) $record->buy_rate);
        $this->assertEquals(12.10, (float) $record->sell_rate);
        $this->assertEquals('MANUAL_OVERRIDE', $record->source);
        $this->assertEquals(12.10, $service->getCurrentSellRate());
    }
}
