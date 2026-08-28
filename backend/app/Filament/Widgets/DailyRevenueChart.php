<?php

namespace App\Filament\Widgets;

use App\Models\Donation;
use App\Services\ExchangeRate\ExchangeRateService;
use Carbon\Carbon;
use Filament\Widgets\ChartWidget;

class DailyRevenueChart extends ChartWidget
{
    protected static ?string $heading = '📈 Recaudación Diaria Global vs. Comisión SaaS (Últimos 30 Días)';
    protected static ?int $sort = 2;
    protected int | string | array $columnSpan = 'full';

    protected function getData(): array
    {
        $days = collect(range(29, 0))->map(function ($dayOffset) {
            return now()->subDays($dayOffset)->format('Y-m-d');
        });

        $donations = Donation::withoutGlobalScopes()
            ->where('status', 'completed')
            ->where(function ($q) {
                $q->where('paid_at', '>=', now()->subDays(30)->startOfDay())
                  ->orWhere('created_at', '>=', now()->subDays(30)->startOfDay());
            })
            ->get();

        $rateService = app(ExchangeRateService::class);
        $latestRate = $rateService->getLatestConfirmedRate('USD/BOB');
        $exchangeRate = $latestRate ? (float) $latestRate->sell_rate : $rateService->getCurrentSellRate('USD/BOB');

        $dailyGmv = [];
        $dailySaasFee = [];

        foreach ($days as $day) {
            $dayDonations = $donations->filter(function ($donation) use ($day) {
                $date = $donation->paid_at ? Carbon::parse($donation->paid_at)->format('Y-m-d') : Carbon::parse($donation->created_at)->format('Y-m-d');
                return $date === $day;
            });

            $gmv = $dayDonations->sum(function ($d) use ($exchangeRate) {
                return $d->currency === 'USD' ? ((float) $d->amount * $exchangeRate) : (float) $d->amount;
            });

            $saas = $dayDonations->sum(function ($d) use ($exchangeRate) {
                return $d->currency === 'USD' ? ((float) $d->saas_fee_amount * $exchangeRate) : (float) $d->saas_fee_amount;
            });

            $dailyGmv[] = round($gmv, 2);
            $dailySaasFee[] = round($saas, 2);
        }

        return [
            'datasets' => [
                [
                    'label'           => 'GMV Global Donado (BOB)',
                    'data'            => $dailyGmv,
                    'borderColor'     => '#2563eb',
                    'backgroundColor' => 'rgba(37, 99, 235, 0.1)',
                    'fill'            => true,
                ],
                [
                    'label'           => 'Comisión SaaS (BOB)',
                    'data'            => $dailySaasFee,
                    'borderColor'     => '#db2777',
                    'backgroundColor' => 'rgba(219, 39, 119, 0.2)',
                    'fill'            => false,
                ],
            ],
            'labels'   => $days->map(fn ($d) => Carbon::parse($d)->format('d/m'))->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }
}
