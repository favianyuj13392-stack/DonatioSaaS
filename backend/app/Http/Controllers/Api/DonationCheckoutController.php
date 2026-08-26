<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Donation;
use App\Models\Donor;
use App\Models\Subscription;
use App\Models\TenantBillingLedger;
use App\Services\ATC\AtcCybersourceAdapter;
use App\Services\ATC\AtcQrService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        try {
            $result = $gateway->checkEnrollment($tenant, $request->all());
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

        try {
            $result = $gateway->validateChallenge($tenant, $request->all());
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
        ]);

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
                $subscription = null;
                $paymentInstrumentId = null;
                $cardLastFour = substr($validated['card_number'] ?? '0000', -4);
                $cardBrand = 'VISA';

                // 2. Si es suscripción mensual, tokenizar tarjeta en TMS
                if ($validated['frequency'] === 'monthly') {
                    $tokenData = $gateway->tokenizeCard($tenant, [
                        'card_number'      => $validated['card_number'],
                        'expiration_month' => $validated['expiration_month'],
                        'expiration_year'  => $validated['expiration_year'],
                        'cvv'              => $validated['cvv'] ?? null,
                        'donor_name'       => $validated['donor_name'] ?? 'Socio',
                        'donor_email'      => $validated['donor_email'] ?? 'socio@donatio.lat',
                        'country'          => $validated['country'] ?? 'BO',
                        'state'            => $validated['state'] ?? 'L',
                        'locality'         => $validated['locality'] ?? 'La Paz',
                        'address1'         => $validated['address1'] ?? 'Av. Principal 123',
                        'postal_code'      => $validated['postal_code'] ?? '0000',
                    ]);

                    $paymentInstrumentId = $tokenData['payment_instrument_id'];
                    $cardLastFour = $tokenData['card_last_four'];
                    $cardBrand = $tokenData['card_brand'];

                    $subscription = Subscription::create([
                        'foundation_id'             => $tenant->id,
                        'donor_id'                  => $donor?->id,
                        'campaign_id'               => $validated['campaign_id'] ?? null,
                        'amount'                    => $validated['amount'],
                        'currency'                  => $validated['currency'] ?? 'BOB',
                        'tms_customer_id'           => $tokenData['customer_id'] ?? null,
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

                // 3. Procesar captura en Cybersource
                $paymentResult = $gateway->processCheckout($tenant, array_merge($validated, [
                    'tms_payment_instrument_id' => $paymentInstrumentId,
                ]));

                if (($paymentResult['status'] ?? '') !== 'completed') {
                    throw new Exception('El banco rechazó la transacción de pago.');
                }

                // 4. Calcular comisiones inmutables del tenant
                $settlement = $tenant->calculateSettlement((float) $validated['amount'], 'card');

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
                    'amount'                      => $validated['amount'],
                    'saas_fee_amount'             => $settlement['saas_fee_amount'],
                    'atc_fee_estimated_amount'    => $settlement['atc_fee_estimated_amount'],
                    'net_estimated_to_foundation' => $settlement['net_estimated_to_foundation'],
                    'currency'                    => $validated['currency'] ?? 'BOB',
                    'payment_method'              => 'card',
                    'donation_type'               => $validated['frequency'] === 'monthly' ? 'subscription_initial' : 'single',
                    'status'                      => 'completed',
                    'is_anonymous'                => $isAnonymous,
                    'ip_address'                  => $request->ip(),
                    'user_agent'                  => $request->userAgent(),
                    'raw_gateway_response'        => $paymentResult['raw_gateway_response'] ?? null,
                    'paid_at'                     => now(),
                ]);

                // 6. Incrementar meta de campaña
                if ($donation->campaign_id && $donation->campaign) {
                    $donation->campaign->increment('current_amount', $donation->amount);
                }

                // 7. Registrar comisión SaaS en el ledger
                $feePercentage = (float) ($tenant->saas_fee_card ?? config('donatio.default_saas_fee_card', 2.00));

                TenantBillingLedger::create([
                    'foundation_id'       => $tenant->id,
                    'donation_id'         => $donation->id,
                    'gross_amount'        => $donation->amount,
                    'saas_fee_percentage' => $feePercentage,
                    'saas_fee_amount'     => $settlement['saas_fee_amount'],
                    'billing_period'      => now()->format('Y-m'),
                    'status'              => 'pending',
                ]);

                return response()->json([
                    'status'                    => 'success',
                    'message'                   => '¡Donación procesada exitosamente! Muchas gracias por tu generosidad.',
                    'donation_id'               => $donation->id,
                    'merchant_reference_number' => $donation->merchant_reference_number,
                    'receipt_url'               => url("/api/v1/donations/{$donation->id}/receipt"),
                ]);
            });
        } catch (Exception $e) {
            return response()->json([
                'error'   => 'PaymentProcessingError',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Genera un código QR dinámico de ATC para donación express.
     * Endpoint: POST /api/v1/donations/qr-generate
     */
    public function generateQr(Request $request): JsonResponse
    {
        $tenant = app('current_tenant');

        $validated = $request->validate([
            'campaign_id'  => 'nullable|exists:campaigns,id',
            'amount'       => 'required|numeric|min:1',
            'currency'     => 'nullable|string|size:3',
            'donor_name'   => 'nullable|string',
            'donor_email'  => 'nullable|email',
            'is_anonymous' => 'boolean',
        ]);

        $donor = null;
        if (!($validated['is_anonymous'] ?? false) && !empty($validated['donor_email'])) {
            $donor = Donor::firstOrCreate(
                ['foundation_id' => $tenant->id, 'email' => $validated['donor_email']],
                ['name' => $validated['donor_name'] ?? 'Donante']
            );
        }

        // Pre-calcular comisiones de liquidación para QR
        $settlement = $tenant->calculateSettlement((float) $validated['amount'], 'qr');

        // Crear donación pendiente inicial
        $donation = Donation::create([
            'foundation_id'               => $tenant->id,
            'donor_id'                    => $donor?->id,
            'campaign_id'                 => $validated['campaign_id'] ?? null,
            'merchant_reference_number'   => 'TEMP-' . uniqid(),
            'amount'                      => $validated['amount'],
            'saas_fee_amount'             => $settlement['saas_fee_amount'],
            'atc_fee_estimated_amount'    => $settlement['atc_fee_estimated_amount'],
            'net_estimated_to_foundation' => $settlement['net_estimated_to_foundation'],
            'currency'                    => $validated['currency'] ?? 'BOB',
            'payment_method'              => 'qr',
            'donation_type'               => 'single',
            'status'                      => 'pending',
            'is_anonymous'                => $validated['is_anonymous'] ?? false,
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
            'receipt_url' => $donation->status === 'completed' ? url("/api/v1/donations/{$donation->id}/receipt") : null,
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
            ->header('Access-Control-Allow-Private-Network', 'true');
    }
}
