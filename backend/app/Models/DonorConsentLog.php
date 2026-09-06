<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DonorConsentLog extends Model
{
    use HasFactory, BelongsToTenant;

    protected $table = 'donor_consent_logs';

    protected $fillable = [
        'foundation_id',
        'donor_id',
        'donation_id',
        'merchant_reference_number',
        'ip_address',
        'user_agent',
        'tos_version',
        'privacy_policy_version',
        'consent_given_at',
        'consent_signature_hash',
    ];

    protected $casts = [
        'consent_given_at' => 'datetime',
    ];

    public function foundation(): BelongsTo
    {
        return $this->belongsTo(Foundation::class);
    }

    public function donor(): BelongsTo
    {
        return $this->belongsTo(Donor::class);
    }

    public function donation(): BelongsTo
    {
        return $this->belongsTo(Donation::class);
    }
}
