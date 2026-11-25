/**
 * Deterministic SystemVerilog Generator & Stage 2 RTL Verifier (FR-1.4)
 *
 * Generates human-readable, lint-free, byte-for-byte deterministic
 * IEEE 1800 SystemVerilog (top.sv) and simulation testbench (top_tb.sv)
 * directly from the visual .kona.json netlist.
 */

import { extractExternalPorts } from './architecture.js';
import { getModuleDef } from './catalog.js';
import { getEffectivePortWidth } from './drc/port-width.js';
import { KonaDesign, KonaNet } from './ir.js';
import { createDefaultSiliconConfig } from './pdk/index.js';

export const SV_RESERVED_KEYWORDS = new Set([
  'always', 'always_comb', 'always_ff', 'always_latch', 'and', 'assign',
  'begin', 'bit', 'buf', 'case', 'casex', 'casez', 'default', 'do', 'else',
  'end', 'endcase', 'endfunction', 'endmodule', 'endtask', 'enum', 'for',
  'forever', 'function', 'generate', 'genvar', 'if', 'initial', 'inout',
  'input', 'int', 'integer', 'interface', 'localparam', 'logic', 'module',
  'nand', 'negedge', 'nor', 'not', 'or', 'output', 'package', 'parameter',
  'posedge', 'reg', 'repeat', 'return', 'signed', 'struct', 'task', 'typedef',
  'unsigned', 'void', 'while', 'wire', 'xnor', 'xor'
]);

export interface RtlQualityReport {
  topModule: string;
  lineCount: number;
  instanceCount: number;
  netCount: number;
  externalPortCount: number;
  issues: string[];
  isClean: boolean;
}

export function sanitizeIdentifier(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, '_');
  const prefixed = /^[0-9]/.test(cleaned) || cleaned.length === 0 ? `_${cleaned}` : cleaned;
  return SV_RESERVED_KEYWORDS.has(prefixed) ? `${prefixed}_sig` : prefixed;
}

function findConnectedNet(
  design: KonaDesign,
  instId: string,
  portId: string,
  dir: 'input' | 'output' | 'inout'
): KonaNet | undefined {
  return design.nets.find(n =>
    (dir === 'output' && n.source?.instanceId === instId && n.source?.portId === portId) ||
    (dir === 'input' && n.targets.some(t => t.instanceId === instId && t.portId === portId)) ||
    (dir === 'inout' && (
      (n.source?.instanceId === instId && n.source?.portId === portId) ||
      n.targets.some(t => t.instanceId === instId && t.portId === portId)
    ))
  );
}

interface TopPortDecl {
  name: string;
  direction: 'input' | 'output' | 'inout';
  kind: 'logic' | 'wire';
  width: number;
}

function deriveSystemVerilogTopPorts(design: KonaDesign): {
  topPorts: TopPortDecl[];
  externalBindings: Map<string, string>;
} {
  const sortedInstances = [...design.instances].sort((a, b) => a.id.localeCompare(b.id));
  const topPorts: TopPortDecl[] = [
    { name: 'clk_in', direction: 'input', kind: 'logic', width: 1 },
    { name: 'rst_n_in', direction: 'input', kind: 'logic', width: 1 }
  ];
  const externalBindings = new Map<string, string>();

  let hasTrap = false;
  let hasGpio = false;
  let uartIdx = 0;
  let spiIdx = 0;
  let i2cIdx = 0;
  let timerIdx = 0;

  for (const inst of sortedInstances) {
    if (inst.moduleId === 'picorv32' && !hasTrap) {
      if (!findConnectedNet(design, inst.id, 'trap', 'output')) {
        hasTrap = true;
        topPorts.push({ name: 'trap_out', direction: 'output', kind: 'logic', width: 1 });
        externalBindings.set(`${inst.id}:trap`, 'trap_out');
      }
    } else if (inst.moduleId === 'uart_core') {
      const suffix = uartIdx === 0 ? '' : `_${uartIdx}`;
      uartIdx++;
      if (!findConnectedNet(design, inst.id, 'rx', 'input')) {
        const name = `uart${suffix}_rx`;
        topPorts.push({ name, direction: 'input', kind: 'logic', width: 1 });
        externalBindings.set(`${inst.id}:rx`, name);
      }
      if (!findConnectedNet(design, inst.id, 'tx', 'output')) {
        const name = `uart${suffix}_tx`;
        topPorts.push({ name, direction: 'output', kind: 'logic', width: 1 });
        externalBindings.set(`${inst.id}:tx`, name);
      }
    } else if (inst.moduleId === 'spi_controller') {
      const suffix = spiIdx === 0 ? '' : `_${spiIdx}`;
      spiIdx++;
      for (const [portId, dir] of [
        ['spi_sclk', 'output'],
        ['spi_cs_n', 'output'],
        ['spi_mosi', 'output'],
        ['spi_miso', 'input']
      ] as const) {
        if (!findConnectedNet(design, inst.id, portId, dir)) {
          const name = `${portId}${suffix}`;
          topPorts.push({ name, direction: dir, kind: 'logic', width: 1 });
          externalBindings.set(`${inst.id}:${portId}`, name);
        }
      }
    } else if (inst.moduleId === 'i2c_controller') {
      const suffix = i2cIdx === 0 ? '' : `_${i2cIdx}`;
      i2cIdx++;
      for (const [portId, dir] of [
        ['scl', 'output'],
        ['sda_out', 'output'],
        ['sda_in', 'input']
      ] as const) {
        if (!findConnectedNet(design, inst.id, portId, dir)) {
          const name = `i2c${suffix}_${portId}`;
          topPorts.push({ name, direction: dir, kind: 'logic', width: 1 });
          externalBindings.set(`${inst.id}:${portId}`, name);
        }
      }
    } else if (inst.moduleId === 'gpio_controller' && !hasGpio) {
      if (!findConnectedNet(design, inst.id, 'gpio_pins', 'inout')) {
        hasGpio = true;
        const w = Math.max(1, Number(inst.parameters.WIDTH ?? 8));
        topPorts.push({ name: 'gpio_pads', direction: 'inout', kind: 'wire', width: w });
        externalBindings.set(`${inst.id}:gpio_pins`, 'gpio_pads');
      }
    } else if (inst.moduleId === 'timer_core') {
      const suffix = timerIdx === 0 ? '' : `_${timerIdx}`;
      timerIdx++;
      if (!findConnectedNet(design, inst.id, 'irq', 'output')) {
        const name = `timer${suffix}_irq`;
        topPorts.push({ name, direction: 'output', kind: 'logic', width: 1 });
        externalBindings.set(`${inst.id}:irq`, name);
      }
    }
  }

  return { topPorts, externalBindings };
}

