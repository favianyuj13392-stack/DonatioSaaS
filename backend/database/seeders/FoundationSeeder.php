<?php

namespace Database\Seeders;

use App\Models\Campaign;
use App\Models\Foundation;
use App\Models\User;
use Illuminate\Database\Seeder;

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
                // Credenciales ATC Enlace Sandbox (Cifrado automático AES-256 en Foundation Model)
                'atc_merchant_id'       => 'test_merchant_esperanza',
                'atc_api_key_id'        => 'test_key_esperanza_123',
                'atc_secret_key'        => 'test_secret_esperanza_456',
                'atc_org_unit_id'       => 'org_unit_test_123',
                'is_sandbox'            => true,
                'status'                => 'active',
            ]
        );

        // 2. Campaña Principal: Navidad con Esperanza 2026
        Campaign::updateOrCreate(
            ['foundation_id' => $foundation->id, 'slug' => 'navidad-con-esperanza-2026'],
            [
                'title'                  => 'Navidad con Esperanza 2026',
                'headline'               => 'Que ningún niño abandone su tratamiento por falta de recursos.',
                'description'            => 'Ayudamos a 50 niños con cáncer y a sus familias a permanecer en La Paz durante su tratamiento oncológico integral.',
                'story_markdown'         => "La Fundación Nuestra Esperanza nació con la misión de evitar que los niños diagnosticados con cáncer en el área rural de Bolivia deban abandonar su tratamiento médico en el Hospital del Niño de La Paz por carecer de hospedaje, medicinas o alimentación adecuada.\n\nEn estos **8 años de labor ininterrumpida**, hemos canalizado cirugías complejas, quimioterapias y albergue integral a más de **450 familias bolivianas**.\n\nCon tu donación, estás financiando directamente insumos médicos, laboratorios especializados y la manutención mensual de una cama en nuestro albergue solidario.",
                'banner_url'             => 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
                'monetary_goal'          => 50000.00,
                'current_amount'         => 12980.00,
                'allowed_frequencies'    => 'all',
                'allowed_payment_methods'=> 'all',
                'donation_tiers'         => [
                    ['amount' => 50, 'label' => 'Medicamento Básico: Cubre analgésicos e insumos de curación', 'is_default' => false],
                    ['amount' => 100, 'label' => 'Albergue y Nutrición: 3 días de estadía y alimentación para madre y niño', 'is_default' => true],
                    ['amount' => 250, 'label' => 'Laboratorio Oncológico: Paquete completo de estudios hematológicos', 'is_default' => false],
                    ['amount' => 500, 'label' => 'Ciclo de Quimioterapia: Aporte sustancial para sesión médica', 'is_default' => false],
                ],
                'tangible_impact_items'  => [
                    [
                        'icon'           => 'bed',
                        'title'          => 'Albergue Solidario',
                        'description'    => 'Garantiza cama caliente y 3 comidas diarias para el paciente y su acompañante durante semanas de tratamiento.',
                        'stat_highlight' => 'Bs. 100',
                    ],
                    [
                        'icon'           => 'pill',
                        'title'          => 'Medicamentos Oncológicos',
                        'description'    => 'Fármacos coadyuvantes para contrarrestar efectos secundarios y proteger el sistema inmunológico.',
                        'stat_highlight' => 'Bs. 50',
                    ],
                    [
                        'icon'           => 'heart',
                        'title'          => 'Apoyo Emocional y Nutricional',
                        'description'    => 'Acompañamiento psicológico infantil y soporte nutricional especializado.',
                        'stat_highlight' => 'Bs. 250',
                    ],
                    [
                        'icon'           => 'sparkles',
                        'title'          => 'Tú Eliges Cuánto Ayudar',
                        'description'    => 'Cualquier monto marca la diferencia inmediata en el tratamiento de un niño.',
                        'stat_highlight' => 'Otro monto',
                    ],
                ],
                'testimonial'            => [
                    'quote'        => 'Cuando llegamos desde Potosí no teníamos dónde dormir ni para las medicinas de Matías. La Fundación no solo nos dio un techo, nos dio la esperanza de que mi hijo hoy esté sano.',
                    'author_name'  => 'María Choque',
                    'author_role'  => 'Mamá de Matías (Paciente recuperado)',
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

        // 4. Usuario SuperAdmin Global
        User::updateOrCreate(
            ['email' => 'admin@donatio.lat'],
            [
                'name'          => 'Superadmin Donatio',
                'password'      => 'password', // Hasheado automáticamente por Eloquent cast
                'foundation_id' => null,
                'role'          => 'superadmin',
            ]
        );
    }
}
