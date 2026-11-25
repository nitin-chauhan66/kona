import { KonaModuleDef } from '../../ir.js';

export const INFRASTRUCTURE_MODULES: KonaModuleDef[] = [
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
