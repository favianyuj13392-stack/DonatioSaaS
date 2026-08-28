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
        if (!Schema::hasTable('exchange_rates')) {
            Schema::create('exchange_rates', function (Blueprint $table) {
                $table->id();
                $table->string('currency_pair', 10)->default('USD/BOB')->index();
                $table->decimal('buy_rate', 10, 4)->comment('Tipo de cambio oficial de compra BCB');
                $table->decimal('sell_rate', 10, 4)->comment('Tipo de cambio oficial de venta / tope BCB');
                $table->date('effective_date')->index()->comment('Fecha de vigencia oficial del BCB');
                $table->string('source', 50)->comment('BCB_CUCU, BCB_DOLARAPI, BCB_DIRECT, MANUAL_OVERRIDE');
                $table->boolean('is_fallback')->default(false);
                $table->jsonb('raw_payload')->nullable();
                $table->timestamps();

                $table->unique(['currency_pair', 'effective_date'], 'unique_currency_pair_effective_date');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exchange_rates');
    }
};
