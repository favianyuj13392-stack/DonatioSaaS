<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CampaignResource\Pages;
use App\Models\Campaign;
use App\Models\Foundation;
use App\Services\Media\CloudinaryService;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Forms\Get;
use Filament\Forms\Set;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class CampaignResource extends Resource
{
    protected static ?string $model = Campaign::class;

    protected static ?string $navigationIcon = 'heroicon-o-megaphone';
    protected static ?string $navigationLabel = 'Campañas';
    protected static ?string $modelLabel = 'Campaña';
    protected static ?string $pluralModelLabel = 'Campañas';
    protected static ?int $navigationSort = 1;

    public static function getEloquentQuery(): \Illuminate\Database\Eloquent\Builder
    {
        $query = parent::getEloquentQuery();
        if (auth()->check() && !auth()->user()->isSuperAdmin()) {
            $query->where('foundation_id', auth()->user()->foundation_id);
        }
        return $query;
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Tabs::make('Detalles de la Campaña')
                    ->tabs([
                        // Tab 1: Causa & Metas
                        Forms\Components\Tabs\Tab::make('Causa & Metas')
                            ->icon('heroicon-o-information-circle')
                            ->schema([
                                Forms\Components\Select::make('foundation_id')
                                    ->label('Fundación Propietaria')
                                    ->relationship('foundation', 'name')
                                    ->required()
                                    ->default(fn () => auth()->user()?->foundation_id ?? 1)
                                    ->visible(fn () => auth()->user()?->isSuperAdmin() ?? true)
                                    ->columnSpan(2),

                                Forms\Components\TextInput::make('title')
                                    ->label('Título de la Campaña')
                                    ->required()
                                    ->maxLength(255)
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn (string $operation, $state, Set $set) => 
                                        $operation === 'create' ? $set('slug', Str::slug($state)) : null
                                    ),

                                Forms\Components\TextInput::make('headline')
                                    ->label('Titular Emocional del Hero (H1)')
                                    ->placeholder('ej. Cada árbol que plantamos hoy, es vida para mañana.')
                                    ->maxLength(255)
                                    ->columnSpan(2),

                                Forms\Components\TextInput::make('slug')
                                    ->label('Identificador URL (Slug para Redes)')
                                    ->prefix('/c/')
                                    ->required()
                                    ->maxLength(255)
                                    ->unique(Campaign::class, 'slug', ignoreRecord: true),

                                Forms\Components\TextInput::make('monetary_goal')
                                    ->label('Meta Financiera (BOB)')
                                    ->required()
                                    ->numeric()
                                    ->prefix('Bs.')
                                    ->default(0.00),

                                Forms\Components\TextInput::make('current_amount')
                                    ->label('Monto Recaudado Acumulado')
                                    ->disabled()
                                    ->prefix('Bs.')
                                    ->default(0.00),

                                Forms\Components\FileUpload::make('banner_url')
                                    ->label('Banner / Portada de Campaña (Cloudinary CDN)')
                                    ->image()
                                    ->maxSize(10240)
                                    ->columnSpanFull()
                                    ->saveUploadedFileUsing(function ($file, Get $get) {
                                        $cloudinary = app(CloudinaryService::class);
                                        $foundation = Foundation::find($get('foundation_id') ?? 1);
                                        $subdomain = $foundation?->subdomain ?: 'general';
                                        return $cloudinary->uploadBanner($file, $subdomain);
                                    })
                                    ->helperText('Optimizado automáticamente en WebP desde Cloudinary.'),

                                Forms\Components\Textarea::make('description')
                                    ->label('Descripción Breve (Resumen)')
                                    ->rows(3)
                                    ->columnSpanFull(),

                                Forms\Components\MarkdownEditor::make('story_markdown')
                                    ->label('Storytelling Completo (Historia de la Causa)')
                                    ->columnSpanFull(),
                            ])->columns(2),

                        // Tab 2: Tiers de Donación & Destino Tangible
                        Forms\Components\Tabs\Tab::make('Tiers & Destino Tangible')
                            ->icon('heroicon-o-gift')
                            ->schema([
                                Forms\Components\Section::make('Botones de Aporte Rápido con Anclaje de Impacto (Multi-Moneda)')
                                    ->description('Define los montos sugeridos y la descripción tangible de lo que hace posible cada aporte en Bolivianos (BOB) y Dólares (USD).')
                                    ->schema([
                                        Forms\Components\Tabs::make('TiersMultiMoneda')
                                            ->tabs([
                                                Forms\Components\Tabs\Tab::make('🇧🇴 Bolivianos (BOB)')
                                                    ->schema([
                                                        Forms\Components\Repeater::make('donation_tiers.bob')
                                                            ->label('Tiers Sugeridos en Bolivianos')
                                                            ->schema([
                                                                Forms\Components\TextInput::make('amount')
                                                                    ->label('Monto (Bs.)')
                                                                    ->numeric()
                                                                    ->prefix('Bs.')
                                                                    ->required(),
                                                                Forms\Components\TextInput::make('label')
                                                                    ->label('Impacto Tangible')
                                                                    ->placeholder('ej. 1 Kit de medicinas básicas para quimio')
                                                                    ->required()
                                                                    ->columnSpan(2),
                                                                Forms\Components\Toggle::make('is_default')
                                                                    ->label('Preseleccionado')
                                                                    ->default(false),
                                                            ])
                                                            ->columns(4)
                                                            ->defaultItems(3)
                                                            ->collapsible(),
                                                    ]),

                                                Forms\Components\Tabs\Tab::make('🇺🇸 Dólares (USD)')
                                                    ->schema([
                                                        Forms\Components\Repeater::make('donation_tiers.usd')
                                                            ->label('Tiers Sugeridos en Dólares')
                                                            ->schema([
                                                                Forms\Components\TextInput::make('amount')
                                                                    ->label('Monto ($ USD)')
                                                                    ->numeric()
                                                                    ->prefix('$')
                                                                    ->required(),
                                                                Forms\Components\TextInput::make('label')
                                                                    ->label('Impacto Tangible')
                                                                    ->placeholder('ej. 1 International cancer care support kit')
                                                                    ->required()
                                                                    ->columnSpan(2),
                                                                Forms\Components\Toggle::make('is_default')
                                                                    ->label('Preseleccionado')
                                                                    ->default(false),
                                                            ])
                                                            ->columns(4)
                                                            ->defaultItems(3)
                                                            ->collapsible(),
                                                    ]),
                                            ])->columnSpanFull(),
                                    ]),

                                Forms\Components\Section::make('Micro-Historias & Destino Tangible de Fondos')
                                    ->description('3 Tarjetas humanas que explican a dónde va el dinero en lugar de un gráfico contable frío.')
                                    ->schema([
                                        Forms\Components\Repeater::make('tangible_impact_items')
                                            ->label('Destino de Fondos / Historias')
                                            ->schema([
                                                Forms\Components\Select::make('icon')
                                                    ->label('Icono')
                                                    ->options([
                                                        'pill'       => '💊 Medicamentos / Quimios',
                                                        'home'       => '🏠 Albergue / Hogar',
                                                        'ambulance'  => '🚑 Logística / Ambulancias',
                                                        'heart'      => '❤️ Acompañamiento Emocional',
                                                        'book'       => '📚 Educación / Talleres',
                                                    ])
                                                    ->default('pill')
                                                    ->required(),
                                                Forms\Components\TextInput::make('title')
                                                    ->label('Título de Destino')
                                                    ->placeholder('Fármacos Oncológicos')
                                                    ->required(),
                                                Forms\Components\TextInput::make('stat_highlight')
                                                    ->label('Destacado / Porcentaje')
                                                    ->placeholder('70% del Fondo')
                                                    ->required(),
                                                Forms\Components\Textarea::make('description')
                                                    ->label('Explicación Humana')
                                                    ->placeholder('Compra directa de ampollas de quimioterapia...')
                                                    ->rows(2)
                                                    ->columnSpanFull()
                                                    ->required(),
                                            ])
                                            ->columns(3)
                                            ->defaultItems(3)
                                            ->collapsible(),
                                    ]),

                                Forms\Components\Section::make('Transparencia & Desglose de Fondos ("Así utilizamos cada Bs. 100")')
                                    ->description('Segmentación del destino del dinero por cada 100 Bolivianos aportados.')
                                    ->schema([
                                        Forms\Components\Repeater::make('funds_breakdown')
                                            ->label('Categorías de Distribución')
                                            ->schema([
                                                Forms\Components\TextInput::make('category')
                                                    ->label('Categoría / Destino')
                                                    ->placeholder('ej. Reforestación')
                                                    ->required(),
                                                Forms\Components\TextInput::make('amount')
                                                    ->label('Monto (Bs.)')
                                                    ->numeric()
                                                    ->prefix('Bs.')
                                                    ->required(),
                                                Forms\Components\TextInput::make('percentage')
                                                    ->label('Porcentaje (%)')
                                                    ->numeric()
                                                    ->suffix('%')
                                                    ->required(),
                                                Forms\Components\TextInput::make('description')
                                                    ->label('Detalle Explicativo')
                                                    ->placeholder('Plantación y restauración...')
                                                    ->columnSpanFull()
                                                    ->nullable(),
                                            ])
                                            ->columns(3)
                                            ->collapsible(),
                                    ]),

                                Forms\Components\Section::make('Testimonio / Cita Inspiradora')
                                    ->description('Cita testimonial que acompaña a la historia editorial.')
                                    ->schema([
                                        Forms\Components\Textarea::make('testimonial.quote')
                                            ->label('Cita / Testimonio')
                                            ->rows(2)
                                            ->nullable(),
                                        Forms\Components\TextInput::make('testimonial.author_name')
                                            ->label('Nombre del Autor')
                                            ->nullable(),
                                        Forms\Components\TextInput::make('testimonial.author_role')
                                            ->label('Rol / Relación con la causa')
                                            ->nullable(),
                                        Forms\Components\TextInput::make('testimonial.location')
                                            ->label('Ubicación / Ciudad')
                                            ->nullable(),
                                    ])->columns(3)->collapsible(),

                                Forms\Components\Textarea::make('thank_you_message')
                                    ->label('Mensaje de Agradecimiento Post-Donación')
                                    ->rows(2)
                                    ->default('¡Tu generosidad salva vidas! Te hemos enviado el comprobante oficial de donación a tu correo electrónico.')
                                    ->columnSpanFull(),
                            ]),

                        // Tab 3: Reglas de Checkout & Medios de Pago
                        Forms\Components\Tabs\Tab::make('Reglas de Checkout')
                            ->icon('heroicon-o-adjustments-horizontal')
                            ->schema([
                                Forms\Components\Select::make('allowed_frequencies')
                                    ->label('Frecuencias Permitidas')
                                    ->options([
                                        'all'          => 'Todas (Única y Mensual)',
                                        'monthly_only' => 'Solo Donación Mensual (Socios Recurrentes)',
                                        'single_only'  => 'Solo Donación Única (Express / Eventos)',
                                    ])
                                    ->default('all')
                                    ->required()
                                    ->live()
                                    ->afterStateUpdated(function ($state, Set $set) {
                                        if ($state === 'monthly_only') {
                                            $set('allowed_payment_methods', 'card_only');
                                        }
                                    }),

                                Forms\Components\Select::make('allowed_payment_methods')
                                    ->label('Métodos de Pago Permitidos')
                                    ->options(function (Get $get) {
                                        $freq = $get('allowed_frequencies');
                                        $curr = $get('allowed_currencies');
                                        if ($freq === 'monthly_only' || $curr === 'usd_only') {
                                            return [
                                                'card_only' => 'Solo Tarjeta de Crédito/Débito (ATC)',
                                            ];
                                        }
                                        return [
                                            'all'       => 'Todos (Tarjeta y QR)',
                                            'card_only' => 'Solo Tarjeta de Crédito/Débito (ATC)',
                                            'qr_only'   => 'Solo Código QR Simple',
                                        ];
                                    })
                                    ->default('all')
                                    ->required()
                                    ->live()
                                    ->afterStateUpdated(function ($state, Set $set) {
                                        if ($state === 'qr_only') {
                                            $set('allowed_currencies', 'bob_only');
                                        }
                                    })
                                    ->helperText(function (Get $get) {
                                        if ($get('allowed_frequencies') === 'monthly_only') {
                                            return 'Las donaciones mensuales requieren tarjeta (débito automático recurrente).';
                                        }
                                        if ($get('allowed_currencies') === 'usd_only') {
                                            return 'Las donaciones en USD requieren tarjeta de crédito/débito.';
                                        }
                                        return 'Selecciona los métodos disponibles en el checkout.';
                                    }),

                                Forms\Components\Select::make('allowed_currencies')
                                    ->label('Monedas Permitidas')
                                    ->options(function (Get $get) {
                                        $payment = $get('allowed_payment_methods');
                                        if ($payment === 'qr_only') {
                                            return [
                                                'bob_only' => 'Solo Bolivianos (Bs) - Exclusivo para QR',
                                            ];
                                        }
                                        return [
                                            'all'      => 'Todas (Bolivianos Bs y Dólares USD)',
                                            'bob_only' => 'Solo Bolivianos (Bs)',
                                            'usd_only' => 'Solo Dólares (USD)',
                                        ];
                                    })
                                    ->default('all')
                                    ->required()
                                    ->live()
                                    ->afterStateUpdated(function ($state, Set $set) {
                                        if ($state === 'usd_only') {
                                            $set('allowed_payment_methods', 'card_only');
                                        }
                                    })
                                    ->helperText(function (Get $get) {
                                        if ($get('allowed_payment_methods') === 'qr_only') {
                                            return 'El sistema QR bancario opera únicamente en moneda nacional (Bs).';
                                        }
                                        return 'Define las monedas admitidas en el checkout para esta campaña.';
                                    }),

                                Forms\Components\DatePicker::make('start_date')
                                    ->label('Fecha de Inicio'),

                                Forms\Components\DatePicker::make('end_date')
                                    ->label('Fecha de Finalización'),

                                Forms\Components\Select::make('status')
                                    ->label('Estado de la Campaña')
                                    ->options([
                                        'active'    => 'Activa (Visible)',
                                        'paused'    => 'Pausada',
                                        'completed' => 'Finalizada',
                                    ])
                                    ->default('active')
                                    ->required(),
                            ])->columns(2),
                    ])
                    ->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('banner_url')
                    ->label('Portada')
                    ->circular(),

                Tables\Columns\TextColumn::make('title')
                    ->label('Campaña')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('foundation.name')
                    ->label('Fundación')
                    ->badge()
                    ->color('primary')
                    ->sortable(),

                Tables\Columns\TextColumn::make('monetary_goal')
                    ->label('Meta')
                    ->money('BOB')
                    ->sortable(),

                Tables\Columns\TextColumn::make('current_amount')
                    ->label('Recaudado')
                    ->money('BOB')
                    ->sortable(),

                Tables\Columns\TextColumn::make('progress_percentage')
                    ->label('Progreso')
                    ->state(fn (Campaign $record): string => "{$record->progress_percentage}%")
                    ->badge()
                    ->color(fn (Campaign $record): string => 
                        $record->progress_percentage >= 100 ? 'success' : ($record->progress_percentage >= 50 ? 'warning' : 'gray')
                    ),

                Tables\Columns\TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'active'    => 'success',
                        'paused'    => 'warning',
                        'completed' => 'gray',
                        default     => 'info',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'active'    => 'Activa',
                        'paused'    => 'Pausada',
                        'completed' => 'Finalizada',
                        default     => $state,
                    }),

                Tables\Columns\TextColumn::make('allowed_currencies')
                    ->label('Monedas')
                    ->badge()
                    ->color('gray')
                    ->formatStateUsing(fn (?string $state): string => match ($state) {
                        'bob_only' => '🇧🇴 Solo Bs',
                        'usd_only' => '🇺🇸 Solo USD',
                        default    => '🌎 Todas',
                    }),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'active'    => 'Activas',
                        'paused'    => 'Pausadas',
                        'completed' => 'Finalizadas',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListCampaigns::route('/'),
            'create' => Pages\CreateCampaign::route('/create'),
            'edit'   => Pages\EditCampaign::route('/{record}/edit'),
        ];
    }
}
