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

Route::middleware(['auth'])->group(function () {
    Route::get('/admin/billing/proforma/{period}/{foundation_id}', [BillingProformaController::class, 'show'])
        ->name('admin.billing.proforma');
});

