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
                                    ->default(1)
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
                                Forms\Components\Section::make('Botones de Aporte Rápido con Anclaje de Impacto (Impact Anchoring)')
                                    ->description('Define los montos sugeridos y la descripción tangible de lo que hace posible cada aporte.')
                                    ->schema([
                                        Forms\Components\Repeater::make('donation_tiers')
                                            ->label('Tiers de Donación')
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
                                            ->defaultItems(4)
                                            ->collapsible(),
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
                                        'all'          => 'Todas (Aporte Único y Suscripción Mensual)',
                                        'monthly_only' => 'Solo Donación Mensual (Socios)',
                                        'single_only'  => 'Solo Aporte Único',
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
                                    ->options([
                                        'all'       => 'Todos (Tarjeta 3DS2 y QR ATC)',
                                        'card_only' => 'Solo Tarjeta de Crédito/Débito',
                                        'qr_only'   => 'Solo QR Simple ATC',
                                    ])
                                    ->default('all')
                                    ->required()
                                    ->disabled(fn (Get $get) => $get('allowed_frequencies') === 'monthly_only')
                                    ->helperText(fn (Get $get) => 
                                        $get('allowed_frequencies') === 'monthly_only' 
                                            ? 'Las donaciones mensuales requieren tarjeta tokenizada TMS (QR deshabilitado automáticamente).'
                                            : 'Selecciona los métodos disponibles en el checkout.'
                                    ),

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
