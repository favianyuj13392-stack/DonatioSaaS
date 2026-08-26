<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\Donation;
use App\Models\Foundation;
use App\Models\Subscription;
use App\Services\ATC\AtcCybersourceAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class AtcCardTestingMatrixTest extends TestCase
{
    use RefreshDatabase;

    protected Foundation $tenant;
    protected Campaign $campaign;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Foundation::create([
            'name'            => 'Fundación Esperanza',
            'subdomain'       => 'esperanza',
            'code'            => 'FNE',
            'contact_email'   => 'test@esperanza.org',
            'atc_merchant_id' => 'redenlace_000021',
            'atc_api_key_id'  => 'test_key_id',
            'atc_secret_key'  => 'test_secret_key',
            'is_sandbox'      => true,
            'status'          => 'active',
        ]);

        app()->instance('current_tenant', $this->tenant);

        $this->campaign = Campaign::create([
            'title'                  => 'Campaña General 2026',
            'slug'                   => 'general-2026',
            'monetary_goal'          => 50000,
            'allowed_frequencies'    => 'all',
            'allowed_payment_methods'=> 'all',
            'status'                 => 'active',
        ]);
    }

    /**
     * Escenario 1: Tarjeta Visa Frictionless (ECI 05) - Donación Única Aprobada.
     */
    public function test_scenario_1_visa_frictionless_single_donation(): void
    {
        $mockAdapter = Mockery::mock(AtcCybersourceAdapter::class);
        $mockAdapter->shouldReceive('processCheckout')
            ->once()
            ->andReturn([
                'status'                    => 'completed',
                'gateway_transaction_id'    => 'tx_visa_frictionless_01',
                'cybersource_request_id'    => '6618492049281948291024',
                'merchant_reference_number' => 'REF-FNE-TEST-001',
                'eci_raw'                   => '05',
                'cavv_raw'                  => 'AAABBBCCC111222333==',
            ]);

        $this->app->instance(AtcCybersourceAdapter::class, $mockAdapter);

        $response = $this->withHeaders(['X-Tenant-Subdomain' => 'esperanza'])
            ->postJson('/api/v1/donations/checkout', [
                'campaign_id'               => $this->campaign->id,
                'amount'                    => 100.00,
                'frequency'                 => 'single',
                'donor_name'                => 'Pedro Donante',
                'donor_email'               => 'pedro@example.com',
                'is_anonymous'              => false,
                'merchant_reference_number' => 'REF-FNE-TEST-001',
                'card_number'               => '4000123456789010',
                'expiration_month'          => '12',
                'expiration_year'           => '2028',
                'cvv'                       => '123',
                'eci_raw'                   => '05',
            ]);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'success']);

        $this->assertDatabaseHas('donations', [
            'merchant_reference_number' => 'REF-FNE-TEST-001',
            'cybersource_request_id'    => '6618492049281948291024',
            'eci_raw'                   => '05',
            'status'                    => 'completed',
        ]);
    }

    /**
     * Escenario 2: Donación Anónima Real (donor_id = null e is_anonymous = true).
     */
    public function test_scenario_2_anonymous_donation_creates_null_donor(): void
    {
        $mockAdapter = Mockery::mock(AtcCybersourceAdapter::class);
        $mockAdapter->shouldReceive('processCheckout')
            ->once()
            ->andReturn([
                'status'                    => 'completed',
                'gateway_transaction_id'    => 'tx_anon_01',
                'cybersource_request_id'    => '9918492049281948291099',
                'merchant_reference_number' => 'REF-FNE-ANON-002',
            ]);

        $this->app->instance(AtcCybersourceAdapter::class, $mockAdapter);

        $response = $this->withHeaders(['X-Tenant-Subdomain' => 'esperanza'])
            ->postJson('/api/v1/donations/checkout', [
                'campaign_id'               => $this->campaign->id,
                'amount'                    => 50.00,
                'frequency'                 => 'single',
                'is_anonymous'              => true,
                'merchant_reference_number' => 'REF-FNE-ANON-002',
                'card_number'               => '4000123456789010',
                'expiration_month'          => '12',
                'expiration_year'           => '2028',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('donations', [
            'merchant_reference_number' => 'REF-FNE-ANON-002',
            'donor_id'                  => null,
            'is_anonymous'              => true,
            'status'                    => 'completed',
        ]);
    }

    /**
     * Escenario 3: Tokenización TMS con tms_customer_id NULL (Sin errores SQL).
     */
    public function test_scenario_3_monthly_subscription_with_null_customer_id(): void
    {
        $mockAdapter = Mockery::mock(AtcCybersourceAdapter::class);
        $mockAdapter->shouldReceive('tokenizeCard')
            ->once()
            ->andReturn([
                'payment_instrument_id' => 'tms_inst_11223344',
                'customer_id'           => null, // Verificamos que no lance error por ser null
                'card_last_four'        => '9010',
                'card_brand'            => 'VISA',
            ]);

        $mockAdapter->shouldReceive('processCheckout')
            ->once()
            ->andReturn([
                'status'                    => 'completed',
                'gateway_transaction_id'    => 'tx_sub_initial_01',
                'cybersource_request_id'    => '7718492049281948291077',
                'merchant_reference_number' => 'REF-FNE-SUB-003',
            ]);

        $this->app->instance(AtcCybersourceAdapter::class, $mockAdapter);

        $response = $this->withHeaders(['X-Tenant-Subdomain' => 'esperanza'])
            ->postJson('/api/v1/donations/checkout', [
                'campaign_id'               => $this->campaign->id,
                'amount'                    => 200.00,
                'frequency'                 => 'monthly',
                'donor_name'                => 'Ana Socia',
                'donor_email'               => 'ana@example.com',
                'is_anonymous'              => false,
                'merchant_reference_number' => 'REF-FNE-SUB-003',
                'card_number'               => '4000123456789010',
                'expiration_month'          => '08',
                'expiration_year'           => '2029',
                'cvv'                       => '456',
            ]);

        $response->assertStatus(200);

        // Verificar suscripción creada con customer_id null
        $this->assertDatabaseHas('subscriptions', [
            'tms_payment_instrument_id' => 'tms_inst_11223344',
            'tms_customer_id'           => null,
            'amount'                    => 200.00,
            'status'                    => 'active',
        ]);
    }
}
