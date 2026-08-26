<?php

namespace App\Http\Controllers\Api;

use App\Models\Subscription;
use App\Services\ATC\AtcCybersourceAdapter;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class SubscriptionReactivationController extends Controller
{
    /**
     * Valida un token de reactivación y retorna los datos del socio y estado de tarjeta guardada.
     * Endpoint: GET /api/v1/public/subscriptions/validate-reactivation/{token}
     */
    public function validate(string $token): JsonResponse
    {
        $subscription = Subscription::withoutGlobalScopes()
            ->where('reactivation_token', $token)
            ->with(['donor', 'campaign', 'foundation'])
            ->first();

        if (!$subscription) {
            return response()->json([
                'valid'   => false,
                'error'   => 'TokenNotFound',
                'message' => 'El enlace de reactivación no es válido o ya fue utilizado.',
            ], 404);
        }

        if ($subscription->reactivation_token_expires_at && $subscription->reactivation_token_expires_at->isPast()) {
            return response()->json([
                'valid'   => false,
                'error'   => 'TokenExpired',
                'message' => 'El enlace de reactivación ha expirado. Por favor, solicita uno nuevo.',
            ], 410);
        }

        $tenant = $subscription->foundation;

        return response()->json([
            'valid'           => true,
            'has_saved_card'  => !empty($subscription->tms_payment_instrument_id),
            'subscription_id' => $subscription->id,
            'amount'          => $subscription->amount,
            'currency'        => $subscription->currency,
            'card_last_four'  => $subscription->card_last_four,
            'card_brand'      => $subscription->card_brand,
            'donor_name'      => $subscription->donor->name ?? 'Socio',
            'donor_email'     => $subscription->donor->email ?? '',
            'campaign_title'  => $subscription->campaign->title ?? 'Socio General',
            'foundation'      => [
                'name'          => $tenant->name,
                'subdomain'     => $tenant->subdomain,
                'logo_url'      => $tenant->logo_url,
                'primary_color' => $tenant->primary_color,
            ],
        ]);
    }

    /**
     * Ejecuta la reactivación 1-Click con el token TMS guardado o actualiza tarjeta.
     * Endpoint: POST /api/v1/public/subscriptions/confirm-reactivation/{token}
     */
    public function confirm(Request $request, string $token, AtcCybersourceAdapter $gateway): JsonResponse
    {
        $subscription = Subscription::withoutGlobalScopes()
            ->where('reactivation_token', $token)
            ->with(['donor', 'foundation'])
            ->first();

        if (!$subscription || ($subscription->reactivation_token_expires_at && $subscription->reactivation_token_expires_at->isPast())) {
            return response()->json([
                'error'   => 'InvalidOrExpiredToken',
                'message' => 'El token de reactivación no es válido.',
            ], 400);
        }

        $tenant = $subscription->foundation;
        app()->instance('current_tenant', $tenant);
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.current_tenant_id = '{$tenant->id}'");
        }

        // Si el donante ingresó una nueva tarjeta en el formulario
        if ($request->filled('card_number')) {
            try {
                $tokenData = $gateway->tokenizeCard($tenant, [
                    'card_number'      => $request->input('card_number'),
                    'expiration_month' => $request->input('expiration_month'),
                    'expiration_year'  => $request->input('expiration_year'),
                    'cvv'              => $request->input('cvv'),
                    'donor_name'       => $subscription->donor->name,
                    'donor_email'      => $subscription->donor->email,
                ]);

                $subscription->update([
                    'tms_payment_instrument_id' => $tokenData['payment_instrument_id'],
                    'tms_customer_id'           => $tokenData['customer_id'] ?? $subscription->tms_customer_id,
                    'card_last_four'            => $tokenData['card_last_four'],
                    'card_brand'                => $tokenData['card_brand'],
                ]);
            } catch (Exception $e) {
                return response()->json([
                    'error'   => 'TokenizationFailed',
                    'message' => 'No se pudo actualizar la tarjeta: ' . $e->getMessage(),
                ], 422);
            }
        }

        // Reactivar la suscripción y limpiar token
        $subscription->update([
            'status'                        => 'active',
            'failed_attempts_count'         => 0,
            'next_billing_date'             => now()->toDateString(), // Cobrar en el siguiente ciclo
            'reactivation_token'            => null,
            'reactivation_token_expires_at' => null,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => '¡Tu suscripción mensual fue reactivada exitosamente! Gracias por tu apoyo continuo.',
        ]);
    }
}
