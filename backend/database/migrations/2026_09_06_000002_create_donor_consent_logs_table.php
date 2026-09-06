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
        Schema::create('donor_consent_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('foundation_id')->constrained('foundations')->cascadeOnDelete();
            $table->foreignId('donor_id')->nullable()->constrained('donors')->nullOnDelete();
            $table->foreignId('donation_id')->nullable()->constrained('donations')->nullOnDelete();
            $table->string('merchant_reference_number', 100)->index()->comment('Referencia bancaria única de la transacción');
            $table->string('ip_address', 45)->comment('Dirección IP de origen del donante');
            $table->text('user_agent')->comment('User Agent del navegador/dispositivo');
            $table->string('tos_version', 20)->default('v1.0-2026')->comment('Versión del contrato clickwrap');
            $table->string('privacy_policy_version', 20)->default('v1.0-2026')->comment('Versión de política de privacidad');
            $table->timestamp('consent_given_at')->useCurrent()->comment('Marca temporal inmutable de aceptación');
            $table->string('consent_signature_hash', 64)->comment('Firma criptográfica SHA-256 de no repudio');
            $table->timestamps();

            $table->index(['foundation_id', 'donor_id'], 'idx_consent_tenant_donor');
        });

        // Habilitar Row Level Security (RLS) en PostgreSQL
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE donor_consent_logs ENABLE ROW LEVEL SECURITY;");
            DB::statement("
                CREATE POLICY tenant_isolation_donor_consent_logs ON donor_consent_logs
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
            DB::statement("DROP POLICY IF EXISTS tenant_isolation_donor_consent_logs ON donor_consent_logs;");
            DB::statement("ALTER TABLE donor_consent_logs DISABLE ROW LEVEL SECURITY;");
        }

        Schema::dropIfExists('donor_consent_logs');
    }
};
