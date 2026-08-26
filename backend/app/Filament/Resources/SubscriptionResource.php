<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SubscriptionResource\Pages;
use App\Models\Subscription;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class SubscriptionResource extends Resource
{
    protected static ?string $model = Subscription::class;

    protected static ?string $navigationIcon = 'heroicon-o-user-group';
    protected static ?string $navigationLabel = 'Socios Recurrentes';
    protected static ?string $modelLabel = 'Suscripción de Socio';
    protected static ?string $pluralModelLabel = 'Socios Recurrentes';
    protected static ?int $navigationSort = 2;

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('donor.name')
                    ->label('Socio / Donante')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('donor.email')
                    ->label('Email')
                    ->searchable()
                    ->copyable(),

                Tables\Columns\TextColumn::make('amount')
                    ->label('Aporte Mensual')
                    ->money('BOB')
                    ->sortable(),

                Tables\Columns\TextColumn::make('card_info')
                    ->label('Tarjeta Tokenizada')
                    ->state(fn (Subscription $record): string => "{$record->card_brand} •••• {$record->card_last_four}")
                    ->badge()
                    ->color('info'),

                Tables\Columns\TextColumn::make('next_billing_date')
                    ->label('Próximo Débito')
                    ->date('d/m/Y')
                    ->sortable(),

                Tables\Columns\TextColumn::make('last_billed_at')
                    ->label('Último Cobro')
                    ->dateTime('d/m/Y H:i')
                    ->placeholder('Sin cobros previos')
                    ->sortable(),

                Tables\Columns\TextColumn::make('failed_attempts_count')
                    ->label('Fallos')
                    ->badge()
                    ->color(fn ($state) => match (true) {
                        $state >= 2 => 'danger',
                        $state === 1 => 'warning',
                        default => 'success',
                    }),

                Tables\Columns\TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'active'    => 'success',
                        'paused'    => 'warning',
                        'cancelled' => 'danger',
                        'failed'    => 'danger',
                        default     => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'active'    => 'Activa',
                        'paused'    => 'Pausada',
                        'cancelled' => 'Cancelada',
                        'failed'    => 'Cobro Fallido',
                        default     => $state,
                    }),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Filtrar por Estado')
                    ->options([
                        'active'    => 'Activas',
                        'paused'    => 'Pausadas',
                        'failed'    => 'Con Fallas de Cobro',
                        'cancelled' => 'Canceladas',
                    ]),
            ])
            ->actions([
                // 1. Modal para Pausar Débito
                Tables\Actions\Action::make('pause')
                    ->label('Pausar')
                    ->icon('heroicon-o-pause')
                    ->color('warning')
                    ->visible(fn (Subscription $record) => $record->status === 'active')
                    ->form([
                        Forms\Components\Select::make('pause_months')
                            ->label('Desea pausar por:')
                            ->options([
                                1 => '1 mes (30 días)',
                                2 => '2 meses (60 días)',
                                3 => '3 meses (90 días)',
                            ])
                            ->default(1)
                            ->required(),
                    ])
                    ->action(function (Subscription $record, array $data): void {
                        $months = (int) $data['pause_months'];
                        $record->update([
                            'status'            => 'paused',
                            'next_billing_date' => now()->addMonths($months),
                        ]);

                        Notification::make()
                            ->title('Suscripción pausada')
                            ->body("Se pospuso el próximo cobro por {$months} mes(es).")
                            ->warning()
                            ->send();
                    }),

                // 2. Reactivar Suscripción
                Tables\Actions\Action::make('resume')
                    ->label('Reanudar')
                    ->icon('heroicon-o-play')
                    ->color('success')
                    ->visible(fn (Subscription $record) => $record->status === 'paused')
                    ->requiresConfirmation()
                    ->action(function (Subscription $record): void {
                        $record->update([
                            'status'            => 'active',
                            'next_billing_date' => now(),
                        ]);

                        Notification::make()
                            ->title('Suscripción reactivada')
                            ->success()
                            ->send();
                    }),

                // 3. Generar / Reenviar Token de Reactivación 1-Click
                Tables\Actions\Action::make('reactivate_link')
                    ->label('Enlace Reactivación')
                    ->icon('heroicon-o-link')
                    ->color('info')
                    ->visible(fn (Subscription $record) => in_array($record->status, ['failed', 'cancelled']))
                    ->action(function (Subscription $record): void {
                        $token = $record->generateReactivationToken();
                        $link = "https://{$record->foundation->subdomain}.donatio.lat/reactivar/{$token}";

                        Notification::make()
                            ->title('Enlace de Reactivación 72h')
                            ->body("Enlace generado: {$link}")
                            ->success()
                            ->persistent()
                            ->send();
                    }),

                // 4. Cancelar Suscripción
                Tables\Actions\Action::make('cancel')
                    ->label('Cancelar')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->visible(fn (Subscription $record) => in_array($record->status, ['active', 'paused']))
                    ->form([
                        Forms\Components\Textarea::make('cancellation_reason')
                            ->label('Motivo de Cancelación')
                            ->required()
                            ->rows(3),
                    ])
                    ->action(function (Subscription $record, array $data): void {
                        $record->update([
                            'status'              => 'cancelled',
                            'cancelled_at'        => now(),
                            'cancellation_reason' => $data['cancellation_reason'],
                        ]);

                        Notification::make()
                            ->title('Suscripción cancelada')
                            ->danger()
                            ->send();
                    }),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSubscriptions::route('/'),
        ];
    }
}
