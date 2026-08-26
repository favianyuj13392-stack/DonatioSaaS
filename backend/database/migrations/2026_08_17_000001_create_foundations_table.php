<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('foundations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('subdomain', 100)->unique();
            $table->string('code', 10)->unique()->comment('Sigla corta para prefijo bancario (ej. FNE, FR)');
            $table->string('custom_domain')->nullable()->unique();
            $table->string('contact_email');
            $table->string('phone', 50)->nullable();
            $table->string('nit', 30)->nullable()->comment('NIT legal boliviano');
            $table->string('logo_url', 500)->nullable();
            $table->string('primary_color', 10)->default('#2563eb');

            // Tarifas y Comisiones del SaaS y Pasarela
            $table->decimal('saas_fee_card', 5, 2)->default(2.00)->comment('Comisión SaaS para tarjetas (%)');
            $table->decimal('saas_fee_qr', 5, 2)->default(2.00)->comment('Comisión SaaS para QR (%)');
            $table->decimal('atc_fee_card_est', 5, 2)->default(2.45)->comment('Estimado ATC tarjetas (%)');
            $table->decimal('atc_fee_qr_est', 5, 2)->default(1.00)->comment('Estimado ATC QR (%)');

            // Credenciales Bancarias ATC Red Enlace (Cifradas con AES-256 en Eloquent)
            $table->text('atc_merchant_id');
            $table->text('atc_api_key_id');
            $table->text('atc_secret_key');
            $table->text('atc_org_unit_id')->nullable();
            $table->boolean('is_sandbox')->default(true);

            $table->string('status', 20)->default('active')->comment('active, suspended, pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('foundations');
    }
};
