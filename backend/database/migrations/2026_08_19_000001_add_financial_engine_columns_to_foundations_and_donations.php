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
        // 1. Modificar tabla foundations con aranceles configurables
        Schema::table('foundations', function (Blueprint $table) {
            if (!Schema::hasColumn('foundations', 'saas_fee_card')) {
                $table->decimal('saas_fee_card', 5, 2)->default(2.00)->after('primary_color');
            }
            if (!Schema::hasColumn('foundations', 'saas_fee_qr')) {
                $table->decimal('saas_fee_qr', 5, 2)->default(2.00)->after('saas_fee_card');
            }
            if (!Schema::hasColumn('foundations', 'atc_fee_card_est')) {
                $table->decimal('atc_fee_card_est', 5, 2)->default(2.45)->after('saas_fee_qr');
            }
            if (!Schema::hasColumn('foundations', 'atc_fee_qr_est')) {
                $table->decimal('atc_fee_qr_est', 5, 2)->default(1.00)->after('atc_fee_card_est');
            }
        });

        // 2. Modificar tabla donations con campos inmutables de liquidación
        Schema::table('donations', function (Blueprint $table) {
            if (!Schema::hasColumn('donations', 'saas_fee_amount')) {
                $table->decimal('saas_fee_amount', 12, 2)->default(0.00)->after('amount');
            }
            if (!Schema::hasColumn('donations', 'atc_fee_estimated_amount')) {
                $table->decimal('atc_fee_estimated_amount', 12, 2)->default(0.00)->after('saas_fee_amount');
            }
            if (!Schema::hasColumn('donations', 'net_estimated_to_foundation')) {
                $table->decimal('net_estimated_to_foundation', 12, 2)->default(0.00)->after('atc_fee_estimated_amount');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->dropColumn([
                'saas_fee_amount',
                'atc_fee_estimated_amount',
                'net_estimated_to_foundation',
            ]);
        });

        Schema::table('foundations', function (Blueprint $table) {
            $table->dropColumn([
                'saas_fee_card',
                'saas_fee_qr',
                'atc_fee_card_est',
                'atc_fee_qr_est',
            ]);
        });
    }
};
