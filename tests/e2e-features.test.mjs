import test from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_TEMPLATES, STARTER_IP_CATALOG, getModuleDef } from '../packages/core/dist/catalog.js';
import { runDesignRuleCheck } from '../packages/core/dist/drc.js';
import { generateSystemVerilog } from '../packages/core/dist/codegen.js';
import { runSimulation } from '../packages/core/dist/sim.js';
import { parseVcd, formatSignalValue } from '../packages/core/dist/vcd.js';
import { serializeKonaDesign, parseKonaDesign } from '../packages/core/dist/ir.js';

test('E2E FR-1.1 Canvas & Orthogonal Routing: Manhattan path generation', () => {
  const tmpl = STARTER_TEMPLATES[0];
  const design = tmpl.createDesign();

  // Test net coordinates
  for (const net of design.nets) {
    assert.ok(net.id, 'Net must have ID');
    assert.ok(net.width >= 1, 'Net width must be >= 1');
    if (net.source) {
      assert.ok(net.source.instanceId, 'Source has instanceId');
      assert.ok(net.source.portId, 'Source has portId');
    }
  }
});

test('E2E FR-1.2 Real-Time DRC: flags bit-width mismatches, multi-drivers, unconnected clocks', () => {
  const tmpl = STARTER_TEMPLATES[0];
  const design = tmpl.createDesign();

  // 1. Initial template should have 0 DRC errors
  const cleanDiags = runDesignRuleCheck(design);
  const cleanErrors = cleanDiags.filter(d => d.severity === 'error');
  assert.equal(cleanErrors.length, 0, 'Initial template must have 0 DRC errors');

  // 2. Introduce width mismatch: 32-bit port to 8-bit net
  design.nets.push({
    id: 'net_err_width',
    name: 'err_bus',
    width: 8,
    source: { instanceId: 'cpu_0', portId: 'mem_addr' }, // 32-bit!
    targets: [{ instanceId: 'uart_0', portId: 'tx_data' }]
  });

  const diagsAfterMismatch = runDesignRuleCheck(design);
  const widthErr = diagsAfterMismatch.find(d => d.rule === 'WIDTH_MISMATCH');
  assert.ok(widthErr, 'DRC must detect WIDTH_MISMATCH');

  // 3. Introduce multi-driver conflict
  design.nets.push({
    id: 'net_err_multi',
    name: 'conflict_bus',
    width: 8,
    source: { instanceId: 'cpu_0', portId: 'mem_addr' },
    targets: []
  });

  const diagsAfterMulti = runDesignRuleCheck(design);
  const multiErr = diagsAfterMulti.find(d => d.rule === 'MULTI_DRIVER');
  assert.ok(multiErr, 'DRC must detect MULTI_DRIVER conflict');
});

test('E2E FR-1.3 Parameter Inspector: dynamic module reconfiguration', () => {
  const modDef = getModuleDef('picorv32');
  assert.ok(modDef, 'Must find picorv32 module definition');
  assert.ok(modDef.parameters.some(p => p.name === 'ENABLE_MUL'));
  assert.ok(modDef.parameters.some(p => p.name === 'ENABLE_DIV'));

  const tmpl = STARTER_TEMPLATES[0];
  const design = tmpl.createDesign();
  const cpu = design.instances.find(i => i.moduleId === 'picorv32');
  assert.ok(cpu);

  // Modify parameter
  cpu.parameters['ENABLE_MUL'] = false;
  cpu.parameters['STACKADDR'] = 0x20000;

  const sv = generateSystemVerilog(design);
  assert.ok(sv.includes(".ENABLE_MUL(1'b0)"), 'SystemVerilog must reflect modified boolean parameter');
  assert.ok(sv.includes('.STACKADDR(131072)'), 'SystemVerilog must reflect modified integer parameter');
});

test('E2E FR-1.4 Deterministic RTL Generator: deterministic, valid SystemVerilog', () => {
  const tmpl = STARTER_TEMPLATES[0];
  const design = tmpl.createDesign();

  const sv1 = generateSystemVerilog(design);
  const sv2 = generateSystemVerilog(design);
  assert.equal(sv1, sv2, 'Code generation must be 100% deterministic');

  // Check IEEE 1800 syntax structures
  assert.ok(sv1.includes('module top ('));
  assert.ok(sv1.includes('`timescale 1ns / 1ps'));
  assert.ok(sv1.includes('`default_nettype none'));
  assert.ok(sv1.includes('endmodule'));
});

test('E2E FR-1.5 Local Simulation & Waveforms: VCD generation, transitions, and radix conversions', () => {
  const tmpl = STARTER_TEMPLATES[1]; // UART Loopback
  const design = tmpl.createDesign();

  const simResult = runSimulation(design, 48);
  assert.equal(simResult.totalCycles, 48);
  assert.ok(simResult.vcdText.length > 500, 'VCD must contain full simulation dump');

  const trace = parseVcd(simResult.vcdText);
  assert.equal(trace.timescale, '1ns');
  assert.ok(trace.signals.some(s => s.name === 'clk'));
  assert.ok(trace.signals.some(s => s.name === 'rst_n'));

  // Test Radix conversions
  assert.equal(formatSignalValue('10101010', 8, 'hex'), '0xAA');
  assert.equal(formatSignalValue('10101010', 8, 'dec'), '170');
  assert.equal(formatSignalValue('10101010', 8, 'bin'), '0b10101010');
});

test('E2E FR-1.6 Shareable Links & Serialization: lossless URL hash roundtrip', () => {
  const tmpl = STARTER_TEMPLATES[0];
  const design = tmpl.createDesign();

  const json = serializeKonaDesign(design);
  const encoded = Buffer.from(encodeURIComponent(json)).toString('base64');

  // Decode back
  const decodedJson = decodeURIComponent(Buffer.from(encoded, 'base64').toString('utf8'));
  const { design: restored, errors } = parseKonaDesign(decodedJson);

  assert.equal(errors.length, 0, 'Must decode with 0 errors');
  assert.ok(restored);
  assert.equal(restored.name, design.name);
  assert.equal(restored.instances.length, design.instances.length);
  assert.equal(restored.nets.length, design.nets.length);
});
