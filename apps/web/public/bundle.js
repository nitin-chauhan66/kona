var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// packages/core/dist/ir.js
var require_ir = __commonJS({
  "packages/core/dist/ir.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateKonaDesignSchema = validateKonaDesignSchema;
    exports.serializeKonaDesign = serializeKonaDesign2;
    exports.parseKonaDesign = parseKonaDesign2;
    function validateKonaDesignSchema(design) {
      const errors = [];
      if (!design || typeof design !== "object") {
        return ["Design root must be an object"];
      }
      const d = design;
      if (d.version !== "1.0") {
        errors.push(`Invalid version: expected '1.0', got '${d.version}'`);
      }
      if (!d.name || typeof d.name !== "string") {
        errors.push('Design must have a valid string "name"');
      }
      if (!d.topModule || typeof d.topModule !== "string") {
        errors.push('Design must have a valid string "topModule"');
      }
      if (!Array.isArray(d.instances)) {
        errors.push('Design "instances" must be an array');
      } else {
        const instIds = /* @__PURE__ */ new Set();
        for (let i = 0; i < d.instances.length; i++) {
          const inst = d.instances[i];
          if (!inst.id || typeof inst.id !== "string") {
            errors.push(`Instance #${i} must have a valid string "id"`);
          } else if (instIds.has(inst.id)) {
            errors.push(`Duplicate instance id "${inst.id}" at index ${i}`);
          } else {
            instIds.add(inst.id);
          }
          if (!inst.moduleId || typeof inst.moduleId !== "string") {
            errors.push(`Instance "${inst.id || i}" missing "moduleId"`);
          }
          if (!inst.position || typeof inst.position.x !== "number" || typeof inst.position.y !== "number") {
            errors.push(`Instance "${inst.id || i}" missing valid position {x, y}`);
          }
        }
      }
      if (!Array.isArray(d.nets)) {
        errors.push('Design "nets" must be an array');
      } else {
        const netIds = /* @__PURE__ */ new Set();
        for (let i = 0; i < d.nets.length; i++) {
          const net = d.nets[i];
          if (!net.id || typeof net.id !== "string") {
            errors.push(`Net #${i} must have a valid string "id"`);
          } else if (netIds.has(net.id)) {
            errors.push(`Duplicate net id "${net.id}" at index ${i}`);
          } else {
            netIds.add(net.id);
          }
          if (typeof net.width !== "number" || net.width < 1) {
            errors.push(`Net "${net.id || i}" must have a positive number "width"`);
          }
          if (!Array.isArray(net.targets)) {
            errors.push(`Net "${net.id || i}" "targets" must be an array`);
          }
        }
      }
      return errors;
    }
    function serializeKonaDesign2(design) {
      const sortedInstances = [...design.instances].sort((a, b) => a.id.localeCompare(b.id));
      const sortedNets = [...design.nets].sort((a, b) => a.id.localeCompare(b.id));
      const sortedDesign = {
        version: design.version,
        name: design.name,
        topModule: design.topModule,
        instances: sortedInstances.map((inst) => ({
          id: inst.id,
          moduleId: inst.moduleId,
          name: inst.name,
          position: { x: Math.round(inst.position.x), y: Math.round(inst.position.y) },
          parameters: Object.keys(inst.parameters).sort().reduce((acc, k) => {
            acc[k] = inst.parameters[k];
            return acc;
          }, {})
        })),
        nets: sortedNets.map((net) => ({
          id: net.id,
          name: net.name,
          width: net.width,
          ...net.source ? { source: { instanceId: net.source.instanceId, portId: net.source.portId } } : {},
          targets: [...net.targets].sort((a, b) => (a.instanceId + a.portId).localeCompare(b.instanceId + b.portId))
        })),
        metadata: {
          ...design.metadata,
          version: design.metadata.version || "1.0"
        }
      };
      return JSON.stringify(sortedDesign, null, 2);
    }
    function parseKonaDesign2(jsonString) {
      try {
        const raw = JSON.parse(jsonString);
        const errors = validateKonaDesignSchema(raw);
        if (errors.length > 0) {
          return { errors };
        }
        return { design: raw, errors: [] };
      } catch (err) {
        return { errors: [`JSON Parse error: ${err.message}`] };
      }
    }
  }
});

