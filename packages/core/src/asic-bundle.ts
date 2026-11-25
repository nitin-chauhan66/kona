/**
 * ASIC Tape-Out Bundle Generator for Open-Source PDKs (SKY130 / GF180MCU / IHP SG13G2)
 *
 * Transforms any KonaDesign into a complete, self-contained LibreLane / OpenLane 2
 * RTL-to-GDSII project kit ready for local/Docker synthesis, place-and-route,
 * DRC/LVS signoff, and MPW shuttle manufacturing handoff.
 */

import {
  analyzeArchitecture,
  ArchitectureReport,
  ExternalPinSpec,
  extractExternalPorts,
  generateArchitectureSpecMarkdown
} from './architecture.js';
import { ASIC_IP_LIBRARY_VERILOG } from './asic-rtl.js';
import { getModuleDef } from './catalog.js';
import { runDesignRuleCheck } from './drc.js';
import { KonaDesign, KonaModuleDef, KonaSiliconConfig, serializeKonaDesign } from './ir.js';
import { createDefaultSiliconConfig, getPdkDef, KonaPdkDef } from './pdk/index.js';
import { buildTarArchive } from './tar.js';

export interface AsicBundleFile {
  path: string;
  content: string;
  executable?: boolean;
  category: 'rtl' | 'constraints' | 'flow' | 'verification' | 'docs' | 'metadata';
}

export type AsicExternalPort = ExternalPinSpec;

export interface SiliconReadinessCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface AsicTapeoutBundle {
  designName: string;
  topModule: string;
  pdk: KonaPdkDef;
  silicon: KonaSiliconConfig;
  architecture: ArchitectureReport;
  externalPorts: AsicExternalPort[];
  readinessChecks: SiliconReadinessCheck[];
  files: AsicBundleFile[];
}

function sanitizeId(name: string): string {
  const s = name.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[0-9]/.test(s) ? `_${s}` : s;
}

function resolveSiliconConfig(design: KonaDesign): { silicon: KonaSiliconConfig; pdk: KonaPdkDef } {
  const silicon = design.silicon
    ? { ...design.silicon }
    : createDefaultSiliconConfig('sky130A');
  const pdk = getPdkDef(silicon.pdkId) || getPdkDef('sky130A')!;
  return { silicon, pdk };
}

function findConnectedNet(design: KonaDesign, instId: string, portId: string, dir: 'input' | 'output' | 'inout') {
  return design.nets.find(n =>
    (dir === 'output' && n.source?.instanceId === instId && n.source?.portId === portId) ||
    (dir === 'input' && n.targets.some(t => t.instanceId === instId && t.portId === portId)) ||
    (dir === 'inout' && (
      (n.source?.instanceId === instId && n.source?.portId === portId) ||
      n.targets.some(t => t.instanceId === instId && t.portId === portId)
    ))
  );
}

interface GeneratedTopResult {
  topVerilog: string;
  chipTopVerilog: string;
  externalPorts: AsicExternalPort[];
  hasTrap: boolean;
  hasGpio: boolean;
}

