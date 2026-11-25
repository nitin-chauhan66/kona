import { KonaModuleDef, KonaModuleInstance } from '../ir.js';

/**
 * Resolves the effective bit-width of a port considering instance parameter overrides.
 */
export function getEffectivePortWidth(
  modDef: KonaModuleDef | undefined,
  port: { width: number; id: string },
  inst?: KonaModuleInstance
): number {
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
