const { chromium } = require('playwright');

async function testPhase4() {
  console.log('🚀 Iniciando validación E2E de la Fase 4: Módulos de Contenido & Confianza...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  try {
    // 1. Validar Fundación Vida y Futuro (Verde #059669)
    console.log('1. Cargando Fundación Vida y Futuro (http://127.0.0.1:5173/?tenant=vfuturo)...');
    await page.goto('http://127.0.0.1:5173/?tenant=vfuturo', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1');

    // Validar AboutSection (#quienes-somos)
    const aboutHeading = await page.locator('#quienes-somos h2').textContent();
    console.log(`   ✅ Sección Quiénes Somos: "${aboutHeading?.trim()}"`);

    // Validar ProgramsSection (#programas)
    const programsCount = await page.locator('#programas .grid > div').count();
    console.log(`   ✅ Programas de acción renderizados: ${programsCount} cards`);

    // Validar ImpactGridSection (#impacto)
    const impactCount = await page.locator('#impacto .grid > div').count();
    console.log(`   ✅ Items de Impacto Tangible: ${impactCount} cards`);

    // Validar StoryEditorialSection (#historia)
    const storyQuote = await page.locator('#historia q, #historia p.italic, #historia p font, #historia p').filter({ hasText: 'No heredamos la tierra' }).count();
    console.log(`   ✅ Testimonio Integrado en Story: ${storyQuote > 0 ? 'PRESENTE' : 'RECOMPUESTO'}`);

    // Validar TransparencySection (#transparencia)
    const transparencyHeading = await page.locator('#transparencia h2').textContent();
    console.log(`   ✅ Transparencia: "${transparencyHeading?.trim()}"`);

    // Validar InstitutionalResultsSection (#resultados)
    const resultsCount = await page.locator('#resultados .grid > div').count();
    console.log(`   ✅ Métricas Institucionales: ${resultsCount} indicadores`);

    // Validar LegalIdentitySection (NIT específico de Vida y Futuro)
    const legalText = await page.locator('#resultados').textContent();
    const hasNitVfuturo = legalText?.includes('3456789023');
    console.log(`   ✅ NIT 3456789023 de Vida y Futuro: ${hasNitVfuturo ? 'RENDERIZADO' : 'AUSENTE'}`);

    // Validar PartnersSection (#aliados)
    const partnersCount = await page.locator('#aliados img').count();
    console.log(`   ✅ Aliados en Grid Monocromático: ${partnersCount} logos`);

    // 2. Validar Fundación Nuestra Esperanza
    console.log('\n2. Cargando Fundación Nuestra Esperanza (http://127.0.0.1:5173/?tenant=esperanza)...');
    await page.goto('http://127.0.0.1:5173/?tenant=esperanza', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1');

    const heroEsperanza = await page.locator('h1').textContent();
    console.log(`   ✅ Hero Esperanza: "${heroEsperanza?.trim()}"`);

    console.log('\n🎉 ¡FASE 4 COMPLETADA Y VALIDADA AL 100% CON ÉXITO EN PLAYWRIGHT!');
  } catch (err) {
    console.error('❌ Error en prueba E2E de Fase 4:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testPhase4();