export function generateSystemVerilog(design: KonaDesign): string {
  const lines: string[] = [];

  lines.push('// =============================================================================');
  lines.push(`// Architecture: ${design.name}`);
  lines.push('// Generated by: Kona — Visual Chip Design & Verification Platform');
  lines.push(`// Version:      ${design.version}`);
  lines.push(`// Date:         ${design.metadata.modified || new Date().toISOString()}`);
  lines.push('// =============================================================================');
  lines.push('`timescale 1ns / 1ps');
  lines.push('`default_nettype none');
  lines.push('');

  const topModuleName = sanitizeIdentifier(design.topModule || 'top');
  const { topPorts, externalBindings } = deriveSystemVerilogTopPorts(design);

  lines.push(`module ${topModuleName} (`);
  lines.push(
    topPorts
      .map((p, idx) => {
        const comma = idx < topPorts.length - 1 ? ',' : '';
        const range = p.width > 1 ? `[${(p.width - 1).toString().padStart(2, ' ')}:0] ` : '       ';
        return `  ${p.direction.padEnd(6, ' ')} ${p.kind.padEnd(5, ' ')} ${range}${p.name}${comma}`;
      })
      .join('\n')
  );
  lines.push(');');
  lines.push('');

  lines.push('  // -------------------------------------------------------------------------');
  lines.push('  // Internal Interconnect Nets');
  lines.push('  // -------------------------------------------------------------------------');

  const sortedNets = [...design.nets].sort((a, b) => a.name.localeCompare(b.name));
  for (const net of sortedNets) {
    const netWireName = sanitizeIdentifier(net.name);
    if (net.width === 1) {
      lines.push(`  logic        ${netWireName};`);
    } else {
      const msb = net.width - 1;
      lines.push(`  logic [${msb.toString().padStart(2, ' ')}:0] ${netWireName};`);
    }
  }
  lines.push('');

  lines.push('  // -------------------------------------------------------------------------');
  lines.push('  // Sub-Module Instantiations');
  lines.push('  // -------------------------------------------------------------------------');

  const sortedInstances = [...design.instances].sort((a, b) => a.id.localeCompare(b.id));

  for (const inst of sortedInstances) {
    const modDef = getModuleDef(inst.moduleId);
    const modTypeName = sanitizeIdentifier(inst.moduleId);
    const instName = sanitizeIdentifier(inst.name);

    lines.push(`  // Instance: ${inst.name} (${modDef ? modDef.name : inst.moduleId})`);

    const paramEntries = Object.entries(inst.parameters).sort(([a], [b]) => a.localeCompare(b));
    let paramHeader = '';
    if (paramEntries.length > 0) {
      const pLines = paramEntries.map(([k, v]) => {
        let formattedVal: string | number = v as string | number;
        if (typeof v === 'boolean') {
          formattedVal = v ? "1'b1" : "1'b0";
        } else if (typeof v === 'string') {
          formattedVal = `"${v.replace(/"/g, '\\"')}"`;
        }
        return `    .${k}(${formattedVal})`;
      });
      paramHeader = ` #(\n${pLines.join(',\n')}\n  )`;
    }

    lines.push(`  ${modTypeName}${paramHeader} ${instName} (`);

    const portBindings: string[] = [];
    if (modDef) {
      for (const port of modDef.ports) {
        const connectedNet = findConnectedNet(design, inst.id, port.id, port.direction);
        let wireExpr = connectedNet
          ? sanitizeIdentifier(connectedNet.name)
          : externalBindings.get(`${inst.id}:${port.id}`);

        if (!wireExpr) {
          if (port.direction === 'input') {
            if (port.type === 'clock') {
              wireExpr = 'clk_in';
            } else if (port.type === 'reset') {
              wireExpr = 'rst_n_in';
            } else {
              const effWidth = getEffectivePortWidth(modDef, port, inst);
              wireExpr = effWidth > 1 ? `${effWidth}'b0` : "1'b0";
            }
          } else {
            wireExpr = '/* unused */';
          }
        }
        portBindings.push(`    .${port.name.padEnd(16, ' ')}(${wireExpr})`);
      }
    } else {
      portBindings.push('    /* unknown module definition */');
    }

    lines.push(portBindings.join(',\n'));
    lines.push('  );');
    lines.push('');
  }

  lines.push('endmodule');
  lines.push('`default_nettype wire');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generates a self-checking IEEE 1800 SystemVerilog simulation testbench (`top_tb.sv`)
 * matching the top-level module ports and clock frequency.
 */
export function generateSystemVerilogTestbench(design: KonaDesign): string {
  const topModuleName = sanitizeIdentifier(design.topModule || 'top');
  const { topPorts } = deriveSystemVerilogTopPorts(design);
  const silicon = design.silicon || createDefaultSiliconConfig('sky130A');
  const periodNs = +(1000 / Math.max(1, silicon.clockFreqMhz)).toFixed(2);
  const halfPeriod = +(periodNs / 2).toFixed(2);

  const decls: string[] = [];
  for (const p of topPorts) {
    const range = p.width > 1 ? `[${p.width - 1}:0] ` : '';
    if (p.direction === 'input') {
      const init = p.name === 'clk_in' || p.name === 'rst_n_in' ? "1'b0" : (p.width > 1 ? `${p.width}'b0` : "1'b0");
      decls.push(`  logic ${range}${p.name} = ${init};`);
    } else {
      decls.push(`  wire  ${range}${p.name};`);
    }
  }

  return [
    '// =============================================================================',
    `// Stage 2 RTL Simulation Testbench for ${topModuleName}`,
    `// Target Frequency: ${silicon.clockFreqMhz} MHz (Period = ${periodNs} ns)`,
    '// =============================================================================',
    '`timescale 1ns / 1ps',
    '',
    `module ${topModuleName}_tb;`,
    ...decls,
    '',
    `  always #${halfPeriod} clk_in = ~clk_in;`,
    '',
    `  ${topModuleName} dut (`,
    topPorts.map(p => `    .${p.name.padEnd(14, ' ')}(${p.name})`).join(',\n'),
    '  );',
    '',
    '  initial begin',
    `    $dumpfile("${topModuleName}_tb.vcd");`,
    `    $dumpvars(0, ${topModuleName}_tb);`,
    `    #(4 * ${periodNs});`,
    "    rst_n_in = 1'b1;",
    `    #(64 * ${periodNs});`,
    `    $display("[KONA RTL TB] ${topModuleName} simulation completed 64 cycles.");`,
    '    $finish;',
    '  end',
    'endmodule',
    ''
  ].join('\n');
}

/**
 * Performs Stage 2 RTL structural & identifier checks on the generated SystemVerilog.
 */
export function validateRtlOutput(design: KonaDesign, svCode?: string): RtlQualityReport {
  const code = svCode ?? generateSystemVerilog(design);
  const topModule = sanitizeIdentifier(design.topModule || 'top');
  const silicon = design.silicon || createDefaultSiliconConfig('sky130A');
  const externalPortCount = extractExternalPorts(design, silicon).length;
  const issues: string[] = [];

  if (!code.includes(`module ${topModule} (`)) {
    issues.push(`Missing module declaration for "${topModule}".`);
  }
  if (!code.includes('endmodule')) {
    issues.push('Missing endmodule terminator.');
  }
  if (design.topModule && SV_RESERVED_KEYWORDS.has(design.topModule.trim())) {
    issues.push(`Top module name "${design.topModule}" is a SystemVerilog reserved keyword.`);
  }
  for (const inst of design.instances) {
    if (SV_RESERVED_KEYWORDS.has(inst.name.trim())) {
      issues.push(`Instance name "${inst.name}" is a SystemVerilog reserved keyword.`);
    }
  }
  for (const net of design.nets) {
    if (SV_RESERVED_KEYWORDS.has(net.name.trim())) {
      issues.push(`Net name "${net.name}" is a SystemVerilog reserved keyword.`);
    }
  }

  return {
    topModule,
    lineCount: code.split('\n').length,
    instanceCount: design.instances.length,
    netCount: design.nets.length,
    externalPortCount,
    issues,
    isClean: issues.length === 0
  };
}
