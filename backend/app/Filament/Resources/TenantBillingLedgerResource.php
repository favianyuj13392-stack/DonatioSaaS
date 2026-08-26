<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TenantBillingLedgerResource\Pages;
use App\Models\TenantBillingLedger;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class TenantBillingLedgerResource extends Resource
{
    protected static ?string $model = TenantBillingLedger::class;

    protected static ?string $navigationIcon = 'heroicon-o-calculator';
    protected static ?string $navigationLabel = 'Facturación & Liquidación';
    protected static ?string $modelLabel = 'Liquidación SaaS';
    protected static ?string $pluralModelLabel = 'Facturación & Liquidaciones';
    protected static ?int $navigationSort = 4;

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('billing_period')
                    ->label('Período')
                    ->badge()
                    ->color('info')
                    ->sortable(),

                Tables\Columns\TextColumn::make('foundation.name')
                    ->label('Fundación')
                    ->badge()
                    ->color('primary')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('donation.merchant_reference_number')
                    ->label('Ref. Transacción')
                    ->searchable()
                    ->copyable()
                    ->placeholder('N/A'),

                Tables\Columns\TextColumn::make('gross_amount')
                    ->label('Monto Donado')
                    ->money('BOB')
                    ->sortable(),

                Tables\Columns\TextColumn::make('saas_fee_percentage')
                    ->label('Tasa SaaS')
                    ->suffix('%')
                    ->alignRight(),

                Tables\Columns\TextColumn::make('saas_fee_amount')
                    ->label('Comisión SaaS')
                    ->money('BOB')
                    ->weight('bold')
                    ->color('success')
                    ->sortable()
                    ->alignRight(),

                Tables\Columns\TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pending'  => 'warning',
                        'invoiced' => 'info',
                        'paid'     => 'success',
                        default    => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'pending'  => 'Pendiente de Cobro',
                        'invoiced' => 'Facturado',
                        'paid'     => 'Cobrado / Liquidado',
                        default    => $state,
                    }),

                Tables\Columns\TextColumn::make('payment_reference')
                    ->label('Ref. Transferencia')
                    ->placeholder('Sin registro')
                    ->copyable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('paid_at')
                    ->label('Fecha Cobro')
                    ->dateTime('d/m/Y H:i')
                    ->placeholder('Pendiente')
                    ->sortable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Fecha Generación')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('foundation_id')
                    ->label('Filtrar por Fundación')
                    ->relationship('foundation', 'name'),

                Tables\Filters\SelectFilter::make('billing_period')
                    ->label('Período de Facturación'),

                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending'  => 'Pendiente',
                        'invoiced' => 'Facturado',
                        'paid'     => 'Liquidado',
                    ]),
            ])
            ->actions([
                // Ver y Descargar Proforma PDF de Liquidación
                Tables\Actions\Action::make('proforma')
                    ->label('Proforma PDF')
                    ->icon('heroicon-o-document-text')
                    ->color('primary')
                    ->url(fn (TenantBillingLedger $record): string => route('admin.billing.proforma', [
                        'period'        => $record->billing_period,
                        'foundation_id' => $record->foundation_id,
                    ]))
                    ->openUrlInNewTab(),

                // Modal de Registro de Pago de Comisión
                Tables\Actions\Action::make('mark_paid')
                    ->label('Registrar Cobro')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->visible(fn (TenantBillingLedger $record) => $record->status !== 'paid')
                    ->form([
                        Forms\Components\TextInput::make('payment_reference')
                            ->label('Número de Transferencia / Transacción Bancaria')
                            ->placeholder('ej. TRF-BCP-98471204')
                            ->required(),

                        Forms\Components\DateTimePicker::make('paid_at')
                            ->label('Fecha y Hora del Depósito')
                            ->default(now())
                            ->required(),

                        Forms\Components\Textarea::make('notes')
                            ->label('Notas / Observaciones')
                            ->placeholder('Factura emitida Nro #1024'),
                    ])
                    ->action(function (TenantBillingLedger $record, array $data): void {
                        $record->update([
                            'status'            => 'paid',
                            'payment_reference' => $data['payment_reference'],
                            'paid_at'           => $data['paid_at'],
                            'notes'             => $data['notes'] ?? null,
                        ]);

                        Notification::make()
                            ->title('✓ Cobro Registrado Exitosamente')
                            ->body("La comisión de Bs. {$record->saas_fee_amount} ha sido marcada como liquidada.")
                            ->success()
                            ->send();
                    }),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTenantBillingLedgers::route('/'),
        ];
    }
}
