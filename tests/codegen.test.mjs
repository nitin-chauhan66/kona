import test from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_TEMPLATES } from '../packages/core/dist/catalog.js';
import {
  generateSystemVerilog,
  generateSystemVerilogTestbench,
  validateRtlOutput
} from '../packages/core/dist/codegen.js';
import { runDesignRuleCheck } from '../packages/core/dist/drc.js';

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

test('CodeGen Stage 2: wires external boundary ports, inout gpio_pads, testbench, and SV identifier checks', () => {
  const mcu = STARTER_TEMPLATES.find(t => t.id === 'riscv_mcu').createDesign();
  const mcuSv = generateSystemVerilog(mcu);
  assert.ok(mcuSv.includes('output logic        trap_out'), 'MCU exposes trap_out');
  assert.ok(mcuSv.includes('input  logic        uart_rx'), 'MCU exposes uart_rx');
  assert.ok(mcuSv.includes('output logic        uart_tx'), 'MCU exposes uart_tx');
  assert.ok(!mcuSv.includes('gpio_pads'), 'MCU without GPIO must not emit dummy gpio_pads');
  assert.ok(mcuSv.includes('.tx              (uart_tx)'), 'UART tx must bind to top-level uart_tx');

  const tb = generateSystemVerilogTestbench(mcu);
  assert.ok(tb.includes('module top_tb;'), 'Testbench declares top_tb');
  assert.ok(tb.includes('top dut ('), 'Testbench instantiates top dut');
  assert.ok(tb.includes('$dumpfile("top_tb.vcd")'), 'Testbench dumps VCD');

  const loopback = STARTER_TEMPLATES.find(t => t.id === 'uart_loopback').createDesign();
  const loopSv = generateSystemVerilog(loopback);
  assert.ok(loopSv.includes('inout  wire  [ 7:0] gpio_pads'), 'Loopback exposes inout gpio_pads');
  assert.ok(loopSv.includes('.gpio_pins       (gpio_pads)'), 'GPIO controller binds gpio_pins to gpio_pads');

  for (const tmpl of STARTER_TEMPLATES) {
    const d = tmpl.createDesign();
    const report = validateRtlOutput(d);
    assert.equal(report.isClean, true, `${tmpl.id} RTL report must be clean`);
  }

  // Reserved SV keyword triggers INVALID_SV_IDENTIFIER DRC error and safe sanitization in RTL
  mcu.instances[0].name = 'module';
  const diags = runDesignRuleCheck(mcu);
  assert.ok(diags.some(d => d.rule === 'INVALID_SV_IDENTIFIER' && d.severity === 'error'));
  const sanitizedSv = generateSystemVerilog(mcu);
  assert.ok(sanitizedSv.includes('module_sig ('), 'Reserved keyword instance name is sanitized in RTL');
});
