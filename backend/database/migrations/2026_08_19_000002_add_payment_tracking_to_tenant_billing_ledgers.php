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
        Schema::table('tenant_billing_ledgers', function (Blueprint $table) {
            $table->string('payment_reference')->nullable()->after('status');
            $table->timestamp('paid_at')->nullable()->after('payment_reference');
            $table->text('notes')->nullable()->after('paid_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenant_billing_ledgers', function (Blueprint $table) {
            $table->dropColumn(['payment_reference', 'paid_at', 'notes']);
        });
    }
};
