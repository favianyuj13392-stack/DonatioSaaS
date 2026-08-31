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
        Schema::table('foundations', function (Blueprint $table) {
            $table->text('atc_merchant_id')->nullable()->change();
            $table->text('atc_api_key_id')->nullable()->change();
            $table->text('atc_secret_key')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('foundations', function (Blueprint $table) {
            $table->text('atc_merchant_id')->nullable(false)->change();
            $table->text('atc_api_key_id')->nullable(false)->change();
            $table->text('atc_secret_key')->nullable(false)->change();
        });
    }
};
