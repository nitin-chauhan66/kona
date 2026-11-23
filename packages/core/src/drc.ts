/**
 * Real-Time Bus & Design Rule Checking (DRC) Engine (FR-1.2)
 *
 * Validates netlists against hardware design rules in real-time:
 * - Single-bit and multi-bit bus bit-width matching
 * - Multi-driver conflict detection
 * - Unconnected clock and reset pins
 * - Dangling nets and invalid references
 */

import { KonaDesign, KonaModuleInstance, KonaModuleDef } from './ir.js';
import { getModuleDef } from './catalog.js';

export type DrcSeverity = 'error' | 'warning' | 'info';

export interface DrcDiagnostic {
  id: string;
  rule: 'WIDTH_MISMATCH' | 'MULTI_DRIVER' | 'UNCONNECTED_CLOCK' | 'UNCONNECTED_RESET' | 'DANGLING_NET' | 'INVALID_PORT' | 'MISSING_MODULE';
  severity: DrcSeverity;
  message: string;
  netId?: string;
  instanceId?: string;
  portId?: string;
}

export function getEffectivePortWidth(modDef: KonaModuleDef | undefined, port: { width: number; id: string }, inst?: KonaModuleInstance): number {
  if (!inst || !modDef) return port.width;
  if ((modDef.id === 'sync_fifo' || modDef.id === 'gpio_controller') && typeof inst.parameters['WIDTH'] === 'number') {
    if (['din', 'dout', 'gpio_pins', 'in_val', 'out_val'].includes(port.id)) {
      return inst.parameters['WIDTH'] as number;
    }
  }
  if (modDef.id === 'spi_controller' && typeof inst.parameters['DATA_WIDTH'] === 'number') {
    if (['tx_data', 'rx_data'].includes(port.id)) {
      return inst.parameters['DATA_WIDTH'] as number;
    }
  }
  return port.width;
}

