import { KonaDesign, KonaModuleDef, KonaModuleInstance } from '../ir.js';

export type DrcSeverity = 'error' | 'warning' | 'info';

export type DrcRuleId =
  | 'WIDTH_MISMATCH'
  | 'MULTI_DRIVER'
  | 'UNCONNECTED_CLOCK'
  | 'UNCONNECTED_RESET'
  | 'DANGLING_NET'
  | 'INVALID_PORT'
  | 'MISSING_MODULE'
  | 'UNKNOWN_PDK'
  | 'PDK_CLOCK_LIMIT'
  | 'PDK_UTILIZATION'
  | 'SRAM_MACRO_REQUIRED'
  | 'ADDRESS_MAP_OVERLAP'
  | 'PACKAGE_PIN_OVERFLOW'
  | 'POWER_BUDGET_EXCEEDED'
  | 'AREA_BUDGET_EXCEEDED'
  | 'INVALID_SV_IDENTIFIER'
  | (string & {});

export interface DrcDiagnostic {
  id: string;
  rule: DrcRuleId;
  severity: DrcSeverity;
  message: string;
  netId?: string;
  instanceId?: string;
  portId?: string;
}

export interface DrcContext {
  design: KonaDesign;
  instanceMap: Map<string, KonaModuleInstance>;
  drivenPorts: Map<string, string>; // `${instanceId}:${portId}` -> netId
  drivingPorts: Map<string, string>; // `${instanceId}:${portId}` -> netId
  resolveModule: (moduleId: string) => KonaModuleDef | undefined;
}

/**
 * Strategy interface for pluggable Design Rule Checks (Open-Closed Principle).
 */
export interface DrcRule {
  readonly id: string;
  evaluate(context: DrcContext): DrcDiagnostic[];
}
