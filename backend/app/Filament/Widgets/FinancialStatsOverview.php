<?php

namespace App\Filament\Widgets;

use App\Models\Donation;
use App\Models\Foundation;
use App\Models\Subscription;
use App\Models\TenantBillingLedger;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class FinancialStatsOverview extends BaseWidget
{
    protected static ?int $sort = 1;
    protected static ?string $pollingInterval = '15s';

    protected function getStats(): array
    {
        $currentMonth = now()->startOfMonth();

        // 1. GMV Total del Mes (Agrupado por moneda)
        $bobGmv = (float) Donation::where('status', 'completed')
            ->where('currency', 'BOB')
            ->where('paid_at', '>=', $currentMonth)
            ->sum('amount');

        $usdGmv = (float) Donation::where('status', 'completed')
            ->where('currency', 'USD')
            ->where('paid_at', '>=', $currentMonth)
            ->sum('amount');

        $exchangeRate = (float) config('donatio.usd_exchange_rate', 6.96);
        $totalGmvBobEquiv = $bobGmv + ($usdGmv * $exchangeRate);

        // 2. Comisión SaaS (Tu 2% del Mes en BOB)
        $saasFeeBob = (float) Donation::where('status', 'completed')
            ->where('currency', 'BOB')
            ->where('paid_at', '>=', $currentMonth)
            ->sum('saas_fee_amount');

        $saasFeeUsd = (float) Donation::where('status', 'completed')
            ->where('currency', 'USD')
            ->where('paid_at', '>=', $currentMonth)
            ->sum('saas_fee_amount');

        $totalSaasRevenueBob = $saasFeeBob + ($saasFeeUsd * $exchangeRate);

        // 3. Estado de Cobranza (Comisiones pendientes en ledgers)
        $pendingCollectionBob = (float) TenantBillingLedger::where('status', 'pending')->sum('saas_fee_amount');

        // 4. Fundaciones Activas vs Suspendidas
        $activeFoundations = Foundation::where('status', 'active')->count();
        $totalFoundations = Foundation::count();

        // 5. Socios Recurrentes Totales en Cybersource TMS
        $activeSubscribers = Subscription::where('status', 'active')->count();

        return [
            Stat::make('GMV Total Mes (Gross Volume)', 'Bs. ' . number_format($totalGmvBobEquiv, 2))
                ->description("Desglose: Bs. " . number_format($bobGmv, 2) . " + $" . number_format($usdGmv, 2) . " USD")
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->color('success'),

            Stat::make('Tu Comisión 2% (SaaS Revenue)', 'Bs. ' . number_format($totalSaasRevenueBob, 2))
                ->description('Ingreso neto facturable este mes')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('primary'),

            Stat::make('Pendiente de Cobro', 'Bs. ' . number_format($pendingCollectionBob, 2))
                ->description('Liquidaciones pendientes por facturar')
                ->descriptionIcon('heroicon-m-clock')
                ->color($pendingCollectionBob > 0 ? 'warning' : 'success'),

            Stat::make('Fundaciones Activas', "{$activeFoundations} / {$totalFoundations}")
                ->description('Tenants conectados en la red')
                ->descriptionIcon('heroicon-m-building-office-2')
                ->color('info'),

            Stat::make('Socios TMS Activos', number_format($activeSubscribers))
                ->description('Tarjetas tokenizadas con débito automático')
                ->descriptionIcon('heroicon-m-user-group')
                ->color('success'),
        ];
    }
}
