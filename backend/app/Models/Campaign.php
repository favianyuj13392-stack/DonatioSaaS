<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campaign extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'foundation_id',
        'title',
        'slug',
        'headline',
        'description',
        'story_markdown',
        'story_image_url',
        'banner_url',
        'monetary_goal',
        'current_amount',
        'donation_tiers',
        'tangible_impact_items',
        'funds_breakdown',
        'testimonial',
        'thank_you_message',
        'allowed_frequencies',
        'allowed_payment_methods',
        'allowed_currencies',
        'monthly_label',
        'single_label',
        'start_date',
        'end_date',
        'status',
    ];

    protected $casts = [
        'monetary_goal'         => 'decimal:2',
        'current_amount'        => 'decimal:2',
        'donation_tiers'        => 'array',
        'tangible_impact_items' => 'array',
        'funds_breakdown'       => 'array',
        'testimonial'           => 'array',
        'start_date'            => 'date',
        'end_date'              => 'date',
    ];

    public function donations(): HasMany
    {
        return $this->hasMany(Donation::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Calcula el porcentaje de recaudación frente a la meta.
     */
    public function getProgressPercentageAttribute(): float
    {
        if ($this->monetary_goal <= 0) {
            return 0.0;
        }

        return min(100.0, round(($this->current_amount / $this->monetary_goal) * 100, 2));
    }

    /**
     * Accessor para asegurar que donation_tiers siempre devuelva una estructura segregada ['bob' => [...], 'usd' => [...]].
     */
    public function getDonationTiersAttribute($value): array
    {
        $defaultTiers = [
            'bob' => [
                ['amount' => 50, 'label' => 'Aporte de apoyo continuo', 'is_default' => false],
                ['amount' => 100, 'label' => 'Aporte de alto impacto', 'is_default' => true],
                ['amount' => 200, 'label' => 'Aporte padrino solidario', 'is_default' => false],
            ],
            'usd' => [
                ['amount' => 10, 'label' => 'Aporte internacional inicial', 'is_default' => false],
                ['amount' => 25, 'label' => 'Aporte de alto impacto global', 'is_default' => true],
                ['amount' => 50, 'label' => 'Aporte protector de la causa', 'is_default' => false],
                ['amount' => 100, 'label' => 'Aporte padrino internacional', 'is_default' => false],
            ],
        ];

        if (empty($value)) {
            return $defaultTiers;
        }

        $decoded = is_string($value) ? json_decode($value, true) : $value;
        if (!is_array($decoded)) {
            return $defaultTiers;
        }

        if (isset($decoded['bob']) || isset($decoded['usd'])) {
            return [
                'bob' => !empty($decoded['bob']) ? $decoded['bob'] : $defaultTiers['bob'],
                'usd' => !empty($decoded['usd']) ? $decoded['usd'] : $defaultTiers['usd'],
            ];
        }

        // Compatibilidad con formato plano heredado en BOB
        return [
            'bob' => $decoded,
            'usd' => $defaultTiers['usd'],
        ];
    }

    /**
     * Retorna los tiers organizados por moneda ('bob' y 'usd').
     */
    public function getStructuredTiers(): array
    {
        return $this->donation_tiers;
    }
}
