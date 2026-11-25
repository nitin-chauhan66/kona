import { DrcContext, DrcDiagnostic, DrcRule } from '../types.js';
import { getEffectivePortWidth } from '../port-width.js';

/**
 * Validates net topology, port validity, bit-width compatibility, and driver exclusivity.
 * Populates context.drivingPorts and context.drivenPorts for downstream rules.
 */
export const netConnectivityRule: DrcRule = {
  id: 'net-connectivity',
  evaluate(ctx: DrcContext): DrcDiagnostic[] {
    const diagnostics: DrcDiagnostic[] = [];

    for (const net of ctx.design.nets) {
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

      if (net.source) {
        const srcInst = ctx.instanceMap.get(net.source.instanceId);
        if (srcInst) {
          const modDef = ctx.resolveModule(srcInst.moduleId);
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

            const key = `${srcInst.id}:${port.id}`;
            if (ctx.drivingPorts.has(key) && ctx.drivingPorts.get(key) !== net.id) {
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
              ctx.drivingPorts.set(key, net.id);
            }
          }
        }
      }

      for (const tgt of net.targets) {
        const tgtInst = ctx.instanceMap.get(tgt.instanceId);
        if (!tgtInst) continue;

        const modDef = ctx.resolveModule(tgtInst.moduleId);
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

          const key = `${tgtInst.id}:${tgt.portId}`;
          if (ctx.drivenPorts.has(key) && ctx.drivenPorts.get(key) !== net.id) {
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
            ctx.drivenPorts.set(key, net.id);
          }
        }
      }
    }

    return diagnostics;
  }
};
