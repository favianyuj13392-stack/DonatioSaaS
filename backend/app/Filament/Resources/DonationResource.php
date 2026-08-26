<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DonationResource\Pages;
use App\Models\Donation;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class DonationResource extends Resource
{
    protected static ?string $model = Donation::class;

    protected static ?string $navigationIcon = 'heroicon-o-currency-dollar';
    protected static ?string $navigationLabel = 'Transacciones Live';
    protected static ?string $modelLabel = 'Donación';
    protected static ?string $pluralModelLabel = 'Transacciones Live';
    protected static ?int $navigationSort = 2;

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('merchant_reference_number')
                    ->label('Referencia Bancaria')
                    ->searchable()
                    ->copyable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('foundation.name')
                    ->label('Fundación')
                    ->badge()
                    ->color('primary')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('donor_display')
                    ->label('Donante')
                    ->state(fn (Donation $record): string => $record->is_anonymous ? 'Donante Anónimo' : ($record->donor->name ?? 'Donante'))
                    ->description(fn (Donation $record): string => $record->is_anonymous ? 'Aporte Privado' : ($record->donor->email ?? ''))
                    ->searchable(),

                Tables\Columns\TextColumn::make('amount')
                    ->label('Monto Bruto')
                    ->state(fn (Donation $record): string => "{$record->currency} " . number_format((float) $record->amount, 2))
                    ->weight('bold')
                    ->sortable(),

                Tables\Columns\TextColumn::make('saas_fee_amount')
                    ->label('Tu 2% (SaaS)')
                    ->state(fn (Donation $record): string => "{$record->currency} " . number_format((float) $record->saas_fee_amount, 2))
                    ->color('success')
                    ->sortable(),

                Tables\Columns\TextColumn::make('atc_fee_estimated_amount')
                    ->label('ATC Est.')
                    ->state(fn (Donation $record): string => "{$record->currency} " . number_format((float) $record->atc_fee_estimated_amount, 2))
                    ->color('warning')
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('net_estimated_to_foundation')
                    ->label('Neto ONG')
                    ->state(fn (Donation $record): string => "{$record->currency} " . number_format((float) $record->net_estimated_to_foundation, 2))
                    ->color('info')
                    ->sortable(),

                Tables\Columns\TextColumn::make('payment_method')
                    ->label('Medio')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'card'  => 'info',
                        'qr'    => 'warning',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'card'  => 'Tarjeta ATC',
                        'qr'    => 'QR ATC',
                        default => $state,
                    }),

                Tables\Columns\TextColumn::make('donation_type')
                    ->label('Tipo')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'single'                 => 'primary',
                        'subscription_recurring' => 'success',
                        'subscription_initial'   => 'warning',
                        default                  => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'single'                 => 'Único',
                        'subscription_recurring' => 'Socio Mensual',
                        'subscription_initial'   => 'Alta Socio',
                        default                  => $state,
                    }),

                Tables\Columns\TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'completed' => 'success',
                        'pending'   => 'warning',
                        'failed'    => 'danger',
                        'refunded'  => 'gray',
                        default     => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'completed' => 'Completada',
                        'pending'   => 'Pendiente',
                        'failed'    => 'Fallida',
                        'refunded'  => 'Reembolsada',
                        default     => $state,
                    }),

                Tables\Columns\TextColumn::make('paid_at')
                    ->label('Fecha')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('paid_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('foundation_id')
                    ->label('Filtrar por Fundación')
                    ->relationship('foundation', 'name'),
                Tables\Filters\SelectFilter::make('currency')
                    ->label('Moneda')
                    ->options([
                        'BOB' => 'Bolivianos (BOB)',
                        'USD' => 'Dólares (USD)',
                    ]),
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'completed' => 'Completada',
                        'pending'   => 'Pendiente',
                        'failed'    => 'Fallida',
                    ]),
                Tables\Filters\SelectFilter::make('payment_method')
                    ->options([
                        'card' => 'Tarjeta',
                        'qr'   => 'QR',
                    ]),
                Tables\Filters\SelectFilter::make('donation_type')
                    ->options([
                        'single'                 => 'Aporte Único',
                        'subscription_recurring' => 'Suscripción Recurrente',
                        'subscription_initial'   => 'Alta de Socio',
                    ]),
            ])
            ->actions([
                // Ver Raw JSONB devuelto por Cybersource
                Tables\Actions\Action::make('view_raw')
                    ->label('Auditoría JSON')
                    ->icon('heroicon-o-code-bracket')
                    ->color('gray')
                    ->modalHeading('Respuesta Cruda de Pasarela (Cybersource ATC)')
                    ->modalContent(fn (Donation $record) => view('filament.components.raw-json-modal', [
                        'json' => json_encode($record->raw_gateway_response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
                        'rid'  => $record->cybersource_request_id,
                        'eci'  => $record->eci_raw,
                    ])),

                Tables\Actions\Action::make('receipt')
                    ->label('Recibo')
                    ->icon('heroicon-o-document-arrow-down')
                    ->url(fn (Donation $record): string => route('donations.receipt', ['id' => $record->id]))
                    ->openUrlInNewTab(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListDonations::route('/'),
        ];
    }
}
