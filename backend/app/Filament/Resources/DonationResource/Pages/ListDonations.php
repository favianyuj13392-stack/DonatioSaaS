<?php

namespace App\Filament\Resources\DonationResource\Pages;

use App\Filament\Resources\DonationResource;
use App\Models\Donation;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ListDonations extends ListRecords
{
    protected static string $resource = DonationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('export_csv')
                ->label('📊 Exportar Excel / CSV')
                ->icon('heroicon-o-arrow-down-tray')
                ->color('success')
                ->action(function (): StreamedResponse {
                    $fileName = 'donaciones-globales-' . now()->format('Y-m-d-His') . '.csv';

                    return response()->streamDownload(function () {
                        $handle = fopen('php://output', 'w');

                        // UTF-8 BOM para apertura perfecta en Excel sin errores de tildes o caracteres
                        fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

                        // Encabezados
                        fputcsv($handle, [
                            'ID',
                            'Referencia Bancaria',
                            'Fundación (Tenant)',
                            'Donante',
                            'Email Donante',
                            'Monto Bruto',
                            'Moneda',
                            'Comisión SaaS (2%)',
                            'Arancel ATC Est.',
                            'Neto Fundación',
                            'Medio de Pago',
                            'Tipo de Donación',
                            'Estado',
                            'Fecha de Pago',
                        ]);

                        Donation::withoutGlobalScopes()
                            ->with(['foundation', 'donor'])
                            ->orderBy('created_at', 'desc')
                            ->chunk(200, function ($donations) use ($handle) {
                                foreach ($donations as $d) {
                                    fputcsv($handle, [
                                        $d->id,
                                        $d->merchant_reference_number,
                                        $d->foundation->name ?? 'N/A',
                                        $d->is_anonymous ? 'Donante Anónimo' : ($d->donor->name ?? 'Donante'),
                                        $d->is_anonymous ? 'N/A' : ($d->donor->email ?? 'N/A'),
                                        $d->amount,
                                        $d->currency,
                                        $d->saas_fee_amount,
                                        $d->atc_fee_estimated_amount,
                                        $d->net_estimated_to_foundation,
                                        $d->payment_method,
                                        $d->donation_type,
                                        $d->status,
                                        $d->paid_at ? $d->paid_at->format('Y-m-d H:i:s') : '',
                                    ]);
                                }
                            });

                        fclose($handle);
                    }, $fileName, [
                        'Content-Type'        => 'text/csv; charset=UTF-8',
                        'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
                    ]);
                }),
        ];
    }
}
