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
        // 1. Índices compuestos para Donaciones bajo RLS
        Schema::table('donations', function (Blueprint $table) {
            $table->index(['foundation_id', 'status', 'created_at'], 'idx_donations_foundation_status_created');
            $table->index(['foundation_id', 'payment_method', 'status'], 'idx_donations_foundation_method_status');
        });

        // 2. Índices compuestos para Suscripciones recurrentes
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->index(['foundation_id', 'status', 'next_billing_date'], 'idx_subscriptions_foundation_status_billing');
        });

        // 3. Índices compuestos para Campañas públicas
        Schema::table('campaigns', function (Blueprint $table) {
            $table->index(['foundation_id', 'status'], 'idx_campaigns_foundation_status');
        });

        // 4. Índices compuestos para Facturación y comisiones SaaS
        Schema::table('tenant_billing_ledgers', function (Blueprint $table) {
            $table->index(['foundation_id', 'status', 'billing_period'], 'idx_billing_foundation_status_period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenant_billing_ledgers', function (Blueprint $table) {
            $table->dropIndex('idx_billing_foundation_status_period');
        });

        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropIndex('idx_campaigns_foundation_status');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex('idx_subscriptions_foundation_status_billing');
        });

        Schema::table('donations', function (Blueprint $table) {
            $table->dropIndex('idx_donations_foundation_method_status');
            $table->dropIndex('idx_donations_foundation_status_created');
        });
    }
};
