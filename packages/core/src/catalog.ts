/**
 * Starter IP & Template Library (FR-1.3)
 *
 * Curated, parameterized open-source blocks with parameter definitions
 * and pre-wired architecture starter templates.
 */

import { KonaDesign, KonaModuleDef } from './ir.js';

export const STARTER_IP_CATALOG: KonaModuleDef[] = [
  {
    id: 'picorv32',
    name: 'PicoRV32 RISC-V Core',
    category: 'processor',
    description: 'Size-optimized RISC-V RV32IMC CPU core with native memory interface',
    defaultWidth: 220,
    defaultHeight: 260,
    parameters: [
      { name: 'ENABLE_COUNTERS', type: 'boolean', default: true, description: 'Enable cycle/instret 64-bit performance counters' },
      { name: 'ENABLE_MUL', type: 'boolean', default: true, description: 'Enable RV32M hardware multiplier' },
      { name: 'ENABLE_DIV', type: 'boolean', default: true, description: 'Enable RV32M hardware divider' },
      { name: 'BARREL_SHIFTER', type: 'boolean', default: true, description: 'Enable fast multi-stage barrel shifter' },
      { name: 'STACKADDR', type: 'integer', default: 65536, description: 'Initial stack pointer address (0x10000)' }
    ],
    ports: [
      { id: 'clk', name: 'clk', direction: 'input', type: 'clock', width: 1, description: 'Core system clock' },
      { id: 'resetn', name: 'resetn', direction: 'input', type: 'reset', width: 1, description: 'Active-low synchronous reset' },
      { id: 'mem_valid', name: 'mem_valid', direction: 'output', type: 'data', width: 1, description: 'Memory request valid' },
      { id: 'mem_instr', name: 'mem_instr', direction: 'output', type: 'data', width: 1, description: 'Instruction fetch indicator' },
      { id: 'mem_ready', name: 'mem_ready', direction: 'input', type: 'data', width: 1, description: 'Memory transaction ready' },
      { id: 'mem_addr', name: 'mem_addr', direction: 'output', type: 'bus', width: 32, description: 'Memory address bus' },
      { id: 'mem_wdata', name: 'mem_wdata', direction: 'output', type: 'bus', width: 32, description: 'Write data bus' },
      { id: 'mem_wstrb', name: 'mem_wstrb', direction: 'output', type: 'bus', width: 4, description: 'Byte write strobe' },
      { id: 'mem_rdata', name: 'mem_rdata', direction: 'input', type: 'bus', width: 32, description: 'Read data bus' },
      { id: 'trap', name: 'trap', direction: 'output', type: 'data', width: 1, description: 'CPU trap on illegal instruction or fault' }
    ]
  },
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
      // Master port
      { id: 'm_addr', name: 'm_addr', direction: 'input', type: 'bus', width: 32, description: 'Master request address' },
      { id: 'm_valid', name: 'm_valid', direction: 'input', type: 'data', width: 1, description: 'Master valid' },
      { id: 'm_ready', name: 'm_ready', direction: 'output', type: 'data', width: 1, description: 'Master ready' },
      { id: 'm_rdata', name: 'm_rdata', direction: 'output', type: 'bus', width: 32, description: 'Master read data' },
      // Slave 0 (RAM)
      { id: 's0_addr', name: 's0_addr', direction: 'output', type: 'bus', width: 32, description: 'Slave 0 address' },
      { id: 's0_valid', name: 's0_valid', direction: 'output', type: 'data', width: 1, description: 'Slave 0 valid' },
      { id: 's0_ready', name: 's0_ready', direction: 'input', type: 'data', width: 1, description: 'Slave 0 ready' },
      { id: 's0_rdata', name: 's0_rdata', direction: 'input', type: 'bus', width: 32, description: 'Slave 0 read data' },
      // Slave 1 (Peripherals)
      { id: 's1_addr', name: 's1_addr', direction: 'output', type: 'bus', width: 32, description: 'Slave 1 address' },
      { id: 's1_valid', name: 's1_valid', direction: 'output', type: 'data', width: 1, description: 'Slave 1 valid' },
      { id: 's1_ready', name: 's1_ready', direction: 'input', type: 'data', width: 1, description: 'Slave 1 ready' },
      { id: 's1_rdata', name: 's1_rdata', direction: 'input', type: 'bus', width: 32, description: 'Slave 1 read data' }
    ]
  },
  {
    id: 'ram_dual_port',
    name: 'Block RAM (Dual-Port)',
    category: 'memory',
    description: 'Synchronous dual-port SRAM with configurable data width and address depth',
    defaultWidth: 200,
    defaultHeight: 220,
    parameters: [
      { name: 'ADDR_WIDTH', type: 'integer', default: 14, description: 'Address width (14-bit = 16K words)' },
      { name: 'DATA_WIDTH', type: 'integer', default: 32, description: 'Data bus width (32-bit)' }
    ],
    ports: [
      { id: 'clk', name: 'clk', direction: 'input', type: 'clock', width: 1, description: 'Memory clock' },
      { id: 'en', name: 'en', direction: 'input', type: 'data', width: 1, description: 'Port enable' },
      { id: 'we', name: 'we', direction: 'input', type: 'data', width: 1, description: 'Write enable' },
      { id: 'addr', name: 'addr', direction: 'input', type: 'bus', width: 32, description: 'Memory address' },
      { id: 'din', name: 'din', direction: 'input', type: 'bus', width: 32, description: 'Write data' },
      { id: 'dout', name: 'dout', direction: 'output', type: 'bus', width: 32, description: 'Read data output' }
    ]
  },
  {
    id: 'uart_core',
    name: 'UART Transceiver',
    category: 'peripheral',
    description: 'Universal Asynchronous Receiver/Transmitter with configurable baud rate divisor',
    defaultWidth: 200,
    defaultHeight: 220,
    parameters: [
      { name: 'BAUD_DIVISOR', type: 'integer', default: 434, description: 'Clock cycles per baud (50MHz / 115200 = 434)' }
    ],
    ports: [
      { id: 'clk', name: 'clk', direction: 'input', type: 'clock', width: 1, description: 'System clock' },
      { id: 'rst_n', name: 'rst_n', direction: 'input', type: 'reset', width: 1, description: 'Active-low reset' },
      { id: 'rx', name: 'rx', direction: 'input', type: 'data', width: 1, description: 'Serial RX pin' },
      { id: 'tx', name: 'tx', direction: 'output', type: 'data', width: 1, description: 'Serial TX pin' },
      { id: 'tx_data', name: 'tx_data', direction: 'input', type: 'bus', width: 8, description: 'TX byte to transmit' },
      { id: 'tx_valid', name: 'tx_valid', direction: 'input', type: 'data', width: 1, description: 'TX byte valid strobe' },
      { id: 'tx_busy', name: 'tx_busy', direction: 'output', type: 'data', width: 1, description: 'Transmitter busy' },
      { id: 'rx_data', name: 'rx_data', direction: 'output', type: 'bus', width: 8, description: 'Received RX byte' },
      { id: 'rx_valid', name: 'rx_valid', direction: 'output', type: 'data', width: 1, description: 'RX byte valid strobe' }
    ]
  },
  {
    id: 'gpio_controller',
    name: 'GPIO Controller',
    category: 'peripheral',
    description: 'Bi-directional General Purpose I/O bank with output enable masks',
    defaultWidth: 190,
    defaultHeight: 200,
    parameters: [
      { name: 'WIDTH', type: 'integer', default: 8, description: 'Number of GPIO pins' }
    ],
    ports: [
      { id: 'clk', name: 'clk', direction: 'input', type: 'clock', width: 1, description: 'System clock' },
      { id: 'rst_n', name: 'rst_n', direction: 'input', type: 'reset', width: 1, description: 'Active-low reset' },
      { id: 'out_val', name: 'out_val', direction: 'input', type: 'bus', width: 8, description: 'Internal output value' },
      { id: 'in_val', name: 'in_val', direction: 'output', type: 'bus', width: 8, description: 'Synchronized input value' },
      { id: 'gpio_pins', name: 'gpio_pins', direction: 'inout', type: 'bus', width: 8, description: 'Physical external chip pads' }
    ]
  },
  {
    id: 'sync_fifo',
    name: 'Synchronous FIFO',
    category: 'infrastructure',
    description: 'First-In First-Out buffer with configurable word width and queue depth',
    defaultWidth: 190,
    defaultHeight: 200,
    parameters: [
      { name: 'WIDTH', type: 'integer', default: 32, description: 'Data word width' },
      { name: 'DEPTH', type: 'integer', default: 16, description: 'FIFO depth (must be power of 2)' }
    ],
    ports: [
      { id: 'clk', name: 'clk', direction: 'input', type: 'clock', width: 1, description: 'Clock signal' },
      { id: 'rst_n', name: 'rst_n', direction: 'input', type: 'reset', width: 1, description: 'Active-low reset' },
      { id: 'wr_en', name: 'wr_en', direction: 'input', type: 'data', width: 1, description: 'Push write enable' },
      { id: 'din', name: 'din', direction: 'input', type: 'bus', width: 32, description: 'Write data input' },
      { id: 'full', name: 'full', direction: 'output', type: 'data', width: 1, description: 'FIFO full flag' },
      { id: 'rd_en', name: 'rd_en', direction: 'input', type: 'data', width: 1, description: 'Pop read enable' },
      { id: 'dout', name: 'dout', direction: 'output', type: 'bus', width: 32, description: 'Read data output' },
      { id: 'empty', name: 'empty', direction: 'output', type: 'data', width: 1, description: 'FIFO empty flag' }
    ]
  },
  {
    id: 'clock_divider',
    name: 'Clock Divider',
    category: 'infrastructure',
    description: 'Parameterized integer clock divider generating clean 50% duty cycle sub-clocks',
    defaultWidth: 180,
    defaultHeight: 180,
    parameters: [
      { name: 'DIVISOR', type: 'integer', default: 4, description: 'Clock division factor (even integer >= 2)' }
    ],
    ports: [
      { id: 'clk_in', name: 'clk_in', direction: 'input', type: 'clock', width: 1, description: 'High frequency input clock' },
      { id: 'rst_n', name: 'rst_n', direction: 'input', type: 'reset', width: 1, description: 'Active-low reset' },
      { id: 'clk_out', name: 'clk_out', direction: 'output', type: 'clock', width: 1, description: 'Divided output clock' }
    ]
  },
  {
    id: 'clock_gen',
    name: 'System Clock & Reset',
    category: 'infrastructure',
    description: 'Primary board oscillator and power-on reset generator',
    defaultWidth: 180,
    defaultHeight: 160,
    parameters: [
      { name: 'FREQ_MHZ', type: 'integer', default: 50, description: 'Master frequency in MHz' }
    ],
    ports: [
      { id: 'clk_out', name: 'clk_out', direction: 'output', type: 'clock', width: 1, description: 'Master system clock' },
      { id: 'rst_n_out', name: 'rst_n_out', direction: 'output', type: 'reset', width: 1, description: 'Power-on active-low reset' }
    ]
  }
];

