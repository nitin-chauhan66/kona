import { KonaDesign } from '../ir.js';
import { DrcEngine } from './engine.js';
import { BUILTIN_DRC_RULES } from './rules/index.js';
import { DrcDiagnostic } from './types.js';

export * from './types.js';
export * from './port-width.js';
export * from './engine.js';
export * from './rules/index.js';

export const defaultDrcEngine = new DrcEngine(BUILTIN_DRC_RULES);

export function runDesignRuleCheck(design: KonaDesign): DrcDiagnostic[] {
  return defaultDrcEngine.run(design);
}
