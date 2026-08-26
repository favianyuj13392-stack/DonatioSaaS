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
            $table->text('about_text')->nullable()->after('vision');
            $table->jsonb('values')->nullable()->after('about_text');
            $table->jsonb('programs')->nullable()->after('values');
            $table->string('hero_headline', 255)->nullable()->after('programs');
            $table->text('hero_description')->nullable()->after('hero_headline');
            $table->string('hero_image_url', 500)->nullable()->after('hero_description');
            $table->string('hero_cta_text', 100)->nullable()->after('hero_image_url');
            $table->string('hero_cta_url', 255)->nullable()->after('hero_cta_text');
            $table->jsonb('testimonial')->nullable()->after('corporate_partners');
        });

        Schema::table('campaigns', function (Blueprint $table) {
            $table->string('headline', 255)->nullable()->after('title');
            $table->string('story_image_url', 500)->nullable()->after('story_markdown');
            $table->jsonb('funds_breakdown')->nullable()->after('tangible_impact_items');
            $table->jsonb('testimonial')->nullable()->after('funds_breakdown');
            $table->string('monthly_label', 100)->nullable()->after('allowed_frequencies');
            $table->string('single_label', 100)->nullable()->after('monthly_label');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('foundations', function (Blueprint $table) {
            $table->dropColumn([
                'about_text',
                'values',
                'programs',
                'hero_headline',
                'hero_description',
                'hero_image_url',
                'hero_cta_text',
                'hero_cta_url',
                'testimonial',
            ]);
        });

        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn([
                'headline',
                'story_image_url',
                'funds_breakdown',
                'testimonial',
                'monthly_label',
                'single_label',
            ]);
        });
    }
};
