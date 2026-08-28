<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ExchangeRateResource\Pages;
use App\Models\ExchangeRate;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ExchangeRateResource extends Resource
{
    protected static ?string $model = ExchangeRate::class;

    protected static ?string $navigationIcon = 'heroicon-o-currency-dollar';
    protected static ?string $navigationLabel = 'Tipo de Cambio (BCB)';
    protected static ?string $modelLabel = 'Tipo de Cambio';
    protected static ?string $pluralModelLabel = 'Histórico Tipos de Cambio BCB';
    protected static ?int $navigationSort = 5;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Registro Oficial de Cotización')
                    ->description('Valores oficiales publicados por el Banco Central de Bolivia para conversiones monetarias.')
                    ->schema([
                        Forms\Components\TextInput::make('currency_pair')
                            ->label('Par de Divisas')
                            ->default('USD/BOB')
                            ->disabled()
                            ->required(),

                        Forms\Components\DatePicker::make('effective_date')
                            ->label('Fecha de Vigencia')
                            ->default(now()->toDateString())
                            ->required(),

                        Forms\Components\TextInput::make('buy_rate')
                            ->label('Tipo de Cambio Compra (TCO Oficial)')
                            ->numeric()
                            ->prefix('Bs.')
                            ->placeholder('11.8300')
                            ->required(),

                        Forms\Components\TextInput::make('sell_rate')
                            ->label('Tipo de Cambio Venta (Tope BCB)')
                            ->numeric()
                            ->prefix('Bs.')
                            ->placeholder('11.9300')
                            ->required(),

                        Forms\Components\Select::make('source')
                            ->label('Fuente de Datos')
                            ->options([
                                'BCB_CUCU'        => 'BCB - Cucu API (Primaria)',
                                'BCB_DOLARAPI'    => 'BCB - DolarApi (Secundaria)',
                                'BCB_DIRECT'      => 'BCB - Scraper Directo',
                                'MANUAL_OVERRIDE' => 'Manual (SuperAdmin Override)',
                            ])
                            ->default('MANUAL_OVERRIDE')
                            ->required(),

                        Forms\Components\Toggle::make('is_fallback')
                            ->label('¿Fue obtenido mediante Failover?')
                            ->default(false),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('effective_date')
                    ->label('Fecha Vigencia')
                    ->date('d/m/Y')
                    ->badge()
                    ->color('primary')
                    ->sortable()
                    ->searchable(),

                Tables\Columns\TextColumn::make('currency_pair')
                    ->label('Par')
                    ->badge()
                    ->color('gray'),

                Tables\Columns\TextColumn::make('buy_rate')
                    ->label('Compra (TCO)')
                    ->money('BOB', 4)
                    ->weight('bold')
                    ->sortable(),

                Tables\Columns\TextColumn::make('sell_rate')
                    ->label('Venta (Tope BCB)')
                    ->money('BOB', 4)
                    ->weight('bold')
                    ->color('success')
                    ->sortable(),

                Tables\Columns\TextColumn::make('source')
                    ->label('Fuente')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'BCB_CUCU'        => 'success',
                        'BCB_DOLARAPI'    => 'info',
                        'BCB_DIRECT'      => 'warning',
                        'MANUAL_OVERRIDE' => 'danger',
                        default           => 'gray',
                    }),

                Tables\Columns\IconColumn::make('is_fallback')
                    ->label('Fallback')
                    ->boolean()
                    ->trueIcon('heroicon-o-arrow-path')
                    ->falseIcon('heroicon-o-check-circle')
                    ->trueColor('warning')
                    ->falseColor('success'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Sincronizado el')
                    ->dateTime('d/m/Y H:i:s')
                    ->color('gray')
                    ->sortable(),
            ])
            ->defaultSort('effective_date', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListExchangeRates::route('/'),
        ];
    }
}
