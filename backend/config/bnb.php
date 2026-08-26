<?php

return [
    // values taken from environment and meant to be cached via `php artisan config:cache`
    'account_id' => env('BNB_ACCOUNT_ID', ''),
    'authorization_id' => env('BNB_AUTH_ID', ''),
    'service_code' => env('BNB_SERVICE_CODE', ''),
    // Cast BNB_MOCK_MODE to boolean because env() returns string
    // Only 'true', '1', 'yes', 'on' are considered true; everything else is false
    'mock_mode' => filter_var(env('BNB_MOCK_MODE', 'false'), FILTER_VALIDATE_BOOLEAN),
];
