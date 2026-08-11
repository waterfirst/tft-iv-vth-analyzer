const ALIASES = {
  device: ['device_id', 'device', 'id', 'sample', 'sample_id', 'dut'],
  type: ['type', 'polarity', 'channel', 'device_type'],
  vg: ['vg', 'vgs', 'gate_voltage', 'gatevoltage'],
  id: ['id', 'ids', 'drain_current', 'draincurrent'],
  vd: ['vd', 'vds', 'drain_voltage', 'drainvoltage'],
  w: ['w_um', 'width_um', 'width'],
  l: ['l_um', 'length_um', 'length']
};

export function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function normal(random) {
  const u = Math.max(random(), 1e-12);
  const v = Math.max(random(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function generateExamples(countPerType = 100, seed = 20260811) {
  const random = mulberry32(seed);
  const rows = [];
  const create = (type, idx) => {
    const polarity = type === 'NMOS' ? 1 : -1;
    const baseVth = type === 'NMOS' ? 2.45 : 2.7;
    let vthMag = baseVth + normal(random) * 0.42;
    if (idx === 96) vthMag += 1.25;
    if (idx === 97) vthMag -= 1.15;
    const ss = Math.max(0.18, 0.30 + normal(random) * 0.035);
    const gain = Math.exp(normal(random) * 0.18) * (type === 'NMOS' ? 2.4e-6 : 1.75e-6);
    const ioff = Math.exp(normal(random) * 0.32) * 1.2e-12;
    const width = 40 + (idx % 5) * 10;
    const length = 8 + (idx % 3) * 2;
    for (let step = 0; step <= 80; step += 1) {
      const orientedVg = -5 + step * 0.25;
      const vg = polarity * orientedVg;
      const overdrive = orientedVg - vthMag;
      const sub = ioff * Math.pow(10, Math.min(overdrive / ss, 4.2));
      const above = overdrive > 0 ? gain * overdrive * overdrive : 0;
      const noise = Math.exp(normal(random) * (overdrive > 0 ? 0.018 : 0.055));
      const magnitude = Math.max(1e-14, (sub + above) * noise);
      rows.push({
        device_id: `${type[0]}${String(idx + 1).padStart(3, '0')}`,
        type,
        Vg: Number(vg.toFixed(3)),
        Id: polarity * magnitude,
        Vd: polarity * 10,
        W_um: width,
        L_um: length,
        synthetic: true,
        true_vth: polarity * vthMag
      });
    }
  };
  for (let i = 0; i < countPerType; i += 1) create('NMOS', i);
  for (let i = 0; i < countPerType; i += 1) create('PMOS', i);
  return rows;
}

function splitCSVLine(line) {
  const values = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) { current += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { values.push(current.trim()); current = ''; }
    else current += char;
  }
  values.push(current.trim());
  return values;
}

function keyMap(headers) {
  const normalized = headers.map(h => h.trim().toLowerCase().replace(/[\s\-]+/g, '_'));
  const output = {};
  for (const [key, aliases] of Object.entries(ALIASES)) {
    const index = normalized.findIndex(h => aliases.includes(h));
    if (index >= 0) output[key] = index;
  }
  return output;
}

function normalizeType(value, fallbackName = '') {
  const text = String(value || fallbackName).toLowerCase();
  if (/p[-_ ]?(mos|type|channel)|pmos/.test(text)) return 'PMOS';
  if (/n[-_ ]?(mos|type|channel)|nmos/.test(text)) return 'NMOS';
  return '';
}

export function parseCSV(text, fileName = '') {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) throw new Error(`${fileName || 'CSV'}: 헤더와 데이터 행이 필요합니다.`);
  const headers = splitCSVLine(lines[0]);
  const map = keyMap(headers);
  if (map.vg === undefined || map.id === undefined) throw new Error(`${fileName || 'CSV'}: Vg와 Id 열을 찾지 못했습니다.`);
  const inferredType = normalizeType('', fileName);
  const rows = [];
  const warnings = [];
  for (let lineNo = 1; lineNo < lines.length; lineNo += 1) {
    const cols = splitCSVLine(lines[lineNo]);
    const rawVg = cols[map.vg]?.trim();
    const rawId = cols[map.id]?.trim();
    if (!rawVg || !rawId) { warnings.push(lineNo + 1); continue; }
    const vg = Number(rawVg);
    const id = Number(rawId);
    if (!Number.isFinite(vg) || !Number.isFinite(id)) { warnings.push(lineNo + 1); continue; }
    const type = normalizeType(map.type === undefined ? '' : cols[map.type], inferredType);
    if (!type) throw new Error(`${fileName || 'CSV'} ${lineNo + 1}행: type을 NMOS/PMOS로 지정하거나 파일명에 nmos/pmos를 포함하세요.`);
    rows.push({
      device_id: map.device === undefined ? `${fileName || 'device'}-${lineNo}` : (cols[map.device] || `${fileName}-${lineNo}`),
      type,
      Vg: vg,
      Id: id,
      Vd: map.vd === undefined || !cols[map.vd]?.trim() ? null : Number(cols[map.vd]),
      W_um: map.w === undefined || !cols[map.w]?.trim() ? null : Number(cols[map.w]),
      L_um: map.l === undefined || !cols[map.l]?.trim() ? null : Number(cols[map.l]),
      synthetic: false
    });
  }
  if (!rows.length) throw new Error(`${fileName || 'CSV'}: 유효한 측정점이 없습니다.`);
  return { rows, warnings };
}

export function groupCurves(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.type}::${row.device_id}`;
    if (!groups.has(key)) groups.set(key, { id: String(row.device_id), type: row.type, rows: [] });
    groups.get(key).rows.push(row);
  }
  for (const [key, curve] of groups.entries()) {
    curve.key = key;
    curve.rows.sort((a, b) => a.Vg - b.Vg);
  }
  return [...groups.values()];
}

function linearFit(xs, ys) {
  const n = xs.length;
  if (n < 3) return null;
  const sx = xs.reduce((a, b) => a + b, 0);
  const sy = ys.reduce((a, b) => a + b, 0);
  const sxx = xs.reduce((a, x) => a + x * x, 0);
  const sxy = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const den = n * sxx - sx * sx;
  if (Math.abs(den) < 1e-15) return null;
  const m = (n * sxy - sx * sy) / den;
  const b = (sy - m * sx) / n;
  const mean = sy / n;
  const ssTot = ys.reduce((a, y) => a + (y - mean) ** 2, 0);
  const ssRes = ys.reduce((a, y, i) => a + (y - (m * xs[i] + b)) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 1;
  return { m, b, r2 };
}

function orientedPoints(curve) {
  const sign = curve.type === 'PMOS' ? -1 : 1;
  return curve.rows.map(row => ({
    x: sign * row.Vg,
    current: Math.max(Math.abs(row.Id), 1e-30),
    row
  })).sort((a, b) => a.x - b.x);
}

export function extractVth(curve, options = {}) {
  const method = options.method || 'constant';
  const sign = curve.type === 'PMOS' ? -1 : 1;
  const points = orientedPoints(curve);
  if (points.length < 5) return { ok: false, reason: '측정점 부족', vth: null, r2: null };

  if (method === 'constant') {
    const first = curve.rows[0];
    let target = Number(options.currentTarget || 1e-8);
    if (options.normalizeGeometry) {
      if (!(Number(first.W_um) > 0) || !(Number(first.L_um) > 0)) {
        return { ok: false, reason: 'W/L 누락', vth: null, r2: null };
      }
      target *= first.W_um / first.L_um;
    }
    if (!(target > 0)) return { ok: false, reason: '기준전류 오류', vth: null, r2: null };
    const logTarget = Math.log10(target);
    for (let i = 1; i < points.length; i += 1) {
      const y0 = Math.log10(points[i - 1].current);
      const y1 = Math.log10(points[i].current);
      if ((y0 <= logTarget && y1 >= logTarget) || (y0 >= logTarget && y1 <= logTarget)) {
        const ratio = Math.abs(y1 - y0) < 1e-12 ? 0 : (logTarget - y0) / (y1 - y0);
        const x = points[i - 1].x + ratio * (points[i].x - points[i - 1].x);
        return { ok: true, vth: sign * x, r2: null, target, fitRange: [points[i - 1].row.Vg, points[i].row.Vg] };
      }
    }
    return { ok: false, reason: '기준전류 교차 없음', vth: null, r2: null, target };
  }

  if (method === 'sqrt') {
    const values = points.map(p => Math.sqrt(p.current));
    const max = Math.max(...values);
    const selected = points.map((p, i) => ({ x: p.x, y: values[i] })).filter(p => p.y >= max * 0.25 && p.y <= max * 0.80);
    if (selected.length < 5) return { ok: false, reason: '√Id 피팅점 부족', vth: null, r2: null };
    const fit = linearFit(selected.map(p => p.x), selected.map(p => p.y));
    const intercept = fit ? -fit.b / fit.m : NaN;
    const insideSweep = Number.isFinite(intercept) && intercept >= points[0].x && intercept <= points.at(-1).x;
    if (!fit || fit.m <= 0 || fit.r2 < 0.98 || !insideSweep) {
      return { ok: false, reason: fit && fit.r2 < 0.98 ? 'R² < 0.98' : '√Id 외삽 범위 오류', vth: null, r2: fit?.r2 ?? null };
    }
    return { ok: true, vth: sign * intercept, r2: fit.r2, fitRange: [sign * selected[0].x, sign * selected.at(-1).x] };
  }

  const currents = points.map(p => p.current);
  const slopes = currents.map((_, i) => {
    if (i === 0 || i === currents.length - 1) return -Infinity;
    return (currents[i + 1] - currents[i - 1]) / (points[i + 1].x - points[i - 1].x);
  });
  const peak = slopes.indexOf(Math.max(...slopes));
  const start = Math.max(0, peak - 3);
  const end = Math.min(points.length, peak + 4);
  const selected = points.slice(start, end);
  const fit = linearFit(selected.map(p => p.x), selected.map(p => p.current));
  if (!fit || fit.m <= 0) return { ok: false, reason: 'gm 선형구간 실패', vth: null, r2: fit?.r2 ?? null };
  return { ok: true, vth: sign * (-fit.b / fit.m), r2: fit.r2, fitRange: [sign * selected[0].x, sign * selected.at(-1).x] };
}

export function summarize(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return { n: 0, mean: null, sigma: null, p5: null, median: null, p95: null };
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const sigma = Math.sqrt(sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, sorted.length - 1));
  const quantile = q => {
    const pos = (sorted.length - 1) * q;
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  };
  return { n: sorted.length, mean, sigma, p5: quantile(.05), median: quantile(.5), p95: quantile(.95) };
}

export function rowsToCSV(rows) {
  const headers = ['device_id', 'type', 'Vg', 'Id', 'Vd', 'W_um', 'L_um'];
  const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [headers.join(','), ...rows.map(row => headers.map(key => escape(row[key])).join(','))].join('\n');
}
