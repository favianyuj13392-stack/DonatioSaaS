<?php

namespace App\Filament\Resources\ExchangeRateResource\Pages;

use App\Filament\Resources\ExchangeRateResource;
use App\Services\ExchangeRate\ExchangeRateService;
use Filament\Actions;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;

class ListExchangeRates extends ListRecords
{
    protected static string $resource = ExchangeRateResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('syncBcb')
                ->label('Sincronizar BCB en Vivo')
                ->icon('heroicon-o-arrow-path')
                ->color('primary')
                ->action(function (ExchangeRateService $service) {
                    $record = $service->syncRate('USD/BOB', true);

                    if ($record) {
                        Notification::make()
                            ->title('Cotización BCB Sincronizada')
                            ->body("Compra: Bs. {$record->buy_rate} | Venta: Bs. {$record->sell_rate} ({$record->source})")
                            ->success()
                            ->send();
                    } else {
                        Notification::make()
                            ->title('Error de Sincronización')
                            ->body('No se pudo conectar con los proveedores del BCB.')
                            ->danger()
                            ->send();
                    }
                }),

            Actions\CreateAction::make()
                ->label('Nuevo Registro Manual')
                ->icon('heroicon-o-plus'),
        ];
    }
}
