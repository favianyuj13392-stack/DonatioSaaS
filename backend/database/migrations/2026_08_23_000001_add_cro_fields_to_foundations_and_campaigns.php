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
            if (!Schema::hasColumn('foundations', 'legal_name')) {
                $table->string('legal_name', 255)->nullable()->after('name');
            }
            if (!Schema::hasColumn('foundations', 'legal_id_details')) {
                $table->string('legal_id_details', 255)->nullable()->after('nit');
            }
            if (!Schema::hasColumn('foundations', 'location_city')) {
                $table->string('location_city', 100)->default('La Paz, Bolivia')->after('phone');
            }
            if (!Schema::hasColumn('foundations', 'primary_color_hover')) {
                $table->string('primary_color_hover', 20)->default('#be123c')->after('primary_color');
            }
            if (!Schema::hasColumn('foundations', 'secondary_color')) {
                $table->string('secondary_color', 20)->default('#0f172a')->after('primary_color_hover');
            }
            if (!Schema::hasColumn('foundations', 'mission')) {
                $table->text('mission')->nullable()->after('secondary_color');
            }
            if (!Schema::hasColumn('foundations', 'vision')) {
                $table->text('vision')->nullable()->after('mission');
            }
            if (!Schema::hasColumn('foundations', 'institutional_metrics')) {
                $table->jsonb('institutional_metrics')->nullable()->after('vision');
            }
            if (!Schema::hasColumn('foundations', 'corporate_partners')) {
                $table->jsonb('corporate_partners')->nullable()->after('institutional_metrics');
            }
        });

        Schema::table('campaigns', function (Blueprint $table) {
            if (!Schema::hasColumn('campaigns', 'story_markdown')) {
                $table->text('story_markdown')->nullable()->after('description');
            }
            if (!Schema::hasColumn('campaigns', 'donation_tiers')) {
                $table->jsonb('donation_tiers')->nullable()->after('current_amount');
            }
            if (!Schema::hasColumn('campaigns', 'tangible_impact_items')) {
                $table->jsonb('tangible_impact_items')->nullable()->after('donation_tiers');
            }
            if (!Schema::hasColumn('campaigns', 'thank_you_message')) {
                $table->text('thank_you_message')->nullable()->after('tangible_impact_items');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('foundations', function (Blueprint $table) {
            $cols = array_filter([
                'legal_name', 'legal_id_details', 'location_city', 'primary_color_hover',
                'secondary_color', 'mission', 'vision', 'institutional_metrics', 'corporate_partners'
            ], fn ($c) => Schema::hasColumn('foundations', $c));
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });

        Schema::table('campaigns', function (Blueprint $table) {
            $cols = array_filter([
                'story_markdown', 'donation_tiers', 'tangible_impact_items', 'thank_you_message'
            ], fn ($c) => Schema::hasColumn('campaigns', $c));
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
