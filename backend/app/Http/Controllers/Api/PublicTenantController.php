<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PublicTenantController extends Controller
{
    /**
     * Retorna la información institucional completa del tenant con protección de Caché distribuido (Redis).
     * Endpoint: GET /api/v1/public/tenants/{subdomain}
     */
    public function show(Request $request, string $subdomain): JsonResponse
    {
        $tenant = app('current_tenant');

        if (!$tenant) {
            return response()->json(['error' => 'Fundación no encontrada'], 404);
        }

        if ($tenant->status === 'suspended') {
            return response()->json(['error' => 'Esta fundación se encuentra suspendida temporalmente.'], 403);
        }

        // Cache::remember para blindar a PostgreSQL ante picos de tráfico masivo (60s TTL)
        $data = Cache::remember("tenant_public_show_{$tenant->id}", 60, function () use ($tenant) {
            // Buscar campaña destacada o la primera activa
            $featuredCampaign = Campaign::where('foundation_id', $tenant->id)
                ->where('status', 'active')
                ->orderBy('id', 'asc')
                ->first();

            // Determinar métodos y proveedores de pago reales
            $paymentProviders = [];
            if (!empty($tenant->atc_merchant_id) && !empty($tenant->atc_api_key_id)) {
                $paymentProviders[] = [
                    'id'        => 'card',
                    'name'      => 'Tarjeta de Crédito / Débito',
                    'processor' => 'ATC Red Enlace / Cybersource',
                    'is_active' => true,
                ];
                $paymentProviders[] = [
                    'id'        => 'qr',
                    'name'      => 'QR Simple Bancario',
                    'processor' => 'ATC Red Enlace',
                    'is_active' => true,
                ];
            }

            return [
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
                    'hero_headline'         => $tenant->hero_headline ?: null,
                    'hero_description'      => $tenant->hero_description ?: null,
                    'hero_image_url'        => $tenant->hero_image_url ?: null,
                    'hero_cta_text'         => $tenant->hero_cta_text ?: null,
                    'hero_cta_url'          => $tenant->hero_cta_url ?: null,
                    'about_text'            => $tenant->about_text ?: null,
                    'mission'               => $tenant->mission ?: null,
                    'vision'                => $tenant->vision ?: null,
                    'values'                => !empty($tenant->values) ? $tenant->values : [],
                    'programs'              => !empty($tenant->programs) ? $tenant->programs : [],
                    'institutional_metrics' => !empty($tenant->institutional_metrics) ? $tenant->institutional_metrics : [],
                    'corporate_partners'    => !empty($tenant->corporate_partners) ? $tenant->corporate_partners : [],
                    'testimonial'           => !empty($tenant->testimonial) ? $tenant->testimonial : null,
                    'status'                => $tenant->status,
                ],
                'featured_campaign' => $featuredCampaign ? [
                    'id'                  => $featuredCampaign->id,
                    'title'               => $featuredCampaign->title,
                    'slug'                => $featuredCampaign->slug,
                    'headline'            => $featuredCampaign->headline ?: null,
                    'description'         => $featuredCampaign->description ?: null,
                    'banner_url'          => $featuredCampaign->banner_url ?: null,
                    'monetary_goal'       => (float) $featuredCampaign->monetary_goal,
                    'current_amount'      => (float) $featuredCampaign->current_amount,
                    'progress_percentage' => $featuredCampaign->progress_percentage,
                ] : null,
                'campaigns_count'   => Campaign::where('foundation_id', $tenant->id)->where('status', 'active')->count(),
                'payment_providers' => $paymentProviders,
            ];
        });

        return response()->json($data)->withHeaders([
            'Cache-Control' => 'public, max-age=60, s-maxage=300, stale-while-revalidate=60',
        ]);
    }
}
