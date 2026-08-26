<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\Donation;
use App\Models\Foundation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Prueba el aislamiento estricto de datos entre dos fundaciones diferentes.
     */
    public function test_tenant_cannot_access_other_tenant_data(): void
    {
        // 1. Crear Fundación A (Esperanza)
        $tenantA = Foundation::create([
            'name'            => 'Fundación Esperanza',
            'subdomain'       => 'esperanza',
            'code'            => 'FNE',
            'contact_email'   => 'a@esperanza.org',
            'atc_merchant_id' => 'merch_a',
            'atc_api_key_id'  => 'key_a',
            'atc_secret_key'  => 'sec_a',
            'status'          => 'active',
        ]);

        // 2. Crear Fundación B (Huellitas)
        $tenantB = Foundation::create([
            'name'            => 'Fundación Huellitas',
            'subdomain'       => 'huellitas',
            'code'            => 'FH',
            'contact_email'   => 'b@huellitas.org',
            'atc_merchant_id' => 'merch_b',
            'atc_api_key_id'  => 'key_b',
            'atc_secret_key'  => 'sec_b',
            'status'          => 'active',
        ]);

        // 3. Crear campañas para cada tenant
        app()->instance('current_tenant', $tenantA);
        $campaignA = Campaign::create([
            'title'         => 'Campaña de Esperanza',
            'slug'          => 'campana-esperanza',
            'monetary_goal' => 10000,
        ]);

        app()->instance('current_tenant', $tenantB);
        $campaignB = Campaign::create([
            'title'         => 'Campaña de Huellitas',
            'slug'          => 'campana-huellitas',
            'monetary_goal' => 5000,
        ]);

        // 4. Verificar que al consultar como Tenant A, solo se obtiene la Campaña A
        app()->instance('current_tenant', $tenantA);
        $campaignsForA = Campaign::all();

        $this->assertCount(1, $campaignsForA);
        $this->assertEquals($campaignA->id, $campaignsForA->first()->id);
        $this->assertEquals('Campaña de Esperanza', $campaignsForA->first()->title);

        // 5. Verificar que al consultar como Tenant B, solo se obtiene la Campaña B
        app()->instance('current_tenant', $tenantB);
        $campaignsForB = Campaign::all();

        $this->assertCount(1, $campaignsForB);
        $this->assertEquals($campaignB->id, $campaignsForB->first()->id);
        $this->assertEquals('Campaña de Huellitas', $campaignsForB->first()->title);
    }
}
