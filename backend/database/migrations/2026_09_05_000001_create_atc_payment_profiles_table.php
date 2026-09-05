<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('atc_payment_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('foundation_id')->constrained('foundations')->cascadeOnDelete();
            $table->foreignId('donor_id')->nullable()->constrained('donors')->nullOnDelete();
            $table->string('customer_token')->nullable()->comment('Token TMS de Cliente en Cybersource');
            $table->string('payment_instrument_token')->comment('Token de Instrumento de Pago TMS');
            $table->string('card_type', 50)->comment('VISA, MASTERCARD, AMEX');
            $table->string('card_last4', 4)->comment('Últimos 4 dígitos de la tarjeta');
            $table->string('card_expiration_month', 2);
            $table->string('card_expiration_year', 4);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['foundation_id', 'is_active'], 'idx_atc_profiles_tenant_active');
            $table->index('payment_instrument_token', 'idx_atc_profiles_token');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE atc_payment_profiles ENABLE ROW LEVEL SECURITY;");
            DB::statement("
                CREATE POLICY tenant_isolation_atc_payment_profiles ON atc_payment_profiles
                FOR ALL USING (foundation_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("DROP POLICY IF EXISTS tenant_isolation_atc_payment_profiles ON atc_payment_profiles;");
            DB::statement("ALTER TABLE atc_payment_profiles DISABLE ROW LEVEL SECURITY;");
        }

        Schema::dropIfExists('atc_payment_profiles');
    }
};
