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
        // 1. Tabla de Campañas
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('foundation_id')->constrained('foundations')->cascadeOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('banner_url', 500)->nullable();
            $table->decimal('monetary_goal', 12, 2)->default(0.00);
            $table->decimal('current_amount', 12, 2)->default(0.00);
            $table->string('allowed_frequencies', 20)->default('all')->comment('all, monthly_only, single_only');
            $table->string('allowed_payment_methods', 20)->default('all')->comment('all, card_only, qr_only');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('status', 20)->default('active')->comment('active, paused, completed');
            $table->timestamps();

            $table->unique(['foundation_id', 'slug'], 'unique_foundation_campaign_slug');
        });

        // 2. Tabla de Donantes (Unificado para CRO)
        Schema::create('donors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('foundation_id')->constrained('foundations')->cascadeOnDelete();
            $table->string('name')->comment('Nombre completo para checkout CRO');
            $table->string('email');
            $table->string('phone', 50)->nullable();
            $table->string('document_id', 50)->nullable()->comment('CI o NIT');
            $table->timestamps();

            $table->unique(['foundation_id', 'email'], 'unique_foundation_donor_email');
        });

        // 3. Tabla de Suscripciones (Socios Recurrentes - Cybersource TMS)
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('foundation_id')->constrained('foundations')->cascadeOnDelete();
            $table->foreignId('donor_id')->constrained('donors')->cascadeOnDelete();
            $table->foreignId('campaign_id')->nullable()->constrained('campaigns')->nullOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('BOB');
            $table->string('tms_customer_id')->nullable()->comment('Opcional en Cybersource TMS');
            $table->string('tms_payment_instrument_id')->comment('Payment Instrument Token');
            $table->string('card_last_four', 4);
            $table->string('card_brand', 50);
            $table->unsignedTinyInteger('billing_day_of_month')->default(1);
            $table->date('next_billing_date');
            $table->timestamp('last_billed_at')->nullable()->comment('Fecha del último débito exitoso');
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->string('status', 20)->default('active')->comment('active, paused, cancelled, failed');
            $table->unsignedInteger('failed_attempts_count')->default(0);
            $table->uuid('reactivation_token')->nullable()->unique();
            $table->timestamp('reactivation_token_expires_at')->nullable();
            $table->string('ip_address', 45)->nullable()->comment('IP del donante para auditoría Red Enlace');
            $table->text('user_agent')->nullable()->comment('Navegador/dispositivo para auditoría Red Enlace');
            $table->timestamp('accepted_terms_at')->nullable()->comment('Consentimiento digital de débito automático');
            $table->timestamps();
        });

        // 4. Tabla de Donaciones (Transacciones Auditables ATC)
        Schema::create('donations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('foundation_id')->constrained('foundations')->cascadeOnDelete();
            $table->foreignId('donor_id')->nullable()->constrained('donors')->nullOnDelete()->comment('Nullable para donaciones anónimas');
            $table->foreignId('campaign_id')->nullable()->constrained('campaigns')->nullOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->nullOnDelete();
            $table->string('merchant_reference_number')->unique()->comment('Referencia bancaria única REF-CODE-ID');
            $table->string('cybersource_request_id')->nullable()->comment('RID de 22 dígitos para Auditoría');
            $table->string('eci_raw', 30)->nullable()->comment('Resultado 3DS2 (05/02/spa)');
            $table->text('cavv_raw')->nullable()->comment('Token criptográfico 3DS2');
            $table->decimal('amount', 12, 2);
            $table->decimal('saas_fee_amount', 12, 2)->default(0.00)->comment('Monto comisión SaaS (2%)');
            $table->decimal('atc_fee_estimated_amount', 12, 2)->default(0.00)->comment('Monto estimado comisión ATC (2.45%)');
            $table->decimal('net_estimated_to_foundation', 12, 2)->default(0.00)->comment('Monto neto estimado a la fundación');
            $table->string('currency', 3)->default('BOB');
            $table->string('payment_method', 20)->comment('card, qr');
            $table->string('donation_type', 30)->comment('single, subscription_recurring, subscription_initial');
            $table->string('status', 20)->default('pending')->comment('pending, completed, failed, refunded');
            $table->boolean('is_anonymous')->default(false);
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->jsonb('raw_gateway_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        // 5. Tabla de Facturación y Comisiones SaaS
        Schema::create('tenant_billing_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('foundation_id')->constrained('foundations')->cascadeOnDelete();
            $table->foreignId('donation_id')->nullable()->constrained('donations')->nullOnDelete();
            $table->decimal('gross_amount', 12, 2);
            $table->decimal('saas_fee_percentage', 5, 2)->default(2.00);
            $table->decimal('saas_fee_amount', 12, 2);
            $table->string('billing_period', 7)->comment('Formato: YYYY-MM');
            $table->string('status', 20)->default('pending')->comment('pending, invoiced, paid');
            $table->string('payment_reference')->nullable()->comment('Referencia del cobro de comisión SaaS');
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Índices de Rendimiento Críticos
        Schema::table('donations', function (Blueprint $table) {
            $table->index(['foundation_id', 'created_at'], 'idx_donations_foundation_date');
            $table->index('merchant_reference_number', 'idx_donations_merchant_ref');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->index(['status', 'next_billing_date'], 'idx_subscriptions_billing');
        });

        Schema::table('tenant_billing_ledgers', function (Blueprint $table) {
            $table->index(['foundation_id', 'billing_period'], 'idx_billing_tenant_period');
        });

        // Habilitar Row Level Security (RLS) en PostgreSQL si el driver es pgsql
        if (DB::getDriverName() === 'pgsql') {
            $tables = ['campaigns', 'donors', 'subscriptions', 'donations', 'tenant_billing_ledgers'];

            foreach ($tables as $tableName) {
                DB::statement("ALTER TABLE {$tableName} ENABLE ROW LEVEL SECURITY;");
                DB::statement("
                    CREATE POLICY tenant_isolation_{$tableName} ON {$tableName}
                    FOR ALL USING (foundation_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);
                ");
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            $tables = ['campaigns', 'donors', 'subscriptions', 'donations', 'tenant_billing_ledgers'];
            foreach ($tables as $tableName) {
                DB::statement("DROP POLICY IF EXISTS tenant_isolation_{$tableName} ON {$tableName};");
                DB::statement("ALTER TABLE {$tableName} DISABLE ROW LEVEL SECURITY;");
            }
        }

        Schema::dropIfExists('tenant_billing_ledgers');
        Schema::dropIfExists('donations');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('donors');
        Schema::dropIfExists('campaigns');
    }
};