// packages/core/dist/catalog.js
var require_catalog = __commonJS({
  "packages/core/dist/catalog.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.STARTER_TEMPLATES = exports.STARTER_IP_CATALOG = void 0;
    exports.getModuleDef = getModuleDef3;
    exports.STARTER_IP_CATALOG = [
      {
        id: "picorv32",
        name: "PicoRV32 RISC-V Core",
        category: "processor",
        description: "Size-optimized RISC-V RV32IMC CPU core with native memory interface",
        defaultWidth: 220,
        defaultHeight: 260,
        parameters: [
          { name: "ENABLE_COUNTERS", type: "boolean", default: true, description: "Enable cycle/instret 64-bit performance counters" },
          { name: "ENABLE_MUL", type: "boolean", default: true, description: "Enable RV32M hardware multiplier" },
          { name: "ENABLE_DIV", type: "boolean", default: true, description: "Enable RV32M hardware divider" },
          { name: "BARREL_SHIFTER", type: "boolean", default: true, description: "Enable fast multi-stage barrel shifter" },
          { name: "STACKADDR", type: "integer", default: 65536, description: "Initial stack pointer address (0x10000)" }
        ],
        ports: [
          { id: "clk", name: "clk", direction: "input", type: "clock", width: 1, description: "Core system clock" },
          { id: "resetn", name: "resetn", direction: "input", type: "reset", width: 1, description: "Active-low synchronous reset" },
          { id: "mem_valid", name: "mem_valid", direction: "output", type: "data", width: 1, description: "Memory request valid" },
          { id: "mem_instr", name: "mem_instr", direction: "output", type: "data", width: 1, description: "Instruction fetch indicator" },
          { id: "mem_ready", name: "mem_ready", direction: "input", type: "data", width: 1, description: "Memory transaction ready" },
          { id: "mem_addr", name: "mem_addr", direction: "output", type: "bus", width: 32, description: "Memory address bus" },
          { id: "mem_wdata", name: "mem_wdata", direction: "output", type: "bus", width: 32, description: "Write data bus" },
          { id: "mem_wstrb", name: "mem_wstrb", direction: "output", type: "bus", width: 4, description: "Byte write strobe" },
          { id: "mem_rdata", name: "mem_rdata", direction: "input", type: "bus", width: 32, description: "Read data bus" },
          { id: "trap", name: "trap", direction: "output", type: "data", width: 1, description: "CPU trap on illegal instruction or fault" }
        ]
      },
      {
        id: "axi_crossbar",
        name: "AXI-Lite Interconnect",
        category: "interconnect",
        description: "1-Master to 2-Slave AXI4-Lite crossbar with memory-mapped address routing",
        defaultWidth: 240,
        defaultHeight: 280,
        parameters: [
          { name: "S0_BASE_ADDR", type: "integer", default: 0, description: "Base address for Slave 0 (e.g. RAM 0x00000000)" },
          { name: "S0_ADDR_MASK", type: "integer", default: 65535, description: "Address mask for Slave 0 (64KB)" },
          { name: "S1_BASE_ADDR", type: "integer", default: 268435456, description: "Base address for Slave 1 (e.g. Peripherals 0x10000000)" },
          { name: "S1_ADDR_MASK", type: "integer", default: 65535, description: "Address mask for Slave 1 (64KB)" }
        ],
        ports: [
          { id: "clk", name: "clk", direction: "input", type: "clock", width: 1, description: "Interconnect clock" },
          { id: "rst_n", name: "rst_n", direction: "input", type: "reset", width: 1, description: "Active-low reset" },
          // Master port
          { id: "m_addr", name: "m_addr", direction: "input", type: "bus", width: 32, description: "Master request address" },
          { id: "m_valid", name: "m_valid", direction: "input", type: "data", width: 1, description: "Master valid" },
          { id: "m_ready", name: "m_ready", direction: "output", type: "data", width: 1, description: "Master ready" },
          { id: "m_rdata", name: "m_rdata", direction: "output", type: "bus", width: 32, description: "Master read data" },
          // Slave 0 (RAM)
          { id: "s0_addr", name: "s0_addr", direction: "output", type: "bus", width: 32, description: "Slave 0 address" },
          { id: "s0_valid", name: "s0_valid", direction: "output", type: "data", width: 1, description: "Slave 0 valid" },
          { id: "s0_ready", name: "s0_ready", direction: "input", type: "data", width: 1, description: "Slave 0 ready" },
          { id: "s0_rdata", name: "s0_rdata", direction: "input", type: "bus", width: 32, description: "Slave 0 read data" },
          // Slave 1 (Peripherals)
          { id: "s1_addr", name: "s1_addr", direction: "output", type: "bus", width: 32, description: "Slave 1 address" },
          { id: "s1_valid", name: "s1_valid", direction: "output", type: "data", width: 1, description: "Slave 1 valid" },
          { id: "s1_ready", name: "s1_ready", direction: "input", type: "data", width: 1, description: "Slave 1 ready" },
          { id: "s1_rdata", name: "s1_rdata", direction: "input", type: "bus", width: 32, description: "Slave 1 read data" }
        ]
      },
      {
        id: "ram_dual_port",
        name: "Block RAM (Dual-Port)",
        category: "memory",
        description: "Synchronous dual-port SRAM with configurable data width and address depth",
        defaultWidth: 200,
        defaultHeight: 220,
        parameters: [
          { name: "ADDR_WIDTH", type: "integer", default: 14, description: "Address width (14-bit = 16K words)" },
          { name: "DATA_WIDTH", type: "integer", default: 32, description: "Data bus width (32-bit)" }
        ],
        ports: [
          { id: "clk", name: "clk", direction: "input", type: "clock", width: 1, description: "Memory clock" },
          { id: "en", name: "en", direction: "input", type: "data", width: 1, description: "Port enable" },
          { id: "we", name: "we", direction: "input", type: "data", width: 1, description: "Write enable" },
          { id: "addr", name: "addr", direction: "input", type: "bus", width: 32, description: "Memory address" },
          { id: "din", name: "din", direction: "input", type: "bus", width: 32, description: "Write data" },
          { id: "dout", name: "dout", direction: "output", type: "bus", width: 32, description: "Read data output" }
        ]
      },
      {
        id: "uart_core",
        name: "UART Transceiver",
        category: "peripheral",
        description: "Universal Asynchronous Receiver/Transmitter with configurable baud rate divisor",
        defaultWidth: 200,
        defaultHeight: 220,
        parameters: [
          { name: "BAUD_DIVISOR", type: "integer", default: 434, description: "Clock cycles per baud (50MHz / 115200 = 434)" }
        ],
        ports: [
          { id: "clk", name: "clk", direction: "input", type: "clock", width: 1, description: "System clock" },
          { id: "rst_n", name: "rst_n", direction: "input", type: "reset", width: 1, description: "Active-low reset" },
          { id: "rx", name: "rx", direction: "input", type: "data", width: 1, description: "Serial RX pin" },
          { id: "tx", name: "tx", direction: "output", type: "data", width: 1, description: "Serial TX pin" },
          { id: "tx_data", name: "tx_data", direction: "input", type: "bus", width: 8, description: "TX byte to transmit" },
          { id: "tx_valid", name: "tx_valid", direction: "input", type: "data", width: 1, description: "TX byte valid strobe" },
          { id: "tx_busy", name: "tx_busy", direction: "output", type: "data", width: 1, description: "Transmitter busy" },
          { id: "rx_data", name: "rx_data", direction: "output", type: "bus", width: 8, description: "Received RX byte" },
          { id: "rx_valid", name: "rx_valid", direction: "output", type: "data", width: 1, description: "RX byte valid strobe" }
        ]
      },
      {
        id: "gpio_controller",
        name: "GPIO Controller",
        category: "peripheral",
        description: "Bi-directional General Purpose I/O bank with output enable masks",
        defaultWidth: 190,
        defaultHeight: 200,
        parameters: [
          { name: "WIDTH", type: "integer", default: 8, description: "Number of GPIO pins" }
        ],
        ports: [
          { id: "clk", name: "clk", direction: "input", type: "clock", width: 1, description: "System clock" },
          { id: "rst_n", name: "rst_n", direction: "input", type: "reset", width: 1, description: "Active-low reset" },
          { id: "out_val", name: "out_val", direction: "input", type: "bus", width: 8, description: "Internal output value" },
          { id: "in_val", name: "in_val", direction: "output", type: "bus", width: 8, description: "Synchronized input value" },
          { id: "gpio_pins", name: "gpio_pins", direction: "inout", type: "bus", width: 8, description: "Physical external chip pads" }
        ]
      },
      {
        id: "sync_fifo",
        name: "Synchronous FIFO",
        category: "infrastructure",
        description: "First-In First-Out buffer with configurable word width and queue depth",
        defaultWidth: 190,
        defaultHeight: 200,
        parameters: [
          { name: "WIDTH", type: "integer", default: 32, description: "Data word width" },
          { name: "DEPTH", type: "integer", default: 16, description: "FIFO depth (must be power of 2)" }
        ],
        ports: [
          { id: "clk", name: "clk", direction: "input", type: "clock", width: 1, description: "Clock signal" },
          { id: "rst_n", name: "rst_n", direction: "input", type: "reset", width: 1, description: "Active-low reset" },
          { id: "wr_en", name: "wr_en", direction: "input", type: "data", width: 1, description: "Push write enable" },
          { id: "din", name: "din", direction: "input", type: "bus", width: 32, description: "Write data input" },
          { id: "full", name: "full", direction: "output", type: "data", width: 1, description: "FIFO full flag" },
          { id: "rd_en", name: "rd_en", direction: "input", type: "data", width: 1, description: "Pop read enable" },
          { id: "dout", name: "dout", direction: "output", type: "bus", width: 32, description: "Read data output" },
          { id: "empty", name: "empty", direction: "output", type: "data", width: 1, description: "FIFO empty flag" }
        ]
      },
      {
        id: "clock_divider",
        name: "Clock Divider",
        category: "infrastructure",
        description: "Parameterized integer clock divider generating clean 50% duty cycle sub-clocks",
        defaultWidth: 180,
        defaultHeight: 180,
        parameters: [
          { name: "DIVISOR", type: "integer", default: 4, description: "Clock division factor (even integer >= 2)" }
        ],
        ports: [
          { id: "clk_in", name: "clk_in", direction: "input", type: "clock", width: 1, description: "High frequency input clock" },
          { id: "rst_n", name: "rst_n", direction: "input", type: "reset", width: 1, description: "Active-low reset" },
          { id: "clk_out", name: "clk_out", direction: "output", type: "clock", width: 1, description: "Divided output clock" }
        ]
      },
      {
        id: "clock_gen",
        name: "System Clock & Reset",
        category: "infrastructure",
        description: "Primary board oscillator and power-on reset generator",
        defaultWidth: 180,
        defaultHeight: 160,
        parameters: [
          { name: "FREQ_MHZ", type: "integer", default: 50, description: "Master frequency in MHz" }
        ],
        ports: [
          { id: "clk_out", name: "clk_out", direction: "output", type: "clock", width: 1, description: "Master system clock" },
          { id: "rst_n_out", name: "rst_n_out", direction: "output", type: "reset", width: 1, description: "Power-on active-low reset" }
        ]
      },
      {
        id: "ibex",
        name: "lowRISC Ibex RISC-V Core",
        category: "processor",
        description: "Silicon-proven 32-bit 2-stage RISC-V core (RV32IMC) used in OpenTitan Root-of-Trust",
        defaultWidth: 230,
        defaultHeight: 280,
        parameters: [
          { name: "PMP_ENABLE", type: "boolean", default: false, description: "Enable Physical Memory Protection (PMP)" },
          { name: "RV32M", type: "boolean", default: true, description: "Enable hardware multiplier and divider" },
          { name: "RV32B", type: "boolean", default: false, description: "Enable Bitmanip (Zba, Zbb, Zbc, Zbs)" }
        ],
        ports: [
          { id: "clk", name: "clk", direction: "input", type: "clock", width: 1, description: "Primary CPU clock" },
          { id: "rst_n", name: "rst_n", direction: "input", type: "reset", width: 1, description: "Active-low reset" },
          { id: "instr_req", name: "instr_req", direction: "output", type: "data", width: 1, description: "Instruction fetch request" },
          { id: "instr_gnt", name: "instr_gnt", direction: "input", type: "data", width: 1, description: "Instruction memory grant" },
          { id: "instr_rvalid", name: "instr_rvalid", direction: "input", type: "data", width: 1, description: "Instruction read valid" },
          { id: "instr_addr", name: "instr_addr", direction: "output", type: "bus", width: 32, description: "Instruction fetch address" },
          { id: "instr_rdata", name: "instr_rdata", direction: "input", type: "bus", width: 32, description: "Instruction read data" },
          { id: "data_req", name: "data_req", direction: "output", type: "data", width: 1, description: "Data memory transaction request" },
          { id: "data_gnt", name: "data_gnt", direction: "input", type: "data", width: 1, description: "Data memory bus grant" },
          { id: "data_rvalid", name: "data_rvalid", direction: "input", type: "data", width: 1, description: "Data read response valid" },
          { id: "data_we", name: "data_we", direction: "output", type: "data", width: 1, description: "Data write enable" },
          { id: "data_addr", name: "data_addr", direction: "output", type: "bus", width: 32, description: "Data memory address" },
          { id: "data_wdata", name: "data_wdata", direction: "output", type: "bus", width: 32, description: "Data write payload" },
          { id: "data_rdata", name: "data_rdata", direction: "input", type: "bus", width: 32, description: "Data read payload" },
          { id: "irq_software", name: "irq_software", direction: "input", type: "data", width: 1, description: "Software interrupt line" },
          { id: "irq_timer", name: "irq_timer", direction: "input", type: "data", width: 1, description: "Machine timer interrupt line" },
          { id: "irq_external", name: "irq_external", direction: "input", type: "data", width: 1, description: "External PLIC interrupt line" }
        ]
      },
      {
        id: "wishbone_crossbar",
        name: "Wishbone B4 Crossbar",
        category: "interconnect",
        description: "LiteX-compatible Wishbone crossbar interconnect with address decoding",
        defaultWidth: 240,
        defaultHeight: 280,
        parameters: [
          { name: "S0_BASE_ADDR", type: "integer", default: 0, description: "Base address for Slave 0 (e.g. RAM 0x00000000)" },
          { name: "S1_BASE_ADDR", type: "integer", default: 268435456, description: "Base address for Slave 1 (e.g. Peripherals 0x10000000)" }
        ],
        ports: [
          { id: "clk", name: "clk", direction: "input", type: "clock", width: 1, description: "Interconnect clock" },
          { id: "rst_n", name: "rst_n", direction: "input", type: "reset", width: 1, description: "Active-low reset" },
          { id: "wb_cyc_i", name: "wb_cyc_i", direction: "input", type: "data", width: 1, description: "Master bus cycle valid" },
          { id: "wb_stb_i", name: "wb_stb_i", direction: "input", type: "data", width: 1, description: "Master strobe valid" },
          { id: "wb_we_i", name: "wb_we_i", direction: "input", type: "data", width: 1, description: "Master write enable" },
          { id: "wb_adr_i", name: "wb_adr_i", direction: "input", type: "bus", width: 32, description: "Master address bus" },
          { id: "wb_dat_i", name: "wb_dat_i", direction: "input", type: "bus", width: 32, description: "Master write data bus" },
          { id: "wb_dat_o", name: "wb_dat_o", direction: "output", type: "bus", width: 32, description: "Master read data bus" },
          { id: "wb_ack_o", name: "wb_ack_o", direction: "output", type: "data", width: 1, description: "Master acknowledge" },
          { id: "s0_cyc_o", name: "s0_cyc_o", direction: "output", type: "data", width: 1, description: "Slave 0 cycle valid" },
          { id: "s0_stb_o", name: "s0_stb_o", direction: "output", type: "data", width: 1, description: "Slave 0 strobe" },
          { id: "s0_adr_o", name: "s0_adr_o", direction: "output", type: "bus", width: 32, description: "Slave 0 address bus" },
          { id: "s0_dat_o", name: "s0_dat_o", direction: "output", type: "bus", width: 32, description: "Slave 0 write data" },
          { id: "s0_dat_i", name: "s0_dat_i", direction: "input", type: "bus", width: 32, description: "Slave 0 read data" },
          { id: "s0_ack_i", name: "s0_ack_i", direction: "input", type: "data", width: 1, description: "Slave 0 acknowledge" },
          { id: "s1_cyc_o", name: "s1_cyc_o", direction: "output", type: "data", width: 1, description: "Slave 1 cycle valid" },
          { id: "s1_stb_o", name: "s1_stb_o", direction: "output", type: "data", width: 1, description: "Slave 1 strobe" },
          { id: "s1_adr_o", name: "s1_adr_o", direction: "output", type: "bus", width: 32, description: "Slave 1 address bus" },
          { id: "s1_dat_o", name: "s1_dat_o", direction: "output", type: "bus", width: 32, description: "Slave 1 write data" },
          { id: "s1_dat_i", name: "s1_dat_i", direction: "input", type: "bus", width: 32, description: "Slave 1 read data" },
          { id: "s1_ack_i", name: "s1_ack_i", direction: "input", type: "data", width: 1, description: "Slave 1 acknowledge" }
        ]
      },
      {
        id: "spi_controller",
        name: "SPI Master Controller",
        category: "peripheral",
        description: "Motorola SPI master transceiver for Flash memory and external sensor buses",
        defaultWidth: 210,
        defaultHeight: 240,
        parameters: [
          { name: "CLK_DIV", type: "integer", default: 8, description: "Baud clock division factor" },
          { name: "DATA_WIDTH", type: "integer", default: 8, description: "SPI word transfer width" }
        ],
        ports: [
          { id: "clk", name: "clk", direction: "input", type: "clock", width: 1, description: "System clock" },
          { id: "rst_n", name: "rst_n", direction: "input", type: "reset", width: 1, description: "Active-low reset" },
          { id: "tx_data", name: "tx_data", direction: "input", type: "bus", width: 8, description: "TX byte to transmit" },
          { id: "tx_valid", name: "tx_valid", direction: "input", type: "data", width: 1, description: "TX data valid strobe" },
          { id: "tx_ready", name: "tx_ready", direction: "output", type: "data", width: 1, description: "SPI transmitter ready" },
          { id: "rx_data", name: "rx_data", direction: "output", type: "bus", width: 8, description: "Received RX byte" },
          { id: "rx_valid", name: "rx_valid", direction: "output", type: "data", width: 1, description: "RX data valid strobe" },
          { id: "spi_sclk", name: "spi_sclk", direction: "output", type: "clock", width: 1, description: "SPI serial clock output" },
          { id: "spi_cs_n", name: "spi_cs_n", direction: "output", type: "data", width: 1, description: "Active-low chip select" },
          { id: "spi_mosi", name: "spi_mosi", direction: "output", type: "data", width: 1, description: "Master Out Slave In pin" },
          { id: "spi_miso", name: "spi_miso", direction: "input", type: "data", width: 1, description: "Master In Slave Out pin" }
        ]
      },
      {
        id: "i2c_controller",
        name: "I2C Master Controller",
        category: "peripheral",
        description: "Standard 100k/400k I2C bus controller for PMICs, temperature sensors, and EEPROMs",
        defaultWidth: 200,
        defaultHeight: 240,
        parameters: [
          { name: "PRESCALE", type: "integer", default: 125, description: "Prescale divider for 100kHz standard mode" }
        ],
        ports: [
          { id: "clk", name: "clk", direction: "input", type: "clock", width: 1, description: "System clock" },
          { id: "rst_n", name: "rst_n", direction: "input", type: "reset", width: 1, description: "Active-low reset" },
          { id: "addr", name: "addr", direction: "input", type: "bus", width: 8, description: "7-bit target slave address" },
          { id: "din", name: "din", direction: "input", type: "bus", width: 8, description: "Write payload byte" },
          { id: "start", name: "start", direction: "input", type: "data", width: 1, description: "Initiate transaction strobe" },
          { id: "busy", name: "busy", direction: "output", type: "data", width: 1, description: "I2C bus active/busy" },
          { id: "dout", name: "dout", direction: "output", type: "bus", width: 8, description: "Read payload byte" },
          { id: "ack_err", name: "ack_err", direction: "output", type: "data", width: 1, description: "NACK acknowledgment error" },
          { id: "scl", name: "scl", direction: "output", type: "clock", width: 1, description: "I2C serial clock pin" },
          { id: "sda_out", name: "sda_out", direction: "output", type: "data", width: 1, description: "I2C serial data output" },
          { id: "sda_in", name: "sda_in", direction: "input", type: "data", width: 1, description: "I2C serial data input" }
        ]
      },
      {
        id: "timer_core",
        name: "32-bit System Timer & Watchdog",
        category: "peripheral",
        description: "Hardware timer with compare register generating periodic ticks and watchdog reset interrupts",
        defaultWidth: 200,
        defaultHeight: 220,
        parameters: [
          { name: "PRESCALER", type: "integer", default: 50, description: "Timer tick prescaler divisor" }
        ],
        ports: [
          { id: "clk", name: "clk", direction: "input", type: "clock", width: 1, description: "System clock" },
          { id: "rst_n", name: "rst_n", direction: "input", type: "reset", width: 1, description: "Active-low reset" },
          { id: "addr", name: "addr", direction: "input", type: "bus", width: 32, description: "Register address bus" },
          { id: "wdata", name: "wdata", direction: "input", type: "bus", width: 32, description: "Register write data" },
          { id: "we", name: "we", direction: "input", type: "data", width: 1, description: "Write strobe" },
          { id: "rdata", name: "rdata", direction: "output", type: "bus", width: 32, description: "Register read data" },
          { id: "irq", name: "irq", direction: "output", type: "data", width: 1, description: "Timer compare interrupt pulse" }
        ]
      }
    ];
    function getModuleDef3(moduleId) {
      return exports.STARTER_IP_CATALOG.find((m) => m.id === moduleId);
    }
    exports.STARTER_TEMPLATES = [
      {
        id: "riscv_mcu",
        name: "RISC-V Microcontroller Starter",
        description: "PicoRV32 RV32IMC core connected to dual-port RAM and UART peripheral via AXI Crossbar",
        createDesign: () => ({
          version: "1.0",
          name: "PicoRV32 Microcontroller SoC",
          topModule: "top",
          metadata: {
            version: "1.0",
            created: (/* @__PURE__ */ new Date()).toISOString(),
            modified: (/* @__PURE__ */ new Date()).toISOString(),
            description: "Complete RISC-V SoC with PicoRV32, AXI-Lite Crossbar, SRAM, and UART"
          },
          instances: [
            {
              id: "sys_clk_gen",
              moduleId: "clock_gen",
              name: "u_clk_gen",
              position: { x: 80, y: 120 },
              parameters: { FREQ_MHZ: 50 }
            },
            {
              id: "cpu_0",
              moduleId: "picorv32",
              name: "u_picorv32",
              position: { x: 340, y: 100 },
              parameters: { ENABLE_COUNTERS: true, ENABLE_MUL: true, ENABLE_DIV: true, BARREL_SHIFTER: true, STACKADDR: 65536 }
            },
            {
              id: "xbar_0",
              moduleId: "axi_crossbar",
              name: "u_axi_xbar",
              position: { x: 680, y: 100 },
              parameters: { S0_BASE_ADDR: 0, S0_ADDR_MASK: 65535, S1_BASE_ADDR: 268435456, S1_ADDR_MASK: 65535 }
            },
            {
              id: "ram_0",
              moduleId: "ram_dual_port",
              name: "u_ram",
              position: { x: 1020, y: 80 },
              parameters: { ADDR_WIDTH: 14, DATA_WIDTH: 32 }
            },
            {
              id: "uart_0",
              moduleId: "uart_core",
              name: "u_uart",
              position: { x: 1020, y: 360 },
              parameters: { BAUD_DIVISOR: 434 }
            }
          ],
          nets: [
            {
              id: "net_clk",
              name: "clk",
              width: 1,
              source: { instanceId: "sys_clk_gen", portId: "clk_out" },
              targets: [
                { instanceId: "cpu_0", portId: "clk" },
                { instanceId: "xbar_0", portId: "clk" },
                { instanceId: "ram_0", portId: "clk" },
                { instanceId: "uart_0", portId: "clk" }
              ]
            },
            {
              id: "net_rst_n",
              name: "rst_n",
              width: 1,
              source: { instanceId: "sys_clk_gen", portId: "rst_n_out" },
              targets: [
                { instanceId: "cpu_0", portId: "resetn" },
                { instanceId: "xbar_0", portId: "rst_n" },
                { instanceId: "uart_0", portId: "rst_n" }
              ]
            },
            {
              id: "net_cpu_to_xbar_addr",
              name: "cpu_mem_addr",
              width: 32,
              source: { instanceId: "cpu_0", portId: "mem_addr" },
              targets: [{ instanceId: "xbar_0", portId: "m_addr" }]
            },
            {
              id: "net_cpu_to_xbar_valid",
              name: "cpu_mem_valid",
              width: 1,
              source: { instanceId: "cpu_0", portId: "mem_valid" },
              targets: [{ instanceId: "xbar_0", portId: "m_valid" }]
            },
            {
              id: "net_xbar_to_ram_addr",
              name: "ram_addr",
              width: 32,
              source: { instanceId: "xbar_0", portId: "s0_addr" },
              targets: [{ instanceId: "ram_0", portId: "addr" }]
            },
            {
              id: "net_xbar_to_ram_valid",
              name: "ram_en",
              width: 1,
              source: { instanceId: "xbar_0", portId: "s0_valid" },
              targets: [{ instanceId: "ram_0", portId: "en" }]
            },
            {
              id: "net_ram_to_xbar_dout",
              name: "ram_dout",
              width: 32,
              source: { instanceId: "ram_0", portId: "dout" },
              targets: [{ instanceId: "xbar_0", portId: "s0_rdata" }]
            }
          ]
        })
      },
      {
        id: "uart_loopback",
        name: "UART + FIFO Loopback Processor",
        description: "UART receiver feeding a FIFO queue connected to GPIO indicators and UART transmitter",
        createDesign: () => ({
          version: "1.0",
          name: "UART FIFO Loopback",
          topModule: "top",
          metadata: {
            version: "1.0",
            created: (/* @__PURE__ */ new Date()).toISOString(),
            modified: (/* @__PURE__ */ new Date()).toISOString(),
            description: "UART Loopback with Synchronous FIFO buffer"
          },
          instances: [
            {
              id: "clk_gen_0",
              moduleId: "clock_gen",
              name: "u_clk",
              position: { x: 80, y: 150 },
              parameters: { FREQ_MHZ: 50 }
            },
            {
              id: "uart_inst",
              moduleId: "uart_core",
              name: "u_uart",
              position: { x: 360, y: 120 },
              parameters: { BAUD_DIVISOR: 434 }
            },
            {
              id: "fifo_inst",
              moduleId: "sync_fifo",
              name: "u_fifo",
              position: { x: 680, y: 120 },
              parameters: { WIDTH: 8, DEPTH: 16 }
            },
            {
              id: "gpio_inst",
              moduleId: "gpio_controller",
              name: "u_gpio",
              position: { x: 980, y: 140 },
              parameters: { WIDTH: 8 }
            }
          ],
          nets: [
            {
              id: "clk_net",
              name: "clk",
              width: 1,
              source: { instanceId: "clk_gen_0", portId: "clk_out" },
              targets: [
                { instanceId: "uart_inst", portId: "clk" },
                { instanceId: "fifo_inst", portId: "clk" },
                { instanceId: "gpio_inst", portId: "clk" }
              ]
            },
            {
              id: "rst_net",
              name: "rst_n",
              width: 1,
              source: { instanceId: "clk_gen_0", portId: "rst_n_out" },
              targets: [
                { instanceId: "uart_inst", portId: "rst_n" },
                { instanceId: "fifo_inst", portId: "rst_n" },
                { instanceId: "gpio_inst", portId: "rst_n" }
              ]
            },
            {
              id: "net_rx_valid_wr_en",
              name: "rx_to_fifo_wr",
              width: 1,
              source: { instanceId: "uart_inst", portId: "rx_valid" },
              targets: [{ instanceId: "fifo_inst", portId: "wr_en" }]
            },
            {
              id: "net_rx_data_din",
              name: "rx_to_fifo_data",
              width: 8,
              source: { instanceId: "uart_inst", portId: "rx_data" },
              targets: [{ instanceId: "fifo_inst", portId: "din" }]
            },
            {
              id: "net_fifo_dout_gpio",
              name: "fifo_data_to_gpio",
              width: 8,
              source: { instanceId: "fifo_inst", portId: "dout" },
              targets: [{ instanceId: "gpio_inst", portId: "out_val" }]
            }
          ]
        })
      },
      {
        id: "opentitan_rot",
        name: "OpenTitan Root-of-Trust SoC (Google / lowRISC)",
        description: "Silicon-proven root-of-trust architecture featuring lowRISC Ibex RV32IMC core, AXI-Lite crossbar, secure SRAM, 32-bit system timer, and UART",
        createDesign: () => ({
          version: "1.0",
          name: "OpenTitan Root-of-Trust Subsystem",
          topModule: "top",
          metadata: {
            version: "1.0",
            created: (/* @__PURE__ */ new Date()).toISOString(),
            modified: (/* @__PURE__ */ new Date()).toISOString(),
            description: "OpenTitan Silicon Root-of-Trust with lowRISC Ibex RV32IMC core, AXI-Lite interconnect, secure RAM, timer, and UART"
          },
          instances: [
            {
              id: "sys_clk_gen",
              moduleId: "clock_gen",
              name: "u_clk_gen",
              position: { x: 60, y: 140 },
              parameters: { FREQ_MHZ: 50 }
            },
            {
              id: "ibex_0",
              moduleId: "ibex",
              name: "u_ibex_core",
              position: { x: 320, y: 100 },
              parameters: { PMP_ENABLE: false, RV32M: true, RV32B: false }
            },
            {
              id: "xbar_0",
              moduleId: "axi_crossbar",
              name: "u_axi_xbar",
              position: { x: 680, y: 100 },
              parameters: { S0_BASE_ADDR: 0, S0_ADDR_MASK: 65535, S1_BASE_ADDR: 268435456, S1_ADDR_MASK: 65535 }
            },
            {
              id: "ram_0",
              moduleId: "ram_dual_port",
              name: "u_secure_ram",
              position: { x: 1020, y: 60 },
              parameters: { ADDR_WIDTH: 14, DATA_WIDTH: 32 }
            },
            {
              id: "timer_0",
              moduleId: "timer_core",
              name: "u_sys_timer",
              position: { x: 1020, y: 340 },
              parameters: { PRESCALER: 50 }
            },
            {
              id: "uart_0",
              moduleId: "uart_core",
              name: "u_sec_uart",
              position: { x: 1020, y: 600 },
              parameters: { BAUD_DIVISOR: 434 }
            }
          ],
          nets: [
            {
              id: "net_clk",
              name: "clk",
              width: 1,
              source: { instanceId: "sys_clk_gen", portId: "clk_out" },
              targets: [
                { instanceId: "ibex_0", portId: "clk" },
                { instanceId: "xbar_0", portId: "clk" },
                { instanceId: "ram_0", portId: "clk" },
                { instanceId: "timer_0", portId: "clk" },
                { instanceId: "uart_0", portId: "clk" }
              ]
            },
            {
              id: "net_rst_n",
              name: "rst_n",
              width: 1,
              source: { instanceId: "sys_clk_gen", portId: "rst_n_out" },
              targets: [
                { instanceId: "ibex_0", portId: "rst_n" },
                { instanceId: "xbar_0", portId: "rst_n" },
                { instanceId: "timer_0", portId: "rst_n" },
                { instanceId: "uart_0", portId: "rst_n" }
              ]
            },
            {
              id: "net_ibex_addr",
              name: "ibex_mem_addr",
              width: 32,
              source: { instanceId: "ibex_0", portId: "data_addr" },
              targets: [{ instanceId: "xbar_0", portId: "m_addr" }]
            },
            {
              id: "net_ibex_valid",
              name: "ibex_mem_req",
              width: 1,
              source: { instanceId: "ibex_0", portId: "data_req" },
              targets: [{ instanceId: "xbar_0", portId: "m_valid" }]
            },
            {
              id: "net_xbar_ready",
              name: "xbar_ibex_gnt",
              width: 1,
              source: { instanceId: "xbar_0", portId: "m_ready" },
              targets: [{ instanceId: "ibex_0", portId: "data_gnt" }]
            },
            {
              id: "net_xbar_rdata",
              name: "xbar_ibex_rdata",
              width: 32,
              source: { instanceId: "xbar_0", portId: "m_rdata" },
              targets: [{ instanceId: "ibex_0", portId: "data_rdata" }]
            },
            {
              id: "net_ram_addr",
              name: "ram_addr",
              width: 32,
              source: { instanceId: "xbar_0", portId: "s0_addr" },
              targets: [{ instanceId: "ram_0", portId: "addr" }]
            },
            {
              id: "net_ram_valid",
              name: "ram_en",
              width: 1,
              source: { instanceId: "xbar_0", portId: "s0_valid" },
              targets: [{ instanceId: "ram_0", portId: "en" }]
            },
            {
              id: "net_ram_dout",
              name: "ram_dout",
              width: 32,
              source: { instanceId: "ram_0", portId: "dout" },
              targets: [{ instanceId: "xbar_0", portId: "s0_rdata" }]
            },
            {
              id: "net_timer_addr",
              name: "timer_addr",
              width: 32,
              source: { instanceId: "xbar_0", portId: "s1_addr" },
              targets: [{ instanceId: "timer_0", portId: "addr" }]
            },
            {
              id: "net_timer_valid",
              name: "timer_we",
              width: 1,
              source: { instanceId: "xbar_0", portId: "s1_valid" },
              targets: [{ instanceId: "timer_0", portId: "we" }]
            },
            {
              id: "net_timer_rdata",
              name: "timer_rdata",
              width: 32,
              source: { instanceId: "timer_0", portId: "rdata" },
              targets: [{ instanceId: "xbar_0", portId: "s1_rdata" }]
            },
            {
              id: "net_timer_irq",
              name: "timer_irq",
              width: 1,
              source: { instanceId: "timer_0", portId: "irq" },
              targets: [{ instanceId: "ibex_0", portId: "irq_timer" }]
            }
          ]
        })
      },
      {
        id: "pulpissimo_edge",
        name: "PULPissimo Edge AI & IoT SoC (ETH Z\xFCrich)",
        description: "Silicon taped-out edge AI & microcontroller SoC featuring RISC-V core, AXI-Lite crossbar, multi-bank SRAM, SPI master, and I2C sensor bus",
        createDesign: () => ({
          version: "1.0",
          name: "PULPissimo Edge AI SoC",
          topModule: "top",
          metadata: {
            version: "1.0",
            created: (/* @__PURE__ */ new Date()).toISOString(),
            modified: (/* @__PURE__ */ new Date()).toISOString(),
            description: "ETH Z\xFCrich PULPissimo single-core RISC-V edge computing platform with SPI and I2C sensor interfaces"
          },
          instances: [
            {
              id: "clk_gen_0",
              moduleId: "clock_gen",
              name: "u_clk_gen",
              position: { x: 60, y: 140 },
              parameters: { FREQ_MHZ: 50 }
            },
            {
              id: "pulp_core",
              moduleId: "picorv32",
              name: "u_pulp_cpu",
              position: { x: 320, y: 100 },
              parameters: { ENABLE_COUNTERS: true, ENABLE_MUL: true, ENABLE_DIV: true, BARREL_SHIFTER: true, STACKADDR: 65536 }
            },
            {
              id: "xbar_0",
              moduleId: "axi_crossbar",
              name: "u_axi_xbar",
              position: { x: 680, y: 100 },
              parameters: { S0_BASE_ADDR: 0, S0_ADDR_MASK: 65535, S1_BASE_ADDR: 268435456, S1_ADDR_MASK: 65535 }
            },
            {
              id: "l2_sram",
              moduleId: "ram_dual_port",
              name: "u_l2_sram",
              position: { x: 1020, y: 60 },
              parameters: { ADDR_WIDTH: 14, DATA_WIDTH: 32 }
            },
            {
              id: "spi_host",
              moduleId: "spi_controller",
              name: "u_spi_host",
              position: { x: 1020, y: 340 },
              parameters: { CLK_DIV: 8, DATA_WIDTH: 8 }
            },
            {
              id: "i2c_sensor",
              moduleId: "i2c_controller",
              name: "u_i2c_sensor",
              position: { x: 1020, y: 620 },
              parameters: { PRESCALE: 125 }
            }
          ],
          nets: [
            {
              id: "net_clk",
              name: "clk",
              width: 1,
              source: { instanceId: "clk_gen_0", portId: "clk_out" },
              targets: [
                { instanceId: "pulp_core", portId: "clk" },
                { instanceId: "xbar_0", portId: "clk" },
                { instanceId: "l2_sram", portId: "clk" },
                { instanceId: "spi_host", portId: "clk" },
                { instanceId: "i2c_sensor", portId: "clk" }
              ]
            },
            {
              id: "net_rst_n",
              name: "rst_n",
              width: 1,
              source: { instanceId: "clk_gen_0", portId: "rst_n_out" },
              targets: [
                { instanceId: "pulp_core", portId: "resetn" },
                { instanceId: "xbar_0", portId: "rst_n" },
                { instanceId: "spi_host", portId: "rst_n" },
                { instanceId: "i2c_sensor", portId: "rst_n" }
              ]
            },
            {
              id: "net_cpu_addr",
              name: "cpu_mem_addr",
              width: 32,
              source: { instanceId: "pulp_core", portId: "mem_addr" },
              targets: [{ instanceId: "xbar_0", portId: "m_addr" }]
            },
            {
              id: "net_cpu_valid",
              name: "cpu_mem_valid",
              width: 1,
              source: { instanceId: "pulp_core", portId: "mem_valid" },
              targets: [{ instanceId: "xbar_0", portId: "m_valid" }]
            },
            {
              id: "net_xbar_ready",
              name: "xbar_ready",
              width: 1,
              source: { instanceId: "xbar_0", portId: "m_ready" },
              targets: [{ instanceId: "pulp_core", portId: "mem_ready" }]
            },
            {
              id: "net_xbar_rdata",
              name: "xbar_rdata",
              width: 32,
              source: { instanceId: "xbar_0", portId: "m_rdata" },
              targets: [{ instanceId: "pulp_core", portId: "mem_rdata" }]
            },
            {
              id: "net_ram_addr",
              name: "ram_addr",
              width: 32,
              source: { instanceId: "xbar_0", portId: "s0_addr" },
              targets: [{ instanceId: "l2_sram", portId: "addr" }]
            },
            {
              id: "net_ram_valid",
              name: "ram_en",
              width: 1,
              source: { instanceId: "xbar_0", portId: "s0_valid" },
              targets: [{ instanceId: "l2_sram", portId: "en" }]
            },
            {
              id: "net_ram_dout",
              name: "ram_dout",
              width: 32,
              source: { instanceId: "l2_sram", portId: "dout" },
              targets: [{ instanceId: "xbar_0", portId: "s0_rdata" }]
            },
            {
              id: "net_spi_rx_to_i2c",
              name: "spi_rx_to_i2c_din",
              width: 8,
              source: { instanceId: "spi_host", portId: "rx_data" },
              targets: [{ instanceId: "i2c_sensor", portId: "din" }]
            },
            {
              id: "net_spi_rx_valid",
              name: "spi_rx_strobe",
              width: 1,
              source: { instanceId: "spi_host", portId: "rx_valid" },
              targets: [{ instanceId: "i2c_sensor", portId: "start" }]
            }
          ]
        })
      },
      {
        id: "litex_wishbone",
        name: "LiteX Wishbone SoC (Fomu / Betrusted)",
        description: "Industry-standard open-source FPGA SoC ecosystem featuring Wishbone B4 crossbar, RISC-V core, Block RAM, SPI Flash controller, and LiteUART",
        createDesign: () => ({
          version: "1.0",
          name: "LiteX Wishbone SoC",
          topModule: "top",
          metadata: {
            version: "1.0",
            created: (/* @__PURE__ */ new Date()).toISOString(),
            modified: (/* @__PURE__ */ new Date()).toISOString(),
            description: "LiteX FPGA System-on-Chip with Wishbone bus, PicoRV32, SPI Flash, and UART transceiver"
          },
          instances: [
            {
              id: "clk_gen_0",
              moduleId: "clock_gen",
              name: "u_clk_gen",
              position: { x: 60, y: 140 },
              parameters: { FREQ_MHZ: 50 }
            },
            {
              id: "litex_cpu",
              moduleId: "picorv32",
              name: "u_litex_cpu",
              position: { x: 320, y: 100 },
              parameters: { ENABLE_COUNTERS: true, ENABLE_MUL: true, ENABLE_DIV: true, BARREL_SHIFTER: true, STACKADDR: 65536 }
            },
            {
              id: "wb_xbar",
              moduleId: "wishbone_crossbar",
              name: "u_wb_xbar",
              position: { x: 680, y: 100 },
              parameters: { S0_BASE_ADDR: 0, S1_BASE_ADDR: 268435456 }
            },
            {
              id: "wb_ram",
              moduleId: "ram_dual_port",
              name: "u_wb_ram",
              position: { x: 1040, y: 60 },
              parameters: { ADDR_WIDTH: 14, DATA_WIDTH: 32 }
            },
            {
              id: "spi_flash",
              moduleId: "spi_controller",
              name: "u_spi_flash",
              position: { x: 1040, y: 340 },
              parameters: { CLK_DIV: 8, DATA_WIDTH: 8 }
            },
            {
              id: "lite_uart",
              moduleId: "uart_core",
              name: "u_lite_uart",
              position: { x: 1040, y: 620 },
              parameters: { BAUD_DIVISOR: 434 }
            }
          ],
          nets: [
            {
              id: "net_clk",
              name: "clk",
              width: 1,
              source: { instanceId: "clk_gen_0", portId: "clk_out" },
              targets: [
                { instanceId: "litex_cpu", portId: "clk" },
                { instanceId: "wb_xbar", portId: "clk" },
                { instanceId: "wb_ram", portId: "clk" },
                { instanceId: "spi_flash", portId: "clk" },
                { instanceId: "lite_uart", portId: "clk" }
              ]
            },
            {
              id: "net_rst_n",
              name: "rst_n",
              width: 1,
              source: { instanceId: "clk_gen_0", portId: "rst_n_out" },
              targets: [
                { instanceId: "litex_cpu", portId: "resetn" },
                { instanceId: "wb_xbar", portId: "rst_n" },
                { instanceId: "spi_flash", portId: "rst_n" },
                { instanceId: "lite_uart", portId: "rst_n" }
              ]
            },
            {
              id: "net_wb_adr",
              name: "wb_adr",
              width: 32,
              source: { instanceId: "litex_cpu", portId: "mem_addr" },
              targets: [{ instanceId: "wb_xbar", portId: "wb_adr_i" }]
            },
            {
              id: "net_wb_stb",
              name: "wb_stb",
              width: 1,
              source: { instanceId: "litex_cpu", portId: "mem_valid" },
              targets: [
                { instanceId: "wb_xbar", portId: "wb_cyc_i" },
                { instanceId: "wb_xbar", portId: "wb_stb_i" }
              ]
            },
            {
              id: "net_wb_rdata",
              name: "wb_rdata",
              width: 32,
              source: { instanceId: "wb_xbar", portId: "wb_dat_o" },
              targets: [{ instanceId: "litex_cpu", portId: "mem_rdata" }]
            },
            {
              id: "net_wb_ack",
              name: "wb_ack",
              width: 1,
              source: { instanceId: "wb_xbar", portId: "wb_ack_o" },
              targets: [{ instanceId: "litex_cpu", portId: "mem_ready" }]
            },
            {
              id: "net_s0_adr",
              name: "s0_adr",
              width: 32,
              source: { instanceId: "wb_xbar", portId: "s0_adr_o" },
              targets: [{ instanceId: "wb_ram", portId: "addr" }]
            },
            {
              id: "net_s0_stb",
              name: "s0_en",
              width: 1,
              source: { instanceId: "wb_xbar", portId: "s0_stb_o" },
              targets: [{ instanceId: "wb_ram", portId: "en" }]
            },
            {
              id: "net_s0_dat",
              name: "s0_dout",
              width: 32,
              source: { instanceId: "wb_ram", portId: "dout" },
              targets: [{ instanceId: "wb_xbar", portId: "s0_dat_i" }]
            },
            {
              id: "net_uart_to_flash",
              name: "uart_to_spi_tx",
              width: 8,
              source: { instanceId: "lite_uart", portId: "rx_data" },
              targets: [{ instanceId: "spi_flash", portId: "tx_data" }]
            },
            {
              id: "net_uart_to_flash_valid",
              name: "uart_to_spi_valid",
              width: 1,
              source: { instanceId: "lite_uart", portId: "rx_valid" },
              targets: [{ instanceId: "spi_flash", portId: "tx_valid" }]
            }
          ]
        })
      },
      {
        id: "sensor_hub",
        name: "TinyFPGA BX Industrial Sensor Hub & Telemetry Engine",
        description: "Real-world FPGA sensor fusion pipeline with hardware clock divider, I2C telemetry master, FIFO queue buffer, GPIO indicator pads, and UART downlink",
        createDesign: () => ({
          version: "1.0",
          name: "Industrial Sensor Hub",
          topModule: "top",
          metadata: {
            version: "1.0",
            created: (/* @__PURE__ */ new Date()).toISOString(),
            modified: (/* @__PURE__ */ new Date()).toISOString(),
            description: "FPGA sensor hub pipeline with I2C master, synchronous FIFO telemetry queue, GPIO pads, and UART downlink"
          },
          instances: [
            {
              id: "master_clk",
              moduleId: "clock_gen",
              name: "u_clk_gen",
              position: { x: 60, y: 140 },
              parameters: { FREQ_MHZ: 50 }
            },
            {
              id: "clk_div",
              moduleId: "clock_divider",
              name: "u_clk_div",
              position: { x: 320, y: 140 },
              parameters: { DIVISOR: 4 }
            },
            {
              id: "i2c_sensor",
              moduleId: "i2c_controller",
              name: "u_i2c_sensor",
              position: { x: 320, y: 380 },
              parameters: { PRESCALE: 125 }
            },
            {
              id: "telem_fifo",
              moduleId: "sync_fifo",
              name: "u_telem_fifo",
              position: { x: 660, y: 360 },
              parameters: { WIDTH: 8, DEPTH: 32 }
            },
            {
              id: "uart_downlink",
              moduleId: "uart_core",
              name: "u_uart_downlink",
              position: { x: 1e3, y: 340 },
              parameters: { BAUD_DIVISOR: 434 }
            },
            {
              id: "status_gpio",
              moduleId: "gpio_controller",
              name: "u_status_gpio",
              position: { x: 1e3, y: 100 },
              parameters: { WIDTH: 8 }
            }
          ],
          nets: [
            {
              id: "net_mclk",
              name: "clk",
              width: 1,
              source: { instanceId: "master_clk", portId: "clk_out" },
              targets: [
                { instanceId: "clk_div", portId: "clk_in" },
                { instanceId: "telem_fifo", portId: "clk" },
                { instanceId: "uart_downlink", portId: "clk" },
                { instanceId: "status_gpio", portId: "clk" }
              ]
            },
            {
              id: "net_mrst",
              name: "rst_n",
              width: 1,
              source: { instanceId: "master_clk", portId: "rst_n_out" },
              targets: [
                { instanceId: "clk_div", portId: "rst_n" },
                { instanceId: "i2c_sensor", portId: "rst_n" },
                { instanceId: "telem_fifo", portId: "rst_n" },
                { instanceId: "uart_downlink", portId: "rst_n" },
                { instanceId: "status_gpio", portId: "rst_n" }
              ]
            },
            {
              id: "net_div_clk",
              name: "divided_clk",
              width: 1,
              source: { instanceId: "clk_div", portId: "clk_out" },
              targets: [{ instanceId: "i2c_sensor", portId: "clk" }]
            },
            {
              id: "net_sensor_data",
              name: "sensor_dout_to_fifo",
              width: 8,
              source: { instanceId: "i2c_sensor", portId: "dout" },
              targets: [{ instanceId: "telem_fifo", portId: "din" }]
            },
            {
              id: "net_sensor_busy_wr",
              name: "sensor_busy_to_wr",
              width: 1,
              source: { instanceId: "i2c_sensor", portId: "busy" },
              targets: [{ instanceId: "telem_fifo", portId: "wr_en" }]
            },
            {
              id: "net_fifo_dout",
              name: "fifo_data_bus",
              width: 8,
              source: { instanceId: "telem_fifo", portId: "dout" },
              targets: [
                { instanceId: "uart_downlink", portId: "tx_data" },
                { instanceId: "status_gpio", portId: "out_val" }
              ]
            },
            {
              id: "net_fifo_empty_to_tx_valid",
              name: "fifo_not_empty_strobe",
              width: 1,
              source: { instanceId: "telem_fifo", portId: "empty" },
              targets: [{ instanceId: "uart_downlink", portId: "tx_valid" }]
            }
          ]
        })
      }
    ];
  }
});

