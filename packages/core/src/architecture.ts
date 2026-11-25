/**
 * Stage 1 Architecture & Specification Analyzer
 *
 * Computes deterministic system-level chip metrics from a KonaDesign:
 * - Memory map extraction & address-overlap checks
 * - Clock & reset domain partitioning
 * - PDK-calibrated Gate Equivalent (GE), SRAM, Area (mm²), and Power (mW) PPA estimates
 * - External I/O pinout & package capacity check
 * - Stage 1 Specification & Architecture Readiness Checklist + Spec Markdown export
 */

import { KonaDesign, KonaModuleInstance, KonaPackageType, KonaPinEdge, KonaSiliconConfig } from './ir.js';
import { createDefaultSiliconConfig, getPdkDef, KonaPdkDef } from './pdk/index.js';

export interface PackageCapacitySpec {
  totalPins: number;
  powerPins: number;
  maxSignalPins: number;
}

export const PACKAGE_PIN_CAPACITY: Record<KonaPackageType, PackageCapacitySpec> = {
  QFN32: { totalPins: 32, powerPins: 8, maxSignalPins: 24 },
  QFN48: { totalPins: 48, powerPins: 12, maxSignalPins: 36 },
  QFN64: { totalPins: 64, powerPins: 16, maxSignalPins: 48 },
  DIP40: { totalPins: 40, powerPins: 8, maxSignalPins: 32 }
};

export interface MemoryMapRegion {
  crossbarId: string;
  crossbarName: string;
  slot: 'S0' | 'S1';
  baseAddr: number;
  endAddr: number;
  sizeBytes: number;
  baseHex: string;
  endHex: string;
  targetInstances: string[];
  overlapsWith?: string;
}

export interface ClockDomainInfo {
  sourceInstance: string;
  netName: string;
  freqMhz: number;
  consumers: string[];
}

export interface ExternalPinSpec {
  name: string;
  direction: 'input' | 'output' | 'inout';
  width: number;
  edge: KonaPinEdge;
  description: string;
}

export interface ArchitecturePpaEstimate {
  estimatedGates: number;
  sramKbytes: number;
  estimatedAreaMm2: number;
  estimatedPowerMw: number;
  clockFreqMhz: number;
  powerBudgetMw?: number;
  maxAreaMm2?: number;
  withinPowerBudget: boolean;
  withinAreaBudget: boolean;
}

export interface PackagePinBudget {
  packageType: KonaPackageType;
  signalPins: number;
  powerPins: number;
  totalPinsUsed: number;
  totalPackagePins: number;
  maxSignalPins: number;
  fitsPackage: boolean;
}

export interface Stage1ChecklistItem {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface ArchitectureReport {
  pdk: KonaPdkDef;
  silicon: KonaSiliconConfig;
  memoryMap: MemoryMapRegion[];
  memoryMapOverlaps: number;
  clockDomains: ClockDomainInfo[];
  externalPorts: ExternalPinSpec[];
  ppa: ArchitecturePpaEstimate;
  pinBudget: PackagePinBudget;
  checklist: Stage1ChecklistItem[];
}

const MODULE_GATE_ESTIMATES: Record<string, number> = {
  picorv32: 15500,
  ibex: 22500,
  axi_crossbar: 1800,
  wishbone_crossbar: 1500,
  uart_core: 1200,
  gpio_controller: 600,
  spi_controller: 1100,
  i2c_controller: 1300,
  timer_core: 1400,
  clock_divider: 250,
  clock_gen: 120
};

function formatHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).toUpperCase().padStart(8, '0');
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

