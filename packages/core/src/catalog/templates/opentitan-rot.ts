import { KonaDesign } from '../../ir.js';
import { KonaTemplateDef } from '../registry.js';

export const OPENTITAN_ROT_TEMPLATE: KonaTemplateDef = {
  id: 'opentitan_rot',
  name: 'OpenTitan Root-of-Trust SoC (Google / lowRISC)',
  description: 'Silicon-proven root-of-trust architecture featuring lowRISC Ibex RV32IMC core, AXI-Lite crossbar, secure SRAM, 32-bit system timer, and UART',
  createDesign: (): KonaDesign => ({
    version: '1.0',
    name: 'OpenTitan Root-of-Trust Subsystem',
    topModule: 'top',
    metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      description: 'OpenTitan Silicon Root-of-Trust with lowRISC Ibex RV32IMC core, AXI-Lite interconnect, secure RAM, timer, and UART'
    },
    instances: [
      {
        id: 'sys_clk_gen',
        moduleId: 'clock_gen',
        name: 'u_clk_gen',
        position: { x: 60, y: 140 },
        parameters: { FREQ_MHZ: 50 }
      },
      {
        id: 'ibex_0',
        moduleId: 'ibex',
        name: 'u_ibex_core',
        position: { x: 320, y: 100 },
        parameters: { PMP_ENABLE: false, RV32M: true, RV32B: false }
      },
      {
        id: 'xbar_0',
        moduleId: 'axi_crossbar',
        name: 'u_axi_xbar',
        position: { x: 680, y: 100 },
        parameters: { S0_BASE_ADDR: 0, S0_ADDR_MASK: 65535, S1_BASE_ADDR: 268435456, S1_ADDR_MASK: 65535 }
      },
      {
        id: 'ram_0',
        moduleId: 'ram_dual_port',
        name: 'u_secure_ram',
        position: { x: 1020, y: 60 },
        parameters: { ADDR_WIDTH: 14, DATA_WIDTH: 32 }
      },
      {
        id: 'timer_0',
        moduleId: 'timer_core',
        name: 'u_sys_timer',
        position: { x: 1020, y: 340 },
        parameters: { PRESCALER: 50 }
      },
      {
        id: 'uart_0',
        moduleId: 'uart_core',
        name: 'u_sec_uart',
        position: { x: 1020, y: 600 },
        parameters: { BAUD_DIVISOR: 434 }
      }
    ],
    nets: [
      {
        id: 'net_clk',
        name: 'clk',
        width: 1,
        source: { instanceId: 'sys_clk_gen', portId: 'clk_out' },
        targets: [
          { instanceId: 'ibex_0', portId: 'clk' },
          { instanceId: 'xbar_0', portId: 'clk' },
          { instanceId: 'ram_0', portId: 'clk' },
          { instanceId: 'timer_0', portId: 'clk' },
          { instanceId: 'uart_0', portId: 'clk' }
        ]
      },
      {
        id: 'net_rst_n',
        name: 'rst_n',
        width: 1,
        source: { instanceId: 'sys_clk_gen', portId: 'rst_n_out' },
        targets: [
          { instanceId: 'ibex_0', portId: 'rst_n' },
          { instanceId: 'xbar_0', portId: 'rst_n' },
          { instanceId: 'timer_0', portId: 'rst_n' },
          { instanceId: 'uart_0', portId: 'rst_n' }
        ]
      },
      {
        id: 'net_ibex_addr',
        name: 'ibex_mem_addr',
        width: 32,
        source: { instanceId: 'ibex_0', portId: 'data_addr' },
        targets: [{ instanceId: 'xbar_0', portId: 'm_addr' }]
      },
      {
        id: 'net_ibex_valid',
        name: 'ibex_mem_req',
        width: 1,
        source: { instanceId: 'ibex_0', portId: 'data_req' },
        targets: [{ instanceId: 'xbar_0', portId: 'm_valid' }]
      },
      {
        id: 'net_xbar_ready',
        name: 'xbar_ibex_gnt',
        width: 1,
        source: { instanceId: 'xbar_0', portId: 'm_ready' },
        targets: [{ instanceId: 'ibex_0', portId: 'data_gnt' }]
      },
      {
        id: 'net_xbar_rdata',
        name: 'xbar_ibex_rdata',
        width: 32,
        source: { instanceId: 'xbar_0', portId: 'm_rdata' },
        targets: [{ instanceId: 'ibex_0', portId: 'data_rdata' }]
      },
      {
        id: 'net_ram_addr',
        name: 'ram_addr',
        width: 32,
        source: { instanceId: 'xbar_0', portId: 's0_addr' },
        targets: [{ instanceId: 'ram_0', portId: 'addr' }]
      },
      {
        id: 'net_ram_valid',
        name: 'ram_en',
        width: 1,
        source: { instanceId: 'xbar_0', portId: 's0_valid' },
        targets: [{ instanceId: 'ram_0', portId: 'en' }]
      },
      {
        id: 'net_ram_dout',
        name: 'ram_dout',
        width: 32,
        source: { instanceId: 'ram_0', portId: 'dout' },
        targets: [{ instanceId: 'xbar_0', portId: 's0_rdata' }]
      },
      {
        id: 'net_timer_addr',
        name: 'timer_addr',
        width: 32,
        source: { instanceId: 'xbar_0', portId: 's1_addr' },
        targets: [{ instanceId: 'timer_0', portId: 'addr' }]
      },
      {
        id: 'net_timer_valid',
        name: 'timer_we',
        width: 1,
        source: { instanceId: 'xbar_0', portId: 's1_valid' },
        targets: [{ instanceId: 'timer_0', portId: 'we' }]
      },
      {
        id: 'net_timer_rdata',
        name: 'timer_rdata',
        width: 32,
        source: { instanceId: 'timer_0', portId: 'rdata' },
        targets: [{ instanceId: 'xbar_0', portId: 's1_rdata' }]
      },
      {
        id: 'net_timer_irq',
        name: 'timer_irq',
        width: 1,
        source: { instanceId: 'timer_0', portId: 'irq' },
        targets: [{ instanceId: 'ibex_0', portId: 'irq_timer' }]
      }
    ]
  })
};
