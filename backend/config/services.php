<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'donaciones' => [
        'monto_minimo_certificado' => env('DONATION_CERT_MIN_AMOUNT', 100),
    ],

    'atc' => [
        'merchant_id' => env('ATC_MERCHANT_ID', 'redenlace_000021'),
        'key_id'      => env('ATC_KEY_ID', '3ada8327-76bd-4ed9-9952-0e8288f6e212'),
        'secret_key'  => env('ATC_SECRET_KEY', '/zFZFhYflXW/P3BMzkULTcIuJhdcXCVD9SKJEo+fJXo='),
        'base_url'    => env('ATC_BASE_URL', 'https://apitest.cybersource.com'),
        'org_id'      => env('ATC_THREATMETRIX_ORG_ID', 'k8vif92e'),
    ],

    'bnb' => [
        'account_id' => env('BNB_ACCOUNT_ID'),
        'authorization_id' => env('BNB_AUTH_ID'),
        'dom_account_id' => env('BNB_DOM_ACCOUNT_ID'),
        'dom_authorization_id' => env('BNB_DOM_AUTHORIZATION_ID'),
        // Auth URL for QR Simple (shared auth server)
        'auth_url' => env('BNB_AUTH_URL', 'http://test.bnb.com.bo/ClientAuthentication.API/api/v1'),
        // Auth URL specific to Domiciliación (can differ from QR Simple in production)
        'dom_auth_url' => env('BNB_DOM_AUTH_URL', env('BNB_AUTH_URL', 'http://test.bnb.com.bo/ClientAuthentication.API/api/v1')),
        'qr_url' => env('BNB_QR_URL', 'http://test.bnb.com.bo/QRSimple.API/api/v1'),
        'dom_url' => env('BNB_DOM_URL', 'http://test.bnb.com.bo/DirectDebit/api'),
    ],
];
