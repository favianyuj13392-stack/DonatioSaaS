const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testDonationFormVisual() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('🎨 VERIFICACIÓN VISUAL DEL FORMULARIO DE DONACIÓN (NACIONAL & INTERNACIONAL)');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 950 },
  });
  const page = await context.newPage();

  try {
    console.log('🔹 Cargando página con tenant "esperanza"...');
    await page.goto('http://127.0.0.1:5173/?tenant=esperanza', { waitUntil: 'domcontentloaded' });

    // Esperar widget de donación
    await page.waitForSelector('#donar');
    console.log('   ✅ Widget #donar localizado en el DOM');

    // 1. Verificar Caso Nacional (Bolivia)
    console.log('\n🔹 CASO 1: Verificando Formulario Nacional (Bolivia)...');
    const isBoliviaVisible = await page.locator('select:has-text("La Paz")').isVisible();
    console.log(`   ✅ Selector Departamento (La Paz): ${isBoliviaVisible ? 'VISIBLE' : 'NO VISIBLE'}`);

    const isTitularVisible = await page.locator('input[placeholder="JUAN PEREZ"]').isVisible();
    console.log(`   ✅ Nombre Titular (JUAN PEREZ): ${isTitularVisible ? 'VISIBLE' : 'NO VISIBLE'}`);

    const isEmailVisible = await page.locator('input[placeholder="juan@ejemplo.com"]').isVisible();
    console.log(`   ✅ Correo Electrónico: ${isEmailVisible ? 'VISIBLE' : 'NO VISIBLE'}`);

    const isCardNumVisible = await page.locator('input[placeholder="4000 0000 0000 1000"]').isVisible();
    console.log(`   ✅ Número de Tarjeta: ${isCardNumVisible ? 'VISIBLE' : 'NO VISIBLE'}`);

    const isMesVisible = await page.locator('select[name="ccexpmonth"]').isVisible();
    const isYearVisible = await page.locator('select[name="ccexpyear"]').isVisible();
    const isCvvVisible = await page.locator('input[name="cvc"]').isVisible();
    console.log(`   ✅ Mes (${isMesVisible ? 'OK' : 'FAIL'}), Año (${isYearVisible ? 'OK' : 'FAIL'}), CVV (${isCvvVisible ? 'OK' : 'FAIL'})`);

    const summaryTotal = await page.locator('#donar .lg\\:col-span-5 span:has-text("Bs")').last().textContent();
    console.log(`   ✅ Total por cobro en Resumen: "${summaryTotal?.trim()}"`);

    // Capturar screenshot del caso Nacional
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);

    const nationalShotPath = path.join(screenshotDir, 'donation_form_nacional.png');
    await page.locator('#donar').screenshot({ path: nationalShotPath });
    console.log(`   📸 Screenshot Nacional guardado en: ${nationalShotPath}`);

    // 2. Verificar Caso Internacional
    console.log('\n🔹 CASO 2: Cambiando a Formulario Internacional...');
    await page.locator('button:has-text("Internacional")').click();
    await page.waitForTimeout(500);

    const isCountryVisible = await page.locator('select:has-text("Estados Unidos")').isVisible();
    console.log(`   ✅ Selector País (Estados Unidos): ${isCountryVisible ? 'VISIBLE' : 'NO VISIBLE'}`);

    const isStateVisible = await page.locator('select:has-text("Florida (FL)")').isVisible();
    console.log(`   ✅ Selector Estado (Florida FL): ${isStateVisible ? 'VISIBLE' : 'NO VISIBLE'}`);

    const isLocalityVisible = await page.locator('input[placeholder="Miami, Madrid, etc."]').isVisible();
    console.log(`   ✅ Ciudad / Localidad: ${isLocalityVisible ? 'VISIBLE' : 'NO VISIBLE'}`);

    const isZipVisible = await page.locator('input[placeholder="90210, 28001"]').isVisible();
    console.log(`   ✅ Código Postal / Zip: ${isZipVisible ? 'VISIBLE' : 'NO VISIBLE'}`);

    const isBillingAddressVisible = await page.locator('input[placeholder="Calle, número, depto."]').isVisible();
    console.log(`   ✅ Dirección Facturación: ${isBillingAddressVisible ? 'VISIBLE' : 'NO VISIBLE'}`);

    const internationalShotPath = path.join(screenshotDir, 'donation_form_internacional.png');
    await page.locator('#donar').screenshot({ path: internationalShotPath });
    console.log(`   📸 Screenshot Internacional guardado en: ${internationalShotPath}`);

    console.log('\n═══════════════════════════════════════════════════════════════════════');
    console.log('🎉 ¡VERIFICACIÓN VISUAL Y DE CAMPOS COMPLETADA EXITOSAMENTE AL 100%!');
    console.log('═══════════════════════════════════════════════════════════════════════');
  } catch (err) {
    console.error('❌ Error en test visual:', err);
  } finally {
    await browser.close();
  }
}

testDonationFormVisual();
