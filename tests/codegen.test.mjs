import test from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_TEMPLATES } from '../packages/core/dist/catalog.js';
import { generateSystemVerilog } from '../packages/core/dist/codegen.js';

test('CodeGen: generates clean SystemVerilog for starter templates', () => {
  for (const tmpl of STARTER_TEMPLATES) {
    const design = tmpl.createDesign();
    const sv = generateSystemVerilog(design);

    assert.ok(sv.includes('module top ('), 'Must declare top module');
    assert.ok(sv.includes('endmodule'), 'Must terminate with endmodule');
    assert.ok(sv.includes('`timescale 1ns / 1ps'), 'Must include timescale header');
    assert.ok(sv.includes('`default_nettype none'), 'Must enforce strict default_nettype none');

    for (const inst of design.instances) {
      assert.ok(sv.includes(inst.name), `Must instantiate ${inst.name}`);
    }

    for (const net of design.nets) {
      assert.ok(sv.includes(net.name), `Must declare wire for net ${net.name}`);
    }
  }
});

test('CodeGen: produces byte-for-byte deterministic output', () => {
  const tmpl = STARTER_TEMPLATES[0];
  const design = tmpl.createDesign();

  const sv1 = generateSystemVerilog(design);
  const sv2 = generateSystemVerilog(design);

  assert.equal(sv1, sv2, 'CodeGen output must be 100% deterministic across multiple runs');
});