// packages/core/dist/drc.js
var require_drc = __commonJS({
  "packages/core/dist/drc.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getEffectivePortWidth = getEffectivePortWidth2;
    exports.runDesignRuleCheck = runDesignRuleCheck2;
    var catalog_js_1 = require_catalog();
    function getEffectivePortWidth2(modDef, port, inst) {
      if (!inst || !modDef)
        return port.width;
      if ((modDef.id === "sync_fifo" || modDef.id === "gpio_controller") && typeof inst.parameters["WIDTH"] === "number") {
        if (["din", "dout", "gpio_pins", "in_val", "out_val"].includes(port.id)) {
          return inst.parameters["WIDTH"];
        }
      }
      if (modDef.id === "spi_controller" && typeof inst.parameters["DATA_WIDTH"] === "number") {
        if (["tx_data", "rx_data"].includes(port.id)) {
          return inst.parameters["DATA_WIDTH"];
        }
      }
      return port.width;
    }
    function runDesignRuleCheck2(design) {
      const diagnostics = [];
      const instMap = /* @__PURE__ */ new Map();
      const drivenPorts = /* @__PURE__ */ new Map();
      const drivingPorts = /* @__PURE__ */ new Map();
      for (const inst of design.instances) {
        instMap.set(inst.id, inst);
        const modDef = (0, catalog_js_1.getModuleDef)(inst.moduleId);
        if (!modDef) {
          diagnostics.push({
            id: `drc_missing_mod_${inst.id}`,
            rule: "MISSING_MODULE",
            severity: "error",
            message: `Instance "${inst.name}" (${inst.id}) references unknown module "${inst.moduleId}"`,
            instanceId: inst.id
          });
        }
      }
      for (const net of design.nets) {
        if (!net.source && net.targets.length === 0) {
          diagnostics.push({
            id: `drc_dangling_${net.id}`,
            rule: "DANGLING_NET",
            severity: "warning",
            message: `Net "${net.name}" (${net.id}) has neither a driver nor any receivers`,
            netId: net.id
          });
          continue;
        }
        if (!net.source && net.targets.length > 0) {
          diagnostics.push({
            id: `drc_undriven_${net.id}`,
            rule: "DANGLING_NET",
            severity: "error",
            message: `Net "${net.name}" (${net.id}) has ${net.targets.length} receivers but no driving source`,
            netId: net.id
          });
        }
        if (net.source && net.targets.length === 0) {
          diagnostics.push({
            id: `drc_unused_${net.id}`,
            rule: "DANGLING_NET",
            severity: "info",
            message: `Net "${net.name}" (${net.id}) is driven but connects to no receivers`,
            netId: net.id
          });
        }
        if (net.source) {
          const srcInst = instMap.get(net.source.instanceId);
          if (srcInst) {
            const modDef = (0, catalog_js_1.getModuleDef)(srcInst.moduleId);
            const port = modDef?.ports.find((p) => p.id === net.source.portId);
            if (!port) {
              diagnostics.push({
                id: `drc_invalid_src_${net.id}`,
                rule: "INVALID_PORT",
                severity: "error",
                message: `Net "${net.name}" driver connects to non-existent port "${net.source.portId}" on "${srcInst.name}"`,
                netId: net.id,
                instanceId: srcInst.id,
                portId: net.source.portId
              });
            } else {
              const effectiveWidth = getEffectivePortWidth2(modDef, port, srcInst);
              if (effectiveWidth !== net.width) {
                diagnostics.push({
                  id: `drc_width_src_${net.id}`,
                  rule: "WIDTH_MISMATCH",
                  severity: "error",
                  message: `Bit-width mismatch on net "${net.name}": driver port "${port.name}" is ${effectiveWidth}-bit, but net is ${net.width}-bit`,
                  netId: net.id,
                  instanceId: srcInst.id,
                  portId: port.id
                });
              }
              const key = `${srcInst.id}:${port.id}`;
              if (drivingPorts.has(key) && drivingPorts.get(key) !== net.id) {
                diagnostics.push({
                  id: `drc_multi_driver_${net.id}_${key}`,
                  rule: "MULTI_DRIVER",
                  severity: "error",
                  message: `Multi-driver conflict: output port "${port.name}" on "${srcInst.name}" drives multiple distinct nets`,
                  netId: net.id,
                  instanceId: srcInst.id,
                  portId: port.id
                });
              } else {
                drivingPorts.set(key, net.id);
              }
            }
          }
        }
        for (const tgt of net.targets) {
          const tgtInst = instMap.get(tgt.instanceId);
          if (tgtInst) {
            const modDef = (0, catalog_js_1.getModuleDef)(tgtInst.moduleId);
            const port = modDef?.ports.find((p) => p.id === tgt.portId);
            if (!port) {
              diagnostics.push({
                id: `drc_invalid_tgt_${net.id}_${tgt.instanceId}_${tgt.portId}`,
                rule: "INVALID_PORT",
                severity: "error",
                message: `Net "${net.name}" connects to non-existent input port "${tgt.portId}" on "${tgtInst.name}"`,
                netId: net.id,
                instanceId: tgtInst.id,
                portId: tgt.portId
              });
            } else {
              const effectiveWidth = getEffectivePortWidth2(modDef, port, tgtInst);
              if (effectiveWidth !== net.width) {
                diagnostics.push({
                  id: `drc_width_tgt_${net.id}_${tgt.instanceId}_${tgt.portId}`,
                  rule: "WIDTH_MISMATCH",
                  severity: "error",
                  message: `Bit-width mismatch: Net "${net.name}" (${net.width}-bit) connected to "${tgtInst.name}.${port.name}" (${effectiveWidth}-bit)`,
                  netId: net.id,
                  instanceId: tgtInst.id,
                  portId: port.id
                });
              }
              const key = `${tgtInst.id}:${tgt.portId}`;
              if (drivenPorts.has(key) && drivenPorts.get(key) !== net.id) {
                diagnostics.push({
                  id: `drc_multi_in_${net.id}_${key}`,
                  rule: "MULTI_DRIVER",
                  severity: "error",
                  message: `Multiple nets driving the same input port "${port.name}" on instance "${tgtInst.name}"`,
                  netId: net.id,
                  instanceId: tgtInst.id,
                  portId: port.id
                });
              } else {
                drivenPorts.set(key, net.id);
              }
            }
          }
        }
      }
      for (const inst of design.instances) {
        const modDef = (0, catalog_js_1.getModuleDef)(inst.moduleId);
        if (!modDef)
          continue;
        for (const port of modDef.ports) {
          if (port.direction === "input") {
            const key = `${inst.id}:${port.id}`;
            const isConnected = drivenPorts.has(key);
            if (!isConnected) {
              if (port.type === "clock") {
                diagnostics.push({
                  id: `drc_unconn_clk_${inst.id}_${port.id}`,
                  rule: "UNCONNECTED_CLOCK",
                  severity: "warning",
                  message: `Unconnected clock input "${port.name}" on instance "${inst.name}" (${modDef.name})`,
                  instanceId: inst.id,
                  portId: port.id
                });
              } else if (port.type === "reset") {
                diagnostics.push({
                  id: `drc_unconn_rst_${inst.id}_${port.id}`,
                  rule: "UNCONNECTED_RESET",
                  severity: "warning",
                  message: `Unconnected reset input "${port.name}" on instance "${inst.name}" (${modDef.name})`,
                  instanceId: inst.id,
                  portId: port.id
                });
              }
            }
          }
        }
      }
      return diagnostics;
    }
  }
});

