<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Subscription extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'foundation_id',
        'donor_id',
        'campaign_id',
        'amount',
        'currency',
        'tms_customer_id',
        'tms_payment_instrument_id',
        'card_last_four',
        'card_brand',
        'billing_day_of_month',
        'next_billing_date',
        'last_billed_at',
        'cancelled_at',
        'cancellation_reason',
        'status',
        'failed_attempts_count',
        'reactivation_token',
        'reactivation_token_expires_at',
        'ip_address',
        'user_agent',
        'accepted_terms_at',
    ];

    protected $casts = [
        'amount'                        => 'decimal:2',
        'billing_day_of_month'          => 'integer',
        'next_billing_date'             => 'date',
        'last_billed_at'                => 'datetime',
        'cancelled_at'                  => 'datetime',
        'failed_attempts_count'         => 'integer',
        'reactivation_token_expires_at' => 'datetime',
        'accepted_terms_at'             => 'datetime',
    ];

    public function donor(): BelongsTo
    {
        return $this->belongsTo(Donor::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function donations(): HasMany
    {
        return $this->hasMany(Donation::class);
    }

    /**
     * Genera o reutiliza un token de reactivación seguro de 72 horas.
     */
    public function getOrGenerateReactivationToken(): string
    {
        if (
            $this->reactivation_token &&
            $this->reactivation_token_expires_at &&
            $this->reactivation_token_expires_at->isFuture()
        ) {
            return (string) $this->reactivation_token;
        }

        $token = (string) Str::uuid();
        $this->update([
            'reactivation_token'            => $token,
            'reactivation_token_expires_at' => now()->addHours(72),
        ]);

        return $token;
    }
}
