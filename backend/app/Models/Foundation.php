<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Foundation extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'legal_name',
        'subdomain',
        'code',
        'custom_domain',
        'contact_email',
        'phone',
        'location_city',
        'nit',
        'legal_id_details',
        'logo_url',
        'primary_color',
        'primary_color_hover',
        'secondary_color',
        'mission',
        'vision',
        'about_text',
        'values',
        'programs',
        'hero_headline',
        'hero_description',
        'hero_image_url',
        'hero_cta_text',
        'hero_cta_url',
        'institutional_metrics',
        'corporate_partners',
        'testimonial',
        'saas_fee_card',
        'saas_fee_qr',
        'atc_fee_card_est',
        'atc_fee_qr_est',
        'atc_merchant_id',
        'atc_api_key_id',
        'atc_secret_key',
        'atc_org_unit_id',
        'is_sandbox',
        'status',
    ];

    /**
     * Cifrado transparente AES-256 para credenciales bancarias (BYO-Merchant) y JSON arrays.
     */
    protected $casts = [
        'atc_merchant_id'       => 'encrypted',
        'atc_api_key_id'        => 'encrypted',
        'atc_secret_key'        => 'encrypted',
        'is_sandbox'            => 'boolean',
        'saas_fee_card'         => 'decimal:2',
        'saas_fee_qr'           => 'decimal:2',
        'atc_fee_card_est'      => 'decimal:2',
        'atc_fee_qr_est'        => 'decimal:2',
        'institutional_metrics' => 'array',
        'corporate_partners'    => 'array',
        'values'                => 'array',
        'programs'              => 'array',
        'testimonial'           => 'array',
    ];

    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class);
    }

    public function donors(): HasMany
    {
        return $this->hasMany(Donor::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function donations(): HasMany
    {
        return $this->hasMany(Donation::class);
    }

    public function billingLedgers(): HasMany
    {
        return $this->hasMany(TenantBillingLedger::class);
    }

    /**
     * Calcula el desglose financiero exacto de la donación.
     */
    public function calculateSettlement(float $amount, string $paymentMethod = 'card'): array
    {
        $saasRate = $paymentMethod === 'qr' ? ($this->saas_fee_qr ?? 2.00) : ($this->saas_fee_card ?? 2.00);
        $atcRate  = $paymentMethod === 'qr' ? ($this->atc_fee_qr_est ?? 1.00) : ($this->atc_fee_card_est ?? 2.45);

        $saasFee = round($amount * ($saasRate / 100), 2);
        $atcFee  = round($amount * ($atcRate / 100), 2);
        $netFoundation = round($amount - $saasFee - $atcFee, 2);

        return [
            'gross_amount'                => $amount,
            'saas_fee_rate'               => (float) $saasRate,
            'saas_fee_amount'             => $saasFee,
            'atc_fee_estimated_rate'      => (float) $atcRate,
            'atc_fee_estimated_amount'    => $atcFee,
            'net_estimated_to_foundation' => $netFoundation,
        ];
    }
}
