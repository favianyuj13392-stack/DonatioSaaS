<?php

namespace App\Filament\Widgets;

use App\Models\Foundation;
use Filament\Widgets\ChartWidget;

class TopFoundationsChart extends ChartWidget
{
    protected static ?string $heading = '📊 Top Fundaciones por Volumen Recaudado (Mes en Curso)';
    protected static ?int $sort = 3;
    protected int | string | array $columnSpan = 'full';

    protected function getData(): array
    {
        $currentMonth = now()->startOfMonth();
        $exchangeRate = (float) config('donatio.usd_exchange_rate', 6.96);

        $foundations = Foundation::with(['donations' => function ($q) use ($currentMonth) {
            $q->where('status', 'completed')->where('paid_at', '>=', $currentMonth);
        }])->get();

        $ranked = $foundations->map(function ($f) use ($exchangeRate) {
            $totalGmv = $f->donations->sum(function ($d) use ($exchangeRate) {
                return $d->currency === 'USD' ? ((float) $d->amount * $exchangeRate) : (float) $d->amount;
            });

            return [
                'name' => $f->name,
                'gmv'  => round($totalGmv, 2),
            ];
        })->sortByDesc('gmv')->take(5);

        return [
            'datasets' => [
                [
                    'label'           => 'Total Recaudado (BOB)',
                    'data'            => $ranked->pluck('gmv')->toArray(),
                    'backgroundColor' => [
                        '#db2777',
                        '#2563eb',
                        '#10b981',
                        '#f59e0b',
                        '#8b5cf6',
                    ],
                ],
            ],
            'labels'   => $ranked->pluck('name')->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }
}
