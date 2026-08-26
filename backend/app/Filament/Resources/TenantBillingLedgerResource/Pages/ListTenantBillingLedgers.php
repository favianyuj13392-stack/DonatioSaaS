<?php

namespace App\Filament\Resources\TenantBillingLedgerResource\Pages;

use App\Filament\Resources\TenantBillingLedgerResource;
use Filament\Actions;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Support\Facades\Artisan;

class ListTenantBillingLedgers extends ListRecords
{
    protected static string $resource = TenantBillingLedgerResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('run_consolidation')
                ->label('⚡ Ejecutar Cierre Mensual')
                ->icon('heroicon-o-arrow-path')
                ->color('primary')
                ->form([
                    Forms\Components\TextInput::make('period')
                        ->label('Período a Consolidar (YYYY-MM)')
                        ->default(now()->format('Y-m'))
                        ->placeholder('2026-08')
                        ->required(),
                ])
                ->action(function (array $data): void {
                    Artisan::call('donatio:generate-monthly-billing', [
                        '--period' => $data['period'],
                    ]);

                    Notification::make()
                        ->title('✓ Cierre Mensual Consolidado')
                        ->body("Se han recalculado y generado los registros de comisiones para el período {$data['period']}.")
                        ->success()
                        ->send();
                }),
        ];
    }
}
