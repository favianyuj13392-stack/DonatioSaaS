<?php

namespace Database\Seeders;

use App\Models\Campaign;
use App\Models\Foundation;
use Illuminate\Database\Seeder;

class VidaYFuturoSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Crear Fundación Vida y Futuro (Verde #059669)
        $foundation = Foundation::updateOrCreate(
            ['subdomain' => 'vfuturo'],
            [
                'name'                  => 'Fundación Vida y Futuro',
                'legal_name'            => 'Fundación Vida y Futuro de Bolivia',
                'code'                  => 'FVF',
                'contact_email'         => 'info@vidayfuturo.org',
                'phone'                 => '+591 700 12345',
                'location_city'         => 'Cochabamba, Bolivia',
                'nit'                   => '3456789023',
                'legal_id_details'      => 'Personería Jurídica Nº 0456/2015',
                'logo_url'              => 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=200&q=80',
                'primary_color'         => '#059669',
                'primary_color_hover'   => '#047857',
                'secondary_color'       => '#064e3b',
                'hero_headline'         => 'Restauramos la naturaleza para proteger el futuro de Bolivia.',
                'hero_description'      => 'Unimos comunidades, ciencia y voluntarios para reforestar áreas degradadas y sembrar esperanza.',
                'hero_cta_text'         => 'Conoce nuestros programas',
                'about_text'            => 'Somos una organización boliviana dedicada a la restauración ecológica comunitaria y la conservación de la biodiversidad en los Andes y la Amazonía.',
                'mission'               => 'Restauramos ecosistemas, protegemos la biodiversidad y construimos un futuro sostenible para Bolivia.',
                'vision'                => 'Ser la organización líder en reforestación comunitaria y conservación ambiental participativa.',
                'values'                => ['Transparencia Activa', 'Sostenibilidad Comunitaria', 'Rigor Científico', 'Impacto Medible'],
                'programs'              => [
                    [
                        'title'       => 'Reforestación Andina',
                        'description' => 'Producción y siembra de especies nativas de queñua y aliso.',
                        'icon'        => 'tree',
                    ],
                    [
                        'title'       => 'Guardianes del Agua',
                        'description' => 'Protección y limpieza de cuencas hídricas en valles interandinos.',
                        'icon'        => 'droplet',
                    ],
                    [
                        'title'       => 'Escuelas Verdes',
                        'description' => 'Talleres de agroecología y viveros escolares para jóvenes.',
                        'icon'        => 'book',
                    ],
                ],
                'institutional_metrics' => [
                    ['value' => '120.000', 'label' => 'Árboles plantados en 12 departamentos'],
                    ['value' => '1.250 ha', 'label' => 'Áreas reforestadas y en recuperación'],
                    ['value' => '8 Años', 'label' => 'De trabajo continuo con comunidades'],
                    ['value' => '100%', 'label' => 'Transparencia y rendición de cuentas anual'],
                ],
                'corporate_partners'    => [
                    ['name' => 'WWF Bolivia', 'logo_url' => 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80', 'website_url' => 'https://www.wwf.org.bo'],
                    ['name' => 'The Nature Conservancy', 'logo_url' => 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=200&q=80', 'website_url' => 'https://www.nature.org'],
                    ['name' => 'CAF', 'logo_url' => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80', 'website_url' => 'https://www.caf.com'],
                ],
                'atc_merchant_id'       => 'redenlace_vfuturo',
                'atc_api_key_id'        => 'key_vfuturo_test',
                'atc_secret_key'        => 'secret_vfuturo_test',
                'is_sandbox'            => true,
                'status'                => 'active',
            ]
        );

        // 2. Campaña Principal: Sembrando Futuro 2025
        Campaign::updateOrCreate(
            ['foundation_id' => $foundation->id, 'slug' => 'sembrando-futuro-2025'],
            [
                'title'                  => 'Campaña Sembrando Futuro 2025',
                'headline'               => 'Cada árbol que plantamos hoy, es vida para mañana.',
                'description'            => 'Únete a nuestra misión de reforestar áreas degradadas, proteger la biodiversidad y construir un planeta más saludable.',
                'story_markdown'         => "Desde 2012, en Fundación Vida y Futuro trabajamos con comunidades, escuelas y voluntarios para recuperar nuestros bosques y cuencas.\n\nHemos reforestado más de **1.200 hectáreas** en todo el país y capacitado a miles de jóvenes como guardianes de la naturaleza.\n\nCon tu apoyo, seguimos creando vida, restaurando ecosistemas y enfrentando juntos el cambio climático.",
                'banner_url'             => 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
                'monetary_goal'          => 120000.00,
                'current_amount'         => 27650.00,
                'allowed_frequencies'    => 'all',
                'allowed_payment_methods'=> 'all',
                'monthly_label'          => 'Aporte Mensual',
                'single_label'           => 'Aporte Único',
                'donation_tiers'         => [
                    ['amount' => 20, 'label' => 'Plántulas nativas: Producción de plántulas en vivero', 'is_default' => false],
                    ['amount' => 50, 'label' => 'Cuidado y riego: Mantenimiento durante primeros meses', 'is_default' => true],
                    ['amount' => 100, 'label' => 'Protección de áreas: Respaldo de 100 m² de bosque', 'is_default' => false],
                    ['amount' => 200, 'label' => 'Bosque Comunitario: 20 árboles nativos plantados', 'is_default' => false],
                ],
                'tangible_impact_items'  => [
                    ['icon' => 'tree', 'title' => 'Plántulas nativas', 'description' => 'Permite producir plántulas en vivero para reforestación.', 'stat_highlight' => 'Bs. 20'],
                    ['icon' => 'droplet', 'title' => 'Cuidado y riego', 'description' => 'Garantiza el riego y cuidado de 50 árboles jóvenes.', 'stat_highlight' => 'Bs. 50'],
                    ['icon' => 'shield', 'title' => 'Protección de áreas', 'description' => 'Ayuda a proteger 100 m² de áreas reforestadas.', 'stat_highlight' => 'Bs. 100'],
                    ['icon' => 'heart', 'title' => 'Tú eliges cuánto ayudar', 'description' => 'Cada aporte suma y genera impacto real.', 'stat_highlight' => 'Otro monto'],
                ],
                'testimonial'            => [
                    'quote'        => 'No heredamos la tierra de nuestros antepasados, la tomamos prestada de nuestros hijos.',
                    'author_name'  => 'Proverbio Indígena',
                    'author_role'  => 'Sabiduría Ancestral',
                    'location'     => 'Bolivia',
                ],
                'funds_breakdown'        => [
                    ['category' => 'Reforestación', 'amount' => 60, 'percentage' => 60, 'description' => 'Plantación de árboles nativos y restauración de ecosistemas.'],
                    ['category' => 'Educación ambiental', 'amount' => 25, 'percentage' => 25, 'description' => 'Programas de educación y talleres en comunidades.'],
                    ['category' => 'Administración', 'amount' => 15, 'percentage' => 15, 'description' => 'Gestión responsable y monitoreo de proyectos.'],
                ],
                'thank_you_message'      => '¡Gracias por sembrar futuro! Tu aporte contribuye directamente a la reforestación de nuestros bosques.',
                'status'                 => 'active',
            ]
        );

        // 3. Otras Campañas Activas de Vida y Futuro
        Campaign::updateOrCreate(
            ['foundation_id' => $foundation->id, 'slug' => 'guardianes-de-la-cuenca'],
            [
                'title'                  => 'Guardianes de la Cuenca',
                'headline'               => 'Agua limpia para comunidades andinas.',
                'description'            => 'Protección de fuentes de agua en comunidades rurales mediante reforestación de riberas.',
                'banner_url'             => 'https://images.unsplash.com/photo-1516214104703-d870798883c5?auto=format&fit=crop&w=800&q=80',
                'monetary_goal'          => 60000.00,
                'current_amount'         => 18500.00,
                'status'                 => 'active',
            ]
        );

        Campaign::updateOrCreate(
            ['foundation_id' => $foundation->id, 'slug' => 'sin-plasticos-en-los-rios'],
            [
                'title'                  => 'Sin Plásticos en los Ríos',
                'headline'               => 'Limpieza y biorestauración de ecosistemas acuáticos.',
                'description'            => 'Reducción de contaminación y plásticos en ríos con trampas ecológicas y voluntarios.',
                'banner_url'             => 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=800&q=80',
                'monetary_goal'          => 40000.00,
                'current_amount'         => 9700.00,
                'status'                 => 'active',
            ]
        );

        Campaign::updateOrCreate(
            ['foundation_id' => $foundation->id, 'slug' => 'escuelas-verdes'],
            [
                'title'                  => 'Escuelas Verdes',
                'headline'               => 'Educación ambiental y huertos escolares.',
                'description'            => 'Educación ambiental para niños y jóvenes con huertos orgánicos en escuelas rurales.',
                'banner_url'             => 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
                'monetary_goal'          => 25000.00,
                'current_amount'         => 6250.00,
                'status'                 => 'active',
            ]
        );
    }
}
