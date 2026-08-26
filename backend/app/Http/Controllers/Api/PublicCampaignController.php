<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicCampaignController extends Controller
{
    /**
     * Retorna el listado de campañas activas del tenant.
     * Endpoint: GET /api/v1/public/tenants/{subdomain}/campaigns
     */
    public function index(Request $request, string $subdomain): JsonResponse
    {
        $tenant = app('current_tenant');

        if (!$tenant) {
            return response()->json(['error' => 'Fundación no encontrada'], 404);
        }

        $campaigns = Campaign::where('foundation_id', $tenant->id)
            ->where('status', 'active')
            ->orderBy('id', 'asc')
            ->get()
            ->map(fn ($c) => [
                'id'                  => $c->id,
                'title'               => $c->title,
                'slug'                => $c->slug,
                'headline'            => $c->headline ?: null,
                'description'         => $c->description ?: null,
                'banner_url'          => $c->banner_url ?: null,
                'monetary_goal'       => (float) $c->monetary_goal,
                'current_amount'      => (float) $c->current_amount,
                'progress_percentage' => $c->progress_percentage,
                'allowed_frequencies' => $c->allowed_frequencies,
            ]);

        return response()->json([
            'tenant'    => [
                'id'            => $tenant->id,
                'name'          => $tenant->name,
                'subdomain'     => $tenant->subdomain,
                'logo_url'      => $tenant->logo_url ?: null,
                'primary_color' => $tenant->primary_color,
            ],
            'campaigns' => $campaigns,
        ])->withHeaders([
            'Cache-Control' => 'public, max-age=60, s-maxage=300, stale-while-revalidate=60',
        ]);
    }

    /**
     * Retorna la información completa de una campaña específica.
     * CERO HARDCODING: Secciones sin datos retornan null o array vacío.
     * Endpoint: GET /api/v1/public/tenants/{subdomain}/campaigns/{slug}
     */
    public function show(Request $request, string $subdomain, string $slug = 'default'): JsonResponse
    {
        $tenant = app('current_tenant');

        if (!$tenant) {
            return response()->json(['error' => 'Fundación no encontrada'], 404);
        }

        if ($tenant->status === 'suspended') {
            return response()->json(['error' => 'Esta fundación se encuentra suspendida temporalmente.'], 403);
        }

        $query = Campaign::where('foundation_id', $tenant->id)->where('status', 'active');

        if ($slug !== 'default' && !empty($slug)) {
            $campaign = (clone $query)->where('slug', $slug)->first();
        } else {
            $campaign = (clone $query)->orderBy('id', 'asc')->first();
        }

        if (!$campaign) {
            return response()->json(['error' => 'Campaña no encontrada o inactiva.'], 404);
        }

        // Otras campañas activas del mismo tenant (excluyendo la actual)
        $otherCampaigns = Campaign::where('foundation_id', $tenant->id)
            ->where('status', 'active')
            ->where('id', '!=', $campaign->id)
            ->get()
            ->map(fn ($c) => [
                'id'                  => $c->id,
                'title'               => $c->title,
                'slug'                => $c->slug,
                'description'         => $c->description ?: null,
                'banner_url'          => $c->banner_url ?: null,
                'monetary_goal'       => (float) $c->monetary_goal,
                'current_amount'      => (float) $c->current_amount,
                'progress_percentage' => $c->progress_percentage,
            ]);

        // Proveedores y métodos de pago activos
        $paymentProviders = [];
        if (!empty($tenant->atc_merchant_id) && !empty($tenant->atc_api_key_id)) {
            if ($campaign->allowed_payment_methods === 'all' || $campaign->allowed_payment_methods === 'card_only') {
                $paymentProviders[] = [
                    'id'        => 'card',
                    'name'      => 'Tarjeta de Crédito / Débito',
                    'processor' => 'ATC Red Enlace / Cybersource',
                    'is_active' => true,
                ];
            }
            if ($campaign->allowed_payment_methods === 'all' || $campaign->allowed_payment_methods === 'qr_only') {
                $paymentProviders[] = [
                    'id'        => 'qr',
                    'name'      => 'QR Simple Bancario',
                    'processor' => 'ATC Red Enlace',
                    'is_active' => true,
                ];
            }
        }

        $data = [
            'tenant' => [
                'id'                    => $tenant->id,
                'name'                  => $tenant->name,
                'legal_name'            => $tenant->legal_name,
                'subdomain'             => $tenant->subdomain,
                'code'                  => $tenant->code,
                'nit'                   => $tenant->nit ?: null,
                'legal_id_details'      => $tenant->legal_id_details ?: null,
                'location_city'         => $tenant->location_city ?: null,
                'logo_url'              => $tenant->logo_url ?: null,
                'primary_color'         => $tenant->primary_color ?: '#059669',
                'primary_color_hover'   => $tenant->primary_color_hover ?: '#047857',
                'secondary_color'       => $tenant->secondary_color ?: '#064e3b',
                'contact_email'         => $tenant->contact_email ?: null,
                'phone'                 => $tenant->phone ?: null,
                'mission'               => $tenant->mission ?: null,
                'vision'                => $tenant->vision ?: null,
                'values'                => !empty($tenant->values) ? $tenant->values : [],
                'programs'              => !empty($tenant->programs) ? $tenant->programs : [],
                'institutional_metrics' => !empty($tenant->institutional_metrics) ? $tenant->institutional_metrics : [],
                'corporate_partners'    => !empty($tenant->corporate_partners) ? $tenant->corporate_partners : [],
                'testimonial'           => !empty($tenant->testimonial) ? $tenant->testimonial : null,
                'status'                => $tenant->status,
            ],
            'campaign' => [
                'id'                      => $campaign->id,
                'title'                   => $campaign->title,
                'slug'                    => $campaign->slug,
                'headline'                => $campaign->headline ?: null,
                'description'             => $campaign->description ?: null,
                'story_markdown'          => $campaign->story_markdown ?: null,
                'story_image_url'         => $campaign->story_image_url ?: null,
                'banner_url'              => $campaign->banner_url ?: null,
                'monetary_goal'           => (float) $campaign->monetary_goal,
                'current_amount'          => (float) $campaign->current_amount,
                'progress_percentage'     => $campaign->progress_percentage,
                'allowed_frequencies'     => $campaign->allowed_frequencies,
                'allowed_payment_methods' => $campaign->allowed_payment_methods,
                'donation_tiers'          => !empty($campaign->donation_tiers) ? $campaign->donation_tiers : [],
                'tangible_impact_items'   => !empty($campaign->tangible_impact_items) ? $campaign->tangible_impact_items : [],
                'funds_breakdown'         => !empty($campaign->funds_breakdown) ? $campaign->funds_breakdown : null,
                'testimonial'             => !empty($campaign->testimonial) ? $campaign->testimonial : null,
                'thank_you_message'       => $campaign->thank_you_message ?: null,
                'monthly_label'           => $campaign->monthly_label ?: null,
                'single_label'            => $campaign->single_label ?: null,
                'status'                  => $campaign->status,
            ],
            'other_campaigns'   => $otherCampaigns,
            'payment_providers' => $paymentProviders,
        ];

        return response()->json($data)->withHeaders([
            'Cache-Control' => 'public, max-age=60, s-maxage=300, stale-while-revalidate=60',
        ]);
    }
}
