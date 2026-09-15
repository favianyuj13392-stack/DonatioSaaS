const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/utils/metricNumber.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const exportsObject = {};
vm.runInNewContext(compiled.outputText, { exports: exportsObject });
const { parseMetricNumber } = exportsObject;

const cases = [
  ['+450', 450, '+225'],
  ['8 Años', 8, '4 Años'],
  ['100%', 100, '50%'],
  ['12.345,68 hectáreas', 12345.68, '6.172,84 hectáreas'],
  ['1,234.50 USD', 1234.5, '617.25 USD'],
  ['1 234 personas', 1234, '617 personas'],
  ['1\u202f234 personas', 1234, '617 personas'],
  ['12.345.678', 12345678, '6.172.839'],
  ['12,345,678', 12345678, '6,172,839'],
  ['0,50 millones', 0.5, '0,25 millones'],
  ['-8 años', 8, '-4 años'],
  ['  +450 familias  ', 450, '  +225 familias  '],
];
for (const [original, value, half] of cases) {
  test('Preserves numeric presentation: ' + original, () => {
    const parsed = parseMetricNumber(original);
    assert.ok(parsed);
    assert.equal(parsed.value, value);
    assert.equal(parsed.format(value / 2), half);
    assert.equal(parsed.format(value), original);
  });
}
for (const original of [
  '24/7', '450–500', '8 años y 4 meses', '1.234', '1,234',
  '1.23.456', '12,34,567', '1 23', '1e3', 'Sin datos',
  '', 'Infinity', '9007199254740992', '1.23456789',
]) {
  test('Leaves ambiguous or unsupported copy static: ' + original, () => {
    assert.equal(parseMetricNumber(original), null);
  });
}
