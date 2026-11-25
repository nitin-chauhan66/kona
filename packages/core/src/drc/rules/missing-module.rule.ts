import { DrcContext, DrcDiagnostic, DrcRule } from '../types.js';

export const missingModuleRule: DrcRule = {
  id: 'missing-module',
  evaluate(ctx: DrcContext): DrcDiagnostic[] {
    const diagnostics: DrcDiagnostic[] = [];
    for (const inst of ctx.design.instances) {
      const modDef = ctx.resolveModule(inst.moduleId);
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
    return diagnostics;
  }
};