export function extractExternalPorts(design: KonaDesign, silicon: KonaSiliconConfig): ExternalPinSpec[] {
  const sortedInstances = [...design.instances].sort((a, b) => a.id.localeCompare(b.id));
  const pinEdges = silicon.pinEdges || {};
  const resolveEdge = (name: string, fallback: KonaPinEdge): KonaPinEdge => pinEdges[name] || fallback;

  const ports: ExternalPinSpec[] = [
    {
      name: 'clk_in',
      direction: 'input',
      width: 1,
      edge: resolveEdge('clk_in', 'W'),
      description: `Primary clock input (${silicon.clockFreqMhz} MHz)`
    },
    {
      name: 'rst_n_in',
      direction: 'input',
      width: 1,
      edge: resolveEdge('rst_n_in', 'W'),
      description: 'Active-low asynchronous reset input'
    }
  ];

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
        ports.push({
          name: 'trap_out',
          direction: 'output',
          width: 1,
          edge: resolveEdge('trap_out', 'N'),
          description: 'CPU trap fault indicator'
        });
      }
    } else if (inst.moduleId === 'uart_core') {
      const suffix = uartIdx === 0 ? '' : `_${uartIdx}`;
      uartIdx++;
      if (!findConnectedNet(design, inst.id, 'rx', 'input')) {
        const name = `uart${suffix}_rx`;
        ports.push({ name, direction: 'input', width: 1, edge: resolveEdge(name, 'E'), description: 'UART serial RX input' });
      }
      if (!findConnectedNet(design, inst.id, 'tx', 'output')) {
        const name = `uart${suffix}_tx`;
        ports.push({ name, direction: 'output', width: 1, edge: resolveEdge(name, 'E'), description: 'UART serial TX output' });
      }
    } else if (inst.moduleId === 'spi_controller') {
      const suffix = spiIdx === 0 ? '' : `_${spiIdx}`;
      spiIdx++;
      for (const [portId, dir, desc] of [
        ['spi_sclk', 'output', 'SPI serial clock'],
        ['spi_cs_n', 'output', 'SPI active-low chip select'],
        ['spi_mosi', 'output', 'SPI master-out slave-in'],
        ['spi_miso', 'input', 'SPI master-in slave-out']
      ] as const) {
        if (!findConnectedNet(design, inst.id, portId, dir)) {
          const name = `${portId}${suffix}`;
          ports.push({ name, direction: dir, width: 1, edge: resolveEdge(name, 'S'), description: desc });
        }
      }
    } else if (inst.moduleId === 'i2c_controller') {
      const suffix = i2cIdx === 0 ? '' : `_${i2cIdx}`;
      i2cIdx++;
      for (const [portId, dir, desc] of [
        ['scl', 'output', 'I2C serial clock'],
        ['sda_out', 'output', 'I2C data output'],
        ['sda_in', 'input', 'I2C data input']
      ] as const) {
        if (!findConnectedNet(design, inst.id, portId, dir)) {
          const name = `i2c${suffix}_${portId}`;
          ports.push({ name, direction: dir, width: 1, edge: resolveEdge(name, 'S'), description: desc });
        }
      }
    } else if (inst.moduleId === 'gpio_controller' && !hasGpio) {
      hasGpio = true;
      const w = Number(inst.parameters.WIDTH ?? 8);
      ports.push(
        { name: 'gpio_in', direction: 'input', width: w, edge: resolveEdge('gpio_in', 'E'), description: 'GPIO pad inputs' },
        { name: 'gpio_out', direction: 'output', width: w, edge: resolveEdge('gpio_out', 'E'), description: 'GPIO pad outputs' },
        { name: 'gpio_oe', direction: 'output', width: w, edge: resolveEdge('gpio_oe', 'E'), description: 'GPIO output enable (active high)' }
      );
    } else if (inst.moduleId === 'timer_core') {
      const suffix = timerIdx === 0 ? '' : `_${timerIdx}`;
      timerIdx++;
      if (!findConnectedNet(design, inst.id, 'irq', 'output')) {
        const name = `timer${suffix}_irq`;
        ports.push({ name, direction: 'output', width: 1, edge: resolveEdge(name, 'N'), description: 'System timer interrupt' });
      }
    }
  }

  return ports;
}

