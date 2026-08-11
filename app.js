import { generateExamples, parseCSV, groupCurves, extractVth, extractIoff, summarize, rowsToCSV } from './core.mjs';

const state = {
  rows: generateExamples(),
  curves: [],
  results: [],
  source: 'SYNTHETIC · SEED 20260811',
  type: 'both',
  method: 'constant',
  metric: 'vth',
  scale: 'log',
  selected: null,
  search: ''
};

const $ = id => document.getElementById(id);
const palette = { NMOS: '#087f8c', PMOS: '#b63d72' };
const methodLabel = { constant: 'Constant current', sqrt: '√|Id| extrapolation' };
let toastTimer;

function toast(message, error = false) {
  const el = $('toast');
  el.textContent = message;
  el.className = `toast show${error ? ' error' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3200);
}

function options() {
  return {
    method: state.method,
    currentTarget: Number($('currentTarget').value),
    normalizeGeometry: $('normalizeGeometry').checked
  };
}

function limitsFor(type) {
  const prefix = type === 'NMOS' ? 'nmos' : 'pmos';
  return [Number($(`${prefix}Min`).value), Number($(`${prefix}Max`).value)];
}

function visibleCurves() {
  return state.curves.filter(c => state.type === 'both' || c.type.toLowerCase() === state.type);
}

function recalculate() {
  state.curves = groupCurves(state.rows);
  const opts = options();
  state.results = state.curves.map(curve => {
    const result = extractVth(curve, opts);
    const ioff = extractIoff(curve, Number($('offGateVoltage').value));
    const [min, max] = limitsFor(curve.type);
    return { curve, ...result, ioff, spec: result.ok ? result.vth >= min && result.vth <= max : null };
  });
  if (!state.selected && state.curves.length) state.selected = state.curves[0].key;
  renderAll();
}

function renderAll() {
  renderReadout();
  renderMetrics();
  renderTransfer();
  renderDistribution();
  renderTable();
}

function renderReadout() {
  $('sourceLabel').textContent = state.source;
  $('deviceCount').textContent = `${state.curves.length.toLocaleString()} devices`;
  $('pointCount').textContent = `${state.rows.length.toLocaleString()} measurement points`;
}

function renderMetrics() {
  const results = state.results.filter(r => (state.type === 'both' || r.curve.type.toLowerCase() === state.type));
  const good = results.filter(r => r.ok);
  const summary = summarize(good.map(r => r.vth));
  const nSummary = summarize(good.filter(r => r.curve.type === 'NMOS').map(r => r.vth));
  const pSummary = summarize(good.filter(r => r.curve.type === 'PMOS').map(r => r.vth));
  const passed = good.filter(r => r.spec).length;
  const nIoff = summarize(results.filter(r => r.curve.type === 'NMOS' && r.ioff.ok).map(r => r.ioff.current));
  const pIoff = summarize(results.filter(r => r.curve.type === 'PMOS' && r.ioff.ok).map(r => r.ioff.current));
  if (state.type === 'both' && nSummary.n && pSummary.n) {
    $('meanVth').textContent = `N ${nSummary.mean.toFixed(2)} · P ${pSummary.mean.toFixed(2)} V`;
    $('sigmaVth').textContent = `N ${nSummary.sigma.toFixed(2)} · P ${pSummary.sigma.toFixed(2)} V`;
  } else {
    $('meanVth').textContent = summary.n ? `${summary.mean.toFixed(3)} V` : '—';
    $('sigmaVth').textContent = summary.n ? `${summary.sigma.toFixed(3)} V` : '—';
  }
  $('yieldValue').textContent = good.length ? `${(passed / good.length * 100).toFixed(1)}%` : '—';
  $('fitRate').textContent = results.length ? `${good.length}/${results.length}` : '—';
  $('ioffMetricLabel').textContent = `Ioff @ Vg=${Number($('offGateVoltage').value).toFixed(2)} V`;
  if (state.type === 'both' && nIoff.n && pIoff.n) $('ioffValue').textContent = `N ${formatCurrent(nIoff.median)} · P ${formatCurrent(pIoff.median)}`;
  else $('ioffValue').textContent = formatCurrent((state.type === 'nmos' ? nIoff : pIoff).median);
}

function formatCurrent(value) {
  return Number.isFinite(value) ? `${value.toExponential(2)} A` : '—';
}

function plotConfig(fileName) {
  return { responsive: true, displaylogo: false, scrollZoom: true, modeBarButtonsToRemove: ['lasso2d', 'select2d'], toImageButtonOptions: { format: 'png', filename: fileName, scale: 2 } };
}

function plotLayout(titleY) {
  return {
    margin: { l: 66, r: 20, t: 24, b: 58 },
    paper_bgcolor: '#ffffff', plot_bgcolor: '#ffffff',
    font: { family: 'Segoe UI, sans-serif', size: 11, color: '#43576a' },
    xaxis: { title: 'Gate voltage Vg (V)', gridcolor: '#e6edf1', zerolinecolor: '#a8b9c6', automargin: true },
    yaxis: { title: titleY, gridcolor: '#e6edf1', zerolinecolor: '#a8b9c6', automargin: true },
    hoverlabel: { bgcolor: '#0b1f35', font: { color: 'white' } },
    showlegend: false
  };
}

function renderTransfer() {
  if (!window.Plotly) { $('transferChart').textContent = '차트 라이브러리를 불러오지 못했습니다. 네트워크 연결 후 새로고침하세요.'; return; }
  const traces = visibleCurves().map(curve => {
    const selected = curve.key === state.selected;
    return {
      x: curve.rows.map(r => r.Vg),
      y: curve.rows.map(r => Math.max(Math.abs(r.Id), 1e-14)),
      type: 'scattergl', mode: 'lines', name: curve.id,
      customdata: curve.rows.map(() => [curve.id, curve.type]),
      hovertemplate: '%{customdata[0]} · %{customdata[1]}<br>Vg %{x:.3f} V<br>|Id| %{y:.3e} A<extra></extra>',
      line: { color: palette[curve.type], width: selected ? 3.6 : 1 },
      opacity: selected ? 1 : .16
    };
  });
  const layout = plotLayout('|Drain current| (A)');
  layout.yaxis.type = state.scale === 'log' ? 'log' : 'linear';
  if (state.scale === 'log') {
    const currents = visibleCurves().flatMap(curve => curve.rows.map(row => Math.max(Math.abs(row.Id), 1e-30)));
    const minLog = Math.floor(Math.log10(Math.min(...currents))) - .25;
    const maxLog = Math.ceil(Math.log10(Math.max(...currents))) + .15;
    layout.yaxis.range = [minLog, maxLog];
    const firstExponent = Math.ceil(minLog);
    const lastExponent = Math.floor(maxLog);
    const step = lastExponent - firstExponent > 7 ? 2 : 1;
    const exponents = [];
    for (let exponent = firstExponent; exponent <= lastExponent; exponent += step) exponents.push(exponent);
    layout.yaxis.tickmode = 'array';
    layout.yaxis.tickvals = exponents.map(exponent => 10 ** exponent);
    layout.yaxis.ticktext = exponents.map(exponent => `10<sup>${exponent}</sup>`);
  }
  const selectedResult = state.results.find(r => r.curve.key === state.selected);
  if (selectedResult) {
    layout.shapes = [];
    layout.annotations = [];
    if (selectedResult.ok) {
      layout.shapes.push({
        type: 'line', x0: selectedResult.vth, x1: selectedResult.vth, y0: 0, y1: 1, yref: 'paper',
        line: { color: palette[selectedResult.curve.type], width: 2, dash: 'dash' }
      });
      layout.annotations.push({
        x: selectedResult.vth, y: 1, yref: 'paper', yanchor: 'bottom', showarrow: false,
        text: `${selectedResult.curve.id} · Vth ${selectedResult.vth.toFixed(3)} V`,
        font: { color: palette[selectedResult.curve.type], size: 11 }, bgcolor: '#ffffff', borderpad: 4
      });
    }
    if (selectedResult.ok && state.method === 'constant' && selectedResult.target > 0) {
      layout.shapes.push({
        type: 'line', x0: 0, x1: 1, xref: 'paper', y0: selectedResult.target, y1: selectedResult.target,
        line: { color: '#7a8a98', width: 1, dash: 'dot' }
      });
    } else if (selectedResult.ok && selectedResult.fitRange) {
      const [a, b] = selectedResult.fitRange;
      layout.shapes.push({ type: 'rect', x0: Math.min(a, b), x1: Math.max(a, b), y0: 0, y1: 1, yref: 'paper', fillcolor: 'rgba(8,127,140,.07)', line: { width: 0 }, layer: 'below' });
    }
    if (selectedResult.ioff?.ok) {
      traces.push({
        x: [selectedResult.ioff.vg], y: [selectedResult.ioff.current], type: 'scatter', mode: 'markers',
        marker: { color: '#d77a16', size: 11, symbol: 'diamond', line: { color: '#ffffff', width: 1.5 } },
        hovertemplate: `${selectedResult.curve.id}<br>Ioff @ Vg=${selectedResult.ioff.vg.toFixed(2)} V<br>%{y:.3e} A<extra></extra>`,
        showlegend: false
      });
      layout.annotations.push({
        x: selectedResult.ioff.vg, y: selectedResult.ioff.current, xanchor: 'left', yanchor: 'top', showarrow: true, ax: 28, ay: 26,
        text: `Ioff ${formatCurrent(selectedResult.ioff.current)}`, font: { color: '#9a550b', size: 10 }, arrowcolor: '#d77a16', bgcolor: '#ffffff', borderpad: 3
      });
    }
  }
  Plotly.react('transferChart', traces, layout, plotConfig('tft_transfer_curves'));
}

function renderDistribution() {
  if (!window.Plotly) return;
  const showingIoff = state.metric === 'ioff';
  const visible = state.results.filter(r => (showingIoff ? r.ioff.ok : r.ok) && (state.type === 'both' || r.curve.type.toLowerCase() === state.type));
  const traces = ['NMOS', 'PMOS'].map(type => ({
    x: visible.filter(r => r.curve.type === type && (!showingIoff || r.ioff.ok)).map(r => showingIoff ? Math.log10(r.ioff.current) : r.vth),
    type: 'histogram', name: type, opacity: .68,
    marker: { color: palette[type], line: { color: '#ffffff', width: .5 } },
    hovertemplate: showingIoff ? `${type}<br>log10(Ioff/A) %{x:.3f}<br>count %{y}<extra></extra>` : `${type}<br>Vth %{x:.3f} V<br>count %{y}<extra></extra>`,
    nbinsx: 18
  })).filter(trace => trace.x.length);
  const layout = plotLayout('Device count');
  layout.xaxis.title = showingIoff ? 'log10(Ioff / A)' : 'Extracted Vth (V)';
  layout.barmode = 'overlay';
  layout.showlegend = state.type === 'both';
  layout.legend = { orientation: 'h', x: 0, y: 1.08 };
  $('distributionTitle').textContent = showingIoff ? 'Ioff distribution' : 'Vth distribution';
  $('distributionSubtitle').textContent = showingIoff ? `Vg=${Number($('offGateVoltage').value).toFixed(2)} V · log-current 분포` : '방법·기준전류 변경 시 즉시 재계산';
  Plotly.react('distributionChart', traces, layout, plotConfig('tft_vth_distribution'));
}

function renderTable() {
  const query = state.search.trim().toLowerCase();
  const rows = state.results
    .filter(r => (state.type === 'both' || r.curve.type.toLowerCase() === state.type))
    .filter(r => !query || r.curve.id.toLowerCase().includes(query));
  $('resultsBody').innerHTML = rows.map(r => {
    const specClass = r.spec === null ? 'na' : r.spec ? 'pass' : 'fail';
    const specText = r.spec === null ? 'NO FIT' : r.spec ? 'PASS' : 'OUT';
    return `<tr data-key="${escapeHTML(r.curve.key)}" tabindex="0" aria-selected="${r.curve.key === state.selected}" class="${r.curve.key === state.selected ? 'selected' : ''}">
      <td><strong>${escapeHTML(r.curve.id)}</strong></td>
      <td><span class="type-chip ${r.curve.type.toLowerCase()}">${r.curve.type}</span></td>
      <td>${r.ok ? `${r.vth.toFixed(4)} V` : escapeHTML(r.reason)}</td>
      <td>${r.ioff.ok ? formatCurrent(r.ioff.current) : escapeHTML(r.ioff.reason)}</td>
      <td>${methodLabel[state.method]}</td>
      <td>${Number.isFinite(r.r2) ? r.r2.toFixed(4) : '—'}</td>
      <td>${r.curve.rows.length}</td>
      <td><span class="spec-chip ${specClass}">${specText}</span></td>
    </tr>`;
  }).join('');
  $('resultsBody').querySelectorAll('tr').forEach(row => {
    const select = () => { state.selected = row.dataset.key; renderTransfer(); renderTable(); };
    row.addEventListener('click', select);
    row.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); } });
  });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

async function importFiles(files) {
  try {
    const allRows = [];
    let skipped = 0;
    for (const file of files) {
      const parsed = parseCSV(await file.text(), file.name);
      allRows.push(...parsed.rows);
      skipped += parsed.warnings.length;
    }
    state.rows = allRows;
    state.source = `LOCAL CSV · ${files.length} FILE${files.length > 1 ? 'S' : ''}`;
    state.selected = null;
    recalculate();
    toast(`${state.curves.length}개 소자 · ${state.rows.length.toLocaleString()}점 분석 완료${skipped ? ` · ${skipped}행 제외` : ''}`);
  } catch (error) {
    toast(error.message || 'CSV를 읽지 못했습니다.', true);
  }
}

function download(name, content, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['\uFEFF', content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  URL.revokeObjectURL(url);
}

function exportResults() {
  const headers = ['device_id', 'type', 'vth_v', 'ioff_a', 'ioff_vg_v', 'method', 'fit_r2', 'fit_status', 'spec_status', 'point_count', 'source'];
  const lines = [headers.join(','), ...state.results.map(r => [
    r.curve.id, r.curve.type, r.ok ? r.vth.toFixed(8) : '', r.ioff.ok ? r.ioff.current.toExponential(8) : '', r.ioff.vg ?? '', methodLabel[state.method], Number.isFinite(r.r2) ? r.r2.toFixed(8) : '',
    r.ok ? 'OK' : r.reason, r.spec === null ? 'NO_FIT' : r.spec ? 'PASS' : 'OUT', r.curve.rows.length, state.source
  ].map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))];
  download(`tft_vth_results_${new Date().toISOString().slice(0, 10)}.csv`, lines.join('\n'));
  toast('Vth 결과 CSV를 저장했습니다.');
}

function bind() {
  $('importBtn').addEventListener('click', () => $('fileInput').click());
  $('dropZone').addEventListener('click', () => $('fileInput').click());
  $('dropZone').addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') $('fileInput').click(); });
  $('fileInput').addEventListener('change', event => importFiles([...event.target.files]));
  for (const name of ['dragenter', 'dragover']) $('dropZone').addEventListener(name, event => { event.preventDefault(); $('dropZone').classList.add('dragging'); });
  for (const name of ['dragleave', 'drop']) $('dropZone').addEventListener(name, event => { event.preventDefault(); $('dropZone').classList.remove('dragging'); });
  $('dropZone').addEventListener('drop', event => importFiles([...event.dataTransfer.files].filter(f => f.name.toLowerCase().endsWith('.csv'))));
  $('typeControl').addEventListener('click', event => {
    const button = event.target.closest('button[data-value]'); if (!button) return;
    state.type = button.dataset.value;
    state.selected = visibleCurves()[0]?.key || null;
    [...$('typeControl').children].forEach(el => { el.classList.toggle('active', el === button); el.setAttribute('aria-pressed', String(el === button)); });
    renderAll();
  });
  $('scaleControl').addEventListener('click', event => {
    const button = event.target.closest('button[data-value]'); if (!button) return;
    state.scale = button.dataset.value;
    [...$('scaleControl').children].forEach(el => { el.classList.toggle('active', el === button); el.setAttribute('aria-pressed', String(el === button)); });
    renderTransfer();
  });
  $('metricControl').addEventListener('click', event => {
    const button = event.target.closest('button[data-value]'); if (!button) return;
    state.metric = button.dataset.value;
    [...$('metricControl').children].forEach(el => { el.classList.toggle('active', el === button); el.setAttribute('aria-pressed', String(el === button)); });
    renderDistribution();
  });
  document.querySelectorAll('input[name="method"]').forEach(input => input.addEventListener('change', () => {
    state.method = input.value;
    document.querySelectorAll('.method-option').forEach(label => label.classList.toggle('active', label.contains(input)));
    $('currentField').hidden = state.method !== 'constant';
    $('normalizeGeometry').closest('label').hidden = state.method !== 'constant';
    recalculate();
  }));
  ['currentTarget', 'offGateVoltage', 'normalizeGeometry', 'nmosMin', 'nmosMax', 'pmosMin', 'pmosMax'].forEach(id => $(id).addEventListener('change', recalculate));
  $('searchInput').addEventListener('input', event => { state.search = event.target.value; renderTable(); });
  $('resetBtn').addEventListener('click', () => {
    state.rows = generateExamples(); state.source = 'SYNTHETIC · SEED 20260811'; state.selected = null; recalculate(); toast('NMOS 100개 · PMOS 100개 합성 예제로 초기화했습니다.');
  });
  $('downloadExampleBtn').addEventListener('click', () => { download('tft_nmos_pmos_100x2_example.csv', rowsToCSV(generateExamples())); toast('합성 예제 CSV를 저장했습니다.'); });
  $('exportBtn').addEventListener('click', exportResults);
  window.addEventListener('resize', () => { if (window.Plotly) { Plotly.Plots.resize('transferChart'); Plotly.Plots.resize('distributionChart'); } });
}

function boot() {
  bind();
  const waitForPlotly = attempts => {
    if (window.Plotly || attempts <= 0) recalculate();
    else setTimeout(() => waitForPlotly(attempts - 1), 80);
  };
  waitForPlotly(80);
}

boot();
