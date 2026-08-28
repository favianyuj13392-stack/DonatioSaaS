<?php

namespace App\DTOs;

readonly class ExchangeRateDto
{
    public function __construct(
        public float $buyRate,
        public float $sellRate,
        public string $effectiveDate,
        public string $source,
        public array $rawPayload = [],
        public string $currencyPair = 'USD/BOB',
    ) {}

    /**
     * Valida que las tasas estén dentro de un umbral realista para evitar datos corruptos.
     */
    public function isValidSanityRange(float $min = 6.80, float $max = 25.00): bool
    {
        return $this->buyRate >= $min
            && $this->buyRate <= $max
            && $this->sellRate >= $min
            && $this->sellRate <= $max
            && $this->sellRate >= $this->buyRate;
    }
}