export function runDesignRuleCheck(design: KonaDesign): DrcDiagnostic[] {
  const diagnostics: DrcDiagnostic[] = [];
  const instMap = new Map<string, KonaModuleInstance>();
  const drivenPorts = new Map<string, string>(); // `${instanceId}:${portId}` -> netId
  const drivingPorts = new Map<string, string>(); // `${instanceId}:${portId}` -> netId

  // 1. Index instances and check missing module definitions
  for (const inst of design.instances) {
    instMap.set(inst.id, inst);
    const modDef = getModuleDef(inst.moduleId);
    if (!modDef) {
      diagnostics.push({
        id: `drc_missing_mod_${inst.id}`,
        rule: 'MISSING_MODULE',
        severity: 'error',
        message: `Instance "${inst.name}" (${inst.id}) references unknown module "${inst.moduleId}"`,
        instanceId: inst.id
      });
    }
  }

  // 2. Validate Nets: Widths, Drivers, and Connections
  for (const net of design.nets) {
    if (!net.source && net.targets.length === 0) {
      diagnostics.push({
        id: `drc_dangling_${net.id}`,
        rule: 'DANGLING_NET',
        severity: 'warning',
        message: `Net "${net.name}" (${net.id}) has neither a driver nor any receivers`,
        netId: net.id
      });
      continue;
    }

    if (!net.source && net.targets.length > 0) {
      diagnostics.push({
        id: `drc_undriven_${net.id}`,
        rule: 'DANGLING_NET',
        severity: 'error',
        message: `Net "${net.name}" (${net.id}) has ${net.targets.length} receivers but no driving source`,
        netId: net.id
      });
    }

    if (net.source && net.targets.length === 0) {
      diagnostics.push({
        id: `drc_unused_${net.id}`,
        rule: 'DANGLING_NET',
        severity: 'info',
        message: `Net "${net.name}" (${net.id}) is driven but connects to no receivers`,
        netId: net.id
      });
    }

    // Check source port
    if (net.source) {
      const srcInst = instMap.get(net.source.instanceId);
      if (srcInst) {
        const modDef = getModuleDef(srcInst.moduleId);
        const port = modDef?.ports.find(p => p.id === net.source!.portId);
        if (!port) {
          diagnostics.push({
            id: `drc_invalid_src_${net.id}`,
            rule: 'INVALID_PORT',
            severity: 'error',
            message: `Net "${net.name}" driver connects to non-existent port "${net.source.portId}" on "${srcInst.name}"`,
            netId: net.id,
            instanceId: srcInst.id,
            portId: net.source.portId
          });
        } else {
          // Check parameterized width
          const effectiveWidth = getEffectivePortWidth(modDef, port, srcInst);
          if (effectiveWidth !== net.width) {
            diagnostics.push({
              id: `drc_width_src_${net.id}`,
              rule: 'WIDTH_MISMATCH',
              severity: 'error',
              message: `Bit-width mismatch on net "${net.name}": driver port "${port.name}" is ${effectiveWidth}-bit, but net is ${net.width}-bit`,
              netId: net.id,
              instanceId: srcInst.id,
              portId: port.id
            });
          }

          // Check multi-driver conflict
          const key = `${srcInst.id}:${port.id}`;
          if (drivingPorts.has(key) && drivingPorts.get(key) !== net.id) {
            diagnostics.push({
              id: `drc_multi_driver_${net.id}_${key}`,
              rule: 'MULTI_DRIVER',
              severity: 'error',
              message: `Multi-driver conflict: output port "${port.name}" on "${srcInst.name}" drives multiple distinct nets`,
              netId: net.id,
              instanceId: srcInst.id,
              portId: port.id
            });
          } else {
            drivingPorts.set(key, net.id);
          }
        }
      }
    }

    // Check target ports
    for (const tgt of net.targets) {
      const tgtInst = instMap.get(tgt.instanceId);
      if (tgtInst) {
        const modDef = getModuleDef(tgtInst.moduleId);
        const port = modDef?.ports.find(p => p.id === tgt.portId);
        if (!port) {
          diagnostics.push({
            id: `drc_invalid_tgt_${net.id}_${tgt.instanceId}_${tgt.portId}`,
            rule: 'INVALID_PORT',
            severity: 'error',
            message: `Net "${net.name}" connects to non-existent input port "${tgt.portId}" on "${tgtInst.name}"`,
            netId: net.id,
            instanceId: tgtInst.id,
            portId: tgt.portId
          });
        } else {
          // Check parameterized width
          const effectiveWidth = getEffectivePortWidth(modDef, port, tgtInst);
          if (effectiveWidth !== net.width) {
            diagnostics.push({
              id: `drc_width_tgt_${net.id}_${tgt.instanceId}_${tgt.portId}`,
              rule: 'WIDTH_MISMATCH',
              severity: 'error',
              message: `Bit-width mismatch: Net "${net.name}" (${net.width}-bit) connected to "${tgtInst.name}.${port.name}" (${effectiveWidth}-bit)`,
              netId: net.id,
              instanceId: tgtInst.id,
              portId: port.id
            });
          }

          // Multiple nets driving same input
          const key = `${tgtInst.id}:${tgt.portId}`;
          if (drivenPorts.has(key) && drivenPorts.get(key) !== net.id) {
            diagnostics.push({
              id: `drc_multi_in_${net.id}_${key}`,
              rule: 'MULTI_DRIVER',
              severity: 'error',
              message: `Multiple nets driving the same input port "${port.name}" on instance "${tgtInst.name}"`,
              netId: net.id,
              instanceId: tgtInst.id,
              portId: port.id
            });
          } else {
            drivenPorts.set(key, net.id);
          }
        }
      }
    }
  }

  // 3. Unconnected Clock & Reset Pins Check
  for (const inst of design.instances) {
    const modDef = getModuleDef(inst.moduleId);
    if (!modDef) continue;

    for (const port of modDef.ports) {
      if (port.direction === 'input') {
        const key = `${inst.id}:${port.id}`;
        const isConnected = drivenPorts.has(key);

        if (!isConnected) {
          if (port.type === 'clock') {
            diagnostics.push({
              id: `drc_unconn_clk_${inst.id}_${port.id}`,
              rule: 'UNCONNECTED_CLOCK',
              severity: 'warning',
              message: `Unconnected clock input "${port.name}" on instance "${inst.name}" (${modDef.name})`,
              instanceId: inst.id,
              portId: port.id
            });
          } else if (port.type === 'reset') {
            diagnostics.push({
              id: `drc_unconn_rst_${inst.id}_${port.id}`,
              rule: 'UNCONNECTED_RESET',
              severity: 'warning',
              message: `Unconnected reset input "${port.name}" on instance "${inst.name}" (${modDef.name})`,
              instanceId: inst.id,
              portId: port.id
            });
          }
        }
      }
    }
  }

  return diagnostics;
}
