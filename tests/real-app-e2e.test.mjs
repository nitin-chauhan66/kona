import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

test('Real App: HTTP server responds with proper headers and assets', async () => {
  const indexRes = await fetchUrl('http://127.0.0.1:4173/');
  assert.equal(indexRes.statusCode, 200, 'index.html should return 200');
  assert.ok(indexRes.headers['content-type'].includes('text/html'));
  assert.equal(indexRes.headers['cross-origin-opener-policy'], 'same-origin');
  assert.equal(indexRes.headers['cross-origin-embedder-policy'], 'require-corp');
  assert.ok(indexRes.body.includes('id="schematic-canvas"'));
  assert.ok(indexRes.body.includes('id="waveform-container"'));

  const jsRes = await fetchUrl('http://127.0.0.1:4173/bundle.js');
  assert.equal(jsRes.statusCode, 200, 'bundle.js should return 200');
  assert.ok(jsRes.headers['content-type'].includes('application/javascript'));
  assert.ok(jsRes.body.length > 50000, 'bundle.js should be populated');

  const cssRes = await fetchUrl('http://127.0.0.1:4173/styles.css');
  assert.equal(cssRes.statusCode, 200, 'styles.css should return 200');
  assert.ok(cssRes.body.includes('.canvas-viewport'));
});

test('Real App: DOM Initialization and Lifecycle in Browser Environment', async () => {
  const htmlPath = path.resolve(__dirname, '../apps/web/public/index.html');
  const bundlePath = path.resolve(__dirname, '../apps/web/public/bundle.js');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const bundleJs = fs.readFileSync(bundlePath, 'utf8');

  // Create virtual browser window without external resource fetching
  const dom = new JSDOM(html, {
    url: 'http://localhost:4173/',
    runScripts: 'dangerously'
  });

  const { window } = dom;

  // Mock canvas 2D context for headless DOM testing
  const dummyCtx = {
    save: () => {},
    restore: () => {},
    clearRect: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    arc: () => {},
    roundRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    measureText: () => ({ width: 60 }),
    setLineDash: () => {},
    scale: () => {},
    translate: () => {},
    canvas: { width: 1200, height: 800 }
  };
  window.HTMLCanvasElement.prototype.getContext = () => dummyCtx;
  window.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({
    left: 0, top: 0, width: 1200, height: 800, right: 1200, bottom: 800
  });

  // Mock confirm and clipboard
  window.confirm = () => true;
  window.navigator.clipboard = {
    writeText: async (text) => text
  };

  // Evaluate bundled application
  window.eval(bundleJs);
  window.dispatchEvent(new window.Event('DOMContentLoaded'));

  // 1. Verify Header and DRC status chip
  const drcChip = window.document.getElementById('drc-status-chip');
  assert.ok(drcChip, 'DRC status chip must exist');
  assert.equal(drcChip.textContent, 'DRC Passed', 'Initial design must pass DRC');
  assert.ok(drcChip.classList.contains('success'), 'Status chip should have success class');

  // 2. Verify IP Catalog is populated
  const catalogCards = window.document.querySelectorAll('.catalog-card');
  assert.ok(catalogCards.length >= 7, 'Catalog must list starter IP modules');

  // 3. Verify SystemVerilog live preview code output
  const svOutput = window.document.getElementById('sv-code-output');
  assert.ok(svOutput, 'sv-code-output must exist');
  assert.ok(svOutput.textContent.includes('module top ('), 'SV code must define module top');
  assert.ok(svOutput.textContent.includes('picorv32'), 'SV code must instantiate picorv32');
  assert.ok(svOutput.textContent.includes('uart_core'), 'SV code must instantiate uart_core');

  // 4. Test clicking an IP catalog card to add a new block (e.g. clock_divider)
  const clkDivCard = Array.from(catalogCards).find(c => c.getAttribute('data-module-id') === 'clock_divider');
  assert.ok(clkDivCard, 'Clock divider card should be in catalog');
  clkDivCard.click();

  // Code output should now include clock_divider instance
  assert.ok(svOutput.textContent.includes('clock_divider'), 'SV preview should include newly added clock_divider');

  // 5. Test switching tabs to Waveform viewer
  const waveTab = window.document.querySelector('.drawer-tab[data-target="waveform"]');
  assert.ok(waveTab, 'Waveform drawer tab must exist');
  waveTab.click();

  const wavePane = window.document.getElementById('pane-waveform');
  assert.ok(wavePane.classList.contains('active'), 'Waveform pane must be active after click');

  // 6. Test Simulation execution button
  const runSimBtn = window.document.getElementById('btn-run-sim');
  const simStatus = window.document.getElementById('sim-status-msg');
  assert.ok(runSimBtn, 'Run simulation button must exist');
  runSimBtn.click();
  await new Promise(r => setTimeout(r, 120));

  // Status message should indicate simulation completed
  assert.ok(simStatus.textContent.includes('Completed'), 'Simulation status should confirm execution');
  assert.ok(simStatus.textContent.includes('cycles'), 'Simulation status should display cycle count');

  // Waveform container should now contain timeline and signal rows
  const wfContainer = window.document.getElementById('waveform-container');
  assert.ok(wfContainer.innerHTML.includes('wf-sig-name'), 'Waveform viewer should render signal names');
  assert.ok(wfContainer.innerHTML.includes('clk'), 'Waveform viewer should include clk signal');

  // 7. Test Template switching
  const templateSelect = window.document.getElementById('template-select');
  assert.ok(templateSelect, 'Template select dropdown must exist');
  templateSelect.value = 'uart_loopback';
  templateSelect.dispatchEvent(new window.Event('change'));

  // Code output should now reflect UART Loopback
  assert.ok(svOutput.textContent.includes('sync_fifo'), 'SV preview should reflect UART loopback template');
  assert.equal(drcChip.textContent, 'DRC Passed', 'UART Loopback template must pass DRC');

  // 8. Test Inspector & Canvas elements
  const inspectorContent = window.document.getElementById('inspector-content');
  assert.ok(inspectorContent, 'Inspector container must exist');
  assert.ok(inspectorContent.textContent.includes('inspect its ports') || inspectorContent.textContent.includes('Parameters'), 'Inspector should show state');

  // 9. Test Export button clicks
  let downloadedName = '';
  window.document.createElement = ((orig) => function (tag) {
    const el = orig.call(window.document, tag);
    if (tag.toLowerCase() === 'a') {
      el.click = () => { downloadedName = el.download; };
    }
    return el;
  })(window.document.createElement);

  const exportSvBtn = window.document.getElementById('btn-export-sv');
  exportSvBtn.click();
  assert.ok(downloadedName.endsWith('.sv'), 'Export top.sv should trigger download with .sv extension');

  const exportJsonBtn = window.document.getElementById('btn-export-json');
  exportJsonBtn.click();
  assert.ok(downloadedName.endsWith('.kona.json'), 'Export .kona.json should trigger download with .kona.json extension');
});
