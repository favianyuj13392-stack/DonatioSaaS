<?php

use App\Http\Controllers\Admin\BillingProformaController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app'     => 'Donatio SaaS API',
        'version' => '3.0.0',
        'status'  => 'healthy',
    ]);
});

Route::get('/dev/migrate-and-seed', function () {
    \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
    return response()->json([
        'status' => 'success',
        'output' => \Illuminate\Support\Facades\Artisan::output(),
    ]);
});

Route::get('/admin/billing/proforma/{period}/{foundation_id}', [BillingProformaController::class, 'show'])
    ->name('admin.billing.proforma');
