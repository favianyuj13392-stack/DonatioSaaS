<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use App\Models\Foundation;
use App\Models\TenantBillingLedger;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\View\View;

class BillingProformaController extends Controller
{
    /**
     * Genera la vista formal de Proforma de Liquidación Mensual para impresión o exportación PDF.
     */
    public function show(Request $request, string $period, int $foundationId): View
    {
        $foundation = Foundation::findOrFail($foundationId);
        $periodDate = Carbon::createFromFormat('Y-m', $period);
        $periodName = $periodDate->locale('es')->isoFormat('MMMM YYYY');
        $proformaNumber = 'PRF-' . $periodDate->format('Ym') . '-' . ($foundation->code ?: 'TENANT' . $foundation->id);

        $rateService = app(\App\Services\ExchangeRate\ExchangeRateService::class);
        $periodEndDate = $periodDate->copy()->endOfMonth()->toDateString();
        $confirmedRate = $rateService->getConfirmedRateForDate($periodEndDate, 'USD/BOB') ?: $rateService->getLatestConfirmedRate('USD/BOB');
        $exchangeRate = $confirmedRate ? (float) $confirmedRate->sell_rate : $rateService->getCurrentSellRate('USD/BOB');

        $donations = Donation::withoutGlobalScopes()
            ->where('foundation_id', $foundation->id)
            ->where('status', 'completed')
            ->whereRaw("to_char(paid_at, 'YYYY-MM') = ?", [$period])
            ->get();

        $cardDonations = $donations->where('payment_method', 'card');
        $qrDonations = $donations->where('payment_method', 'qr');

        // Cálculo Tarjetas
        $cardGrossBob = $cardDonations->sum(function ($d) use ($exchangeRate) {
            return $d->currency === 'USD' ? ((float) $d->amount * $exchangeRate) : (float) $d->amount;
        });
        $cardSaasFeeBob = $cardDonations->sum(function ($d) use ($exchangeRate) {
            return $d->currency === 'USD' ? ((float) $d->saas_fee_amount * $exchangeRate) : (float) $d->saas_fee_amount;
        });

        // Cálculo QR
        $qrGrossBob = $qrDonations->sum(function ($d) use ($exchangeRate) {
            return $d->currency === 'USD' ? ((float) $d->amount * $exchangeRate) : (float) $d->amount;
        });
        $qrSaasFeeBob = $qrDonations->sum(function ($d) use ($exchangeRate) {
            return $d->currency === 'USD' ? ((float) $d->saas_fee_amount * $exchangeRate) : (float) $d->saas_fee_amount;
        });

        // Totales consolidados
        $totalGrossBob = $cardGrossBob + $qrGrossBob;
        $totalSaasFeeBob = $cardSaasFeeBob + $qrSaasFeeBob;
        $totalAtcFeeBob = $donations->sum(function ($d) use ($exchangeRate) {
            return $d->currency === 'USD' ? ((float) $d->atc_fee_estimated_amount * $exchangeRate) : (float) $d->atc_fee_estimated_amount;
        });

        // Comprobar si todas las cuotas de este período fueron marcadas como pagadas
        $pendingCount = TenantBillingLedger::where('foundation_id', $foundation->id)
            ->where('billing_period', $period)
            ->where('status', 'pending')
            ->count();

        $isPaid = ($donations->count() > 0 && $pendingCount === 0);

        return view('billing.proforma-invoice', [
            'foundation'      => $foundation,
            'period'          => $period,
            'periodName'      => ucfirst($periodName),
            'proformaNumber'  => $proformaNumber,
            'donationsCount'  => $donations->count(),
            'exchangeRate'    => $exchangeRate,
            'cardCount'       => $cardDonations->count(),
            'cardGrossBob'    => $cardGrossBob,
            'cardSaasFeeBob'  => $cardSaasFeeBob,
            'qrCount'         => $qrDonations->count(),
            'qrGrossBob'      => $qrGrossBob,
            'qrSaasFeeBob'    => $qrSaasFeeBob,
            'totalGrossBob'   => $totalGrossBob,
            'totalSaasFeeBob' => $totalSaasFeeBob,
            'totalAtcFeeBob'  => $totalAtcFeeBob,
            'isPaid'          => $isPaid,
        ]);
    }
}
