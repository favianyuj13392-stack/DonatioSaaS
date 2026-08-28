<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExchangeRate extends Model
{
    use HasFactory;

    protected $table = 'exchange_rates';

    protected $fillable = [
        'currency_pair',
        'buy_rate',
        'sell_rate',
        'effective_date',
        'source',
        'is_fallback',
        'raw_payload',
    ];

    protected $casts = [
        'buy_rate'       => 'decimal:4',
        'sell_rate'      => 'decimal:4',
        'effective_date' => 'date',
        'is_fallback'    => 'boolean',
        'raw_payload'    => 'array',
    ];

    /**
     * Scope para obtener la última tasa oficial registrada para un par de divisas.
     */
    public function scopeLatestForPair(Builder $query, string $pair = 'USD/BOB'): Builder
    {
        return $query->where('currency_pair', $pair)
            ->orderByDesc('effective_date')
            ->orderByDesc('id');
    }

    /**
     * Scope para obtener la tasa vigente para una fecha específica.
     */
    public function scopeForDate(Builder $query, string $date, string $pair = 'USD/BOB'): Builder
    {
        return $query->where('currency_pair', $pair)
            ->where('effective_date', '<=', $date)
            ->orderByDesc('effective_date')
            ->orderByDesc('id');
    }
}
