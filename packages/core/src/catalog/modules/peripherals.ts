import { KonaModuleDef } from '../../ir.js';

export const PERIPHERAL_MODULES: KonaModuleDef[] = [
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
