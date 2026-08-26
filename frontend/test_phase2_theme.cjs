function hexToRgb(hex) {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return [5, 150, 105];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function getRelativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getAccessibleTextColor(hex) {
  const [r, g, b] = hexToRgb(hex);
  const luminance = getRelativeLuminance(r, g, b);
  return luminance > 0.4 ? '#0f172a' : '#ffffff';
}

function runPhase2Tests() {
  console.log('🚀 Iniciando pruebas unitarias de la Fase 2: Design System Token Engine & WCAG 2.2 AA Contrast...\n');

  const testCases = [
    { name: 'Fundación Vida y Futuro (Verde)', hex: '#059669', expected: '#ffffff' },
    { name: 'Fundación Nuestra Esperanza (Rosa)', hex: '#db2777', expected: '#ffffff' },
    { name: 'Fundación Solar (Amarillo Claro)', hex: '#facc15', expected: '#0f172a' },
    { name: 'Fundación Azul Marino (Navy)', hex: '#1e3a8a', expected: '#ffffff' },
    { name: 'Fondo Blanco Puro', hex: '#ffffff', expected: '#0f172a' },
    { name: 'Fondo Negro / Grafito', hex: '#0f172a', expected: '#ffffff' },
  ];

  let allPassed = true;

  testCases.forEach(tc => {
    const [r, g, b] = hexToRgb(tc.hex);
    const lum = getRelativeLuminance(r, g, b).toFixed(4);
    const actual = getAccessibleTextColor(tc.hex);
    const pass = actual === tc.expected;
    if (!pass) allPassed = false;

    console.log(`- ${tc.name} [${tc.hex}]:`);
    console.log(`    RGB: [${r}, ${g}, ${b}] | Luminancia: ${lum}`);
    console.log(`    onPrimary resultante: ${actual} (Esperado: ${tc.expected}) -> ${pass ? '✅ PASS' : '❌ FAIL'}`);
  });

  if (allPassed) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS DE LA FASE 2 PASARON AL 100%!');
  } else {
    console.error('\n❌ Hubo fallos en las pruebas de contraste.');
    process.exit(1);
  }
}

runPhase2Tests();