export function extractMemoryMap(design: KonaDesign): MemoryMapRegion[] {
  const instanceMap = new Map<string, KonaModuleInstance>(design.instances.map(i => [i.id, i]));
  const regions: MemoryMapRegion[] = [];

  for (const inst of [...design.instances].sort((a, b) => a.id.localeCompare(b.id))) {
    if (inst.moduleId !== 'axi_crossbar' && inst.moduleId !== 'wishbone_crossbar') continue;

    const s0Base = Number(inst.parameters.S0_BASE_ADDR ?? 0) >>> 0;
    const s0Mask = Number(inst.parameters.S0_ADDR_MASK ?? 65535) >>> 0;
    const s1Base = Number(inst.parameters.S1_BASE_ADDR ?? 268435456) >>> 0;
    const s1Mask = Number(inst.parameters.S1_ADDR_MASK ?? 65535) >>> 0;

    const resolveTargets = (portIds: string[]): string[] => {
      const names = new Set<string>();
      for (const pid of portIds) {
        const net = findConnectedNet(design, inst.id, pid, 'output');
        if (net) {
          for (const tgt of net.targets) {
            const targetInst = instanceMap.get(tgt.instanceId);
            if (targetInst) names.add(`${targetInst.name} (${targetInst.moduleId})`);
          }
        }
      }
      return Array.from(names);
    };

    const s0Size = (s0Mask + 1) >>> 0;
    const s1Size = (s1Mask + 1) >>> 0;
    const s0End = (s0Base + s0Mask) >>> 0;
    const s1End = (s1Base + s1Mask) >>> 0;

    const r0: MemoryMapRegion = {
      crossbarId: inst.id,
      crossbarName: inst.name,
      slot: 'S0',
      baseAddr: s0Base,
      endAddr: s0End,
      sizeBytes: s0Size,
      baseHex: formatHex32(s0Base),
      endHex: formatHex32(s0End),
      targetInstances: resolveTargets(['s0_addr', 's0_valid', 's0_adr_o', 's0_cyc_o'])
    };
    const r1: MemoryMapRegion = {
      crossbarId: inst.id,
      crossbarName: inst.name,
      slot: 'S1',
      baseAddr: s1Base,
      endAddr: s1End,
      sizeBytes: s1Size,
      baseHex: formatHex32(s1Base),
      endHex: formatHex32(s1End),
      targetInstances: resolveTargets(['s1_addr', 's1_valid', 's1_adr_o', 's1_cyc_o'])
    };

    if (r0.baseAddr <= r1.endAddr && r1.baseAddr <= r0.endAddr) {
      r0.overlapsWith = `${inst.name}.S1`;
      r1.overlapsWith = `${inst.name}.S0`;
    }
    regions.push(r0, r1);
  }

  return regions;
}

export function extractClockDomains(design: KonaDesign, fallbackFreqMhz: number): ClockDomainInfo[] {
  const instanceMap = new Map<string, KonaModuleInstance>(design.instances.map(i => [i.id, i]));
  const domains: ClockDomainInfo[] = [];

  for (const inst of [...design.instances].sort((a, b) => a.id.localeCompare(b.id))) {
    if (inst.moduleId !== 'clock_gen' && inst.moduleId !== 'clock_divider') continue;
    const outNet = findConnectedNet(design, inst.id, 'clk_out', 'output');
    if (!outNet) continue;

    let freqMhz = fallbackFreqMhz;
    if (inst.moduleId === 'clock_gen') {
      freqMhz = Number(inst.parameters.FREQ_MHZ ?? fallbackFreqMhz);
    } else if (inst.moduleId === 'clock_divider') {
      const div = Math.max(2, Number(inst.parameters.DIVISOR ?? 4));
      freqMhz = +(fallbackFreqMhz / div).toFixed(2);
    }

    const consumers = outNet.targets
      .map(t => instanceMap.get(t.instanceId)?.name || t.instanceId)
      .filter((v, idx, arr) => arr.indexOf(v) === idx);

    domains.push({
      sourceInstance: inst.name,
      netName: outNet.name,
      freqMhz,
      consumers
    });
  }

  if (domains.length === 0) {
    domains.push({
      sourceInstance: 'external clk_in',
      netName: 'clk_in',
      freqMhz: fallbackFreqMhz,
      consumers: design.instances.map(i => i.name)
    });
  }

  return domains;
}

