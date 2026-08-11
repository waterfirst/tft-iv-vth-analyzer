import test from 'node:test';
import assert from 'node:assert/strict';
import { generateExamples, groupCurves, extractVth, extractIoff, parseCSV, summarize } from '../core.mjs';

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

test('extracts signed Vth at |Id| = 1e-10 A for both polarities', () => {
  const curves = groupCurves(generateExamples());
  const n = extractVth(curves.find(c => c.type === 'NMOS'), { method: 'constant' });
  const p = extractVth(curves.find(c => c.type === 'PMOS'), { method: 'constant' });
  assert.equal(n.ok, true); assert.equal(p.ok, true);
  assert.ok(n.vth > 0); assert.ok(p.vth < 0);
  assert.equal(n.target, 1e-10); assert.equal(p.target, 1e-10);
});

test('returns the Vg point where |d|Id|/dVg| is maximum', () => {
  const curve = groupCurves([0, 1, 10, 12, 13].map((current, Vg) => ({
    device_id: 'SLOPE', type: 'NMOS', Vg, Id: Math.max(current, 1e-14)
  })))[0];
  const result = extractVth(curve, { method: 'maxslope' });
  assert.equal(result.ok, true);
  assert.equal(result.vth, 2);
  assert.ok(result.peakSlope > 5);
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

test('extracts Ioff at a specified gate voltage in log-current space', () => {
  const curve = groupCurves([
    { device_id: 'N', type: 'NMOS', Vg: -1, Id: 1e-14 },
    { device_id: 'N', type: 'NMOS', Vg: 1, Id: 1e-10 }
  ])[0];
  const result = extractIoff(curve, 0);
  assert.equal(result.ok, true);
  assert.ok(Math.abs(Math.log10(result.current) + 12) < 1e-12);
  assert.equal(extractIoff(curve, 2).ok, false);
});

test('summarizes distribution', () => {
  const out = summarize([1, 2, 3, 4, 5]);
  assert.equal(out.mean, 3);
  assert.equal(out.median, 3);
  assert.ok(out.sigma > 1.5 && out.sigma < 1.6);
});
