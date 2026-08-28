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
            if (!Schema::hasColumn('foundations', 'about_text')) {
                $table->text('about_text')->nullable()->after('vision');
            }
            if (!Schema::hasColumn('foundations', 'values')) {
                $table->jsonb('values')->nullable()->after('about_text');
            }
            if (!Schema::hasColumn('foundations', 'programs')) {
                $table->jsonb('programs')->nullable()->after('values');
            }
            if (!Schema::hasColumn('foundations', 'hero_headline')) {
                $table->string('hero_headline', 255)->nullable()->after('programs');
            }
            if (!Schema::hasColumn('foundations', 'hero_description')) {
                $table->text('hero_description')->nullable()->after('hero_headline');
            }
            if (!Schema::hasColumn('foundations', 'hero_image_url')) {
                $table->string('hero_image_url', 500)->nullable()->after('hero_description');
            }
            if (!Schema::hasColumn('foundations', 'hero_cta_text')) {
                $table->string('hero_cta_text', 100)->nullable()->after('hero_image_url');
            }
            if (!Schema::hasColumn('foundations', 'hero_cta_url')) {
                $table->string('hero_cta_url', 255)->nullable()->after('hero_cta_text');
            }
            if (!Schema::hasColumn('foundations', 'testimonial')) {
                $table->jsonb('testimonial')->nullable()->after('corporate_partners');
            }
        });

        Schema::table('campaigns', function (Blueprint $table) {
            if (!Schema::hasColumn('campaigns', 'headline')) {
                $table->string('headline', 255)->nullable()->after('title');
            }
            if (!Schema::hasColumn('campaigns', 'story_image_url')) {
                $table->string('story_image_url', 500)->nullable()->after('story_markdown');
            }
            if (!Schema::hasColumn('campaigns', 'funds_breakdown')) {
                $table->jsonb('funds_breakdown')->nullable()->after('tangible_impact_items');
            }
            if (!Schema::hasColumn('campaigns', 'testimonial')) {
                $table->jsonb('testimonial')->nullable()->after('funds_breakdown');
            }
            if (!Schema::hasColumn('campaigns', 'monthly_label')) {
                $table->string('monthly_label', 100)->nullable()->after('allowed_frequencies');
            }
            if (!Schema::hasColumn('campaigns', 'single_label')) {
                $table->string('single_label', 100)->nullable()->after('monthly_label');
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
                'about_text', 'values', 'programs', 'hero_headline', 'hero_description',
                'hero_image_url', 'hero_cta_text', 'hero_cta_url', 'testimonial'
            ], fn ($c) => Schema::hasColumn('foundations', $c));
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });

        Schema::table('campaigns', function (Blueprint $table) {
            $cols = array_filter([
                'headline', 'story_image_url', 'funds_breakdown', 'testimonial',
                'monthly_label', 'single_label'
            ], fn ($c) => Schema::hasColumn('campaigns', $c));
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
