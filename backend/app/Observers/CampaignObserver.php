<?php

namespace App\Observers;

use App\Models\Campaign;
use App\Services\Cloudflare\CloudflarePurgeService;
use Illuminate\Support\Facades\Cache;

class CampaignObserver
{
    /**
     * Handle the Campaign "saved" event.
     */
    public function saved(Campaign $campaign): void
    {
        $this->invalidateCaches($campaign);
        CloudflarePurgeService::purgeCampaignCache($campaign);
    }

    /**
     * Handle the Campaign "deleted" event.
     */
    public function deleted(Campaign $campaign): void
    {
        $this->invalidateCaches($campaign);
        CloudflarePurgeService::purgeCampaignCache($campaign);
    }

    /**
     * Limpia las llaves de caché distribuido en Redis del tenant y campaña.
     */
    protected function invalidateCaches(Campaign $campaign): void
    {
        Cache::forget("tenant_public_show_{$campaign->foundation_id}");
        Cache::forget("tenant_{$campaign->foundation_id}_campaigns_index");
        Cache::forget("tenant_{$campaign->foundation_id}_campaign_show_{$campaign->slug}");
        Cache::forget("tenant_{$campaign->foundation_id}_campaign_show_default");
    }
}
