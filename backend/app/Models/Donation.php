<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Donation extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'foundation_id',
        'donor_id',
        'campaign_id',
        'subscription_id',
        'merchant_reference_number',
        'cybersource_request_id',
        'eci_raw',
        'cavv_raw',
        'amount',
        'amount_bob',
        'amount_usd',
        'exchange_rate_bcb',
        'saas_fee_amount',
        'atc_fee_estimated_amount',
        'net_estimated_to_foundation',
        'currency',
        'payment_method',
        'donation_type',
        'status',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'is_commissionable',
        'is_anonymous',
        'ip_address',
        'user_agent',
        'raw_gateway_response',
        'paid_at',
    ];

    protected $casts = [
        'is_commissionable'           => 'boolean',
        'amount'                      => 'decimal:2',
        'amount_bob'                  => 'decimal:2',
        'amount_usd'                  => 'decimal:2',
        'exchange_rate_bcb'           => 'decimal:4',
        'saas_fee_amount'             => 'decimal:2',
        'atc_fee_estimated_amount'    => 'decimal:2',
        'net_estimated_to_foundation' => 'decimal:2',
        'is_anonymous'                => 'boolean',
        'raw_gateway_response'        => 'array',
        'paid_at'                     => 'datetime',
    ];

    public function donor(): BelongsTo
    {
        return $this->belongsTo(Donor::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function ledger(): HasOne
    {
        return $this->hasOne(TenantBillingLedger::class);
    }

    /**
     * Retorna el monto inmutable en Bolivianos (BOB).
     */
    public function getAmountInBobAttribute(): float
    {
        return (float) ($this->attributes['amount_bob'] ?? $this->amount);
    }

    /**
     * Retorna la comisión SaaS inmutable en Bolivianos (BOB).
     */
    public function getSaasFeeInBobAttribute(): float
    {
        return (float) ($this->attributes['saas_fee_amount'] ?? 0.00);
    }
}
