<?php

namespace App\Observers;

use App\Models\Campaign;
use App\Services\Cloudflare\CloudflarePurgeService;

class CampaignObserver
{
    /**
     * Handle the Campaign "saved" event.
     */
    public function saved(Campaign $campaign): void
    {
        CloudflarePurgeService::purgeCampaignCache($campaign);
    }

    /**
     * Handle the Campaign "deleted" event.
     */
    public function deleted(Campaign $campaign): void
    {
        CloudflarePurgeService::purgeCampaignCache($campaign);
    }
}
