<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Enforces strict PostgreSQL Row Level Security (RLS) so that table owners (donatio_user)
     * cannot accidentally bypass tenant_isolation policies during queries.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            $tables = [
                'campaigns',
                'donors',
                'subscriptions',
                'donations',
                'tenant_billing_ledgers',
                'donor_consent_logs',
            ];

            foreach ($tables as $tableName) {
                DB::statement("ALTER TABLE {$tableName} FORCE ROW LEVEL SECURITY;");
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            $tables = [
                'campaigns',
                'donors',
                'subscriptions',
                'donations',
                'tenant_billing_ledgers',
                'donor_consent_logs',
            ];

            foreach ($tables as $tableName) {
                DB::statement("ALTER TABLE {$tableName} NO FORCE ROW LEVEL SECURITY;");
            }
        }
    }
};
