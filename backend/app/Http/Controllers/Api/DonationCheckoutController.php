<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Donation;
use App\Models\Donor;
use App\Models\DonorConsentLog;
use App\Models\Subscription;
use App\Models\TenantBillingLedger;
use App\Services\ATC\AtcCybersourceAdapter;
use App\Services\ATC\AtcQrService;
use App\Services\ExchangeRate\ExchangeRateService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;


class DonationCheckoutController extends Controller
{
    /**
     * Retorna la información pública de la fundación y la campaña.
     * Endpoint: GET /api/v1/public/tenants/{subdomain}/campaigns/{slug}
     */
    public function getPublicCampaign(Request $request, string $subdomain, string $slug = 'default'): JsonResponse
    {
        $tenant = app('current_tenant');

        $campaign = Campaign::where('slug', $slug)
            ->where('status', 'active')
            ->first();

        if (!$campaign) {
            $campaign = Campaign::where('status', 'active')->first();
        }

        if (!$campaign) {
            return response()->json(['error' => 'No hay campañas activas disponibles'], 404);
        }

        $data = [
            'tenant' => [
                'id'                    => $tenant->id,
                'name'                  => $tenant->name,
                'legal_name'            => $tenant->legal_name,
                'subdomain'             => $tenant->subdomain,
                'code'                  => $tenant->code,
                'nit'                   => $tenant->nit,
                'legal_id_details'      => $tenant->legal_id_details,
                'location_city'         => $tenant->location_city ?? 'La Paz, Bolivia',
                'logo_url'              => $tenant->logo_url,
                'primary_color'         => $tenant->primary_color ?? '#db2777',
                'primary_color_hover'   => $tenant->primary_color_hover ?? '#be185d',
                'secondary_color'       => $tenant->secondary_color ?? '#0f172a',
                'contact_email'         => $tenant->contact_email,
                'phone'                 => $tenant->phone,
                'mission'               => $tenant->mission,
                'vision'                => $tenant->vision,
                'institutional_metrics' => $tenant->institutional_metrics ?? [],
                'corporate_partners'    => $tenant->corporate_partners ?? [],
                'testimonial'           => $tenant->testimonial ?? null,
            ],
            'campaign' => [
                'id'                      => $campaign->id,
                'title'                   => $campaign->title,
                'slug'                    => $campaign->slug,
                'headline'                => $campaign->headline ?? null,
                'description'             => $campaign->description,
                'story_markdown'          => $campaign->story_markdown,
                'story_image_url'         => $campaign->story_image_url ?? null,
                'banner_url'              => $campaign->banner_url,
                'monetary_goal'           => (float) $campaign->monetary_goal,
                'current_amount'          => (float) $campaign->current_amount,
                'progress_percentage'     => $campaign->progress_percentage,
                'allowed_frequencies'     => $campaign->allowed_frequencies,
                'allowed_payment_methods' => $campaign->allowed_payment_methods,
                'allowed_currencies'      => $campaign->allowed_currencies ?? 'all',
                'donation_tiers'          => $campaign->donation_tiers ?? [],
                'tangible_impact_items'   => $campaign->tangible_impact_items ?? [],
                'funds_breakdown'         => $campaign->funds_breakdown ?? null,
                'testimonial'             => $campaign->testimonial ?? null,
                'thank_you_message'       => $campaign->thank_you_message,
                'monthly_label'           => $campaign->monthly_label ?? null,
                'single_label'            => $campaign->single_label ?? null,
                'status'                  => $campaign->status ?? 'active',
            ],
            'other_campaigns' => Campaign::where('foundation_id', $tenant->id)
                ->where('status', 'active')
                ->where('id', '!=', $campaign->id)
                ->get()
                ->map(fn ($c) => [
                    'id'                  => $c->id,
                    'title'               => $c->title,
                    'slug'                => $c->slug,
                    'description'         => $c->description,
                    'banner_url'          => $c->banner_url,
                    'monetary_goal'       => (float) $c->monetary_goal,
                    'current_amount'      => (float) $c->current_amount,
                    'progress_percentage' => $c->progress_percentage,
                ]),
        ];

        return response()->json($data)->withHeaders([
            'Cache-Control' => 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=600',
        ]);
    }

