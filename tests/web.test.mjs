import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('Web Assets: bundle.js and index.html are generated and complete', () => {
  const bundlePath = path.resolve(__dirname, '../apps/web/public/bundle.js');
  const htmlPath = path.resolve(__dirname, '../apps/web/public/index.html');
  const cssPath = path.resolve(__dirname, '../apps/web/public/styles.css');

  assert.ok(fs.existsSync(bundlePath), 'bundle.js must exist');
  assert.ok(fs.existsSync(htmlPath), 'index.html must exist');
  assert.ok(fs.existsSync(cssPath), 'styles.css must exist');

  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('id="schematic-canvas"'), 'index.html must have schematic-canvas');
  assert.ok(html.includes('id="waveform-container"'), 'index.html must have waveform-container');
  assert.ok(html.includes('id="sv-code-output"'), 'index.html must have sv-code-output');
  assert.ok(html.includes('id="drc-status-chip"'), 'index.html must have drc-status-chip');
  assert.ok(html.includes('id="catalog-items-list"'), 'index.html must have catalog-items-list');
  assert.ok(html.includes('id="resizer-left-sidebar"'), 'index.html must have left sidebar resizer');
  assert.ok(html.includes('id="resizer-right-sidebar"'), 'index.html must have right sidebar resizer');
  assert.ok(html.includes('id="resizer-bottom-drawer"'), 'index.html must have bottom drawer resizer');
  assert.ok(html.includes('id="resizer-drc-panel"'), 'index.html must have DRC panel resizer');

  const css = fs.readFileSync(cssPath, 'utf8');
  assert.ok(css.includes('--sidebar-left-width'), 'styles.css must support resizable left sidebar');
  assert.ok(css.includes('--sidebar-right-width'), 'styles.css must support resizable right sidebar');
  assert.ok(css.includes('--bottom-drawer-height'), 'styles.css must support resizable bottom drawer');

  const bundle = fs.readFileSync(bundlePath, 'utf8');
  assert.ok(bundle.includes('SchematicCanvas'), 'bundle.js must contain SchematicCanvas');
  assert.ok(bundle.includes('WaveformViewer'), 'bundle.js must contain WaveformViewer');
  assert.ok(bundle.includes('runDesignRuleCheck'), 'bundle.js must contain DRC engine');
});
