import { SV_RESERVED_KEYWORDS } from '../../codegen.js';
import { DrcContext, DrcDiagnostic, DrcRule } from '../types.js';

/**
 * Flags SystemVerilog reserved keywords or malformed identifiers in topModule,
 * instance names, and net names during Stage 2 RTL generation.
 */
export const svIdentifierRule: DrcRule = {
  id: 'SV_IDENTIFIER_CHECK',
  evaluate(ctx: DrcContext): DrcDiagnostic[] {
    const diags: DrcDiagnostic[] = [];
    const validId = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

    const top = (ctx.design.topModule || '').trim();
    if (top && (SV_RESERVED_KEYWORDS.has(top) || !validId.test(top))) {
      diags.push({
        id: 'drc-sv-top-name',
        rule: 'INVALID_SV_IDENTIFIER',
        severity: 'error',
        message: `Top module "${top}" is not a clean SystemVerilog identifier or uses a reserved keyword.`
      });
    }

    for (const inst of ctx.design.instances) {
      const name = inst.name.trim();
      if (SV_RESERVED_KEYWORDS.has(name) || !validId.test(name)) {
        diags.push({
          id: `drc-sv-inst-${inst.id}`,
          rule: 'INVALID_SV_IDENTIFIER',
          severity: 'error',
          instanceId: inst.id,
          message: `Instance name "${inst.name}" must be a valid non-reserved SystemVerilog identifier.`
        });
      }
    }

    for (const net of ctx.design.nets) {
      const name = net.name.trim();
      if (SV_RESERVED_KEYWORDS.has(name) || !validId.test(name)) {
        diags.push({
          id: `drc-sv-net-${net.id}`,
          rule: 'INVALID_SV_IDENTIFIER',
          severity: 'error',
          netId: net.id,
          message: `Net name "${net.name}" must be a valid non-reserved SystemVerilog identifier.`
        });
      }
    }

    return diags;
  }
};