    /**
     * Paso 1: Inicia sesión 3DS2 para obtener JWT de Cardinal Cruise.
     * Endpoint: POST /api/v1/donations/3ds-setup
     */
    public function setup3ds(Request $request, AtcCybersourceAdapter $gateway): JsonResponse
    {
        $tenant = app('current_tenant');
        $referenceCode = 'REF-' . $tenant->code . '-' . time();

        try {
            $setupData = $gateway->setup3ds($tenant, array_merge($request->all(), [
                'merchant_reference_number' => $referenceCode,
            ]));

            return response()->json([
                'status'                    => 'success',
                'merchant_reference_number' => $referenceCode,
                'data'                      => $setupData,
            ]);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al iniciar 3DS2: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Paso 3: Evalúa enrolamiento 3DS2 del pagador (Check Enrollment).
     * Endpoint: POST /api/v1/donations/3ds-enrollment
     */
    public function check3dsEnrollment(Request $request, AtcCybersourceAdapter $gateway): JsonResponse
    {
        $tenant = app('current_tenant');
        $input = $request->all();
        if (isset($input['merchantReferenceNumber']) && !isset($input['merchant_reference_number'])) {
            $input['merchant_reference_number'] = $input['merchantReferenceNumber'];
        }
        if (isset($input['referenceId']) && !isset($input['reference_id'])) {
            $input['reference_id'] = $input['referenceId'];
        }
        if (isset($input['fingerprintSessionId']) && !isset($input['fingerprint_session_id'])) {
            $input['fingerprint_session_id'] = $input['fingerprintSessionId'];
        }
        if (isset($input['cardNumber']) && !isset($input['card_number'])) {
            $input['card_number'] = $input['cardNumber'];
        }
        if (isset($input['expirationMonth']) && !isset($input['expiration_month'])) {
            $input['expiration_month'] = $input['expirationMonth'];
        }
        if (isset($input['expirationYear']) && !isset($input['expiration_year'])) {
            $input['expiration_year'] = $input['expirationYear'];
        }
        if (isset($input['firstName']) && !isset($input['first_name'])) {
            $input['first_name'] = $input['firstName'];
        }
        if (isset($input['lastName']) && !isset($input['last_name'])) {
            $input['last_name'] = $input['lastName'];
        }
        if (isset($input['postalCode']) && !isset($input['postal_code'])) {
            $input['postal_code'] = $input['postalCode'];
        }
        if (isset($input['email']) && !isset($input['donor_email'])) {
            $input['donor_email'] = $input['email'];
        }

        try {
            $result = $gateway->checkEnrollment($tenant, $input);
            return response()->json($result);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error en evaluación 3DS2: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Paso 5: Valida la resolución del desafío Step-Up.
     * Endpoint: POST /api/v1/donations/3ds-validate
     */
    public function validate3dsChallenge(Request $request, AtcCybersourceAdapter $gateway): JsonResponse
    {
        $tenant = app('current_tenant');
        $input = $request->all();
        if (isset($input['authenticationTransactionId']) && !isset($input['authentication_transaction_id'])) {
            $input['authentication_transaction_id'] = $input['authenticationTransactionId'];
        }
        if (isset($input['merchantReferenceNumber']) && !isset($input['merchant_reference_number'])) {
            $input['merchant_reference_number'] = $input['merchantReferenceNumber'];
        }

        try {
            $result = $gateway->validateChallenge($tenant, $input);
            return response()->json($result);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al validar desafío 3DS: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Paso 6: Procesa la captura de pago de tarjeta (Única o Mensual Recurrente).
     * Endpoint: POST /api/v1/donations/checkout
     */
    public function checkout(Request $request, AtcCybersourceAdapter $gateway): JsonResponse
    {
        $tenant = app('current_tenant');

        // Normalizar parámetros camelCase y snake_case para compatibilidad total
        $input = $request->all();
        if (isset($input['merchantReferenceNumber']) && !isset($input['merchant_reference_number'])) {
            $input['merchant_reference_number'] = $input['merchantReferenceNumber'];
        }
        if (isset($input['cardNumber']) && !isset($input['card_number'])) {
            $input['card_number'] = $input['cardNumber'];
        }
        if (isset($input['expirationMonth']) && !isset($input['expiration_month'])) {
            $input['expiration_month'] = $input['expirationMonth'];
        }
        if (isset($input['expirationYear']) && !isset($input['expiration_year'])) {
            $input['expiration_year'] = $input['expirationYear'];
        }
        if (isset($input['fingerprintSessionId']) && !isset($input['fingerprint_session_id'])) {
            $input['fingerprint_session_id'] = $input['fingerprintSessionId'];
        }
        if (isset($input['authenticationTransactionId']) && !isset($input['authentication_transaction_id'])) {
            $input['authentication_transaction_id'] = $input['authenticationTransactionId'];
        }
        if (isset($input['threeDSServerTransactionId']) && !isset($input['three_ds_server_transaction_id'])) {
            $input['three_ds_server_transaction_id'] = $input['threeDSServerTransactionId'];
        }
        if (isset($input['postalCode']) && !isset($input['postal_code'])) {
            $input['postal_code'] = $input['postalCode'];
        }
        if (isset($input['firstName']) && !isset($input['first_name'])) {
            $input['first_name'] = $input['firstName'];
        }
        if (isset($input['lastName']) && !isset($input['last_name'])) {
            $input['last_name'] = $input['lastName'];
        }
        if (isset($input['email']) && !isset($input['donor_email'])) {
            $input['donor_email'] = $input['email'];
        }
        if (!isset($input['donor_name']) && (isset($input['first_name']) || isset($input['last_name']))) {
            $input['donor_name'] = trim(($input['first_name'] ?? '') . ' ' . ($input['last_name'] ?? ''));
        }
        if (isset($input['is_recurring']) && !isset($input['frequency'])) {
            $input['frequency'] = $input['is_recurring'] ? 'monthly' : 'single';
        }
        if (isset($input['frequency']) && $input['frequency'] === 'once') {
            $input['frequency'] = 'single';
        }
        $request->merge($input);

        $validated = $request->validate([
            'campaign_id'                    => 'nullable|exists:campaigns,id',
            'amount'                         => 'required|numeric|min:1',
            'currency'                       => 'nullable|string|size:3',
            'frequency'                      => 'required|in:single,monthly',
            'donor_name'                     => 'required_without:is_anonymous|nullable|string|max:255',
            'donor_email'                    => 'required_without:is_anonymous|nullable|email',
            'is_anonymous'                   => 'boolean',
            'merchant_reference_number'      => 'required|string',
            'card_number'                    => 'required_without:tms_payment_instrument_id|string',
            'expiration_month'               => 'required_without:tms_payment_instrument_id|string',
            'expiration_year'                => 'required_without:tms_payment_instrument_id|string',
            'cvv'                            => 'nullable|string',
            'country'                        => 'nullable|string',
            'state'                          => 'nullable|string',
            'locality'                       => 'nullable|string',
            'address1'                       => 'nullable|string',
            'postal_code'                    => 'nullable|string',
            'fingerprint_session_id'         => 'nullable|string',
            'authentication_transaction_id'  => 'nullable|string',
            'cavv'                           => 'nullable|string',
            'eci_raw'                        => 'nullable|string',
            'xid'                            => 'nullable|string',
            'three_ds_server_transaction_id' => 'nullable|string',
            'accepted_terms'                 => 'nullable|boolean',
            'utm_source'                     => 'nullable|string|max:255',
            'utm_medium'                     => 'nullable|string|max:255',
            'utm_campaign'                   => 'nullable|string|max:255',
            'utm_content'                    => 'nullable|string|max:255',
        ]);

        $merchantRef = $validated['merchant_reference_number'];
        $lock = Cache::lock("checkout:lock:{$merchantRef}", 45);

        if (!$lock->get()) {
            return response()->json([
                'error'   => 'Transacción en proceso. Por favor espere.',
                'message' => 'Transacción en proceso. Por favor espere.',
            ], 409);
        }

        try {
            $existingDonation = Donation::where('merchant_reference_number', $merchantRef)->first();
            if ($existingDonation && $existingDonation->status === 'completed') {
                return response()->json([
                    'status'                    => 'already_completed',
                    'message'                   => 'Esta donación ya fue procesada anteriormente.',
                    'donation_id'               => $existingDonation->id,
                    'merchant_reference_number' => $existingDonation->merchant_reference_number,
                    'receipt_url'               => URL::temporarySignedRoute(
                        'donations.receipt',
                        now()->addDays(30),
                        ['id' => $existingDonation->id]
                    ),
                ]);
            }

            // Validación estricta de restricciones contextuales de la campaña
            if (!empty($validated['campaign_id'])) {
                $campaign = Campaign::where('foundation_id', $tenant->id)->find($validated['campaign_id']);
                if ($campaign) {
                    if ($campaign->allowed_frequencies === 'monthly_only' && $validated['frequency'] !== 'monthly') {
                        return response()->json(['error' => 'Esta campaña solo admite donaciones mensuales recurrentes.'], 422);
                    }
                    if ($campaign->allowed_frequencies === 'single_only' && $validated['frequency'] !== 'single') {
                        return response()->json(['error' => 'Esta campaña solo admite donaciones únicas.'], 422);
                    }
                    $currency = strtoupper($validated['currency'] ?? 'BOB');
                    if ($campaign->allowed_currencies === 'bob_only' && $currency === 'USD') {
                        return response()->json(['error' => 'Esta campaña solo admite donaciones en Bolivianos (BOB).'], 422);
                    }
                    if ($campaign->allowed_currencies === 'usd_only' && $currency === 'BOB') {
                        return response()->json(['error' => 'Esta campaña solo admite donaciones en Dólares (USD).'], 422);
                    }
                    if ($campaign->allowed_payment_methods === 'qr_only') {
                        return response()->json(['error' => 'Esta campaña solo admite pagos vía QR.'], 422);
                    }
                }
            }

            $isAnonymous = $validated['is_anonymous'] ?? false;
            $donor = null;

            // 1. Crear o buscar Donante si no es anónimo
            if (!$isAnonymous && !empty($validated['donor_email'])) {
                $donor = Donor::firstOrCreate(
                    ['foundation_id' => $tenant->id, 'email' => $validated['donor_email']],
                    ['name' => $validated['donor_name'] ?? 'Donante', 'phone' => $request->input('donor_phone')]
                );
            }

            try {
                return DB::transaction(function () use ($validated, $tenant, $donor, $gateway, $isAnonymous, $request) {
                    // 1. Procesar captura en Cybersource (/pts/v2/payments) con TOKEN_CREATE automático si es recurrente
                    $paymentResult = $gateway->processCheckout($tenant, $validated);

                    if (($paymentResult['status'] ?? '') !== 'completed') {
                        throw new Exception('El banco rechazó la transacción de pago.');
                    }

                    $rawResponse = $paymentResult['raw_gateway_response'] ?? [];
                    $tokenInfo = $rawResponse['tokenInformation'] ?? [];
                    $paymentInstrumentId = $paymentResult['tms_payment_instrument_id']
                        ?? ($tokenInfo['instrumentIdentifier']['id'] ?? ($tokenInfo['paymentInstrument']['id'] ?? null));
                    $customerId = $paymentResult['tms_customer_id']
                        ?? ($tokenInfo['customer']['id'] ?? null);
                    $cardLastFour = substr($validated['card_number'] ?? '0000', -4);
                    $cardBrand = strtoupper($validated['card_type'] ?? 'VISA');

                    $subscription = null;

                    // 2. Si es recurrente, crear la Suscripción con el token TMS retornado por Cybersource
                    if ($validated['frequency'] === 'monthly') {
                        $subscription = Subscription::create([
                            'foundation_id'             => $tenant->id,
                            'donor_id'                  => $donor?->id,
                            'campaign_id'               => $validated['campaign_id'] ?? null,
                            'amount'                    => $validated['amount'],
                            'currency'                  => $validated['currency'] ?? 'BOB',
                            'tms_customer_id'           => $customerId,
                            'tms_payment_instrument_id' => $paymentInstrumentId,
                            'card_last_four'            => $cardLastFour,
                            'card_brand'                => $cardBrand,
                            'billing_day_of_month'      => (int) now()->format('d'),
                            'next_billing_date'         => now()->addMonth()->toDateString(),
                            'last_billed_at'            => now(),
                            'ip_address'                => $request->ip(),
                            'user_agent'                => $request->userAgent(),
                            'accepted_terms_at'         => now(),
                            'status'                    => 'active',
                        ]);
                    }

                    // 3. Obtener tipo de cambio oficial spot del BCB al momento exacto del cobro
                    $rateService = app(ExchangeRateService::class);
                    $rateBcb = $rateService->getCurrentSellRate('USD/BOB');

                    $currency = strtoupper($validated['currency'] ?? 'BOB');
                    $inputAmount = (float) $validated['amount'];

                    if ($currency === 'USD') {
                        $amountUsd = $inputAmount;
                        $amountBob = round($amountUsd * $rateBcb, 2);
                    } else {
                        $amountBob = $inputAmount;
                        $amountUsd = round($amountBob / $rateBcb, 2);
                    }

                    // 4. Calcular comisiones inmutables del tenant en base a la moneda nacional (BOB)
                    $settlement = $tenant->calculateSettlement($amountBob, 'card');

                    // Check if commissionable
                    $isCommissionable = false;
                    if (!empty($validated['utm_campaign'])) {
                        // For now we check if it has a utm_campaign, logic can be expanded
                        $isCommissionable = true;
                    }

                    // 5. Guardar Donación
                    $donation = Donation::create([
                        'foundation_id'               => $tenant->id,
                        'donor_id'                    => $donor?->id,
                        'campaign_id'                 => $validated['campaign_id'] ?? null,
                        'subscription_id'             => $subscription?->id,
                        'merchant_reference_number'   => $validated['merchant_reference_number'],
                        'cybersource_request_id'      => $paymentResult['cybersource_request_id'] ?? null,
                        'eci_raw'                     => $paymentResult['eci_raw'] ?? null,
                        'cavv_raw'                    => $paymentResult['cavv_raw'] ?? null,
                        'amount'                      => $inputAmount,
                        'amount_bob'                  => $amountBob,
                        'amount_usd'                  => $amountUsd,
                        'exchange_rate_bcb'           => $rateBcb,
                        'saas_fee_amount'             => $settlement['saas_fee_amount'],
                        'atc_fee_estimated_amount'    => $settlement['atc_fee_estimated_amount'],
                        'net_estimated_to_foundation' => $settlement['net_estimated_to_foundation'],
                        'currency'                    => $currency,
                        'payment_method'              => 'card',
                        'donation_type'               => $validated['frequency'] === 'monthly' ? 'subscription_initial' : 'single',
                        'status'                      => 'completed',
                        'utm_source'                  => $validated['utm_source'] ?? null,
                        'utm_medium'                  => $validated['utm_medium'] ?? null,
                        'utm_campaign'                => $validated['utm_campaign'] ?? null,
                        'utm_content'                 => $validated['utm_content'] ?? null,
                        'is_commissionable'           => $isCommissionable,
                        'is_anonymous'                => $isAnonymous,
                        'ip_address'                  => $request->ip(),
                        'user_agent'                  => $request->userAgent(),
                        'raw_gateway_response'        => $paymentResult['raw_gateway_response'] ?? null,
                        'paid_at'                     => now(),
                    ]);

                    // 6. Incrementar meta de campaña en moneda nacional (BOB)
                    if ($donation->campaign_id && $donation->campaign) {
                        $donation->campaign->increment('current_amount', $amountBob);
                    }

                    // 7. Registrar comisión SaaS en el ledger en base a BOB
                    $feePercentage = (float) ($tenant->saas_fee_card ?? config('donatio.default_saas_fee_card', 2.00));

                    TenantBillingLedger::create([
                        'foundation_id'       => $tenant->id,
                        'donation_id'         => $donation->id,
                        'gross_amount'        => $amountBob,
                        'saas_fee_percentage' => $feePercentage,
                        'saas_fee_amount'     => $settlement['saas_fee_amount'],
                        'billing_period'      => now()->format('Y-m'),
                        'status'              => 'pending',
                    ]);

                    // 8. Registrar auditoría criptográfica Clickwrap de no repudio
                    $consentPayload = implode('|', [
                        $tenant->id,
                        $donor?->id ?? 'ANON',
                        $donation->id,
                        $donation->merchant_reference_number,
                        $request->ip(),
                        substr($request->userAgent() ?? 'Unknown', 0, 150),
                        'v1.0-2026',
                        now()->toIso8601String(),
                        config('app.key'),
                    ]);

                    DonorConsentLog::create([
                        'foundation_id'             => $tenant->id,
                        'donor_id'                  => $donor?->id,
                        'donation_id'               => $donation->id,
                        'merchant_reference_number' => $donation->merchant_reference_number,
                        'ip_address'                => $request->ip(),
                        'user_agent'                => $request->userAgent() ?? 'Unknown',
                        'tos_version'               => 'v1.0-2026',
                        'privacy_policy_version'    => 'v1.0-2026',
                        'consent_given_at'          => now(),
                        'consent_signature_hash'    => hash('sha256', $consentPayload),
                    ]);

                    return response()->json([
                        'status'                    => 'success',
                        'message'                   => '¡Donación procesada exitosamente! Muchas gracias por tu generosidad.',
                        'donation_id'               => $donation->id,
                        'merchant_reference_number' => $donation->merchant_reference_number,
                        'receipt_url'               => URL::temporarySignedRoute(
                            'donations.receipt',
                            now()->addDays(30),
                            ['id' => $donation->id]
                        ),
                    ]);
                });
            } catch (Exception $e) {
                return response()->json([
                    'error'   => 'PaymentProcessingError',
                    'message' => $e->getMessage(),
                ], 422);
            }
        } finally {
            try {
                $lock->release();
            } catch (\Throwable $e) {
                // Ignore lock release failures
            }
        }
    }

    /**
     * Genera un código QR dinámico de ATC para donación express.
     * Endpoint: POST /api/v1/donations/qr-generate
     */
    public function generateQr(Request $request): JsonResponse
    {
        return response()->json([
            'error'  => 'Canal QR en pausa pendiente de certificación bancaria.',
            'status' => 'inactive',
        ], 503);

        $tenant = app('current_tenant');

        $validated = $request->validate([
            'campaign_id'    => 'nullable|exists:campaigns,id',
            'amount'         => 'required|numeric|min:1',
            'currency'       => 'nullable|string|size:3',
            'donor_name'     => 'nullable|string',
            'donor_email'    => 'nullable|email',
            'is_anonymous'   => 'boolean',
            'accepted_terms' => 'nullable|boolean',
            'utm_source'     => 'nullable|string|max:255',
            'utm_medium'     => 'nullable|string|max:255',
            'utm_campaign'   => 'nullable|string|max:255',
            'utm_content'    => 'nullable|string|max:255',
        ]);

        $donor = null;
        if (!($validated['is_anonymous'] ?? false) && !empty($validated['donor_email'])) {
            $donor = Donor::firstOrCreate(
                ['foundation_id' => $tenant->id, 'email' => $validated['donor_email']],
                ['name' => $validated['donor_name'] ?? 'Donante']
            );
        }

        $rateService = app(ExchangeRateService::class);
        $rateBcb = $rateService->getCurrentSellRate('USD/BOB');
        $amountBob = (float) $validated['amount'];
        $amountUsd = round($amountBob / $rateBcb, 2);

        // Pre-calcular comisiones de liquidación para QR (en BOB)
        $settlement = $tenant->calculateSettlement($amountBob, 'qr');

        // Check if commissionable
        $isCommissionable = false;
        if (!empty($validated['utm_campaign'])) {
            $isCommissionable = true;
        }

        // Crear donación pendiente inicial
        $donation = Donation::create([
            'foundation_id'               => $tenant->id,
            'donor_id'                    => $donor?->id,
            'campaign_id'                 => $validated['campaign_id'] ?? null,
            'merchant_reference_number'   => 'TEMP-' . uniqid(),
            'amount'                      => $amountBob,
            'amount_bob'                  => $amountBob,
            'amount_usd'                  => $amountUsd,
            'exchange_rate_bcb'           => $rateBcb,
            'saas_fee_amount'             => $settlement['saas_fee_amount'],
            'atc_fee_estimated_amount'    => $settlement['atc_fee_estimated_amount'],
            'net_estimated_to_foundation' => $settlement['net_estimated_to_foundation'],
            'currency'                    => 'BOB',
            'payment_method'              => 'qr',
            'donation_type'               => 'single',
            'status'                      => 'pending',
            'utm_source'                  => $validated['utm_source'] ?? null,
            'utm_medium'                  => $validated['utm_medium'] ?? null,
            'utm_campaign'                => $validated['utm_campaign'] ?? null,
            'utm_content'                 => $validated['utm_content'] ?? null,
            'is_commissionable'           => $isCommissionable,
            'is_anonymous'                => $validated['is_anonymous'] ?? false,
        ]);

        // Registrar auditoría criptográfica Clickwrap de no repudio para QR
        $consentPayload = implode('|', [
            $tenant->id,
            $donor?->id ?? 'ANON',
            $donation->id,
            $donation->merchant_reference_number,
            $request->ip(),
            substr($request->userAgent() ?? 'Unknown', 0, 150),
            'v1.0-2026',
            now()->toIso8601String(),
            config('app.key'),
        ]);

        DonorConsentLog::create([
            'foundation_id'             => $tenant->id,
            'donor_id'                  => $donor?->id,
            'donation_id'               => $donation->id,
            'merchant_reference_number' => $donation->merchant_reference_number,
            'ip_address'                => $request->ip(),
            'user_agent'                => $request->userAgent() ?? 'Unknown',
            'tos_version'               => 'v1.0-2026',
            'privacy_policy_version'    => 'v1.0-2026',
            'consent_given_at'          => now(),
            'consent_signature_hash'    => hash('sha256', $consentPayload),
        ]);

        $qrPayload = AtcQrService::generateQr($tenant, $donation);

        return response()->json([
            'donation_id' => $donation->id,
            'qr'          => $qrPayload,
        ]);
    }

    /**
     * Consulta el estado de pago del código QR (Polling cada 3s).
     * Endpoint: GET /api/v1/donations/{id}/qr-status
     */
    public function qrStatus(int $id): JsonResponse
    {
        $donation = Donation::findOrFail($id);

        return response()->json([
            'donation_id' => $donation->id,
            'status'      => $donation->status,
            'paid_at'     => $donation->paid_at,
            'receipt_url' => $donation->status === 'completed'
                ? URL::temporarySignedRoute('donations.receipt', now()->addDays(30), ['id' => $donation->id])
                : null,
        ]);
    }

    /**
     * POST/GET /api/v1/donations/stepup-return
     * Callback endpoint invocado por el iframe ACS de Cardinal Commerce tras completar el desafío 3DS2 OTP.
     */
    public function stepUpReturn(Request $request)
    {
        $payload = $request->all();
        \Illuminate\Support\Facades\Log::info('[ATC StepUp Return Callback Payload]:', $payload);

        $html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Step-Up Complete</title></head><body>'
            . '<script>'
            . 'try { window.parent.postMessage({ type: "STEP_UP_COMPLETED", payload: ' . json_encode($payload) . ' }, "*"); } catch(e) {}'
            . '</script>'
            . '<p style="font-family:sans-serif;text-align:center;color:#4B5563;margin-top:20px;">Autenticación completada con éxito. Procesando...</p>'
            . '</body></html>';

        return response($html, 200)
            ->header('Content-Type', 'text/html')
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            ->header('Access-Control-Allow-Headers', '*')
            ->header('Access-Control-Allow-Private-Network', 'true')
            ->header('X-Frame-Options', 'ALLOWALL')
            ->header('Content-Security-Policy', 'frame-ancestors *');
    }

    /**
     * Descarga o visualiza el Recibo Oficial de Donación en formato HTML / PDF.
     * Endpoint: GET /api/v1/donations/{id}/receipt
     */
    public function downloadReceipt(int $id)
    {
        $donation = Donation::withoutGlobalScopes()
            ->with(['foundation', 'donor', 'campaign'])
            ->findOrFail($id);

        return view('receipts.donation-receipt', [
            'donation'   => $donation,
            'foundation' => $donation->foundation,
            'donor'      => $donation->donor,
            'campaign'   => $donation->campaign,
        ]);
    }
}
