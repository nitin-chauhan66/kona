import { DrcContext, DrcDiagnostic, DrcRule } from '../types.js';

export const clockResetRule: DrcRule = {
  id: 'clock-reset',
  evaluate(ctx: DrcContext): DrcDiagnostic[] {
    const diagnostics: DrcDiagnostic[] = [];

    for (const inst of ctx.design.instances) {
      const modDef = ctx.resolveModule(inst.moduleId);
      if (!modDef) continue;

      for (const port of modDef.ports) {
        if (port.direction !== 'input') continue;
        const key = `${inst.id}:${port.id}`;
        if (ctx.drivenPorts.has(key)) continue;

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

    return diagnostics;
  }
};
