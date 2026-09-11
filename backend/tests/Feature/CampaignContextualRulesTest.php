<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\Foundation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CampaignContextualRulesTest extends TestCase
{
    use RefreshDatabase;

    protected Foundation $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Foundation::create([
            'name'            => 'Fundación Nuestra Esperanza',
            'subdomain'       => 'esperanza',
            'code'            => 'FNE',
            'contact_email'   => 'contacto@esperanza.org',
            'atc_merchant_id' => 'test_merchant_id',
            'atc_api_key_id'  => 'test_key_id',
            'atc_secret_key'  => 'test_secret_key',
            'is_sandbox'      => true,
            'status'          => 'active',
        ]);

        app()->instance('current_tenant', $this->tenant);
    }

    public function test_campaign_persists_allowed_currencies_and_structured_tiers(): void
    {
        $campaign = Campaign::create([
            'title'                   => 'Campaña Oncología Pediátrica',
            'slug'                    => 'oncologia-2026',
            'monetary_goal'           => 100000.00,
            'allowed_frequencies'     => 'all',
            'allowed_payment_methods' => 'card_only',
            'allowed_currencies'      => 'all',
            'donation_tiers'          => [
                'bob' => [
                    ['amount' => 50, 'label' => '1 Kit Básico', 'is_default' => false],
                    ['amount' => 150, 'label' => '1 Sesión Quimio', 'is_default' => true],
                ],
                'usd' => [
                    ['amount' => 10, 'label' => '1 Care Kit', 'is_default' => false],
                    ['amount' => 25, 'label' => 'Support session', 'is_default' => true],
                ],
            ],
            'status'                  => 'active',
        ]);

        $this->assertDatabaseHas('campaigns', [
            'id'                 => $campaign->id,
            'allowed_currencies' => 'all',
        ]);

        $tiers = $campaign->donation_tiers;
        $this->assertIsArray($tiers);
        $this->assertArrayHasKey('bob', $tiers);
        $this->assertArrayHasKey('usd', $tiers);
        $this->assertEquals(150, $tiers['bob'][1]['amount']);
        $this->assertEquals(25, $tiers['usd'][1]['amount']);
    }

    public function test_public_campaign_api_exposes_allowed_currencies_and_filters_qr_when_usd_only(): void
    {
        $campaign = Campaign::create([
            'title'                   => 'Causa Internacional en Dólares',
            'slug'                    => 'global-usd',
            'monetary_goal'           => 20000.00,
            'allowed_frequencies'     => 'all',
            'allowed_payment_methods' => 'all',
            'allowed_currencies'      => 'usd_only',
            'status'                  => 'active',
        ]);

        $response = $this->getJson("/api/v1/public/tenants/{$this->tenant->subdomain}/campaigns/{$campaign->slug}");

        $response->assertStatus(200);
        $response->assertJsonPath('campaign.allowed_currencies', 'usd_only');

        // Al ser usd_only, el proveedor QR no debe estar en payment_providers
        $providers = $response->json('payment_providers');
        $providerIds = array_column($providers, 'id');
        $this->assertContains('card', $providerIds);
        $this->assertNotContains('qr', $providerIds);
    }

    public function test_checkout_rejects_single_donation_when_campaign_is_monthly_only(): void
    {
        $campaign = Campaign::create([
            'title'                   => 'Socios Recurrentes',
            'slug'                    => 'socios-mensuales',
            'monetary_goal'           => 50000.00,
            'allowed_frequencies'     => 'monthly_only',
            'allowed_payment_methods' => 'card_only',
            'allowed_currencies'      => 'all',
            'status'                  => 'active',
        ]);

        $payload = [
            'campaign_id'               => $campaign->id,
            'amount'                    => 100.00,
            'currency'                  => 'BOB',
            'frequency'                 => 'single', // Inválido: La campaña es monthly_only
            'donor_name'                => 'Carlos Pérez',
            'donor_email'               => 'carlos@test.com',
            'merchant_reference_number' => 'ref_single_reject_01',
            'card_number'               => '4111111111111111',
            'expiration_month'          => '12',
            'expiration_year'           => '2028',
            'accepted_terms'            => true,
        ];

        $response = $this->withHeaders(['X-Tenant-Subdomain' => $this->tenant->subdomain])
            ->postJson('/api/v1/donations/checkout', $payload);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'error' => 'Esta campaña solo admite donaciones mensuales recurrentes.',
        ]);
    }

    public function test_checkout_rejects_usd_donation_when_campaign_is_bob_only(): void
    {
        $campaign = Campaign::create([
            'title'                   => 'Campaña Local en Bolivianos',
            'slug'                    => 'solo-bob',
            'monetary_goal'           => 10000.00,
            'allowed_frequencies'     => 'all',
            'allowed_payment_methods' => 'all',
            'allowed_currencies'      => 'bob_only',
            'status'                  => 'active',
        ]);

        $payload = [
            'campaign_id'               => $campaign->id,
            'amount'                    => 25.00,
            'currency'                  => 'USD', // Inválido: La campaña es bob_only
            'frequency'                 => 'single',
            'donor_name'                => 'Ana Gómez',
            'donor_email'               => 'ana@test.com',
            'merchant_reference_number' => 'ref_usd_reject_01',
            'card_number'               => '4111111111111111',
            'expiration_month'          => '12',
            'expiration_year'           => '2028',
            'accepted_terms'            => true,
        ];

        $response = $this->withHeaders(['X-Tenant-Subdomain' => $this->tenant->subdomain])
            ->postJson('/api/v1/donations/checkout', $payload);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'error' => 'Esta campaña solo admite donaciones en Bolivianos (BOB).',
        ]);
    }

    public function test_checkout_rejects_bob_donation_when_campaign_is_usd_only(): void
    {
        $campaign = Campaign::create([
            'title'                   => 'Campaña Exclusiva Dólares',
            'slug'                    => 'solo-usd',
            'monetary_goal'           => 10000.00,
            'allowed_frequencies'     => 'all',
            'allowed_payment_methods' => 'card_only',
            'allowed_currencies'      => 'usd_only',
            'status'                  => 'active',
        ]);

        $payload = [
            'campaign_id'               => $campaign->id,
            'amount'                    => 100.00,
            'currency'                  => 'BOB', // Inválido: La campaña es usd_only
            'frequency'                 => 'single',
            'donor_name'                => 'John Doe',
            'donor_email'               => 'john@test.com',
            'merchant_reference_number' => 'ref_bob_reject_01',
            'card_number'               => '4111111111111111',
            'expiration_month'          => '12',
            'expiration_year'           => '2028',
            'accepted_terms'            => true,
        ];

        $response = $this->withHeaders(['X-Tenant-Subdomain' => $this->tenant->subdomain])
            ->postJson('/api/v1/donations/checkout', $payload);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'error' => 'Esta campaña solo admite donaciones en Dólares (USD).',
        ]);
    }
}
