<?php

namespace Tests\Feature;

use App\Contracts\ExchangeRateProviderInterface;
use App\DTOs\ExchangeRateDto;
use App\Models\ExchangeRate;
use App\Services\ExchangeRate\ExchangeRateService;
use App\Services\ExchangeRate\Providers\CucuBcbProvider;
use App\Services\ExchangeRate\Providers\DolarApiBcbProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ExchangeRateServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_cucu_provider_fetches_and_parses_rate_correctly(): void
    {
        Http::fake([
            'https://apibcb.cucu.bo/api/v1/tc' => Http::response([
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

    public function test_failover_to_dolarapi_when_cucu_fails(): void
    {
        Http::fake([
            'https://apibcb.cucu.bo/api/v1/tc' => Http::response(null, 500),
            'https://bo.dolarapi.com/v1/dolares/oficial' => Http::response([
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
        Http::fake([
            'https://apibcb.cucu.bo/api/v1/tc' => Http::response([
                'tc_oficial' => [
                    'compra' => 11.83,
                    'venta'  => 11.93,
                    'fecha'  => '2026-08-28',
                ],
            ], 200),
        ]);

        $service = new ExchangeRateService();
        $record = $service->syncRate();

        $this->assertDatabaseHas('exchange_rates', [
            'currency_pair'  => 'USD/BOB',
            'effective_date' => '2026-08-28',
            'source'         => 'BCB_CUCU',
        ]);

        $this->assertEquals(11.93, $service->getCurrentSellRate());
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
