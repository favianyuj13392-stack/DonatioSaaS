<?php

namespace Tests\Feature;

use App\Jobs\ProcessSubscriptionBillingJob;
use App\Models\Donation;
use App\Models\Donor;
use App\Models\Foundation;
use App\Models\Subscription;
use App\Models\TenantBillingLedger;
use App\Services\ATC\AtcCybersourceAdapter;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class RecurringBillingResilienceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test 1: Simula un 504 Gateway Timeout y valida incremento de fallos sin registros huérfanos.
     */
    public function test_recurring_billing_job_handles_504_gateway_timeout_and_increments_failure(): void
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
            'failed_attempts_count'     => 0,
        ]);

        $today = now()->toDateString();
        $idempotencyKey = "SUB-{$subscription->id}-{$today}";

        // Mock que simula 504 Gateway Timeout de Cybersource
        $mockAdapter = Mockery::mock(AtcCybersourceAdapter::class);
        $mockAdapter->shouldReceive('processRecurringMit')
            ->once()
            ->with(
                Mockery::on(fn ($sub) => $sub->id === $subscription->id),
                $idempotencyKey
            )
            ->andThrow(new Exception("Error Cybersource (504): Gateway Timeout", 504));

        $job = new ProcessSubscriptionBillingJob($subscription->id, $today);
        $job->handle($mockAdapter);

        // 1. Validar que la suscripción incrementó a 1 fallo y sigue activa para reintento futuro
        $subscription->refresh();
        $this->assertEquals(1, $subscription->failed_attempts_count);
        $this->assertEquals('active', $subscription->status);

        // 2. Validar que NO existen registros huérfanos de donación ni comisiones en base de datos
        $this->assertDatabaseMissing('donations', [
            'merchant_reference_number' => $idempotencyKey,
        ]);

        $this->assertEquals(0, TenantBillingLedger::count());
    }

    /**
     * Test 2: Valida que al 3er fallo consecutivo se marca como 'failed' y genera token de reactivación.
     */
    public function test_recurring_billing_marks_failed_and_generates_reactivation_token_after_3_attempts(): void
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
            'name'  => 'Ana Donante',
            'email' => 'ana@example.com',
        ]);

        // Suscripción con 2 fallos previos
        $subscription = Subscription::create([
            'donor_id'                  => $donor->id,
            'amount'                    => 200.00,
            'currency'                  => 'BOB',
            'tms_payment_instrument_id' => 'tms_token_expired',
            'card_last_four'            => '5100',
            'card_brand'                => 'MASTERCARD',
            'billing_day_of_month'      => (int) now()->format('d'),
            'next_billing_date'         => now()->toDateString(),
            'status'                    => 'active',
            'failed_attempts_count'     => 2,
        ]);

        $today = now()->toDateString();
        $idempotencyKey = "SUB-{$subscription->id}-{$today}";

        $mockAdapter = Mockery::mock(AtcCybersourceAdapter::class);
        $mockAdapter->shouldReceive('processRecurringMit')
            ->once()
            ->andThrow(new Exception("Error Cybersource (202): Expired Card", 202));

        $job = new ProcessSubscriptionBillingJob($subscription->id, $today);
        $job->handle($mockAdapter);

        $subscription->refresh();

        // Validar transición a 'failed' y token de reactivación generado
        $this->assertEquals(3, $subscription->failed_attempts_count);
        $this->assertEquals('failed', $subscription->status);
        $this->assertNotNull($subscription->reactivation_token);
        $this->assertTrue(now()->lessThan($subscription->reactivation_token_expires_at));
    }

    /**
     * Test 3: Valida que el Pessimistic Locking en QrWebhookController previene comisiones duplicadas.
     */
    public function test_qr_webhook_pessimistic_locking_prevents_duplicate_billing_ledgers(): void
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

        $refNo = 'REF-FNE-999888';

        $donation = Donation::create([
            'foundation_id'             => $tenant->id,
            'merchant_reference_number' => $refNo,
            'amount'                    => 150.00,
            'currency'                  => 'BOB',
            'payment_method'            => 'qr',
            'donation_type'             => 'single',
            'status'                    => 'pending',
        ]);

        $payload = [
            'merchant_reference_number' => $refNo,
            'gateway_transaction_id'    => 'qr_tx_777',
            'status'                    => 'PAID',
        ];

        // 1. Primera llamada al Webhook (Procesamiento Exitoso)
        $response1 = $this->postJson('/api/v1/webhooks/qr-payment', $payload);
        $response1->assertStatus(200);
        $response1->assertJson(['status' => 'success']);

        // 2. Segunda llamada concurrente al Webhook con el mismo payload
        $response2 = $this->postJson('/api/v1/webhooks/qr-payment', $payload);
        $response2->assertStatus(200);
        $response2->assertJson(['status' => 'already_processed']);

        // 3. Validar que la donación está en 'completed'
        $donation->refresh();
        $this->assertEquals('completed', $donation->status);

        // 4. Validar que existe EXACTAMENTE 1 registro de comisión en tenant_billing_ledgers
        $this->assertEquals(1, TenantBillingLedger::where('donation_id', $donation->id)->count());
        $ledger = TenantBillingLedger::where('donation_id', $donation->id)->first();
        $this->assertEquals(3.00, (float) $ledger->saas_fee_amount); // 2% de 150 = 3.00
    }
}
