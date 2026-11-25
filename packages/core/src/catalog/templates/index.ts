import { KonaTemplateDef } from '../registry.js';
import { RISCV_MCU_TEMPLATE } from './riscv-mcu.js';
import { UART_LOOPBACK_TEMPLATE } from './uart-loopback.js';
import { OPENTITAN_ROT_TEMPLATE } from './opentitan-rot.js';
import { PULPISSIMO_EDGE_TEMPLATE } from './pulpissimo-edge.js';
import { LITEX_WISHBONE_TEMPLATE } from './litex-wishbone.js';
import { SENSOR_HUB_TEMPLATE } from './sensor-hub.js';

export const BUILTIN_TEMPLATES: KonaTemplateDef[] = [
  RISCV_MCU_TEMPLATE,
  UART_LOOPBACK_TEMPLATE,
  OPENTITAN_ROT_TEMPLATE,
  PULPISSIMO_EDGE_TEMPLATE,
  LITEX_WISHBONE_TEMPLATE,
  SENSOR_HUB_TEMPLATE
];
