<?php

namespace App\Providers;

use App\Models\Campaign;
use App\Models\Foundation;
use App\Observers\CampaignObserver;
use App\Observers\FoundationObserver;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Prevenir consultas O(N) accidentales en entornos que no sean producción
        Model::preventLazyLoading(!app()->isProduction());
        Model::shouldBeStrict(!app()->isProduction());

        // Forzar esquema HTTPS en producción o cuando APP_URL es HTTPS
        if (app()->isProduction() || str_starts_with((string) config('app.url'), 'https://') || isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        // Registro de Observers para sincronización y purga de caché
        Campaign::observe(CampaignObserver::class);
        Foundation::observe(FoundationObserver::class);
    }
}
