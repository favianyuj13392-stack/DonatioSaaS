<?php

use App\Http\Controllers\Api\DonationCheckoutController;
use App\Http\Controllers\Api\PublicCampaignController;
use App\Http\Controllers\Api\PublicTenantController;
use App\Http\Controllers\Api\QrWebhookController;
use App\Http\Controllers\Api\SubscriptionReactivationController;
use App\Http\Middleware\IdentifyTenant;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Donatio SaaS Multi-Tenant
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // 1. Rutas Públicas de Tenant, Campañas y Checkout protegidas por IdentifyTenant
    Route::middleware([IdentifyTenant::class])->group(function () {
        // Consulta pública institucional del Tenant (Homepage)
        Route::get('/public/tenants/{subdomain}', [PublicTenantController::class, 'show']);

        // Catálogo y detalle público de Campañas
        Route::get('/public/tenants/{subdomain}/campaigns', [PublicCampaignController::class, 'index']);
        Route::get('/public/tenants/{subdomain}/campaigns/{slug}', [PublicCampaignController::class, 'show']);

        // Transacciones y Flujo Completo 3DS2 Cybersource ATC
        Route::post('/donations/3ds-setup', [DonationCheckoutController::class, 'setup3ds']);
        Route::post('/donations/3ds-enrollment', [DonationCheckoutController::class, 'check3dsEnrollment']);
        Route::post('/donations/3ds-validate', [DonationCheckoutController::class, 'validate3dsChallenge']);
        Route::post('/donations/checkout', [DonationCheckoutController::class, 'checkout']);
        Route::match(['get', 'post'], '/donations/stepup-return', [DonationCheckoutController::class, 'stepUpReturn']);

        // Donaciones QR
        Route::post('/donations/qr-generate', [DonationCheckoutController::class, 'generateQr']);
        Route::get('/donations/{id}/qr-status', [DonationCheckoutController::class, 'qrStatus']);
        Route::get('/donations/{id}/receipt', [DonationCheckoutController::class, 'downloadReceipt'])->name('donations.receipt');
    });

    // 2. Rutas de Reactivación de Socios (Reactivación 1-Click con Token UUID 72h)
    Route::prefix('public/subscriptions')->group(function () {
        Route::get('/validate-reactivation/{token}', [SubscriptionReactivationController::class, 'validate']);
        Route::post('/confirm-reactivation/{token}', [SubscriptionReactivationController::class, 'confirm']);
    });

    // 3. Webhooks Globales Multitenant de Pasarelas de Pago
    Route::prefix('webhooks')->group(function () {
        Route::post('/qr-payment', [QrWebhookController::class, 'handle']);
    });
});
