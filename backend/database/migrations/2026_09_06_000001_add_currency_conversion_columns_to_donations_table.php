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
        Schema::table('donations', function (Blueprint $table) {
            if (!Schema::hasColumn('donations', 'amount_bob')) {
                $table->decimal('amount_bob', 12, 2)->nullable()->after('amount')->comment('Monto inmutable en Bolivianos (moneda base)');
            }
            if (!Schema::hasColumn('donations', 'amount_usd')) {
                $table->decimal('amount_usd', 12, 2)->nullable()->after('amount_bob')->comment('Monto equivalente o nominal en Dólares');
            }
            if (!Schema::hasColumn('donations', 'exchange_rate_bcb')) {
                $table->decimal('exchange_rate_bcb', 10, 4)->nullable()->after('amount_usd')->comment('Tipo de cambio oficial BCB al momento del pago');
            }
        });

        // Backfill histórico de datos existentes
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                UPDATE donations
                SET 
                    exchange_rate_bcb = COALESCE(
                        (SELECT sell_rate FROM exchange_rates WHERE currency_pair = 'USD/BOB' AND effective_date <= COALESCE(donations.paid_at, donations.created_at)::date ORDER BY effective_date DESC, id DESC LIMIT 1),
                        11.9300
                    ),
                    amount_bob = CASE 
                        WHEN UPPER(currency) = 'USD' THEN ROUND(amount * COALESCE(
                            (SELECT sell_rate FROM exchange_rates WHERE currency_pair = 'USD/BOB' AND effective_date <= COALESCE(donations.paid_at, donations.created_at)::date ORDER BY effective_date DESC, id DESC LIMIT 1),
                            11.9300
                        ), 2)
                        ELSE amount 
                    END,
                    amount_usd = CASE 
                        WHEN UPPER(currency) = 'USD' THEN amount
                        ELSE ROUND(amount / COALESCE(
                            (SELECT sell_rate FROM exchange_rates WHERE currency_pair = 'USD/BOB' AND effective_date <= COALESCE(donations.paid_at, donations.created_at)::date ORDER BY effective_date DESC, id DESC LIMIT 1),
                            11.9300
                        ), 2)
                    END
                WHERE amount_bob IS NULL;
            ");
        } else {
            // Fallback para SQLite en tests locales
            DB::statement("
                UPDATE donations
                SET 
                    exchange_rate_bcb = 11.9300,
                    amount_bob = CASE WHEN currency = 'USD' THEN ROUND(amount * 11.9300, 2) ELSE amount END,
                    amount_usd = CASE WHEN currency = 'USD' THEN amount ELSE ROUND(amount / 11.9300, 2) END
                WHERE amount_bob IS NULL;
            ");
        }

        Schema::table('donations', function (Blueprint $table) {
            $table->index(['foundation_id', 'status', 'paid_at'], 'idx_donations_financial_lookup');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->dropIndex('idx_donations_financial_lookup');
            $cols = array_filter(['amount_bob', 'amount_usd', 'exchange_rate_bcb'], fn ($c) => Schema::hasColumn('donations', $c));
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