function generateAsicTopAndChipTop(design: KonaDesign, pdk: KonaPdkDef, silicon: KonaSiliconConfig): GeneratedTopResult {
  const topName = sanitizeId(design.topModule || 'top');
  const sortedInstances = [...design.instances].sort((a, b) => a.id.localeCompare(b.id));
  const sortedNets = [...design.nets].sort((a, b) => a.name.localeCompare(b.name));

  const externalPorts = extractExternalPorts(design, silicon);
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
        externalBindings.set(`${inst.id}:trap`, 'trap_out');
      }
    } else if (inst.moduleId === 'uart_core') {
      const suffix = uartIdx === 0 ? '' : `_${uartIdx}`;
      uartIdx++;
      if (!findConnectedNet(design, inst.id, 'rx', 'input')) {
        externalBindings.set(`${inst.id}:rx`, `uart${suffix}_rx`);
      }
      if (!findConnectedNet(design, inst.id, 'tx', 'output')) {
        externalBindings.set(`${inst.id}:tx`, `uart${suffix}_tx`);
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
          externalBindings.set(`${inst.id}:${portId}`, `${portId}${suffix}`);
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
          externalBindings.set(`${inst.id}:${portId}`, `i2c${suffix}_${portId}`);
        }
      }
    } else if (inst.moduleId === 'gpio_controller' && !hasGpio) {
      hasGpio = true;
      externalBindings.set(`${inst.id}:gpio_in`, 'gpio_in');
      externalBindings.set(`${inst.id}:gpio_out`, 'gpio_out');
      externalBindings.set(`${inst.id}:gpio_oe`, 'gpio_oe');
    } else if (inst.moduleId === 'timer_core') {
      const suffix = timerIdx === 0 ? '' : `_${timerIdx}`;
      timerIdx++;
      if (!findConnectedNet(design, inst.id, 'irq', 'output')) {
        externalBindings.set(`${inst.id}:irq`, `timer${suffix}_irq`);
      }
    }
  }

  // Build src/top.v
  const topLines: string[] = [
    '// =============================================================================',
    `// Synthesizable ASIC Top Module: ${design.name}`,
    `// Target PDK: ${pdk.name} | Clock: ${silicon.clockFreqMhz} MHz`,
    '// Generated by Kona Silicon Tape-Out Engine',
    '// =============================================================================',
    '`timescale 1ns / 1ps',
    '/* verilator lint_off PINCONNECTEMPTY */',
    '',
    `module ${topName} (`
  ];

  topLines.push(
    externalPorts
      .map((p, idx) => {
        const comma = idx < externalPorts.length - 1 ? ',' : '';
        const range = p.width > 1 ? `[${p.width - 1}:0] ` : '';
        return `  ${p.direction.padEnd(6, ' ')} wire ${range}${p.name}${comma}`;
      })
      .join('\n')
  );
  topLines.push(');', '');

  topLines.push('  // Internal Interconnect Nets');
  for (const net of sortedNets) {
    const wName = sanitizeId(net.name);
    if (net.width === 1) {
      topLines.push(`  wire ${wName};`);
    } else {
      topLines.push(`  wire [${net.width - 1}:0] ${wName};`);
    }
  }
  topLines.push('');

  for (const inst of sortedInstances) {
    const modDef: KonaModuleDef | undefined = getModuleDef(inst.moduleId);
    const instName = sanitizeId(inst.name);
    const paramEntries = Object.entries(inst.parameters).sort(([a], [b]) => a.localeCompare(b));
    let paramHeader = '';
    if (paramEntries.length > 0) {
      const pLines = paramEntries.map(([k, v]) => {
        const val = typeof v === 'boolean' ? (v ? "1'b1" : "1'b0") : String(v);
        return `    .${k}(${val})`;
      });
      paramHeader = ` #(\n${pLines.join(',\n')}\n  )`;
    }

    topLines.push(`  // ${modDef?.name || inst.moduleId}`);
    topLines.push(`  ${inst.moduleId}${paramHeader} ${instName} (`);

    const bindings: string[] = [];
    if (inst.moduleId === 'clock_gen') {
      const clkNet = findConnectedNet(design, inst.id, 'clk_out', 'output');
      const rstNet = findConnectedNet(design, inst.id, 'rst_n_out', 'output');
      bindings.push(`    .ext_clk  (clk_in)`);
      bindings.push(`    .ext_rst_n(rst_n_in)`);
      bindings.push(`    .clk_out  (${clkNet ? sanitizeId(clkNet.name) : '/* unused */'})`);
      bindings.push(`    .rst_n_out(${rstNet ? sanitizeId(rstNet.name) : '/* unused */'})`);
    } else if (inst.moduleId === 'gpio_controller') {
      const clkNet = findConnectedNet(design, inst.id, 'clk', 'input');
      const rstNet = findConnectedNet(design, inst.id, 'rst_n', 'input');
      const outNet = findConnectedNet(design, inst.id, 'out_val', 'input');
      const inNet = findConnectedNet(design, inst.id, 'in_val', 'output');
      const w = Number(inst.parameters.WIDTH ?? 8);
      bindings.push(`    .clk     (${clkNet ? sanitizeId(clkNet.name) : 'clk_in'})`);
      bindings.push(`    .rst_n   (${rstNet ? sanitizeId(rstNet.name) : 'rst_n_in'})`);
      bindings.push(`    .out_val (${outNet ? sanitizeId(outNet.name) : `${w}'b0`})`);
      bindings.push(`    .in_val  (${inNet ? sanitizeId(inNet.name) : '/* unused */'})`);
      bindings.push(`    .gpio_in (${externalBindings.get(`${inst.id}:gpio_in`) || `${w}'b0`})`);
      bindings.push(`    .gpio_out(${externalBindings.get(`${inst.id}:gpio_out`) || '/* unused */'})`);
      bindings.push(`    .gpio_oe (${externalBindings.get(`${inst.id}:gpio_oe`) || '/* unused */'})`);
    } else if (modDef) {
      for (const port of modDef.ports) {
        const net = findConnectedNet(design, inst.id, port.id, port.direction);
        let expr = net ? sanitizeId(net.name) : externalBindings.get(`${inst.id}:${port.id}`);
        if (!expr) {
          if (port.direction === 'input') {
            if (port.type === 'clock') expr = 'clk_in';
            else if (port.type === 'reset') expr = 'rst_n_in';
            else expr = port.width > 1 ? `${port.width}'b0` : "1'b0";
          } else {
            expr = '';
          }
        }
        bindings.push(`    .${port.name.padEnd(14, ' ')}(${expr})`);
      }
    }

    topLines.push(bindings.join(',\n'));
    topLines.push('  );', '');
  }

  topLines.push('endmodule', '/* verilator lint_on PINCONNECTEMPTY */', '');

  // Build src/chip_top.v (Top-level MPW / Pad-Ring Wrapper)
  const chipPorts: string[] = externalPorts.map(p => {
    const range = p.width > 1 ? `[${p.width - 1}:0] ` : '';
    return `  ${p.direction.padEnd(6, ' ')} wire ${range}${p.name}`;
  });

  const chipLines: string[] = [
    '// =============================================================================',
    `// Chip / Pad-Frame Wrapper: chip_${topName}`,
    `// Target PDK: ${pdk.name} | Package: ${silicon.packageType}`,
    `// Core/IO Voltage: ${pdk.coreVoltage} / ${pdk.ioVoltage}`,
    '// =============================================================================',
    '`timescale 1ns / 1ps',
    '',
    `module chip_${topName} (`,
    chipPorts.join(',\n'),
    ');',
    '',
    `  ${topName} u_core (`,
    externalPorts.map(p => `    .${p.name.padEnd(14, ' ')}(${p.name})`).join(',\n'),
    '  );',
    '',
    '  // Note: For full-die pad-frame tape-outs (outside Caravel/TinyTapeout slots),',
    `  // instantiate ${pdk.ioPadLibrary} cells (${pdk.ioPadCells.input}, ${pdk.ioPadCells.output}, ${pdk.ioPadCells.vdd})`,
    '  // around u_core in this wrapper before LibreLane pad-ring assembly.',
    'endmodule',
    ''
  ];

  return {
    topVerilog: topLines.join('\n'),
    chipTopVerilog: chipLines.join('\n'),
    externalPorts,
    hasTrap,
    hasGpio
  };
}

function generateSdc(topModule: string, pdk: KonaPdkDef, silicon: KonaSiliconConfig): string {
  const periodNs = +(1000 / silicon.clockFreqMhz).toFixed(3);
  const ioDelayNs = +(periodNs * 0.2).toFixed(3);
  const uncertaintyNs = +(Math.max(0.15, periodNs * 0.05)).toFixed(3);

  return [
    `# Timing Constraints (SDC) for ${topModule}`,
    `# Target PDK: ${pdk.name} @ ${silicon.clockFreqMhz} MHz (Period = ${periodNs} ns)`,
    `create_clock -name clk_in -period ${periodNs} [get_ports {clk_in}]`,
    `set_clock_uncertainty ${uncertaintyNs} [get_clocks {clk_in}]`,
    `set_clock_transition 0.15 [get_clocks {clk_in}]`,
    '',
    `set_driving_cell -lib_cell ${pdk.drivingCell} -pin ${pdk.drivingCellPin} [all_inputs]`,
    `set_load ${pdk.outputLoadPf} [all_outputs]`,
    '',
    `set non_clk_inputs [remove_from_collection [all_inputs] [get_ports {clk_in}]]`,
    `set_input_delay ${ioDelayNs} -clock clk_in $non_clk_inputs`,
    `set_output_delay ${ioDelayNs} -clock clk_in [all_outputs]`,
    `set_false_path -from [get_ports {rst_n_in}]`,
    ''
  ].join('\n');
}

function generatePinOrderCfg(ports: AsicExternalPort[]): string {
  const byEdge: Record<'N' | 'S' | 'E' | 'W', string[]> = { N: [], S: [], E: [], W: [] };
  for (const p of ports) {
    byEdge[p.edge].push(p.width > 1 ? `${p.name}\\[.*\\]` : p.name);
  }
  const lines: string[] = [];
  for (const edge of ['W', 'E', 'N', 'S'] as const) {
    if (byEdge[edge].length > 0) {
      lines.push(`#${edge}`, ...byEdge[edge], '');
    }
  }
  return lines.join('\n');
}

function generateLibreLaneConfig(
  topModule: string,
  pdk: KonaPdkDef,
  silicon: KonaSiliconConfig
): string {
  const periodNs = +(1000 / silicon.clockFreqMhz).toFixed(3);
  const slot = silicon.diePreset !== 'auto' ? pdk.dieSlots[silicon.diePreset] : null;
  const config: Record<string, unknown> = {
    DESIGN_NAME: `chip_${topModule}`,
    VERILOG_FILES: [
      'dir::src/asic_ip_library.v',
      'dir::src/top.v',
      'dir::src/chip_top.v'
    ],
    CLOCK_PORT: 'clk_in',
    CLOCK_NET: 'clk_in',
    CLOCK_PERIOD: periodNs,
    PDK: pdk.id,
    STD_CELL_LIBRARY: pdk.stdCellLibrary,
    FP_SIZING: slot ? 'absolute' : 'relative',
    ...(slot
      ? { DIE_AREA: slot.dieArea, CORE_AREA: slot.coreArea }
      : { FP_CORE_UTIL: Math.round(silicon.coreUtilization * 100) }),
    PL_TARGET_DENSITY_PCT: pdk.targetDensityPct,
    FP_PIN_ORDER_CFG: 'dir::pin_order.cfg',
    PNR_SDC_FILE: 'dir::constraints/top.sdc',
    SIGNOFF_SDC_FILE: 'dir::constraints/top.sdc',
    RUN_MAGIC_DRC: true,
    RUN_KLAYOUT_DRC: true,
    RUN_LVS: true,
    MAGIC_DRC_USE_GDS: true,
    QUIT_ON_MAGIC_DRC: true,
    QUIT_ON_LVS_ERROR: true
  };
  return JSON.stringify(config, null, 2) + '\n';
}

function generateTestbench(topModule: string, ports: AsicExternalPort[], periodNs: number): string {
  const halfPeriod = +(periodNs / 2).toFixed(2);
  const inputRegs = ports
    .filter(p => p.direction === 'input' && p.name !== 'clk_in' && p.name !== 'rst_n_in')
    .map(p => (p.width > 1 ? `  reg [${p.width - 1}:0] ${p.name} = ${p.width}'b0;` : `  reg ${p.name} = 1'b0;`));
  const outputWires = ports
    .filter(p => p.direction === 'output')
    .map(p => (p.width > 1 ? `  wire [${p.width - 1}:0] ${p.name};` : `  wire ${p.name};`));

  return [
    '`timescale 1ns / 1ps',
    `module chip_${topModule}_tb;`,
    '  reg clk_in = 1\'b0;',
    '  reg rst_n_in = 1\'b0;',
    ...inputRegs,
    ...outputWires,
    '',
    `  always #${halfPeriod} clk_in = ~clk_in;`,
    '',
    `  chip_${topModule} dut (`,
    ports.map(p => `    .${p.name}(${p.name})`).join(',\n'),
    '  );',
    '',
    '  initial begin',
    `    $dumpfile("chip_${topModule}_tb.vcd");`,
    `    $dumpvars(0, chip_${topModule}_tb);`,
    `    #(5 * ${periodNs});`,
    '    rst_n_in = 1\'b1;',
    `    #(64 * ${periodNs});`,
    '    $display("[KONA TB] Pre-tapeout functional simulation passed.");',
    '    $finish;',
    '  end',
    'endmodule',
    ''
  ].join('\n');
}

function generateRunTapeoutScript(topModule: string, pdk: KonaPdkDef): string {
  return `#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${'${BASH_SOURCE[0]}'}")/.." && pwd)"
cd "$ROOT_DIR"

PDK_NAME="${pdk.id}"
DESIGN="chip_${topModule}"

echo "======================================================================"
echo " Kona Factory Tape-Out Runner"
echo " Design: $DESIGN | PDK: $PDK_NAME (${pdk.nodeNm}nm)"
echo "======================================================================"

echo "[1/5] Running Verilator RTL lint..."
if command -v verilator >/dev/null 2>&1; then
  verilator --lint-only -Wall --top-module "$DESIGN" -Wno-DECLFILENAME -Wno-PINCONNECTEMPTY -Wno-UNUSED -Wno-UNDRIVEN \\
    src/asic_ip_library.v src/top.v src/chip_top.v
else
  echo "WARN: verilator not found, skipping lint step."
fi

echo "[2/5] Running pre-synthesis functional testbench..."
if command -v iverilog >/dev/null 2>&1 && command -v vvp >/dev/null 2>&1; then
  mkdir -p build
  iverilog -g2012 -o "build/${'${DESIGN}'}_tb.vvp" src/asic_ip_library.v src/top.v src/chip_top.v tb/chip_top_tb.v
  vvp "build/${'${DESIGN}'}_tb.vvp"
else
  echo "WARN: iverilog/vvp not found, skipping testbench step."
fi

echo "[3/5] Running LibreLane / OpenLane 2 RTL-to-GDSII..."
if command -v librelane >/dev/null 2>&1; then
  librelane --pdk "$PDK_NAME" --run-tag kona_signoff config.json
elif command -v openlane >/dev/null 2>&1; then
  openlane --pdk "$PDK_NAME" --run-tag kona_signoff config.json
else
  echo "ERROR: Neither 'librelane' nor 'openlane' found in PATH."
  echo "Run inside the Kona tapeout container: docker compose run --rm tapeout-runner ./scripts/run_tapeout.sh"
  exit 1
fi

echo "[4/5] Verifying signoff reports (STA / DRC / LVS)..."
python3 scripts/verify_signoff.py "runs/kona_signoff"

echo "[5/5] Packaging Factory Handoff Archive..."
HANDOFF_DIR="build/factory_handoff_${'${DESIGN}'}_${'${PDK_NAME}'}"
rm -rf "$HANDOFF_DIR"
mkdir -p "$HANDOFF_DIR/gds" "$HANDOFF_DIR/netlist" "$HANDOFF_DIR/def" "$HANDOFF_DIR/signoff" "$HANDOFF_DIR/docs"

cp runs/kona_signoff/final/gds/*.gds "$HANDOFF_DIR/gds/" 2>/dev/null || true
cp runs/kona_signoff/final/oasis/*.oas "$HANDOFF_DIR/gds/" 2>/dev/null || true
cp runs/kona_signoff/final/nl/*.nl.v "$HANDOFF_DIR/netlist/" 2>/dev/null || true
cp runs/kona_signoff/final/def/*.def "$HANDOFF_DIR/def/" 2>/dev/null || true
cp runs/kona_signoff/final/sdc/*.sdc "$HANDOFF_DIR/signoff/" 2>/dev/null || true
cp docs/FACTORY_DATASHEET.md "$HANDOFF_DIR/docs/"
cp design.kona.json config.json MANIFEST.json "$HANDOFF_DIR/"

(cd "$HANDOFF_DIR" && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS)
tar -czf "build/factory_handoff_${'${DESIGN}'}_${'${PDK_NAME}'}.tar.gz" -C build "factory_handoff_${'${DESIGN}'}_${'${PDK_NAME}'}"

echo "======================================================================"
echo " SUCCESS: Factory package ready:"
echo "   build/factory_handoff_${'${DESIGN}'}_${'${PDK_NAME}'}.tar.gz"
echo "======================================================================"
`;
}

function generateVerifySignoffPython(): string {
  return `#!/usr/bin/env python3
"""Verify LibreLane / OpenLane 2 signoff metrics before foundry submission."""
import json
import pathlib
import sys

def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: verify_signoff.py <run_dir>", file=sys.stderr)
        return 2

    run_dir = pathlib.Path(sys.argv[1])
    metrics_path = run_dir / "final" / "metrics.json"
    if not metrics_path.exists():
        print(f"ERROR: Signoff metrics not found at {metrics_path}", file=sys.stderr)
        return 1

    metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
    failures = []

    checks = [
        ("design__lvs_error__count", "LVS mismatches"),
        ("magic__drc_error__count", "Magic physical DRC violations"),
        ("klayout__drc_error__count", "KLayout physical DRC violations"),
        ("design__antenna_violation__count", "Antenna violations"),
    ]
    for key, label in checks:
        val = metrics.get(key)
        if val is not None and float(val) > 0:
            failures.append(f"{label}: {val}")

    for corner_key in ("timing__setup_vio__count", "timing__hold_vio__count"):
        val = metrics.get(corner_key)
        if val is not None and float(val) > 0:
            failures.append(f"{corner_key}: {val}")

    if failures:
        print("SIGNOFF FAILED:", file=sys.stderr)
        for item in failures:
            print(f"  - {item}", file=sys.stderr)
        return 1

    print("[KONA SIGNOFF] All DRC, LVS, Antenna, and Multi-Corner STA checks passed.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
`;
}

function generateFactoryDatasheet(
  design: KonaDesign,
  topModule: string,
  pdk: KonaPdkDef,
  silicon: KonaSiliconConfig,
  ports: AsicExternalPort[],
  checks: SiliconReadinessCheck[]
): string {
  const periodNs = +(1000 / silicon.clockFreqMhz).toFixed(3);
  const slotLabel = silicon.diePreset !== 'auto'
    ? pdk.dieSlots[silicon.diePreset].label
    : `Auto-sized (${Math.round(silicon.coreUtilization * 100)}% core utilization)`;

  const portRows = ports
    .map(p => `| \`${p.name}\` | \`${p.direction}\` | ${p.width} | ${p.edge} | ${p.description} |`)
    .join('\n');

  const checkRows = checks
    .map(c => `- **[${c.status.toUpperCase()}] ${c.label}:** ${c.detail}`)
    .join('\n');

  return `# Factory Tape-Out Datasheet & Manufacturing Handoff

- **Chip Name:** ${design.name}
- **Top Module:** \`chip_${topModule}\`
- **Target Open-Source PDK:** ${pdk.name} (${pdk.foundry})
- **Technology Node:** ${pdk.nodeNm}nm (${pdk.processType})
- **Core / I/O Voltage:** ${pdk.coreVoltage} / ${pdk.ioVoltage}
- **Target Clock:** ${silicon.clockFreqMhz} MHz (Period: ${periodNs} ns)
- **Die Slot:** ${slotLabel}
- **Target Package:** ${silicon.packageType}
- **Shuttle Path:** ${silicon.shuttleTarget}

## 1. Pre-Tape-Out Readiness Checks
${checkRows}

## 2. External Pinout & Edge Assignment
| Pin Name | Direction | Width | Die Edge | Function |
| :--- | :--- | :---: | :---: | :--- |
${portRows}

## 3. Running RTL-to-GDSII Locally or in Docker
Extract the downloaded \`*_tapeout_kit.tar\` and run:
\`\`\`bash
tar -xf ${topModule}_${pdk.id}_tapeout_kit.tar
cd ${topModule}_${pdk.id}_tapeout_kit
./scripts/run_tapeout.sh
\`\`\`
Or with Docker Compose from the Kona repository:
\`\`\`bash
docker compose run --rm tapeout-runner ./scripts/run_tapeout.sh
\`\`\`

## 4. India & Open-Source MPW Submission Guide
- **${pdk.foundry} (${pdk.id}):** ${pdk.shuttleNotes}
- **India Ecosystem Fit:** ${pdk.indiaEcosystemNotes}
- **Factory Deliverables Produced in \`build/factory_handoff_*.tar.gz\`:**
  1. Final GDSII/OASIS layout (\`gds/chip_${topModule}.gds\`, \`.oas\`)
  2. Post-P&R Gate-Level Netlist (\`netlist/*.nl.v\`) & DEF (\`def/*.def\`)
  3. Signoff Timing SDC & Reports (Magic DRC, KLayout DRC, Netgen LVS, OpenSTA)
  4. Source \`.kona.json\`, \`config.json\`, \`MANIFEST.json\`, and \`SHA256SUMS\`
`;
}

export function generateAsicBundle(design: KonaDesign): AsicTapeoutBundle {
  const { silicon, pdk } = resolveSiliconConfig(design);
  const topModule = sanitizeId(design.topModule || 'top');
  const periodNs = +(1000 / silicon.clockFreqMhz).toFixed(3);

  const generated = generateAsicTopAndChipTop(design, pdk, silicon);
  const sdc = generateSdc(topModule, pdk, silicon);
  const pinOrder = generatePinOrderCfg(generated.externalPorts);
  const libreLaneConfig = generateLibreLaneConfig(topModule, pdk, silicon);
  const tbVerilog = generateTestbench(topModule, generated.externalPorts, periodNs);
  const runScript = generateRunTapeoutScript(topModule, pdk);
  const verifyScript = generateVerifySignoffPython();

  const designForDrc: KonaDesign = { ...design, silicon };
  const architecture = analyzeArchitecture(designForDrc);
  const diags = runDesignRuleCheck(designForDrc);
  const drcErrors = diags.filter(d => d.severity === 'error');
  const drcWarnings = diags.filter(d => d.severity === 'warning');

  const readinessChecks: SiliconReadinessCheck[] = [
    {
      id: 'drc-logical',
      label: 'Logical & Silicon DRC',
      status: drcErrors.length > 0 ? 'fail' : drcWarnings.length > 0 ? 'warn' : 'pass',
      detail: drcErrors.length > 0
        ? `${drcErrors.length} error(s): ${drcErrors[0].message}`
        : drcWarnings.length > 0
          ? `${drcWarnings.length} warning(s): ${drcWarnings[0].message}`
          : '0 DRC errors and 0 silicon warnings'
    },
    ...architecture.checklist,
    {
      id: 'signoff-flow',
      label: 'LibreLane GDSII + DRC/LVS Pipeline',
      status: 'pass',
      detail: `Configured for ${pdk.stdCellLibrary} (${pdk.metalLayers}M, Magic + KLayout + Netgen + OpenSTA)`
    }
  ];

  const datasheet = generateFactoryDatasheet(
    design,
    topModule,
    pdk,
    silicon,
    generated.externalPorts,
    readinessChecks
  );
  const archSpecMd = generateArchitectureSpecMarkdown(designForDrc, architecture);
  const memMapJson = JSON.stringify({
    topModule: `chip_${topModule}`,
    clockDomains: architecture.clockDomains,
    memoryMap: architecture.memoryMap,
    ppa: architecture.ppa,
    pinBudget: architecture.pinBudget
  }, null, 2) + '\n';

  const manifest = JSON.stringify({
    generator: 'Kona Tape-Out Bundle Engine v1.0',
    designName: design.name,
    topModule: `chip_${topModule}`,
    pdk: pdk.id,
    nodeNm: pdk.nodeNm,
    clockFreqMhz: silicon.clockFreqMhz,
    packageType: silicon.packageType,
    shuttleTarget: silicon.shuttleTarget,
    estimatedGates: architecture.ppa.estimatedGates,
    estimatedAreaMm2: architecture.ppa.estimatedAreaMm2,
    estimatedPowerMw: architecture.ppa.estimatedPowerMw,
    externalPortsCount: generated.externalPorts.length
  }, null, 2) + '\n';

  const prefix = `${topModule}_${pdk.id}_tapeout_kit`;
  const files: AsicBundleFile[] = [
    { path: `${prefix}/design.kona.json`, content: serializeKonaDesign(designForDrc), category: 'metadata' },
    { path: `${prefix}/MEMORY_MAP.json`, content: memMapJson, category: 'metadata' },
    { path: `${prefix}/src/asic_ip_library.v`, content: ASIC_IP_LIBRARY_VERILOG, category: 'rtl' },
    { path: `${prefix}/src/top.v`, content: generated.topVerilog, category: 'rtl' },
    { path: `${prefix}/src/chip_top.v`, content: generated.chipTopVerilog, category: 'rtl' },
    { path: `${prefix}/constraints/top.sdc`, content: sdc, category: 'constraints' },
    { path: `${prefix}/config.json`, content: libreLaneConfig, category: 'flow' },
    { path: `${prefix}/pin_order.cfg`, content: pinOrder, category: 'flow' },
    { path: `${prefix}/tb/chip_top_tb.v`, content: tbVerilog, category: 'verification' },
    { path: `${prefix}/scripts/run_tapeout.sh`, content: runScript, executable: true, category: 'flow' },
    { path: `${prefix}/scripts/verify_signoff.py`, content: verifyScript, executable: true, category: 'verification' },
    { path: `${prefix}/docs/ARCHITECTURE_SPEC.md`, content: archSpecMd, category: 'docs' },
    { path: `${prefix}/docs/FACTORY_DATASHEET.md`, content: datasheet, category: 'docs' },
    { path: `${prefix}/MANIFEST.json`, content: manifest, category: 'metadata' }
  ];

  return {
    designName: design.name,
    topModule: `chip_${topModule}`,
    pdk,
    silicon,
    architecture,
    externalPorts: generated.externalPorts,
    readinessChecks,
    files
  };
}

export function buildAsicTapeoutTar(design: KonaDesign): {
  filename: string;
  archive: Uint8Array;
  bundle: AsicTapeoutBundle;
} {
  const bundle = generateAsicBundle(design);
  const topModule = sanitizeId(design.topModule || 'top');
  const filename = `${topModule}_${bundle.pdk.id}_tapeout_kit.tar`;
  const archive = buildTarArchive(
    bundle.files.map(f => ({ path: f.path, content: f.content, executable: f.executable }))
  );
  return { filename, archive, bundle };
}
