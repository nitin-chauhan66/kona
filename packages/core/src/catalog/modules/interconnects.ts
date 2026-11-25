import { KonaModuleDef } from '../../ir.js';

export const INTERCONNECT_MODULES: KonaModuleDef[] = [
  {
    id: 'axi_crossbar',
    name: 'AXI-Lite Interconnect',
    category: 'interconnect',
    description: '1-Master to 2-Slave AXI4-Lite crossbar with memory-mapped address routing',
    defaultWidth: 240,
    defaultHeight: 280,
    parameters: [
      { name: 'S0_BASE_ADDR', type: 'integer', default: 0, description: 'Base address for Slave 0 (e.g. RAM 0x00000000)' },
      { name: 'S0_ADDR_MASK', type: 'integer', default: 65535, description: 'Address mask for Slave 0 (64KB)' },
      { name: 'S1_BASE_ADDR', type: 'integer', default: 268435456, description: 'Base address for Slave 1 (e.g. Peripherals 0x10000000)' },
      { name: 'S1_ADDR_MASK', type: 'integer', default: 65535, description: 'Address mask for Slave 1 (64KB)' }
    ],
    ports: [
      { id: 'clk', name: 'clk', direction: 'input', type: 'clock', width: 1, description: 'Interconnect clock' },
      { id: 'rst_n', name: 'rst_n', direction: 'input', type: 'reset', width: 1, description: 'Active-low reset' },
      { id: 'm_addr', name: 'm_addr', direction: 'input', type: 'bus', width: 32, description: 'Master request address' },
      { id: 'm_valid', name: 'm_valid', direction: 'input', type: 'data', width: 1, description: 'Master valid' },
      { id: 'm_ready', name: 'm_ready', direction: 'output', type: 'data', width: 1, description: 'Master ready' },
      { id: 'm_rdata', name: 'm_rdata', direction: 'output', type: 'bus', width: 32, description: 'Master read data' },
      { id: 's0_addr', name: 's0_addr', direction: 'output', type: 'bus', width: 32, description: 'Slave 0 address' },
      { id: 's0_valid', name: 's0_valid', direction: 'output', type: 'data', width: 1, description: 'Slave 0 valid' },
      { id: 's0_ready', name: 's0_ready', direction: 'input', type: 'data', width: 1, description: 'Slave 0 ready' },
      { id: 's0_rdata', name: 's0_rdata', direction: 'input', type: 'bus', width: 32, description: 'Slave 0 read data' },
      { id: 's1_addr', name: 's1_addr', direction: 'output', type: 'bus', width: 32, description: 'Slave 1 address' },
      { id: 's1_valid', name: 's1_valid', direction: 'output', type: 'data', width: 1, description: 'Slave 1 valid' },
      { id: 's1_ready', name: 's1_ready', direction: 'input', type: 'data', width: 1, description: 'Slave 1 ready' },
      { id: 's1_rdata', name: 's1_rdata', direction: 'input', type: 'bus', width: 32, description: 'Slave 1 read data' }
    ]
  },
  {
    id: 'wishbone_crossbar',
    name: 'Wishbone B4 Crossbar',
    category: 'interconnect',
    description: 'LiteX-compatible Wishbone crossbar interconnect with address decoding',
    defaultWidth: 240,
    defaultHeight: 280,
    parameters: [
      { name: 'S0_BASE_ADDR', type: 'integer', default: 0, description: 'Base address for Slave 0 (e.g. RAM 0x00000000)' },
      { name: 'S1_BASE_ADDR', type: 'integer', default: 268435456, description: 'Base address for Slave 1 (e.g. Peripherals 0x10000000)' }
    ],
    ports: [
      { id: 'clk', name: 'clk', direction: 'input', type: 'clock', width: 1, description: 'Interconnect clock' },
      { id: 'rst_n', name: 'rst_n', direction: 'input', type: 'reset', width: 1, description: 'Active-low reset' },
      { id: 'wb_cyc_i', name: 'wb_cyc_i', direction: 'input', type: 'data', width: 1, description: 'Master bus cycle valid' },
      { id: 'wb_stb_i', name: 'wb_stb_i', direction: 'input', type: 'data', width: 1, description: 'Master strobe valid' },
      { id: 'wb_we_i', name: 'wb_we_i', direction: 'input', type: 'data', width: 1, description: 'Master write enable' },
      { id: 'wb_adr_i', name: 'wb_adr_i', direction: 'input', type: 'bus', width: 32, description: 'Master address bus' },
      { id: 'wb_dat_i', name: 'wb_dat_i', direction: 'input', type: 'bus', width: 32, description: 'Master write data bus' },
      { id: 'wb_dat_o', name: 'wb_dat_o', direction: 'output', type: 'bus', width: 32, description: 'Master read data bus' },
      { id: 'wb_ack_o', name: 'wb_ack_o', direction: 'output', type: 'data', width: 1, description: 'Master acknowledge' },
      { id: 's0_cyc_o', name: 's0_cyc_o', direction: 'output', type: 'data', width: 1, description: 'Slave 0 cycle valid' },
      { id: 's0_stb_o', name: 's0_stb_o', direction: 'output', type: 'data', width: 1, description: 'Slave 0 strobe' },
      { id: 's0_adr_o', name: 's0_adr_o', direction: 'output', type: 'bus', width: 32, description: 'Slave 0 address bus' },
      { id: 's0_dat_o', name: 's0_dat_o', direction: 'output', type: 'bus', width: 32, description: 'Slave 0 write data' },
      { id: 's0_dat_i', name: 's0_dat_i', direction: 'input', type: 'bus', width: 32, description: 'Slave 0 read data' },
      { id: 's0_ack_i', name: 's0_ack_i', direction: 'input', type: 'data', width: 1, description: 'Slave 0 acknowledge' },
      { id: 's1_cyc_o', name: 's1_cyc_o', direction: 'output', type: 'data', width: 1, description: 'Slave 1 cycle valid' },
      { id: 's1_stb_o', name: 's1_stb_o', direction: 'output', type: 'data', width: 1, description: 'Slave 1 strobe' },
      { id: 's1_adr_o', name: 's1_adr_o', direction: 'output', type: 'bus', width: 32, description: 'Slave 1 address bus' },
      { id: 's1_dat_o', name: 's1_dat_o', direction: 'output', type: 'bus', width: 32, description: 'Slave 1 write data' },
      { id: 's1_dat_i', name: 's1_dat_i', direction: 'input', type: 'bus', width: 32, description: 'Slave 1 read data' },
      { id: 's1_ack_i', name: 's1_ack_i', direction: 'input', type: 'data', width: 1, description: 'Slave 1 acknowledge' }
    ]
  }
];
