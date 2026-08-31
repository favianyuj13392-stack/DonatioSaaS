<?php

namespace App\Filament\Resources;

use App\Filament\Resources\FoundationResource\Pages;
use App\Models\Foundation;
use App\Services\ATC\AtcCybersourceAdapter;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class FoundationResource extends Resource
{
    protected static ?string $model = Foundation::class;

    protected static ?string $navigationIcon = 'heroicon-o-building-office-2';
    protected static ?string $navigationLabel = 'Fundaciones (Tenants)';
    protected static ?string $modelLabel = 'Fundación';
    protected static ?string $pluralModelLabel = 'Fundaciones';
    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Tabs::make('Detalles de la Fundación')
                    ->tabs([
                        // Tab 1: Identidad & Marca
                        Forms\Components\Tabs\Tab::make('Identidad & Marca')
                            ->icon('heroicon-o-identification')
                            ->schema([
                                Forms\Components\TextInput::make('name')
                                    ->label('Nombre Institucional')
                                    ->required()
                                    ->maxLength(255)
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn (string $operation, $state, Forms\Set $set) => 
                                        $operation === 'create' ? $set('subdomain', Str::slug($state)) : null
                                    ),

                                Forms\Components\TextInput::make('legal_name')
                                    ->label('Razón Social Oficial (Legal)')
                                    ->maxLength(255)
                                    ->placeholder('Fundación Benéfica Ejemplo de Bolivia'),

                                Forms\Components\TextInput::make('subdomain')
                                    ->label('Subdominio Único')
                                    ->prefix('https://')
                                    ->suffix('.donatio.lat')
                                    ->required()
                                    ->maxLength(100)
                                    ->unique(Foundation::class, 'subdomain', ignoreRecord: true),

                                Forms\Components\TextInput::make('code')
                                    ->label('Sigla Corta (3-4 letras)')
                                    ->required()
                                    ->maxLength(10)
                                    ->placeholder('ej. FNE, FSJ')
                                    ->unique(Foundation::class, 'code', ignoreRecord: true),

                                Forms\Components\TextInput::make('nit')
                                    ->label('NIT Legal (Bolivia)')
                                    ->maxLength(30)
                                    ->placeholder('1029384756'),

                                Forms\Components\TextInput::make('legal_id_details')
                                    ->label('Personería Jurídica / Registro')
                                    ->maxLength(255)
                                    ->placeholder('Personería Jurídica N° 482/2018'),

                                Forms\Components\TextInput::make('location_city')
                                    ->label('Ciudad / Sede Principal')
                                    ->default('La Paz, Bolivia')
                                    ->maxLength(100),

                                Forms\Components\TextInput::make('contact_email')
                                    ->label('Email Institucional de Contacto')
                                    ->email()
                                    ->required()
                                    ->maxLength(255),

                                Forms\Components\TextInput::make('phone')
                                    ->label('Teléfono / WhatsApp')
                                    ->tel()
                                    ->maxLength(50),

                                Forms\Components\FileUpload::make('logo_url')
                                    ->label('Logotipo Institucional (Cloudinary CDN)')
                                    ->image()
                                    ->maxSize(5120)
                                    ->columnSpan(2)
                                    ->saveUploadedFileUsing(function ($file, Forms\Get $get) {
                                        $cloudinary = app(\App\Services\Media\CloudinaryService::class);
                                        $subdomain = $get('subdomain') ?: 'general';
                                        return $cloudinary->uploadLogo($file, $subdomain);
                                    })
                                    ->helperText('Optimizado y servido automáticamente en WebP desde Cloudinary.'),

                                Forms\Components\ColorPicker::make('primary_color')
                                    ->label('Color Primario (HEX)')
                                    ->default('#db2777')
                                    ->required(),

                                Forms\Components\ColorPicker::make('primary_color_hover')
                                    ->label('Color Primario Hover (HEX)')
                                    ->default('#be185d')
                                    ->required(),

                                Forms\Components\ColorPicker::make('secondary_color')
                                    ->label('Color Secundario / Fondo (HEX)')
                                    ->default('#0f172a')
                                    ->required(),

                                Forms\Components\Select::make('status')
                                    ->label('Estado Operativo (Kill Switch)')
                                    ->options([
                                        'active'    => 'Activa (Operación Normal)',
                                        'suspended' => 'Suspendida (Bloqueo por Impago)',
                                        'pending'   => 'En Configuración',
                                    ])
                                    ->default('active')
                                    ->required(),
                            ])->columns(2),

                        // Tab 2: Propósito Institucional & Empresas Aliadas
                        Forms\Components\Tabs\Tab::make('Propósito & Alianzas')
                            ->icon('heroicon-o-heart')
                            ->schema([
                                Forms\Components\Textarea::make('mission')
                                    ->label('Misión Institucional')
                                    ->rows(3)
                                    ->columnSpanFull(),

                                Forms\Components\Textarea::make('vision')
                                    ->label('Visión Institucional')
                                    ->rows(3)
                                    ->columnSpanFull(),

                                Forms\Components\Section::make('Métricas de Impacto Institucional')
                                    ->description('Cifras destacadas que se muestran en tarjetas modernas de Social Proof.')
                                    ->schema([
                                        Forms\Components\Repeater::make('institutional_metrics')
                                            ->label('Cifras Clave')
                                            ->schema([
                                                Forms\Components\TextInput::make('value')
                                                    ->label('Cifra / Valor')
                                                    ->placeholder('+450')
                                                    ->required(),
                                                Forms\Components\TextInput::make('label')
                                                    ->label('Etiqueta / Concepto')
                                                    ->placeholder('Niños Atendidos')
                                                    ->required(),
                                            ])
                                            ->columns(2)
                                            ->defaultItems(3)
                                            ->collapsible(),
                                    ]),

                                Forms\Components\Section::make('Empresas y Patrocinadores Aliados')
                                    ->description('Logos que aparecerán en el carrusel infinito (Marquee).')
                                    ->schema([
                                        Forms\Components\Repeater::make('corporate_partners')
                                            ->label('Alianzas Corporativas')
                                            ->schema([
                                                Forms\Components\TextInput::make('name')
                                                    ->label('Empresa / Institución')
                                                    ->required(),
                                                Forms\Components\TextInput::make('logo_url')
                                                    ->label('URL del Logotipo')
                                                    ->url()
                                                    ->required(),
                                                Forms\Components\TextInput::make('website_url')
                                                    ->label('Sitio Web Oficial')
                                                    ->url()
                                                    ->nullable(),
                                            ])
                                            ->columns(3)
                                            ->collapsible(),
                                    ]),
                            ]),

                        // Tab 3: Configuración Financiera y Tarifas
                        Forms\Components\Tabs\Tab::make('Tarifas & Comisiones')
                            ->icon('heroicon-o-banknotes')
                            ->schema([
                                Forms\Components\Section::make('Comisiones del SaaS Donatio')
                                    ->description('Porcentaje pactado que se debita para el sostenimiento de la plataforma.')
                                    ->schema([
                                        Forms\Components\TextInput::make('saas_fee_card')
                                            ->label('Comisión SaaS Tarjetas (%)')
                                            ->numeric()
                                            ->suffix('%')
                                            ->default(2.00)
                                            ->required(),

                                        Forms\Components\TextInput::make('saas_fee_qr')
                                            ->label('Comisión SaaS QR Simple (%)')
                                            ->numeric()
                                            ->suffix('%')
                                            ->default(2.00)
                                            ->required(),
                                    ])->columns(2),

                                Forms\Components\Section::make('Aranceles Estimados Pasarela Red Enlace / Cybersource')
                                    ->description('Estimación del costo directo cobrado por ATC a la fundación para el cálculo del neto.')
                                    ->schema([
                                        Forms\Components\TextInput::make('atc_fee_card_est')
                                            ->label('Arancel ATC Tarjetas (%)')
                                            ->numeric()
                                            ->suffix('%')
                                            ->default(2.45)
                                            ->required(),

                                        Forms\Components\TextInput::make('atc_fee_qr_est')
                                            ->label('Arancel ATC QR Simple (%)')
                                            ->numeric()
                                            ->suffix('%')
                                            ->default(1.00)
                                            ->required(),
                                    ])->columns(2),
                            ]),

                        // Tab 4: Bóveda de Credenciales Bancarias ATC (Cifrado AES-256)
                        Forms\Components\Tabs\Tab::make('Pasarela Bancaria ATC')
                            ->icon('heroicon-o-key')
                            ->schema([
                                Forms\Components\Toggle::make('is_sandbox')
                                    ->label('Modo Pruebas / Sandbox')
                                    ->default(true)
                                    ->helperText('Activar para pruebas con tarjetas simuladas antes del paso a producción.'),

                                Forms\Components\TextInput::make('atc_merchant_id')
                                    ->label('Merchant ID (Código de Comercio ATC)')
                                    ->password()
                                    ->revealable()
                                    ->nullable()
                                    ->placeholder('Dejar vacío para usar credenciales globales de Sandbox')
                                    ->helperText('En Sandbox, dejar en blanco para usar la cuenta compartida de ATC Red Enlace (redenlace_000021).'),

                                Forms\Components\TextInput::make('atc_api_key_id')
                                    ->label('API Key ID (Cybersource Key)')
                                    ->password()
                                    ->revealable()
                                    ->nullable()
                                    ->placeholder('Dejar vacío para usar credenciales globales de Sandbox')
                                    ->helperText('Identificador de la llave API generado en Cybersource Business Center.'),

                                Forms\Components\TextInput::make('atc_secret_key')
                                    ->label('Shared Secret Key (HMAC Base64)')
                                    ->password()
                                    ->revealable()
                                    ->nullable()
                                    ->placeholder('Dejar vacío para usar credenciales globales de Sandbox')
                                    ->helperText('Llave secreta HMAC-SHA256 en Base64 (Cifrada de forma inmutable con AES-256).'),

                                Forms\Components\TextInput::make('atc_org_unit_id')
                                    ->label('Org Unit ID (3DS2 Cardinal Cruise)')
                                    ->password()
                                    ->revealable()
                                    ->nullable()
                                    ->helperText('Identificador de unidad organizacional para Cardinal Cruise 3DS2 (Opcional).'),
                            ]),
                    ])
                    ->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('logo_url')
                    ->label('Logo')
                    ->circular(),

                Tables\Columns\TextColumn::make('name')
                    ->label('Fundación')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('subdomain')
                    ->label('Subdominio')
                    ->badge()
                    ->color('info')
                    ->searchable(),

                Tables\Columns\TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'active'    => 'success',
                        'suspended' => 'danger',
                        default     => 'warning',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'active'    => 'Activa',
                        'suspended' => 'Suspendida (Kill Switch)',
                        'pending'   => 'Pendiente',
                        default     => $state,
                    }),

                Tables\Columns\TextColumn::make('saas_fee_card')
                    ->label('SaaS Fee (Tarj / QR)')
                    ->state(fn (Foundation $record): string => "{$record->saas_fee_card}% / {$record->saas_fee_qr}%"),

                Tables\Columns\TextColumn::make('donations_count')
                    ->label('Donaciones')
                    ->counts('donations')
                    ->sortable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Fecha Alta')
                    ->date('d/m/Y')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'active'    => 'Activas',
                        'suspended' => 'Suspendidas',
                        'pending'   => 'Pendientes',
                    ]),
            ])
            ->actions([
                Tables\Actions\Action::make('test_atc')
                    ->label('Probar ATC')
                    ->icon('heroicon-o-signal')
                    ->color('info')
                    ->requiresConfirmation()
                    ->modalHeading('Test de Conexión Cybersource ATC')
                    ->modalDescription('Se ejecutará una llamada de autenticación 3DS2 hacia la API de Red Enlace / Cybersource usando las credenciales guardadas.')
                    ->action(function (Foundation $record, AtcCybersourceAdapter $adapter): void {
                        try {
                            $res = $adapter->setup3ds($record, ['merchant_reference_number' => 'HEALTHCHECK-' . time()]);
                            if (!empty($res['accessToken'])) {
                                Notification::make()
                                    ->title('✓ Conexión Exitosa con ATC Cybersource')
                                    ->body("Credenciales validadas correctamente. JWT 3DS2 recibido (Modo: " . ($record->is_sandbox ? 'Sandbox' : 'Producción') . ").")
                                    ->success()
                                    ->persistent()
                                    ->send();
                            } else {
                                Notification::make()
                                    ->title('Simulación Sandbox Exitosa')
                                    ->body('Modo Sandbox activo. Sesión de prueba generada.')
                                    ->warning()
                                    ->send();
                            }
                        } catch (\Exception $e) {
                            Notification::make()
                                ->title('✗ Error de Conexión con ATC')
                                ->body($e->getMessage())
                                ->danger()
                                ->persistent()
                                ->send();
                        }
                    }),

                Tables\Actions\EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListFoundations::route('/'),
            'create' => Pages\CreateFoundation::route('/create'),
            'edit'   => Pages\EditFoundation::route('/{record}/edit'),
        ];
    }
}
