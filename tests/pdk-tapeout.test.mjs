import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import {
  STARTER_TEMPLATES,
  analyzeArchitecture,
  buildAsicTapeoutTar,
  createDefaultSiliconConfig,
  generateArchitectureSpecMarkdown,
  generateAsicBundle,
  listPdks,
  parseKonaDesign,
  runDesignRuleCheck,
  serializeKonaDesign
} from '../packages/core/dist/index.js';

function verifyTarChecksum(buf, headerOffset = 0) {
  let recorded = '';
  for (let i = 148; i < 154; i++) {
    recorded += String.fromCharCode(buf[headerOffset + i]);
  }
  const expectedSum = parseInt(recorded.trim(), 8);
  let actualSum = 0;
  for (let i = 0; i < 512; i++) {
    actualSum += i >= 148 && i < 156 ? 0x20 : buf[headerOffset + i];
  }
  return { expectedSum, actualSum };
}

test('PDK Registry: exposes SKY130, GF180MCU, and IHP SG13G2 profiles', () => {
  const pdks = listPdks();
  const ids = pdks.map(p => p.id);
  assert.deepEqual(ids.sort(), ['gf180mcuD', 'sg13g2', 'sky130A']);

  for (const pdk of pdks) {
    assert.ok(pdk.nodeNm === 130 || pdk.nodeNm === 180);
    assert.ok(pdk.stdCellLibrary.length > 0);
    assert.ok(pdk.ioPadLibrary.length > 0);
    assert.ok(pdk.maxClockMhz > 0);
  }
});

test('Silicon IR & DRC: validates silicon config and catches out-of-spec PDK constraints', () => {
  const design = STARTER_TEMPLATES[0].createDesign();
  design.silicon = createDefaultSiliconConfig('gf180mcuD');

  const clean = runDesignRuleCheck(design);
  assert.equal(clean.filter(d => d.severity === 'error').length, 0, 'Default GF180MCU silicon config passes DRC');

  const json = serializeKonaDesign(design);
  const { design: roundtrip, errors } = parseKonaDesign(json);
  assert.equal(errors.length, 0);
  assert.equal(roundtrip.silicon.pdkId, 'gf180mcuD');

  // Exceed GF180MCU 60 MHz limit
  design.silicon.clockFreqMhz = 140;
  const overClock = runDesignRuleCheck(design);
  assert.ok(overClock.some(d => d.rule === 'PDK_CLOCK_LIMIT' && d.severity === 'error'));

  // Switch SRAM mode to dff_array with ADDR_WIDTH=14 -> triggers warning
  design.silicon.clockFreqMhz = 25;
  design.silicon.sramMode = 'dff_array';
  const sramWarn = runDesignRuleCheck(design);
  assert.ok(sramWarn.some(d => d.rule === 'SRAM_MACRO_REQUIRED' && d.severity === 'warning'));
});

test('ASIC Bundle: generates complete LibreLane kit across all templates and PDKs', () => {
  for (const tmpl of STARTER_TEMPLATES) {
    for (const pdkId of ['sky130A', 'gf180mcuD', 'sg13g2']) {
      const design = tmpl.createDesign();
      design.silicon = createDefaultSiliconConfig(pdkId);
      const bundle = generateAsicBundle(design);

      assert.equal(bundle.pdk.id, pdkId);
      assert.equal(bundle.files.length, 14);

      const byRel = new Map(
        bundle.files.map(f => [f.path.split('/').slice(1).join('/'), f])
      );

      assert.ok(byRel.has('src/top.v'));
      assert.ok(byRel.has('src/chip_top.v'));
      assert.ok(byRel.has('src/asic_ip_library.v'));
      assert.ok(byRel.has('constraints/top.sdc'));
      assert.ok(byRel.has('config.json'));
      assert.ok(byRel.has('pin_order.cfg'));
      assert.ok(byRel.has('tb/chip_top_tb.v'));
      assert.ok(byRel.has('scripts/run_tapeout.sh'));
      assert.ok(byRel.has('scripts/verify_signoff.py'));
      assert.ok(byRel.has('docs/ARCHITECTURE_SPEC.md'));
      assert.ok(byRel.has('docs/FACTORY_DATASHEET.md'));
      assert.ok(byRel.has('MEMORY_MAP.json'));

      const cfg = JSON.parse(byRel.get('config.json').content);
      assert.equal(cfg.PDK, pdkId);
      assert.equal(cfg.RUN_MAGIC_DRC, true);
      assert.equal(cfg.RUN_KLAYOUT_DRC, true);
      assert.equal(cfg.RUN_LVS, true);

      const asicLib = byRel.get('src/asic_ip_library.v').content;
      assert.ok(!/\binitial\b/.test(asicLib), 'ASIC IP library must not contain unsynthesizable initial blocks');
    }
  }
});

