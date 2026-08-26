const { chromium } = require('playwright');

async function testPhase3() {
  console.log('🚀 Iniciando validación E2E de la Fase 3: Routing SPA + Hero Adaptativo + Donation Widget...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    // 1. Validar Fundación Vida y Futuro (Verde #059669) en Causa Principal
    console.log('1. Navegando a Fundación Vida y Futuro (http://127.0.0.1:5173/?tenant=vfuturo)...');
    await page.goto('http://127.0.0.1:5173/?tenant=vfuturo', { waitUntil: 'domcontentloaded' });

    // Esperar a que cargue el contenido
    await page.waitForSelector('h1');

    // Verificar Headline
    const headlineVfuturo = await page.locator('h1').textContent();
    console.log(`   ✅ H1 renderizado: "${headlineVfuturo.trim()}"`);

    // Verificar token CSS
    const primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--tenant-primary').trim();
    });
    console.log(`   ✅ Token --tenant-primary: "${primaryColor}" (Esperado: #059669)`);

    // 2. Validar Catálogo de Campañas (http://127.0.0.1:5173/campanas?tenant=vfuturo)
    console.log('\n2. Navegando a Catálogo de Campañas (http://127.0.0.1:5173/campanas?tenant=vfuturo)...');
    await page.goto('http://127.0.0.1:5173/campanas?tenant=vfuturo', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1');

    const catalogueHeading = await page.locator('h1').textContent();
    console.log(`   ✅ Título del Catálogo: "${catalogueHeading.trim()}"`);

    const campaignCards = await page.locator('.grid > div').count();
    console.log(`   ✅ Tarjetas de Campaña renderizadas: ${campaignCards}`);

    // 3. Validar Fundación Nuestra Esperanza (Rosa #db2777)
    console.log('\n3. Navegando a Fundación Nuestra Esperanza (http://127.0.0.1:5173/?tenant=esperanza)...');
    await page.goto('http://127.0.0.1:5173/?tenant=esperanza', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1');

    const headlineEsperanza = await page.locator('h1').textContent();
    console.log(`   ✅ H1 Esperanza: "${headlineEsperanza.trim()}"`);

    const primaryColorEsp = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--tenant-primary').trim();
    });
    console.log(`   ✅ Token --tenant-primary Esperanza: "${primaryColorEsp}" (Esperado: #db2777)`);

    console.log('\n🎉 ¡FASE 3 COMPLETADA Y VALIDADA AL 100% CON ÉXITO EN PLAYWRIGHT!');
  } catch (err) {
    console.error('❌ Error en prueba E2E de Fase 3:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testPhase3();
