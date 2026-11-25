import { analyzeArchitecture, extractMemoryMap } from '../../architecture.js';
import { getPdkDef } from '../../pdk/index.js';
import { DrcContext, DrcDiagnostic, DrcRule } from '../types.js';

/**
 * Validates Stage 1 architecture constraints (crossbar memory map overlaps) and,
 * when silicon targets are set, PDK clock/utilization/SRAM/package-pin budgets.
 */
export const siliconPdkRule: DrcRule = {
  id: 'SILICON_PDK_CHECK',
  evaluate(ctx: DrcContext): DrcDiagnostic[] {
    const diags: DrcDiagnostic[] = [];

    // Always validate crossbar memory-map address decoding for overlaps
    const memMap = extractMemoryMap(ctx.design);
    for (const region of memMap) {
      if (region.slot === 'S0' && region.overlapsWith) {
        diags.push({
          id: `drc-addr-overlap-${region.crossbarId}`,
          rule: 'ADDRESS_MAP_OVERLAP',
          severity: 'error',
          instanceId: region.crossbarId,
          message: `Crossbar "${region.crossbarName}" S0 (${region.baseHex}–${region.endHex}) overlaps with ${region.overlapsWith}.`
        });
      }
    }

    const silicon = ctx.design.silicon;
    if (!silicon) return diags;

    const pdk = getPdkDef(silicon.pdkId);
    if (!pdk) {
      diags.push({
        id: `drc-pdk-unknown-${silicon.pdkId}`,
        rule: 'UNKNOWN_PDK',
        severity: 'error',
        message: `Unsupported PDK target "${silicon.pdkId}". Choose sky130A, gf180mcuD, or sg13g2.`
      });
      return diags;
    }

    if (silicon.clockFreqMhz <= 0 || silicon.clockFreqMhz > pdk.maxClockMhz) {
      diags.push({
        id: `drc-pdk-clock-${pdk.id}`,
        rule: 'PDK_CLOCK_LIMIT',
        severity: 'error',
        message: `Target clock ${silicon.clockFreqMhz} MHz exceeds ${pdk.shortName} safe limit (${pdk.maxClockMhz} MHz).`
      });
    }

    if (silicon.coreUtilization < 0.2 || silicon.coreUtilization > 0.75) {
      diags.push({
        id: `drc-pdk-util-${pdk.id}`,
        rule: 'PDK_UTILIZATION',
        severity: 'warning',
        message: `Core utilization ${Math.round(silicon.coreUtilization * 100)}% is outside recommended 20%–75% range for ${pdk.shortName} routing closure.`
      });
    }

    for (const inst of ctx.design.instances) {
      if (inst.moduleId !== 'ram_dual_port') continue;
      const addrWidth = Number(inst.parameters.ADDR_WIDTH ?? 14);
      if (silicon.sramMode === 'dff_array' && addrWidth > pdk.maxSoftRamAddrBits) {
        diags.push({
          id: `drc-pdk-sram-${inst.id}`,
          rule: 'SRAM_MACRO_REQUIRED',
          severity: 'warning',
          instanceId: inst.id,
          message: `Block RAM "${inst.name}" (${1 << addrWidth} words) is too large for flip-flop synthesis on ${pdk.shortName}; switch SRAM mode to OpenRAM Macro or lower ADDR_WIDTH <= ${pdk.maxSoftRamAddrBits}.`
        });
      }
    }

    const report = analyzeArchitecture(ctx.design);
    if (!report.pinBudget.fitsPackage) {
      diags.push({
        id: `drc-pkg-pins-${silicon.packageType}`,
        rule: 'PACKAGE_PIN_OVERFLOW',
        severity: 'error',
        message: `Design requires ${report.pinBudget.signalPins} external signal pins, exceeding ${silicon.packageType} capacity (${report.pinBudget.maxSignalPins} signal pins).`
      });
    }
    if (!report.ppa.withinPowerBudget) {
      diags.push({
        id: 'drc-power-budget',
        rule: 'POWER_BUDGET_EXCEEDED',
        severity: 'warning',
        message: `Estimated power (${report.ppa.estimatedPowerMw} mW) exceeds Stage 1 budget (${report.ppa.powerBudgetMw} mW).`
      });
    }
    if (!report.ppa.withinAreaBudget) {
      diags.push({
        id: 'drc-area-budget',
        rule: 'AREA_BUDGET_EXCEEDED',
        severity: 'warning',
        message: `Estimated area (${report.ppa.estimatedAreaMm2} mm²) exceeds Stage 1 budget (${report.ppa.maxAreaMm2} mm²).`
      });
    }

    return diags;
  }
};
