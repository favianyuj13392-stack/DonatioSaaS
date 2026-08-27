<?php

namespace App\Observers;

use App\Models\Foundation;
use Illuminate\Support\Facades\Cache;

class FoundationObserver
{
    /**
     * Handle the Foundation "saved" event.
     */
    public function saved(Foundation $foundation): void
    {
        $this->invalidateCaches($foundation);
    }

    /**
     * Handle the Foundation "deleted" event.
     */
    public function deleted(Foundation $foundation): void
    {
        $this->invalidateCaches($foundation);
    }

    /**
     * Limpia el caché institucional y catálogo del tenant.
     */
    protected function invalidateCaches(Foundation $foundation): void
    {
        Cache::forget("tenant_public_show_{$foundation->id}");
        Cache::forget("tenant_{$foundation->id}_campaigns_index");
    }
}
