<?php

namespace App\Filament\Widgets;

use App\Models\Donation;
use App\Services\ExchangeRate\ExchangeRateService;
use Carbon\Carbon;
use Filament\Widgets\ChartWidget;

class DailyRevenueChart extends ChartWidget
{
    public function getHeading(): ?string
    {
        return (auth()->check() && !auth()->user()->isSuperAdmin())
            ? '📈 Recaudación Diaria de tu Fundación (Últimos 30 Días)'
            : '📈 Recaudación Diaria Global vs. Comisión SaaS (Últimos 30 Días)';
    }

    protected function getData(): array
    {
        $days = collect(range(29, 0))->map(function ($dayOffset) {
            return now()->subDays($dayOffset)->format('Y-m-d');
        });

        $query = Donation::withoutGlobalScopes()
            ->where('status', 'completed')
            ->where(function ($q) {
                $q->where('paid_at', '>=', now()->subDays(30)->startOfDay())
                  ->orWhere('created_at', '>=', now()->subDays(30)->startOfDay());
            });

        if (auth()->check() && !auth()->user()->isSuperAdmin()) {
            $query->where('foundation_id', auth()->user()->foundation_id);
        }

        $donations = $query->get();

        $dailyGmv = [];
        $dailySaasFee = [];
        $dailyNet = [];

        foreach ($days as $day) {
            $dayDonations = $donations->filter(function ($donation) use ($day) {
                $date = $donation->paid_at ? Carbon::parse($donation->paid_at)->format('Y-m-d') : Carbon::parse($donation->created_at)->format('Y-m-d');
                return $date === $day;
            });

            $gmv = $dayDonations->sum(function ($d) {
                return (float) ($d->amount_bob ?? $d->amount);
            });

            $saas = $dayDonations->sum(function ($d) {
                return (float) ($d->saas_fee_amount ?? 0.00);
            });

            $net = $dayDonations->sum(function ($d) {
                return (float) ($d->net_estimated_to_foundation ?? 0.00);
            });

            $dailyGmv[] = round($gmv, 2);
            $dailySaasFee[] = round($saas, 2);
            $dailyNet[] = round($net, 2);
        }

        $isSuperAdmin = auth()->check() && auth()->user()->isSuperAdmin();

        $datasets = $isSuperAdmin ? [
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
        ] : [
            [
                'label'           => 'Total Donado Bruto (BOB)',
                'data'            => $dailyGmv,
                'borderColor'     => '#2563eb',
                'backgroundColor' => 'rgba(37, 99, 235, 0.1)',
                'fill'            => true,
            ],
            [
                'label'           => 'Neto Recibido por Fundación (BOB)',
                'data'            => $dailyNet,
                'borderColor'     => '#10b981',
                'backgroundColor' => 'rgba(16, 185, 129, 0.2)',
                'fill'            => false,
            ],
        ];

        return [
            'datasets' => $datasets,
            'labels'   => $days->map(fn ($d) => Carbon::parse($d)->format('d/m'))->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }
}
