import test from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_TEMPLATES, STARTER_IP_CATALOG } from '../packages/core/dist/catalog.js';
import { runDesignRuleCheck } from '../packages/core/dist/drc.js';

test('DRC: valid starter templates pass DRC with zero errors', () => {
  for (const tmpl of STARTER_TEMPLATES) {
    const design = tmpl.createDesign();
    const diags = runDesignRuleCheck(design);
    const errors = diags.filter(d => d.severity === 'error');
    assert.deepEqual(errors, [], `Template ${tmpl.id} should have zero DRC errors`);
  }
});

test('DRC: detects bit-width mismatches', () => {
  const tmpl = STARTER_TEMPLATES[0];
  const design = tmpl.createDesign();

  // Create a net with 16-bit width connecting to a 32-bit port
  design.nets.push({
    id: 'net_mismatch',
    name: 'bad_bus',
    width: 16,
    source: { instanceId: 'cpu_0', portId: 'mem_addr' }, // mem_addr is 32-bit!
    targets: [{ instanceId: 'xbar_0', portId: 'm_addr' }]
  });

  const diags = runDesignRuleCheck(design);
  const widthErrors = diags.filter(d => d.rule === 'WIDTH_MISMATCH');
  assert.ok(widthErrors.length > 0, 'Should flag bit-width mismatch');
});

test('DRC: detects multi-driver conflicts', () => {
  const tmpl = STARTER_TEMPLATES[0];
  const design = tmpl.createDesign();

  // Two different nets driven by the same output port
  design.nets.push({
    id: 'net_conflict',
    name: 'conflict_net',
    width: 32,
    source: { instanceId: 'cpu_0', portId: 'mem_addr' },
    targets: []
  });

  const diags = runDesignRuleCheck(design);
  const multiDriver = diags.filter(d => d.rule === 'MULTI_DRIVER');
  assert.ok(multiDriver.length > 0, 'Should detect multi-driver conflict');
});

test('DRC: detects unconnected clock pins', () => {
  const tmpl = STARTER_TEMPLATES[0];
  const design = tmpl.createDesign();

  // Disconnect clock net from cpu_0
  const clkNet = design.nets.find(n => n.name === 'clk');
  assert.ok(clkNet);
  clkNet.targets = clkNet.targets.filter(t => t.instanceId !== 'cpu_0');

  const diags = runDesignRuleCheck(design);
  const unconnClk = diags.filter(d => d.rule === 'UNCONNECTED_CLOCK' && d.instanceId === 'cpu_0');
  assert.equal(unconnClk.length, 1, 'Should warn about unconnected clock pin on cpu_0');
});
