<?php

namespace Tests\Feature;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Donor;
use App\Models\Foundation;
use App\Models\Subscription;
use App\Services\ATC\AtcCybersourceAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Mockery;
use Tests\TestCase;

class RecurringDonationIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Prueba que el scheduler ejecute cobros con clave de idempotencia determinista y actualice la fecha.
     */
    public function test_recurring_donations_scheduler_runs_with_idempotency(): void
    {
        $tenant = Foundation::create([
            'name'            => 'Fundación Esperanza',
            'subdomain'       => 'esperanza',
            'code'            => 'FNE',
            'contact_email'   => 'test@esperanza.org',
            'atc_merchant_id' => 'redenlace_000021',
            'atc_api_key_id'  => 'key_123',
            'atc_secret_key'  => 'secret_123',
            'status'          => 'active',
        ]);

        app()->instance('current_tenant', $tenant);

        $donor = Donor::create([
            'name'  => 'Carlos Donante',
            'email' => 'carlos@example.com',
        ]);

        $subscription = Subscription::create([
            'donor_id'                  => $donor->id,
            'amount'                    => 100.00,
            'currency'                  => 'BOB',
            'tms_payment_instrument_id' => 'tms_token_instrument_999',
            'card_last_four'            => '4242',
            'card_brand'                => 'VISA',
            'billing_day_of_month'      => (int) now()->format('d'),
            'next_billing_date'         => now()->toDateString(),
            'status'                    => 'active',
        ]);

        $today = now()->toDateString();
        $expectedIdempotencyKey = "SUB-{$subscription->id}-{$today}";

        // Mock del adaptador de pagos de Cybersource
        $mockAdapter = Mockery::mock(AtcCybersourceAdapter::class);
        $mockAdapter->shouldReceive('processRecurringMit')
            ->once()
            ->with(
                Mockery::on(fn ($sub) => $sub->id === $subscription->id),
                $expectedIdempotencyKey
            )
            ->andReturn([
                'status'                 => 'completed',
                'gateway_transaction_id' => 'tx_mock_12345678',
                'cybersource_request_id' => 'rid_22_digits_mock_12345',
            ]);

        $this->app->instance(AtcCybersourceAdapter::class, $mockAdapter);

        // Ejecutar el comando del scheduler
        $exitCode = Artisan::call('donatio:process-recurring-donations');

        $this->assertEquals(0, $exitCode);

        // Verificar que se creó la donación completada
        $this->assertDatabaseHas('donations', [
            'subscription_id'           => $subscription->id,
            'merchant_reference_number' => $expectedIdempotencyKey,
            'status'                    => 'completed',
            'amount'                    => 100.00,
        ]);

        // Verificar que la fecha de siguiente cobro avanzó 1 mes
        $subscription->refresh();
        $this->assertEquals(now()->addMonth()->toDateString(), $subscription->next_billing_date);
        $this->assertEquals(0, $subscription->failed_attempts_count);
    }
}
