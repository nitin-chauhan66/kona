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
  },
  {
    id: 'ibex',
    name: 'lowRISC Ibex RISC-V Core',
    category: 'processor',
    description: 'Silicon-proven 32-bit 2-stage RISC-V core (RV32IMC) used in OpenTitan Root-of-Trust',
    defaultWidth: 230,
    defaultHeight: 280,
    parameters: [
      { name: 'PMP_ENABLE', type: 'boolean', default: false, description: 'Enable Physical Memory Protection (PMP)' },
      { name: 'RV32M', type: 'boolean', default: true, description: 'Enable hardware multiplier and divider' },
      { name: 'RV32B', type: 'boolean', default: false, description: 'Enable Bitmanip (Zba, Zbb, Zbc, Zbs)' }
    ],
    ports: [
      { id: 'clk', name: 'clk', direction: 'input', type: 'clock', width: 1, description: 'Primary CPU clock' },
      { id: 'rst_n', name: 'rst_n', direction: 'input', type: 'reset', width: 1, description: 'Active-low reset' },
      { id: 'instr_req', name: 'instr_req', direction: 'output', type: 'data', width: 1, description: 'Instruction fetch request' },
      { id: 'instr_gnt', name: 'instr_gnt', direction: 'input', type: 'data', width: 1, description: 'Instruction memory grant' },
      { id: 'instr_rvalid', name: 'instr_rvalid', direction: 'input', type: 'data', width: 1, description: 'Instruction read valid' },
      { id: 'instr_addr', name: 'instr_addr', direction: 'output', type: 'bus', width: 32, description: 'Instruction fetch address' },
      { id: 'instr_rdata', name: 'instr_rdata', direction: 'input', type: 'bus', width: 32, description: 'Instruction read data' },
      { id: 'data_req', name: 'data_req', direction: 'output', type: 'data', width: 1, description: 'Data memory transaction request' },
      { id: 'data_gnt', name: 'data_gnt', direction: 'input', type: 'data', width: 1, description: 'Data memory bus grant' },
      { id: 'data_rvalid', name: 'data_rvalid', direction: 'input', type: 'data', width: 1, description: 'Data read response valid' },
      { id: 'data_we', name: 'data_we', direction: 'output', type: 'data', width: 1, description: 'Data write enable' },
      { id: 'data_addr', name: 'data_addr', direction: 'output', type: 'bus', width: 32, description: 'Data memory address' },
      { id: 'data_wdata', name: 'data_wdata', direction: 'output', type: 'bus', width: 32, description: 'Data write payload' },
      { id: 'data_rdata', name: 'data_rdata', direction: 'input', type: 'bus', width: 32, description: 'Data read payload' },
      { id: 'irq_software', name: 'irq_software', direction: 'input', type: 'data', width: 1, description: 'Software interrupt line' },
      { id: 'irq_timer', name: 'irq_timer', direction: 'input', type: 'data', width: 1, description: 'Machine timer interrupt line' },
      { id: 'irq_external', name: 'irq_external', direction: 'input', type: 'data', width: 1, description: 'External PLIC interrupt line' }
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
  },
  {
    id: 'spi_controller',
    name: 'SPI Master Controller',
    category: 'peripheral',
    description: 'Motorola SPI master transceiver for Flash memory and external sensor buses',
    defaultWidth: 210,
    defaultHeight: 240,
    parameters: [
      { name: 'CLK_DIV', type: 'integer', default: 8, description: 'Baud clock division factor' },
      { name: 'DATA_WIDTH', type: 'integer', default: 8, description: 'SPI word transfer width' }
    ],
    ports: [
      { id: 'clk', name: 'clk', direction: 'input', type: 'clock', width: 1, description: 'System clock' },
      { id: 'rst_n', name: 'rst_n', direction: 'input', type: 'reset', width: 1, description: 'Active-low reset' },
      { id: 'tx_data', name: 'tx_data', direction: 'input', type: 'bus', width: 8, description: 'TX byte to transmit' },
      { id: 'tx_valid', name: 'tx_valid', direction: 'input', type: 'data', width: 1, description: 'TX data valid strobe' },
      { id: 'tx_ready', name: 'tx_ready', direction: 'output', type: 'data', width: 1, description: 'SPI transmitter ready' },
      { id: 'rx_data', name: 'rx_data', direction: 'output', type: 'bus', width: 8, description: 'Received RX byte' },
      { id: 'rx_valid', name: 'rx_valid', direction: 'output', type: 'data', width: 1, description: 'RX data valid strobe' },
      { id: 'spi_sclk', name: 'spi_sclk', direction: 'output', type: 'clock', width: 1, description: 'SPI serial clock output' },
      { id: 'spi_cs_n', name: 'spi_cs_n', direction: 'output', type: 'data', width: 1, description: 'Active-low chip select' },
      { id: 'spi_mosi', name: 'spi_mosi', direction: 'output', type: 'data', width: 1, description: 'Master Out Slave In pin' },
      { id: 'spi_miso', name: 'spi_miso', direction: 'input', type: 'data', width: 1, description: 'Master In Slave Out pin' }
    ]
  },
  {
    id: 'i2c_controller',
    name: 'I2C Master Controller',
    category: 'peripheral',
    description: 'Standard 100k/400k I2C bus controller for PMICs, temperature sensors, and EEPROMs',
    defaultWidth: 200,
    defaultHeight: 240,
    parameters: [
      { name: 'PRESCALE', type: 'integer', default: 125, description: 'Prescale divider for 100kHz standard mode' }
    ],
    ports: [
      { id: 'clk', name: 'clk', direction: 'input', type: 'clock', width: 1, description: 'System clock' },
      { id: 'rst_n', name: 'rst_n', direction: 'input', type: 'reset', width: 1, description: 'Active-low reset' },
      { id: 'addr', name: 'addr', direction: 'input', type: 'bus', width: 8, description: '7-bit target slave address' },
      { id: 'din', name: 'din', direction: 'input', type: 'bus', width: 8, description: 'Write payload byte' },
      { id: 'start', name: 'start', direction: 'input', type: 'data', width: 1, description: 'Initiate transaction strobe' },
      { id: 'busy', name: 'busy', direction: 'output', type: 'data', width: 1, description: 'I2C bus active/busy' },
      { id: 'dout', name: 'dout', direction: 'output', type: 'bus', width: 8, description: 'Read payload byte' },
      { id: 'ack_err', name: 'ack_err', direction: 'output', type: 'data', width: 1, description: 'NACK acknowledgment error' },
      { id: 'scl', name: 'scl', direction: 'output', type: 'clock', width: 1, description: 'I2C serial clock pin' },
      { id: 'sda_out', name: 'sda_out', direction: 'output', type: 'data', width: 1, description: 'I2C serial data output' },
      { id: 'sda_in', name: 'sda_in', direction: 'input', type: 'data', width: 1, description: 'I2C serial data input' }
    ]
  },
  {
    id: 'timer_core',
    name: '32-bit System Timer & Watchdog',
    category: 'peripheral',
    description: 'Hardware timer with compare register generating periodic ticks and watchdog reset interrupts',
    defaultWidth: 200,
    defaultHeight: 220,
    parameters: [
      { name: 'PRESCALER', type: 'integer', default: 50, description: 'Timer tick prescaler divisor' }
    ],
    ports: [
      { id: 'clk', name: 'clk', direction: 'input', type: 'clock', width: 1, description: 'System clock' },
      { id: 'rst_n', name: 'rst_n', direction: 'input', type: 'reset', width: 1, description: 'Active-low reset' },
      { id: 'addr', name: 'addr', direction: 'input', type: 'bus', width: 32, description: 'Register address bus' },
      { id: 'wdata', name: 'wdata', direction: 'input', type: 'bus', width: 32, description: 'Register write data' },
      { id: 'we', name: 'we', direction: 'input', type: 'data', width: 1, description: 'Write strobe' },
      { id: 'rdata', name: 'rdata', direction: 'output', type: 'bus', width: 32, description: 'Register read data' },
      { id: 'irq', name: 'irq', direction: 'output', type: 'data', width: 1, description: 'Timer compare interrupt pulse' }
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
    id: 'sensor_hub',
    name: 'TinyFPGA BX Industrial Sensor Hub & Telemetry Engine',
    description: 'Real-world FPGA sensor fusion pipeline with hardware clock divider, I2C telemetry master, FIFO queue buffer, GPIO indicator pads, and UART downlink',
    createDesign: (): KonaDesign => ({
      version: '1.0',
      name: 'Industrial Sensor Hub',
      topModule: 'top',
      metadata: {
        version: '1.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        description: 'FPGA sensor hub pipeline with I2C master, synchronous FIFO telemetry queue, GPIO pads, and UART downlink'
      },
      instances: [
        {
          id: 'master_clk',
          moduleId: 'clock_gen',
          name: 'u_clk_gen',
          position: { x: 60, y: 140 },
          parameters: { FREQ_MHZ: 50 }
        },
        {
          id: 'clk_div',
          moduleId: 'clock_divider',
          name: 'u_clk_div',
          position: { x: 320, y: 140 },
          parameters: { DIVISOR: 4 }
        },
        {
          id: 'i2c_sensor',
          moduleId: 'i2c_controller',
          name: 'u_i2c_sensor',
          position: { x: 320, y: 380 },
          parameters: { PRESCALE: 125 }
        },
        {
          id: 'telem_fifo',
          moduleId: 'sync_fifo',
          name: 'u_telem_fifo',
          position: { x: 660, y: 360 },
          parameters: { WIDTH: 8, DEPTH: 32 }
        },
        {
          id: 'uart_downlink',
          moduleId: 'uart_core',
          name: 'u_uart_downlink',
          position: { x: 1000, y: 340 },
          parameters: { BAUD_DIVISOR: 434 }
        },
        {
          id: 'status_gpio',
          moduleId: 'gpio_controller',
          name: 'u_status_gpio',
          position: { x: 1000, y: 100 },
          parameters: { WIDTH: 8 }
        }
      ],
      nets: [
        {
          id: 'net_mclk',
          name: 'clk',
          width: 1,
          source: { instanceId: 'master_clk', portId: 'clk_out' },
          targets: [
            { instanceId: 'clk_div', portId: 'clk_in' },
            { instanceId: 'telem_fifo', portId: 'clk' },
            { instanceId: 'uart_downlink', portId: 'clk' },
            { instanceId: 'status_gpio', portId: 'clk' }
          ]
        },
        {
          id: 'net_mrst',
          name: 'rst_n',
          width: 1,
          source: { instanceId: 'master_clk', portId: 'rst_n_out' },
          targets: [
            { instanceId: 'clk_div', portId: 'rst_n' },
            { instanceId: 'i2c_sensor', portId: 'rst_n' },
            { instanceId: 'telem_fifo', portId: 'rst_n' },
            { instanceId: 'uart_downlink', portId: 'rst_n' },
            { instanceId: 'status_gpio', portId: 'rst_n' }
          ]
        },
        {
          id: 'net_div_clk',
          name: 'divided_clk',
          width: 1,
          source: { instanceId: 'clk_div', portId: 'clk_out' },
          targets: [{ instanceId: 'i2c_sensor', portId: 'clk' }]
        },
        {
          id: 'net_sensor_data',
          name: 'sensor_dout_to_fifo',
          width: 8,
          source: { instanceId: 'i2c_sensor', portId: 'dout' },
          targets: [{ instanceId: 'telem_fifo', portId: 'din' }]
        },
        {
          id: 'net_sensor_busy_wr',
          name: 'sensor_busy_to_wr',
          width: 1,
          source: { instanceId: 'i2c_sensor', portId: 'busy' },
          targets: [{ instanceId: 'telem_fifo', portId: 'wr_en' }]
        },
        {
          id: 'net_fifo_dout',
          name: 'fifo_data_bus',
          width: 8,
          source: { instanceId: 'telem_fifo', portId: 'dout' },
          targets: [
            { instanceId: 'uart_downlink', portId: 'tx_data' },
            { instanceId: 'status_gpio', portId: 'out_val' }
          ]
        },
        {
          id: 'net_fifo_empty_to_tx_valid',
          name: 'fifo_not_empty_strobe',
          width: 1,
          source: { instanceId: 'telem_fifo', portId: 'empty' },
          targets: [{ instanceId: 'uart_downlink', portId: 'tx_valid' }]
        }
      ]
    })
  }
];
