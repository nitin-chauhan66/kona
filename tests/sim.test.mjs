import test from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_TEMPLATES } from '../packages/core/dist/catalog.js';
import { runSimulation } from '../packages/core/dist/sim.js';
import { parseVcd, formatSignalValue } from '../packages/core/dist/vcd.js';

test('Simulation: runs cycles and generates valid VCD', () => {
  const tmpl = STARTER_TEMPLATES[0];
  const design = tmpl.createDesign();

  const simResult = runSimulation(design, 32);
  assert.equal(simResult.totalCycles, 32);
  assert.ok(simResult.vcdText.includes('$dumpvars'));
  assert.ok(simResult.vcdText.includes('$timescale'));
  assert.ok(simResult.trace.signals.length > 0);
  assert.ok(simResult.trace.maxTime > 0);
});

test('VCD: parser extracts signals, value transitions, and timescale', () => {
  const tmpl = STARTER_TEMPLATES[1]; // UART loopback
  const design = tmpl.createDesign();

  const simResult = runSimulation(design, 20);
  const trace = parseVcd(simResult.vcdText);

  assert.equal(trace.timescale, '1ns');
  const clkSig = trace.signals.find(s => s.name === 'clk');
  assert.ok(clkSig, 'Must find clk signal in trace');

  const clkChanges = trace.signalChanges.get('clk');
  assert.ok(clkChanges && clkChanges.length > 5, 'Clock should toggle across cycles');
});

test('VCD: radix formatting converts vector values accurately', () => {
  assert.equal(formatSignalValue('1010', 4, 'hex'), '0xA');
  assert.equal(formatSignalValue('11111111', 8, 'hex'), '0xFF');
  assert.equal(formatSignalValue('00001010', 8, 'dec'), '10');
  assert.equal(formatSignalValue('101', 4, 'bin'), '0b0101');
});
