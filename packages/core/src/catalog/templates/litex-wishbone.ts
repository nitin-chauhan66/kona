import { KonaDesign } from '../../ir.js';
import { KonaTemplateDef } from '../registry.js';

export const LITEX_WISHBONE_TEMPLATE: KonaTemplateDef = {
  id: 'litex_wishbone',
  name: 'LiteX Wishbone SoC (Fomu / Betrusted)',
  description: 'Industry-standard open-source FPGA SoC ecosystem featuring Wishbone B4 crossbar, RISC-V core, Block RAM, SPI Flash controller, and LiteUART',
  createDesign: (): KonaDesign => ({
    version: '1.0',
    name: 'LiteX Wishbone SoC',
    topModule: 'top',
    metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      description: 'LiteX FPGA System-on-Chip with Wishbone bus, PicoRV32, SPI Flash, and UART transceiver'
    },
    instances: [
      {
        id: 'clk_gen_0',
        moduleId: 'clock_gen',
        name: 'u_clk_gen',
        position: { x: 60, y: 140 },
        parameters: { FREQ_MHZ: 50 }
      },
      {
        id: 'litex_cpu',
        moduleId: 'picorv32',
        name: 'u_litex_cpu',
        position: { x: 320, y: 100 },
        parameters: { ENABLE_COUNTERS: true, ENABLE_MUL: true, ENABLE_DIV: true, BARREL_SHIFTER: true, STACKADDR: 65536 }
      },
      {
        id: 'wb_xbar',
        moduleId: 'wishbone_crossbar',
        name: 'u_wb_xbar',
        position: { x: 680, y: 100 },
        parameters: { S0_BASE_ADDR: 0, S1_BASE_ADDR: 268435456 }
      },
      {
        id: 'wb_ram',
        moduleId: 'ram_dual_port',
        name: 'u_wb_ram',
        position: { x: 1040, y: 60 },
        parameters: { ADDR_WIDTH: 14, DATA_WIDTH: 32 }
      },
      {
        id: 'spi_flash',
        moduleId: 'spi_controller',
        name: 'u_spi_flash',
        position: { x: 1040, y: 340 },
        parameters: { CLK_DIV: 8, DATA_WIDTH: 8 }
      },
      {
        id: 'lite_uart',
        moduleId: 'uart_core',
        name: 'u_lite_uart',
        position: { x: 1040, y: 620 },
        parameters: { BAUD_DIVISOR: 434 }
      }
    ],
    nets: [
      {
        id: 'net_clk',
        name: 'clk',
        width: 1,
        source: { instanceId: 'clk_gen_0', portId: 'clk_out' },
        targets: [
          { instanceId: 'litex_cpu', portId: 'clk' },
          { instanceId: 'wb_xbar', portId: 'clk' },
          { instanceId: 'wb_ram', portId: 'clk' },
          { instanceId: 'spi_flash', portId: 'clk' },
          { instanceId: 'lite_uart', portId: 'clk' }
        ]
      },
      {
        id: 'net_rst_n',
        name: 'rst_n',
        width: 1,
        source: { instanceId: 'clk_gen_0', portId: 'rst_n_out' },
        targets: [
          { instanceId: 'litex_cpu', portId: 'resetn' },
          { instanceId: 'wb_xbar', portId: 'rst_n' },
          { instanceId: 'spi_flash', portId: 'rst_n' },
          { instanceId: 'lite_uart', portId: 'rst_n' }
        ]
      },
      {
        id: 'net_wb_adr',
        name: 'wb_adr',
        width: 32,
        source: { instanceId: 'litex_cpu', portId: 'mem_addr' },
        targets: [{ instanceId: 'wb_xbar', portId: 'wb_adr_i' }]
      },
      {
        id: 'net_wb_stb',
        name: 'wb_stb',
        width: 1,
        source: { instanceId: 'litex_cpu', portId: 'mem_valid' },
        targets: [
          { instanceId: 'wb_xbar', portId: 'wb_cyc_i' },
          { instanceId: 'wb_xbar', portId: 'wb_stb_i' }
        ]
      },
      {
        id: 'net_wb_rdata',
        name: 'wb_rdata',
        width: 32,
        source: { instanceId: 'wb_xbar', portId: 'wb_dat_o' },
        targets: [{ instanceId: 'litex_cpu', portId: 'mem_rdata' }]
      },
      {
        id: 'net_wb_ack',
        name: 'wb_ack',
        width: 1,
        source: { instanceId: 'wb_xbar', portId: 'wb_ack_o' },
        targets: [{ instanceId: 'litex_cpu', portId: 'mem_ready' }]
      },
      {
        id: 'net_s0_adr',
        name: 's0_adr',
        width: 32,
        source: { instanceId: 'wb_xbar', portId: 's0_adr_o' },
        targets: [{ instanceId: 'wb_ram', portId: 'addr' }]
      },
      {
        id: 'net_s0_stb',
        name: 's0_en',
        width: 1,
        source: { instanceId: 'wb_xbar', portId: 's0_stb_o' },
        targets: [{ instanceId: 'wb_ram', portId: 'en' }]
      },
      {
        id: 'net_s0_dat',
        name: 's0_dout',
        width: 32,
        source: { instanceId: 'wb_ram', portId: 'dout' },
        targets: [{ instanceId: 'wb_xbar', portId: 's0_dat_i' }]
      },
      {
        id: 'net_uart_to_flash',
        name: 'uart_to_spi_tx',
        width: 8,
        source: { instanceId: 'lite_uart', portId: 'rx_data' },
        targets: [{ instanceId: 'spi_flash', portId: 'tx_data' }]
      },
      {
        id: 'net_uart_to_flash_valid',
        name: 'uart_to_spi_valid',
        width: 1,
        source: { instanceId: 'lite_uart', portId: 'rx_valid' },
        targets: [{ instanceId: 'spi_flash', portId: 'tx_valid' }]
      }
    ]
  })
};
