<?php

namespace App\Services\Cloudflare;

use App\Models\Campaign;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CloudflarePurgeService
{
    /**
     * Purga la caché de Cloudflare Edge CDN para la URL exacta de una campaña modificada.
     */
    public static function purgeCampaignCache(Campaign $campaign): bool
    {
        $zoneId   = config('services.cloudflare.zone_id');
        $apiToken = config('services.cloudflare.api_token');

        if (!$zoneId || !$apiToken) {
            Log::info("Cloudflare purge omitido: Credenciales no configuradas en entorno local.");
            return true;
        }

        $tenant = $campaign->foundation;
        $domain = config('app.saas_domain', 'donatio.lat');
        $apiDomain = config('app.api_domain', 'api.donatio.lat');

        // URLs exactas a purgar
        $urlsToPurge = [
            "https://{$tenant->subdomain}.{$domain}/c/{$campaign->slug}",
            "https://{$tenant->subdomain}.{$domain}/",
            "https://{$apiDomain}/api/v1/public/tenants/{$tenant->subdomain}/campaigns/{$campaign->slug}",
        ];

        try {
            $response = Http::withToken($apiToken)
                ->post("https://api.cloudflare.com/client/v4/zones/{$zoneId}/purge_cache", [
                    'files' => $urlsToPurge,
                ]);

            if ($response->successful()) {
                Log::info("Caché purgada exitosamente en Cloudflare para campaña: {$campaign->slug}");
                return true;
            }

            Log::error("Error purgando caché en Cloudflare: " . $response->body());
            return false;
        } catch (Exception $e) {
            Log::error("Excepción al purgar Cloudflare: " . $e->getMessage());
            return false;
        }
    }
}
