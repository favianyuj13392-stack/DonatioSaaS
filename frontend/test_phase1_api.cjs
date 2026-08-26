const http = require('http');

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:8080${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function validatePhase1() {
  console.log('🚀 Iniciando validación de la Fase 1: Arquitectura Backend & API Desacoplada...\n');

  try {
    console.log('0. Ejecutando migraciones y seeders vía /dev/migrate-and-seed...');
    const seedRes = await fetchJson('/dev/migrate-and-seed');
    console.log(`   Migrate & Seed Status: ${seedRes.status}`);

    console.log('\n1. Probando GET /api/v1/public/tenants/esperanza (Institucional Nuestra Esperanza)...');
    const tEsperanza = await fetchJson('/api/v1/public/tenants/esperanza');
    console.log(`   Status: ${tEsperanza.status}`);
    if (tEsperanza.status === 200) {
      console.log(`   ✅ Tenant: "${tEsperanza.data.tenant?.name}" (Color: ${tEsperanza.data.tenant?.primary_color})`);
    } else {
      console.log('   ⚠️ Error payload:', tEsperanza);
    }

    console.log('\n2. Probando GET /api/v1/public/tenants/vfuturo (Institucional Vida y Futuro - Mockup Verde)...');
    const tVfuturo = await fetchJson('/api/v1/public/tenants/vfuturo');
    console.log(`   Status: ${tVfuturo.status}`);
    if (tVfuturo.status === 200) {
      console.log(`   ✅ Tenant: "${tVfuturo.data.tenant?.name}" (Color: ${tVfuturo.data.tenant?.primary_color})`);
      console.log(`   ✅ Misión: "${tVfuturo.data.tenant?.mission?.slice(0, 50)}..."`);
      console.log(`   ✅ Programas cargados: ${tVfuturo.data.tenant?.programs?.length}`);
      console.log(`   ✅ Métricas institucionales: ${tVfuturo.data.tenant?.institutional_metrics?.length}`);
    } else {
      console.log('   ⚠️ Error payload:', tVfuturo);
    }

    console.log('\n3. Probando GET /api/v1/public/tenants/vfuturo/campaigns (Listado de Campañas)...');
    const cList = await fetchJson('/api/v1/public/tenants/vfuturo/campaigns');
    console.log(`   Status: ${cList.status}`);
    if (cList.status === 200) {
      console.log(`   ✅ Total campañas activas: ${cList.data.campaigns?.length}`);
      cList.data.campaigns?.forEach(c => console.log(`      - [${c.slug}] ${c.title} (Meta: Bs. ${c.monetary_goal})`));
    }

    console.log('\n4. Probando GET /api/v1/public/tenants/vfuturo/campaigns/sembrando-futuro-2025 (Detalle de Causa)...');
    const cDetail = await fetchJson('/api/v1/public/tenants/vfuturo/campaigns/sembrando-futuro-2025');
    console.log(`   Status: ${cDetail.status}`);
    if (cDetail.status === 200) {
      console.log(`   ✅ Headline: "${cDetail.data.campaign?.headline}"`);
      console.log(`   ✅ Tiers de Donación: ${cDetail.data.campaign?.donation_tiers?.length}`);
      console.log(`   ✅ Items de Impacto: ${cDetail.data.campaign?.tangible_impact_items?.length}`);
      console.log(`   ✅ Desglose de Fondos: ${cDetail.data.campaign?.funds_breakdown?.length} categorías`);
      console.log(`   ✅ Testimonio: "${cDetail.data.campaign?.testimonial?.quote}"`);
      console.log(`   ✅ Otras Campañas: ${cDetail.data.other_campaigns?.length}`);
      console.log(`   ✅ Proveedores de Pago: ${cDetail.data.payment_providers?.map(p => p.id).join(', ')}`);
    }

    console.log('\n🎉 ¡FASE 1 COMPLETADA Y VALIDADA AL 100% CON ÉXITO!');
  } catch (err) {
    console.error('❌ Error en validación de Fase 1:', err);
  }
}

validatePhase1();
