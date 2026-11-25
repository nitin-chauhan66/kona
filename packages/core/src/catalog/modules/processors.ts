import { KonaModuleDef } from '../../ir.js';

export const PROCESSOR_MODULES: KonaModuleDef[] = [
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
  }
];