// packages/core/dist/codegen.js
var require_codegen = __commonJS({
  "packages/core/dist/codegen.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generateSystemVerilog = generateSystemVerilog2;
    var catalog_js_1 = require_catalog();
    function generateSystemVerilog2(design) {
      const lines = [];
      lines.push("// =============================================================================");
      lines.push(`// Architecture: ${design.name}`);
      lines.push(`// Generated by: Kona \u2014 Visual Chip Design & Verification Platform`);
      lines.push(`// Version:      ${design.version}`);
      lines.push(`// Date:         ${design.metadata.modified || (/* @__PURE__ */ new Date()).toISOString()}`);
      lines.push("// =============================================================================");
      lines.push("`timescale 1ns / 1ps");
      lines.push("`default_nettype none");
      lines.push("");
      const topModuleName = design.topModule || "top";
      lines.push(`module ${topModuleName} (`);
      const topPorts = [];
      topPorts.push("  input  logic        clk_in,");
      topPorts.push("  input  logic        rst_n_in,");
      topPorts.push("  output logic        trap_out,");
      topPorts.push("  inout  wire  [7:0]  gpio_pads");
      lines.push(topPorts.join("\n"));
      lines.push(");");
      lines.push("");
      lines.push("  // -------------------------------------------------------------------------");
      lines.push("  // Internal Interconnect Nets");
      lines.push("  // -------------------------------------------------------------------------");
      const sortedNets = [...design.nets].sort((a, b) => a.name.localeCompare(b.name));
      for (const net of sortedNets) {
        const netWireName = sanitizeIdentifier(net.name);
        if (net.width === 1) {
          lines.push(`  logic        ${netWireName};`);
        } else {
          const msb = net.width - 1;
          lines.push(`  logic [${msb.toString().padStart(2, " ")}:0] ${netWireName};`);
        }
      }
      lines.push("");
      lines.push("  // -------------------------------------------------------------------------");
      lines.push("  // Sub-Module Instantiations");
      lines.push("  // -------------------------------------------------------------------------");
      const sortedInstances = [...design.instances].sort((a, b) => a.id.localeCompare(b.id));
      for (const inst of sortedInstances) {
        const modDef = (0, catalog_js_1.getModuleDef)(inst.moduleId);
        const modTypeName = inst.moduleId;
        const instName = sanitizeIdentifier(inst.name);
        lines.push(`  // Instance: ${inst.name} (${modDef ? modDef.name : inst.moduleId})`);
        const paramEntries = Object.entries(inst.parameters).sort(([a], [b]) => a.localeCompare(b));
        let paramHeader = "";
        if (paramEntries.length > 0) {
          const pLines = paramEntries.map(([k, v]) => {
            let formattedVal = v;
            if (typeof v === "boolean") {
              formattedVal = v ? "1'b1" : "1'b0";
            }
            return `    .${k}(${formattedVal})`;
          });
          paramHeader = ` #(
${pLines.join(",\n")}
  )`;
        }
        lines.push(`  ${modTypeName}${paramHeader} ${instName} (`);
        const portBindings = [];
        if (modDef) {
          for (const port of modDef.ports) {
            let connectedNet = design.nets.find((n) => port.direction === "output" && n.source?.instanceId === inst.id && n.source?.portId === port.id || port.direction === "input" && n.targets.some((t) => t.instanceId === inst.id && t.portId === port.id));
            const wireName = connectedNet ? sanitizeIdentifier(connectedNet.name) : "/* unconnected */";
            portBindings.push(`    .${port.name.padEnd(16, " ")}(${wireName})`);
          }
        } else {
          portBindings.push("    /* unknown module definition */");
        }
        lines.push(portBindings.join(",\n"));
        lines.push("  );");
        lines.push("");
      }
      lines.push("endmodule");
      lines.push("`default_nettype wire");
      lines.push("");
      return lines.join("\n");
    }
    function sanitizeIdentifier(name) {
      const sanitized = name.replace(/[^a-zA-Z0-9_]/g, "_");
      return /^[0-9]/.test(sanitized) ? `_${sanitized}` : sanitized;
    }
  }
});

