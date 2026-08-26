<?php

namespace Database\Seeders;

use App\Models\Campaign;
use App\Models\Foundation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class FoundationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Tenant de Prueba: Fundación Nuestra Esperanza (Sandbox ATC)
        $foundation = Foundation::updateOrCreate(
            ['subdomain' => 'esperanza'],
            [
                'name'                  => 'Fundación Nuestra Esperanza',
                'legal_name'            => 'Fundación Benéfica Nuestra Esperanza de Bolivia',
                'code'                  => 'FNE',
                'contact_email'         => 'contacto@fundacionesperanza.org',
                'phone'                 => '+591 70000000',
                'location_city'         => 'La Paz, Bolivia',
                'nit'                   => '1029384756',
                'legal_id_details'      => 'Personería Jurídica N° 482/2018',
                'logo_url'              => 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=400&q=80',
                'primary_color'         => '#db2777', // Rosa institucional
                'primary_color_hover'   => '#be185d',
                'secondary_color'       => '#0f172a',
                'mission'               => 'Canalizar ayuda integral, tratamientos médicos y albergue digno a familias de escasos recursos que luchan contra el cáncer infantil.',
                'vision'                => 'Consolidar una red sostenible de padrinos en Bolivia que garantice que ningún niño abandone su tratamiento oncológico por falta de recursos.',
                'institutional_metrics' => [
                    ['value' => '+450', 'label' => 'Niños Atendidos'],
                    ['value' => '8 Años', 'label' => 'De Trayectoria'],
                    ['value' => '100%', 'label' => 'Auditoría Transparente'],
                ],
                'corporate_partners'    => [
                    [
                        'name'        => 'Banco Nacional de Bolivia',
                        'logo_url'    => 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
                        'website_url' => 'https://www.bnb.com.bo',
                    ],
                    [
                        'name'        => 'Droguería Inti',
                        'logo_url'    => 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=200&q=80',
                        'website_url' => 'https://www.inti.com.bo',
                    ],
                    [
                        'name'        => 'Laboratorios Bagó',
                        'logo_url'    => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80',
                        'website_url' => 'https://www.bago.com.bo',
                    ],
                ],
                'atc_merchant_id'       => 'redenlace_000021',
                'atc_api_key_id'        => '3ada8327-76bd-4ed9-9952-0e8288f6e212',
                'atc_secret_key'        => '/zFZFhYflXW/P3BMzkULTcIuJhdcXCVD9SKJEo+fJXo=',
                'atc_org_unit_id'       => 'org_unit_test_123',
                'is_sandbox'            => true,
                'status'                => 'active',
            ]
        );

        // Bind temporal para que el trait BelongsToTenant auto-asigne el tenant
        app()->instance('current_tenant', $foundation);

        // 2. Campaña Principal: Navidad con Esperanza 2026
        Campaign::updateOrCreate(
            ['foundation_id' => $foundation->id, 'slug' => 'navidad-con-esperanza-2026'],
            [
                'title'                  => 'Navidad con Esperanza 2026',
                'headline'               => 'Que ningún niño abandone su tratamiento por falta de recursos.',
                'description'            => 'Ayudamos a 50 niños con cáncer y a sus familias a permanecer en La Paz durante su tratamiento oncológico integral.',
                'story_markdown'         => "Cada semana, mamás y papás viajan más de 14 horas desde comunidades rurales de Bolivia con sus hijos en brazos. Al llegar al hospital oncológico, se enfrentan a un diagnóstico devastador y a la dura realidad de no tener recursos para costear las ampollas de quimioterapia ni un lugar donde pasar la noche.\n\nEl mayor riesgo no es la enfermedad: es el abandono del tratamiento por falta de dinero.\n\nCon tu donación, garantizamos que cada niño permanezca en nuestro albergue con nutrición completa y medicación continua hasta tocar la campana de la victoria.",
                'story_image_url'        => 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
                'banner_url'             => 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
                'monetary_goal'          => 50000.00,
                'current_amount'         => 12980.00,
                'allowed_frequencies'    => 'all',
                'allowed_payment_methods'=> 'all',
                'monthly_label'          => 'Cada mes (Padrino)',
                'single_label'           => 'Una sola vez',
                'donation_tiers'         => [
                    ['amount' => 30, 'label' => 'Alimentación de 1 día (niño + mamá)', 'is_default' => false],
                    ['amount' => 50, 'label' => '1 Kit de medicamentos esenciales', 'is_default' => true],
                    ['amount' => 100, 'label' => '3 Días de albergue y atención médica integral', 'is_default' => false],
                    ['amount' => 250, 'label' => 'Tratamiento semanal y análisis de laboratorio', 'is_default' => false],
                ],
                'tangible_impact_items'  => [
                    [
                        'icon'           => 'utensils',
                        'title'          => 'Alimentación',
                        'description'    => 'Cubre 3 comidas nutritivas y merienda para el niño y su acompañante en el albergue.',
                        'stat_highlight' => 'Bs. 30',
                    ],
                    [
                        'icon'           => 'pill',
                        'title'          => 'Medicamentos',
                        'description'    => 'Ampollas de quimioterapia básica, analgésicos y sueros de hidratación hospitalaria.',
                        'stat_highlight' => 'Bs. 50',
                    ],
                    [
                        'icon'           => 'home',
                        'title'          => 'Albergue y Atención',
                        'description'    => 'Hospedaje seguro, cama limpia, agua caliente y asistencia social integral.',
                        'stat_highlight' => 'Bs. 100',
                    ],
                ],
                'funds_breakdown'        => [
                    ['title' => 'Tratamiento Médico', 'percentage' => 70, 'description' => 'Compra directa de fármacos oncológicos y análisis clínicos.', 'color' => '#db2777'],
                    ['title' => 'Albergue y Nutrición', 'percentage' => 20, 'description' => 'Hospedaje digno, agua caliente y 3 comidas diarias.', 'color' => '#4f46e5'],
                    ['title' => 'Traslados y Logística', 'percentage' => 10, 'description' => 'Pasajes y logística para familias de zonas rurales.', 'color' => '#94a3b8'],
                ],
                'testimonial'            => [
                    'quote'        => 'Cuando nos diagnosticaron a Mateo en Potosí, no teníamos ni para el pasaje. Gracias a los padrinos y al albergue, mi hijo pudo completar sus quimioterapias y hoy está sano.',
                    'author_name'  => 'Rosa Flores',
                    'author_role'  => 'Madre de Mateo (6 años)',
                    'location'     => 'Caso Real · La Paz, Bolivia',
                    'image_url'    => 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=400&q=80',
                ],
                'thank_you_message'      => '¡Tu generosidad salva vidas! Te hemos enviado el comprobante oficial de donación a tu correo electrónico.',
                'start_date'             => now()->startOfMonth(),
                'end_date'               => now()->addMonths(2)->endOfMonth(),
                'status'                 => 'active',
            ]
        );

        // 3. Campaña Secundaria: Padrinos de Vida (Solo Mensual)
        Campaign::updateOrCreate(
            ['foundation_id' => $foundation->id, 'slug' => 'padrinos-de-vida'],
            [
                'title'                  => 'Padrinos de Vida',
                'headline'               => 'El cáncer no espera. Tu compromiso mensual salva vidas.',
                'description'            => 'Conviértete en socio mensual y asegura la medicación continua y albergue de nuestros pequeños guerreros.',
                'story_markdown'         => "Un aporte mensual recurrente permite planificar la compra anticipada de medicamentos y asegura camas permanentes en nuestro albergue para que ningún niño deba interrumpir su tratamiento por falta de fondos.",
                'story_image_url'        => 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=800&q=80',
                'banner_url'             => 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80',
                'monetary_goal'          => 20000.00,
                'current_amount'         => 8300.00,
                'allowed_frequencies'    => 'monthly_only',
                'allowed_payment_methods'=> 'card_only',
                'monthly_label'          => 'Ser Padrino Mensual',
                'single_label'           => 'Aporte Único',
                'donation_tiers'         => [
                    ['amount' => 30, 'label' => 'Padrino Bronce: Nutrición mensual básica', 'is_default' => false],
                    ['amount' => 50, 'label' => 'Padrino Plata: Cobertura mensual de fármacos', 'is_default' => true],
                    ['amount' => 100, 'label' => 'Padrino Oro: Albergue y tratamiento integral', 'is_default' => false],
                ],
                'tangible_impact_items'  => [
                    [
                        'icon'           => 'heart',
                        'title'          => 'Padrinazgo Continuo',
                        'description'    => 'Un compromiso mensual que brinda estabilidad financiera para que ningún tratamiento se detenga.',
                        'stat_highlight' => '100%',
                    ],
                ],
                'testimonial'            => [
                    'quote'        => 'Ser padrino mensual me da la certeza de que mi granito de arena llega todos los meses a un niño que realmente lo necesita.',
                    'author_name'  => 'Carlos Villarroel',
                    'author_role'  => 'Padrino de Vida desde 2022',
                    'location'     => 'La Paz, Bolivia',
                ],
                'thank_you_message'      => '¡Bienvenido a la familia de Padrinos de Vida! Tu aporte mensual transforma el futuro de un niño.',
                'start_date'             => now()->startOfYear(),
                'end_date'               => null,
                'status'                 => 'active',
            ]
        );

        // 4. Usuario Administrador para Filament CMS
        \App\Models\User::updateOrCreate(
            ['email' => 'admin@donatio.lat'],
            [
                'name'          => 'Administrador Donatio',
                'password'      => Hash::make('password'),
                'foundation_id' => $foundation->id,
                'role'          => 'tenant_admin',
            ]
        );
    }
}
