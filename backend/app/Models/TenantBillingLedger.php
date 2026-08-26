<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantBillingLedger extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'foundation_id',
        'donation_id',
        'gross_amount',
        'saas_fee_percentage',
        'saas_fee_amount',
        'billing_period',
        'status',
        'payment_reference',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'gross_amount'        => 'decimal:2',
        'saas_fee_percentage' => 'decimal:2',
        'saas_fee_amount'     => 'decimal:2',
        'paid_at'             => 'datetime',
    ];

    public function foundation(): BelongsTo
    {
        return $this->belongsTo(Foundation::class);
    }

    public function donation(): BelongsTo
    {
        return $this->belongsTo(Donation::class);
    }
}