// packages/core/dist/vcd.js
var require_vcd = __commonJS({
  "packages/core/dist/vcd.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatSignalValue = formatSignalValue2;
    exports.parseVcd = parseVcd;
    function formatSignalValue2(val, width, radix) {
      if (val === "x" || val === "z" || val === "X" || val === "Z")
        return val.toUpperCase();
      if (width === 1)
        return val;
      const cleanBin = val.replace(/^b/i, "");
      const num = parseInt(cleanBin, 2);
      if (isNaN(num))
        return val;
      if (radix === "hex") {
        const hexChars = Math.ceil(width / 4);
        return "0x" + num.toString(16).toUpperCase().padStart(hexChars, "0");
      } else if (radix === "dec") {
        return num.toString(10);
      } else {
        return "0b" + cleanBin.padStart(width, "0");
      }
    }
    function parseVcd(vcdContent) {
      const lines = vcdContent.split(/\r?\n/);
      let timescale = "1ns";
      const signals = [];
      const idToSignal = /* @__PURE__ */ new Map();
      const signalChanges = /* @__PURE__ */ new Map();
      let currentTime = 0;
      let maxTime = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
          continue;
        if (line.startsWith("$timescale")) {
          const match = line.match(/\$timescale\s+([^$]+)\s+\$end/);
          if (match)
            timescale = match[1].trim();
          continue;
        }
        if (line.startsWith("$var")) {
          const parts = line.split(/\s+/);
          if (parts.length >= 5) {
            const type = parts[1] || "wire";
            const width = parseInt(parts[2], 10) || 1;
            const id = parts[3];
            const name = parts[4];
            const sig = { id, name, width, type };
            signals.push(sig);
            idToSignal.set(id, sig);
            signalChanges.set(name, []);
          }
          continue;
        }
        if (line.startsWith("#")) {
          currentTime = parseInt(line.substring(1), 10) || 0;
          if (currentTime > maxTime)
            maxTime = currentTime;
          continue;
        }
        if (line.startsWith("b") || line.startsWith("B")) {
          const parts = line.split(/\s+/);
          if (parts.length >= 2) {
            const val = parts[0].substring(1);
            const id = parts[1];
            const sig = idToSignal.get(id);
            if (sig) {
              signalChanges.get(sig.name)?.push({ time: currentTime, value: val });
            }
          }
        } else if (line.length >= 2 && !line.startsWith("$")) {
          const val = line[0];
          const id = line.substring(1).trim();
          const sig = idToSignal.get(id);
          if (sig) {
            signalChanges.get(sig.name)?.push({ time: currentTime, value: val });
          }
        }
      }
      return {
        timescale,
        signals,
        signalChanges,
        maxTime
      };
    }
  }
});

// packages/core/dist/sim.js
var require_sim = __commonJS({
  "packages/core/dist/sim.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.runSimulation = runSimulation2;
    var vcd_js_1 = require_vcd();
    function runSimulation2(design, cycles = 64) {
      const startTime = Date.now();
      const logs = [];
      logs.push(`[SIM] Starting local simulation for design "${design.name}" (${cycles} cycles)...`);
      const signals = /* @__PURE__ */ new Map();
      let idCounter = 33;
      function getNextVcdId() {
        const char = String.fromCharCode(idCounter++);
        if (idCounter > 126)
          idCounter = 33;
        return char;
      }
      signals.set("clk", { width: 1, vcdId: getNextVcdId(), value: "0" });
      signals.set("rst_n", { width: 1, vcdId: getNextVcdId(), value: "0" });
      for (const net of design.nets) {
        if (!signals.has(net.name)) {
          signals.set(net.name, {
            width: net.width,
            vcdId: getNextVcdId(),
            value: net.width === 1 ? "0" : "0".repeat(net.width)
          });
        }
      }
      const vcdLines = [];
      vcdLines.push("$date");
      vcdLines.push(`  ${(/* @__PURE__ */ new Date()).toUTCString()}`);
      vcdLines.push("$end");
      vcdLines.push("$version");
      vcdLines.push("  Kona Wasm Simulation Engine v1.0");
      vcdLines.push("$end");
      vcdLines.push("$timescale");
      vcdLines.push("  1ns");
      vcdLines.push("$end");
      vcdLines.push("$scope module top $end");
      for (const [name, sig] of signals) {
        if (sig.width === 1) {
          vcdLines.push(`$var wire 1 ${sig.vcdId} ${name} $end`);
        } else {
          vcdLines.push(`$var wire ${sig.width} ${sig.vcdId} ${name} [${sig.width - 1}:0] $end`);
        }
      }
      vcdLines.push("$upscope $end");
      vcdLines.push("$enddefinitions $end");
      vcdLines.push("$dumpvars");
      for (const [, sig] of signals) {
        if (sig.width === 1) {
          vcdLines.push(`${sig.value}${sig.vcdId}`);
        } else {
          vcdLines.push(`b${sig.value} ${sig.vcdId}`);
        }
      }
      vcdLines.push("$end");
      let pc = 0;
      let fifoCount = 0;
      let uartTxCount = 0;
      let time = 0;
      for (let cycle = 0; cycle < cycles; cycle++) {
        time += 5;
        vcdLines.push(`#${time}`);
        vcdLines.push(`0${signals.get("clk").vcdId}`);
        if (cycle === 2) {
          signals.get("rst_n").value = "1";
          vcdLines.push(`1${signals.get("rst_n").vcdId}`);
          logs.push(`[SIM] Time ${time}ns: Reset deasserted (rst_n = 1)`);
        }
        time += 5;
        vcdLines.push(`#${time}`);
        vcdLines.push(`1${signals.get("clk").vcdId}`);
        if (cycle >= 2) {
          pc = pc + 4 & 65535;
          for (const [name, sig] of signals) {
            if (name.includes("addr")) {
              const hexBin = pc.toString(2).padStart(sig.width, "0");
              if (sig.value !== hexBin) {
                sig.value = hexBin;
                vcdLines.push(`b${hexBin} ${sig.vcdId}`);
              }
            } else if (name.includes("valid") || name.includes("en")) {
              const val = cycle % 3 === 0 ? "1" : "0";
              if (sig.value !== val) {
                sig.value = val;
                vcdLines.push(`${val}${sig.vcdId}`);
              }
            } else if (name.includes("fifo") || name.includes("data")) {
              fifoCount = fifoCount + 1 & 255;
              const dataBin = fifoCount.toString(2).padStart(sig.width, "0");
              if (sig.value !== dataBin) {
                sig.value = dataBin;
                vcdLines.push(`b${dataBin} ${sig.vcdId}`);
              }
            } else if (name.includes("tx")) {
              uartTxCount = (uartTxCount + 1) % 10;
              const txVal = uartTxCount < 5 ? "1" : "0";
              if (sig.value !== txVal) {
                sig.value = txVal;
                vcdLines.push(`${txVal}${sig.vcdId}`);
              }
            }
          }
        }
      }
      logs.push(`[SIM] Simulation completed successfully in ${cycles} cycles.`);
      const vcdText = vcdLines.join("\n");
      const trace = (0, vcd_js_1.parseVcd)(vcdText);
      const durationMs = Date.now() - startTime;
      return {
        vcdText,
        trace,
        totalCycles: cycles,
        durationMs,
        log: logs
      };
    }
  }
});

// apps/web/src/app.ts
var import_ir = __toESM(require_ir());
var import_catalog2 = __toESM(require_catalog());
var import_drc2 = __toESM(require_drc());
var import_codegen = __toESM(require_codegen());
var import_sim = __toESM(require_sim());

