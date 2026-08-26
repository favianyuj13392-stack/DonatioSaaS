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
            $table->string('legal_name', 255)->nullable()->after('name');
            $table->string('legal_id_details', 255)->nullable()->after('nit'); // Ej: "Personería Jurídica Nº 482/2018"
            $table->string('location_city', 100)->default('La Paz, Bolivia')->after('phone');
            $table->string('primary_color_hover', 20)->default('#be123c')->after('primary_color');
            $table->string('secondary_color', 20)->default('#0f172a')->after('primary_color_hover');
            $table->text('mission')->nullable()->after('secondary_color');
            $table->text('vision')->nullable()->after('mission');
            $table->jsonb('institutional_metrics')->nullable()->after('vision');
            $table->jsonb('corporate_partners')->nullable()->after('institutional_metrics');
        });

        Schema::table('campaigns', function (Blueprint $table) {
            $table->text('story_markdown')->nullable()->after('description');
            $table->jsonb('donation_tiers')->nullable()->after('current_amount');
            $table->jsonb('tangible_impact_items')->nullable()->after('donation_tiers');
            $table->text('thank_you_message')->nullable()->after('tangible_impact_items');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('foundations', function (Blueprint $table) {
            $table->dropColumn([
                'legal_name',
                'legal_id_details',
                'location_city',
                'primary_color_hover',
                'secondary_color',
                'mission',
                'vision',
                'institutional_metrics',
                'corporate_partners',
            ]);
        });

        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn([
                'story_markdown',
                'donation_tiers',
                'tangible_impact_items',
                'thank_you_message',
            ]);
        });
    }
};
