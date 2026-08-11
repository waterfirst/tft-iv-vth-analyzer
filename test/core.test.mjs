import test from 'node:test';
import assert from 'node:assert/strict';
import { generateExamples, groupCurves, extractVth, parseCSV, summarize } from '../core.mjs';

test('generates 100 NMOS and 100 PMOS curves deterministically', () => {
  const a = generateExamples();
  const b = generateExamples();
  const curves = groupCurves(a);
  assert.equal(curves.length, 200);
  assert.equal(curves.filter(c => c.type === 'NMOS').length, 100);
  assert.equal(curves.filter(c => c.type === 'PMOS').length, 100);
  assert.equal(a.length, 16200);
  assert.deepEqual(a.slice(0, 20), b.slice(0, 20));
});

test('extracts signed constant-current Vth for both polarities', () => {
  const curves = groupCurves(generateExamples());
  const n = extractVth(curves.find(c => c.type === 'NMOS'), { method: 'constant', currentTarget: 1e-8 });
  const p = extractVth(curves.find(c => c.type === 'PMOS'), { method: 'constant', currentTarget: 1e-8 });
  assert.equal(n.ok, true); assert.equal(p.ok, true);
  assert.ok(n.vth > 0); assert.ok(p.vth < 0);
});

test('sqrt extrapolation returns high quality fits on synthetic saturation curves', () => {
  const results = groupCurves(generateExamples()).map(c => extractVth(c, { method: 'sqrt' }));
  assert.ok(results.every(r => r.ok));
  assert.ok(results.filter(r => r.r2 > 0.98).length > 190);
});

test('parses aliases and infers PMOS from filename', () => {
  const parsed = parseCSV('dut,vgs,ids\nA,-2,-1e-8\nA,-3,-2e-7', 'pmos_batch.csv');
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0].type, 'PMOS');
});

test('skips blank Vg or Id instead of coercing blanks to zero', () => {
  const parsed = parseCSV('device_id,type,Vg,Id\nA,NMOS,,1e-9\nA,NMOS,2,\nA,NMOS,3,1e-7', 'nmos.csv');
  assert.equal(parsed.rows.length, 1);
  assert.deepEqual(parsed.warnings, [2, 3]);
});

test('fails geometry-normalized extraction when W/L is missing', () => {
  const data = 'device_id,type,Vg,Id\nA,NMOS,0,1e-12\nA,NMOS,1,1e-10\nA,NMOS,2,1e-8\nA,NMOS,3,1e-6\nA,NMOS,4,1e-5';
  const curve = groupCurves(parseCSV(data, 'nmos.csv').rows)[0];
  const result = extractVth(curve, { method: 'constant', currentTarget: 1e-8, normalizeGeometry: true });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'W/L 누락');
});

test('rejects low-quality sqrt extrapolation', () => {
  const sequence = [1, 9, 2, 8, 3, 7, 4, 6, 5, 8, 2, 9, 3];
  const rows = sequence.map((value, i) => ({ device_id: 'NOISY', type: 'NMOS', Vg: i, Id: value * 1e-7 }));
  const result = extractVth(groupCurves(rows)[0], { method: 'sqrt' });
  assert.equal(result.ok, false);
});

test('summarizes distribution', () => {
  const out = summarize([1, 2, 3, 4, 5]);
  assert.equal(out.mean, 3);
  assert.equal(out.median, 3);
  assert.ok(out.sigma > 1.5 && out.sigma < 1.6);
});
