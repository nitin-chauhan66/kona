#!/usr/bin/env node
/**
 * Kona CLI Tape-Out Kit Exporter
 *
 * Exports a complete open-source PDK RTL-to-GDSII kit (directory + .tar archive)
 * from either a built-in starter template or a .kona.json file.
 *
 * Examples:
 *   node scripts/export-tapeout.mjs --template riscv_mcu --pdk gf180mcuD --clock 25 --out ./tapeout-work
 *   node scripts/export-tapeout.mjs --design ./my_chip.kona.json --pdk sky130A --out ./tapeout-work
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  STARTER_TEMPLATES,
  buildAsicTapeoutTar,
  createDefaultSiliconConfig,
  parseKonaDesign
} from '../packages/core/dist/index.js';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key.startsWith('--')) {
      const name = key.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[name] = 'true';
      } else {
        args[name] = next;
        i++;
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const pdkId = args.pdk || 'sky130A';
const outDir = path.resolve(process.cwd(), args.out || './tapeout-work');

let design;
if (args.design) {
  const raw = fs.readFileSync(path.resolve(process.cwd(), args.design), 'utf8');
  const parsed = parseKonaDesign(raw);
  if (parsed.errors.length > 0 || !parsed.design) {
    console.error('Invalid .kona.json:', parsed.errors.join('; '));
    process.exit(1);
  }
  design = parsed.design;
} else {
  const tmplId = args.template || 'riscv_mcu';
  const tmpl = STARTER_TEMPLATES.find(t => t.id === tmplId);
  if (!tmpl) {
    console.error(`Unknown template "${tmplId}". Available: ${STARTER_TEMPLATES.map(t => t.id).join(', ')}`);
    process.exit(1);
  }
  design = tmpl.createDesign();
}

const baseSilicon = createDefaultSiliconConfig(pdkId);
if (args.clock) baseSilicon.clockFreqMhz = Number(args.clock);
if (args.util) baseSilicon.coreUtilization = Number(args.util);
if (args.package) baseSilicon.packageType = args.package;
if (args.slot) baseSilicon.diePreset = args.slot;
design.silicon = { ...(design.silicon || {}), ...baseSilicon };

const { filename, archive, bundle } = buildAsicTapeoutTar(design);

fs.mkdirSync(outDir, { recursive: true });
const tarPath = path.join(outDir, filename);
fs.writeFileSync(tarPath, archive);

for (const file of bundle.files) {
  // Strip outer kit folder name when unpacking into outDir for direct execution
  const rel = file.path.split('/').slice(1).join('/');
  const dest = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, file.content, 'utf8');
  if (file.executable && process.platform !== 'win32') {
    fs.chmodSync(dest, 0o755);
  }
}

console.log(`[KONA TAPEOUT] PDK: ${bundle.pdk.name}`);
console.log(`[KONA TAPEOUT] Extracted kit directory: ${outDir}`);
console.log(`[KONA TAPEOUT] Archive written: ${tarPath} (${archive.byteLength} bytes)`);
console.log(`[KONA TAPEOUT] Next step (Linux / WSL / Docker): ./scripts/run_tapeout.sh`);
