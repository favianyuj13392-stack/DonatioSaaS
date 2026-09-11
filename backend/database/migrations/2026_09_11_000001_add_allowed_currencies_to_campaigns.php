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
        Schema::table('campaigns', function (Blueprint $table) {
            if (!Schema::hasColumn('campaigns', 'allowed_currencies')) {
                $table->string('allowed_currencies', 20)
                    ->default('all')
                    ->comment('all, bob_only, usd_only')
                    ->after('allowed_payment_methods');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            if (Schema::hasColumn('campaigns', 'allowed_currencies')) {
                $table->dropColumn('allowed_currencies');
            }
        });
    }
};
