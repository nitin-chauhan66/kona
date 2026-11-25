import { KonaModuleDef } from '../../ir.js';
import { PROCESSOR_MODULES } from './processors.js';
import { INTERCONNECT_MODULES } from './interconnects.js';
import { MEMORY_MODULES } from './memories.js';
import { PERIPHERAL_MODULES } from './peripherals.js';
import { INFRASTRUCTURE_MODULES } from './infrastructure.js';

export {
  PROCESSOR_MODULES,
  INTERCONNECT_MODULES,
  MEMORY_MODULES,
  PERIPHERAL_MODULES,
  INFRASTRUCTURE_MODULES
};

/**
 * Built-in starter IP catalog preserving canonical display order:
 * processors -> interconnects -> memories -> peripherals -> infrastructure.
 */
export const BUILTIN_MODULES: KonaModuleDef[] = [
  PROCESSOR_MODULES[0],       // picorv32
  INTERCONNECT_MODULES[0],    // axi_crossbar
  MEMORY_MODULES[0],          // ram_dual_port
  PERIPHERAL_MODULES[0],      // uart_core
  PERIPHERAL_MODULES[1],      // gpio_controller
  INFRASTRUCTURE_MODULES[0],  // sync_fifo
  INFRASTRUCTURE_MODULES[1],  // clock_divider
  INFRASTRUCTURE_MODULES[2],  // clock_gen
  PROCESSOR_MODULES[1],       // ibex
  INTERCONNECT_MODULES[1],    // wishbone_crossbar
  PERIPHERAL_MODULES[2],      // spi_controller
  PERIPHERAL_MODULES[3],      // i2c_controller
  PERIPHERAL_MODULES[4]       // timer_core
];
