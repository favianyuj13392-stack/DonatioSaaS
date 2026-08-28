<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TenantBillingLedgerResource\Pages;
use App\Models\TenantBillingLedger;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class TenantBillingLedgerResource extends Resource
{
    protected static ?string $model = TenantBillingLedger::class;

    protected static ?string $navigationIcon = 'heroicon-o-calculator';
    protected static ?string $navigationLabel = 'Facturación & Liquidaciones';
    protected static ?string $modelLabel = 'Liquidación Consolidada';
    protected static ?string $pluralModelLabel = 'Facturación & Liquidaciones';
    protected static ?int $navigationSort = 4;

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->select([
                'billing_period',
                'foundation_id',
                DB::raw('MIN(id) as id'),
                DB::raw('COUNT(*) as total_donations_count'),
                DB::raw('SUM(gross_amount) as total_gross_amount'),
                DB::raw('SUM(saas_fee_amount) as total_saas_fee_amount'),
                DB::raw("CASE WHEN COUNT(CASE WHEN status != 'paid' THEN 1 END) = 0 THEN 'paid' ELSE 'pending' END as consolidated_status"),
                DB::raw('MAX(paid_at) as latest_paid_at'),
                DB::raw('MAX(created_at) as created_at'),
            ])
            ->groupBy('billing_period', 'foundation_id');
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('billing_period')
                    ->label('Período')
                    ->badge()
                    ->color('info')
                    ->sortable()
                    ->searchable(),

                Tables\Columns\TextColumn::make('foundation.name')
                    ->label('Fundación / Tenant')
                    ->badge()
                    ->color('primary')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('total_donations_count')
                    ->label('Transacciones')
                    ->badge()
                    ->color('gray')
                    ->formatStateUsing(fn ($state) => "{$state} donaciones")
                    ->alignCenter(),

                Tables\Columns\TextColumn::make('total_gross_amount')
                    ->label('GMV Recaudado')
                    ->money('BOB')
                    ->sortable()
                    ->alignRight(),

                Tables\Columns\TextColumn::make('total_saas_fee_amount')
                    ->label('Comisión SaaS a Facturar')
                    ->money('BOB')
                    ->weight('bold')
                    ->color('success')
                    ->sortable()
                    ->alignRight(),

                Tables\Columns\TextColumn::make('consolidated_status')
                    ->label('Estado de Facturación')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pending' => 'warning',
                        'paid'    => 'success',
                        default   => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'pending' => '⏳ Pendiente de Cobro',
                        'paid'    => '✓ Cobrado y Liquidado',
                        default   => $state,
                    }),

                Tables\Columns\TextColumn::make('latest_paid_at')
                    ->label('Fecha de Cobro')
                    ->dateTime('d/m/Y H:i')
                    ->placeholder('Pendiente')
                    ->sortable()
                    ->toggleable(),
            ])
            ->defaultSort('billing_period', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('foundation_id')
                    ->label('Filtrar por Fundación')
                    ->relationship('foundation', 'name'),
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

                // Modal de Registro de Cobro Consolidado del Mes
                Tables\Actions\Action::make('mark_paid')
                    ->label('Registrar Cobro')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->visible(fn (TenantBillingLedger $record) => $record->consolidated_status !== 'paid')
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
                            ->label('Notas / Factura SIAT Emitida')
                            ->placeholder('Factura emitida Nro #1024'),
                    ])
                    ->action(function (TenantBillingLedger $record, array $data): void {
                        TenantBillingLedger::where('foundation_id', $record->foundation_id)
                            ->where('billing_period', $record->billing_period)
                            ->update([
                                'status'            => 'paid',
                                'payment_reference' => $data['payment_reference'],
                                'paid_at'           => $data['paid_at'],
                                'notes'             => $data['notes'] ?? null,
                            ]);

                        Notification::make()
                            ->title('✓ Liquidación Mensual Cobrada')
                            ->body("Se marcó como cobrado el período {$record->billing_period} de {$record->foundation->name}.")
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
