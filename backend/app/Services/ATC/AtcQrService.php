<?php

namespace App\Services\ATC;

use App\Models\Donation;
use App\Models\Foundation;

class AtcQrService
{
    /**
     * Genera un código QR dinámico de pago para ATC Red Enlace con prefijo multitenant.
     *
     * @param Foundation $tenant
     * @param Donation $donation
     * @return array ['qr_image_base64' => string, 'qr_raw_code' => string, 'expires_at' => string]
     */
    public static function generateQr(Foundation $tenant, Donation $donation): array
    {
        $merchantRef = "REF-{$tenant->code}-{$donation->id}";
        $donation->update(['merchant_reference_number' => $merchantRef]);

        // Simulación / Integración del payload QR de Red Enlace
        $qrData = [
            'merchantId'   => (string) $tenant->atc_merchant_id,
            'reference'    => $merchantRef,
            'amount'       => number_format((float) $donation->amount, 2, '.', ''),
            'currency'     => $donation->currency ?? 'BOB',
            'expiresAt'    => now()->addMinutes(10)->toIso8601String(),
        ];

        // En ambiente real se invoca la API QR de ATC o se construye el payload EMVCo
        $qrRawCode = 'ATCQR|' . base64_encode(json_encode($qrData));
        $qrImageBase64 = 'data:image/svg+xml;base64,' . base64_encode(
            '<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 250 250"><rect width="250" height="250" fill="#ffffff"/><text x="50%" y="45%" text-anchor="middle" font-family="Arial" font-size="14" fill="#111827">QR ATC Red Enlace</text><text x="50%" y="60%" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="' . $tenant->primary_color . '">' . $donation->currency . ' ' . $donation->amount . '</text><text x="50%" y="75%" text-anchor="middle" font-family="Arial" font-size="11" fill="#6b7280">' . $merchantRef . '</text></svg>'
        );

        return [
            'merchant_reference_number' => $merchantRef,
            'qr_image_url'              => $qrImageBase64,
            'qr_raw_code'               => $qrRawCode,
            'expires_at'                => now()->addMinutes(10)->toISOString(),
        ];
    }
}