test('USTAR Tar & CLI Exporter: produces valid POSIX tar archive and extracted workspace', () => {
  const design = STARTER_TEMPLATES[0].createDesign();
  design.silicon = createDefaultSiliconConfig('sky130A');
  const { filename, archive } = buildAsicTapeoutTar(design);

  assert.equal(filename, 'top_sky130A_tapeout_kit.tar');
  assert.equal(archive.byteLength % 512, 0, 'Tar archive must be 512-byte aligned');

  const magic = String.fromCharCode(...archive.slice(257, 262));
  assert.equal(magic, 'ustar', 'Archive header must carry POSIX ustar magic');

  const { expectedSum, actualSum } = verifyTarChecksum(archive, 0);
  assert.equal(actualSum, expectedSum, 'Tar header checksum must match');

  // Verify CLI exporter writes complete directory + tar
  const tmpOut = fs.mkdtempSync(path.join(os.tmpdir(), 'kona-tapeout-'));
  try {
    execSync(`node scripts/export-tapeout.mjs --template sensor_hub --pdk gf180mcuD --clock 25 --out "${tmpOut}"`, {
      stdio: 'pipe'
    });
    assert.ok(fs.existsSync(path.join(tmpOut, 'top_gf180mcuD_tapeout_kit.tar')));
    assert.ok(fs.existsSync(path.join(tmpOut, 'config.json')));
    assert.ok(fs.existsSync(path.join(tmpOut, 'constraints/top.sdc')));
    assert.ok(fs.existsSync(path.join(tmpOut, 'src/chip_top.v')));
    assert.ok(fs.existsSync(path.join(tmpOut, 'scripts/run_tapeout.sh')));
    assert.ok(fs.existsSync(path.join(tmpOut, 'docs/FACTORY_DATASHEET.md')));
  } finally {
    fs.rmSync(tmpOut, { recursive: true, force: true });
  }
});

test('Stage 1 Architecture: analyzes memory map, clock domains, PPA budgets, pin edges, and overlaps', () => {
  const design = STARTER_TEMPLATES[0].createDesign();
  design.spec = {
    targetApplication: 'Industrial Edge RISC-V MCU',
    author: 'Kona Silicon Lab',
    powerBudgetMw: 100,
    maxAreaMm2: 10
  };
  design.silicon = {
    ...createDefaultSiliconConfig('sky130A'),
    pinEdges: { clk_in: 'N', uart_tx: 'S' }
  };

  const report = analyzeArchitecture(design);
  assert.equal(report.memoryMap.length, 2, 'RISC-V MCU has S0 and S1 memory map regions');
  assert.equal(report.memoryMapOverlaps, 0);
  assert.ok(report.clockDomains.length >= 1);
  assert.ok(report.ppa.estimatedGates > 10000);
  assert.ok(report.ppa.sramKbytes >= 64);
  assert.equal(report.ppa.withinPowerBudget, true);
  assert.equal(report.pinBudget.fitsPackage, true);

  const bundle = generateAsicBundle(design);
  const pinCfg = bundle.files.find(f => f.path.endsWith('/pin_order.cfg')).content;
  assert.ok(pinCfg.includes('#N\nclk_in'), 'Custom N edge for clk_in must appear in pin_order.cfg');

  const specMd = generateArchitectureSpecMarkdown(design, report);
  assert.ok(specMd.includes('Industrial Edge RISC-V MCU'));
  assert.ok(specMd.includes('0x00000000'));
  assert.ok(specMd.includes('0x10000000'));

  // Tight budget triggers warnings
  design.spec.powerBudgetMw = 0.1;
  design.spec.maxAreaMm2 = 0.01;
  const budgetDiags = runDesignRuleCheck(design);
  assert.ok(budgetDiags.some(d => d.rule === 'POWER_BUDGET_EXCEEDED'));
  assert.ok(budgetDiags.some(d => d.rule === 'AREA_BUDGET_EXCEEDED'));

  // Overlapping crossbar slave regions trigger ADDRESS_MAP_OVERLAP error
  const xbar = design.instances.find(i => i.moduleId === 'axi_crossbar');
  xbar.parameters.S1_BASE_ADDR = 1024;
  const overlapDiags = runDesignRuleCheck(design);
  assert.ok(overlapDiags.some(d => d.rule === 'ADDRESS_MAP_OVERLAP' && d.severity === 'error'));
});
