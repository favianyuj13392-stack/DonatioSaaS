<?php

namespace App\Contracts;

use App\DTOs\ExchangeRateDto;

interface ExchangeRateProviderInterface
{
    /**
     * Consulta y extrae el tipo de cambio oficial del proveedor.
     * Retorna null si el proveedor falla o no responde dentro del timeout.
     */
    public function fetchRate(): ?ExchangeRateDto;

    /**
     * Retorna el identificador legible del proveedor (ej: BCB_CUCU, BCB_DOLARAPI).
     */
    public function getProviderName(): string;
}