export function analyzeArchitecture(design: KonaDesign): ArchitectureReport {
  const silicon = design.silicon
    ? { ...design.silicon }
    : createDefaultSiliconConfig('sky130A');
  const pdk = getPdkDef(silicon.pdkId) || getPdkDef('sky130A')!;

  const memoryMap = extractMemoryMap(design);
  const memoryMapOverlaps = memoryMap.filter(r => Boolean(r.overlapsWith)).length;
  const clockDomains = extractClockDomains(design, silicon.clockFreqMhz);
  const externalPorts = extractExternalPorts(design, silicon);

  let estimatedGates = 0;
  let sramKbytes = 0;
  for (const inst of design.instances) {
    if (inst.moduleId === 'ram_dual_port') {
      const aw = Math.min(18, Math.max(2, Number(inst.parameters.ADDR_WIDTH ?? 14)));
      const dw = Math.max(1, Number(inst.parameters.DATA_WIDTH ?? 32));
      const words = 1 << aw;
      sramKbytes += +((words * dw) / 8192).toFixed(2);
      estimatedGates += silicon.sramMode === 'openram_macro'
        ? Math.round(words * (dw / 32) * 1.5)
        : Math.round(Math.min(words, 128) * dw * 6);
    } else if (inst.moduleId === 'sync_fifo') {
      const w = Number(inst.parameters.WIDTH ?? 32);
      const d = Number(inst.parameters.DEPTH ?? 16);
      estimatedGates += w * d * 8 + 300;
    } else {
      estimatedGates += MODULE_GATE_ESTIMATES[inst.moduleId] ?? 1000;
    }
  }

  // Approximate silicon core area (um² -> mm²) calibrated by node density + SRAM macros
  const gateAreaUm2 = pdk.nodeNm === 180 ? 22 : (pdk.id === 'sg13g2' ? 10 : 12);
  const coreAreaMm2 = (estimatedGates * gateAreaUm2) / (1_000_000 * Math.max(0.25, silicon.coreUtilization));
  const sramAreaMm2 = sramKbytes * (pdk.nodeNm === 180 ? 0.035 : 0.018);
  const estimatedAreaMm2 = +(Math.max(0.05, coreAreaMm2 + sramAreaMm2)).toFixed(3);

  // Approximate dynamic + static power (mW) scaled by node capacitance & clock MHz
  const nodeEnergyFactor = pdk.nodeNm === 180 ? 0.012 : (pdk.id === 'sg13g2' ? 0.0045 : 0.0065);
  const dynamicMw = (estimatedGates / 1000) * silicon.clockFreqMhz * nodeEnergyFactor;
  const sramMw = sramKbytes * silicon.clockFreqMhz * 0.004;
  const estimatedPowerMw = +(Math.max(0.4, dynamicMw + sramMw + 0.5)).toFixed(2);

  const powerBudgetMw = design.spec?.powerBudgetMw;
  const maxAreaMm2 = design.spec?.maxAreaMm2;
  const withinPowerBudget = powerBudgetMw === undefined || estimatedPowerMw <= powerBudgetMw;
  const withinAreaBudget = maxAreaMm2 === undefined || estimatedAreaMm2 <= maxAreaMm2;

  const pkgSpec = PACKAGE_PIN_CAPACITY[silicon.packageType] || PACKAGE_PIN_CAPACITY.QFN48;
  // Note: for GPIO, physical chip pads count once per bit (muxed via bidirectional IO pad)
  const signalPins = externalPorts.reduce((sum, p) => {
    if (p.name === 'gpio_out' || p.name === 'gpio_oe') return sum;
    return sum + p.width;
  }, 0);
  const totalPinsUsed = signalPins + pkgSpec.powerPins;
  const fitsPackage = signalPins <= pkgSpec.maxSignalPins;

  const hasSpecIdentity = Boolean(design.name?.trim() && design.topModule?.trim());
  const clockOk = silicon.clockFreqMhz > 0 && silicon.clockFreqMhz <= pdk.maxClockMhz;

  const checklist: Stage1ChecklistItem[] = [
    {
      id: 'stage1-spec',
      label: 'Chip Identity & Spec',
      status: hasSpecIdentity && design.spec?.targetApplication ? 'pass' : hasSpecIdentity ? 'warn' : 'fail',
      detail: design.spec?.targetApplication
        ? `${design.name} (${design.topModule}) · ${design.spec.targetApplication}`
        : `${design.name} (${design.topModule}) — add Target Application in Inspector`
    },
    {
      id: 'stage1-clocks',
      label: 'Clock & Reset Domains',
      status: clockOk ? 'pass' : 'fail',
      detail: `${clockDomains.length} clock domain(s), target ${silicon.clockFreqMhz} MHz (PDK max ${pdk.maxClockMhz} MHz)`
    },
    {
      id: 'stage1-memmap',
      label: 'Memory Map & Bus Decoding',
      status: memoryMapOverlaps === 0 ? 'pass' : 'fail',
      detail: memoryMap.length === 0
        ? 'No memory-mapped crossbar (streaming/pipeline architecture)'
        : memoryMapOverlaps === 0
          ? `${memoryMap.length} bus region(s) conflict-free`
          : `${memoryMapOverlaps} overlapping address region(s) detected`
    },
    {
      id: 'stage1-ppa',
      label: 'PPA & Area Feasibility',
      status: withinPowerBudget && withinAreaBudget ? 'pass' : 'warn',
      detail: `~${estimatedGates.toLocaleString()} GE · ${sramKbytes} KB SRAM · ~${estimatedAreaMm2} mm² · ~${estimatedPowerMw} mW`
    },
    {
      id: 'stage1-pins',
      label: `Package & Pinout (${silicon.packageType})`,
      status: fitsPackage ? 'pass' : 'fail',
      detail: `${signalPins}/${pkgSpec.maxSignalPins} signal pins (${totalPinsUsed}/${pkgSpec.totalPins} total w/ power)`
    }
  ];

  return {
    pdk,
    silicon,
    memoryMap,
    memoryMapOverlaps,
    clockDomains,
    externalPorts,
    ppa: {
      estimatedGates,
      sramKbytes,
      estimatedAreaMm2,
      estimatedPowerMw,
      clockFreqMhz: silicon.clockFreqMhz,
      powerBudgetMw,
      maxAreaMm2,
      withinPowerBudget,
      withinAreaBudget
    },
    pinBudget: {
      packageType: silicon.packageType,
      signalPins,
      powerPins: pkgSpec.powerPins,
      totalPinsUsed,
      totalPackagePins: pkgSpec.totalPins,
      maxSignalPins: pkgSpec.maxSignalPins,
      fitsPackage
    },
    checklist
  };
}

