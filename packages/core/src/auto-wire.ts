/**
 * One-Click Auto-Wiring & Beginner Issue Fixer
 *
 * Automatically connects floating clock and reset pins to the chip's primary
 * clock/reset sources (creating a clock_gen block if none exists), making it
 * effortless for non-technical users to drop blocks and get a DRC-clean chip.
 */

import { getModuleDef } from './catalog.js';
import { KonaDesign, KonaModuleInstance, KonaNet } from './ir.js';

export interface AutoWireSummary {
  createdClockGen: boolean;
  connectedClocks: number;
  connectedResets: number;
  removedOrphanNets: number;
}

function cloneDesign(design: KonaDesign): KonaDesign {
  return JSON.parse(JSON.stringify(design)) as KonaDesign;
}

function isInputConnected(design: KonaDesign, instanceId: string, portId: string): boolean {
  return design.nets.some(n =>
    n.targets.some(t => t.instanceId === instanceId && t.portId === portId)
  );
}

function findOrCreateSourceNet(
  design: KonaDesign,
  sourceInstId: string,
  sourcePortId: string,
  preferredName: string
): KonaNet {
  let net = design.nets.find(
    n => n.source?.instanceId === sourceInstId && n.source?.portId === sourcePortId
  );
  if (net) return net;

  const uniqueId = `net_auto_${preferredName}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  net = {
    id: uniqueId,
    name: preferredName,
    width: 1,
    source: { instanceId: sourceInstId, portId: sourcePortId },
    targets: []
  };
  design.nets.push(net);
  return net;
}

export function autoWireDesign(inputDesign: KonaDesign): {
  design: KonaDesign;
  summary: AutoWireSummary;
} {
  const design = cloneDesign(inputDesign);
  const summary: AutoWireSummary = {
    createdClockGen: false,
    connectedClocks: 0,
    connectedResets: 0,
    removedOrphanNets: 0
  };

  if (design.instances.length === 0) {
    return { design, summary };
  }

  // 1. Ensure a primary clock_gen exists
  let clkGen: KonaModuleInstance | undefined = design.instances.find(i => i.moduleId === 'clock_gen');
  if (!clkGen) {
    const minX = Math.min(...design.instances.map(i => i.position.x));
    const avgY = design.instances.reduce((s, i) => s + i.position.y, 0) / design.instances.length;
    clkGen = {
      id: `clock_gen_auto_${Date.now()}`,
      moduleId: 'clock_gen',
      name: 'u_clk_gen',
      position: { x: Math.max(40, Math.round(minX - 240)), y: Math.max(60, Math.round(avgY)) },
      parameters: { FREQ_MHZ: design.silicon?.clockFreqMhz || 50 }
    };
    design.instances.unshift(clkGen);
    summary.createdClockGen = true;
  }

  const clkNet = findOrCreateSourceNet(design, clkGen.id, 'clk_out', 'clk');
  const rstNet = findOrCreateSourceNet(design, clkGen.id, 'rst_n_out', 'rst_n');

  // 2. Wire all unconnected clock & reset input pins across every block
  for (const inst of design.instances) {
    if (inst.id === clkGen.id) continue;
    const modDef = getModuleDef(inst.moduleId);
    if (!modDef) continue;

    for (const port of modDef.ports) {
      if (port.direction !== 'input') continue;
      if (port.type === 'clock' && !isInputConnected(design, inst.id, port.id)) {
        clkNet.targets.push({ instanceId: inst.id, portId: port.id });
        summary.connectedClocks++;
      } else if (port.type === 'reset' && !isInputConnected(design, inst.id, port.id)) {
        rstNet.targets.push({ instanceId: inst.id, portId: port.id });
        summary.connectedResets++;
      }
    }
  }

  // 3. Prune completely dangling nets with no source and no targets
  const beforeLen = design.nets.length;
  design.nets = design.nets.filter(n => Boolean(n.source) || n.targets.length > 0);
  summary.removedOrphanNets = beforeLen - design.nets.length;

  design.metadata.modified = new Date().toISOString();
  return { design, summary };
}
