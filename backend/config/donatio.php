<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Tipo de Cambio Oficial (USD -> BOB)
    |--------------------------------------------------------------------------
    | Tipo de cambio oficial de referencia del Banco Central de Bolivia (BCB)
    | utilizado para la consolidación mensual y facturación fiscal ante el SIN.
    */
    'usd_exchange_rate' => env('USD_EXCHANGE_RATE', 6.96),

    /*
    |--------------------------------------------------------------------------
    | Tarifas SaaS por Defecto (%)
    |--------------------------------------------------------------------------
    */
    'default_saas_fee_card' => env('DEFAULT_SAAS_FEE_CARD', 2.00),
    'default_saas_fee_qr'   => env('DEFAULT_SAAS_FEE_QR', 2.00),

    /*
    |--------------------------------------------------------------------------
    | Aranceles Estimados de Red Enlace / Cybersource (%)
    |--------------------------------------------------------------------------
    */
    'default_atc_fee_card_est' => env('DEFAULT_ATC_FEE_CARD_EST', 2.45),
    'default_atc_fee_qr_est'   => env('DEFAULT_ATC_FEE_QR_EST', 1.00),
];
