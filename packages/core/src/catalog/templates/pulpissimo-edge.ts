import { KonaDesign } from '../../ir.js';
import { KonaTemplateDef } from '../registry.js';

export const PULPISSIMO_EDGE_TEMPLATE: KonaTemplateDef = {
  id: 'pulpissimo_edge',
  name: 'PULPissimo Edge AI & IoT SoC (ETH Zürich)',
  description: 'Silicon taped-out edge AI & microcontroller SoC featuring RISC-V core, AXI-Lite crossbar, multi-bank SRAM, SPI master, and I2C sensor bus',
  createDesign: (): KonaDesign => ({
    version: '1.0',
    name: 'PULPissimo Edge AI SoC',
    topModule: 'top',
    metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      description: 'ETH Zürich PULPissimo single-core RISC-V edge computing platform with SPI and I2C sensor interfaces'
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
        id: 'pulp_core',
        moduleId: 'picorv32',
        name: 'u_pulp_cpu',
        position: { x: 320, y: 100 },
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
        id: 'l2_sram',
        moduleId: 'ram_dual_port',
        name: 'u_l2_sram',
        position: { x: 1020, y: 60 },
        parameters: { ADDR_WIDTH: 14, DATA_WIDTH: 32 }
      },
      {
        id: 'spi_host',
        moduleId: 'spi_controller',
        name: 'u_spi_host',
        position: { x: 1020, y: 340 },
        parameters: { CLK_DIV: 8, DATA_WIDTH: 8 }
      },
      {
        id: 'i2c_sensor',
        moduleId: 'i2c_controller',
        name: 'u_i2c_sensor',
        position: { x: 1020, y: 620 },
        parameters: { PRESCALE: 125 }
      }
    ],
    nets: [
      {
        id: 'net_clk',
        name: 'clk',
        width: 1,
        source: { instanceId: 'clk_gen_0', portId: 'clk_out' },
        targets: [
          { instanceId: 'pulp_core', portId: 'clk' },
          { instanceId: 'xbar_0', portId: 'clk' },
          { instanceId: 'l2_sram', portId: 'clk' },
          { instanceId: 'spi_host', portId: 'clk' },
          { instanceId: 'i2c_sensor', portId: 'clk' }
        ]
      },
      {
        id: 'net_rst_n',
        name: 'rst_n',
        width: 1,
        source: { instanceId: 'clk_gen_0', portId: 'rst_n_out' },
        targets: [
          { instanceId: 'pulp_core', portId: 'resetn' },
          { instanceId: 'xbar_0', portId: 'rst_n' },
          { instanceId: 'spi_host', portId: 'rst_n' },
          { instanceId: 'i2c_sensor', portId: 'rst_n' }
        ]
      },
      {
        id: 'net_cpu_addr',
        name: 'cpu_mem_addr',
        width: 32,
        source: { instanceId: 'pulp_core', portId: 'mem_addr' },
        targets: [{ instanceId: 'xbar_0', portId: 'm_addr' }]
      },
      {
        id: 'net_cpu_valid',
        name: 'cpu_mem_valid',
        width: 1,
        source: { instanceId: 'pulp_core', portId: 'mem_valid' },
        targets: [{ instanceId: 'xbar_0', portId: 'm_valid' }]
      },
      {
        id: 'net_xbar_ready',
        name: 'xbar_ready',
        width: 1,
        source: { instanceId: 'xbar_0', portId: 'm_ready' },
        targets: [{ instanceId: 'pulp_core', portId: 'mem_ready' }]
      },
      {
        id: 'net_xbar_rdata',
        name: 'xbar_rdata',
        width: 32,
        source: { instanceId: 'xbar_0', portId: 'm_rdata' },
        targets: [{ instanceId: 'pulp_core', portId: 'mem_rdata' }]
      },
      {
        id: 'net_ram_addr',
        name: 'ram_addr',
        width: 32,
        source: { instanceId: 'xbar_0', portId: 's0_addr' },
        targets: [{ instanceId: 'l2_sram', portId: 'addr' }]
      },
      {
        id: 'net_ram_valid',
        name: 'ram_en',
        width: 1,
        source: { instanceId: 'xbar_0', portId: 's0_valid' },
        targets: [{ instanceId: 'l2_sram', portId: 'en' }]
      },
      {
        id: 'net_ram_dout',
        name: 'ram_dout',
        width: 32,
        source: { instanceId: 'l2_sram', portId: 'dout' },
        targets: [{ instanceId: 'xbar_0', portId: 's0_rdata' }]
      },
      {
        id: 'net_spi_rx_to_i2c',
        name: 'spi_rx_to_i2c_din',
        width: 8,
        source: { instanceId: 'spi_host', portId: 'rx_data' },
        targets: [{ instanceId: 'i2c_sensor', portId: 'din' }]
      },
      {
        id: 'net_spi_rx_valid',
        name: 'spi_rx_strobe',
        width: 1,
        source: { instanceId: 'spi_host', portId: 'rx_valid' },
        targets: [{ instanceId: 'i2c_sensor', portId: 'start' }]
      }
    ]
  })
};