export function generateArchitectureSpecMarkdown(design: KonaDesign, existingReport?: ArchitectureReport): string {
  const report = existingReport || analyzeArchitecture(design);
  const spec = design.spec || {};

  const memRows = report.memoryMap.length > 0
    ? report.memoryMap.map(r =>
        `| ${r.crossbarName}.${r.slot} | \`${r.baseHex}\` | \`${r.endHex}\` | ${(r.sizeBytes / 1024).toFixed(1)} KB | ${r.targetInstances.join(', ') || 'Unconnected'} | ${r.overlapsWith ? `OVERLAP (${r.overlapsWith})` : 'OK'} |`
      ).join('\n')
    : '| _(none)_ | - | - | - | Streaming / non-bus datapath | OK |';

  const clkRows = report.clockDomains
    .map(c => `| \`${c.netName}\` | ${c.sourceInstance} | ${c.freqMhz} MHz | ${c.consumers.join(', ') || 'None'} |`)
    .join('\n');

  const pinRows = report.externalPorts
    .map(p => `| \`${p.name}\` | \`${p.direction}\` | ${p.width} | ${p.edge} | ${p.description} |`)
    .join('\n');

  const checklistRows = report.checklist
    .map(c => `- **[${c.status.toUpperCase()}] ${c.label}:** ${c.detail}`)
    .join('\n');

  return `# Stage 1 Architecture & Chip Specification

## 1. Chip Overview & Target Silicon
- **Design Name:** ${design.name}
- **Top Module:** \`${design.topModule}\`
- **Target Application:** ${spec.targetApplication || 'General-purpose SoC / Microcontroller'}
- **Author / Organization:** ${spec.author || 'Unspecified'}
- **Target PDK / Node:** ${report.pdk.name} (${report.pdk.nodeNm}nm, ${report.pdk.coreVoltage} core / ${report.pdk.ioVoltage} I/O)
- **Target Package:** ${report.pinBudget.packageType} (${report.pinBudget.signalPins}/${report.pinBudget.maxSignalPins} signal pins used, ${report.pinBudget.powerPins} power/ground pads)

## 2. PPA & Resource Budget Estimate
- **Estimated Logic Size:** ~${report.ppa.estimatedGates.toLocaleString()} Gate Equivalents (GE)
- **On-Chip SRAM:** ${report.ppa.sramKbytes} KB (${report.silicon.sramMode})
- **Estimated Core + Macro Area:** ~${report.ppa.estimatedAreaMm2} mm²${spec.maxAreaMm2 ? ` (Budget: ${spec.maxAreaMm2} mm²)` : ''}
- **Estimated Power @ ${report.ppa.clockFreqMhz} MHz:** ~${report.ppa.estimatedPowerMw} mW${spec.powerBudgetMw ? ` (Budget: ${spec.powerBudgetMw} mW)` : ''}

## 3. Clock & Reset Domains
| Clock Net | Source | Nominal Freq | Consumers |
| :--- | :--- | :---: | :--- |
${clkRows}

## 4. System Memory Map
| Bus Port | Base Address | End Address | Size | Connected Slave(s) | Status |
| :--- | :--- | :--- | :---: | :--- | :---: |
${memRows}

## 5. External I/O Interface & Die Edge Plan
| Signal | Direction | Width | Edge | Purpose |
| :--- | :--- | :---: | :---: | :--- |
${pinRows}

## 6. Stage 1 Readiness Checklist
${checklistRows}
`;
}
