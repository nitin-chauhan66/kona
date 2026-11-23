import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { STARTER_TEMPLATES } from '../packages/core/dist/catalog.js';
import { generateSystemVerilog } from '../packages/core/dist/codegen.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.resolve(__dirname, '../.kona-test-artifacts');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

test('Real Verilator Lint: exported top.sv passes verilator --lint-only', () => {
  const tmpl = STARTER_TEMPLATES[0]; // RISC-V MCU
  const design = tmpl.createDesign();
  const svCode = generateSystemVerilog(design);

  const topPath = path.join(tempDir, 'top.sv');
  const ipPath = path.resolve(__dirname, '../rtl/ip_library.sv');

  fs.writeFileSync(topPath, svCode, 'utf8');

  // Run real Verilator lint
  try {
    const cmd = `verilator --lint-only -Wall --top-module top -Wno-DECLFILENAME -Wno-PINMISSING -Wno-PINCONNECTEMPTY -Wno-UNUSED -Wno-UNDRIVEN "${topPath}" "${ipPath}"`;
    const out = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    assert.ok(true, 'Verilator lint passed with 0 errors');
  } catch (err) {
    assert.fail(`Verilator lint failed:\n${err.stderr || err.stdout || err.message}`);
  }
});

test('Real Yosys Synthesis: exported top.sv synthesizes to gates with Yosys', () => {
  const tmpl = STARTER_TEMPLATES[1]; // UART Loopback
  const design = tmpl.createDesign();
  const svCode = generateSystemVerilog(design);

  const topPath = path.join(tempDir, 'uart_top.sv');
  const ipPath = path.resolve(__dirname, '../rtl/ip_library.sv');

  fs.writeFileSync(topPath, svCode, 'utf8');

  // Run real Yosys synthesis check
  try {
    const cmd = `yosys -p "read_verilog -sv ${topPath} ${ipPath}; hierarchy -check -top top; proc; opt;"`;
    const out = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    assert.ok(out.includes('Top module:  \\top'), 'Yosys must find and analyze top module');
    assert.ok(out.includes('End of script'), 'Yosys synthesis pass must complete successfully');
  } catch (err) {
    assert.fail(`Yosys synthesis check failed:\n${err.stderr || err.stdout || err.message}`);
  }
});
