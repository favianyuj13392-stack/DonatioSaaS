<?php

namespace App\Models\ATC;

use App\Models\Donor;
use App\Models\Foundation;
use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AtcPaymentProfile extends Model
{
    use HasFactory, BelongsToTenant;

    protected $table = 'atc_payment_profiles';

    protected $fillable = [
        'foundation_id',
        'donor_id',
        'customer_token',
        'payment_instrument_token',
        'card_type',
        'card_last4',
        'card_expiration_month',
        'card_expiration_year',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function foundation(): BelongsTo
    {
        return $this->belongsTo(Foundation::class);
    }

    public function donor(): BelongsTo
    {
        return $this->belongsTo(Donor::class);
    }
}