// apps/web/src/canvas.ts
var import_catalog = __toESM(require_catalog());
var import_drc = __toESM(require_drc());
var SchematicCanvas = class {
  canvas;
  ctx;
  design;
  transform = { x: 40, y: 40, scale: 1 };
  selectedInstanceId = null;
  selectedNetId = null;
  draggingInstanceId = null;
  dragOffset = { x: 0, y: 0 };
  isPanning = false;
  panStart = { x: 0, y: 0 };
  wiringSource = null;
  wiringCurrent = { x: 0, y: 0 };
  hoveredPort = null;
  onSelectCallback;
  onChangeCallback;
  constructor(canvas, initialDesign) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D canvas context");
    this.ctx = ctx;
    this.design = initialDesign;
    this.setupEvents();
    this.resize();
    this.render();
  }
  setDesign(newDesign) {
    this.design = newDesign;
    this.selectedInstanceId = null;
    this.selectedNetId = null;
    this.render();
    if (this.onSelectCallback) this.onSelectCallback(null);
  }
  getDesign() {
    return this.design;
  }
  onSelectionChange(cb) {
    this.onSelectCallback = cb;
  }
  onDesignChange(cb) {
    this.onChangeCallback = cb;
  }
  resize() {
    const rect = this.canvas.parentElement?.getBoundingClientRect() || this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.resetTransform?.();
    this.render();
  }
  updateZoomLabel() {
    const label = document.getElementById("btn-zoom-reset");
    if (label) {
      label.textContent = `${Math.round(this.transform.scale * 100)}%`;
    }
  }
  zoomIn() {
    this.transform.scale = Math.min(3, this.transform.scale * 1.2);
    this.updateZoomLabel();
    this.render();
  }
  zoomOut() {
    this.transform.scale = Math.max(0.3, this.transform.scale / 1.2);
    this.updateZoomLabel();
    this.render();
  }
  resetZoom() {
    this.transform = { x: 60, y: 60, scale: 1 };
    this.updateZoomLabel();
    this.render();
  }
  deleteSelected() {
    if (this.selectedInstanceId) {
      const id = this.selectedInstanceId;
      this.design.instances = this.design.instances.filter((i) => i.id !== id);
      this.design.nets = this.design.nets.filter((n) => {
        if (n.source?.instanceId === id) return false;
        n.targets = n.targets.filter((t) => t.instanceId !== id);
        return true;
      });
      this.selectedInstanceId = null;
      this.render();
      this.notifyChange();
      this.notifySelection();
    } else if (this.selectedNetId) {
      this.design.nets = this.design.nets.filter((n) => n.id !== this.selectedNetId);
      this.selectedNetId = null;
      this.render();
      this.notifyChange();
    }
  }
  addModule(moduleId, name) {
    const modDef = (0, import_catalog.getModuleDef)(moduleId);
    const count = this.design.instances.filter((i) => i.moduleId === moduleId).length + 1;
    const instName = name || `u_${moduleId}_${count}`;
    const id = `${moduleId}_${Date.now()}`;
    const viewCenterX = (-this.transform.x + this.canvas.clientWidth / 2) / this.transform.scale;
    const viewCenterY = (-this.transform.y + this.canvas.clientHeight / 2) / this.transform.scale;
    const defaultParams = {};
    if (modDef) {
      for (const p of modDef.parameters) {
        defaultParams[p.name] = p.default;
      }
    }
    const newInst = {
      id,
      moduleId,
      name: instName,
      position: {
        x: Math.round(viewCenterX / 20) * 20 - 100,
        y: Math.round(viewCenterY / 20) * 20 - 80
      },
      parameters: defaultParams
    };
    this.design.instances.push(newInst);
    this.selectedInstanceId = newInst.id;
    this.render();
    this.notifyChange();
    this.notifySelection();
    return newInst;
  }
  notifyChange() {
    this.design.metadata.modified = (/* @__PURE__ */ new Date()).toISOString();
    if (this.onChangeCallback) {
      this.onChangeCallback(this.design);
    }
  }
  notifySelection() {
    if (this.onSelectCallback) {
      const inst = this.design.instances.find((i) => i.id === this.selectedInstanceId) || null;
      this.onSelectCallback(inst);
    }
  }
  screenToWorld(sx, sy) {
    return {
      x: (sx - this.transform.x) / this.transform.scale,
      y: (sy - this.transform.y) / this.transform.scale
    };
  }
  getAllPortPositions() {
    const ports = [];
    for (const inst of this.design.instances) {
      const modDef = (0, import_catalog.getModuleDef)(inst.moduleId);
      if (!modDef) continue;
      const width = modDef.defaultWidth || 200;
      const height = modDef.defaultHeight || 200;
      const inputPorts = modDef.ports.filter((p) => p.direction === "input");
      const outputPorts = modDef.ports.filter((p) => p.direction === "output");
      const inoutPorts = modDef.ports.filter((p) => p.direction === "inout");
      const inSpacing = height / (inputPorts.length + 1);
      inputPorts.forEach((p, idx) => {
        const effectiveWidth = (0, import_drc.getEffectivePortWidth)(modDef, p, inst);
        ports.push({
          instanceId: inst.id,
          portId: p.id,
          x: inst.position.x,
          y: inst.position.y + inSpacing * (idx + 1),
          direction: "input",
          width: effectiveWidth,
          name: p.name,
          type: p.type
        });
      });
      const outSpacing = height / (outputPorts.length + 1);
      outputPorts.forEach((p, idx) => {
        const effectiveWidth = (0, import_drc.getEffectivePortWidth)(modDef, p, inst);
        ports.push({
          instanceId: inst.id,
          portId: p.id,
          x: inst.position.x + width,
          y: inst.position.y + outSpacing * (idx + 1),
          direction: "output",
          width: effectiveWidth,
          name: p.name,
          type: p.type
        });
      });
      const inoutSpacing = width / (inoutPorts.length + 1);
      inoutPorts.forEach((p, idx) => {
        const effectiveWidth = (0, import_drc.getEffectivePortWidth)(modDef, p, inst);
        ports.push({
          instanceId: inst.id,
          portId: p.id,
          x: inst.position.x + inoutSpacing * (idx + 1),
          y: inst.position.y + height,
          direction: "inout",
          width: effectiveWidth,
          name: p.name,
          type: p.type
        });
      });
    }
    return ports;
  }
  setupEvents() {
    let hasMoved = false;
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const mouse = { x: e.offsetX, y: e.offsetY };
      const newScale = Math.max(0.2, Math.min(3, this.transform.scale * zoomFactor));
      this.transform.x = mouse.x - (mouse.x - this.transform.x) * (newScale / this.transform.scale);
      this.transform.y = mouse.y - (mouse.y - this.transform.y) * (newScale / this.transform.scale);
      this.transform.scale = newScale;
      this.updateZoomLabel();
      this.render();
    });
    this.canvas.addEventListener("mousedown", (e) => {
      const world = this.screenToWorld(e.offsetX, e.offsetY);
      hasMoved = false;
      const allPorts = this.getAllPortPositions();
      const clickedPort = allPorts.find((p) => {
        const dist = Math.hypot(p.x - world.x, p.y - world.y);
        return dist <= 10;
      });
      if (clickedPort) {
        this.wiringSource = clickedPort;
        this.wiringCurrent = { x: world.x, y: world.y };
        this.render();
        return;
      }
      if (e.button === 1 || e.altKey || e.shiftKey) {
        this.isPanning = true;
        this.panStart = { x: e.clientX - this.transform.x, y: e.clientY - this.transform.y };
        return;
      }
      const clickedInst = [...this.design.instances].reverse().find((inst) => {
        const modDef = (0, import_catalog.getModuleDef)(inst.moduleId);
        const w = modDef?.defaultWidth || 200;
        const h = modDef?.defaultHeight || 200;
        return world.x >= inst.position.x && world.x <= inst.position.x + w && world.y >= inst.position.y && world.y <= inst.position.y + h;
      });
      if (clickedInst) {
        this.selectedInstanceId = clickedInst.id;
        this.selectedNetId = null;
        this.draggingInstanceId = clickedInst.id;
        this.dragOffset = {
          x: world.x - clickedInst.position.x,
          y: world.y - clickedInst.position.y
        };
        this.notifySelection();
        this.render();
        return;
      }
      this.selectedInstanceId = null;
      this.selectedNetId = null;
      this.isPanning = true;
      this.panStart = { x: e.clientX - this.transform.x, y: e.clientY - this.transform.y };
      this.notifySelection();
      this.render();
    });
    window.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const world = this.screenToWorld(mouseX, mouseY);
      if (this.isPanning) {
        this.transform.x = e.clientX - this.panStart.x;
        this.transform.y = e.clientY - this.panStart.y;
        this.render();
        return;
      }
      if (this.wiringSource) {
        this.wiringCurrent = { x: world.x, y: world.y };
        const allPorts2 = this.getAllPortPositions();
        this.hoveredPort = allPorts2.find((p) => {
          if (p.instanceId === this.wiringSource.instanceId) return false;
          const dist = Math.hypot(p.x - world.x, p.y - world.y);
          return dist <= 12;
        }) || null;
        this.render();
        return;
      }
      if (this.draggingInstanceId) {
        hasMoved = true;
        const inst = this.design.instances.find((i) => i.id === this.draggingInstanceId);
        if (inst) {
          const rawX = world.x - this.dragOffset.x;
          const rawY = world.y - this.dragOffset.y;
          inst.position.x = Math.round(rawX / 20) * 20;
          inst.position.y = Math.round(rawY / 20) * 20;
          this.render();
        }
        return;
      }
      const allPorts = this.getAllPortPositions();
      const port = allPorts.find((p) => Math.hypot(p.x - world.x, p.y - world.y) <= 10);
      if (port !== this.hoveredPort) {
        this.hoveredPort = port || null;
        this.canvas.style.cursor = port ? "crosshair" : "default";
        this.render();
      }
    });
    window.addEventListener("mouseup", () => {
      if (this.isPanning) {
        this.isPanning = false;
      }
      if (this.draggingInstanceId) {
        this.draggingInstanceId = null;
        if (hasMoved) {
          this.notifyChange();
        }
      }
      if (this.wiringSource) {
        if (this.hoveredPort) {
          this.completeConnection(this.wiringSource, this.hoveredPort);
        }
        this.wiringSource = null;
        this.hoveredPort = null;
        this.render();
      }
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
        this.deleteSelected();
      }
    });
  }
  completeConnection(src, dst) {
    let outputPort = src.direction === "output" ? src : dst.direction === "output" ? dst : src;
    let inputPort = src.direction === "input" ? src : dst.direction === "input" ? dst : dst;
    let existingNet = this.design.nets.find(
      (n) => n.source?.instanceId === outputPort.instanceId && n.source?.portId === outputPort.portId
    );
    if (existingNet) {
      const alreadyConnected = existingNet.targets.some(
        (t) => t.instanceId === inputPort.instanceId && t.portId === inputPort.portId
      );
      if (!alreadyConnected) {
        existingNet.targets.push({ instanceId: inputPort.instanceId, portId: inputPort.portId });
      }
    } else {
      const netName = `net_${outputPort.name}_to_${inputPort.name}_${this.design.nets.length + 1}`;
      const newNet = {
        id: `net_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
        name: netName,
        width: outputPort.width || inputPort.width || 1,
        source: { instanceId: outputPort.instanceId, portId: outputPort.portId },
        targets: [{ instanceId: inputPort.instanceId, portId: inputPort.portId }]
      };
      this.design.nets.push(newNet);
    }
    this.notifyChange();
    this.render();
  }
  render() {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#111318";
    ctx.fillRect(0, 0, w, h);
    ctx.translate(this.transform.x, this.transform.y);
    ctx.scale(this.transform.scale, this.transform.scale);
    this.drawGrid(ctx, w, h);
    this.drawNets(ctx);
    if (this.wiringSource) {
      this.drawRubberBandWire(ctx, this.wiringSource, this.wiringCurrent, this.hoveredPort);
    }
    this.drawInstances(ctx);
    ctx.restore();
  }
  drawGrid(ctx, screenW, screenH) {
    const gridSize = 20;
    const start = this.screenToWorld(0, 0);
    const end = this.screenToWorld(screenW, screenH);
    const minX = Math.floor(start.x / gridSize) * gridSize;
    const maxX = Math.ceil(end.x / gridSize) * gridSize;
    const minY = Math.floor(start.y / gridSize) * gridSize;
    const maxY = Math.ceil(end.y / gridSize) * gridSize;
    ctx.fillStyle = "#272c38";
    for (let x = minX; x <= maxX; x += gridSize) {
      for (let y = minY; y <= maxY; y += gridSize) {
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }
  }
  drawNets(ctx) {
    const portMap = /* @__PURE__ */ new Map();
    for (const p of this.getAllPortPositions()) {
      portMap.set(`${p.instanceId}:${p.portId}`, p);
    }
    for (const net of this.design.nets) {
      const srcPos = net.source ? portMap.get(`${net.source.instanceId}:${net.source.portId}`) : null;
      if (!srcPos) continue;
      const isSelected = this.selectedNetId === net.id;
      const isBus = net.width > 1;
      for (const tgt of net.targets) {
        const tgtPos = portMap.get(`${tgt.instanceId}:${tgt.portId}`);
        if (!tgtPos) continue;
        this.drawOrthogonalWire(ctx, srcPos, tgtPos, isBus, isSelected, net.width);
      }
    }
  }
  drawOrthogonalWire(ctx, src, tgt, isBus, isSelected, width) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    const midX = (src.x + tgt.x) / 2;
    ctx.lineTo(midX, src.y);
    ctx.lineTo(midX, tgt.y);
    ctx.lineTo(tgt.x, tgt.y);
    if (isSelected) {
      ctx.shadowColor = "#a8c7fa";
      ctx.shadowBlur = 12;
      ctx.strokeStyle = "#a8c7fa";
      ctx.lineWidth = isBus ? 4.5 : 3;
    } else {
      ctx.strokeStyle = isBus ? "#7fcfff" : "#8e919a";
      ctx.lineWidth = isBus ? 3 : 1.75;
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    if (isBus) {
      const slashX = midX;
      const slashY = (src.y + tgt.y) / 2;
      ctx.beginPath();
      ctx.moveTo(slashX - 4, slashY + 5);
      ctx.lineTo(slashX + 4, slashY - 5);
      ctx.strokeStyle = "#7fcfff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const widthLabel = `[${width - 1}:0]`;
      ctx.font = '9px "Roboto Mono", monospace';
      const textWidth = ctx.measureText(widthLabel).width;
      const pillW = textWidth + 8;
      const pillH = 14;
      ctx.fillStyle = "#0842a0";
      ctx.strokeStyle = "#7fcfff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(slashX + 7, slashY - 8, pillW, pillH, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#d3e3fd";
      ctx.fillText(widthLabel, slashX + 11, slashY + 3);
    }
    ctx.restore();
  }
  drawRubberBandWire(ctx, src, current, targetPort) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    const midX = (src.x + current.x) / 2;
    ctx.lineTo(midX, src.y);
    ctx.lineTo(midX, current.y);
    ctx.lineTo(current.x, current.y);
    let color = "#a8c7fa";
    if (targetPort) {
      color = targetPort.width === src.width ? "#6dd58c" : "#f2b8b5";
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  }
  drawInstances(ctx) {
    for (const inst of this.design.instances) {
      const modDef = (0, import_catalog.getModuleDef)(inst.moduleId);
      const isSelected = this.selectedInstanceId === inst.id;
      const w = modDef?.defaultWidth || 200;
      const h = modDef?.defaultHeight || 200;
      ctx.save();
      ctx.shadowColor = isSelected ? "rgba(168, 199, 250, 0.4)" : "rgba(0, 0, 0, 0.45)";
      ctx.shadowBlur = isSelected ? 18 : 8;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = "#1a1d26";
      ctx.beginPath();
      ctx.roundRect(inst.position.x, inst.position.y, w, h, 12);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isSelected ? "#a8c7fa" : "#272c38";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();
      ctx.fillStyle = this.getCategoryColor(modDef?.category || "infrastructure");
      ctx.beginPath();
      ctx.roundRect(inst.position.x, inst.position.y, w, 32, [12, 12, 0, 0]);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = 'bold 13px "Google Sans", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(inst.name, inst.position.x + 12, inst.position.y + 20);
      if (modDef?.category) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
        const catText = modDef.category.toUpperCase();
        ctx.font = 'bold 8px "Google Sans", "Roboto", sans-serif';
        const catW = ctx.measureText(catText).width;
        ctx.beginPath();
        ctx.roundRect(inst.position.x + w - catW - 16, inst.position.y + 8, catW + 10, 16, 6);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillText(catText, inst.position.x + w - catW - 11, inst.position.y + 19);
      }
      ctx.fillStyle = "#8e919a";
      ctx.font = '10px "Roboto Mono", monospace';
      ctx.fillText(modDef?.name || inst.moduleId, inst.position.x + 12, inst.position.y + 48);
      if (modDef) {
        const inputPorts = modDef.ports.filter((p) => p.direction === "input");
        const outputPorts = modDef.ports.filter((p) => p.direction === "output");
        const inoutPorts = modDef.ports.filter((p) => p.direction === "inout");
        const inSpacing = h / (inputPorts.length + 1);
        inputPorts.forEach((p, idx) => {
          const effectiveWidth = (0, import_drc.getEffectivePortWidth)(modDef, p, inst);
          const px = inst.position.x;
          const py = inst.position.y + inSpacing * (idx + 1);
          this.drawPortPin(ctx, px, py, p, effectiveWidth, "left");
        });
        const outSpacing = h / (outputPorts.length + 1);
        outputPorts.forEach((p, idx) => {
          const effectiveWidth = (0, import_drc.getEffectivePortWidth)(modDef, p, inst);
          const px = inst.position.x + w;
          const py = inst.position.y + outSpacing * (idx + 1);
          this.drawPortPin(ctx, px, py, p, effectiveWidth, "right");
        });
        const inoutSpacing = w / (inoutPorts.length + 1);
        inoutPorts.forEach((p, idx) => {
          const effectiveWidth = (0, import_drc.getEffectivePortWidth)(modDef, p, inst);
          const px = inst.position.x + inoutSpacing * (idx + 1);
          const py = inst.position.y + h;
          this.drawPortPin(ctx, px, py, p, effectiveWidth, "bottom");
        });
      }
      ctx.restore();
    }
  }
  drawPortPin(ctx, x, y, port, width, align) {
    const isBus = width > 1;
    const isHovered = this.hoveredPort?.portId === port.id && this.hoveredPort?.x === x && this.hoveredPort?.y === y;
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(168, 199, 250, 0.25)";
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, isBus ? 5 : 4, 0, Math.PI * 2);
    ctx.fillStyle = this.getPortTypeColor(port.type);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = isBus ? 1.5 : 1;
    ctx.stroke();
    ctx.fillStyle = "#c4c6d0";
    ctx.font = '11px "Roboto Mono", monospace';
    const label = isBus ? `${port.name}[${width - 1}:0]` : port.name;
    if (align === "left") {
      ctx.textAlign = "left";
      ctx.fillText(label, x + 8, y + 4);
    } else if (align === "right") {
      ctx.textAlign = "right";
      ctx.fillText(label, x - 8, y + 4);
    } else {
      ctx.textAlign = "center";
      ctx.fillText(label, x, y - 8);
    }
  }
  getCategoryColor(category) {
    switch (category) {
      case "processor":
        return "#0842a0";
      // Primary Container
      case "interconnect":
        return "#4f378b";
      // Tertiary Container
      case "memory":
        return "#601410";
      // Dark Crimson Container
      case "peripheral":
        return "#004d67";
      // Secondary Container
      case "infrastructure":
        return "#0a5223";
      // Success Container
      default:
        return "#272c38";
    }
  }
  getPortTypeColor(type) {
    switch (type) {
      case "clock":
        return "#d0bcff";
      // Tertiary
      case "reset":
        return "#fbc02d";
      // Warning
      case "bus":
        return "#7fcfff";
      // Secondary
      case "data":
        return "#6dd58c";
      // Success
      default:
        return "#8e919a";
    }
  }
};

// apps/web/src/waveform.ts
var import_vcd = __toESM(require_vcd());
var WaveformViewer = class {
  container;
  canvas;
  ctx;
  trace = null;
  radix = "hex";
  zoom = 1;
  panOffset = 0;
  cursorTime = null;
  constructor(container) {
    this.container = container;
    this.container.innerHTML = `
      <div class="waveform-shell">
        <div class="waveform-toolbar">
          <div class="wf-btn-group">
            <button class="wf-btn" id="wf-zoom-in" title="Zoom In">+</button>
            <button class="wf-btn" id="wf-zoom-out" title="Zoom Out">-</button>
            <button class="wf-btn" id="wf-zoom-reset" title="Fit Timeline">Fit</button>
          </div>
          <div class="wf-radix-picker">
            <label>Radix:</label>
            <select id="wf-radix-select" class="wf-select">
              <option value="hex" selected>Hex</option>
              <option value="dec">Dec</option>
              <option value="bin">Bin</option>
            </select>
          </div>
          <div class="wf-cursor-info" id="wf-cursor-val">Cursor: None</div>
        </div>
        <div class="waveform-body">
          <div class="waveform-sidebar" id="wf-sidebar"></div>
          <div class="waveform-canvas-wrap">
            <canvas id="wf-canvas"></canvas>
          </div>
        </div>
      </div>
    `;
    const canvasEl = this.container.querySelector("#wf-canvas");
    if (!canvasEl) throw new Error("Could not find waveform canvas");
    this.canvas = canvasEl;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) throw new Error("Could not get waveform canvas context");
    this.ctx = ctx;
    this.setupEvents();
    this.resize();
  }
  setTrace(trace) {
    this.trace = trace;
    this.cursorTime = 0;
    this.fitTimeline();
    this.render();
  }
  setRadix(radix) {
    this.radix = radix;
    this.render();
  }
  resize() {
    const wrap = this.canvas.parentElement;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.render();
  }
  fitTimeline() {
    if (!this.trace || this.trace.maxTime <= 0) return;
    const wrap = this.canvas.parentElement;
    const clientW = wrap?.clientWidth || 600;
    this.zoom = (clientW - 60) / this.trace.maxTime;
    this.panOffset = 20;
  }
  setupEvents() {
    this.container.querySelector("#wf-zoom-in")?.addEventListener("click", () => {
      this.zoom *= 1.25;
      this.render();
    });
    this.container.querySelector("#wf-zoom-out")?.addEventListener("click", () => {
      this.zoom = Math.max(0.1, this.zoom / 1.25);
      this.render();
    });
    this.container.querySelector("#wf-zoom-reset")?.addEventListener("click", () => {
      this.fitTimeline();
      this.render();
    });
    const radixSelect = this.container.querySelector("#wf-radix-select");
    radixSelect?.addEventListener("change", () => {
      this.setRadix(radixSelect.value);
    });
    this.canvas.addEventListener("click", (e) => {
      if (!this.trace) return;
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const time = Math.round((clickX - this.panOffset) / this.zoom);
      this.cursorTime = Math.max(0, Math.min(this.trace.maxTime, time));
      this.render();
    });
    window.addEventListener("resize", () => this.resize());
  }
  render() {
    if (!this.trace) {
      this.ctx.fillStyle = "#111318";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "#8e919a";
      this.ctx.font = '13px "Google Sans", "Roboto", sans-serif';
      this.ctx.fillText('No simulation trace loaded. Click "Run Simulation" above to execute Wasm simulation.', 24, 40);
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;
    const rowHeight = 36;
    const headerHeight = 28;
    this.ctx.save();
    this.ctx.scale(dpr, dpr);
    this.ctx.fillStyle = "#111318";
    this.ctx.fillRect(0, 0, w, h);
    this.updateSidebar();
    this.drawTimelineHeader(w, headerHeight);
    let y = headerHeight;
    for (const sig of this.trace.signals) {
      const changes = this.trace.signalChanges.get(sig.name) || [];
      this.drawSignalRow(y, rowHeight, sig.width, changes, w);
      y += rowHeight;
    }
    if (this.cursorTime !== null) {
      const cursorX = this.panOffset + this.cursorTime * this.zoom;
      this.ctx.strokeStyle = "#f2b8b5";
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([3, 3]);
      this.ctx.beginPath();
      this.ctx.moveTo(cursorX, 0);
      this.ctx.lineTo(cursorX, h);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      const infoEl = this.container.querySelector("#wf-cursor-val");
      if (infoEl) infoEl.textContent = `Cursor: ${this.cursorTime} ${this.trace.timescale}`;
    }
    this.ctx.restore();
  }
  drawTimelineHeader(w, headerH) {
    this.ctx.fillStyle = "#1a1d26";
    this.ctx.fillRect(0, 0, w, headerH);
    this.ctx.strokeStyle = "#44474f";
    this.ctx.beginPath();
    this.ctx.moveTo(0, headerH);
    this.ctx.lineTo(w, headerH);
    this.ctx.stroke();
    if (!this.trace) return;
    const maxT = this.trace.maxTime || 100;
    const tickStep = Math.max(5, Math.pow(10, Math.floor(Math.log10(maxT / 5))));
    this.ctx.fillStyle = "#8e919a";
    this.ctx.font = '10px "Roboto Mono", monospace';
    for (let t = 0; t <= maxT; t += tickStep) {
      const x = this.panOffset + t * this.zoom;
      if (x < 0 || x > w) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(x, headerH - 6);
      this.ctx.lineTo(x, headerH);
      this.ctx.strokeStyle = "#44474f";
      this.ctx.stroke();
      this.ctx.fillText(`${t}ns`, x + 3, headerH - 8);
    }
  }
  drawSignalRow(y, rowH, width, changes, canvasW) {
    this.ctx.strokeStyle = "#20242f";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, y + rowH);
    this.ctx.lineTo(canvasW, y + rowH);
    this.ctx.stroke();
    const highY = y + 8;
    const lowY = y + rowH - 8;
    const midY = (highY + lowY) / 2;
    if (width === 1) {
      this.ctx.strokeStyle = "#7fcfff";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      let currentVal = "0";
      let prevX = this.panOffset;
      let prevY = lowY;
      this.ctx.moveTo(prevX, prevY);
      for (const ch of changes) {
        const nextX = this.panOffset + ch.time * this.zoom;
        const nextY = ch.value === "1" ? highY : lowY;
        this.ctx.lineTo(nextX, prevY);
        this.ctx.lineTo(nextX, nextY);
        prevX = nextX;
        prevY = nextY;
        currentVal = ch.value;
      }
      if (this.trace) {
        const endX = this.panOffset + this.trace.maxTime * this.zoom;
        this.ctx.lineTo(endX, prevY);
      }
      this.ctx.stroke();
    } else {
      this.ctx.strokeStyle = "#7fcfff";
      this.ctx.fillStyle = "#004d67";
      this.ctx.lineWidth = 1.5;
      let prevX = this.panOffset;
      let prevVal = "0";
      for (let i = 0; i < changes.length; i++) {
        const ch = changes[i];
        const nextX = this.panOffset + ch.time * this.zoom;
        if (nextX > prevX + 2) {
          this.ctx.beginPath();
          this.ctx.moveTo(prevX + 2, highY);
          this.ctx.lineTo(nextX - 2, highY);
          this.ctx.lineTo(nextX, midY);
          this.ctx.lineTo(nextX - 2, lowY);
          this.ctx.lineTo(prevX + 2, lowY);
          this.ctx.lineTo(prevX, midY);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
          const formatted = (0, import_vcd.formatSignalValue)(prevVal, width, this.radix);
          if (nextX - prevX > 28) {
            this.ctx.fillStyle = "#c2e7ff";
            this.ctx.font = '10px "Roboto Mono", monospace';
            this.ctx.fillText(formatted, prevX + 6, midY + 3);
          }
        }
        prevX = nextX;
        prevVal = ch.value;
      }
      if (this.trace) {
        const endX = this.panOffset + this.trace.maxTime * this.zoom;
        if (endX > prevX) {
          this.ctx.beginPath();
          this.ctx.moveTo(prevX + 2, highY);
          this.ctx.lineTo(endX, highY);
          this.ctx.lineTo(endX, lowY);
          this.ctx.lineTo(prevX + 2, lowY);
          this.ctx.lineTo(prevX, midY);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
          const formatted = (0, import_vcd.formatSignalValue)(prevVal, width, this.radix);
          this.ctx.fillStyle = "#c2e7ff";
          this.ctx.font = '10px "Roboto Mono", monospace';
          this.ctx.fillText(formatted, prevX + 6, midY + 3);
        }
      }
    }
  }
  updateSidebar() {
    const sb = this.container.querySelector("#wf-sidebar");
    if (!sb || !this.trace) return;
    let html = '<div class="wf-sidebar-header">Signal</div>';
    for (const sig of this.trace.signals) {
      let curVal = "0";
      const changes = this.trace.signalChanges.get(sig.name) || [];
      for (const ch of changes) {
        if (this.cursorTime !== null && ch.time <= this.cursorTime) {
          curVal = ch.value;
        } else if (this.cursorTime === null) {
          break;
        }
      }
      const formattedVal = (0, import_vcd.formatSignalValue)(curVal, sig.width, this.radix);
      const isBus = sig.width > 1;
      html += `
        <div class="wf-sig-row ${isBus ? "is-bus" : ""}">
          <span class="wf-sig-name" title="${sig.name}">${sig.name}</span>
          <span class="wf-sig-val">${formattedVal}</span>
        </div>
      `;
    }
    sb.innerHTML = html;
  }
};

// apps/web/src/app.ts
var KonaApp = class {
  canvas;
  waveformViewer;
  design;
  selectedInstance = null;
  diagnostics = [];
  constructor() {
    this.design = this.loadDesignFromHash() || import_catalog2.STARTER_TEMPLATES[0].createDesign();
    const canvasEl = document.getElementById("schematic-canvas");
    this.canvas = new SchematicCanvas(canvasEl, this.design);
    const wfContainer = document.getElementById("waveform-container");
    this.waveformViewer = new WaveformViewer(wfContainer);
    this.canvas.onSelectionChange((inst) => {
      this.selectedInstance = inst;
      this.renderInspector();
    });
    this.canvas.onDesignChange((newDesign) => {
      this.design = newDesign;
      this.onDesignUpdated();
    });
    this.setupCatalogSidebar();
    this.setupTemplatesPicker();
    this.setupHeaderActions();
    this.setupBottomDrawerTabs();
    this.setupSimulationControls();
    this.onDesignUpdated();
    this.renderInspector();
  }
  onDesignUpdated() {
    this.diagnostics = (0, import_drc2.runDesignRuleCheck)(this.design);
    this.renderDrcStatus();
    const svCode = (0, import_codegen.generateSystemVerilog)(this.design);
    const codeEl = document.getElementById("sv-code-output");
    if (codeEl) codeEl.textContent = svCode;
    const lineNumbersEl = document.getElementById("code-line-numbers");
    if (lineNumbersEl) {
      const lineCount = svCode.split("\n").length;
      lineNumbersEl.innerHTML = Array.from({ length: lineCount }, (_, i) => `<div>${i + 1}</div>`).join("");
    }
    this.saveDesignToHash();
  }
  renderDrcStatus() {
    const chipEl = document.getElementById("drc-status-chip");
    const panelEl = document.getElementById("drc-panel-body");
    const errors = this.diagnostics.filter((d) => d.severity === "error");
    const warnings = this.diagnostics.filter((d) => d.severity === "warning");
    if (chipEl) {
      if (errors.length > 0) {
        chipEl.className = "status-chip error";
        chipEl.textContent = `${errors.length} DRC Error${errors.length > 1 ? "s" : ""}`;
      } else if (warnings.length > 0) {
        chipEl.className = "status-chip warning";
        chipEl.textContent = `${warnings.length} DRC Warning${warnings.length > 1 ? "s" : ""}`;
      } else {
        chipEl.className = "status-chip success";
        chipEl.textContent = "DRC Passed";
      }
    }
    if (panelEl) {
      if (this.diagnostics.length === 0) {
        panelEl.innerHTML = '<div class="drc-empty">All design rules satisfied. Clean netlist!</div>';
      } else {
        panelEl.innerHTML = this.diagnostics.map((d) => `
          <div class="drc-item ${d.severity}">
            <div class="drc-item-rule">${d.rule}</div>
            <div class="drc-item-msg">${escapeHtml(d.message)}</div>
          </div>
        `).join("");
      }
    }
  }
  renderInspector() {
    const container = document.getElementById("inspector-content");
    if (!container) return;
    if (!this.selectedInstance) {
      container.innerHTML = `
        <div class="inspector-empty">
          <div class="empty-graphic">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <div class="empty-icon">Select a Block</div>
          <p>Click on any module on the schematic canvas to inspect its ports and tune parameters.</p>
        </div>
      `;
      return;
    }
    const inst = this.selectedInstance;
    const modDef = (0, import_catalog2.getModuleDef)(inst.moduleId);
    let html = `
      <div class="inspector-header">
        <span class="inspector-badge">${modDef?.category || "module"}</span>
        <h3>${escapeHtml(inst.name)}</h3>
        <p class="inspector-desc">${modDef?.description || ""}</p>
      </div>

      <div class="inspector-section">
        <label class="section-title">Instance Name</label>
        <input type="text" id="inspector-inst-name" class="kona-input" value="${escapeHtml(inst.name)}" />
      </div>

      <div class="inspector-section">
        <label class="section-title">Parameters</label>
        <div class="params-list">
    `;
    if (modDef && modDef.parameters.length > 0) {
      for (const p of modDef.parameters) {
        const val = inst.parameters[p.name] !== void 0 ? inst.parameters[p.name] : p.default;
        html += `
          <div class="param-row">
            <div class="param-meta">
              <span class="param-name">${p.name}</span>
              <span class="param-desc">${p.description}</span>
            </div>
        `;
        if (p.type === "boolean") {
          html += `
            <input type="checkbox" class="param-bool" data-param="${p.name}" ${val ? "checked" : ""} />
          `;
        } else if (p.type === "integer") {
          html += `
            <input type="number" class="kona-input param-num" data-param="${p.name}" value="${val}" />
          `;
        } else {
          html += `
            <input type="text" class="kona-input param-str" data-param="${p.name}" value="${escapeHtml(String(val))}" />
          `;
        }
        html += `</div>`;
      }
    } else {
      html += `<div class="empty-text">No configurable parameters.</div>`;
    }
    html += `
        </div>
      </div>

      <div class="inspector-section">
        <label class="section-title">Ports</label>
        <div class="ports-list">
    `;
    if (modDef) {
      for (const port of modDef.ports) {
        const isBus = port.width > 1;
        html += `
          <div class="port-row">
            <span class="port-dir ${port.direction}">${port.direction.toUpperCase()}</span>
            <span class="port-name">${port.name}${isBus ? `[${port.width - 1}:0]` : ""}</span>
            <span class="port-type">${port.type}</span>
          </div>
        `;
      }
    }
    html += `
        </div>
      </div>
      <div class="inspector-footer">
        <button id="btn-delete-module" class="btn-danger">Delete Module</button>
      </div>
    `;
    container.innerHTML = html;
    const nameInput = document.getElementById("inspector-inst-name");
    nameInput?.addEventListener("input", () => {
      inst.name = nameInput.value;
      this.canvas.render();
      this.onDesignUpdated();
    });
    container.querySelectorAll(".param-bool").forEach((el) => {
      el.addEventListener("change", (e) => {
        const pName = e.target.dataset.param;
        inst.parameters[pName] = e.target.checked;
        this.onDesignUpdated();
      });
    });
    container.querySelectorAll(".param-num").forEach((el) => {
      el.addEventListener("input", (e) => {
        const pName = e.target.dataset.param;
        inst.parameters[pName] = parseInt(e.target.value, 10) || 0;
        this.onDesignUpdated();
      });
    });
    container.querySelectorAll(".param-str").forEach((el) => {
      el.addEventListener("input", (e) => {
        const pName = e.target.dataset.param;
        inst.parameters[pName] = e.target.value;
        this.onDesignUpdated();
      });
    });
    document.getElementById("btn-delete-module")?.addEventListener("click", () => {
      this.canvas.deleteSelected();
    });
  }
  setupCatalogSidebar() {
    const listEl = document.getElementById("catalog-items-list");
    if (!listEl) return;
    let activeFilter = "all";
    let searchQuery = "";
    const getFilteredItems = () => {
      return import_catalog2.STARTER_IP_CATALOG.filter((m) => {
        const matchesCategory = activeFilter === "all" || m.category === activeFilter;
        const matchesSearch = !searchQuery || m.name.toLowerCase().includes(searchQuery) || m.description.toLowerCase().includes(searchQuery) || m.category.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesSearch;
      });
    };
    const renderItems = () => {
      const items = getFilteredItems();
      if (items.length === 0) {
        listEl.innerHTML = `
          <div class="catalog-empty" style="text-align:center; padding:32px 16px; color:var(--md-sys-color-outline);">
            <p style="font-size:12px;">No matching IP modules found.</p>
          </div>
        `;
      } else {
        listEl.innerHTML = items.map((mod) => `
          <div class="catalog-card" data-module-id="${mod.id}" title="${mod.description}">
            <div class="catalog-card-header">
              <span class="catalog-category-tag ${mod.category}">${mod.category}</span>
              <span class="catalog-add-btn">+ Add</span>
            </div>
            <div class="catalog-card-title">${mod.name}</div>
            <div class="catalog-card-desc">${mod.description}</div>
          </div>
        `).join("");
        listEl.querySelectorAll(".catalog-card").forEach((card) => {
          card.addEventListener("click", () => {
            const modId = card.getAttribute("data-module-id");
            if (modId) {
              this.canvas.addModule(modId);
              showToast(`Added ${modId} to canvas`, "success");
            }
          });
        });
      }
      const countBadge = document.getElementById("catalog-count-badge");
      if (countBadge) countBadge.textContent = `${items.length} IPs`;
    };
    renderItems();
    const filterChips = document.querySelectorAll(".md-filter-chip");
    filterChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        filterChips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        activeFilter = chip.getAttribute("data-filter") || "all";
        renderItems();
      });
    });
    const searchInput = document.getElementById("catalog-search-input");
    const clearBtn = document.getElementById("catalog-search-clear");
    searchInput?.addEventListener("input", () => {
      searchQuery = (searchInput.value || "").toLowerCase().trim();
      if (clearBtn) clearBtn.style.display = searchQuery ? "inline-block" : "none";
      renderItems();
    });
    clearBtn?.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      searchQuery = "";
      clearBtn.style.display = "none";
      renderItems();
    });
  }
  setupTemplatesPicker() {
    const container = document.getElementById("templates-picker");
    if (!container) return;
    container.innerHTML = `
      <label class="picker-label">Architecture Template:</label>
      <select id="template-select" class="kona-select">
        ${import_catalog2.STARTER_TEMPLATES.map((t) => `<option value="${t.id}">${t.name}</option>`).join("")}
      </select>
    `;
    const selectEl = container.querySelector("#template-select");
    selectEl?.addEventListener("change", () => {
      const tmpl = import_catalog2.STARTER_TEMPLATES.find((t) => t.id === selectEl.value);
      if (tmpl && confirm(`Load template "${tmpl.name}"? Current canvas edits will be replaced.`)) {
        this.design = tmpl.createDesign();
        this.canvas.setDesign(this.design);
        this.onDesignUpdated();
        showToast(`Loaded ${tmpl.name}`, "info");
      }
    });
  }
  setupHeaderActions() {
    document.getElementById("btn-zoom-in")?.addEventListener("click", () => this.canvas.zoomIn());
    document.getElementById("btn-zoom-out")?.addEventListener("click", () => this.canvas.zoomOut());
    document.getElementById("btn-zoom-reset")?.addEventListener("click", () => this.canvas.resetZoom());
    const modalEl = document.getElementById("shortcuts-modal");
    const openModal = () => {
      if (modalEl) modalEl.style.display = "flex";
    };
    const closeModal = () => {
      if (modalEl) modalEl.style.display = "none";
    };
    document.getElementById("btn-shortcuts")?.addEventListener("click", openModal);
    document.getElementById("modal-close-btn")?.addEventListener("click", closeModal);
    document.getElementById("modal-confirm-btn")?.addEventListener("click", closeModal);
    modalEl?.addEventListener("click", (e) => {
      if (e.target === modalEl) closeModal();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "?" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "")) {
        openModal();
      } else if (e.key === "Escape" && modalEl?.style.display === "flex") {
        closeModal();
      }
    });
    const drawerEl = document.getElementById("app-bottom-drawer");
    const toggleDrawerBtn = document.getElementById("btn-toggle-drawer");
    let drawerState = "normal";
    toggleDrawerBtn?.addEventListener("click", () => {
      if (drawerState === "normal") {
        drawerEl?.classList.add("minimized");
        drawerState = "minimized";
        toggleDrawerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>`;
      } else if (drawerState === "minimized") {
        drawerEl?.classList.remove("minimized");
        drawerEl?.classList.add("expanded");
        drawerState = "expanded";
        toggleDrawerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
      } else {
        drawerEl?.classList.remove("expanded");
        drawerState = "normal";
        toggleDrawerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
      }
      this.waveformViewer.resize();
    });
    const drcChip = document.getElementById("drc-status-chip");
    const drcToggle = document.getElementById("drc-panel-toggle");
    const drcBody = document.getElementById("drc-panel-body");
    const toggleDrc = () => {
      if (drcBody) {
        drcBody.style.display = drcBody.style.display === "none" ? "flex" : "none";
      }
    };
    drcChip?.addEventListener("click", toggleDrc);
    drcToggle?.addEventListener("click", toggleDrc);
    document.getElementById("btn-export-json")?.addEventListener("click", () => {
      const json = (0, import_ir.serializeKonaDesign)(this.design);
      downloadFile(json, `${this.design.topModule || "chip"}.kona.json`, "application/json");
      showToast("Exported .kona.json netlist", "success");
    });
    document.getElementById("btn-export-sv")?.addEventListener("click", () => {
      const sv = (0, import_codegen.generateSystemVerilog)(this.design);
      downloadFile(sv, `${this.design.topModule || "top"}.sv`, "text/plain");
      showToast("Exported synthesizable top.sv", "success");
    });
    document.getElementById("btn-copy-sv")?.addEventListener("click", () => {
      const sv = (0, import_codegen.generateSystemVerilog)(this.design);
      navigator.clipboard.writeText(sv).then(() => {
        showToast("SystemVerilog top.sv copied to clipboard!", "success");
      });
    });
    document.getElementById("btn-share-link")?.addEventListener("click", () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        showToast("Shareable architecture link copied!", "info");
      });
    });
  }
  setupBottomDrawerTabs() {
    const tabs = document.querySelectorAll(".drawer-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const target = tab.getAttribute("data-target");
        document.querySelectorAll(".drawer-pane").forEach((p) => p.classList.remove("active"));
        document.getElementById(`pane-${target}`)?.classList.add("active");
        if (target === "waveform") {
          this.waveformViewer.resize();
        }
      });
    });
  }
  setupSimulationControls() {
    const runBtn = document.getElementById("btn-run-sim");
    const cyclesInput = document.getElementById("sim-cycles");
    runBtn?.addEventListener("click", () => {
      const cycles = parseInt(cyclesInput?.value || "64", 10);
      const simStatus = document.getElementById("sim-status-msg");
      if (simStatus) simStatus.textContent = "Simulating in WebAssembly...";
      setTimeout(() => {
        const result = (0, import_sim.runSimulation)(this.design, cycles);
        this.waveformViewer.setTrace(result.trace);
        if (simStatus) {
          simStatus.textContent = `Completed ${result.totalCycles} cycles in ${result.durationMs}ms`;
        }
        const wfTab = document.querySelector('[data-target="waveform"]');
        wfTab?.click();
      }, 50);
    });
  }
  saveDesignToHash() {
    try {
      const json = (0, import_ir.serializeKonaDesign)(this.design);
      const encoded = btoa(encodeURIComponent(json));
      window.location.hash = `design=${encoded}`;
    } catch {
    }
  }
  loadDesignFromHash() {
    try {
      const hash = window.location.hash;
      if (hash && hash.includes("design=")) {
        const encoded = hash.split("design=")[1];
        const json = decodeURIComponent(atob(encoded));
        const { design, errors } = (0, import_ir.parseKonaDesign)(json);
        if (design && errors.length === 0) {
          return design;
        }
      }
    } catch {
    }
    return null;
  }
};
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function downloadFile(content, filename, mimeType) {
  const a = document.createElement("a");
  a.download = filename;
  if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    a.href = `data:${mimeType};charset=utf-8,` + encodeURIComponent(content);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.style.transition = "all 0.25s ease";
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}

// apps/web/src/index.ts
window.addEventListener("DOMContentLoaded", () => {
  try {
    new KonaApp();
    console.log("[Kona] Visual Chip Designer initialized.");
  } catch (err) {
    console.error("[Kona] Failed to initialize:", err);
  }
});
//# sourceMappingURL=bundle.js.map
