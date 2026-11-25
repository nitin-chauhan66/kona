import { KonaDesign } from '../../ir.js';
import { KonaTemplateDef } from '../registry.js';

export const RISCV_MCU_TEMPLATE: KonaTemplateDef = {
  id: 'riscv_mcu',
  name: 'RISC-V Microcontroller Starter',
  description: 'PicoRV32 RV32IMC core connected to dual-port RAM and UART peripheral via AXI Crossbar',
  createDesign: (): KonaDesign => ({
    version: '1.0',
    name: 'PicoRV32 Microcontroller SoC',
    topModule: 'top',
    metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      description: 'Complete RISC-V SoC with PicoRV32, AXI-Lite Crossbar, SRAM, and UART'
    },
    instances: [
      {
        id: 'sys_clk_gen',
        moduleId: 'clock_gen',
        name: 'u_clk_gen',
        position: { x: 80, y: 120 },
        parameters: { FREQ_MHZ: 50 }
      },
      {
        id: 'cpu_0',
        moduleId: 'picorv32',
        name: 'u_picorv32',
        position: { x: 340, y: 100 },
        parameters: { ENABLE_COUNTERS: true, ENABLE_MUL: true, ENABLE_DIV: true, BARREL_SHIFTER: true, STACKADDR: 65536 }
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
        name: 'u_ram',
        position: { x: 1020, y: 80 },
        parameters: { ADDR_WIDTH: 14, DATA_WIDTH: 32 }
      },
      {
        id: 'uart_0',
        moduleId: 'uart_core',
        name: 'u_uart',
        position: { x: 1020, y: 360 },
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
          { instanceId: 'cpu_0', portId: 'clk' },
          { instanceId: 'xbar_0', portId: 'clk' },
          { instanceId: 'ram_0', portId: 'clk' },
          { instanceId: 'uart_0', portId: 'clk' }
        ]
      },
      {
        id: 'net_rst_n',
        name: 'rst_n',
        width: 1,
        source: { instanceId: 'sys_clk_gen', portId: 'rst_n_out' },
        targets: [
          { instanceId: 'cpu_0', portId: 'resetn' },
          { instanceId: 'xbar_0', portId: 'rst_n' },
          { instanceId: 'uart_0', portId: 'rst_n' }
        ]
      },
      {
        id: 'net_cpu_to_xbar_addr',
        name: 'cpu_mem_addr',
        width: 32,
        source: { instanceId: 'cpu_0', portId: 'mem_addr' },
        targets: [{ instanceId: 'xbar_0', portId: 'm_addr' }]
      },
      {
        id: 'net_cpu_to_xbar_valid',
        name: 'cpu_mem_valid',
        width: 1,
        source: { instanceId: 'cpu_0', portId: 'mem_valid' },
        targets: [{ instanceId: 'xbar_0', portId: 'm_valid' }]
      },
      {
        id: 'net_xbar_to_ram_addr',
        name: 'ram_addr',
        width: 32,
        source: { instanceId: 'xbar_0', portId: 's0_addr' },
        targets: [{ instanceId: 'ram_0', portId: 'addr' }]
      },
      {
        id: 'net_xbar_to_ram_valid',
        name: 'ram_en',
        width: 1,
        source: { instanceId: 'xbar_0', portId: 's0_valid' },
        targets: [{ instanceId: 'ram_0', portId: 'en' }]
      },
      {
        id: 'net_ram_to_xbar_dout',
        name: 'ram_dout',
        width: 32,
        source: { instanceId: 'ram_0', portId: 'dout' },
        targets: [{ instanceId: 'xbar_0', portId: 's0_rdata' }]
      }
    ]
  })
};
