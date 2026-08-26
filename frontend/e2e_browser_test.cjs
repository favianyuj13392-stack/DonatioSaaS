const { chromium } = require('playwright');

async function runE2ETests() {
  console.log('🚀 Iniciando suite de pruebas E2E para la arquitectura Donatio v3 (Multi-Tenant Modular + Widget 3 Pasos)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`  [BROWSER ${msg.type()}]: ${msg.text()}`);
  });

  page.on('response', async (response) => {
    if (response.url().includes('/api/v1/donations/')) {
      try {
        const body = await response.text();
        console.log(`  [API RES ${response.status()}] ${response.url().split('?')[0]}: ${body.slice(0, 120)}...`);
      } catch (e) {}
    }
  });

  try {
    console.log('\n--- 1. Navegando a la Landing Donatio v3 (?tenant=esperanza) ---');
    await page.goto('http://localhost:5173/?tenant=esperanza', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 60000 });

    const headline = await page.textContent('h1');
    console.log(`✅ H1 Headline Emocional: "${headline.trim()}"`);

    // Validar secciones modulares condicionales
    const impactEl = await page.$('h2:has-text("Tu aporte se convierte en ayuda concreta")');
    if (impactEl) {
      console.log('✅ 02. Impacto de tu Aporte detectado y renderizado.');
    }

    const storyEl = await page.$('h2:has-text("Cuando una familia llega a La Paz")');
    if (storyEl) {
      console.log('✅ 03. Historia Editorial detectada y renderizada.');
    }

    const resultsEl = await page.$('h2:has-text("Una trayectoria respaldada por vidas salvadas")');
    if (resultsEl) {
      console.log('✅ 04. Resultados Institucionales detectados y renderizados.');
    }

    // ==========================================
    // ESCENARIO 1: VISA FRICTIONLESS CON WIDGET DE 3 PASOS
    // ==========================================
    console.log('\n--- Escenario 1: Flujo en 3 Pasos - Donación Visa Bs. 50 ---');

    // Paso 1: Decidir
    await page.click('button:has-text("Bs. 50")');
    await page.waitForTimeout(200);

    const impactText = await page.textContent('text=Tu aporte puede cubrir:');
    console.log(`✅ Paso 1: Impacto verificado -> "${impactText.trim()}"`);

    console.log('Haciendo click en Continuar con Bs. 50...');
    await page.click('button:has-text("Continuar con Bs. 50")');
    await page.waitForTimeout(400);

    // Paso 2: Tus Datos
    await page.waitForSelector('h2:has-text("Tus datos de contacto")');
    console.log('✅ Paso 2: Formulario de datos de contacto abierto.');

    await page.fill('input[placeholder="Carlos Mamani"]', 'Carlos Mamani');
    await page.fill('input[placeholder="carlos.mamani@ejemplo.com"]', 'carlos.mamani@test.bo');

    console.log('Haciendo click en Ir al Pago (Paso 3)...');
    await page.click('button:has-text("Ir al Pago · Bs. 50")');
    await page.waitForTimeout(400);

    // Paso 3: Pago Seguro
    await page.waitForSelector('h2:has-text("Datos de la Tarjeta")');
    console.log('✅ Paso 3: Formulario de tarjeta bancaria abierto.');

    await page.fill('input[placeholder="4000 1234 5678 9010"]', '4000 1234 5678 9010');
    await page.fill('input[placeholder="JUAN PEREZ"]', 'CARLOS MAMANI');
    await page.fill('input[placeholder="12/28"]', '12/28');
    await page.fill('input[placeholder="123"]', '123');

    console.log('Confirmando donación en Paso 3...');
    await page.click('button[type="submit"]:has-text("Donar Bs. 50 Ahora")');

    await page.waitForSelector('text=¡Gracias por ser la esperanza de un niño!', { timeout: 45000 });
    console.log('✅ Modal Emocional de Éxito desplegado con botón de compartir en WhatsApp.');

    await page.click('button:has-text("Hacer otra donación")');
    await page.waitForSelector('text=¡Gracias por ser la esperanza de un niño!', { state: 'detached', timeout: 5000 });
    await page.waitForTimeout(500);

    // ==========================================
    // ESCENARIO 2: MASTERCARD AVS INTERNACIONAL (BS. 100)
    // ==========================================
    console.log('\n--- Escenario 2: Mastercard AVS Internacional (Bs. 100) ---');

    await page.click('button:has-text("Bs. 100")');
    await page.click('button:has-text("Continuar con Bs. 100")');
    await page.waitForTimeout(400);

    await page.fill('input[placeholder="Carlos Mamani"]', 'Maria Gonzalez');
    await page.fill('input[placeholder="carlos.mamani@ejemplo.com"]', 'maria.gonzalez@test.com');
    await page.click('button:has-text("Ir al Pago · Bs. 100")');
    await page.waitForTimeout(400);

    // Toggle Internacional
    await page.click('button:has-text("Internacional")');
    await page.waitForTimeout(200);

    await page.fill('input[placeholder="US, AR, ES"]', 'US');
    await page.fill('input[placeholder="FL, Madrid, etc."]', 'FL');
    await page.fill('input[placeholder="33101"]', '33101');

    await page.fill('input[placeholder="4000 1234 5678 9010"]', '5100 1234 5678 9010');
    await page.fill('input[placeholder="JUAN PEREZ"]', 'MARIA GONZALEZ');
    await page.fill('input[placeholder="12/28"]', '12/28');
    await page.fill('input[placeholder="123"]', '123');

    await page.click('button[type="submit"]:has-text("Donar Bs. 100 Ahora")');
    await page.waitForSelector('text=¡Gracias por ser la esperanza de un niño!', { timeout: 45000 });
    console.log('✅ Modal de Éxito para Mastercard Internacional desplegado.');

    await page.click('button:has-text("Hacer otra donación")');
    await page.waitForSelector('text=¡Gracias por ser la esperanza de un niño!', { state: 'detached', timeout: 5000 });
    await page.waitForTimeout(500);

    // ==========================================
    // ESCENARIO 3: SOCIO MENSUAL RECURRENTE (TMS)
    // ==========================================
    console.log('\n--- Escenario 3: Suscripción de Socio Mensual (Bs. 30 / mes) ---');

    await page.click('button:has-text("Cada mes")');
    await page.waitForTimeout(200);
    await page.click('button:has-text("Bs. 30")');
    await page.click('button:has-text("Continuar con Bs. 30")');
    await page.waitForTimeout(400);

    await page.fill('input[placeholder="Carlos Mamani"]', 'Roberto Perez');
    await page.fill('input[placeholder="carlos.mamani@ejemplo.com"]', 'roberto.perez@test.bo');
    await page.click('button:has-text("Ir al Pago · Bs. 30")');
    await page.waitForTimeout(400);

    await page.fill('input[placeholder="4000 1234 5678 9010"]', '4000 1234 5678 9010');
    await page.fill('input[placeholder="JUAN PEREZ"]', 'ROBERTO PEREZ');
    await page.fill('input[placeholder="12/28"]', '12/28');
    await page.fill('input[placeholder="123"]', '123');

    await page.click('button[type="submit"]:has-text("Ser Socio con Bs. 30 / mes")');
    await page.waitForSelector('text=¡Gracias por ser la esperanza de un niño!', { timeout: 45000 });
    console.log('✅ Suscripción de Socio Mensual procesada exitosamente.');

    console.log('\n🎉 ¡TODAS LAS PRUEBAS E2E DE LA ARQUITECTURA DONATIO V3 PASARON AL 100%!');
  } catch (error) {
    console.error('❌ Error durante la ejecución E2E:', error.message);
  } finally {
    await browser.close();
  }
}

runE2ETests();