export function getModuleDef(moduleId: string): KonaModuleDef | undefined {
  return STARTER_IP_CATALOG.find(m => m.id === moduleId);
}

/**
 * Pre-wired Starter Templates for 1-click architecture bootstrapping.
 */
export const STARTER_TEMPLATES: { id: string; name: string; description: string; createDesign: () => KonaDesign }[] = [
  {
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
  },
  {
    id: 'uart_loopback',
    name: 'UART + FIFO Loopback Processor',
    description: 'UART receiver feeding a FIFO queue connected to GPIO indicators and UART transmitter',
    createDesign: (): KonaDesign => ({
      version: '1.0',
      name: 'UART FIFO Loopback',
      topModule: 'top',
      metadata: {
        version: '1.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        description: 'UART Loopback with Synchronous FIFO buffer'
      },
      instances: [
        {
          id: 'clk_gen_0',
          moduleId: 'clock_gen',
          name: 'u_clk',
          position: { x: 80, y: 150 },
          parameters: { FREQ_MHZ: 50 }
        },
        {
          id: 'uart_inst',
          moduleId: 'uart_core',
          name: 'u_uart',
          position: { x: 360, y: 120 },
          parameters: { BAUD_DIVISOR: 434 }
        },
        {
          id: 'fifo_inst',
          moduleId: 'sync_fifo',
          name: 'u_fifo',
          position: { x: 680, y: 120 },
          parameters: { WIDTH: 8, DEPTH: 16 }
        },
        {
          id: 'gpio_inst',
          moduleId: 'gpio_controller',
          name: 'u_gpio',
          position: { x: 980, y: 140 },
          parameters: { WIDTH: 8 }
        }
      ],
      nets: [
        {
          id: 'clk_net',
          name: 'clk',
          width: 1,
          source: { instanceId: 'clk_gen_0', portId: 'clk_out' },
          targets: [
            { instanceId: 'uart_inst', portId: 'clk' },
            { instanceId: 'fifo_inst', portId: 'clk' },
            { instanceId: 'gpio_inst', portId: 'clk' }
          ]
        },
        {
          id: 'rst_net',
          name: 'rst_n',
          width: 1,
          source: { instanceId: 'clk_gen_0', portId: 'rst_n_out' },
          targets: [
            { instanceId: 'uart_inst', portId: 'rst_n' },
            { instanceId: 'fifo_inst', portId: 'rst_n' },
            { instanceId: 'gpio_inst', portId: 'rst_n' }
          ]
        },
        {
          id: 'net_rx_valid_wr_en',
          name: 'rx_to_fifo_wr',
          width: 1,
          source: { instanceId: 'uart_inst', portId: 'rx_valid' },
          targets: [{ instanceId: 'fifo_inst', portId: 'wr_en' }]
        },
        {
          id: 'net_rx_data_din',
          name: 'rx_to_fifo_data',
          width: 8,
          source: { instanceId: 'uart_inst', portId: 'rx_data' },
          targets: [{ instanceId: 'fifo_inst', portId: 'din' }]
        },
        {
          id: 'net_fifo_dout_gpio',
          name: 'fifo_data_to_gpio',
          width: 8,
          source: { instanceId: 'fifo_inst', portId: 'dout' },
          targets: [{ instanceId: 'gpio_inst', portId: 'out_val' }]
        }
      ]
    })
  }
];
