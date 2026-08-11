const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  desktop.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  desktop.on('pageerror', error => errors.push(error.message));
  await desktop.goto('http://127.0.0.1:8087', { waitUntil: 'networkidle' });
  await desktop.waitForFunction(() => document.querySelector('#fitRate')?.textContent === '200/200');
  assert.equal(await desktop.locator('#deviceCount').textContent(), '200 devices');
  assert.match(await desktop.locator('#pointCount').textContent(), /16,200/);
  assert.equal(await desktop.locator('#resultsBody tr').count(), 200);
  assert.match(await desktop.locator('#meanVth').textContent(), /N .* · P .* V/);
  await desktop.screenshot({ path: 'screenshots/desktop.png', fullPage: true });

  await desktop.locator('#typeControl button[data-value="pmos"]').click();
  await desktop.waitForFunction(() => document.querySelector('#meanVth')?.textContent.includes('-'));
  await desktop.locator('input[name="method"][value="sqrt"]').check();
  await desktop.waitForFunction(() => document.querySelector('#fitRate')?.textContent === '100/100');
  assert.equal(await desktop.locator('#resultsBody tr').count(), 100);

  const csv = [
    'device_id,type,Vg,Id,Vd,W_um,L_um',
    'N_TEST,NMOS,-2,1e-12,10,40,10',
    'N_TEST,NMOS,0,1e-11,10,40,10',
    'N_TEST,NMOS,1,1e-10,10,40,10',
    'N_TEST,NMOS,2,1e-8,10,40,10',
    'N_TEST,NMOS,3,1e-6,10,40,10',
    'N_TEST,NMOS,4,4e-6,10,40,10',
    'P_TEST,PMOS,2,-1e-12,-10,40,10',
    'P_TEST,PMOS,0,-1e-11,-10,40,10',
    'P_TEST,PMOS,-1,-1e-10,-10,40,10',
    'P_TEST,PMOS,-2,-1e-8,-10,40,10',
    'P_TEST,PMOS,-3,-1e-6,-10,40,10',
    'P_TEST,PMOS,-4,-4e-6,-10,40,10'
  ].join('\n');
  await desktop.locator('#fileInput').setInputFiles({ name: 'two_devices.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await desktop.waitForFunction(() => document.querySelector('#deviceCount')?.textContent === '2 devices');
  assert.match(await desktop.locator('#sourceLabel').textContent(), /LOCAL CSV/);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  mobile.on('console', msg => { if (msg.type() === 'error') errors.push(`mobile: ${msg.text()}`); });
  mobile.on('pageerror', error => errors.push(`mobile: ${error.message}`));
  await mobile.goto('http://127.0.0.1:8087', { waitUntil: 'networkidle' });
  await mobile.waitForFunction(() => document.querySelector('#fitRate')?.textContent === '200/200');
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `mobile horizontal overflow: ${overflow}px`);
  await mobile.screenshot({ path: 'screenshots/mobile.png', fullPage: true });

  await browser.close();
  assert.deepEqual(errors, [], `browser errors:\n${errors.join('\n')}`);
  console.log('E2E PASS: desktop + mobile + CSV import + method switching');
})().catch(error => { console.error(error); process.exit(1); });
