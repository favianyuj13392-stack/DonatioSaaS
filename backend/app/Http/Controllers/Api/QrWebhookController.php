<?php

namespace App\Http\Controllers\Api;

use App\Models\Donation;
use App\Models\Foundation;
use App\Models\TenantBillingLedger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class QrWebhookController extends Controller
{
    /**
     * Webhook global multitenant de confirmación de cobros QR de ATC Red Enlace.
     * Endpoint: POST /api/v1/webhooks/qr-payment
     */
    public function handle(Request $request): JsonResponse
    {
        $merchantRef = $request->input('merchant_reference_number') ?? $request->input('reference');

        if (!$merchantRef) {
            return response()->json(['error' => 'Referencia bancaria faltante'], 400);
        }

        // Formato esperado: REF-{CODE}-{ID} (ej. REF-FNE-100293)
        $parts = explode('-', $merchantRef);

        if (count($parts) < 3 || $parts[0] !== 'REF') {
            return response()->json(['error' => 'Formato de referencia inválido'], 400);
        }

        $foundationCode = $parts[1];

        // 1. Resolver la fundación correspondiente
        $tenant = Foundation::where('code', $foundationCode)->where('status', 'active')->first();

        if (!$tenant) {
            return response()->json(['error' => 'Fundación no encontrada para la referencia'], 404);
        }

        // 2. Activar contexto RLS para este tenant
        app()->instance('current_tenant', $tenant);
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.current_tenant_id = '{$tenant->id}'");
        }

        // 3. Ejecutar transacción con Pessimistic Locking para prevenir Race Conditions en webhooks concurrentes
        return DB::transaction(function () use ($merchantRef, $request, $tenant) {
            $donation = Donation::where('merchant_reference_number', $merchantRef)
                ->lockForUpdate()
                ->first();

            if (!$donation) {
                return response()->json(['error' => 'Donación no encontrada'], 404);
            }

            // Idempotencia estricta: si ya fue procesada, responder inmediatamente sin duplicar registros contables
            if ($donation->status === 'completed') {
                return response()->json([
                    'status'  => 'already_processed',
                    'message' => 'Donación ya confirmada previamente',
                ]);
            }

            // 4. Actualizar estado de la donación
            $donation->update([
                'status'                 => 'completed',
                'paid_at'                => now(),
                'gateway_transaction_id' => $request->input('gateway_transaction_id') ?? $request->input('id'),
                'raw_gateway_response'   => $request->all(),
            ]);

            // Sumar al monto recaudado de la campaña si está asociada
            if ($donation->campaign_id && $donation->campaign) {
                $donation->campaign->increment('current_amount', $donation->amount);
            }

            // 5. Registrar la comisión SaaS en tenant_billing_ledgers (2%)
            $feePercentage = (float) ($tenant->saas_fee_qr ?? 2.00);
            $feeAmount = round(((float) $donation->amount * $feePercentage) / 100, 2);

            TenantBillingLedger::create([
                'foundation_id'       => $tenant->id,
                'donation_id'         => $donation->id,
                'gross_amount'        => $donation->amount,
                'saas_fee_percentage' => $feePercentage,
                'saas_fee_amount'     => $feeAmount,
                'billing_period'      => now()->format('Y-m'),
                'status'              => 'pending',
            ]);

            Log::info("Donación QR confirmada (Pessimistic Lock): {$merchantRef} para {$tenant->name}");

            return response()->json([
                'status'  => 'success',
                'message' => 'Pago QR confirmado exitosamente',
            ]);
        });
    }
}
