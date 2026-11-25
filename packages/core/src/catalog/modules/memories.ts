import { KonaModuleDef } from '../../ir.js';

export const MEMORY_MODULES: KonaModuleDef[] = [
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
  }
];
