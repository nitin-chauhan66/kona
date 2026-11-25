import { KonaDesign, KonaModuleDef, KonaModuleInstance } from '../ir.js';
import { getModuleDef } from '../catalog.js';
import { DrcContext, DrcDiagnostic, DrcRule } from './types.js';

/**
 * Orchestrates a pipeline of independent DrcRule strategies against a KonaDesign.
 */
export class DrcEngine {
  private readonly rules: DrcRule[] = [];
  private readonly resolveModule: (moduleId: string) => KonaModuleDef | undefined;

  constructor(
    initialRules: DrcRule[] = [],
    resolveModule: (moduleId: string) => KonaModuleDef | undefined = getModuleDef
  ) {
    this.resolveModule = resolveModule;
    for (const rule of initialRules) {
      this.registerRule(rule);
    }
  }

  public registerRule(rule: DrcRule): void {
    this.rules.push(rule);
  }

  public run(design: KonaDesign): DrcDiagnostic[] {
    const instanceMap = new Map<string, KonaModuleInstance>();
    for (const inst of design.instances) {
      instanceMap.set(inst.id, inst);
    }

    const context: DrcContext = {
      design,
      instanceMap,
      drivenPorts: new Map<string, string>(),
      drivingPorts: new Map<string, string>(),
      resolveModule: this.resolveModule
    };

    const diagnostics: DrcDiagnostic[] = [];
    for (const rule of this.rules) {
      diagnostics.push(...rule.evaluate(context));
    }
    return diagnostics;
  }
}
