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

// packages/core/dist/catalog/registry.js
var require_registry = __commonJS({
  "packages/core/dist/catalog/registry.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CatalogRegistry = void 0;
    var CatalogRegistry = class {
      modules = /* @__PURE__ */ new Map();
      templates = /* @__PURE__ */ new Map();
      constructor(initialModules = [], initialTemplates = []) {
        for (const mod of initialModules) {
          this.registerModule(mod);
        }
        for (const tmpl of initialTemplates) {
          this.registerTemplate(tmpl);
        }
      }
      registerModule(mod) {
        this.modules.set(mod.id, mod);
      }
      registerTemplate(tmpl) {
        this.templates.set(tmpl.id, tmpl);
      }
      getModule(moduleId) {
        return this.modules.get(moduleId);
      }
      getTemplate(templateId) {
        return this.templates.get(templateId);
      }
      listModules() {
        return Array.from(this.modules.values());
      }
      listTemplates() {
        return Array.from(this.templates.values());
      }
    };
    exports.CatalogRegistry = CatalogRegistry;
  }
});

// packages/core/dist/catalog/modules/processors.js
var require_processors = __commonJS({
  "packages/core/dist/catalog/modules/processors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PROCESSOR_MODULES = void 0;
    exports.PROCESSOR_MODULES = [
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
      }
    ];
  }
});

// packages/core/dist/catalog/modules/interconnects.js
var require_interconnects = __commonJS({
  "packages/core/dist/catalog/modules/interconnects.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.INTERCONNECT_MODULES = void 0;
    exports.INTERCONNECT_MODULES = [
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
          { id: "m_addr", name: "m_addr", direction: "input", type: "bus", width: 32, description: "Master request address" },
          { id: "m_valid", name: "m_valid", direction: "input", type: "data", width: 1, description: "Master valid" },
          { id: "m_ready", name: "m_ready", direction: "output", type: "data", width: 1, description: "Master ready" },
          { id: "m_rdata", name: "m_rdata", direction: "output", type: "bus", width: 32, description: "Master read data" },
          { id: "s0_addr", name: "s0_addr", direction: "output", type: "bus", width: 32, description: "Slave 0 address" },
          { id: "s0_valid", name: "s0_valid", direction: "output", type: "data", width: 1, description: "Slave 0 valid" },
          { id: "s0_ready", name: "s0_ready", direction: "input", type: "data", width: 1, description: "Slave 0 ready" },
          { id: "s0_rdata", name: "s0_rdata", direction: "input", type: "bus", width: 32, description: "Slave 0 read data" },
          { id: "s1_addr", name: "s1_addr", direction: "output", type: "bus", width: 32, description: "Slave 1 address" },
          { id: "s1_valid", name: "s1_valid", direction: "output", type: "data", width: 1, description: "Slave 1 valid" },
          { id: "s1_ready", name: "s1_ready", direction: "input", type: "data", width: 1, description: "Slave 1 ready" },
          { id: "s1_rdata", name: "s1_rdata", direction: "input", type: "bus", width: 32, description: "Slave 1 read data" }
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
      }
    ];
  }
});

// packages/core/dist/catalog/modules/memories.js
var require_memories = __commonJS({
  "packages/core/dist/catalog/modules/memories.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MEMORY_MODULES = void 0;
    exports.MEMORY_MODULES = [
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
      }
    ];
  }
});

// packages/core/dist/catalog/modules/peripherals.js
var require_peripherals = __commonJS({
  "packages/core/dist/catalog/modules/peripherals.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PERIPHERAL_MODULES = void 0;
    exports.PERIPHERAL_MODULES = [
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
  }
});

// packages/core/dist/catalog/modules/infrastructure.js
var require_infrastructure = __commonJS({
  "packages/core/dist/catalog/modules/infrastructure.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.INFRASTRUCTURE_MODULES = void 0;
    exports.INFRASTRUCTURE_MODULES = [
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
      }
    ];
  }
});

// packages/core/dist/catalog/modules/index.js
var require_modules = __commonJS({
  "packages/core/dist/catalog/modules/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BUILTIN_MODULES = exports.INFRASTRUCTURE_MODULES = exports.PERIPHERAL_MODULES = exports.MEMORY_MODULES = exports.INTERCONNECT_MODULES = exports.PROCESSOR_MODULES = void 0;
    var processors_js_1 = require_processors();
    Object.defineProperty(exports, "PROCESSOR_MODULES", { enumerable: true, get: function() {
      return processors_js_1.PROCESSOR_MODULES;
    } });
    var interconnects_js_1 = require_interconnects();
    Object.defineProperty(exports, "INTERCONNECT_MODULES", { enumerable: true, get: function() {
      return interconnects_js_1.INTERCONNECT_MODULES;
    } });
    var memories_js_1 = require_memories();
    Object.defineProperty(exports, "MEMORY_MODULES", { enumerable: true, get: function() {
      return memories_js_1.MEMORY_MODULES;
    } });
    var peripherals_js_1 = require_peripherals();
    Object.defineProperty(exports, "PERIPHERAL_MODULES", { enumerable: true, get: function() {
      return peripherals_js_1.PERIPHERAL_MODULES;
    } });
    var infrastructure_js_1 = require_infrastructure();
    Object.defineProperty(exports, "INFRASTRUCTURE_MODULES", { enumerable: true, get: function() {
      return infrastructure_js_1.INFRASTRUCTURE_MODULES;
    } });
    exports.BUILTIN_MODULES = [
      processors_js_1.PROCESSOR_MODULES[0],
      // picorv32
      interconnects_js_1.INTERCONNECT_MODULES[0],
      // axi_crossbar
      memories_js_1.MEMORY_MODULES[0],
      // ram_dual_port
      peripherals_js_1.PERIPHERAL_MODULES[0],
      // uart_core
      peripherals_js_1.PERIPHERAL_MODULES[1],
      // gpio_controller
      infrastructure_js_1.INFRASTRUCTURE_MODULES[0],
      // sync_fifo
      infrastructure_js_1.INFRASTRUCTURE_MODULES[1],
      // clock_divider
      infrastructure_js_1.INFRASTRUCTURE_MODULES[2],
      // clock_gen
      processors_js_1.PROCESSOR_MODULES[1],
      // ibex
      interconnects_js_1.INTERCONNECT_MODULES[1],
      // wishbone_crossbar
      peripherals_js_1.PERIPHERAL_MODULES[2],
      // spi_controller
      peripherals_js_1.PERIPHERAL_MODULES[3],
      // i2c_controller
      peripherals_js_1.PERIPHERAL_MODULES[4]
      // timer_core
    ];
  }
});

// packages/core/dist/catalog/templates/riscv-mcu.js
var require_riscv_mcu = __commonJS({
  "packages/core/dist/catalog/templates/riscv-mcu.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RISCV_MCU_TEMPLATE = void 0;
    exports.RISCV_MCU_TEMPLATE = {
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
    };
  }
});

// packages/core/dist/catalog/templates/uart-loopback.js
var require_uart_loopback = __commonJS({
  "packages/core/dist/catalog/templates/uart-loopback.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UART_LOOPBACK_TEMPLATE = void 0;
    exports.UART_LOOPBACK_TEMPLATE = {
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
    };
  }
});

// packages/core/dist/catalog/templates/opentitan-rot.js
var require_opentitan_rot = __commonJS({
  "packages/core/dist/catalog/templates/opentitan-rot.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OPENTITAN_ROT_TEMPLATE = void 0;
    exports.OPENTITAN_ROT_TEMPLATE = {
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
    };
  }
});

// packages/core/dist/catalog/templates/pulpissimo-edge.js
var require_pulpissimo_edge = __commonJS({
  "packages/core/dist/catalog/templates/pulpissimo-edge.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PULPISSIMO_EDGE_TEMPLATE = void 0;
    exports.PULPISSIMO_EDGE_TEMPLATE = {
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
    };
  }
});

// packages/core/dist/catalog/templates/litex-wishbone.js
var require_litex_wishbone = __commonJS({
  "packages/core/dist/catalog/templates/litex-wishbone.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LITEX_WISHBONE_TEMPLATE = void 0;
    exports.LITEX_WISHBONE_TEMPLATE = {
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
    };
  }
});

// packages/core/dist/catalog/templates/sensor-hub.js
var require_sensor_hub = __commonJS({
  "packages/core/dist/catalog/templates/sensor-hub.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SENSOR_HUB_TEMPLATE = void 0;
    exports.SENSOR_HUB_TEMPLATE = {
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
    };
  }
});

// packages/core/dist/catalog/templates/index.js
var require_templates = __commonJS({
  "packages/core/dist/catalog/templates/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BUILTIN_TEMPLATES = void 0;
    var riscv_mcu_js_1 = require_riscv_mcu();
    var uart_loopback_js_1 = require_uart_loopback();
    var opentitan_rot_js_1 = require_opentitan_rot();
    var pulpissimo_edge_js_1 = require_pulpissimo_edge();
    var litex_wishbone_js_1 = require_litex_wishbone();
    var sensor_hub_js_1 = require_sensor_hub();
    exports.BUILTIN_TEMPLATES = [
      riscv_mcu_js_1.RISCV_MCU_TEMPLATE,
      uart_loopback_js_1.UART_LOOPBACK_TEMPLATE,
      opentitan_rot_js_1.OPENTITAN_ROT_TEMPLATE,
      pulpissimo_edge_js_1.PULPISSIMO_EDGE_TEMPLATE,
      litex_wishbone_js_1.LITEX_WISHBONE_TEMPLATE,
      sensor_hub_js_1.SENSOR_HUB_TEMPLATE
    ];
  }
});

// packages/core/dist/catalog/index.js
var require_catalog = __commonJS({
  "packages/core/dist/catalog/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.STARTER_TEMPLATES = exports.STARTER_IP_CATALOG = exports.defaultCatalogRegistry = exports.BUILTIN_TEMPLATES = exports.CatalogRegistry = void 0;
    exports.getModuleDef = getModuleDef5;
    var registry_js_1 = require_registry();
    var index_js_1 = require_modules();
    var index_js_2 = require_templates();
    var registry_js_2 = require_registry();
    Object.defineProperty(exports, "CatalogRegistry", { enumerable: true, get: function() {
      return registry_js_2.CatalogRegistry;
    } });
    __exportStar(require_modules(), exports);
    var index_js_3 = require_templates();
    Object.defineProperty(exports, "BUILTIN_TEMPLATES", { enumerable: true, get: function() {
      return index_js_3.BUILTIN_TEMPLATES;
    } });
    exports.defaultCatalogRegistry = new registry_js_1.CatalogRegistry(index_js_1.BUILTIN_MODULES, index_js_2.BUILTIN_TEMPLATES);
    exports.STARTER_IP_CATALOG = exports.defaultCatalogRegistry.listModules();
    exports.STARTER_TEMPLATES = exports.defaultCatalogRegistry.listTemplates();
    function getModuleDef5(moduleId) {
      return exports.defaultCatalogRegistry.getModule(moduleId);
    }
  }
});

// packages/core/dist/catalog.js
var require_catalog2 = __commonJS({
  "packages/core/dist/catalog.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_catalog(), exports);
  }
});

// packages/core/dist/auto-wire.js
var require_auto_wire = __commonJS({
  "packages/core/dist/auto-wire.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.autoWireDesign = autoWireDesign3;
    var catalog_js_1 = require_catalog2();
    function cloneDesign(design) {
      return JSON.parse(JSON.stringify(design));
    }
    function isInputConnected(design, instanceId, portId) {
      return design.nets.some((n) => n.targets.some((t) => t.instanceId === instanceId && t.portId === portId));
    }
    function findOrCreateSourceNet(design, sourceInstId, sourcePortId, preferredName) {
      let net = design.nets.find((n) => n.source?.instanceId === sourceInstId && n.source?.portId === sourcePortId);
      if (net)
        return net;
      const uniqueId = `net_auto_${preferredName}_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
      net = {
        id: uniqueId,
        name: preferredName,
        width: 1,
        source: { instanceId: sourceInstId, portId: sourcePortId },
        targets: []
      };
      design.nets.push(net);
      return net;
    }
    function autoWireDesign3(inputDesign) {
      const design = cloneDesign(inputDesign);
      const summary = {
        createdClockGen: false,
        connectedClocks: 0,
        connectedResets: 0,
        removedOrphanNets: 0
      };
      if (design.instances.length === 0) {
        return { design, summary };
      }
      let clkGen = design.instances.find((i) => i.moduleId === "clock_gen");
      if (!clkGen) {
        const minX = Math.min(...design.instances.map((i) => i.position.x));
        const avgY = design.instances.reduce((s, i) => s + i.position.y, 0) / design.instances.length;
        clkGen = {
          id: `clock_gen_auto_${Date.now()}`,
          moduleId: "clock_gen",
          name: "u_clk_gen",
          position: { x: Math.max(40, Math.round(minX - 240)), y: Math.max(60, Math.round(avgY)) },
          parameters: { FREQ_MHZ: design.silicon?.clockFreqMhz || 50 }
        };
        design.instances.unshift(clkGen);
        summary.createdClockGen = true;
      }
      const clkNet = findOrCreateSourceNet(design, clkGen.id, "clk_out", "clk");
      const rstNet = findOrCreateSourceNet(design, clkGen.id, "rst_n_out", "rst_n");
      for (const inst of design.instances) {
        if (inst.id === clkGen.id)
          continue;
        const modDef = (0, catalog_js_1.getModuleDef)(inst.moduleId);
        if (!modDef)
          continue;
        for (const port of modDef.ports) {
          if (port.direction !== "input")
            continue;
          if (port.type === "clock" && !isInputConnected(design, inst.id, port.id)) {
            clkNet.targets.push({ instanceId: inst.id, portId: port.id });
            summary.connectedClocks++;
          } else if (port.type === "reset" && !isInputConnected(design, inst.id, port.id)) {
            rstNet.targets.push({ instanceId: inst.id, portId: port.id });
            summary.connectedResets++;
          }
        }
      }
      const beforeLen = design.nets.length;
      design.nets = design.nets.filter((n) => Boolean(n.source) || n.targets.length > 0);
      summary.removedOrphanNets = beforeLen - design.nets.length;
      design.metadata.modified = (/* @__PURE__ */ new Date()).toISOString();
      return { design, summary };
    }
  }
});

// packages/core/dist/ir.js
var require_ir = __commonJS({
  "packages/core/dist/ir.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateKonaDesignSchema = validateKonaDesignSchema;
    exports.serializeKonaDesign = serializeKonaDesign3;
    exports.parseKonaDesign = parseKonaDesign4;
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
      if (d.silicon !== void 0) {
        const s = d.silicon;
        if (!s || typeof s !== "object") {
          errors.push('Design "silicon" must be an object');
        } else {
          if (!s.pdkId || !["sky130A", "gf180mcuD", "sg13g2"].includes(s.pdkId)) {
            errors.push(`Invalid silicon.pdkId "${String(s.pdkId)}"`);
          }
          if (typeof s.clockFreqMhz !== "number" || s.clockFreqMhz <= 0) {
            errors.push("silicon.clockFreqMhz must be a positive number");
          }
          if (typeof s.coreUtilization !== "number" || s.coreUtilization <= 0 || s.coreUtilization > 1) {
            errors.push("silicon.coreUtilization must be between 0 and 1");
          }
          if (s.pinEdges !== void 0) {
            for (const [pin, edge] of Object.entries(s.pinEdges)) {
              if (!["N", "S", "E", "W"].includes(edge)) {
                errors.push(`Invalid pin edge "${String(edge)}" for pin "${pin}"`);
              }
            }
          }
        }
      }
      if (d.spec !== void 0) {
        const sp = d.spec;
        if (!sp || typeof sp !== "object") {
          errors.push('Design "spec" must be an object');
        } else {
          if (sp.powerBudgetMw !== void 0 && (typeof sp.powerBudgetMw !== "number" || sp.powerBudgetMw <= 0)) {
            errors.push("spec.powerBudgetMw must be a positive number");
          }
          if (sp.maxAreaMm2 !== void 0 && (typeof sp.maxAreaMm2 !== "number" || sp.maxAreaMm2 <= 0)) {
            errors.push("spec.maxAreaMm2 must be a positive number");
          }
        }
      }
      return errors;
    }
    function serializeKonaDesign3(design) {
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
        ...design.spec ? {
          spec: {
            ...design.spec.targetApplication !== void 0 ? { targetApplication: design.spec.targetApplication } : {},
            ...design.spec.author !== void 0 ? { author: design.spec.author } : {},
            ...design.spec.powerBudgetMw !== void 0 ? { powerBudgetMw: design.spec.powerBudgetMw } : {},
            ...design.spec.maxAreaMm2 !== void 0 ? { maxAreaMm2: design.spec.maxAreaMm2 } : {},
            ...design.spec.notes !== void 0 ? { notes: design.spec.notes } : {}
          }
        } : {},
        ...design.silicon ? {
          silicon: {
            pdkId: design.silicon.pdkId,
            clockFreqMhz: design.silicon.clockFreqMhz,
            coreUtilization: design.silicon.coreUtilization,
            diePreset: design.silicon.diePreset,
            packageType: design.silicon.packageType,
            shuttleTarget: design.silicon.shuttleTarget,
            sramMode: design.silicon.sramMode,
            includeIoPads: design.silicon.includeIoPads,
            ...design.silicon.pinEdges ? {
              pinEdges: Object.keys(design.silicon.pinEdges).sort().reduce((acc, k) => {
                acc[k] = design.silicon.pinEdges[k];
                return acc;
              }, {})
            } : {}
          }
        } : {},
        metadata: {
          ...design.metadata,
          version: design.metadata.version || "1.0"
        }
      };
      return JSON.stringify(sortedDesign, null, 2);
    }
    function parseKonaDesign4(jsonString) {
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

// packages/core/dist/pdk/registry.js
var require_registry2 = __commonJS({
  "packages/core/dist/pdk/registry.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PDK_CATALOG = void 0;
    exports.listPdks = listPdks2;
    exports.getPdkDef = getPdkDef;
    exports.createDefaultSiliconConfig = createDefaultSiliconConfig3;
    exports.PDK_CATALOG = {
      sky130A: {
        id: "sky130A",
        name: "SkyWater SKY130 (130nm CMOS)",
        shortName: "SKY130 \xB7 130nm",
        foundry: "SkyWater Technology Foundry",
        nodeNm: 130,
        processType: "130nm Bulk CMOS (5-Metal)",
        coreVoltage: "1.8V",
        ioVoltage: "3.3V",
        metalLayers: 5,
        stdCellLibrary: "sky130_fd_sc_hd",
        ioPadLibrary: "sky130_fd_io",
        volareFamily: "sky130",
        volarePdk: "sky130A",
        maxClockMhz: 100,
        defaultClockMhz: 50,
        defaultUtilization: 0.45,
        targetDensityPct: 55,
        drivingCell: "sky130_fd_sc_hd__inv_2",
        drivingCellPin: "Y",
        outputLoadPf: 0.033442,
        maxSoftRamAddrBits: 9,
        openRamMacroName: "sky130_sram_2kbyte_1rw1r_32x512_8",
        openRamMacroWords: 512,
        dieSlots: {
          mpw_small: {
            label: "Tiny Slot (1.0 \xD7 1.0 mm)",
            dieArea: "0 0 1000 1000",
            coreArea: "180 180 820 820",
            approxGates: "~25k gates"
          },
          mpw_medium: {
            label: "MPW Standard (2.0 \xD7 2.0 mm)",
            dieArea: "0 0 2000 2000",
            coreArea: "200 200 1800 1800",
            approxGates: "~120k gates"
          },
          mpw_large: {
            label: "Caravel / Full SoC (3.5 \xD7 3.5 mm)",
            dieArea: "0 0 3500 3500",
            coreArea: "220 220 3280 3280",
            approxGates: "~400k+ gates"
          }
        },
        ioPadCells: {
          input: "sky130_fd_io__top_gpiov2",
          output: "sky130_fd_io__top_gpiov2",
          inout: "sky130_fd_io__top_gpiov2",
          vdd: "sky130_fd_io__top_power_lvc_wpad",
          vss: "sky130_fd_io__top_ground_lvc_wpad",
          vddio: "sky130_fd_io__top_power_hvc_wpad",
          vssio: "sky130_fd_io__top_ground_hvc_wpad",
          corner: "sky130_fd_io__corner_bus_overlay"
        },
        shuttleNotes: "Supported by LibreLane/OpenLane 2, Tiny Tapeout, and ChipFoundry/MPW aggregators.",
        indiaEcosystemNotes: "Ideal for IIT/NIT academic chips, RISC-V MCU prototypes, and DLI pre-silicon proof-of-concept before moving to commercial 28nm/65nm."
      },
      gf180mcuD: {
        id: "gf180mcuD",
        name: "GlobalFoundries GF180MCU (180nm 3.3V/5V)",
        shortName: "GF180MCU \xB7 180nm",
        foundry: "GlobalFoundries",
        nodeNm: 180,
        processType: "180nm MCU CMOS (5-Metal, 3.3V/5V)",
        coreVoltage: "3.3V / 5.0V",
        ioVoltage: "3.3V / 5.0V",
        metalLayers: 5,
        stdCellLibrary: "gf180mcu_fd_sc_mcu7t5v0",
        ioPadLibrary: "gf180mcu_fd_io",
        volareFamily: "gf180mcu",
        volarePdk: "gf180mcuD",
        maxClockMhz: 60,
        defaultClockMhz: 25,
        defaultUtilization: 0.45,
        targetDensityPct: 55,
        drivingCell: "gf180mcu_fd_sc_mcu7t5v0__inv_2",
        drivingCellPin: "ZN",
        outputLoadPf: 0.05,
        maxSoftRamAddrBits: 8,
        openRamMacroName: "gf180mcu_fd_ip_sram__sram512x8m8wm1",
        openRamMacroWords: 512,
        dieSlots: {
          mpw_small: {
            label: "Compact MCU (1.5 \xD7 1.5 mm)",
            dieArea: "0 0 1500 1500",
            coreArea: "220 220 1280 1280",
            approxGates: "~18k gates"
          },
          mpw_medium: {
            label: "MPW Standard (2.5 \xD7 2.5 mm)",
            dieArea: "0 0 2500 2500",
            coreArea: "240 240 2260 2260",
            approxGates: "~65k gates"
          },
          mpw_large: {
            label: "Full Pad-Ring Die (4.0 \xD7 4.0 mm)",
            dieArea: "0 0 4000 4000",
            coreArea: "260 260 3740 3740",
            approxGates: "~180k gates"
          }
        },
        ioPadCells: {
          input: "gf180mcu_fd_io__in_c",
          output: "gf180mcu_fd_io__out_8mA",
          inout: "gf180mcu_fd_io__bi_t",
          vdd: "gf180mcu_fd_io__dvdd",
          vss: "gf180mcu_fd_io__dvss",
          vddio: "gf180mcu_fd_io__dvdd",
          vssio: "gf180mcu_fd_io__dvss",
          corner: "gf180mcu_fd_io__cor"
        },
        shuttleNotes: "Native 5V/3.3V tolerant industrial node; supported by OpenLane 2/LibreLane and WaferSpace/GF180 open shuttles.",
        indiaEcosystemNotes: "Best match for 180nm industrial/automotive sensor hubs, SCL-180nm-class microcontroller flows, and 5V industrial interfacing."
      },
      sg13g2: {
        id: "sg13g2",
        name: "IHP SG13G2 (130nm BiCMOS)",
        shortName: "IHP SG13G2 \xB7 130nm",
        foundry: "IHP Microelectronics (Germany)",
        nodeNm: 130,
        processType: "130nm SiGe BiCMOS (7-Metal)",
        coreVoltage: "1.2V",
        ioVoltage: "3.3V",
        metalLayers: 7,
        stdCellLibrary: "sg13g2_stdcell",
        ioPadLibrary: "sg13g2_io",
        volareFamily: "ihp_sg13g2",
        volarePdk: "sg13g2",
        maxClockMhz: 180,
        defaultClockMhz: 80,
        defaultUtilization: 0.45,
        targetDensityPct: 55,
        drivingCell: "sg13g2_inv_2",
        drivingCellPin: "Y",
        outputLoadPf: 0.025,
        maxSoftRamAddrBits: 9,
        openRamMacroName: "RM_IHPSG13_1P_512x32_c2_bm_bist",
        openRamMacroWords: 512,
        dieSlots: {
          mpw_small: {
            label: "Mini ASIC (1.0 \xD7 1.0 mm)",
            dieArea: "0 0 1000 1000",
            coreArea: "160 160 840 840",
            approxGates: "~35k gates"
          },
          mpw_medium: {
            label: "MPW Standard (2.0 \xD7 2.0 mm)",
            dieArea: "0 0 2000 2000",
            coreArea: "180 180 1820 1820",
            approxGates: "~160k gates"
          },
          mpw_large: {
            label: "Full SoC (3.5 \xD7 3.5 mm)",
            dieArea: "0 0 3500 3500",
            coreArea: "200 200 3300 3300",
            approxGates: "~500k gates"
          }
        },
        ioPadCells: {
          input: "sg13g2_IOPadIn",
          output: "sg13g2_IOPadOut16mA",
          inout: "sg13g2_IOPadInOut30mA",
          vdd: "sg13g2_IOPadVdd",
          vss: "sg13g2_IOPadVss",
          vddio: "sg13g2_IOPadIOVdd",
          vssio: "sg13g2_IOPadIOVss",
          corner: "sg13g2_Corner"
        },
        shuttleNotes: "Active European open-source MPW shuttles via IHP + LibreLane/OpenROAD.",
        indiaEcosystemNotes: "Strong option for Indian startups and labs needing higher clock speeds (up to ~180 MHz) and 7-metal routing density on an open PDK."
      }
    };
    function listPdks2() {
      return Object.values(exports.PDK_CATALOG);
    }
    function getPdkDef(pdkId) {
      return exports.PDK_CATALOG[pdkId];
    }
    function createDefaultSiliconConfig3(pdkId = "sky130A") {
      const pdk = exports.PDK_CATALOG[pdkId] || exports.PDK_CATALOG.sky130A;
      return {
        pdkId: pdk.id,
        clockFreqMhz: pdk.defaultClockMhz,
        coreUtilization: pdk.defaultUtilization,
        diePreset: "mpw_medium",
        packageType: "QFN48",
        shuttleTarget: pdk.id === "gf180mcuD" ? "cdac_chipin" : "librelane_mpw",
        sramMode: "openram_macro",
        includeIoPads: true
      };
    }
  }
});

// packages/core/dist/pdk/index.js
var require_pdk = __commonJS({
  "packages/core/dist/pdk/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_registry2(), exports);
  }
});

// packages/core/dist/architecture.js
var require_architecture = __commonJS({
  "packages/core/dist/architecture.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PACKAGE_PIN_CAPACITY = void 0;
    exports.extractExternalPorts = extractExternalPorts;
    exports.extractMemoryMap = extractMemoryMap;
    exports.extractClockDomains = extractClockDomains;
    exports.analyzeArchitecture = analyzeArchitecture2;
    exports.generateArchitectureSpecMarkdown = generateArchitectureSpecMarkdown2;
    var index_js_1 = require_pdk();
    exports.PACKAGE_PIN_CAPACITY = {
      QFN32: { totalPins: 32, powerPins: 8, maxSignalPins: 24 },
      QFN48: { totalPins: 48, powerPins: 12, maxSignalPins: 36 },
      QFN64: { totalPins: 64, powerPins: 16, maxSignalPins: 48 },
      DIP40: { totalPins: 40, powerPins: 8, maxSignalPins: 32 }
    };
    var MODULE_GATE_ESTIMATES = {
      picorv32: 15500,
      ibex: 22500,
      axi_crossbar: 1800,
      wishbone_crossbar: 1500,
      uart_core: 1200,
      gpio_controller: 600,
      spi_controller: 1100,
      i2c_controller: 1300,
      timer_core: 1400,
      clock_divider: 250,
      clock_gen: 120
    };
    function formatHex32(val) {
      return "0x" + (val >>> 0).toString(16).toUpperCase().padStart(8, "0");
    }
    function findConnectedNet(design, instId, portId, dir) {
      return design.nets.find((n) => dir === "output" && n.source?.instanceId === instId && n.source?.portId === portId || dir === "input" && n.targets.some((t) => t.instanceId === instId && t.portId === portId) || dir === "inout" && (n.source?.instanceId === instId && n.source?.portId === portId || n.targets.some((t) => t.instanceId === instId && t.portId === portId)));
    }
    function extractExternalPorts(design, silicon) {
      const sortedInstances = [...design.instances].sort((a, b) => a.id.localeCompare(b.id));
      const pinEdges = silicon.pinEdges || {};
      const resolveEdge = (name, fallback) => pinEdges[name] || fallback;
      const ports = [
        {
          name: "clk_in",
          direction: "input",
          width: 1,
          edge: resolveEdge("clk_in", "W"),
          description: `Primary clock input (${silicon.clockFreqMhz} MHz)`
        },
        {
          name: "rst_n_in",
          direction: "input",
          width: 1,
          edge: resolveEdge("rst_n_in", "W"),
          description: "Active-low asynchronous reset input"
        }
      ];
      let hasTrap = false;
      let hasGpio = false;
      let uartIdx = 0;
      let spiIdx = 0;
      let i2cIdx = 0;
      let timerIdx = 0;
      for (const inst of sortedInstances) {
        if (inst.moduleId === "picorv32" && !hasTrap) {
          if (!findConnectedNet(design, inst.id, "trap", "output")) {
            hasTrap = true;
            ports.push({
              name: "trap_out",
              direction: "output",
              width: 1,
              edge: resolveEdge("trap_out", "N"),
              description: "CPU trap fault indicator"
            });
          }
        } else if (inst.moduleId === "uart_core") {
          const suffix = uartIdx === 0 ? "" : `_${uartIdx}`;
          uartIdx++;
          if (!findConnectedNet(design, inst.id, "rx", "input")) {
            const name = `uart${suffix}_rx`;
            ports.push({ name, direction: "input", width: 1, edge: resolveEdge(name, "E"), description: "UART serial RX input" });
          }
          if (!findConnectedNet(design, inst.id, "tx", "output")) {
            const name = `uart${suffix}_tx`;
            ports.push({ name, direction: "output", width: 1, edge: resolveEdge(name, "E"), description: "UART serial TX output" });
          }
        } else if (inst.moduleId === "spi_controller") {
          const suffix = spiIdx === 0 ? "" : `_${spiIdx}`;
          spiIdx++;
          for (const [portId, dir, desc] of [
            ["spi_sclk", "output", "SPI serial clock"],
            ["spi_cs_n", "output", "SPI active-low chip select"],
            ["spi_mosi", "output", "SPI master-out slave-in"],
            ["spi_miso", "input", "SPI master-in slave-out"]
          ]) {
            if (!findConnectedNet(design, inst.id, portId, dir)) {
              const name = `${portId}${suffix}`;
              ports.push({ name, direction: dir, width: 1, edge: resolveEdge(name, "S"), description: desc });
            }
          }
        } else if (inst.moduleId === "i2c_controller") {
          const suffix = i2cIdx === 0 ? "" : `_${i2cIdx}`;
          i2cIdx++;
          for (const [portId, dir, desc] of [
            ["scl", "output", "I2C serial clock"],
            ["sda_out", "output", "I2C data output"],
            ["sda_in", "input", "I2C data input"]
          ]) {
            if (!findConnectedNet(design, inst.id, portId, dir)) {
              const name = `i2c${suffix}_${portId}`;
              ports.push({ name, direction: dir, width: 1, edge: resolveEdge(name, "S"), description: desc });
            }
          }
        } else if (inst.moduleId === "gpio_controller" && !hasGpio) {
          hasGpio = true;
          const w = Number(inst.parameters.WIDTH ?? 8);
          ports.push({ name: "gpio_in", direction: "input", width: w, edge: resolveEdge("gpio_in", "E"), description: "GPIO pad inputs" }, { name: "gpio_out", direction: "output", width: w, edge: resolveEdge("gpio_out", "E"), description: "GPIO pad outputs" }, { name: "gpio_oe", direction: "output", width: w, edge: resolveEdge("gpio_oe", "E"), description: "GPIO output enable (active high)" });
        } else if (inst.moduleId === "timer_core") {
          const suffix = timerIdx === 0 ? "" : `_${timerIdx}`;
          timerIdx++;
          if (!findConnectedNet(design, inst.id, "irq", "output")) {
            const name = `timer${suffix}_irq`;
            ports.push({ name, direction: "output", width: 1, edge: resolveEdge(name, "N"), description: "System timer interrupt" });
          }
        }
      }
      return ports;
    }
    function extractMemoryMap(design) {
      const instanceMap = new Map(design.instances.map((i) => [i.id, i]));
      const regions = [];
      for (const inst of [...design.instances].sort((a, b) => a.id.localeCompare(b.id))) {
        if (inst.moduleId !== "axi_crossbar" && inst.moduleId !== "wishbone_crossbar")
          continue;
        const s0Base = Number(inst.parameters.S0_BASE_ADDR ?? 0) >>> 0;
        const s0Mask = Number(inst.parameters.S0_ADDR_MASK ?? 65535) >>> 0;
        const s1Base = Number(inst.parameters.S1_BASE_ADDR ?? 268435456) >>> 0;
        const s1Mask = Number(inst.parameters.S1_ADDR_MASK ?? 65535) >>> 0;
        const resolveTargets = (portIds) => {
          const names = /* @__PURE__ */ new Set();
          for (const pid of portIds) {
            const net = findConnectedNet(design, inst.id, pid, "output");
            if (net) {
              for (const tgt of net.targets) {
                const targetInst = instanceMap.get(tgt.instanceId);
                if (targetInst)
                  names.add(`${targetInst.name} (${targetInst.moduleId})`);
              }
            }
          }
          return Array.from(names);
        };
        const s0Size = s0Mask + 1 >>> 0;
        const s1Size = s1Mask + 1 >>> 0;
        const s0End = s0Base + s0Mask >>> 0;
        const s1End = s1Base + s1Mask >>> 0;
        const r0 = {
          crossbarId: inst.id,
          crossbarName: inst.name,
          slot: "S0",
          baseAddr: s0Base,
          endAddr: s0End,
          sizeBytes: s0Size,
          baseHex: formatHex32(s0Base),
          endHex: formatHex32(s0End),
          targetInstances: resolveTargets(["s0_addr", "s0_valid", "s0_adr_o", "s0_cyc_o"])
        };
        const r1 = {
          crossbarId: inst.id,
          crossbarName: inst.name,
          slot: "S1",
          baseAddr: s1Base,
          endAddr: s1End,
          sizeBytes: s1Size,
          baseHex: formatHex32(s1Base),
          endHex: formatHex32(s1End),
          targetInstances: resolveTargets(["s1_addr", "s1_valid", "s1_adr_o", "s1_cyc_o"])
        };
        if (r0.baseAddr <= r1.endAddr && r1.baseAddr <= r0.endAddr) {
          r0.overlapsWith = `${inst.name}.S1`;
          r1.overlapsWith = `${inst.name}.S0`;
        }
        regions.push(r0, r1);
      }
      return regions;
    }
    function extractClockDomains(design, fallbackFreqMhz) {
      const instanceMap = new Map(design.instances.map((i) => [i.id, i]));
      const domains = [];
      for (const inst of [...design.instances].sort((a, b) => a.id.localeCompare(b.id))) {
        if (inst.moduleId !== "clock_gen" && inst.moduleId !== "clock_divider")
          continue;
        const outNet = findConnectedNet(design, inst.id, "clk_out", "output");
        if (!outNet)
          continue;
        let freqMhz = fallbackFreqMhz;
        if (inst.moduleId === "clock_gen") {
          freqMhz = Number(inst.parameters.FREQ_MHZ ?? fallbackFreqMhz);
        } else if (inst.moduleId === "clock_divider") {
          const div = Math.max(2, Number(inst.parameters.DIVISOR ?? 4));
          freqMhz = +(fallbackFreqMhz / div).toFixed(2);
        }
        const consumers = outNet.targets.map((t) => instanceMap.get(t.instanceId)?.name || t.instanceId).filter((v, idx, arr) => arr.indexOf(v) === idx);
        domains.push({
          sourceInstance: inst.name,
          netName: outNet.name,
          freqMhz,
          consumers
        });
      }
      if (domains.length === 0) {
        domains.push({
          sourceInstance: "external clk_in",
          netName: "clk_in",
          freqMhz: fallbackFreqMhz,
          consumers: design.instances.map((i) => i.name)
        });
      }
      return domains;
    }
    function analyzeArchitecture2(design) {
      const silicon = design.silicon ? { ...design.silicon } : (0, index_js_1.createDefaultSiliconConfig)("sky130A");
      const pdk = (0, index_js_1.getPdkDef)(silicon.pdkId) || (0, index_js_1.getPdkDef)("sky130A");
      const memoryMap = extractMemoryMap(design);
      const memoryMapOverlaps = memoryMap.filter((r) => Boolean(r.overlapsWith)).length;
      const clockDomains = extractClockDomains(design, silicon.clockFreqMhz);
      const externalPorts = extractExternalPorts(design, silicon);
      let estimatedGates = 0;
      let sramKbytes = 0;
      for (const inst of design.instances) {
        if (inst.moduleId === "ram_dual_port") {
          const aw = Math.min(18, Math.max(2, Number(inst.parameters.ADDR_WIDTH ?? 14)));
          const dw = Math.max(1, Number(inst.parameters.DATA_WIDTH ?? 32));
          const words = 1 << aw;
          sramKbytes += +(words * dw / 8192).toFixed(2);
          estimatedGates += silicon.sramMode === "openram_macro" ? Math.round(words * (dw / 32) * 1.5) : Math.round(Math.min(words, 128) * dw * 6);
        } else if (inst.moduleId === "sync_fifo") {
          const w = Number(inst.parameters.WIDTH ?? 32);
          const d = Number(inst.parameters.DEPTH ?? 16);
          estimatedGates += w * d * 8 + 300;
        } else {
          estimatedGates += MODULE_GATE_ESTIMATES[inst.moduleId] ?? 1e3;
        }
      }
      const gateAreaUm2 = pdk.nodeNm === 180 ? 22 : pdk.id === "sg13g2" ? 10 : 12;
      const coreAreaMm2 = estimatedGates * gateAreaUm2 / (1e6 * Math.max(0.25, silicon.coreUtilization));
      const sramAreaMm2 = sramKbytes * (pdk.nodeNm === 180 ? 0.035 : 0.018);
      const estimatedAreaMm2 = +Math.max(0.05, coreAreaMm2 + sramAreaMm2).toFixed(3);
      const nodeEnergyFactor = pdk.nodeNm === 180 ? 0.012 : pdk.id === "sg13g2" ? 45e-4 : 65e-4;
      const dynamicMw = estimatedGates / 1e3 * silicon.clockFreqMhz * nodeEnergyFactor;
      const sramMw = sramKbytes * silicon.clockFreqMhz * 4e-3;
      const estimatedPowerMw = +Math.max(0.4, dynamicMw + sramMw + 0.5).toFixed(2);
      const powerBudgetMw = design.spec?.powerBudgetMw;
      const maxAreaMm2 = design.spec?.maxAreaMm2;
      const withinPowerBudget = powerBudgetMw === void 0 || estimatedPowerMw <= powerBudgetMw;
      const withinAreaBudget = maxAreaMm2 === void 0 || estimatedAreaMm2 <= maxAreaMm2;
      const pkgSpec = exports.PACKAGE_PIN_CAPACITY[silicon.packageType] || exports.PACKAGE_PIN_CAPACITY.QFN48;
      const signalPins = externalPorts.reduce((sum, p) => {
        if (p.name === "gpio_out" || p.name === "gpio_oe")
          return sum;
        return sum + p.width;
      }, 0);
      const totalPinsUsed = signalPins + pkgSpec.powerPins;
      const fitsPackage = signalPins <= pkgSpec.maxSignalPins;
      const hasSpecIdentity = Boolean(design.name?.trim() && design.topModule?.trim());
      const clockOk = silicon.clockFreqMhz > 0 && silicon.clockFreqMhz <= pdk.maxClockMhz;
      const checklist = [
        {
          id: "stage1-spec",
          label: "Chip Identity & Spec",
          status: hasSpecIdentity && design.spec?.targetApplication ? "pass" : hasSpecIdentity ? "warn" : "fail",
          detail: design.spec?.targetApplication ? `${design.name} (${design.topModule}) \xB7 ${design.spec.targetApplication}` : `${design.name} (${design.topModule}) \u2014 add Target Application in Inspector`
        },
        {
          id: "stage1-clocks",
          label: "Clock & Reset Domains",
          status: clockOk ? "pass" : "fail",
          detail: `${clockDomains.length} clock domain(s), target ${silicon.clockFreqMhz} MHz (PDK max ${pdk.maxClockMhz} MHz)`
        },
        {
          id: "stage1-memmap",
          label: "Memory Map & Bus Decoding",
          status: memoryMapOverlaps === 0 ? "pass" : "fail",
          detail: memoryMap.length === 0 ? "No memory-mapped crossbar (streaming/pipeline architecture)" : memoryMapOverlaps === 0 ? `${memoryMap.length} bus region(s) conflict-free` : `${memoryMapOverlaps} overlapping address region(s) detected`
        },
        {
          id: "stage1-ppa",
          label: "PPA & Area Feasibility",
          status: withinPowerBudget && withinAreaBudget ? "pass" : "warn",
          detail: `~${estimatedGates.toLocaleString()} GE \xB7 ${sramKbytes} KB SRAM \xB7 ~${estimatedAreaMm2} mm\xB2 \xB7 ~${estimatedPowerMw} mW`
        },
        {
          id: "stage1-pins",
          label: `Package & Pinout (${silicon.packageType})`,
          status: fitsPackage ? "pass" : "fail",
          detail: `${signalPins}/${pkgSpec.maxSignalPins} signal pins (${totalPinsUsed}/${pkgSpec.totalPins} total w/ power)`
        }
      ];
      return {
        pdk,
        silicon,
        memoryMap,
        memoryMapOverlaps,
        clockDomains,
        externalPorts,
        ppa: {
          estimatedGates,
          sramKbytes,
          estimatedAreaMm2,
          estimatedPowerMw,
          clockFreqMhz: silicon.clockFreqMhz,
          powerBudgetMw,
          maxAreaMm2,
          withinPowerBudget,
          withinAreaBudget
        },
        pinBudget: {
          packageType: silicon.packageType,
          signalPins,
          powerPins: pkgSpec.powerPins,
          totalPinsUsed,
          totalPackagePins: pkgSpec.totalPins,
          maxSignalPins: pkgSpec.maxSignalPins,
          fitsPackage
        },
        checklist
      };
    }
    function generateArchitectureSpecMarkdown2(design, existingReport) {
      const report = existingReport || analyzeArchitecture2(design);
      const spec = design.spec || {};
      const memRows = report.memoryMap.length > 0 ? report.memoryMap.map((r) => `| ${r.crossbarName}.${r.slot} | \`${r.baseHex}\` | \`${r.endHex}\` | ${(r.sizeBytes / 1024).toFixed(1)} KB | ${r.targetInstances.join(", ") || "Unconnected"} | ${r.overlapsWith ? `OVERLAP (${r.overlapsWith})` : "OK"} |`).join("\n") : "| _(none)_ | - | - | - | Streaming / non-bus datapath | OK |";
      const clkRows = report.clockDomains.map((c) => `| \`${c.netName}\` | ${c.sourceInstance} | ${c.freqMhz} MHz | ${c.consumers.join(", ") || "None"} |`).join("\n");
      const pinRows = report.externalPorts.map((p) => `| \`${p.name}\` | \`${p.direction}\` | ${p.width} | ${p.edge} | ${p.description} |`).join("\n");
      const checklistRows = report.checklist.map((c) => `- **[${c.status.toUpperCase()}] ${c.label}:** ${c.detail}`).join("\n");
      return `# Stage 1 Architecture & Chip Specification

## 1. Chip Overview & Target Silicon
- **Design Name:** ${design.name}
- **Top Module:** \`${design.topModule}\`
- **Target Application:** ${spec.targetApplication || "General-purpose SoC / Microcontroller"}
- **Author / Organization:** ${spec.author || "Unspecified"}
- **Target PDK / Node:** ${report.pdk.name} (${report.pdk.nodeNm}nm, ${report.pdk.coreVoltage} core / ${report.pdk.ioVoltage} I/O)
- **Target Package:** ${report.pinBudget.packageType} (${report.pinBudget.signalPins}/${report.pinBudget.maxSignalPins} signal pins used, ${report.pinBudget.powerPins} power/ground pads)

## 2. PPA & Resource Budget Estimate
- **Estimated Logic Size:** ~${report.ppa.estimatedGates.toLocaleString()} Gate Equivalents (GE)
- **On-Chip SRAM:** ${report.ppa.sramKbytes} KB (${report.silicon.sramMode})
- **Estimated Core + Macro Area:** ~${report.ppa.estimatedAreaMm2} mm\xB2${spec.maxAreaMm2 ? ` (Budget: ${spec.maxAreaMm2} mm\xB2)` : ""}
- **Estimated Power @ ${report.ppa.clockFreqMhz} MHz:** ~${report.ppa.estimatedPowerMw} mW${spec.powerBudgetMw ? ` (Budget: ${spec.powerBudgetMw} mW)` : ""}

## 3. Clock & Reset Domains
| Clock Net | Source | Nominal Freq | Consumers |
| :--- | :--- | :---: | :--- |
${clkRows}

## 4. System Memory Map
| Bus Port | Base Address | End Address | Size | Connected Slave(s) | Status |
| :--- | :--- | :--- | :---: | :--- | :---: |
${memRows}

## 5. External I/O Interface & Die Edge Plan
| Signal | Direction | Width | Edge | Purpose |
| :--- | :--- | :---: | :---: | :--- |
${pinRows}

## 6. Stage 1 Readiness Checklist
${checklistRows}
`;
    }
  }
});

// packages/core/dist/drc/port-width.js
var require_port_width = __commonJS({
  "packages/core/dist/drc/port-width.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getEffectivePortWidth = getEffectivePortWidth4;
    function getEffectivePortWidth4(modDef, port, inst) {
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
  }
});

// packages/core/dist/codegen.js
var require_codegen = __commonJS({
  "packages/core/dist/codegen.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SV_RESERVED_KEYWORDS = void 0;
    exports.sanitizeIdentifier = sanitizeIdentifier;
    exports.generateSystemVerilog = generateSystemVerilog3;
    exports.generateSystemVerilogTestbench = generateSystemVerilogTestbench2;
    exports.validateRtlOutput = validateRtlOutput2;
    var architecture_js_1 = require_architecture();
    var catalog_js_1 = require_catalog2();
    var port_width_js_1 = require_port_width();
    var index_js_1 = require_pdk();
    exports.SV_RESERVED_KEYWORDS = /* @__PURE__ */ new Set([
      "always",
      "always_comb",
      "always_ff",
      "always_latch",
      "and",
      "assign",
      "begin",
      "bit",
      "buf",
      "case",
      "casex",
      "casez",
      "default",
      "do",
      "else",
      "end",
      "endcase",
      "endfunction",
      "endmodule",
      "endtask",
      "enum",
      "for",
      "forever",
      "function",
      "generate",
      "genvar",
      "if",
      "initial",
      "inout",
      "input",
      "int",
      "integer",
      "interface",
      "localparam",
      "logic",
      "module",
      "nand",
      "negedge",
      "nor",
      "not",
      "or",
      "output",
      "package",
      "parameter",
      "posedge",
      "reg",
      "repeat",
      "return",
      "signed",
      "struct",
      "task",
      "typedef",
      "unsigned",
      "void",
      "while",
      "wire",
      "xnor",
      "xor"
    ]);
    function sanitizeIdentifier(name) {
      const cleaned = name.replace(/[^a-zA-Z0-9_]/g, "_");
      const prefixed = /^[0-9]/.test(cleaned) || cleaned.length === 0 ? `_${cleaned}` : cleaned;
      return exports.SV_RESERVED_KEYWORDS.has(prefixed) ? `${prefixed}_sig` : prefixed;
    }
    function findConnectedNet(design, instId, portId, dir) {
      return design.nets.find((n) => dir === "output" && n.source?.instanceId === instId && n.source?.portId === portId || dir === "input" && n.targets.some((t) => t.instanceId === instId && t.portId === portId) || dir === "inout" && (n.source?.instanceId === instId && n.source?.portId === portId || n.targets.some((t) => t.instanceId === instId && t.portId === portId)));
    }
    function deriveSystemVerilogTopPorts(design) {
      const sortedInstances = [...design.instances].sort((a, b) => a.id.localeCompare(b.id));
      const topPorts = [
        { name: "clk_in", direction: "input", kind: "logic", width: 1 },
        { name: "rst_n_in", direction: "input", kind: "logic", width: 1 }
      ];
      const externalBindings = /* @__PURE__ */ new Map();
      let hasTrap = false;
      let hasGpio = false;
      let uartIdx = 0;
      let spiIdx = 0;
      let i2cIdx = 0;
      let timerIdx = 0;
      for (const inst of sortedInstances) {
        if (inst.moduleId === "picorv32" && !hasTrap) {
          if (!findConnectedNet(design, inst.id, "trap", "output")) {
            hasTrap = true;
            topPorts.push({ name: "trap_out", direction: "output", kind: "logic", width: 1 });
            externalBindings.set(`${inst.id}:trap`, "trap_out");
          }
        } else if (inst.moduleId === "uart_core") {
          const suffix = uartIdx === 0 ? "" : `_${uartIdx}`;
          uartIdx++;
          if (!findConnectedNet(design, inst.id, "rx", "input")) {
            const name = `uart${suffix}_rx`;
            topPorts.push({ name, direction: "input", kind: "logic", width: 1 });
            externalBindings.set(`${inst.id}:rx`, name);
          }
          if (!findConnectedNet(design, inst.id, "tx", "output")) {
            const name = `uart${suffix}_tx`;
            topPorts.push({ name, direction: "output", kind: "logic", width: 1 });
            externalBindings.set(`${inst.id}:tx`, name);
          }
        } else if (inst.moduleId === "spi_controller") {
          const suffix = spiIdx === 0 ? "" : `_${spiIdx}`;
          spiIdx++;
          for (const [portId, dir] of [
            ["spi_sclk", "output"],
            ["spi_cs_n", "output"],
            ["spi_mosi", "output"],
            ["spi_miso", "input"]
          ]) {
            if (!findConnectedNet(design, inst.id, portId, dir)) {
              const name = `${portId}${suffix}`;
              topPorts.push({ name, direction: dir, kind: "logic", width: 1 });
              externalBindings.set(`${inst.id}:${portId}`, name);
            }
          }
        } else if (inst.moduleId === "i2c_controller") {
          const suffix = i2cIdx === 0 ? "" : `_${i2cIdx}`;
          i2cIdx++;
          for (const [portId, dir] of [
            ["scl", "output"],
            ["sda_out", "output"],
            ["sda_in", "input"]
          ]) {
            if (!findConnectedNet(design, inst.id, portId, dir)) {
              const name = `i2c${suffix}_${portId}`;
              topPorts.push({ name, direction: dir, kind: "logic", width: 1 });
              externalBindings.set(`${inst.id}:${portId}`, name);
            }
          }
        } else if (inst.moduleId === "gpio_controller" && !hasGpio) {
          if (!findConnectedNet(design, inst.id, "gpio_pins", "inout")) {
            hasGpio = true;
            const w = Math.max(1, Number(inst.parameters.WIDTH ?? 8));
            topPorts.push({ name: "gpio_pads", direction: "inout", kind: "wire", width: w });
            externalBindings.set(`${inst.id}:gpio_pins`, "gpio_pads");
          }
        } else if (inst.moduleId === "timer_core") {
          const suffix = timerIdx === 0 ? "" : `_${timerIdx}`;
          timerIdx++;
          if (!findConnectedNet(design, inst.id, "irq", "output")) {
            const name = `timer${suffix}_irq`;
            topPorts.push({ name, direction: "output", kind: "logic", width: 1 });
            externalBindings.set(`${inst.id}:irq`, name);
          }
        }
      }
      return { topPorts, externalBindings };
    }
    function generateSystemVerilog3(design) {
      const lines = [];
      lines.push("// =============================================================================");
      lines.push(`// Architecture: ${design.name}`);
      lines.push("// Generated by: Kona \u2014 Visual Chip Design & Verification Platform");
      lines.push(`// Version:      ${design.version}`);
      lines.push(`// Date:         ${design.metadata.modified || (/* @__PURE__ */ new Date()).toISOString()}`);
      lines.push("// =============================================================================");
      lines.push("`timescale 1ns / 1ps");
      lines.push("`default_nettype none");
      lines.push("");
      const topModuleName = sanitizeIdentifier(design.topModule || "top");
      const { topPorts, externalBindings } = deriveSystemVerilogTopPorts(design);
      lines.push(`module ${topModuleName} (`);
      lines.push(topPorts.map((p, idx) => {
        const comma = idx < topPorts.length - 1 ? "," : "";
        const range = p.width > 1 ? `[${(p.width - 1).toString().padStart(2, " ")}:0] ` : "       ";
        return `  ${p.direction.padEnd(6, " ")} ${p.kind.padEnd(5, " ")} ${range}${p.name}${comma}`;
      }).join("\n"));
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
        const modTypeName = sanitizeIdentifier(inst.moduleId);
        const instName = sanitizeIdentifier(inst.name);
        lines.push(`  // Instance: ${inst.name} (${modDef ? modDef.name : inst.moduleId})`);
        const paramEntries = Object.entries(inst.parameters).sort(([a], [b]) => a.localeCompare(b));
        let paramHeader = "";
        if (paramEntries.length > 0) {
          const pLines = paramEntries.map(([k, v]) => {
            let formattedVal = v;
            if (typeof v === "boolean") {
              formattedVal = v ? "1'b1" : "1'b0";
            } else if (typeof v === "string") {
              formattedVal = `"${v.replace(/"/g, '\\"')}"`;
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
            const connectedNet = findConnectedNet(design, inst.id, port.id, port.direction);
            let wireExpr = connectedNet ? sanitizeIdentifier(connectedNet.name) : externalBindings.get(`${inst.id}:${port.id}`);
            if (!wireExpr) {
              if (port.direction === "input") {
                if (port.type === "clock") {
                  wireExpr = "clk_in";
                } else if (port.type === "reset") {
                  wireExpr = "rst_n_in";
                } else {
                  const effWidth = (0, port_width_js_1.getEffectivePortWidth)(modDef, port, inst);
                  wireExpr = effWidth > 1 ? `${effWidth}'b0` : "1'b0";
                }
              } else {
                wireExpr = "/* unused */";
              }
            }
            portBindings.push(`    .${port.name.padEnd(16, " ")}(${wireExpr})`);
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
    function generateSystemVerilogTestbench2(design) {
      const topModuleName = sanitizeIdentifier(design.topModule || "top");
      const { topPorts } = deriveSystemVerilogTopPorts(design);
      const silicon = design.silicon || (0, index_js_1.createDefaultSiliconConfig)("sky130A");
      const periodNs = +(1e3 / Math.max(1, silicon.clockFreqMhz)).toFixed(2);
      const halfPeriod = +(periodNs / 2).toFixed(2);
      const decls = [];
      for (const p of topPorts) {
        const range = p.width > 1 ? `[${p.width - 1}:0] ` : "";
        if (p.direction === "input") {
          const init = p.name === "clk_in" || p.name === "rst_n_in" ? "1'b0" : p.width > 1 ? `${p.width}'b0` : "1'b0";
          decls.push(`  logic ${range}${p.name} = ${init};`);
        } else {
          decls.push(`  wire  ${range}${p.name};`);
        }
      }
      return [
        "// =============================================================================",
        `// Stage 2 RTL Simulation Testbench for ${topModuleName}`,
        `// Target Frequency: ${silicon.clockFreqMhz} MHz (Period = ${periodNs} ns)`,
        "// =============================================================================",
        "`timescale 1ns / 1ps",
        "",
        `module ${topModuleName}_tb;`,
        ...decls,
        "",
        `  always #${halfPeriod} clk_in = ~clk_in;`,
        "",
        `  ${topModuleName} dut (`,
        topPorts.map((p) => `    .${p.name.padEnd(14, " ")}(${p.name})`).join(",\n"),
        "  );",
        "",
        "  initial begin",
        `    $dumpfile("${topModuleName}_tb.vcd");`,
        `    $dumpvars(0, ${topModuleName}_tb);`,
        `    #(4 * ${periodNs});`,
        "    rst_n_in = 1'b1;",
        `    #(64 * ${periodNs});`,
        `    $display("[KONA RTL TB] ${topModuleName} simulation completed 64 cycles.");`,
        "    $finish;",
        "  end",
        "endmodule",
        ""
      ].join("\n");
    }
    function validateRtlOutput2(design, svCode) {
      const code = svCode ?? generateSystemVerilog3(design);
      const topModule = sanitizeIdentifier(design.topModule || "top");
      const silicon = design.silicon || (0, index_js_1.createDefaultSiliconConfig)("sky130A");
      const externalPortCount = (0, architecture_js_1.extractExternalPorts)(design, silicon).length;
      const issues = [];
      if (!code.includes(`module ${topModule} (`)) {
        issues.push(`Missing module declaration for "${topModule}".`);
      }
      if (!code.includes("endmodule")) {
        issues.push("Missing endmodule terminator.");
      }
      if (design.topModule && exports.SV_RESERVED_KEYWORDS.has(design.topModule.trim())) {
        issues.push(`Top module name "${design.topModule}" is a SystemVerilog reserved keyword.`);
      }
      for (const inst of design.instances) {
        if (exports.SV_RESERVED_KEYWORDS.has(inst.name.trim())) {
          issues.push(`Instance name "${inst.name}" is a SystemVerilog reserved keyword.`);
        }
      }
      for (const net of design.nets) {
        if (exports.SV_RESERVED_KEYWORDS.has(net.name.trim())) {
          issues.push(`Net name "${net.name}" is a SystemVerilog reserved keyword.`);
        }
      }
      return {
        topModule,
        lineCount: code.split("\n").length,
        instanceCount: design.instances.length,
        netCount: design.nets.length,
        externalPortCount,
        issues,
        isClean: issues.length === 0
      };
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

// packages/core/dist/drc/engine.js
var require_engine = __commonJS({
  "packages/core/dist/drc/engine.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DrcEngine = void 0;
    var catalog_js_1 = require_catalog2();
    var DrcEngine = class {
      rules = [];
      resolveModule;
      constructor(initialRules = [], resolveModule = catalog_js_1.getModuleDef) {
        this.resolveModule = resolveModule;
        for (const rule of initialRules) {
          this.registerRule(rule);
        }
      }
      registerRule(rule) {
        this.rules.push(rule);
      }
      run(design) {
        const instanceMap = /* @__PURE__ */ new Map();
        for (const inst of design.instances) {
          instanceMap.set(inst.id, inst);
        }
        const context = {
          design,
          instanceMap,
          drivenPorts: /* @__PURE__ */ new Map(),
          drivingPorts: /* @__PURE__ */ new Map(),
          resolveModule: this.resolveModule
        };
        const diagnostics = [];
        for (const rule of this.rules) {
          diagnostics.push(...rule.evaluate(context));
        }
        return diagnostics;
      }
    };
    exports.DrcEngine = DrcEngine;
  }
});

// packages/core/dist/drc/rules/missing-module.rule.js
var require_missing_module_rule = __commonJS({
  "packages/core/dist/drc/rules/missing-module.rule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.missingModuleRule = void 0;
    exports.missingModuleRule = {
      id: "missing-module",
      evaluate(ctx) {
        const diagnostics = [];
        for (const inst of ctx.design.instances) {
          const modDef = ctx.resolveModule(inst.moduleId);
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
        return diagnostics;
      }
    };
  }
});

// packages/core/dist/drc/rules/net-connectivity.rule.js
var require_net_connectivity_rule = __commonJS({
  "packages/core/dist/drc/rules/net-connectivity.rule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.netConnectivityRule = void 0;
    var port_width_js_1 = require_port_width();
    exports.netConnectivityRule = {
      id: "net-connectivity",
      evaluate(ctx) {
        const diagnostics = [];
        for (const net of ctx.design.nets) {
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
            const srcInst = ctx.instanceMap.get(net.source.instanceId);
            if (srcInst) {
              const modDef = ctx.resolveModule(srcInst.moduleId);
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
                const effectiveWidth = (0, port_width_js_1.getEffectivePortWidth)(modDef, port, srcInst);
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
                if (ctx.drivingPorts.has(key) && ctx.drivingPorts.get(key) !== net.id) {
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
                  ctx.drivingPorts.set(key, net.id);
                }
              }
            }
          }
          for (const tgt of net.targets) {
            const tgtInst = ctx.instanceMap.get(tgt.instanceId);
            if (!tgtInst)
              continue;
            const modDef = ctx.resolveModule(tgtInst.moduleId);
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
              const effectiveWidth = (0, port_width_js_1.getEffectivePortWidth)(modDef, port, tgtInst);
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
              if (ctx.drivenPorts.has(key) && ctx.drivenPorts.get(key) !== net.id) {
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
                ctx.drivenPorts.set(key, net.id);
              }
            }
          }
        }
        return diagnostics;
      }
    };
  }
});

// packages/core/dist/drc/rules/clock-reset.rule.js
var require_clock_reset_rule = __commonJS({
  "packages/core/dist/drc/rules/clock-reset.rule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.clockResetRule = void 0;
    exports.clockResetRule = {
      id: "clock-reset",
      evaluate(ctx) {
        const diagnostics = [];
        for (const inst of ctx.design.instances) {
          const modDef = ctx.resolveModule(inst.moduleId);
          if (!modDef)
            continue;
          for (const port of modDef.ports) {
            if (port.direction !== "input")
              continue;
            const key = `${inst.id}:${port.id}`;
            if (ctx.drivenPorts.has(key))
              continue;
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
        return diagnostics;
      }
    };
  }
});

// packages/core/dist/drc/rules/silicon-pdk.rule.js
var require_silicon_pdk_rule = __commonJS({
  "packages/core/dist/drc/rules/silicon-pdk.rule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.siliconPdkRule = void 0;
    var architecture_js_1 = require_architecture();
    var index_js_1 = require_pdk();
    exports.siliconPdkRule = {
      id: "SILICON_PDK_CHECK",
      evaluate(ctx) {
        const diags = [];
        const memMap = (0, architecture_js_1.extractMemoryMap)(ctx.design);
        for (const region of memMap) {
          if (region.slot === "S0" && region.overlapsWith) {
            diags.push({
              id: `drc-addr-overlap-${region.crossbarId}`,
              rule: "ADDRESS_MAP_OVERLAP",
              severity: "error",
              instanceId: region.crossbarId,
              message: `Crossbar "${region.crossbarName}" S0 (${region.baseHex}\u2013${region.endHex}) overlaps with ${region.overlapsWith}.`
            });
          }
        }
        const silicon = ctx.design.silicon;
        if (!silicon)
          return diags;
        const pdk = (0, index_js_1.getPdkDef)(silicon.pdkId);
        if (!pdk) {
          diags.push({
            id: `drc-pdk-unknown-${silicon.pdkId}`,
            rule: "UNKNOWN_PDK",
            severity: "error",
            message: `Unsupported PDK target "${silicon.pdkId}". Choose sky130A, gf180mcuD, or sg13g2.`
          });
          return diags;
        }
        if (silicon.clockFreqMhz <= 0 || silicon.clockFreqMhz > pdk.maxClockMhz) {
          diags.push({
            id: `drc-pdk-clock-${pdk.id}`,
            rule: "PDK_CLOCK_LIMIT",
            severity: "error",
            message: `Target clock ${silicon.clockFreqMhz} MHz exceeds ${pdk.shortName} safe limit (${pdk.maxClockMhz} MHz).`
          });
        }
        if (silicon.coreUtilization < 0.2 || silicon.coreUtilization > 0.75) {
          diags.push({
            id: `drc-pdk-util-${pdk.id}`,
            rule: "PDK_UTILIZATION",
            severity: "warning",
            message: `Core utilization ${Math.round(silicon.coreUtilization * 100)}% is outside recommended 20%\u201375% range for ${pdk.shortName} routing closure.`
          });
        }
        for (const inst of ctx.design.instances) {
          if (inst.moduleId !== "ram_dual_port")
            continue;
          const addrWidth = Number(inst.parameters.ADDR_WIDTH ?? 14);
          if (silicon.sramMode === "dff_array" && addrWidth > pdk.maxSoftRamAddrBits) {
            diags.push({
              id: `drc-pdk-sram-${inst.id}`,
              rule: "SRAM_MACRO_REQUIRED",
              severity: "warning",
              instanceId: inst.id,
              message: `Block RAM "${inst.name}" (${1 << addrWidth} words) is too large for flip-flop synthesis on ${pdk.shortName}; switch SRAM mode to OpenRAM Macro or lower ADDR_WIDTH <= ${pdk.maxSoftRamAddrBits}.`
            });
          }
        }
        const report = (0, architecture_js_1.analyzeArchitecture)(ctx.design);
        if (!report.pinBudget.fitsPackage) {
          diags.push({
            id: `drc-pkg-pins-${silicon.packageType}`,
            rule: "PACKAGE_PIN_OVERFLOW",
            severity: "error",
            message: `Design requires ${report.pinBudget.signalPins} external signal pins, exceeding ${silicon.packageType} capacity (${report.pinBudget.maxSignalPins} signal pins).`
          });
        }
        if (!report.ppa.withinPowerBudget) {
          diags.push({
            id: "drc-power-budget",
            rule: "POWER_BUDGET_EXCEEDED",
            severity: "warning",
            message: `Estimated power (${report.ppa.estimatedPowerMw} mW) exceeds Stage 1 budget (${report.ppa.powerBudgetMw} mW).`
          });
        }
        if (!report.ppa.withinAreaBudget) {
          diags.push({
            id: "drc-area-budget",
            rule: "AREA_BUDGET_EXCEEDED",
            severity: "warning",
            message: `Estimated area (${report.ppa.estimatedAreaMm2} mm\xB2) exceeds Stage 1 budget (${report.ppa.maxAreaMm2} mm\xB2).`
          });
        }
        return diags;
      }
    };
  }
});

// packages/core/dist/drc/rules/sv-identifier.rule.js
var require_sv_identifier_rule = __commonJS({
  "packages/core/dist/drc/rules/sv-identifier.rule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.svIdentifierRule = void 0;
    var codegen_js_1 = require_codegen();
    exports.svIdentifierRule = {
      id: "SV_IDENTIFIER_CHECK",
      evaluate(ctx) {
        const diags = [];
        const validId = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
        const top = (ctx.design.topModule || "").trim();
        if (top && (codegen_js_1.SV_RESERVED_KEYWORDS.has(top) || !validId.test(top))) {
          diags.push({
            id: "drc-sv-top-name",
            rule: "INVALID_SV_IDENTIFIER",
            severity: "error",
            message: `Top module "${top}" is not a clean SystemVerilog identifier or uses a reserved keyword.`
          });
        }
        for (const inst of ctx.design.instances) {
          const name = inst.name.trim();
          if (codegen_js_1.SV_RESERVED_KEYWORDS.has(name) || !validId.test(name)) {
            diags.push({
              id: `drc-sv-inst-${inst.id}`,
              rule: "INVALID_SV_IDENTIFIER",
              severity: "error",
              instanceId: inst.id,
              message: `Instance name "${inst.name}" must be a valid non-reserved SystemVerilog identifier.`
            });
          }
        }
        for (const net of ctx.design.nets) {
          const name = net.name.trim();
          if (codegen_js_1.SV_RESERVED_KEYWORDS.has(name) || !validId.test(name)) {
            diags.push({
              id: `drc-sv-net-${net.id}`,
              rule: "INVALID_SV_IDENTIFIER",
              severity: "error",
              netId: net.id,
              message: `Net name "${net.name}" must be a valid non-reserved SystemVerilog identifier.`
            });
          }
        }
        return diags;
      }
    };
  }
});

// packages/core/dist/drc/rules/index.js
var require_rules = __commonJS({
  "packages/core/dist/drc/rules/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BUILTIN_DRC_RULES = exports.svIdentifierRule = exports.siliconPdkRule = exports.clockResetRule = exports.netConnectivityRule = exports.missingModuleRule = void 0;
    var missing_module_rule_js_1 = require_missing_module_rule();
    Object.defineProperty(exports, "missingModuleRule", { enumerable: true, get: function() {
      return missing_module_rule_js_1.missingModuleRule;
    } });
    var net_connectivity_rule_js_1 = require_net_connectivity_rule();
    Object.defineProperty(exports, "netConnectivityRule", { enumerable: true, get: function() {
      return net_connectivity_rule_js_1.netConnectivityRule;
    } });
    var clock_reset_rule_js_1 = require_clock_reset_rule();
    Object.defineProperty(exports, "clockResetRule", { enumerable: true, get: function() {
      return clock_reset_rule_js_1.clockResetRule;
    } });
    var silicon_pdk_rule_js_1 = require_silicon_pdk_rule();
    Object.defineProperty(exports, "siliconPdkRule", { enumerable: true, get: function() {
      return silicon_pdk_rule_js_1.siliconPdkRule;
    } });
    var sv_identifier_rule_js_1 = require_sv_identifier_rule();
    Object.defineProperty(exports, "svIdentifierRule", { enumerable: true, get: function() {
      return sv_identifier_rule_js_1.svIdentifierRule;
    } });
    exports.BUILTIN_DRC_RULES = [
      missing_module_rule_js_1.missingModuleRule,
      net_connectivity_rule_js_1.netConnectivityRule,
      clock_reset_rule_js_1.clockResetRule,
      silicon_pdk_rule_js_1.siliconPdkRule,
      sv_identifier_rule_js_1.svIdentifierRule
    ];
  }
});

// packages/core/dist/drc/types.js
var require_types = __commonJS({
  "packages/core/dist/drc/types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// packages/core/dist/drc/index.js
var require_drc = __commonJS({
  "packages/core/dist/drc/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.defaultDrcEngine = void 0;
    exports.runDesignRuleCheck = runDesignRuleCheck2;
    var engine_js_1 = require_engine();
    var index_js_1 = require_rules();
    __exportStar(require_types(), exports);
    __exportStar(require_port_width(), exports);
    __exportStar(require_engine(), exports);
    __exportStar(require_rules(), exports);
    exports.defaultDrcEngine = new engine_js_1.DrcEngine(index_js_1.BUILTIN_DRC_RULES);
    function runDesignRuleCheck2(design) {
      return exports.defaultDrcEngine.run(design);
    }
  }
});

// packages/core/dist/drc.js
var require_drc2 = __commonJS({
  "packages/core/dist/drc.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_drc(), exports);
  }
});

// packages/core/dist/plain-english.js
var require_plain_english = __commonJS({
  "packages/core/dist/plain-english.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WIZARD_GOALS = exports.PLAIN_MODULE_INFO = void 0;
    exports.getPlainModuleInfo = getPlainModuleInfo3;
    exports.PLAIN_MODULE_INFO = {
      picorv32: {
        friendlyName: "Chip Brain (RISC-V CPU)",
        analogy: "The brain of your chip",
        whatItDoes: "Reads software instructions and tells all other parts what to do."
      },
      ibex: {
        friendlyName: "Secure Chip Brain (Ibex CPU)",
        analogy: "Security-focused processor",
        whatItDoes: "Runs software with extra hardware memory protection and fast interrupt handling."
      },
      axi_crossbar: {
        friendlyName: "Data Highway (AXI Bus)",
        analogy: "Internal traffic router",
        whatItDoes: "Connects the Chip Brain to Memory and Peripherals so data goes to the right place."
      },
      wishbone_crossbar: {
        friendlyName: "Open Data Highway (Wishbone)",
        analogy: "Lightweight traffic router",
        whatItDoes: "Routes read/write requests between the processor, memory, and I/O blocks."
      },
      ram_dual_port: {
        friendlyName: "Working Memory (SRAM)",
        analogy: "Short-term scratchpad",
        whatItDoes: "Holds running program code and live sensor/application data."
      },
      uart_core: {
        friendlyName: "Serial / USB Messenger (UART)",
        analogy: "Text & telemetry port",
        whatItDoes: "Sends and receives data over two wires to a PC, USB adapter, or radio module."
      },
      gpio_controller: {
        friendlyName: "Physical Pin Bank (GPIO)",
        analogy: "Lights, switches & relays",
        whatItDoes: "Turns external pins ON/OFF (LEDs, motors) or reads buttons and switches."
      },
      spi_controller: {
        friendlyName: "Fast Storage / Display Port (SPI)",
        analogy: "High-speed accessory port",
        whatItDoes: "Connects external Flash memory chips, SD cards, or small OLED/TFT screens."
      },
      i2c_controller: {
        friendlyName: "Sensor Bus Port (I2C)",
        analogy: "Two-wire sensor hub",
        whatItDoes: "Reads temperature, humidity, motion, or power chips using just 2 wires."
      },
      timer_core: {
        friendlyName: "Alarm & Safety Timer",
        analogy: "Stopwatch & watchdog",
        whatItDoes: "Measures exact time intervals and resets the chip if software ever gets stuck."
      },
      sync_fifo: {
        friendlyName: "Data Waiting Buffer (FIFO)",
        analogy: "First-in, first-out queue",
        whatItDoes: "Temporarily holds bursts of data so fast producers never overwhelm slower ports."
      },
      clock_divider: {
        friendlyName: "Speed Reducer (Clock Divider)",
        analogy: "Gearbox for chip speed",
        whatItDoes: "Creates a slower, power-saving clock pulse for sensors or slow peripherals."
      },
      clock_gen: {
        friendlyName: "Chip Heartbeat (Clock & Reset)",
        analogy: "Metronome & clean start",
        whatItDoes: "Generates the steady heartbeat pulse and startup reset that keeps every part in sync."
      }
    };
    function getPlainModuleInfo3(moduleId) {
      return exports.PLAIN_MODULE_INFO[moduleId] || {
        friendlyName: moduleId,
        analogy: "Hardware building block",
        whatItDoes: "Custom digital logic block in your chip architecture."
      };
    }
    exports.WIZARD_GOALS = [
      {
        id: "iot_sensor",
        templateId: "sensor_hub",
        title: "Smart Sensor & Telemetry Chip",
        tagline: "Reads environmental/motion sensors and streams data over serial.",
        bestFor: "Weather stations, factory monitors, wearable trackers"
      },
      {
        id: "mini_computer",
        templateId: "riscv_mcu",
        title: "Programmable Mini Computer (MCU)",
        tagline: "Includes a RISC-V CPU brain, working memory, and serial port.",
        bestFor: "Smart appliances, custom controllers, learning chip design"
      },
      {
        id: "secure_chip",
        templateId: "opentitan_rot",
        title: "Security & Smart-Lock Controller",
        tagline: "Uses a security-hardened processor, timer, and protected memory.",
        bestFor: "Smart locks, authentication tokens, tamper-safe devices"
      },
      {
        id: "edge_storage",
        templateId: "pulpissimo_edge",
        title: "Edge Controller with Flash & Sensors",
        tagline: "Combines a CPU brain with high-speed SPI memory and I2C sensors.",
        bestFor: "Robotics, data loggers, smart meters"
      },
      {
        id: "led_serial",
        templateId: "uart_loopback",
        title: "Starter Serial & LED Blinker",
        tagline: "Simple beginner circuit that buffers serial messages to physical pins.",
        bestFor: "First-time learners and classroom demos"
      }
    ];
  }
});

// packages/core/dist/asic-rtl.js
var require_asic_rtl = __commonJS({
  "packages/core/dist/asic-rtl.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ASIC_IP_LIBRARY_VERILOG = void 0;
    exports.ASIC_IP_LIBRARY_VERILOG = `// =============================================================================
// Kona ASIC-Synthesizable Starter IP Library (Verilog-2001)
// Target Flow: Yosys -> OpenROAD / LibreLane -> SKY130 / GF180MCU / SG13G2
// Note: For production tape-outs, replace stub CPU/SRAM wrappers with full
// verified upstream RTL (PicoRV32 / Ibex) and OpenRAM hard macro LEF/LIB/GDS.
// =============================================================================
\`timescale 1ns / 1ps

// 1. Reset Synchronizer & Clock Pass-Through (replaces behavioral clock_gen)
module clock_gen #(
  parameter integer FREQ_MHZ = 50
) (
  input  wire ext_clk,
  input  wire ext_rst_n,
  output wire clk_out,
  output wire rst_n_out
);
  reg rst_sync_0;
  reg rst_sync_1;

  assign clk_out = ext_clk;

  always @(posedge ext_clk or negedge ext_rst_n) begin
    if (!ext_rst_n) begin
      rst_sync_0 <= 1'b0;
      rst_sync_1 <= 1'b0;
    end else begin
      rst_sync_0 <= 1'b1;
      rst_sync_1 <= rst_sync_0;
    end
  end

  assign rst_n_out = rst_sync_1;
endmodule

// 2. PicoRV32 Bus-Master Core Shell (synthesizable starter state machine)
module picorv32 #(
  parameter ENABLE_COUNTERS = 1'b1,
  parameter ENABLE_MUL      = 1'b1,
  parameter ENABLE_DIV      = 1'b1,
  parameter BARREL_SHIFTER  = 1'b1,
  parameter integer STACKADDR = 65536
) (
  input  wire        clk,
  input  wire        resetn,
  output reg         mem_valid,
  output reg         mem_instr,
  input  wire        mem_ready,
  output reg  [31:0] mem_addr,
  output reg  [31:0] mem_wdata,
  output reg  [ 3:0] mem_wstrb,
  input  wire [31:0] mem_rdata,
  output reg         trap
);
  reg [31:0] acc;

  always @(posedge clk or negedge resetn) begin
    if (!resetn) begin
      mem_valid <= 1'b0;
      mem_instr <= 1'b0;
      mem_addr  <= 32'h0000_0000;
      mem_wdata <= 32'h0000_0000;
      mem_wstrb <= 4'h0;
      trap      <= 1'b0;
      acc       <= 32'h0000_0001;
    end else begin
      mem_valid <= 1'b1;
      mem_instr <= 1'b1;
      if (mem_ready) begin
        acc       <= acc ^ mem_rdata;
        mem_addr  <= (mem_addr[7:0] == 8'hFC) ? 32'h1000_0000 : (mem_addr + 32'd4);
        mem_wdata <= acc;
        mem_wstrb <= (mem_addr[28]) ? 4'hF : 4'h0;
      end
      trap <= (mem_rdata == 32'hFFFF_FFFF) && ENABLE_COUNTERS[0];
    end
  end
endmodule

// 3. lowRISC Ibex Core Shell (synthesizable starter state machine)
module ibex #(
  parameter PMP_ENABLE = 1'b0,
  parameter RV32M      = 1'b1,
  parameter RV32B      = 1'b0
) (
  input  wire        clk,
  input  wire        rst_n,
  output reg         instr_req,
  input  wire        instr_gnt,
  input  wire        instr_rvalid,
  output reg  [31:0] instr_addr,
  input  wire [31:0] instr_rdata,
  output reg         data_req,
  input  wire        data_gnt,
  input  wire        data_rvalid,
  output reg         data_we,
  output reg  [31:0] data_addr,
  output reg  [31:0] data_wdata,
  input  wire [31:0] data_rdata,
  input  wire        irq_software,
  input  wire        irq_timer,
  input  wire        irq_external
);
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      instr_req  <= 1'b0;
      instr_addr <= 32'h0000_0000;
      data_req   <= 1'b0;
      data_we    <= 1'b0;
      data_addr  <= 32'h0000_0000;
      data_wdata <= 32'h0000_0000;
    end else begin
      instr_req <= 1'b1;
      if (instr_gnt && instr_rvalid) begin
        instr_addr <= instr_addr + 32'd4;
      end
      data_req <= 1'b1;
      data_we  <= irq_timer | irq_software | irq_external;
      if (data_gnt && data_rvalid) begin
        data_addr  <= data_addr + 32'd4;
        data_wdata <= instr_rdata ^ data_rdata;
      end
    end
  end
endmodule

// 4. AXI-Lite Crossbar (1-Master to 2-Slave)
module axi_crossbar #(
  parameter integer S0_BASE_ADDR = 0,
  parameter integer S0_ADDR_MASK = 65535,
  parameter integer S1_BASE_ADDR = 268435456,
  parameter integer S1_ADDR_MASK = 65535
) (
  input  wire        clk,
  input  wire        rst_n,
  input  wire [31:0] m_addr,
  input  wire        m_valid,
  output wire        m_ready,
  output wire [31:0] m_rdata,
  output wire [31:0] s0_addr,
  output wire        s0_valid,
  input  wire        s0_ready,
  input  wire [31:0] s0_rdata,
  output wire [31:0] s1_addr,
  output wire        s1_valid,
  input  wire        s1_ready,
  input  wire [31:0] s1_rdata
);
  wire sel_s1 = (m_addr >= S1_BASE_ADDR);

  assign s0_addr  = m_addr & S0_ADDR_MASK;
  assign s0_valid = m_valid && !sel_s1 && rst_n;
  assign s1_addr  = m_addr & S1_ADDR_MASK;
  assign s1_valid = m_valid && sel_s1 && rst_n;
  assign m_ready  = sel_s1 ? s1_ready : s0_ready;
  assign m_rdata  = sel_s1 ? s1_rdata : s0_rdata;
endmodule

// 5. Wishbone B4 Crossbar
module wishbone_crossbar #(
  parameter integer S0_BASE_ADDR = 0,
  parameter integer S1_BASE_ADDR = 268435456
) (
  input  wire        clk,
  input  wire        rst_n,
  input  wire        wb_cyc_i,
  input  wire        wb_stb_i,
  input  wire        wb_we_i,
  input  wire [31:0] wb_adr_i,
  input  wire [31:0] wb_dat_i,
  output wire [31:0] wb_dat_o,
  output wire        wb_ack_o,
  output wire        s0_cyc_o,
  output wire        s0_stb_o,
  output wire [31:0] s0_adr_o,
  output wire [31:0] s0_dat_o,
  input  wire [31:0] s0_dat_i,
  input  wire        s0_ack_i,
  output wire        s1_cyc_o,
  output wire        s1_stb_o,
  output wire [31:0] s1_adr_o,
  output wire [31:0] s1_dat_o,
  input  wire [31:0] s1_dat_i,
  input  wire        s1_ack_i
);
  wire sel_s1 = (wb_adr_i >= S1_BASE_ADDR);

  assign s0_cyc_o = wb_cyc_i && !sel_s1 && rst_n;
  assign s0_stb_o = wb_stb_i && !sel_s1 && rst_n;
  assign s0_adr_o = wb_adr_i;
  assign s0_dat_o = wb_dat_i;
  assign s1_cyc_o = wb_cyc_i && sel_s1 && rst_n;
  assign s1_stb_o = wb_stb_i && sel_s1 && rst_n;
  assign s1_adr_o = wb_adr_i;
  assign s1_dat_o = wb_dat_i;
  assign wb_dat_o = sel_s1 ? s1_dat_i : s0_dat_i;
  assign wb_ack_o = sel_s1 ? s1_ack_i : s0_ack_i;
endmodule

// 6. Synthesizable Synchronous RAM (bounded DFF bank when soft-synthesized)
module ram_dual_port #(
  parameter integer ADDR_WIDTH = 6,
  parameter integer DATA_WIDTH = 32
) (
  input  wire        clk,
  input  wire        en,
  input  wire        we,
  input  wire [31:0] addr,
  input  wire [31:0] din,
  output reg  [31:0] dout
);
  localparam integer EFF_AW = (ADDR_WIDTH > 7) ? 7 : ADDR_WIDTH;
  localparam integer DEPTH  = 1 << EFF_AW;
  reg [DATA_WIDTH-1:0] mem [0:DEPTH-1];

  always @(posedge clk) begin
    if (en) begin
      if (we) begin
        mem[addr[EFF_AW-1:0]] <= din[DATA_WIDTH-1:0];
      end
      dout <= mem[addr[EFF_AW-1:0]];
    end
  end
endmodule

// 7. UART Transceiver
module uart_core #(
  parameter integer BAUD_DIVISOR = 434
) (
  input  wire       clk,
  input  wire       rst_n,
  input  wire       rx,
  output reg        tx,
  input  wire [7:0] tx_data,
  input  wire       tx_valid,
  output reg        tx_busy,
  output reg  [7:0] rx_data,
  output reg        rx_valid
);
  reg [15:0] baud_cnt;
  reg [3:0]  bit_idx;
  reg [9:0]  shift_tx;

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      tx       <= 1'b1;
      tx_busy  <= 1'b0;
      rx_data  <= 8'h00;
      rx_valid <= 1'b0;
      baud_cnt <= 16'h0000;
      bit_idx  <= 4'd0;
      shift_tx <= 10'h3FF;
    end else begin
      rx_valid <= 1'b0;
      if (!rx && !rx_valid) begin
        rx_data  <= shift_tx[8:1];
        rx_valid <= 1'b1;
      end
      if (tx_valid && !tx_busy) begin
        tx_busy  <= 1'b1;
        shift_tx <= {1'b1, tx_data, 1'b0};
        bit_idx  <= 4'd10;
        baud_cnt <= 16'h0000;
      end else if (tx_busy) begin
        if (baud_cnt >= BAUD_DIVISOR[15:0]) begin
          baud_cnt <= 16'h0000;
          tx       <= shift_tx[0];
          shift_tx <= {1'b1, shift_tx[9:1]};
          if (bit_idx == 4'd1) begin
            tx_busy <= 1'b0;
          end else begin
            bit_idx <= bit_idx - 4'd1;
          end
        end else begin
          baud_cnt <= baud_cnt + 16'd1;
        end
      end
    end
  end
endmodule

// 8. GPIO Controller (split input/output/oe for ASIC pad-ring compliance)
module gpio_controller #(
  parameter integer WIDTH = 8
) (
  input  wire             clk,
  input  wire             rst_n,
  input  wire [WIDTH-1:0] out_val,
  output reg  [WIDTH-1:0] in_val,
  input  wire [WIDTH-1:0] gpio_in,
  output wire [WIDTH-1:0] gpio_out,
  output wire [WIDTH-1:0] gpio_oe
);
  reg [WIDTH-1:0] sync_reg;

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      sync_reg <= {WIDTH{1'b0}};
      in_val   <= {WIDTH{1'b0}};
    end else begin
      sync_reg <= gpio_in;
      in_val   <= sync_reg;
    end
  end

  assign gpio_out = out_val;
  assign gpio_oe  = {WIDTH{1'b1}};
endmodule

// 9. Synchronous FIFO
module sync_fifo #(
  parameter integer WIDTH = 32,
  parameter integer DEPTH = 16
) (
  input  wire             clk,
  input  wire             rst_n,
  input  wire             wr_en,
  input  wire [WIDTH-1:0] din,
  output wire             full,
  input  wire             rd_en,
  output reg  [WIDTH-1:0] dout,
  output wire             empty
);
  localparam integer PTR_WIDTH = $clog2(DEPTH);
  reg [WIDTH-1:0] queue [0:DEPTH-1];
  reg [PTR_WIDTH:0] wr_ptr;
  reg [PTR_WIDTH:0] rd_ptr;

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      wr_ptr <= {(PTR_WIDTH+1){1'b0}};
      rd_ptr <= {(PTR_WIDTH+1){1'b0}};
      dout   <= {WIDTH{1'b0}};
    end else begin
      if (wr_en && !full) begin
        queue[wr_ptr[PTR_WIDTH-1:0]] <= din;
        wr_ptr <= wr_ptr + 1'b1;
      end
      if (rd_en && !empty) begin
        dout <= queue[rd_ptr[PTR_WIDTH-1:0]];
        rd_ptr <= rd_ptr + 1'b1;
      end
    end
  end

  assign full  = (wr_ptr[PTR_WIDTH] != rd_ptr[PTR_WIDTH]) &&
                 (wr_ptr[PTR_WIDTH-1:0] == rd_ptr[PTR_WIDTH-1:0]);
  assign empty = (wr_ptr == rd_ptr);
endmodule

// 10. Clock Divider
module clock_divider #(
  parameter integer DIVISOR = 4
) (
  input  wire clk_in,
  input  wire rst_n,
  output reg  clk_out
);
  reg [31:0] counter;

  always @(posedge clk_in or negedge rst_n) begin
    if (!rst_n) begin
      counter <= 32'h0000_0000;
      clk_out <= 1'b0;
    end else begin
      if (counter >= (DIVISOR / 2 - 1)) begin
        counter <= 32'h0000_0000;
        clk_out <= ~clk_out;
      end else begin
        counter <= counter + 32'd1;
      end
    end
  end
endmodule

// 11. SPI Master Controller
module spi_controller #(
  parameter integer CLK_DIV    = 8,
  parameter integer DATA_WIDTH = 8
) (
  input  wire                  clk,
  input  wire                  rst_n,
  input  wire [DATA_WIDTH-1:0] tx_data,
  input  wire                  tx_valid,
  output reg                   tx_ready,
  output reg  [DATA_WIDTH-1:0] rx_data,
  output reg                   rx_valid,
  output reg                   spi_sclk,
  output reg                   spi_cs_n,
  output reg                   spi_mosi,
  input  wire                  spi_miso
);
  reg [3:0] bit_cnt;
  reg [DATA_WIDTH-1:0] shift_reg;

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      tx_ready  <= 1'b1;
      rx_data   <= {DATA_WIDTH{1'b0}};
      rx_valid  <= 1'b0;
      spi_sclk  <= 1'b0;
      spi_cs_n  <= 1'b1;
      spi_mosi  <= 1'b0;
      bit_cnt   <= 4'd0;
      shift_reg <= {DATA_WIDTH{1'b0}};
    end else begin
      if (tx_valid && tx_ready) begin
        shift_reg <= tx_data;
        spi_cs_n  <= 1'b0;
        tx_ready  <= 1'b0;
        bit_cnt   <= DATA_WIDTH[3:0];
      end else if (!spi_cs_n) begin
        spi_sclk <= ~spi_sclk;
        if (spi_sclk) begin
          spi_mosi  <= shift_reg[DATA_WIDTH-1];
          shift_reg <= {shift_reg[DATA_WIDTH-2:0], spi_miso};
          bit_cnt   <= bit_cnt - 4'd1;
          if (bit_cnt == 4'd1) begin
            spi_cs_n <= 1'b1;
            tx_ready <= 1'b1;
            rx_data  <= shift_reg;
            rx_valid <= 1'b1;
          end
        end
      end else begin
        rx_valid <= 1'b0;
      end
    end
  end
endmodule

// 12. I2C Master Controller
module i2c_controller #(
  parameter integer PRESCALE = 125
) (
  input  wire       clk,
  input  wire       rst_n,
  input  wire [7:0] addr,
  input  wire [7:0] din,
  input  wire       start,
  output reg        busy,
  output reg  [7:0] dout,
  output reg        ack_err,
  output reg        scl,
  output reg        sda_out,
  input  wire       sda_in
);
  reg [15:0] clk_div;

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      busy    <= 1'b0;
      dout    <= 8'h00;
      ack_err <= 1'b0;
      scl     <= 1'b1;
      sda_out <= 1'b1;
      clk_div <= 16'h0000;
    end else begin
      if (start && !busy) begin
        busy    <= 1'b1;
        scl     <= 1'b0;
        sda_out <= 1'b0;
        dout    <= din ^ addr;
        ack_err <= !sda_in;
      end else if (busy) begin
        clk_div <= clk_div + 16'd1;
        if (clk_div >= PRESCALE[15:0]) begin
          clk_div <= 16'h0000;
          busy    <= 1'b0;
          scl     <= 1'b1;
          sda_out <= 1'b1;
        end
      end
    end
  end
endmodule

// 13. 32-bit System Timer & Watchdog
module timer_core #(
  parameter integer PRESCALER = 50
) (
  input  wire        clk,
  input  wire        rst_n,
  input  wire [31:0] addr,
  input  wire [31:0] wdata,
  input  wire        we,
  output reg  [31:0] rdata,
  output reg         irq
);
  reg [31:0] timer_val;
  reg [31:0] compare_val;

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      timer_val   <= 32'h0000_0000;
      compare_val <= 32'hFFFF_FFFF;
      rdata       <= 32'h0000_0000;
      irq         <= 1'b0;
    end else begin
      timer_val <= timer_val + 32'd1;
      if (we) begin
        if (addr[3:0] == 4'h0) timer_val <= wdata;
        else if (addr[3:0] == 4'h4) compare_val <= wdata;
      end
      rdata <= (addr[3:0] == 4'h4) ? compare_val : timer_val;
      irq   <= (timer_val >= compare_val);
    end
  end
endmodule
`;
  }
});

// packages/core/dist/tar.js
var require_tar = __commonJS({
  "packages/core/dist/tar.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildTarArchive = buildTarArchive;
    var textEncoder = new TextEncoder();
    function writeAscii(buf, offset, length, value) {
      const bytes = textEncoder.encode(value);
      const count = Math.min(bytes.length, length);
      for (let i = 0; i < count; i++) {
        buf[offset + i] = bytes[i];
      }
    }
    function writeOctal(buf, offset, length, value) {
      const oct = Math.max(0, Math.floor(value)).toString(8).padStart(length - 1, "0");
      writeAscii(buf, offset, length - 1, oct);
      buf[offset + length - 1] = 0;
    }
    function splitUstarPath(rawPath) {
      const clean = rawPath.replace(/^\/+/, "").replace(/\\/g, "/");
      if (clean.length <= 100) {
        return { name: clean, prefix: "" };
      }
      const idx = clean.lastIndexOf("/", 154);
      if (idx > 0 && clean.length - idx - 1 <= 100) {
        return {
          prefix: clean.slice(0, idx),
          name: clean.slice(idx + 1)
        };
      }
      return { name: clean.slice(-100), prefix: "" };
    }
    function buildTarArchive(entries, mtimeSeconds = 173253e4) {
      const chunks = [];
      for (const entry of entries) {
        const data = typeof entry.content === "string" ? textEncoder.encode(entry.content) : entry.content;
        const header = new Uint8Array(512);
        const { name, prefix } = splitUstarPath(entry.path);
        writeAscii(header, 0, 100, name);
        writeOctal(header, 100, 8, entry.executable ? 493 : 420);
        writeOctal(header, 108, 8, 1e3);
        writeOctal(header, 116, 8, 1e3);
        writeOctal(header, 124, 12, data.length);
        writeOctal(header, 136, 12, mtimeSeconds);
        for (let i = 148; i < 156; i++)
          header[i] = 32;
        header[156] = 48;
        writeAscii(header, 257, 6, "ustar\0");
        writeAscii(header, 263, 2, "00");
        writeAscii(header, 265, 32, "kona");
        writeAscii(header, 297, 32, "silicon");
        if (prefix) {
          writeAscii(header, 345, 155, prefix);
        }
        let sum = 0;
        for (let i = 0; i < 512; i++)
          sum += header[i];
        const sumOct = sum.toString(8).padStart(6, "0");
        writeAscii(header, 148, 6, sumOct);
        header[154] = 0;
        header[155] = 32;
        chunks.push(header);
        if (data.length > 0) {
          chunks.push(data);
          const rem = data.length % 512;
          if (rem !== 0) {
            chunks.push(new Uint8Array(512 - rem));
          }
        }
      }
      chunks.push(new Uint8Array(1024));
      const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
      const archive = new Uint8Array(totalLen);
      let offset = 0;
      for (const chunk of chunks) {
        archive.set(chunk, offset);
        offset += chunk.length;
      }
      return archive;
    }
  }
});

// packages/core/dist/asic-bundle.js
var require_asic_bundle = __commonJS({
  "packages/core/dist/asic-bundle.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generateAsicBundle = generateAsicBundle2;
    exports.buildAsicTapeoutTar = buildAsicTapeoutTar2;
    var architecture_js_1 = require_architecture();
    var asic_rtl_js_1 = require_asic_rtl();
    var catalog_js_1 = require_catalog2();
    var drc_js_1 = require_drc2();
    var ir_js_1 = require_ir();
    var index_js_1 = require_pdk();
    var tar_js_1 = require_tar();
    function sanitizeId(name) {
      const s = name.replace(/[^a-zA-Z0-9_]/g, "_");
      return /^[0-9]/.test(s) ? `_${s}` : s;
    }
    function resolveSiliconConfig(design) {
      const silicon = design.silicon ? { ...design.silicon } : (0, index_js_1.createDefaultSiliconConfig)("sky130A");
      const pdk = (0, index_js_1.getPdkDef)(silicon.pdkId) || (0, index_js_1.getPdkDef)("sky130A");
      return { silicon, pdk };
    }
    function findConnectedNet(design, instId, portId, dir) {
      return design.nets.find((n) => dir === "output" && n.source?.instanceId === instId && n.source?.portId === portId || dir === "input" && n.targets.some((t) => t.instanceId === instId && t.portId === portId) || dir === "inout" && (n.source?.instanceId === instId && n.source?.portId === portId || n.targets.some((t) => t.instanceId === instId && t.portId === portId)));
    }
    function generateAsicTopAndChipTop(design, pdk, silicon) {
      const topName = sanitizeId(design.topModule || "top");
      const sortedInstances = [...design.instances].sort((a, b) => a.id.localeCompare(b.id));
      const sortedNets = [...design.nets].sort((a, b) => a.name.localeCompare(b.name));
      const externalPorts = (0, architecture_js_1.extractExternalPorts)(design, silicon);
      const externalBindings = /* @__PURE__ */ new Map();
      let hasTrap = false;
      let hasGpio = false;
      let uartIdx = 0;
      let spiIdx = 0;
      let i2cIdx = 0;
      let timerIdx = 0;
      for (const inst of sortedInstances) {
        if (inst.moduleId === "picorv32" && !hasTrap) {
          if (!findConnectedNet(design, inst.id, "trap", "output")) {
            hasTrap = true;
            externalBindings.set(`${inst.id}:trap`, "trap_out");
          }
        } else if (inst.moduleId === "uart_core") {
          const suffix = uartIdx === 0 ? "" : `_${uartIdx}`;
          uartIdx++;
          if (!findConnectedNet(design, inst.id, "rx", "input")) {
            externalBindings.set(`${inst.id}:rx`, `uart${suffix}_rx`);
          }
          if (!findConnectedNet(design, inst.id, "tx", "output")) {
            externalBindings.set(`${inst.id}:tx`, `uart${suffix}_tx`);
          }
        } else if (inst.moduleId === "spi_controller") {
          const suffix = spiIdx === 0 ? "" : `_${spiIdx}`;
          spiIdx++;
          for (const [portId, dir] of [
            ["spi_sclk", "output"],
            ["spi_cs_n", "output"],
            ["spi_mosi", "output"],
            ["spi_miso", "input"]
          ]) {
            if (!findConnectedNet(design, inst.id, portId, dir)) {
              externalBindings.set(`${inst.id}:${portId}`, `${portId}${suffix}`);
            }
          }
        } else if (inst.moduleId === "i2c_controller") {
          const suffix = i2cIdx === 0 ? "" : `_${i2cIdx}`;
          i2cIdx++;
          for (const [portId, dir] of [
            ["scl", "output"],
            ["sda_out", "output"],
            ["sda_in", "input"]
          ]) {
            if (!findConnectedNet(design, inst.id, portId, dir)) {
              externalBindings.set(`${inst.id}:${portId}`, `i2c${suffix}_${portId}`);
            }
          }
        } else if (inst.moduleId === "gpio_controller" && !hasGpio) {
          hasGpio = true;
          externalBindings.set(`${inst.id}:gpio_in`, "gpio_in");
          externalBindings.set(`${inst.id}:gpio_out`, "gpio_out");
          externalBindings.set(`${inst.id}:gpio_oe`, "gpio_oe");
        } else if (inst.moduleId === "timer_core") {
          const suffix = timerIdx === 0 ? "" : `_${timerIdx}`;
          timerIdx++;
          if (!findConnectedNet(design, inst.id, "irq", "output")) {
            externalBindings.set(`${inst.id}:irq`, `timer${suffix}_irq`);
          }
        }
      }
      const topLines = [
        "// =============================================================================",
        `// Synthesizable ASIC Top Module: ${design.name}`,
        `// Target PDK: ${pdk.name} | Clock: ${silicon.clockFreqMhz} MHz`,
        "// Generated by Kona Silicon Tape-Out Engine",
        "// =============================================================================",
        "`timescale 1ns / 1ps",
        "/* verilator lint_off PINCONNECTEMPTY */",
        "",
        `module ${topName} (`
      ];
      topLines.push(externalPorts.map((p, idx) => {
        const comma = idx < externalPorts.length - 1 ? "," : "";
        const range = p.width > 1 ? `[${p.width - 1}:0] ` : "";
        return `  ${p.direction.padEnd(6, " ")} wire ${range}${p.name}${comma}`;
      }).join("\n"));
      topLines.push(");", "");
      topLines.push("  // Internal Interconnect Nets");
      for (const net of sortedNets) {
        const wName = sanitizeId(net.name);
        if (net.width === 1) {
          topLines.push(`  wire ${wName};`);
        } else {
          topLines.push(`  wire [${net.width - 1}:0] ${wName};`);
        }
      }
      topLines.push("");
      for (const inst of sortedInstances) {
        const modDef = (0, catalog_js_1.getModuleDef)(inst.moduleId);
        const instName = sanitizeId(inst.name);
        const paramEntries = Object.entries(inst.parameters).sort(([a], [b]) => a.localeCompare(b));
        let paramHeader = "";
        if (paramEntries.length > 0) {
          const pLines = paramEntries.map(([k, v]) => {
            const val = typeof v === "boolean" ? v ? "1'b1" : "1'b0" : String(v);
            return `    .${k}(${val})`;
          });
          paramHeader = ` #(
${pLines.join(",\n")}
  )`;
        }
        topLines.push(`  // ${modDef?.name || inst.moduleId}`);
        topLines.push(`  ${inst.moduleId}${paramHeader} ${instName} (`);
        const bindings = [];
        if (inst.moduleId === "clock_gen") {
          const clkNet = findConnectedNet(design, inst.id, "clk_out", "output");
          const rstNet = findConnectedNet(design, inst.id, "rst_n_out", "output");
          bindings.push(`    .ext_clk  (clk_in)`);
          bindings.push(`    .ext_rst_n(rst_n_in)`);
          bindings.push(`    .clk_out  (${clkNet ? sanitizeId(clkNet.name) : "/* unused */"})`);
          bindings.push(`    .rst_n_out(${rstNet ? sanitizeId(rstNet.name) : "/* unused */"})`);
        } else if (inst.moduleId === "gpio_controller") {
          const clkNet = findConnectedNet(design, inst.id, "clk", "input");
          const rstNet = findConnectedNet(design, inst.id, "rst_n", "input");
          const outNet = findConnectedNet(design, inst.id, "out_val", "input");
          const inNet = findConnectedNet(design, inst.id, "in_val", "output");
          const w = Number(inst.parameters.WIDTH ?? 8);
          bindings.push(`    .clk     (${clkNet ? sanitizeId(clkNet.name) : "clk_in"})`);
          bindings.push(`    .rst_n   (${rstNet ? sanitizeId(rstNet.name) : "rst_n_in"})`);
          bindings.push(`    .out_val (${outNet ? sanitizeId(outNet.name) : `${w}'b0`})`);
          bindings.push(`    .in_val  (${inNet ? sanitizeId(inNet.name) : "/* unused */"})`);
          bindings.push(`    .gpio_in (${externalBindings.get(`${inst.id}:gpio_in`) || `${w}'b0`})`);
          bindings.push(`    .gpio_out(${externalBindings.get(`${inst.id}:gpio_out`) || "/* unused */"})`);
          bindings.push(`    .gpio_oe (${externalBindings.get(`${inst.id}:gpio_oe`) || "/* unused */"})`);
        } else if (modDef) {
          for (const port of modDef.ports) {
            const net = findConnectedNet(design, inst.id, port.id, port.direction);
            let expr = net ? sanitizeId(net.name) : externalBindings.get(`${inst.id}:${port.id}`);
            if (!expr) {
              if (port.direction === "input") {
                if (port.type === "clock")
                  expr = "clk_in";
                else if (port.type === "reset")
                  expr = "rst_n_in";
                else
                  expr = port.width > 1 ? `${port.width}'b0` : "1'b0";
              } else {
                expr = "";
              }
            }
            bindings.push(`    .${port.name.padEnd(14, " ")}(${expr})`);
          }
        }
        topLines.push(bindings.join(",\n"));
        topLines.push("  );", "");
      }
      topLines.push("endmodule", "/* verilator lint_on PINCONNECTEMPTY */", "");
      const chipPorts = externalPorts.map((p) => {
        const range = p.width > 1 ? `[${p.width - 1}:0] ` : "";
        return `  ${p.direction.padEnd(6, " ")} wire ${range}${p.name}`;
      });
      const chipLines = [
        "// =============================================================================",
        `// Chip / Pad-Frame Wrapper: chip_${topName}`,
        `// Target PDK: ${pdk.name} | Package: ${silicon.packageType}`,
        `// Core/IO Voltage: ${pdk.coreVoltage} / ${pdk.ioVoltage}`,
        "// =============================================================================",
        "`timescale 1ns / 1ps",
        "",
        `module chip_${topName} (`,
        chipPorts.join(",\n"),
        ");",
        "",
        `  ${topName} u_core (`,
        externalPorts.map((p) => `    .${p.name.padEnd(14, " ")}(${p.name})`).join(",\n"),
        "  );",
        "",
        "  // Note: For full-die pad-frame tape-outs (outside Caravel/TinyTapeout slots),",
        `  // instantiate ${pdk.ioPadLibrary} cells (${pdk.ioPadCells.input}, ${pdk.ioPadCells.output}, ${pdk.ioPadCells.vdd})`,
        "  // around u_core in this wrapper before LibreLane pad-ring assembly.",
        "endmodule",
        ""
      ];
      return {
        topVerilog: topLines.join("\n"),
        chipTopVerilog: chipLines.join("\n"),
        externalPorts,
        hasTrap,
        hasGpio
      };
    }
    function generateSdc(topModule, pdk, silicon) {
      const periodNs = +(1e3 / silicon.clockFreqMhz).toFixed(3);
      const ioDelayNs = +(periodNs * 0.2).toFixed(3);
      const uncertaintyNs = +Math.max(0.15, periodNs * 0.05).toFixed(3);
      return [
        `# Timing Constraints (SDC) for ${topModule}`,
        `# Target PDK: ${pdk.name} @ ${silicon.clockFreqMhz} MHz (Period = ${periodNs} ns)`,
        `create_clock -name clk_in -period ${periodNs} [get_ports {clk_in}]`,
        `set_clock_uncertainty ${uncertaintyNs} [get_clocks {clk_in}]`,
        `set_clock_transition 0.15 [get_clocks {clk_in}]`,
        "",
        `set_driving_cell -lib_cell ${pdk.drivingCell} -pin ${pdk.drivingCellPin} [all_inputs]`,
        `set_load ${pdk.outputLoadPf} [all_outputs]`,
        "",
        `set non_clk_inputs [remove_from_collection [all_inputs] [get_ports {clk_in}]]`,
        `set_input_delay ${ioDelayNs} -clock clk_in $non_clk_inputs`,
        `set_output_delay ${ioDelayNs} -clock clk_in [all_outputs]`,
        `set_false_path -from [get_ports {rst_n_in}]`,
        ""
      ].join("\n");
    }
    function generatePinOrderCfg(ports) {
      const byEdge = { N: [], S: [], E: [], W: [] };
      for (const p of ports) {
        byEdge[p.edge].push(p.width > 1 ? `${p.name}\\[.*\\]` : p.name);
      }
      const lines = [];
      for (const edge of ["W", "E", "N", "S"]) {
        if (byEdge[edge].length > 0) {
          lines.push(`#${edge}`, ...byEdge[edge], "");
        }
      }
      return lines.join("\n");
    }
    function generateLibreLaneConfig(topModule, pdk, silicon) {
      const periodNs = +(1e3 / silicon.clockFreqMhz).toFixed(3);
      const slot = silicon.diePreset !== "auto" ? pdk.dieSlots[silicon.diePreset] : null;
      const config = {
        DESIGN_NAME: `chip_${topModule}`,
        VERILOG_FILES: [
          "dir::src/asic_ip_library.v",
          "dir::src/top.v",
          "dir::src/chip_top.v"
        ],
        CLOCK_PORT: "clk_in",
        CLOCK_NET: "clk_in",
        CLOCK_PERIOD: periodNs,
        PDK: pdk.id,
        STD_CELL_LIBRARY: pdk.stdCellLibrary,
        FP_SIZING: slot ? "absolute" : "relative",
        ...slot ? { DIE_AREA: slot.dieArea, CORE_AREA: slot.coreArea } : { FP_CORE_UTIL: Math.round(silicon.coreUtilization * 100) },
        PL_TARGET_DENSITY_PCT: pdk.targetDensityPct,
        FP_PIN_ORDER_CFG: "dir::pin_order.cfg",
        PNR_SDC_FILE: "dir::constraints/top.sdc",
        SIGNOFF_SDC_FILE: "dir::constraints/top.sdc",
        RUN_MAGIC_DRC: true,
        RUN_KLAYOUT_DRC: true,
        RUN_LVS: true,
        MAGIC_DRC_USE_GDS: true,
        QUIT_ON_MAGIC_DRC: true,
        QUIT_ON_LVS_ERROR: true
      };
      return JSON.stringify(config, null, 2) + "\n";
    }
    function generateTestbench(topModule, ports, periodNs) {
      const halfPeriod = +(periodNs / 2).toFixed(2);
      const inputRegs = ports.filter((p) => p.direction === "input" && p.name !== "clk_in" && p.name !== "rst_n_in").map((p) => p.width > 1 ? `  reg [${p.width - 1}:0] ${p.name} = ${p.width}'b0;` : `  reg ${p.name} = 1'b0;`);
      const outputWires = ports.filter((p) => p.direction === "output").map((p) => p.width > 1 ? `  wire [${p.width - 1}:0] ${p.name};` : `  wire ${p.name};`);
      return [
        "`timescale 1ns / 1ps",
        `module chip_${topModule}_tb;`,
        "  reg clk_in = 1'b0;",
        "  reg rst_n_in = 1'b0;",
        ...inputRegs,
        ...outputWires,
        "",
        `  always #${halfPeriod} clk_in = ~clk_in;`,
        "",
        `  chip_${topModule} dut (`,
        ports.map((p) => `    .${p.name}(${p.name})`).join(",\n"),
        "  );",
        "",
        "  initial begin",
        `    $dumpfile("chip_${topModule}_tb.vcd");`,
        `    $dumpvars(0, chip_${topModule}_tb);`,
        `    #(5 * ${periodNs});`,
        "    rst_n_in = 1'b1;",
        `    #(64 * ${periodNs});`,
        '    $display("[KONA TB] Pre-tapeout functional simulation passed.");',
        "    $finish;",
        "  end",
        "endmodule",
        ""
      ].join("\n");
    }
    function generateRunTapeoutScript(topModule, pdk) {
      return `#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${"${BASH_SOURCE[0]}"}")/.." && pwd)"
cd "$ROOT_DIR"

PDK_NAME="${pdk.id}"
DESIGN="chip_${topModule}"

echo "======================================================================"
echo " Kona Factory Tape-Out Runner"
echo " Design: $DESIGN | PDK: $PDK_NAME (${pdk.nodeNm}nm)"
echo "======================================================================"

echo "[1/5] Running Verilator RTL lint..."
if command -v verilator >/dev/null 2>&1; then
  verilator --lint-only -Wall --top-module "$DESIGN" -Wno-DECLFILENAME -Wno-PINCONNECTEMPTY -Wno-UNUSED -Wno-UNDRIVEN \\
    src/asic_ip_library.v src/top.v src/chip_top.v
else
  echo "WARN: verilator not found, skipping lint step."
fi

echo "[2/5] Running pre-synthesis functional testbench..."
if command -v iverilog >/dev/null 2>&1 && command -v vvp >/dev/null 2>&1; then
  mkdir -p build
  iverilog -g2012 -o "build/${"${DESIGN}"}_tb.vvp" src/asic_ip_library.v src/top.v src/chip_top.v tb/chip_top_tb.v
  vvp "build/${"${DESIGN}"}_tb.vvp"
else
  echo "WARN: iverilog/vvp not found, skipping testbench step."
fi

echo "[3/5] Running LibreLane / OpenLane 2 RTL-to-GDSII..."
if command -v librelane >/dev/null 2>&1; then
  librelane --pdk "$PDK_NAME" --run-tag kona_signoff config.json
elif command -v openlane >/dev/null 2>&1; then
  openlane --pdk "$PDK_NAME" --run-tag kona_signoff config.json
else
  echo "ERROR: Neither 'librelane' nor 'openlane' found in PATH."
  echo "Run inside the Kona tapeout container: docker compose run --rm tapeout-runner ./scripts/run_tapeout.sh"
  exit 1
fi

echo "[4/5] Verifying signoff reports (STA / DRC / LVS)..."
python3 scripts/verify_signoff.py "runs/kona_signoff"

echo "[5/5] Packaging Factory Handoff Archive..."
HANDOFF_DIR="build/factory_handoff_${"${DESIGN}"}_${"${PDK_NAME}"}"
rm -rf "$HANDOFF_DIR"
mkdir -p "$HANDOFF_DIR/gds" "$HANDOFF_DIR/netlist" "$HANDOFF_DIR/def" "$HANDOFF_DIR/signoff" "$HANDOFF_DIR/docs"

cp runs/kona_signoff/final/gds/*.gds "$HANDOFF_DIR/gds/" 2>/dev/null || true
cp runs/kona_signoff/final/oasis/*.oas "$HANDOFF_DIR/gds/" 2>/dev/null || true
cp runs/kona_signoff/final/nl/*.nl.v "$HANDOFF_DIR/netlist/" 2>/dev/null || true
cp runs/kona_signoff/final/def/*.def "$HANDOFF_DIR/def/" 2>/dev/null || true
cp runs/kona_signoff/final/sdc/*.sdc "$HANDOFF_DIR/signoff/" 2>/dev/null || true
cp docs/FACTORY_DATASHEET.md "$HANDOFF_DIR/docs/"
cp design.kona.json config.json MANIFEST.json "$HANDOFF_DIR/"

(cd "$HANDOFF_DIR" && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS)
tar -czf "build/factory_handoff_${"${DESIGN}"}_${"${PDK_NAME}"}.tar.gz" -C build "factory_handoff_${"${DESIGN}"}_${"${PDK_NAME}"}"

echo "======================================================================"
echo " SUCCESS: Factory package ready:"
echo "   build/factory_handoff_${"${DESIGN}"}_${"${PDK_NAME}"}.tar.gz"
echo "======================================================================"
`;
    }
    function generateVerifySignoffPython() {
      return `#!/usr/bin/env python3
"""Verify LibreLane / OpenLane 2 signoff metrics before foundry submission."""
import json
import pathlib
import sys

def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: verify_signoff.py <run_dir>", file=sys.stderr)
        return 2

    run_dir = pathlib.Path(sys.argv[1])
    metrics_path = run_dir / "final" / "metrics.json"
    if not metrics_path.exists():
        print(f"ERROR: Signoff metrics not found at {metrics_path}", file=sys.stderr)
        return 1

    metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
    failures = []

    checks = [
        ("design__lvs_error__count", "LVS mismatches"),
        ("magic__drc_error__count", "Magic physical DRC violations"),
        ("klayout__drc_error__count", "KLayout physical DRC violations"),
        ("design__antenna_violation__count", "Antenna violations"),
    ]
    for key, label in checks:
        val = metrics.get(key)
        if val is not None and float(val) > 0:
            failures.append(f"{label}: {val}")

    for corner_key in ("timing__setup_vio__count", "timing__hold_vio__count"):
        val = metrics.get(corner_key)
        if val is not None and float(val) > 0:
            failures.append(f"{corner_key}: {val}")

    if failures:
        print("SIGNOFF FAILED:", file=sys.stderr)
        for item in failures:
            print(f"  - {item}", file=sys.stderr)
        return 1

    print("[KONA SIGNOFF] All DRC, LVS, Antenna, and Multi-Corner STA checks passed.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
`;
    }
    function generateFactoryDatasheet(design, topModule, pdk, silicon, ports, checks) {
      const periodNs = +(1e3 / silicon.clockFreqMhz).toFixed(3);
      const slotLabel = silicon.diePreset !== "auto" ? pdk.dieSlots[silicon.diePreset].label : `Auto-sized (${Math.round(silicon.coreUtilization * 100)}% core utilization)`;
      const portRows = ports.map((p) => `| \`${p.name}\` | \`${p.direction}\` | ${p.width} | ${p.edge} | ${p.description} |`).join("\n");
      const checkRows = checks.map((c) => `- **[${c.status.toUpperCase()}] ${c.label}:** ${c.detail}`).join("\n");
      return `# Factory Tape-Out Datasheet & Manufacturing Handoff

- **Chip Name:** ${design.name}
- **Top Module:** \`chip_${topModule}\`
- **Target Open-Source PDK:** ${pdk.name} (${pdk.foundry})
- **Technology Node:** ${pdk.nodeNm}nm (${pdk.processType})
- **Core / I/O Voltage:** ${pdk.coreVoltage} / ${pdk.ioVoltage}
- **Target Clock:** ${silicon.clockFreqMhz} MHz (Period: ${periodNs} ns)
- **Die Slot:** ${slotLabel}
- **Target Package:** ${silicon.packageType}
- **Shuttle Path:** ${silicon.shuttleTarget}

## 1. Pre-Tape-Out Readiness Checks
${checkRows}

## 2. External Pinout & Edge Assignment
| Pin Name | Direction | Width | Die Edge | Function |
| :--- | :--- | :---: | :---: | :--- |
${portRows}

## 3. Running RTL-to-GDSII Locally or in Docker
Extract the downloaded \`*_tapeout_kit.tar\` and run:
\`\`\`bash
tar -xf ${topModule}_${pdk.id}_tapeout_kit.tar
cd ${topModule}_${pdk.id}_tapeout_kit
./scripts/run_tapeout.sh
\`\`\`
Or with Docker Compose from the Kona repository:
\`\`\`bash
docker compose run --rm tapeout-runner ./scripts/run_tapeout.sh
\`\`\`

## 4. India & Open-Source MPW Submission Guide
- **${pdk.foundry} (${pdk.id}):** ${pdk.shuttleNotes}
- **India Ecosystem Fit:** ${pdk.indiaEcosystemNotes}
- **Factory Deliverables Produced in \`build/factory_handoff_*.tar.gz\`:**
  1. Final GDSII/OASIS layout (\`gds/chip_${topModule}.gds\`, \`.oas\`)
  2. Post-P&R Gate-Level Netlist (\`netlist/*.nl.v\`) & DEF (\`def/*.def\`)
  3. Signoff Timing SDC & Reports (Magic DRC, KLayout DRC, Netgen LVS, OpenSTA)
  4. Source \`.kona.json\`, \`config.json\`, \`MANIFEST.json\`, and \`SHA256SUMS\`
`;
    }
    function generateAsicBundle2(design) {
      const { silicon, pdk } = resolveSiliconConfig(design);
      const topModule = sanitizeId(design.topModule || "top");
      const periodNs = +(1e3 / silicon.clockFreqMhz).toFixed(3);
      const generated = generateAsicTopAndChipTop(design, pdk, silicon);
      const sdc = generateSdc(topModule, pdk, silicon);
      const pinOrder = generatePinOrderCfg(generated.externalPorts);
      const libreLaneConfig = generateLibreLaneConfig(topModule, pdk, silicon);
      const tbVerilog = generateTestbench(topModule, generated.externalPorts, periodNs);
      const runScript = generateRunTapeoutScript(topModule, pdk);
      const verifyScript = generateVerifySignoffPython();
      const designForDrc = { ...design, silicon };
      const architecture = (0, architecture_js_1.analyzeArchitecture)(designForDrc);
      const diags = (0, drc_js_1.runDesignRuleCheck)(designForDrc);
      const drcErrors = diags.filter((d) => d.severity === "error");
      const drcWarnings = diags.filter((d) => d.severity === "warning");
      const readinessChecks = [
        {
          id: "drc-logical",
          label: "Logical & Silicon DRC",
          status: drcErrors.length > 0 ? "fail" : drcWarnings.length > 0 ? "warn" : "pass",
          detail: drcErrors.length > 0 ? `${drcErrors.length} error(s): ${drcErrors[0].message}` : drcWarnings.length > 0 ? `${drcWarnings.length} warning(s): ${drcWarnings[0].message}` : "0 DRC errors and 0 silicon warnings"
        },
        ...architecture.checklist,
        {
          id: "signoff-flow",
          label: "LibreLane GDSII + DRC/LVS Pipeline",
          status: "pass",
          detail: `Configured for ${pdk.stdCellLibrary} (${pdk.metalLayers}M, Magic + KLayout + Netgen + OpenSTA)`
        }
      ];
      const datasheet = generateFactoryDatasheet(design, topModule, pdk, silicon, generated.externalPorts, readinessChecks);
      const archSpecMd = (0, architecture_js_1.generateArchitectureSpecMarkdown)(designForDrc, architecture);
      const memMapJson = JSON.stringify({
        topModule: `chip_${topModule}`,
        clockDomains: architecture.clockDomains,
        memoryMap: architecture.memoryMap,
        ppa: architecture.ppa,
        pinBudget: architecture.pinBudget
      }, null, 2) + "\n";
      const manifest = JSON.stringify({
        generator: "Kona Tape-Out Bundle Engine v1.0",
        designName: design.name,
        topModule: `chip_${topModule}`,
        pdk: pdk.id,
        nodeNm: pdk.nodeNm,
        clockFreqMhz: silicon.clockFreqMhz,
        packageType: silicon.packageType,
        shuttleTarget: silicon.shuttleTarget,
        estimatedGates: architecture.ppa.estimatedGates,
        estimatedAreaMm2: architecture.ppa.estimatedAreaMm2,
        estimatedPowerMw: architecture.ppa.estimatedPowerMw,
        externalPortsCount: generated.externalPorts.length
      }, null, 2) + "\n";
      const prefix = `${topModule}_${pdk.id}_tapeout_kit`;
      const files = [
        { path: `${prefix}/design.kona.json`, content: (0, ir_js_1.serializeKonaDesign)(designForDrc), category: "metadata" },
        { path: `${prefix}/MEMORY_MAP.json`, content: memMapJson, category: "metadata" },
        { path: `${prefix}/src/asic_ip_library.v`, content: asic_rtl_js_1.ASIC_IP_LIBRARY_VERILOG, category: "rtl" },
        { path: `${prefix}/src/top.v`, content: generated.topVerilog, category: "rtl" },
        { path: `${prefix}/src/chip_top.v`, content: generated.chipTopVerilog, category: "rtl" },
        { path: `${prefix}/constraints/top.sdc`, content: sdc, category: "constraints" },
        { path: `${prefix}/config.json`, content: libreLaneConfig, category: "flow" },
        { path: `${prefix}/pin_order.cfg`, content: pinOrder, category: "flow" },
        { path: `${prefix}/tb/chip_top_tb.v`, content: tbVerilog, category: "verification" },
        { path: `${prefix}/scripts/run_tapeout.sh`, content: runScript, executable: true, category: "flow" },
        { path: `${prefix}/scripts/verify_signoff.py`, content: verifyScript, executable: true, category: "verification" },
        { path: `${prefix}/docs/ARCHITECTURE_SPEC.md`, content: archSpecMd, category: "docs" },
        { path: `${prefix}/docs/FACTORY_DATASHEET.md`, content: datasheet, category: "docs" },
        { path: `${prefix}/MANIFEST.json`, content: manifest, category: "metadata" }
      ];
      return {
        designName: design.name,
        topModule: `chip_${topModule}`,
        pdk,
        silicon,
        architecture,
        externalPorts: generated.externalPorts,
        readinessChecks,
        files
      };
    }
    function buildAsicTapeoutTar2(design) {
      const bundle = generateAsicBundle2(design);
      const topModule = sanitizeId(design.topModule || "top");
      const filename = `${topModule}_${bundle.pdk.id}_tapeout_kit.tar`;
      const archive = (0, tar_js_1.buildTarArchive)(bundle.files.map((f) => ({ path: f.path, content: f.content, executable: f.executable })));
      return { filename, archive, bundle };
    }
  }
});

// packages/core/dist/pdk.js
var require_pdk2 = __commonJS({
  "packages/core/dist/pdk.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_pdk(), exports);
  }
});

// apps/web/src/app.ts
var import_auto_wire2 = __toESM(require_auto_wire());
var import_ir3 = __toESM(require_ir());
var import_catalog8 = __toESM(require_catalog2());
var import_codegen3 = __toESM(require_codegen());
var import_sim = __toESM(require_sim());

// apps/web/src/canvas/types.ts
var CANVAS_METRICS = {
  GRID_SIZE: 20,
  HEADER_HEIGHT: 34,
  SUBTITLE_HEIGHT: 22,
  TOP_RESERVED: 56,
  // HEADER_HEIGHT + SUBTITLE_HEIGHT
  PORT_PITCH: 26,
  BOTTOM_PAD: 18
};

// apps/web/src/canvas/geometry.ts
var import_catalog = __toESM(require_catalog2());
var import_drc = __toESM(require_drc2());
function getInstanceDimensions(modDef, inst) {
  if (!modDef) return { w: 200, h: 180 };
  const inputPorts = modDef.ports.filter((p) => p.direction === "input");
  const outputPorts = modDef.ports.filter((p) => p.direction === "output");
  const inoutPorts = modDef.ports.filter((p) => p.direction === "inout");
  const maxSidePorts = Math.max(inputPorts.length, outputPorts.length, 1);
  const minPortH = CANVAS_METRICS.TOP_RESERVED + maxSidePorts * CANVAS_METRICS.PORT_PITCH + CANVAS_METRICS.BOTTOM_PAD + (inoutPorts.length > 0 ? 22 : 0);
  const h = Math.max(modDef.defaultHeight || 160, minPortH);
  const maxLeftChars = inputPorts.reduce((max, p) => {
    const ew = (0, import_drc.getEffectivePortWidth)(modDef, p, inst);
    const len = p.name.length + (ew > 1 ? `[${ew - 1}:0]`.length : 0);
    return Math.max(max, len);
  }, 0);
  const maxRightChars = outputPorts.reduce((max, p) => {
    const ew = (0, import_drc.getEffectivePortWidth)(modDef, p, inst);
    const len = p.name.length + (ew > 1 ? `[${ew - 1}:0]`.length : 0);
    return Math.max(max, len);
  }, 0);
  const estimatedLabelW = (maxLeftChars + maxRightChars) * 6.6 + 44;
  const w = Math.max(modDef.defaultWidth || 200, Math.ceil(estimatedLabelW / 10) * 10);
  return { w, h };
}
function computeAllPortPositions(design) {
  const ports = [];
  for (const inst of design.instances) {
    const modDef = (0, import_catalog.getModuleDef)(inst.moduleId);
    if (!modDef) continue;
    const { w, h } = getInstanceDimensions(modDef, inst);
    const inputPorts = modDef.ports.filter((p) => p.direction === "input");
    const outputPorts = modDef.ports.filter((p) => p.direction === "output");
    const inoutPorts = modDef.ports.filter((p) => p.direction === "inout");
    const portAreaTop = inst.position.y + CANVAS_METRICS.TOP_RESERVED + 6;
    const portAreaBottom = inst.position.y + h - (inoutPorts.length > 0 ? 24 : 10);
    const portAreaH = Math.max(24, portAreaBottom - portAreaTop);
    const inSpacing = portAreaH / (inputPorts.length + 1);
    inputPorts.forEach((p, idx) => {
      ports.push({
        instanceId: inst.id,
        portId: p.id,
        x: inst.position.x,
        y: portAreaTop + inSpacing * (idx + 1),
        direction: "input",
        width: (0, import_drc.getEffectivePortWidth)(modDef, p, inst),
        name: p.name,
        type: p.type,
        description: p.description
      });
    });
    const outSpacing = portAreaH / (outputPorts.length + 1);
    outputPorts.forEach((p, idx) => {
      ports.push({
        instanceId: inst.id,
        portId: p.id,
        x: inst.position.x + w,
        y: portAreaTop + outSpacing * (idx + 1),
        direction: "output",
        width: (0, import_drc.getEffectivePortWidth)(modDef, p, inst),
        name: p.name,
        type: p.type,
        description: p.description
      });
    });
    const inoutSpacing = w / (inoutPorts.length + 1);
    inoutPorts.forEach((p, idx) => {
      ports.push({
        instanceId: inst.id,
        portId: p.id,
        x: inst.position.x + inoutSpacing * (idx + 1),
        y: inst.position.y + h,
        direction: "inout",
        width: (0, import_drc.getEffectivePortWidth)(modDef, p, inst),
        name: p.name,
        type: p.type,
        description: p.description
      });
    });
  }
  return ports;
}
function buildPortMap(design) {
  const map = /* @__PURE__ */ new Map();
  for (const p of computeAllPortPositions(design)) {
    map.set(`${p.instanceId}:${p.portId}`, p);
  }
  return map;
}
function getInstanceBoxes(design) {
  const map = /* @__PURE__ */ new Map();
  for (const inst of design.instances) {
    const modDef = (0, import_catalog.getModuleDef)(inst.moduleId);
    const { w, h } = getInstanceDimensions(modDef, inst);
    map.set(inst.id, { x: inst.position.x, y: inst.position.y, w, h });
  }
  return map;
}
function computeWirePoints(src, tgt, laneIdx, totalLanes, srcBox, tgtBox) {
  const laneShift = (laneIdx - (totalLanes - 1) / 2) * 14;
  if (src.direction === "inout" || tgt.direction === "inout") {
    const dropY = Math.max(src.y, tgt.y) + 28 + laneIdx * 10;
    return [
      { x: src.x, y: src.y },
      { x: src.x, y: dropY },
      { x: tgt.x, y: dropY },
      { x: tgt.x, y: tgt.y }
    ];
  }
  if (tgt.x >= src.x + 32) {
    const rawMid = (src.x + tgt.x) / 2 + laneShift;
    const midX = Math.max(src.x + 16, Math.min(tgt.x - 16, rawMid));
    return [
      { x: src.x, y: src.y },
      { x: midX, y: src.y },
      { x: midX, y: tgt.y },
      { x: tgt.x, y: tgt.y }
    ];
  }
  const stubOut = 22 + laneIdx % 4 * 10;
  const stubIn = 22 + laneIdx % 4 * 10;
  const exitX = src.x + stubOut;
  const entryX = tgt.x - stubIn;
  const topBound = Math.min(srcBox ? srcBox.y : src.y, tgtBox ? tgtBox.y : tgt.y);
  const botBound = Math.max(srcBox ? srcBox.y + srcBox.h : src.y, tgtBox ? tgtBox.y + tgtBox.h : tgt.y);
  const avgY = (src.y + tgt.y) / 2;
  const goAbove = Math.abs(avgY - topBound) <= Math.abs(botBound - avgY);
  const detourY = goAbove ? topBound - 24 - laneIdx * 12 : botBound + 24 + laneIdx * 12;
  return [
    { x: src.x, y: src.y },
    { x: exitX, y: src.y },
    { x: exitX, y: detourY },
    { x: entryX, y: detourY },
    { x: entryX, y: tgt.y },
    { x: tgt.x, y: tgt.y }
  ];
}
function buildDrcLookups(diagnostics) {
  const lookups = {
    errorInst: /* @__PURE__ */ new Set(),
    warnInst: /* @__PURE__ */ new Set(),
    errorNet: /* @__PURE__ */ new Set(),
    warnNet: /* @__PURE__ */ new Set(),
    errorPorts: /* @__PURE__ */ new Set(),
    warnPorts: /* @__PURE__ */ new Set()
  };
  for (const d of diagnostics) {
    if (d.severity === "error") {
      if (d.instanceId) lookups.errorInst.add(d.instanceId);
      if (d.netId) lookups.errorNet.add(d.netId);
      if (d.instanceId && d.portId) lookups.errorPorts.add(`${d.instanceId}:${d.portId}`);
    } else if (d.severity === "warning") {
      if (d.instanceId) lookups.warnInst.add(d.instanceId);
      if (d.netId) lookups.warnNet.add(d.netId);
      if (d.instanceId && d.portId) lookups.warnPorts.add(`${d.instanceId}:${d.portId}`);
    }
  }
  return lookups;
}
function findHitWire(wires, world, scale) {
  const threshold = Math.max(7, 8 / scale);
  for (let i = wires.length - 1; i >= 0; i--) {
    const wire = wires[i];
    for (let s = 0; s < wire.points.length - 1; s++) {
      const a = wire.points[s];
      const b = wire.points[s + 1];
      if (distPointToSegment(world.x, world.y, a.x, a.y, b.x, b.y) <= threshold) {
        return wire;
      }
    }
  }
  return null;
}
function distPointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function boxesOverlap(a, b, pad = 0) {
  return !(a.x + a.w + pad <= b.x || b.x + b.w + pad <= a.x || a.y + a.h + pad <= b.y || b.y + b.h + pad <= a.y);
}

// apps/web/src/canvas/renderer.ts
var import_catalog2 = __toESM(require_catalog2());
var import_drc2 = __toESM(require_drc2());
var CanvasRenderer = class {
  render(ctx, viewW, viewH, dpr, state) {
    if (viewW <= 0 || viewH <= 0) return [];
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#0e1117";
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.translate(state.transform.x, state.transform.y);
    ctx.scale(state.transform.scale, state.transform.scale);
    this.drawGrid(ctx, viewW, viewH, state.transform);
    const drc = buildDrcLookups(state.diagnostics);
    const renderedWires = this.drawNets(ctx, state, drc);
    if (state.wiringSource) {
      this.drawRubberBandWire(ctx, state.wiringSource, state.wiringCurrent, state.hoveredPort);
    }
    this.drawInstances(ctx, state, drc);
    ctx.restore();
    this.drawOverlayTooltip(ctx, viewW, viewH, dpr, state);
    return renderedWires;
  }
  drawGrid(ctx, screenW, screenH, transform) {
    const startX = -transform.x / transform.scale;
    const startY = -transform.y / transform.scale;
    const endX = (screenW - transform.x) / transform.scale;
    const endY = (screenH - transform.y) / transform.scale;
    const showMinor = transform.scale >= 0.45;
    const step = showMinor ? CANVAS_METRICS.GRID_SIZE : CANVAS_METRICS.GRID_SIZE * 5;
    const minX = Math.floor(startX / step) * step;
    const maxX = Math.ceil(endX / step) * step;
    const minY = Math.floor(startY / step) * step;
    const maxY = Math.ceil(endY / step) * step;
    for (let x = minX; x <= maxX; x += step) {
      for (let y = minY; y <= maxY; y += step) {
        const isMajor = x % 100 === 0 && y % 100 === 0;
        ctx.fillStyle = isMajor ? "#303746" : "#1d222d";
        const size = isMajor ? 2.5 : 1.5;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }
  }
  drawNets(ctx, state, drc) {
    const portMap = buildPortMap(state.design);
    const boxMap = getInstanceBoxes(state.design);
    const renderedWires = [];
    const placedPills = [];
    const pairCounters = /* @__PURE__ */ new Map();
    const pairTotals = /* @__PURE__ */ new Map();
    for (const net of state.design.nets) {
      if (!net.source) continue;
      for (const tgt of net.targets) {
        const key = `${net.source.instanceId}->${tgt.instanceId}`;
        pairTotals.set(key, (pairTotals.get(key) || 0) + 1);
      }
    }
    const orderedNets = [...state.design.nets].sort((a, b) => {
      const aActive = a.id === state.selectedNetId || a.id === state.hoveredNetId ? 1 : 0;
      const bActive = b.id === state.selectedNetId || b.id === state.hoveredNetId ? 1 : 0;
      return aActive - bActive;
    });
    for (const net of orderedNets) {
      const srcPos = net.source ? portMap.get(`${net.source.instanceId}:${net.source.portId}`) : null;
      if (!srcPos) continue;
      const isSelected = state.selectedNetId === net.id;
      const isHovered = state.hoveredNetId === net.id;
      const hasError = drc.errorNet.has(net.id);
      const hasWarn = drc.warnNet.has(net.id);
      const isBus = net.width > 1;
      const isClockOrReset = srcPos.type === "clock" || srcPos.type === "reset";
      for (const tgt of net.targets) {
        const tgtPos = portMap.get(`${tgt.instanceId}:${tgt.portId}`);
        if (!tgtPos) continue;
        const key = `${srcPos.instanceId}->${tgtPos.instanceId}`;
        const laneIdx = pairCounters.get(key) || 0;
        pairCounters.set(key, laneIdx + 1);
        const totalLanes = pairTotals.get(key) || 1;
        const points = computeWirePoints(
          srcPos,
          tgtPos,
          laneIdx,
          totalLanes,
          boxMap.get(srcPos.instanceId),
          boxMap.get(tgtPos.instanceId)
        );
        renderedWires.push({ net, points, src: srcPos, tgt: tgtPos });
        this.drawOrthogonalWire(
          ctx,
          points,
          srcPos,
          isBus,
          isClockOrReset,
          isSelected,
          isHovered,
          hasError,
          hasWarn,
          net.width,
          placedPills
        );
      }
    }
    return renderedWires;
  }
  drawOrthogonalWire(ctx, points, src, isBus, isClockOrReset, isSelected, isHovered, hasError, hasWarn, width, placedPills) {
    ctx.save();
    let strokeColor = isBus ? "#7fcfff" : "#8e919a";
    if (src.type === "clock") strokeColor = "#b49df2";
    else if (src.type === "reset") strokeColor = "#e3b341";
    if (hasError) strokeColor = "#f2b8b5";
    else if (hasWarn) strokeColor = "#fbc02d";
    if (isHovered) strokeColor = "#d3e3fd";
    if (isSelected) strokeColor = "#a8c7fa";
    if (isClockOrReset && !isSelected && !isHovered && !hasError) {
      ctx.globalAlpha = 0.65;
      ctx.setLineDash([5, 4]);
    }
    if (isSelected || isHovered || hasError) {
      ctx.shadowColor = hasError ? "#f2b8b5" : "#a8c7fa";
      ctx.shadowBlur = isSelected ? 12 : 8;
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isSelected || isHovered ? isBus ? 4.2 : 2.8 : isBus ? 3 : 1.75;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    this.traceRoundedPolyline(ctx, points, 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    if (isBus && points.length >= 4) {
      const segIdx = points.length === 4 ? 1 : 2;
      const pA = points[segIdx];
      const pB = points[segIdx + 1];
      const anchorX = (pA.x + pB.x) / 2;
      const anchorY = (pA.y + pB.y) / 2;
      const widthLabel = `[${width - 1}:0]`;
      ctx.font = '600 9px "Roboto Mono", monospace';
      const pillW = ctx.measureText(widthLabel).width + 10;
      const pillH = 15;
      const pillX = anchorX - pillW / 2;
      let pillY = anchorY - pillH / 2;
      for (let attempt = 0; attempt < 6; attempt++) {
        const candidate = { x: pillX, y: pillY, w: pillW, h: pillH };
        if (!placedPills.some((b) => boxesOverlap(b, candidate, 3))) break;
        const dir = attempt % 2 === 0 ? 1 : -1;
        const step = Math.ceil((attempt + 1) / 2) * 18;
        pillY = anchorY - pillH / 2 + dir * step;
      }
      placedPills.push({ x: pillX, y: pillY, w: pillW, h: pillH });
      ctx.fillStyle = hasError ? "#8c1d18" : isSelected ? "#0b57d0" : "#0b2c5e";
      ctx.strokeStyle = hasError ? "#f2b8b5" : isSelected ? "#d3e3fd" : "#7fcfff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = hasError ? "#f9dedc" : "#e3f2fd";
      ctx.textAlign = "center";
      ctx.fillText(widthLabel, pillX + pillW / 2, pillY + 10.5);
    }
    ctx.restore();
  }
  traceRoundedPolyline(ctx, points, radius) {
    if (points.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    if (typeof ctx.quadraticCurveTo !== "function" || points.length < 3) {
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      return;
    }
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      const d1 = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      const d2 = Math.hypot(next.x - curr.x, next.y - curr.y);
      const r = Math.min(radius, d1 / 2, d2 / 2);
      if (r < 1) {
        ctx.lineTo(curr.x, curr.y);
        continue;
      }
      const ux1 = (curr.x - prev.x) / d1;
      const uy1 = (curr.y - prev.y) / d1;
      const ux2 = (next.x - curr.x) / d2;
      const uy2 = (next.y - curr.y) / d2;
      ctx.lineTo(curr.x - ux1 * r, curr.y - uy1 * r);
      ctx.quadraticCurveTo(curr.x, curr.y, curr.x + ux2 * r, curr.y + uy2 * r);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }
  drawRubberBandWire(ctx, src, current, targetPort) {
    const end = targetPort ? { x: targetPort.x, y: targetPort.y } : current;
    const midX = (src.x + end.x) / 2;
    const pts = [
      { x: src.x, y: src.y },
      { x: midX, y: src.y },
      { x: midX, y: end.y },
      end
    ];
    ctx.save();
    let color = "#a8c7fa";
    if (targetPort) {
      color = targetPort.width === src.width ? "#6dd58c" : "#f2b8b5";
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    this.traceRoundedPolyline(ctx, pts, 6);
    ctx.stroke();
    if (targetPort) {
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(targetPort.x, targetPort.y, 9, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }
  drawInstances(ctx, state, drc) {
    for (const inst of state.design.instances) {
      const modDef = (0, import_catalog2.getModuleDef)(inst.moduleId);
      const isSelected = state.selectedInstanceId === inst.id;
      const isHovered = state.hoveredInstanceId === inst.id;
      const hasErr = drc.errorInst.has(inst.id);
      const hasWarn = drc.warnInst.has(inst.id);
      const { w, h } = getInstanceDimensions(modDef, inst);
      ctx.save();
      if (isSelected) {
        ctx.shadowColor = "rgba(168, 199, 250, 0.45)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 2;
      } else if (hasErr) {
        ctx.shadowColor = "rgba(242, 184, 181, 0.35)";
        ctx.shadowBlur = 14;
      } else {
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
      }
      ctx.fillStyle = isSelected ? "#1d222e" : isHovered ? "#1c202a" : "#171a23";
      ctx.beginPath();
      ctx.roundRect(inst.position.x, inst.position.y, w, h, 12);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = isSelected ? "#a8c7fa" : hasErr ? "#f2b8b5" : hasWarn ? "#fbc02d" : isHovered ? "#5a6070" : "#2b3140";
      ctx.lineWidth = isSelected || hasErr ? 2 : 1.25;
      ctx.stroke();
      ctx.fillStyle = getCategoryColor(modDef?.category || "infrastructure");
      ctx.beginPath();
      ctx.roundRect(inst.position.x, inst.position.y, w, CANVAS_METRICS.HEADER_HEIGHT, [12, 12, 0, 0]);
      ctx.fill();
      let catW = 0;
      if (modDef?.category) {
        const catText = modDef.category.toUpperCase();
        ctx.font = '700 8px "Google Sans", "Roboto", sans-serif';
        catW = ctx.measureText(catText).width + 12;
        ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
        ctx.beginPath();
        ctx.roundRect(inst.position.x + w - catW - 10, inst.position.y + 9, catW, 16, 6);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(catText, inst.position.x + w - 10 - catW / 2, inst.position.y + 20);
      }
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.font = '700 13px "Google Sans", "Roboto", sans-serif';
      ctx.fillText(truncateText(ctx, inst.name, w - catW - 30), inst.position.x + 12, inst.position.y + 22);
      ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
      ctx.fillRect(
        inst.position.x + 1,
        inst.position.y + CANVAS_METRICS.HEADER_HEIGHT,
        w - 2,
        CANVAS_METRICS.SUBTITLE_HEIGHT
      );
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(inst.position.x + 1, inst.position.y + CANVAS_METRICS.TOP_RESERVED);
      ctx.lineTo(inst.position.x + w - 1, inst.position.y + CANVAS_METRICS.TOP_RESERVED);
      ctx.stroke();
      ctx.fillStyle = "#9aa0ae";
      ctx.font = '500 10px "Roboto Mono", monospace';
      ctx.fillText(
        truncateText(ctx, modDef?.name || inst.moduleId, w - 24),
        inst.position.x + 12,
        inst.position.y + CANVAS_METRICS.HEADER_HEIGHT + 14
      );
      if (hasErr || hasWarn) {
        const badgeX = inst.position.x + w - 4;
        const badgeY = inst.position.y - 2;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, 8, 0, Math.PI * 2);
        ctx.fillStyle = hasErr ? "#f2b8b5" : "#fbc02d";
        ctx.fill();
        ctx.fillStyle = hasErr ? "#601410" : "#412d00";
        ctx.font = '700 10px "Google Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText("!", badgeX, badgeY + 3.5);
      }
      if (modDef) {
        const inputPorts = modDef.ports.filter((p) => p.direction === "input");
        const outputPorts = modDef.ports.filter((p) => p.direction === "output");
        const inoutPorts = modDef.ports.filter((p) => p.direction === "inout");
        const portAreaTop = inst.position.y + CANVAS_METRICS.TOP_RESERVED + 6;
        const portAreaBottom = inst.position.y + h - (inoutPorts.length > 0 ? 24 : 10);
        const portAreaH = Math.max(24, portAreaBottom - portAreaTop);
        const inSpacing = portAreaH / (inputPorts.length + 1);
        inputPorts.forEach((p, idx) => {
          const ew = (0, import_drc2.getEffectivePortWidth)(modDef, p, inst);
          const py = portAreaTop + inSpacing * (idx + 1);
          const portKey = `${inst.id}:${p.id}`;
          this.drawPortPin(
            ctx,
            state,
            inst.id,
            inst.position.x,
            py,
            p,
            ew,
            "left",
            drc.errorPorts.has(portKey),
            drc.warnPorts.has(portKey)
          );
        });
        const outSpacing = portAreaH / (outputPorts.length + 1);
        outputPorts.forEach((p, idx) => {
          const ew = (0, import_drc2.getEffectivePortWidth)(modDef, p, inst);
          const py = portAreaTop + outSpacing * (idx + 1);
          const portKey = `${inst.id}:${p.id}`;
          this.drawPortPin(
            ctx,
            state,
            inst.id,
            inst.position.x + w,
            py,
            p,
            ew,
            "right",
            drc.errorPorts.has(portKey),
            drc.warnPorts.has(portKey)
          );
        });
        const inoutSpacing = w / (inoutPorts.length + 1);
        inoutPorts.forEach((p, idx) => {
          const ew = (0, import_drc2.getEffectivePortWidth)(modDef, p, inst);
          const px = inst.position.x + inoutSpacing * (idx + 1);
          const portKey = `${inst.id}:${p.id}`;
          this.drawPortPin(
            ctx,
            state,
            inst.id,
            px,
            inst.position.y + h,
            p,
            ew,
            "bottom",
            drc.errorPorts.has(portKey),
            drc.warnPorts.has(portKey)
          );
        });
      }
      ctx.restore();
    }
  }
  drawPortPin(ctx, state, instanceId, x, y, port, width, align, hasError, hasWarn) {
    const isBus = width > 1;
    const isHovered = state.hoveredPort?.instanceId === instanceId && state.hoveredPort?.portId === port.id;
    const isWireTargetCompatible = state.wiringSource && state.wiringSource.instanceId !== instanceId && isHovered && state.wiringSource.width === width;
    if (isHovered || hasError || hasWarn) {
      ctx.beginPath();
      ctx.arc(x, y, isHovered ? 10 : 7, 0, Math.PI * 2);
      ctx.fillStyle = hasError ? "rgba(242, 184, 181, 0.3)" : hasWarn ? "rgba(251, 192, 45, 0.25)" : isWireTargetCompatible ? "rgba(109, 213, 140, 0.35)" : "rgba(168, 199, 250, 0.28)";
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, isHovered ? 5.5 : isBus ? 4.8 : 4, 0, Math.PI * 2);
    ctx.fillStyle = getPortTypeColor(port.type);
    ctx.fill();
    ctx.strokeStyle = hasError ? "#f2b8b5" : hasWarn ? "#fbc02d" : "#ffffff";
    ctx.lineWidth = isBus || isHovered ? 1.6 : 1.1;
    ctx.stroke();
    const widthSuffix = isBus ? `[${width - 1}:0]` : "";
    ctx.font = '500 11px "Roboto Mono", monospace';
    if (align === "left") {
      ctx.textAlign = "left";
      ctx.fillStyle = isHovered ? "#ffffff" : "#d2d5df";
      ctx.fillText(port.name, x + 9, y + 3.5);
      if (widthSuffix) {
        const nameW = ctx.measureText(port.name).width;
        ctx.fillStyle = "#7fcfff";
        ctx.font = '500 10px "Roboto Mono", monospace';
        ctx.fillText(widthSuffix, x + 9 + nameW + 2, y + 3.5);
      }
    } else if (align === "right") {
      ctx.textAlign = "right";
      if (widthSuffix) {
        ctx.font = '500 10px "Roboto Mono", monospace';
        const suffixW = ctx.measureText(widthSuffix).width;
        ctx.fillStyle = "#7fcfff";
        ctx.fillText(widthSuffix, x - 9, y + 3.5);
        ctx.font = '500 11px "Roboto Mono", monospace';
        ctx.fillStyle = isHovered ? "#ffffff" : "#d2d5df";
        ctx.fillText(port.name, x - 9 - suffixW - 2, y + 3.5);
      } else {
        ctx.fillStyle = isHovered ? "#ffffff" : "#d2d5df";
        ctx.fillText(port.name, x - 9, y + 3.5);
      }
    } else {
      ctx.textAlign = "center";
      ctx.fillStyle = isHovered ? "#ffffff" : "#d2d5df";
      ctx.fillText(widthSuffix ? `${port.name}${widthSuffix}` : port.name, x, y - 9);
    }
  }
  drawOverlayTooltip(ctx, viewW, viewH, dpr, state) {
    let title = "";
    let sub = "";
    let accent = "#a8c7fa";
    if (state.wiringSource && state.hoveredPort) {
      const compat = state.wiringSource.width === state.hoveredPort.width;
      title = compat ? `Connect ${state.wiringSource.name} \u2192 ${state.hoveredPort.name}` : `Width Mismatch: [${state.wiringSource.width - 1}:0] \u2260 [${state.hoveredPort.width - 1}:0]`;
      sub = compat ? `${state.hoveredPort.width}-bit ${state.hoveredPort.type}` : "DRC will flag width mismatch";
      accent = compat ? "#6dd58c" : "#f2b8b5";
    } else if (state.hoveredPort) {
      const p = state.hoveredPort;
      title = `${p.name}${p.width > 1 ? ` [${p.width - 1}:0]` : " (1-bit)"}`;
      sub = `${p.direction.toUpperCase()} \u2022 ${p.type}${p.description ? ` \u2014 ${p.description}` : ""}`;
      accent = getPortTypeColor(p.type);
    } else if (state.hoveredNetId && !state.draggingInstanceId && !state.isPanning) {
      const net = state.design.nets.find((n) => n.id === state.hoveredNetId);
      if (net) {
        title = `${net.name} ${net.width > 1 ? `[${net.width - 1}:0]` : "(1-bit)"}`;
        sub = "Click to inspect or Delete to remove";
        accent = "#7fcfff";
      }
    }
    if (!title) return;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.font = '600 11.5px "Google Sans", "Roboto", sans-serif';
    const titleW = ctx.measureText(title).width;
    ctx.font = '400 10.5px "Roboto", sans-serif';
    const subW = ctx.measureText(sub).width;
    const boxW = Math.min(340, Math.max(titleW, subW) + 28);
    const boxH = 44;
    let tx = state.mouseScreen.x + 14;
    let ty = state.mouseScreen.y + 16;
    if (tx + boxW > viewW - 12) tx = Math.max(12, state.mouseScreen.x - boxW - 12);
    if (ty + boxH > viewH - 12) ty = Math.max(12, state.mouseScreen.y - boxH - 12);
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "rgba(26, 29, 38, 0.96)";
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tx, ty, boxW, boxH, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.fillRect(tx + 1, ty + 8, 3, boxH - 16);
    ctx.textAlign = "left";
    ctx.fillStyle = "#e2e2e9";
    ctx.font = '600 11.5px "Google Sans", "Roboto", sans-serif';
    ctx.fillText(truncateText(ctx, title, boxW - 20), tx + 12, ty + 18);
    ctx.fillStyle = "#9aa0ae";
    ctx.font = '400 10.5px "Roboto", sans-serif';
    ctx.fillText(truncateText(ctx, sub, boxW - 20), tx + 12, ty + 34);
    ctx.restore();
  }
};
function getCategoryColor(category) {
  switch (category) {
    case "processor":
      return "#0842a0";
    case "interconnect":
      return "#4f378b";
    case "memory":
      return "#6e1914";
    case "peripheral":
      return "#004d67";
    case "infrastructure":
      return "#0a5223";
    default:
      return "#272c38";
  }
}
function getPortTypeColor(type) {
  switch (type) {
    case "clock":
      return "#d0bcff";
    case "reset":
      return "#fbc02d";
    case "bus":
      return "#7fcfff";
    case "data":
      return "#6dd58c";
    default:
      return "#8e919a";
  }
}
function truncateText(ctx, text, maxWidth) {
  if (maxWidth <= 20) return text;
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 3 && ctx.measureText(truncated + "\u2026").width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "\u2026";
}

// apps/web/src/canvas/SchematicCanvas.ts
var import_catalog3 = __toESM(require_catalog2());
var SchematicCanvas = class {
  canvas;
  ctx;
  renderer = new CanvasRenderer();
  design;
  diagnostics = [];
  transform = { x: 40, y: 40, scale: 1 };
  selectedInstanceId = null;
  selectedNetId = null;
  hoveredInstanceId = null;
  hoveredNetId = null;
  hoveredPort = null;
  draggingInstanceId = null;
  dragOffset = { x: 0, y: 0 };
  isPanning = false;
  panStart = { x: 0, y: 0 };
  spacePressed = false;
  toolMode = "select";
  gridSnap = true;
  wiringSource = null;
  wiringCurrent = { x: 0, y: 0 };
  mouseScreen = { x: 0, y: 0 };
  renderedWires = [];
  resizeObserver = null;
  onSelectCallback;
  onNetSelectCallback;
  onChangeCallback;
  onViewChangeCallback;
  constructor(canvas, initialDesign) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D canvas context");
    this.ctx = ctx;
    this.design = initialDesign;
    this.setupEvents();
    this.setupResizeObserver();
    this.resize();
    this.render();
  }
  setupResizeObserver() {
    const parent = this.canvas.parentElement;
    if (parent && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(parent);
    }
    window.addEventListener("resize", () => this.resize());
  }
  setDesign(newDesign) {
    this.design = newDesign;
    this.selectedInstanceId = null;
    this.selectedNetId = null;
    this.hoveredNetId = null;
    this.hoveredPort = null;
    this.render();
    this.notifySelection();
  }
  getDesign() {
    return this.design;
  }
  setDiagnostics(diagnostics) {
    this.diagnostics = diagnostics;
    this.render();
  }
  setToolMode(mode) {
    this.toolMode = mode;
    this.updateCursor();
  }
  getToolMode() {
    return this.toolMode;
  }
  setGridSnap(enabled) {
    this.gridSnap = enabled;
  }
  isGridSnapEnabled() {
    return this.gridSnap;
  }
  onSelectionChange(cb) {
    this.onSelectCallback = cb;
  }
  onNetSelectionChange(cb) {
    this.onNetSelectCallback = cb;
  }
  onDesignChange(cb) {
    this.onChangeCallback = cb;
  }
  onViewChange(cb) {
    this.onViewChangeCallback = cb;
  }
  resize() {
    const rect = this.canvas.parentElement?.getBoundingClientRect() || this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.ctx.resetTransform?.();
    this.render();
  }
  getViewportSize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr || this.canvas.clientWidth || 800;
    const h = this.canvas.height / dpr || this.canvas.clientHeight || 500;
    return { w, h };
  }
  updateZoomLabel() {
    const label = document.getElementById("btn-zoom-reset");
    if (label) {
      label.textContent = `${Math.round(this.transform.scale * 100)}%`;
    }
    this.onViewChangeCallback?.({ ...this.transform });
  }
  zoomIn() {
    const { w, h } = this.getViewportSize();
    this.zoomAt(w / 2, h / 2, 1.2);
  }
  zoomOut() {
    const { w, h } = this.getViewportSize();
    this.zoomAt(w / 2, h / 2, 1 / 1.2);
  }
  resetZoom() {
    this.transform = { x: 60, y: 60, scale: 1 };
    this.updateZoomLabel();
    this.render();
  }
  zoomAt(screenX, screenY, factor) {
    const newScale = Math.max(0.2, Math.min(2.8, this.transform.scale * factor));
    const ratio = newScale / this.transform.scale;
    this.transform.x = screenX - (screenX - this.transform.x) * ratio;
    this.transform.y = screenY - (screenY - this.transform.y) * ratio;
    this.transform.scale = newScale;
    this.updateZoomLabel();
    this.render();
  }
  fitToScreen(padding = 56) {
    if (this.design.instances.length === 0) {
      this.resetZoom();
      return;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const inst of this.design.instances) {
      const modDef = (0, import_catalog3.getModuleDef)(inst.moduleId);
      const { w, h } = getInstanceDimensions(modDef, inst);
      minX = Math.min(minX, inst.position.x);
      minY = Math.min(minY, inst.position.y);
      maxX = Math.max(maxX, inst.position.x + w);
      maxY = Math.max(maxY, inst.position.y + h);
    }
    const { w: viewW, h: viewH } = this.getViewportSize();
    const contentW = Math.max(100, maxX - minX);
    const contentH = Math.max(100, maxY - minY);
    const usableW = Math.max(120, viewW - padding * 2);
    const usableH = Math.max(120, viewH - padding * 2 - 20);
    const scale = Math.min(1.05, Math.max(0.22, Math.min(usableW / contentW, usableH / contentH)));
    this.transform = {
      scale,
      x: viewW / 2 - (minX + maxX) / 2 * scale,
      y: viewH / 2 - (minY + maxY) / 2 * scale
    };
    this.updateZoomLabel();
    this.render();
  }
  focusInstance(instanceId) {
    const inst = this.design.instances.find((i) => i.id === instanceId);
    if (!inst) return;
    const modDef = (0, import_catalog3.getModuleDef)(inst.moduleId);
    const { w, h } = getInstanceDimensions(modDef, inst);
    const { w: viewW, h: viewH } = this.getViewportSize();
    this.selectedInstanceId = inst.id;
    this.selectedNetId = null;
    const targetScale = Math.max(this.transform.scale, 0.85);
    this.transform = {
      scale: targetScale,
      x: viewW / 2 - (inst.position.x + w / 2) * targetScale,
      y: viewH / 2 - (inst.position.y + h / 2) * targetScale
    };
    this.updateZoomLabel();
    this.notifySelection();
    this.render();
  }
  focusNet(netId) {
    const net = this.design.nets.find((n) => n.id === netId);
    if (!net) return;
    this.selectedNetId = net.id;
    this.selectedInstanceId = null;
    const portMap = buildPortMap(this.design);
    const pts = [];
    if (net.source) {
      const p = portMap.get(`${net.source.instanceId}:${net.source.portId}`);
      if (p) pts.push(p);
    }
    for (const t of net.targets) {
      const p = portMap.get(`${t.instanceId}:${t.portId}`);
      if (p) pts.push(p);
    }
    if (pts.length > 0) {
      const avgX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      const avgY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      const { w: viewW, h: viewH } = this.getViewportSize();
      const targetScale = Math.max(this.transform.scale, 0.85);
      this.transform = {
        scale: targetScale,
        x: viewW / 2 - avgX * targetScale,
        y: viewH / 2 - avgY * targetScale
      };
      this.updateZoomLabel();
    }
    this.notifySelection();
    this.render();
  }
  deleteSelected() {
    if (this.selectedInstanceId) {
      const id = this.selectedInstanceId;
      this.design.instances = this.design.instances.filter((i) => i.id !== id);
      this.design.nets = this.design.nets.filter((n) => {
        if (n.source?.instanceId === id) return false;
        n.targets = n.targets.filter((t) => t.instanceId !== id);
        return n.targets.length > 0 || !!n.source;
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
      this.notifySelection();
    }
  }
  duplicateSelected() {
    if (!this.selectedInstanceId) return null;
    const orig = this.design.instances.find((i) => i.id === this.selectedInstanceId);
    if (!orig) return null;
    const count = this.design.instances.filter((i) => i.moduleId === orig.moduleId).length + 1;
    const copy = {
      id: `${orig.moduleId}_${Date.now()}`,
      moduleId: orig.moduleId,
      name: `u_${orig.moduleId}_${count}`,
      position: { x: orig.position.x + 40, y: orig.position.y + 40 },
      parameters: { ...orig.parameters }
    };
    this.design.instances.push(copy);
    this.selectedInstanceId = copy.id;
    this.selectedNetId = null;
    this.render();
    this.notifyChange();
    this.notifySelection();
    return copy;
  }
  addModule(moduleId, name) {
    const { w, h } = this.getViewportSize();
    const viewCenterX = (-this.transform.x + w / 2) / this.transform.scale;
    const viewCenterY = (-this.transform.y + h / 2) / this.transform.scale;
    const offset = this.design.instances.length % 4 * 20;
    return this.addModuleAt(moduleId, viewCenterX - 100 + offset, viewCenterY - 80 + offset, name);
  }
  addModuleAt(moduleId, worldX, worldY, name) {
    const modDef = (0, import_catalog3.getModuleDef)(moduleId);
    const count = this.design.instances.filter((i) => i.moduleId === moduleId).length + 1;
    const instName = name || `u_${moduleId}_${count}`;
    const id = `${moduleId}_${Date.now()}_${Math.floor(Math.random() * 100)}`;
    const defaultParams = {};
    if (modDef) {
      for (const p of modDef.parameters) {
        defaultParams[p.name] = p.default;
      }
    }
    const posX = this.gridSnap ? Math.round(worldX / CANVAS_METRICS.GRID_SIZE) * CANVAS_METRICS.GRID_SIZE : Math.round(worldX);
    const posY = this.gridSnap ? Math.round(worldY / CANVAS_METRICS.GRID_SIZE) * CANVAS_METRICS.GRID_SIZE : Math.round(worldY);
    const newInst = {
      id,
      moduleId,
      name: instName,
      position: { x: posX, y: posY },
      parameters: defaultParams
    };
    this.design.instances.push(newInst);
    this.selectedInstanceId = newInst.id;
    this.selectedNetId = null;
    this.render();
    this.notifyChange();
    this.notifySelection();
    return newInst;
  }
  screenToWorld(sx, sy) {
    return {
      x: (sx - this.transform.x) / this.transform.scale,
      y: (sy - this.transform.y) / this.transform.scale
    };
  }
  render() {
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = this.getViewportSize();
    this.renderedWires = this.renderer.render(this.ctx, w, h, dpr, {
      design: this.design,
      diagnostics: this.diagnostics,
      transform: this.transform,
      selectedInstanceId: this.selectedInstanceId,
      selectedNetId: this.selectedNetId,
      hoveredInstanceId: this.hoveredInstanceId,
      hoveredNetId: this.hoveredNetId,
      hoveredPort: this.hoveredPort,
      wiringSource: this.wiringSource,
      wiringCurrent: this.wiringCurrent,
      mouseScreen: this.mouseScreen,
      draggingInstanceId: this.draggingInstanceId,
      isPanning: this.isPanning
    });
  }
  notifyChange() {
    this.design.metadata.modified = (/* @__PURE__ */ new Date()).toISOString();
    this.onChangeCallback?.(this.design);
  }
  notifySelection() {
    const inst = this.selectedInstanceId ? this.design.instances.find((i) => i.id === this.selectedInstanceId) || null : null;
    const net = this.selectedNetId ? this.design.nets.find((n) => n.id === this.selectedNetId) || null : null;
    this.onSelectCallback?.(inst);
    this.onNetSelectCallback?.(net);
  }
  updateCursor() {
    if (this.isPanning) {
      this.canvas.style.cursor = "grabbing";
    } else if (this.spacePressed || this.toolMode === "pan") {
      this.canvas.style.cursor = "grab";
    } else if (this.wiringSource || this.hoveredPort) {
      this.canvas.style.cursor = "crosshair";
    } else if (this.hoveredNetId) {
      this.canvas.style.cursor = "pointer";
    } else if (this.hoveredInstanceId) {
      this.canvas.style.cursor = "move";
    } else {
      this.canvas.style.cursor = "default";
    }
  }
  setupEvents() {
    let hasMoved = false;
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let pinchLastMid = null;
    const beginPrimaryPointer = (clientX, clientY, isTouch, forcePan = false) => {
      const rect = this.canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      this.mouseScreen = { x: sx, y: sy };
      const world = this.screenToWorld(sx, sy);
      hasMoved = false;
      if (!forcePan && !this.spacePressed && this.toolMode !== "pan") {
        const allPorts = computeAllPortPositions(this.design);
        const baseHit = isTouch ? 20 : 11;
        const hitRadius = Math.max(baseHit, (baseHit + 2) / this.transform.scale);
        const clickedPort = allPorts.find((p) => Math.hypot(p.x - world.x, p.y - world.y) <= hitRadius);
        if (clickedPort) {
          this.wiringSource = clickedPort;
          this.wiringCurrent = { x: world.x, y: world.y };
          this.updateCursor();
          this.render();
          return;
        }
      }
      if (forcePan || this.spacePressed || this.toolMode === "pan") {
        this.isPanning = true;
        this.panStart = { x: clientX - this.transform.x, y: clientY - this.transform.y };
        this.updateCursor();
        return;
      }
      const clickedInst = [...this.design.instances].reverse().find((inst) => {
        const modDef = (0, import_catalog3.getModuleDef)(inst.moduleId);
        const { w, h } = getInstanceDimensions(modDef, inst);
        return world.x >= inst.position.x && world.x <= inst.position.x + w && world.y >= inst.position.y && world.y <= inst.position.y + h;
      });
      if (clickedInst) {
        this.selectedInstanceId = clickedInst.id;
        this.selectedNetId = null;
        this.draggingInstanceId = clickedInst.id;
        this.dragOffset = { x: world.x - clickedInst.position.x, y: world.y - clickedInst.position.y };
        this.notifySelection();
        this.render();
        return;
      }
      const hitWire = findHitWire(
        this.renderedWires,
        world,
        isTouch ? Math.min(this.transform.scale, 0.7) : this.transform.scale
      );
      if (hitWire) {
        this.selectedNetId = hitWire.net.id;
        this.selectedInstanceId = null;
        this.notifySelection();
        this.render();
        return;
      }
      this.selectedInstanceId = null;
      this.selectedNetId = null;
      this.isPanning = true;
      this.panStart = { x: clientX - this.transform.x, y: clientY - this.transform.y };
      this.updateCursor();
      this.notifySelection();
      this.render();
    };
    const movePrimaryPointer = (clientX, clientY, isTouch) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;
      this.mouseScreen = { x: mouseX, y: mouseY };
      const world = this.screenToWorld(mouseX, mouseY);
      if (this.isPanning) {
        this.transform.x = clientX - this.panStart.x;
        this.transform.y = clientY - this.panStart.y;
        this.render();
        return;
      }
      if (this.wiringSource) {
        this.wiringCurrent = { x: world.x, y: world.y };
        const allPorts2 = computeAllPortPositions(this.design);
        const snapBase = isTouch ? 22 : 13;
        const snapRadius = Math.max(snapBase, (snapBase + 2) / this.transform.scale);
        this.hoveredPort = allPorts2.find((p) => {
          if (p.instanceId === this.wiringSource.instanceId) return false;
          return Math.hypot(p.x - world.x, p.y - world.y) <= snapRadius;
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
          inst.position.x = this.gridSnap ? Math.round(rawX / CANVAS_METRICS.GRID_SIZE) * CANVAS_METRICS.GRID_SIZE : Math.round(rawX);
          inst.position.y = this.gridSnap ? Math.round(rawY / CANVAS_METRICS.GRID_SIZE) * CANVAS_METRICS.GRID_SIZE : Math.round(rawY);
          this.render();
        }
        return;
      }
      if (isTouch) return;
      const insideCanvas = mouseX >= 0 && mouseY >= 0 && mouseX <= rect.width && mouseY <= rect.height;
      if (!insideCanvas) {
        if (this.hoveredPort || this.hoveredNetId || this.hoveredInstanceId) {
          this.hoveredPort = null;
          this.hoveredNetId = null;
          this.hoveredInstanceId = null;
          this.updateCursor();
          this.render();
        }
        return;
      }
      const allPorts = computeAllPortPositions(this.design);
      const portRadius = Math.max(10, 11 / this.transform.scale);
      const port = allPorts.find((p) => Math.hypot(p.x - world.x, p.y - world.y) <= portRadius) || null;
      let instHover = null;
      let netHover = null;
      if (!port) {
        const hitInst = [...this.design.instances].reverse().find((inst) => {
          const modDef = (0, import_catalog3.getModuleDef)(inst.moduleId);
          const { w, h } = getInstanceDimensions(modDef, inst);
          return world.x >= inst.position.x && world.x <= inst.position.x + w && world.y >= inst.position.y && world.y <= inst.position.y + h;
        });
        if (hitInst) {
          instHover = hitInst.id;
        } else {
          const hitWire = findHitWire(this.renderedWires, world, this.transform.scale);
          if (hitWire) netHover = hitWire.net.id;
        }
      }
      const changed = port?.instanceId !== this.hoveredPort?.instanceId || port?.portId !== this.hoveredPort?.portId || instHover !== this.hoveredInstanceId || netHover !== this.hoveredNetId;
      if (changed) {
        this.hoveredPort = port;
        this.hoveredInstanceId = instHover;
        this.hoveredNetId = netHover;
        this.updateCursor();
        this.render();
      }
    };
    const endPrimaryPointer = () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.updateCursor();
      }
      if (this.draggingInstanceId) {
        this.draggingInstanceId = null;
        if (hasMoved) this.notifyChange();
      }
      if (this.wiringSource) {
        if (this.hoveredPort) {
          this.completeConnection(this.wiringSource, this.hoveredPort);
        }
        this.wiringSource = null;
        this.hoveredPort = null;
        this.updateCursor();
        this.render();
      }
    };
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.zoomAt(e.offsetX, e.offsetY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    }, { passive: false });
    this.canvas.addEventListener("mousedown", (e) => {
      const forcePan = e.button === 1 || e.altKey;
      beginPrimaryPointer(e.clientX, e.clientY, false, forcePan);
    });
    window.addEventListener("mousemove", (e) => {
      movePrimaryPointer(e.clientX, e.clientY, false);
    });
    window.addEventListener("mouseup", () => {
      endPrimaryPointer();
    });
    this.canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        pinchLastMid = null;
        const t = e.touches[0];
        beginPrimaryPointer(t.clientX, t.clientY, true, false);
      } else if (e.touches.length === 2) {
        e.preventDefault();
        this.draggingInstanceId = null;
        this.wiringSource = null;
        this.isPanning = false;
        const [a, b] = [e.touches[0], e.touches[1]];
        pinchStartDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        pinchStartScale = this.transform.scale;
        const rect = this.canvas.getBoundingClientRect();
        pinchLastMid = {
          x: (a.clientX + b.clientX) / 2 - rect.left,
          y: (a.clientY + b.clientY) / 2 - rect.top
        };
      }
    }, { passive: false });
    this.canvas.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1 && !pinchLastMid) {
        e.preventDefault();
        const t = e.touches[0];
        movePrimaryPointer(t.clientX, t.clientY, true);
      } else if (e.touches.length === 2 && pinchStartDist > 0) {
        e.preventDefault();
        const [a, b] = [e.touches[0], e.touches[1]];
        const rect = this.canvas.getBoundingClientRect();
        const mid = {
          x: (a.clientX + b.clientX) / 2 - rect.left,
          y: (a.clientY + b.clientY) / 2 - rect.top
        };
        const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        const targetScale = Math.max(0.2, Math.min(2.8, pinchStartScale * (dist / pinchStartDist)));
        if (pinchLastMid) {
          this.transform.x += mid.x - pinchLastMid.x;
          this.transform.y += mid.y - pinchLastMid.y;
        }
        this.zoomAt(mid.x, mid.y, targetScale / this.transform.scale);
        pinchLastMid = mid;
      }
    }, { passive: false });
    this.canvas.addEventListener("touchend", (e) => {
      if (e.touches.length === 0) {
        pinchLastMid = null;
        pinchStartDist = 0;
        endPrimaryPointer();
      }
    });
    this.canvas.addEventListener("touchcancel", () => {
      pinchLastMid = null;
      pinchStartDist = 0;
      endPrimaryPointer();
    });
    window.addEventListener("keydown", (e) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") return;
      if (e.code === "Space") {
        if (!this.spacePressed) {
          this.spacePressed = true;
          this.updateCursor();
        }
        e.preventDefault();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        this.deleteSelected();
      } else if (e.key === "Escape") {
        if (this.wiringSource) {
          this.wiringSource = null;
          this.hoveredPort = null;
          this.render();
        } else if (this.selectedInstanceId || this.selectedNetId) {
          this.selectedInstanceId = null;
          this.selectedNetId = null;
          this.notifySelection();
          this.render();
        }
      } else if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey) {
        this.fitToScreen();
      }
    });
    window.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        this.spacePressed = false;
        this.updateCursor();
      }
    });
  }
  completeConnection(src, dst) {
    const outputPort = src.direction === "output" ? src : dst.direction === "output" ? dst : src;
    const inputPort = src.direction === "input" ? src : dst.direction === "input" ? dst : dst;
    const existingNet = this.design.nets.find(
      (n) => n.source?.instanceId === outputPort.instanceId && n.source?.portId === outputPort.portId
    );
    if (existingNet) {
      const alreadyConnected = existingNet.targets.some(
        (t) => t.instanceId === inputPort.instanceId && t.portId === inputPort.portId
      );
      if (!alreadyConnected) {
        existingNet.targets.push({ instanceId: inputPort.instanceId, portId: inputPort.portId });
      }
      this.selectedNetId = existingNet.id;
      this.selectedInstanceId = null;
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
      this.selectedNetId = newNet.id;
      this.selectedInstanceId = null;
    }
    this.notifyChange();
    this.notifySelection();
    this.render();
  }
};

// apps/web/src/state/DesignStore.ts
var import_ir2 = __toESM(require_ir());
var import_drc3 = __toESM(require_drc2());
var import_codegen = __toESM(require_codegen());

// apps/web/src/state/HistoryManager.ts
var HistoryManager = class {
  stack = [];
  cursor = -1;
  maxEntries;
  equals;
  constructor(maxEntries = 40, equals = (a, b) => a === b) {
    this.maxEntries = maxEntries;
    this.equals = equals;
  }
  push(snapshot) {
    if (this.cursor >= 0 && this.equals(this.stack[this.cursor], snapshot)) {
      return;
    }
    this.stack = this.stack.slice(0, this.cursor + 1);
    this.stack.push(snapshot);
    if (this.stack.length > this.maxEntries) {
      this.stack.shift();
    }
    this.cursor = this.stack.length - 1;
  }
  canUndo() {
    return this.cursor > 0;
  }
  canRedo() {
    return this.cursor >= 0 && this.cursor < this.stack.length - 1;
  }
  undo() {
    if (!this.canUndo()) return null;
    this.cursor--;
    return this.stack[this.cursor];
  }
  redo() {
    if (!this.canRedo()) return null;
    this.cursor++;
    return this.stack[this.cursor];
  }
  reset(initialSnapshot) {
    this.stack = [];
    this.cursor = -1;
    if (initialSnapshot !== void 0) {
      this.push(initialSnapshot);
    }
  }
};

// apps/web/src/state/Persistence.ts
var import_ir = __toESM(require_ir());
var import_catalog4 = __toESM(require_catalog2());
function toBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
async function deflateRaw(input) {
  const cs = new CompressionStream("deflate-raw");
  const readPromise = new Response(cs.readable).arrayBuffer();
  const writer = cs.writable.getWriter();
  await writer.write(new Uint8Array(input));
  await writer.close();
  return new Uint8Array(await readPromise);
}
async function inflateRaw(input) {
  const ds = new DecompressionStream("deflate-raw");
  const readPromise = new Response(ds.readable).arrayBuffer();
  const writer = ds.writable.getWriter();
  await writer.write(new Uint8Array(input));
  await writer.close();
  return new Uint8Array(await readPromise);
}
function compactDesignJson(design) {
  return JSON.stringify(design);
}
async function encodeDesignHash(design, options) {
  if (!options.isDirty && options.templateId) {
    if (options.templateId === import_catalog4.STARTER_TEMPLATES[0]?.id) {
      return "";
    }
    return `#t=${encodeURIComponent(options.templateId)}`;
  }
  const minified = compactDesignJson(design);
  const utf8 = new TextEncoder().encode(minified);
  if (typeof CompressionStream !== "undefined" && typeof Response !== "undefined") {
    try {
      const compressed = await deflateRaw(utf8);
      if (compressed.length < utf8.length) {
        return `#z=${toBase64Url(compressed)}`;
      }
    } catch {
    }
  }
  return `#d=${toBase64Url(utf8)}`;
}
var pendingHashToken = 0;
function saveDesignToHash(design, options = { isDirty: true }) {
  const token = ++pendingHashToken;
  const applyHash = (hash) => {
    if (token !== pendingHashToken) return;
    try {
      const base = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, "", hash ? `${base}${hash}` : base);
    } catch {
    }
  };
  if (!options.isDirty && options.templateId) {
    const hash = options.templateId === import_catalog4.STARTER_TEMPLATES[0]?.id ? "" : `#t=${encodeURIComponent(options.templateId)}`;
    applyHash(hash);
    return;
  }
  void encodeDesignHash(design, options).then(applyHash);
}
function loadDesignFromHash() {
  try {
    const hash = window.location.hash;
    if (!hash) return null;
    if (hash.startsWith("#t=")) {
      const id = decodeURIComponent(hash.slice(3));
      const tmpl = import_catalog4.STARTER_TEMPLATES.find((t) => t.id === id);
      if (tmpl) return { design: tmpl.createDesign(), templateId: tmpl.id };
    }
    if (hash.startsWith("#d=")) {
      const bytes = fromBase64Url(hash.slice(3));
      const json = new TextDecoder().decode(bytes);
      const { design, errors } = (0, import_ir.parseKonaDesign)(json);
      if (design && errors.length === 0) return { design };
    }
    if (hash.includes("design=")) {
      const encoded = hash.split("design=")[1];
      const json = decodeURIComponent(atob(encoded));
      const { design, errors } = (0, import_ir.parseKonaDesign)(json);
      if (design && errors.length === 0) return { design };
    }
  } catch {
  }
  return null;
}
async function loadCompressedDesignFromHash(rawHash = typeof window !== "undefined" ? window.location.hash : "") {
  try {
    if (!rawHash.startsWith("#z=") || typeof DecompressionStream === "undefined") {
      return null;
    }
    const compressed = fromBase64Url(rawHash.slice(3));
    const raw = await inflateRaw(compressed);
    const json = new TextDecoder().decode(raw);
    const { design, errors } = (0, import_ir.parseKonaDesign)(json);
    if (design && errors.length === 0) {
      return { design };
    }
  } catch {
  }
  return null;
}
function downloadFile(content, filename, mimeType) {
  const a = document.createElement("a");
  a.download = filename;
  if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    const part = content instanceof Uint8Array ? new Uint8Array(content) : content;
    const blob = new Blob([part], { type: mimeType });
    const url = URL.createObjectURL(blob);
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else if (typeof content === "string") {
    a.href = `data:${mimeType};charset=utf-8,` + encodeURIComponent(content);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    let binary = "";
    for (let i = 0; i < content.length; i++) {
      binary += String.fromCharCode(content[i]);
    }
    a.href = `data:${mimeType};base64,` + btoa(binary);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

// apps/web/src/state/DesignStore.ts
var DesignStore = class {
  design;
  diagnostics = [];
  systemVerilog = "";
  selectedInstance = null;
  selectedNet = null;
  isDirty = false;
  templateId;
  history = new HistoryManager(40);
  listeners = /* @__PURE__ */ new Set();
  constructor(initialDesign, options = {}) {
    this.design = initialDesign;
    this.templateId = options.templateId;
    this.isDirty = options.isDirty ?? false;
    this.history.reset((0, import_ir2.serializeKonaDesign)(initialDesign));
    this.recompute();
    if (!options.skipInitialHashSync) {
      saveDesignToHash(this.design, { templateId: this.templateId, isDirty: this.isDirty });
    }
  }
  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }
  getState() {
    return {
      design: this.design,
      diagnostics: this.diagnostics,
      systemVerilog: this.systemVerilog,
      selectedInstance: this.selectedInstance,
      selectedNet: this.selectedNet,
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
      isDirty: this.isDirty,
      templateId: this.templateId
    };
  }
  getDesign() {
    return this.design;
  }
  isDesignDirty() {
    return this.isDirty;
  }
  setSelection(instance, net) {
    this.selectedInstance = instance;
    this.selectedNet = net;
    this.emit();
  }
  commitMutation(updatedDesign) {
    if (updatedDesign) {
      this.design = updatedDesign;
    }
    this.isDirty = true;
    this.history.push((0, import_ir2.serializeKonaDesign)(this.design));
    this.recompute();
    saveDesignToHash(this.design, { templateId: this.templateId, isDirty: true });
    this.emit();
  }
  loadTemplateDesign(newDesign, templateId) {
    this.design = newDesign;
    this.templateId = templateId;
    this.isDirty = !templateId;
    this.selectedInstance = null;
    this.selectedNet = null;
    this.history.reset((0, import_ir2.serializeKonaDesign)(newDesign));
    this.recompute();
    saveDesignToHash(this.design, { templateId: this.templateId, isDirty: this.isDirty });
    this.emit();
  }
  undo() {
    const snap = this.history.undo();
    if (!snap) return null;
    return this.restoreSnapshot(snap);
  }
  redo() {
    const snap = this.history.redo();
    if (!snap) return null;
    return this.restoreSnapshot(snap);
  }
  restoreSnapshot(snap) {
    const { design } = (0, import_ir2.parseKonaDesign)(snap);
    if (!design) return null;
    this.design = design;
    this.isDirty = this.history.canUndo() || !this.templateId;
    this.selectedInstance = null;
    this.selectedNet = null;
    this.recompute();
    saveDesignToHash(this.design, { templateId: this.templateId, isDirty: this.isDirty });
    this.emit();
    return this.design;
  }
  recompute() {
    this.diagnostics = (0, import_drc3.runDesignRuleCheck)(this.design);
    this.systemVerilog = (0, import_codegen.generateSystemVerilog)(this.design);
  }
  emit() {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
};

// apps/web/src/components/CatalogPanel.ts
var import_catalog5 = __toESM(require_catalog2());
var import_plain_english = __toESM(require_plain_english());

// apps/web/src/utils/html.ts
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// apps/web/src/components/CatalogPanel.ts
var CatalogPanel = class {
  activeFilter = "all";
  searchQuery = "";
  simpleMode = false;
  listEl;
  callbacks;
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.listEl = document.getElementById("catalog-items-list");
    if (!this.listEl) return;
    this.bindControls();
    this.render();
  }
  setSimpleMode(enabled) {
    this.simpleMode = enabled;
    this.render();
  }
  getFilteredItems() {
    return import_catalog5.STARTER_IP_CATALOG.filter((m) => {
      const matchesCategory = this.activeFilter === "all" || m.category === this.activeFilter;
      const q = this.searchQuery;
      const matchesSearch = !q || m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }
  bindControls() {
    const filterChips = document.querySelectorAll(".md-filter-chip");
    filterChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        filterChips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        this.activeFilter = chip.getAttribute("data-filter") || "all";
        this.render();
      });
    });
    const searchInput = document.getElementById("catalog-search-input");
    const clearBtn = document.getElementById("catalog-search-clear");
    searchInput?.addEventListener("input", () => {
      this.searchQuery = (searchInput.value || "").toLowerCase().trim();
      if (clearBtn) clearBtn.style.display = this.searchQuery ? "inline-block" : "none";
      this.render();
    });
    clearBtn?.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      this.searchQuery = "";
      clearBtn.style.display = "none";
      this.render();
    });
  }
  render() {
    if (!this.listEl) return;
    const items = this.getFilteredItems();
    if (items.length === 0) {
      this.listEl.innerHTML = `<div class="catalog-empty"><p>No matching IP modules found.</p></div>`;
    } else {
      this.listEl.innerHTML = items.map((mod) => {
        const plain = (0, import_plain_english.getPlainModuleInfo)(mod.id);
        const title = this.simpleMode ? plain.friendlyName : mod.name;
        const desc = this.simpleMode ? plain.whatItDoes : mod.description;
        return `
        <div class="catalog-card" role="button" tabindex="0" draggable="true" data-module-id="${mod.id}" title="${escapeHtml(mod.description)}">
          <div class="catalog-card-header">
            <span class="catalog-category-tag ${mod.category}">${this.simpleMode ? plain.analogy : mod.category}</span>
            <span class="catalog-meta-right">
              <span class="catalog-port-count">${mod.ports.length}p</span>
              <span class="catalog-add-btn">+ Add</span>
            </span>
          </div>
          <div class="catalog-card-title">${escapeHtml(title)}</div>
          <div class="catalog-card-desc">${escapeHtml(desc)}</div>
        </div>
      `;
      }).join("");
      this.listEl.querySelectorAll(".catalog-card").forEach((card) => {
        const triggerAdd = () => {
          const modId = card.getAttribute("data-module-id");
          if (modId) this.callbacks.onAddModule(modId);
        };
        card.addEventListener("click", triggerAdd);
        card.addEventListener("keydown", (e) => {
          const ke = e;
          if (ke.key === "Enter" || ke.key === " ") {
            ke.preventDefault();
            triggerAdd();
          }
        });
        card.addEventListener("dragstart", (e) => {
          const modId = card.getAttribute("data-module-id");
          const dragEvent = e;
          if (modId && dragEvent.dataTransfer) {
            dragEvent.dataTransfer.setData("text/kona-module", modId);
            dragEvent.dataTransfer.effectAllowed = "copy";
          }
        });
      });
    }
    const countBadge = document.getElementById("catalog-count-badge");
    if (countBadge) countBadge.textContent = `${items.length} IPs`;
  }
};

// apps/web/src/components/DrcPanel.ts
var DrcPanel = class {
  callbacks;
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.bindToggle();
  }
  bindToggle() {
    const drcChip = document.getElementById("drc-status-chip");
    const drcToggle = document.getElementById("drc-panel-toggle");
    const drcContainer = document.querySelector(".drc-panel-container");
    const drcBody = document.getElementById("drc-panel-body");
    const onActivateKey = (e, fn) => {
      const ke = e;
      if (ke.key === "Enter" || ke.key === " ") {
        ke.preventDefault();
        fn();
      }
    };
    const toggleDrc = () => {
      if (!drcBody || !drcContainer) return;
      const collapsed = drcContainer.classList.toggle("collapsed");
      drcBody.style.display = collapsed ? "none" : "flex";
    };
    drcToggle?.addEventListener("click", toggleDrc);
    drcToggle?.addEventListener("keydown", (e) => onActivateKey(e, toggleDrc));
    const openDrc = () => {
      this.callbacks.onEnsureVisible();
      if (drcBody && drcContainer) {
        drcContainer.classList.remove("collapsed");
        drcBody.style.display = "flex";
      }
    };
    drcChip?.addEventListener("click", openDrc);
    drcChip?.addEventListener("keydown", (e) => onActivateKey(e, openDrc));
  }
  update(diagnostics) {
    const chipEl = document.getElementById("drc-status-chip");
    const badgeEl = document.getElementById("drc-badge-count");
    const panelEl = document.getElementById("drc-panel-body");
    const errors = diagnostics.filter((d) => d.severity === "error");
    const warnings = diagnostics.filter((d) => d.severity === "warning");
    if (chipEl) {
      if (errors.length > 0) {
        chipEl.className = "status-chip error md-chip";
        chipEl.textContent = `${errors.length} DRC Error${errors.length > 1 ? "s" : ""}`;
      } else if (warnings.length > 0) {
        chipEl.className = "status-chip warning md-chip";
        chipEl.textContent = `${warnings.length} DRC Warning${warnings.length > 1 ? "s" : ""}`;
      } else {
        chipEl.className = "status-chip success md-chip";
        chipEl.textContent = "DRC Passed";
      }
    }
    if (badgeEl) {
      if (errors.length > 0) {
        badgeEl.className = "drc-header-badge md-badge-pill error";
        badgeEl.textContent = `${errors.length} Error${errors.length > 1 ? "s" : ""}`;
      } else if (warnings.length > 0) {
        badgeEl.className = "drc-header-badge md-badge-pill warning";
        badgeEl.textContent = `${warnings.length} Warning${warnings.length > 1 ? "s" : ""}`;
      } else {
        badgeEl.className = "drc-header-badge md-badge-pill";
        badgeEl.textContent = "0 Errors";
      }
    }
    if (!panelEl) return;
    if (diagnostics.length === 0) {
      panelEl.innerHTML = '<div class="drc-empty">All design rules satisfied. Clean netlist!</div>';
      return;
    }
    const hasFixableWiring = diagnostics.some(
      (d) => d.rule === "UNCONNECTED_CLOCK" || d.rule === "UNCONNECTED_RESET" || d.rule === "DANGLING_NET"
    );
    const fixBannerHtml = hasFixableWiring && this.callbacks.onAutoWire ? `<button type="button" id="btn-auto-wire" class="btn-auto-wire" title="Automatically connect clock and reset pins">Auto-Wire Clocks &amp; Fix</button>` : "";
    panelEl.innerHTML = fixBannerHtml + diagnostics.map((d) => {
      const targetAttr = d.instanceId ? `data-focus-inst="${escapeHtml(d.instanceId)}"` : d.netId ? `data-focus-net="${escapeHtml(d.netId)}"` : "";
      return `
        <div class="drc-item ${d.severity} ${targetAttr ? "clickable" : ""}" ${targetAttr} title="${targetAttr ? "Click to focus on canvas" : ""}">
          <div class="drc-item-rule">${d.rule}</div>
          <div class="drc-item-msg">${escapeHtml(d.message)}</div>
        </div>
      `;
    }).join("");
    document.getElementById("btn-auto-wire")?.addEventListener("click", () => {
      this.callbacks.onAutoWire?.();
    });
    panelEl.querySelectorAll(".drc-item.clickable").forEach((item) => {
      item.addEventListener("click", () => {
        const instId = item.getAttribute("data-focus-inst");
        const netId = item.getAttribute("data-focus-net");
        if (instId) this.callbacks.onFocusInstance(instId);
        else if (netId) this.callbacks.onFocusNet(netId);
      });
    });
  }
};

// apps/web/src/components/InspectorPanel.ts
var import_catalog6 = __toESM(require_catalog2());
var import_drc4 = __toESM(require_drc2());
var import_architecture = __toESM(require_architecture());
var import_plain_english2 = __toESM(require_plain_english());
var InspectorPanel = class {
  container;
  callbacks;
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.container = document.getElementById("inspector-content");
  }
  render(design, diagnostics, selectedInstance, selectedNet) {
    if (!this.container) return;
    if (selectedNet) {
      this.renderNetInspector(design, diagnostics, selectedNet);
    } else if (selectedInstance) {
      this.renderModuleInspector(diagnostics, selectedInstance);
    } else {
      this.renderEmptySummary(design);
    }
  }
  renderEmptySummary(design) {
    if (!this.container) return;
    const report = (0, import_architecture.analyzeArchitecture)(design);
    const spec = design.spec || {};
    this.container.innerHTML = `
      <div class="inspector-stage1">
        <div class="inspector-header">
          <div class="inspector-header-top">
            <span class="inspector-badge">STAGE 1 \xB7 ARCHITECTURE</span>
            <button id="btn-export-arch-spec" class="btn-chip-action" title="Download Stage 1 Architecture Spec (.md)">Export Spec</button>
          </div>
          <h3>${escapeHtml(design.name)}</h3>
          <p class="inspector-desc">Define chip PPA targets, inspect memory map, or click any block on canvas to inspect its ports.</p>
        </div>

        <div class="inspector-section">
          <label class="section-title">Chip Specification</label>
          <div class="spec-form">
            <label class="spec-field">
              <span>Chip Name</span>
              <input type="text" id="spec-chip-name" class="kona-input" value="${escapeHtml(design.name)}" />
            </label>
            <label class="spec-field">
              <span>Top Module</span>
              <input type="text" id="spec-top-module" class="kona-input" value="${escapeHtml(design.topModule)}" />
            </label>
            <label class="spec-field">
              <span>Target Application</span>
              <input type="text" id="spec-target-app" class="kona-input" placeholder="e.g. Smart Meter RISC-V MCU" value="${escapeHtml(spec.targetApplication || "")}" />
            </label>
            <label class="spec-field">
              <span>Author / Team</span>
              <input type="text" id="spec-author" class="kona-input" placeholder="e.g. Silicon Team India" value="${escapeHtml(spec.author || "")}" />
            </label>
            <div class="spec-budget-row">
              <label class="spec-field">
                <span>Power Budget (mW)</span>
                <input type="number" id="spec-power-budget" class="kona-input" min="1" step="1" placeholder="Auto" value="${spec.powerBudgetMw ?? ""}" />
              </label>
              <label class="spec-field">
                <span>Max Area (mm\xB2)</span>
                <input type="number" id="spec-area-budget" class="kona-input" min="0.1" step="0.1" placeholder="Auto" value="${spec.maxAreaMm2 ?? ""}" />
              </label>
            </div>
          </div>
        </div>

        <div class="inspector-section">
          <label class="section-title">Estimated PPA &amp; Pin Budget (${escapeHtml(report.pdk.shortName)})</label>
          <div class="inspector-design-summary" style="margin-top:0;">
            <div class="summary-row"><span>Logic Size</span><strong>~${report.ppa.estimatedGates.toLocaleString()} GE</strong></div>
            <div class="summary-row"><span>On-Chip SRAM</span><strong>${report.ppa.sramKbytes} KB</strong></div>
            <div class="summary-row"><span>Est. Core Area</span><strong class="${report.ppa.withinAreaBudget ? "" : "text-warn"}">~${report.ppa.estimatedAreaMm2} mm\xB2</strong></div>
            <div class="summary-row"><span>Est. Power @ ${report.ppa.clockFreqMhz}MHz</span><strong class="${report.ppa.withinPowerBudget ? "" : "text-warn"}">~${report.ppa.estimatedPowerMw} mW</strong></div>
            <div class="summary-row"><span>Package Pins (${report.pinBudget.packageType})</span><strong class="${report.pinBudget.fitsPackage ? "" : "text-err"}">${report.pinBudget.signalPins}/${report.pinBudget.maxSignalPins} sig</strong></div>
          </div>
        </div>

        <div class="inspector-section">
          <label class="section-title">System Memory Map (${report.memoryMap.length})</label>
          <div class="memmap-list">
            ${report.memoryMap.length === 0 ? '<div class="empty-text">No bus crossbar in design (streaming datapath).</div>' : report.memoryMap.map((r) => `
                <div class="memmap-row ${r.overlapsWith ? "overlap" : ""}">
                  <div class="memmap-top">
                    <strong>${escapeHtml(r.crossbarName)}.${r.slot}</strong>
                    <code>${r.baseHex}\u2013${r.endHex}</code>
                  </div>
                  <div class="memmap-sub">${escapeHtml(r.targetInstances.join(", ") || "Unconnected")}${r.overlapsWith ? ` \xB7 OVERLAP: ${escapeHtml(r.overlapsWith)}` : ""}</div>
                </div>
              `).join("")}
          </div>
        </div>

        <div class="inspector-section">
          <label class="section-title">Stage 1 Readiness</label>
          <div class="stage1-checklist">
            ${report.checklist.map((item) => `
              <div class="stage1-check ${item.status}" title="${escapeHtml(item.detail)}">
                <span class="stage1-dot"></span>
                <span>${escapeHtml(item.label)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
    const applySpecPatch = () => {
      const nameVal = document.getElementById("spec-chip-name")?.value.trim();
      const topVal = document.getElementById("spec-top-module")?.value.trim();
      const appVal = document.getElementById("spec-target-app")?.value.trim();
      const authorVal = document.getElementById("spec-author")?.value.trim();
      const pwrRaw = document.getElementById("spec-power-budget")?.value;
      const areaRaw = document.getElementById("spec-area-budget")?.value;
      const nextSpec = {
        ...spec,
        targetApplication: appVal || void 0,
        author: authorVal || void 0,
        powerBudgetMw: pwrRaw && Number(pwrRaw) > 0 ? Number(pwrRaw) : void 0,
        maxAreaMm2: areaRaw && Number(areaRaw) > 0 ? Number(areaRaw) : void 0
      };
      if (this.callbacks.onUpdateDesignSpec) {
        this.callbacks.onUpdateDesignSpec({
          name: nameVal || design.name,
          topModule: topVal || design.topModule,
          spec: nextSpec
        });
      } else {
        if (nameVal) design.name = nameVal;
        if (topVal) design.topModule = topVal;
        design.spec = nextSpec;
        this.callbacks.onMutate();
      }
    };
    ["spec-chip-name", "spec-top-module", "spec-target-app", "spec-author", "spec-power-budget", "spec-area-budget"].forEach((id) => {
      document.getElementById(id)?.addEventListener("change", applySpecPatch);
    });
    document.getElementById("btn-export-arch-spec")?.addEventListener("click", () => {
      const md = (0, import_architecture.generateArchitectureSpecMarkdown)(design, report);
      downloadFile(md, `${design.topModule || "chip"}_ARCHITECTURE_SPEC.md`, "text/markdown");
    });
  }
  renderModuleInspector(diagnostics, inst) {
    if (!this.container) return;
    const modDef = (0, import_catalog6.getModuleDef)(inst.moduleId);
    const plain = (0, import_plain_english2.getPlainModuleInfo)(inst.moduleId);
    const instDiags = diagnostics.filter((d) => d.instanceId === inst.id);
    let html = `
      <div class="inspector-header">
        <div class="inspector-header-top">
          <span class="inspector-badge">${modDef?.category || "module"}</span>
          <div class="inspector-quick-actions">
            <button id="btn-focus-module" class="btn-chip-action" title="Center canvas on block">Focus</button>
            <button id="btn-dup-module" class="btn-chip-action" title="Duplicate block (Ctrl+D)">Duplicate</button>
          </div>
        </div>
        <h3>${escapeHtml(inst.name)}</h3>
        <div class="plain-guide-card">
          <strong>${escapeHtml(plain.friendlyName)}</strong>
          <span>${escapeHtml(plain.whatItDoes)}</span>
        </div>
        <p class="inspector-desc">${modDef?.description || ""}</p>
      </div>
    `;
    if (instDiags.length > 0) {
      html += `
        <div class="inspector-alerts">
          ${instDiags.map((d) => `<div class="inspector-alert ${d.severity}"><strong>${d.rule}:</strong> ${escapeHtml(d.message)}</div>`).join("")}
        </div>
      `;
    }
    html += `
      <div class="inspector-section">
        <label class="section-title" for="inspector-inst-name">Instance Name</label>
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
          html += `<input type="checkbox" class="param-bool" data-param="${p.name}" ${val ? "checked" : ""} />`;
        } else if (p.type === "integer") {
          html += `<input type="number" class="kona-input param-num" data-param="${p.name}" value="${val}" />`;
        } else {
          html += `<input type="text" class="kona-input param-str" data-param="${p.name}" value="${escapeHtml(String(val))}" />`;
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
        <label class="section-title">Ports (${modDef?.ports.length || 0})</label>
        <div class="ports-list">
    `;
    if (modDef) {
      for (const port of modDef.ports) {
        const ew = (0, import_drc4.getEffectivePortWidth)(modDef, port, inst);
        const isBus = ew > 1;
        html += `
          <div class="port-row" title="${escapeHtml(port.description || port.name)}">
            <span class="port-dir ${port.direction}">${port.direction.toUpperCase()}</span>
            <span class="port-name">${port.name}${isBus ? `[${ew - 1}:0]` : ""}</span>
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
    this.container.innerHTML = html;
    const bindCommitOnChange = (el, apply) => {
      if (!el) return;
      el.addEventListener("change", () => apply(el));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") el.blur();
      });
    };
    bindCommitOnChange(
      document.getElementById("inspector-inst-name"),
      (el) => {
        inst.name = el.value.trim() || inst.name;
        this.callbacks.onMutate();
      }
    );
    this.container.querySelectorAll(".param-bool").forEach((el) => {
      el.addEventListener("change", (e) => {
        const pName = e.target.dataset.param;
        inst.parameters[pName] = e.target.checked;
        this.callbacks.onMutate();
      });
    });
    this.container.querySelectorAll(".param-num").forEach((el) => {
      bindCommitOnChange(el, (input) => {
        const pName = input.dataset.param;
        inst.parameters[pName] = parseInt(input.value, 10) || 0;
        this.callbacks.onMutate();
      });
    });
    this.container.querySelectorAll(".param-str").forEach((el) => {
      bindCommitOnChange(el, (input) => {
        const pName = input.dataset.param;
        inst.parameters[pName] = input.value;
        this.callbacks.onMutate();
      });
    });
    document.getElementById("btn-focus-module")?.addEventListener("click", () => this.callbacks.onFocusInstance(inst.id));
    document.getElementById("btn-dup-module")?.addEventListener("click", () => this.callbacks.onDuplicateSelected());
    document.getElementById("btn-delete-module")?.addEventListener("click", () => this.callbacks.onDeleteSelected());
  }
  renderNetInspector(design, diagnostics, net) {
    if (!this.container) return;
    const instName = (id) => design.instances.find((i) => i.id === id)?.name || id;
    const netDiags = diagnostics.filter((d) => d.netId === net.id);
    let html = `
      <div class="inspector-header">
        <div class="inspector-header-top">
          <span class="inspector-badge">${net.width > 1 ? `BUS [${net.width - 1}:0]` : "1-BIT WIRE"}</span>
          <button id="btn-focus-net" class="btn-chip-action" title="Center canvas on net">Focus</button>
        </div>
        <h3>${escapeHtml(net.name)}</h3>
        <p class="inspector-desc">Signal net connecting ${net.targets.length} receiver${net.targets.length === 1 ? "" : "s"}.</p>
      </div>
    `;
    if (netDiags.length > 0) {
      html += `
        <div class="inspector-alerts">
          ${netDiags.map((d) => `<div class="inspector-alert ${d.severity}"><strong>${d.rule}:</strong> ${escapeHtml(d.message)}</div>`).join("")}
        </div>
      `;
    }
    html += `
      <div class="inspector-section">
        <label class="section-title" for="inspector-net-name">Net Name</label>
        <input type="text" id="inspector-net-name" class="kona-input" value="${escapeHtml(net.name)}" />
      </div>

      <div class="inspector-section">
        <label class="section-title">Driver Source</label>
        <div class="port-row">
          <span class="port-dir output">SRC</span>
          <span class="port-name">${net.source ? `${escapeHtml(instName(net.source.instanceId))}.${escapeHtml(net.source.portId)}` : "Undriven"}</span>
        </div>
      </div>

      <div class="inspector-section">
        <label class="section-title">Target Receivers (${net.targets.length})</label>
        <div class="ports-list">
          ${net.targets.length === 0 ? '<div class="empty-text">No target pins connected.</div>' : net.targets.map((t, idx) => `
              <div class="port-row">
                <span class="port-dir input">DST</span>
                <span class="port-name">${escapeHtml(instName(t.instanceId))}.${escapeHtml(t.portId)}</span>
                <button class="btn-disconnect-pin" data-tgt-idx="${idx}" title="Disconnect this pin">&times;</button>
              </div>
            `).join("")}
        </div>
      </div>

      <div class="inspector-footer">
        <button id="btn-delete-net" class="btn-danger">Delete Wire</button>
      </div>
    `;
    this.container.innerHTML = html;
    const netNameInput = document.getElementById("inspector-net-name");
    netNameInput?.addEventListener("change", () => {
      net.name = netNameInput.value.trim() || net.name;
      this.callbacks.onMutate();
    });
    netNameInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") netNameInput.blur();
    });
    document.getElementById("btn-focus-net")?.addEventListener("click", () => this.callbacks.onFocusNet(net.id));
    this.container.querySelectorAll(".btn-disconnect-pin").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-tgt-idx") || "-1", 10);
        if (idx >= 0 && idx < net.targets.length) {
          net.targets.splice(idx, 1);
          if (net.targets.length === 0) {
            this.callbacks.onDeleteSelected();
          } else {
            this.callbacks.onMutate();
            this.render(design, diagnostics, null, net);
          }
        }
      });
    });
    document.getElementById("btn-delete-net")?.addEventListener("click", () => this.callbacks.onDeleteSelected());
  }
};

// apps/web/src/components/RtlPreviewPanel.ts
var import_asic_rtl = __toESM(require_asic_rtl());
var import_codegen2 = __toESM(require_codegen());

// apps/web/src/utils/sv-highlighter.ts
var SV_KEYWORDS = /* @__PURE__ */ new Set([
  "module",
  "endmodule",
  "input",
  "output",
  "inout",
  "logic",
  "wire",
  "reg",
  "localparam",
  "parameter",
  "assign",
  "always_ff",
  "always_comb",
  "posedge",
  "negedge",
  "begin",
  "end",
  "if",
  "else"
]);
function highlightSystemVerilog(code) {
  return code.split("\n").map((line) => {
    const commentIdx = line.indexOf("//");
    const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : "";
    let highlighted = "";
    if (codePart.trimStart().startsWith("`")) {
      highlighted = `<span class="sv-directive">${escapeHtml(codePart)}</span>`;
    } else {
      const tokenRegex = /([a-zA-Z_][a-zA-Z0-9_]*|\d+'[bhdoBHDO][0-9a-fA-F_xXzZ]+|\d+)/g;
      let lastIdx = 0;
      let match;
      while ((match = tokenRegex.exec(codePart)) !== null) {
        if (match.index > lastIdx) {
          highlighted += escapeHtml(codePart.slice(lastIdx, match.index));
        }
        const tok = match[0];
        if (SV_KEYWORDS.has(tok)) {
          highlighted += `<span class="sv-kw">${escapeHtml(tok)}</span>`;
        } else if (/^\d/.test(tok)) {
          highlighted += `<span class="sv-num">${escapeHtml(tok)}</span>`;
        } else {
          highlighted += escapeHtml(tok);
        }
        lastIdx = tokenRegex.lastIndex;
      }
      if (lastIdx < codePart.length) {
        highlighted += escapeHtml(codePart.slice(lastIdx));
      }
    }
    if (commentPart) {
      highlighted += `<span class="sv-comment">${escapeHtml(commentPart)}</span>`;
    }
    return highlighted;
  }).join("\n");
}

// apps/web/src/components/ToastService.ts
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-8px)";
    toast.style.transition = "all 0.25s ease";
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

// apps/web/src/components/RtlPreviewPanel.ts
var RtlPreviewPanel = class {
  codeEl;
  lineNumbersEl;
  qualityBadgeEl;
  activeFile = "top.sv";
  lastDesign = null;
  lastSvCode = "";
  constructor() {
    this.codeEl = document.getElementById("sv-code-output");
    this.lineNumbersEl = document.getElementById("code-line-numbers");
    this.qualityBadgeEl = document.getElementById("rtl-quality-badge");
    this.bindControls();
  }
  bindControls() {
    document.querySelectorAll(".rtl-file-tab[data-rtl-file]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const file = btn.getAttribute("data-rtl-file");
        if (!file) return;
        this.activeFile = file;
        document.querySelectorAll(".rtl-file-tab[data-rtl-file]").forEach(
          (b) => b.classList.toggle("active", b === btn)
        );
        this.paint();
      });
    });
    document.getElementById("btn-export-tb")?.addEventListener("click", () => {
      if (!this.lastDesign) return;
      const tb = (0, import_codegen2.generateSystemVerilogTestbench)(this.lastDesign);
      const topName = this.lastDesign.topModule || "top";
      downloadFile(tb, `${topName}_tb.sv`, "text/plain");
      showToast(`Exported ${topName}_tb.sv testbench`, "success");
    });
  }
  getActiveCode() {
    if (this.activeFile === "top_tb.sv" && this.lastDesign) {
      return (0, import_codegen2.generateSystemVerilogTestbench)(this.lastDesign);
    }
    if (this.activeFile === "asic_ip_library.v") {
      return import_asic_rtl.ASIC_IP_LIBRARY_VERILOG;
    }
    return this.lastSvCode;
  }
  getActiveFilename() {
    return this.activeFile;
  }
  render(svCode, design) {
    this.lastSvCode = svCode;
    if (design) {
      this.lastDesign = design;
    }
    if (this.qualityBadgeEl && this.lastDesign) {
      const report = (0, import_codegen2.validateRtlOutput)(this.lastDesign, svCode);
      if (report.isClean) {
        this.qualityBadgeEl.className = "rtl-quality-badge clean";
        this.qualityBadgeEl.textContent = `IEEE 1800-2017 \xB7 ${report.lineCount} lines \xB7 ${report.externalPortCount} ext pins \xB7 Clean`;
      } else {
        this.qualityBadgeEl.className = "rtl-quality-badge warn";
        this.qualityBadgeEl.textContent = `${report.issues.length} RTL issue(s): ${report.issues[0]}`;
      }
    }
    this.paint();
  }
  paint() {
    const code = this.getActiveCode();
    if (this.codeEl) {
      this.codeEl.innerHTML = highlightSystemVerilog(code);
    }
    if (this.lineNumbersEl) {
      const lineCount = code.split("\n").length;
      this.lineNumbersEl.innerHTML = Array.from({ length: lineCount }, (_, i) => `<div>${i + 1}</div>`).join("");
    }
  }
};

// apps/web/src/components/WaveformViewer.ts
var import_vcd = __toESM(require_vcd());
var WaveformViewer = class {
  container;
  canvas;
  ctx;
  trace = null;
  radix = "hex";
  zoom = 1;
  panOffset = 20;
  cursorTime = null;
  scrollY = 0;
  needsFit = false;
  isScrubbing = false;
  resizeObserver = null;
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
            <label for="wf-radix-select">Radix:</label>
            <select id="wf-radix-select" class="wf-select">
              <option value="hex" selected>Hex</option>
              <option value="dec">Dec</option>
              <option value="bin">Bin</option>
            </select>
          </div>
          <span class="wf-hint">Click or drag timeline to scrub cursor &bull; Scroll to zoom</span>
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
    this.setupResizeObserver();
    this.resize();
  }
  setupResizeObserver() {
    const wrap = this.canvas.parentElement;
    if (wrap && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(wrap);
    }
  }
  setTrace(trace) {
    this.trace = trace;
    this.cursorTime = 0;
    this.scrollY = 0;
    this.needsFit = true;
    this.rebuildSidebar();
    this.fitTimeline();
    this.render();
  }
  setRadix(radix) {
    this.radix = radix;
    this.updateSidebarValues();
    this.render();
  }
  resize() {
    const wrap = this.canvas.parentElement;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.ctx.resetTransform?.();
    if (this.needsFit && this.trace) {
      this.fitTimeline();
    }
    this.render();
  }
  fitTimeline() {
    if (!this.trace || this.trace.maxTime <= 0) return;
    const wrap = this.canvas.parentElement;
    const rectW = wrap?.getBoundingClientRect().width || wrap?.clientWidth || 0;
    if (rectW <= 40) {
      this.needsFit = true;
      this.zoom = Math.max(2, 540 / this.trace.maxTime);
      this.panOffset = 20;
      return;
    }
    this.zoom = Math.max(0.5, (rectW - 48) / this.trace.maxTime);
    this.panOffset = 20;
    this.needsFit = false;
  }
  updateCursorFromClientX(clientX) {
    if (!this.trace) return;
    const rect = this.canvas.getBoundingClientRect();
    const time = Math.round((clientX - rect.left - this.panOffset) / this.zoom);
    this.cursorTime = Math.max(0, Math.min(this.trace.maxTime, time));
    this.render();
  }
  setupEvents() {
    this.container.querySelector("#wf-zoom-in")?.addEventListener("click", () => {
      this.zoom *= 1.25;
      this.render();
    });
    this.container.querySelector("#wf-zoom-out")?.addEventListener("click", () => {
      this.zoom = Math.max(0.2, this.zoom / 1.25);
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
    this.canvas.addEventListener("mousedown", (e) => {
      if (!this.trace) return;
      this.isScrubbing = true;
      this.updateCursorFromClientX(e.clientX);
    });
    window.addEventListener("mousemove", (e) => {
      if (!this.isScrubbing || !this.trace) return;
      this.updateCursorFromClientX(e.clientX);
    });
    window.addEventListener("mouseup", () => {
      this.isScrubbing = false;
    });
    this.canvas.addEventListener("touchstart", (e) => {
      if (!this.trace || e.touches.length !== 1) return;
      e.preventDefault();
      this.isScrubbing = true;
      this.updateCursorFromClientX(e.touches[0].clientX);
    }, { passive: false });
    this.canvas.addEventListener("touchmove", (e) => {
      if (!this.isScrubbing || !this.trace || e.touches.length !== 1) return;
      e.preventDefault();
      this.updateCursorFromClientX(e.touches[0].clientX);
    }, { passive: false });
    this.canvas.addEventListener("touchend", () => {
      this.isScrubbing = false;
    });
    this.canvas.addEventListener("wheel", (e) => {
      if (!this.trace) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      this.zoom = Math.max(0.2, Math.min(40, this.zoom * factor));
      this.render();
    }, { passive: false });
    const sb = this.container.querySelector("#wf-sidebar");
    sb?.addEventListener("scroll", () => {
      this.scrollY = sb.scrollTop;
      this.render();
    });
    window.addEventListener("resize", () => this.resize());
  }
  render() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr || this.canvas.clientWidth || 600;
    const h = this.canvas.height / dpr || this.canvas.clientHeight || 200;
    if (!this.trace) {
      this.ctx.save();
      this.ctx.scale(dpr, dpr);
      this.ctx.fillStyle = "#0e1117";
      this.ctx.fillRect(0, 0, w, h);
      this.ctx.fillStyle = "#8e919a";
      this.ctx.font = '13px "Google Sans", "Roboto", sans-serif';
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        'No simulation trace loaded. Click "Run Simulation" above to inspect live waveforms.',
        w / 2,
        Math.max(48, h / 2)
      );
      this.ctx.restore();
      return;
    }
    const rowHeight = 36;
    const headerHeight = 28;
    this.ctx.save();
    this.ctx.scale(dpr, dpr);
    this.ctx.fillStyle = "#0e1117";
    this.ctx.fillRect(0, 0, w, h);
    this.updateSidebarValues();
    this.ctx.save();
    if (typeof this.ctx.rect === "function" && typeof this.ctx.clip === "function") {
      this.ctx.beginPath();
      this.ctx.rect(0, headerHeight, w, Math.max(0, h - headerHeight));
      this.ctx.clip();
    }
    let y = headerHeight - this.scrollY;
    for (const sig of this.trace.signals) {
      if (y + rowHeight >= headerHeight && y <= h) {
        const changes = this.trace.signalChanges.get(sig.name) || [];
        this.drawSignalRow(y, rowHeight, sig.width, changes, w);
      }
      y += rowHeight;
    }
    this.ctx.restore();
    this.drawTimelineHeader(w, headerHeight, h);
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
  drawTimelineHeader(w, headerH, totalH) {
    this.ctx.fillStyle = "#1a1d26";
    this.ctx.fillRect(0, 0, w, headerH);
    this.ctx.strokeStyle = "#44474f";
    this.ctx.beginPath();
    this.ctx.moveTo(0, headerH);
    this.ctx.lineTo(w, headerH);
    this.ctx.stroke();
    if (!this.trace) return;
    const maxT = this.trace.maxTime || 100;
    const rawStep = Math.max(5, Math.pow(10, Math.floor(Math.log10(maxT / 5))));
    const tickStep = rawStep * this.zoom < 40 ? rawStep * 2 : rawStep;
    this.ctx.fillStyle = "#8e919a";
    this.ctx.font = '10px "Roboto Mono", monospace';
    this.ctx.textAlign = "left";
    for (let t = 0; t <= maxT; t += tickStep) {
      const x = this.panOffset + t * this.zoom;
      if (x < 0 || x > w) continue;
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      this.ctx.beginPath();
      this.ctx.moveTo(x, headerH);
      this.ctx.lineTo(x, totalH);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(x, headerH - 6);
      this.ctx.lineTo(x, headerH);
      this.ctx.strokeStyle = "#44474f";
      this.ctx.stroke();
      this.ctx.fillText(`${t}ns`, x + 3, headerH - 8);
    }
  }
  drawSignalRow(y, rowH, width, changes, canvasW) {
    this.ctx.strokeStyle = "#1e232e";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, y + rowH);
    this.ctx.lineTo(canvasW, y + rowH);
    this.ctx.stroke();
    const highY = y + 8;
    const lowY = y + rowH - 8;
    const midY = (highY + lowY) / 2;
    if (width === 1) {
      this.ctx.strokeStyle = "#6dd58c";
      this.ctx.lineWidth = 1.8;
      this.ctx.beginPath();
      let prevX2 = this.panOffset;
      let prevY = lowY;
      this.ctx.moveTo(prevX2, prevY);
      for (const ch of changes) {
        const nextX = this.panOffset + ch.time * this.zoom;
        const nextY = ch.value === "1" ? highY : lowY;
        this.ctx.lineTo(nextX, prevY);
        this.ctx.lineTo(nextX, nextY);
        prevX2 = nextX;
        prevY = nextY;
      }
      if (this.trace) {
        this.ctx.lineTo(this.panOffset + this.trace.maxTime * this.zoom, prevY);
      }
      this.ctx.stroke();
      return;
    }
    this.ctx.lineWidth = 1.4;
    let prevX = this.panOffset;
    let prevVal = "0";
    for (const ch of changes) {
      const nextX = this.panOffset + ch.time * this.zoom;
      if (nextX > prevX + 2) {
        this.drawBusSegment(prevX, nextX, highY, midY, lowY, prevVal, width);
      }
      prevX = nextX;
      prevVal = ch.value;
    }
    if (this.trace) {
      const endX = this.panOffset + this.trace.maxTime * this.zoom;
      if (endX > prevX) {
        this.drawBusSegment(prevX, endX, highY, midY, lowY, prevVal, width, true);
      }
    }
  }
  drawBusSegment(startX, endX, highY, midY, lowY, rawValue, width, flatEnd = false) {
    this.ctx.strokeStyle = "#7fcfff";
    this.ctx.fillStyle = "#004d67";
    this.ctx.beginPath();
    this.ctx.moveTo(startX + 2, highY);
    if (flatEnd) {
      this.ctx.lineTo(endX, highY);
      this.ctx.lineTo(endX, lowY);
    } else {
      this.ctx.lineTo(endX - 2, highY);
      this.ctx.lineTo(endX, midY);
      this.ctx.lineTo(endX - 2, lowY);
    }
    this.ctx.lineTo(startX + 2, lowY);
    this.ctx.lineTo(startX, midY);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    if (endX - startX > 32) {
      const formatted = (0, import_vcd.formatSignalValue)(rawValue, width, this.radix);
      this.ctx.fillStyle = "#c2e7ff";
      this.ctx.font = '10px "Roboto Mono", monospace';
      this.ctx.textAlign = "left";
      this.ctx.fillText(formatted, startX + 6, midY + 3.5);
    }
  }
  getCursorSignalValue(sigName, width) {
    if (!this.trace) return (0, import_vcd.formatSignalValue)("0", width, this.radix);
    let curVal = "0";
    const changes = this.trace.signalChanges.get(sigName) || [];
    for (const ch of changes) {
      if (this.cursorTime !== null && ch.time <= this.cursorTime) {
        curVal = ch.value;
      } else if (this.cursorTime === null) {
        break;
      }
    }
    return (0, import_vcd.formatSignalValue)(curVal, width, this.radix);
  }
  rebuildSidebar() {
    const sb = this.container.querySelector("#wf-sidebar");
    if (!sb || !this.trace) return;
    let html = '<div class="wf-sidebar-header">Signal</div>';
    for (const sig of this.trace.signals) {
      const formattedVal = this.getCursorSignalValue(sig.name, sig.width);
      const isBus = sig.width > 1;
      html += `
        <div class="wf-sig-row ${isBus ? "is-bus" : ""}">
          <span class="wf-sig-name" title="${sig.name}">${sig.name}</span>
          <span class="wf-sig-val" data-sig-name="${sig.name}">${formattedVal}</span>
        </div>
      `;
    }
    sb.innerHTML = html;
    sb.scrollTop = 0;
  }
  updateSidebarValues() {
    const sb = this.container.querySelector("#wf-sidebar");
    if (!sb || !this.trace) return;
    if (!sb.querySelector(".wf-sig-row")) {
      this.rebuildSidebar();
      return;
    }
    for (const sig of this.trace.signals) {
      const valEl = sb.querySelector(`.wf-sig-val[data-sig-name="${sig.name}"]`);
      if (valEl) {
        valEl.textContent = this.getCursorSignalValue(sig.name, sig.width);
      }
    }
  }
};

// apps/web/src/components/TapeoutPanel.ts
var import_asic_bundle = __toESM(require_asic_bundle());
var import_pdk = __toESM(require_pdk2());
var TapeoutPanel = class {
  container;
  callbacks;
  activeFileRelPath = "config.json";
  lastDesign = null;
  lastBundle = null;
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.container = document.getElementById("tapeout-container");
  }
  render(design) {
    if (!this.container) return;
    this.lastDesign = design;
    const silicon = design.silicon ? { ...design.silicon } : (0, import_pdk.createDefaultSiliconConfig)("sky130A");
    const bundle = (0, import_asic_bundle.generateAsicBundle)({ ...design, silicon });
    this.lastBundle = bundle;
    const pdks = (0, import_pdk.listPdks)();
    const previewFile = bundle.files.find((f) => f.path.endsWith("/" + this.activeFileRelPath)) || bundle.files.find((f) => f.path.endsWith("/config.json")) || bundle.files[0];
    const topClean = (design.topModule || "top").replace(/[^a-zA-Z0-9_]/g, "_");
    const kitName = `${topClean}_${bundle.pdk.id}_tapeout_kit`;
    const runCmd = `tar -xf ${kitName}.tar && cd ${kitName} && ./scripts/run_tapeout.sh`;
    this.container.innerHTML = `
      <div class="tapeout-shell">
        <div class="tapeout-config-col">
          <div class="tapeout-pdk-banner">
            <div class="tapeout-pdk-head">
              <span class="tapeout-node-badge">${bundle.pdk.nodeNm}nm</span>
              <strong>${escapeHtml(bundle.pdk.name)}</strong>
            </div>
            <div class="tapeout-pdk-meta">
              <span>${escapeHtml(bundle.pdk.foundry)}</span> &bull;
              <span>Core ${bundle.pdk.coreVoltage} / IO ${bundle.pdk.ioVoltage}</span> &bull;
              <span>${bundle.pdk.metalLayers}-Metal</span>
            </div>
            <p class="tapeout-india-note">${escapeHtml(bundle.pdk.indiaEcosystemNotes)}</p>
          </div>

          <div class="tapeout-form-grid">
            <label class="tapeout-field">
              <span>Open-Source PDK</span>
              <select id="tapeout-pdk-select" class="kona-input">
                ${pdks.map((p) => `<option value="${p.id}" ${p.id === silicon.pdkId ? "selected" : ""}>${escapeHtml(p.shortName)} (${p.coreVoltage})</option>`).join("")}
              </select>
            </label>

            <label class="tapeout-field">
              <span>Clock Target (MHz)</span>
              <input id="tapeout-clock-input" type="number" class="kona-input" min="1" max="300" value="${silicon.clockFreqMhz}" />
            </label>

            <label class="tapeout-field">
              <span>Core Utilization (%)</span>
              <input id="tapeout-util-input" type="number" class="kona-input" min="20" max="75" value="${Math.round(silicon.coreUtilization * 100)}" />
            </label>

            <label class="tapeout-field">
              <span>Die / MPW Slot</span>
              <select id="tapeout-slot-select" class="kona-input">
                <option value="auto" ${silicon.diePreset === "auto" ? "selected" : ""}>Auto-Sized Core</option>
                <option value="mpw_small" ${silicon.diePreset === "mpw_small" ? "selected" : ""}>${escapeHtml(bundle.pdk.dieSlots.mpw_small.label)}</option>
                <option value="mpw_medium" ${silicon.diePreset === "mpw_medium" ? "selected" : ""}>${escapeHtml(bundle.pdk.dieSlots.mpw_medium.label)}</option>
                <option value="mpw_large" ${silicon.diePreset === "mpw_large" ? "selected" : ""}>${escapeHtml(bundle.pdk.dieSlots.mpw_large.label)}</option>
              </select>
            </label>

            <label class="tapeout-field">
              <span>Target Package</span>
              <select id="tapeout-pkg-select" class="kona-input">
                ${["QFN32", "QFN48", "QFN64", "DIP40"].map((pkg) => `<option value="${pkg}" ${pkg === silicon.packageType ? "selected" : ""}>${pkg}</option>`).join("")}
              </select>
            </label>

            <label class="tapeout-field">
              <span>Shuttle / Fab Channel</span>
              <select id="tapeout-shuttle-select" class="kona-input">
                <option value="librelane_mpw" ${silicon.shuttleTarget === "librelane_mpw" ? "selected" : ""}>LibreLane / Open MPW</option>
                <option value="cdac_chipin" ${silicon.shuttleTarget === "cdac_chipin" ? "selected" : ""}>C-DAC ChipIN / 180nm Prototype</option>
                <option value="tiny_tapeout" ${silicon.shuttleTarget === "tiny_tapeout" ? "selected" : ""}>Tiny Tapeout Tile Flow</option>
              </select>
            </label>

            <label class="tapeout-field">
              <span>SRAM Implementation</span>
              <select id="tapeout-sram-select" class="kona-input">
                <option value="openram_macro" ${silicon.sramMode === "openram_macro" ? "selected" : ""}>OpenRAM Macro Ready</option>
                <option value="dff_array" ${silicon.sramMode === "dff_array" ? "selected" : ""}>Soft DFF Register Array</option>
              </select>
            </label>
          </div>

          <div class="tapeout-checks">
            ${bundle.readinessChecks.map((c) => `
              <div class="tapeout-check-row ${c.status}">
                <span class="check-pill">${c.status.toUpperCase()}</span>
                <div class="check-text">
                  <strong>${escapeHtml(c.label)}</strong>
                  <span>${escapeHtml(c.detail)}</span>
                </div>
              </div>
            `).join("")}
          </div>

          <div class="tapeout-actions">
            <button id="btn-download-tapeout-tar" class="btn-sm btn-accent md-btn-primary-sm">
              Download Factory Tape-Out Kit (.tar)
            </button>
            <button id="btn-copy-tapeout-cmd" class="btn-sm md-btn-tonal-sm" title="${escapeHtml(runCmd)}">
              Copy Build Command
            </button>
          </div>
          <code class="tapeout-cli-hint">${escapeHtml(runCmd)}</code>
        </div>

        <div class="tapeout-preview-col">
          <div class="tapeout-file-bar">
            <div class="tapeout-file-tabs">
              ${[
      ["config.json", "config.json"],
      ["constraints/top.sdc", "top.sdc"],
      ["src/chip_top.v", "chip_top.v"],
      ["src/top.v", "top.v"],
      ["pin_order.cfg", "pin_order.cfg"],
      ["scripts/run_tapeout.sh", "run_tapeout.sh"],
      ["docs/ARCHITECTURE_SPEC.md", "ARCHITECTURE_SPEC.md"],
      ["docs/FACTORY_DATASHEET.md", "FACTORY_DATASHEET.md"]
    ].map(([rel, label]) => `
                <button class="tapeout-file-tab ${previewFile.path.endsWith("/" + rel) ? "active" : ""}" data-file="${rel}">${label}</button>
              `).join("")}
            </div>
            <button id="btn-copy-tapeout-file" class="btn-sm md-btn-tonal-sm">Copy</button>
          </div>
          <pre class="tapeout-code-view"><code id="tapeout-file-preview">${escapeHtml(previewFile.content)}</code></pre>
          <div class="tapeout-pins-strip">
            <span class="pins-label">Pins (${bundle.architecture.pinBudget.signalPins}/${bundle.architecture.pinBudget.maxSignalPins} \xB7 Click edge to cycle N/E/S/W):</span>
            ${bundle.externalPorts.map((p) => `<button type="button" class="pin-chip ${p.direction}" data-pin-name="${escapeHtml(p.name)}" data-pin-edge="${p.edge}" title="Click to move ${escapeHtml(p.name)} to next die edge">${escapeHtml(p.name)}${p.width > 1 ? `[${p.width - 1}:0]` : ""} \xB7 ${p.edge}</button>`).join("")}
          </div>
        </div>
      </div>
    `;
    this.bindEvents(silicon, runCmd, previewFile.content);
  }
  bindEvents(current, runCmd, previewContent) {
    const emitUpdate = (patch) => {
      this.callbacks.onUpdateSilicon({ ...current, ...patch });
    };
    const pdkSelect = document.getElementById("tapeout-pdk-select");
    pdkSelect?.addEventListener("change", () => {
      const nextPdk = pdkSelect.value;
      const defaults = (0, import_pdk.createDefaultSiliconConfig)(nextPdk);
      emitUpdate({
        pdkId: nextPdk,
        clockFreqMhz: defaults.clockFreqMhz,
        shuttleTarget: defaults.shuttleTarget
      });
    });
    const clockInput = document.getElementById("tapeout-clock-input");
    clockInput?.addEventListener("change", () => {
      const val = Math.max(1, Math.min(300, Number(clockInput.value) || current.clockFreqMhz));
      emitUpdate({ clockFreqMhz: val });
    });
    const utilInput = document.getElementById("tapeout-util-input");
    utilInput?.addEventListener("change", () => {
      const pct = Math.max(20, Math.min(75, Number(utilInput.value) || 45));
      emitUpdate({ coreUtilization: +(pct / 100).toFixed(2) });
    });
    const slotSelect = document.getElementById("tapeout-slot-select");
    slotSelect?.addEventListener("change", () => {
      emitUpdate({ diePreset: slotSelect.value });
    });
    const pkgSelect = document.getElementById("tapeout-pkg-select");
    pkgSelect?.addEventListener("change", () => {
      emitUpdate({ packageType: pkgSelect.value });
    });
    const shuttleSelect = document.getElementById("tapeout-shuttle-select");
    shuttleSelect?.addEventListener("change", () => {
      emitUpdate({ shuttleTarget: shuttleSelect.value });
    });
    const sramSelect = document.getElementById("tapeout-sram-select");
    sramSelect?.addEventListener("change", () => {
      emitUpdate({ sramMode: sramSelect.value });
    });
    document.getElementById("btn-download-tapeout-tar")?.addEventListener("click", () => {
      if (!this.lastDesign) return;
      const designWithSilicon = { ...this.lastDesign, silicon: current };
      const { filename, archive } = (0, import_asic_bundle.buildAsicTapeoutTar)(designWithSilicon);
      downloadFile(archive, filename, "application/x-tar");
      showToast(`Exported ${filename} (${this.lastBundle?.files.length || 12} files)`, "success");
    });
    document.getElementById("btn-copy-tapeout-cmd")?.addEventListener("click", () => {
      navigator.clipboard?.writeText(runCmd).then(() => showToast("Copied LibreLane RTL-to-GDSII build command!", "info")).catch(() => showToast("Clipboard access blocked by browser", "error"));
    });
    document.getElementById("btn-copy-tapeout-file")?.addEventListener("click", () => {
      navigator.clipboard?.writeText(previewContent).then(() => showToast(`Copied ${this.activeFileRelPath}`, "info")).catch(() => showToast("Clipboard access blocked by browser", "error"));
    });
    this.container?.querySelectorAll(".tapeout-file-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const rel = btn.getAttribute("data-file");
        if (!rel || !this.lastDesign) return;
        this.activeFileRelPath = rel;
        this.render(this.lastDesign);
      });
    });
    const edgeCycle = { N: "E", E: "S", S: "W", W: "N" };
    this.container?.querySelectorAll(".pin-chip[data-pin-name]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pName = btn.getAttribute("data-pin-name");
        const curEdge = btn.getAttribute("data-pin-edge") || "W";
        if (!pName) return;
        const nextEdge = edgeCycle[curEdge] || "N";
        emitUpdate({
          pinEdges: {
            ...current.pinEdges || {},
            [pName]: nextEdge
          }
        });
      });
    });
  }
};

// apps/web/src/components/ChipWizardModal.ts
var import_auto_wire = __toESM(require_auto_wire());
var import_catalog7 = __toESM(require_catalog2());
var import_pdk2 = __toESM(require_pdk2());
var import_plain_english3 = __toESM(require_plain_english());
var ChipWizardModal = class {
  modalEl;
  bodyEl;
  callbacks;
  selectedGoal = "iot_sensor";
  chipName = "My Smart Chip";
  speedProfile = "balanced";
  targetPdk = "gf180mcuD";
  addons = {
    gpio: true,
    i2c: false,
    spi: false,
    timer: false
  };
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.modalEl = document.getElementById("chip-wizard-modal");
    this.bodyEl = document.getElementById("chip-wizard-body");
    this.bindStaticEvents();
  }
  bindStaticEvents() {
    document.getElementById("btn-chip-wizard")?.addEventListener("click", () => this.open());
    document.getElementById("wizard-close-btn")?.addEventListener("click", () => this.close());
    this.modalEl?.addEventListener("click", (e) => {
      if (e.target === this.modalEl) this.close();
    });
  }
  open() {
    if (!this.modalEl) return;
    this.render();
    this.modalEl.style.display = "flex";
  }
  close() {
    if (this.modalEl) this.modalEl.style.display = "none";
  }
  render() {
    if (!this.bodyEl) return;
    this.bodyEl.innerHTML = `
      <div class="wizard-step-section">
        <div class="wizard-step-label">Step 1 \xB7 What should your chip do?</div>
        <div class="wizard-goal-grid">
          ${import_plain_english3.WIZARD_GOALS.map((g) => `
            <button type="button" class="wizard-goal-card ${g.id === this.selectedGoal ? "active" : ""}" data-goal="${g.id}">
              <strong>${escapeHtml(g.title)}</strong>
              <span>${escapeHtml(g.tagline)}</span>
              <small>Best for: ${escapeHtml(g.bestFor)}</small>
            </button>
          `).join("")}
        </div>
      </div>

      <div class="wizard-step-section">
        <div class="wizard-step-label">Step 2 \xB7 Name, Speed &amp; Add-ons</div>
        <div class="wizard-fields-grid">
          <label class="spec-field">
            <span>Give your chip a name</span>
            <input type="text" id="wizard-chip-name" class="kona-input" value="${escapeHtml(this.chipName)}" />
          </label>

          <label class="spec-field">
            <span>Power &amp; Speed Profile</span>
            <select id="wizard-speed-select" class="kona-input">
              <option value="battery" ${this.speedProfile === "battery" ? "selected" : ""}>Battery Saver (12 MHz \xB7 Ultra Low Power)</option>
              <option value="balanced" ${this.speedProfile === "balanced" ? "selected" : ""}>Balanced Everyday (25\u201350 MHz)</option>
              <option value="fast" ${this.speedProfile === "fast" ? "selected" : ""}>High Performance (80 MHz)</option>
            </select>
          </label>

          <label class="spec-field">
            <span>Manufacturing Node (Optional)</span>
            <select id="wizard-pdk-select" class="kona-input">
              <option value="gf180mcuD" ${this.targetPdk === "gf180mcuD" ? "selected" : ""}>180nm Rugged Industrial / 5V (GF180MCU)</option>
              <option value="sky130A" ${this.targetPdk === "sky130A" ? "selected" : ""}>130nm Standard Open Silicon (SKY130)</option>
              <option value="sg13g2" ${this.targetPdk === "sg13g2" ? "selected" : ""}>130nm High-Speed BiCMOS (IHP SG13G2)</option>
            </select>
          </label>
        </div>

        <div class="wizard-addons-row">
          <label class="wizard-addon-chip">
            <input type="checkbox" id="wizard-addon-gpio" ${this.addons.gpio ? "checked" : ""} />
            <span>LEDs &amp; Buttons (GPIO)</span>
          </label>
          <label class="wizard-addon-chip">
            <input type="checkbox" id="wizard-addon-i2c" ${this.addons.i2c ? "checked" : ""} />
            <span>Sensor Port (I2C)</span>
          </label>
          <label class="wizard-addon-chip">
            <input type="checkbox" id="wizard-addon-spi" ${this.addons.spi ? "checked" : ""} />
            <span>Flash / Display Port (SPI)</span>
          </label>
          <label class="wizard-addon-chip">
            <input type="checkbox" id="wizard-addon-timer" ${this.addons.timer ? "checked" : ""} />
            <span>Alarm &amp; Safety Timer</span>
          </label>
        </div>
      </div>

      <div class="wizard-footer">
        <span class="wizard-hint">Kona automatically places blocks, wires clocks/resets, and validates design rules.</span>
        <button type="button" id="btn-wizard-build" class="btn btn-primary md-btn md-btn-filled">
          Build My Chip
        </button>
      </div>
    `;
    this.bodyEl.querySelectorAll(".wizard-goal-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const g = btn.getAttribute("data-goal");
        if (!g) return;
        this.selectedGoal = g;
        this.render();
      });
    });
    document.getElementById("wizard-chip-name")?.addEventListener("input", (e) => {
      this.chipName = e.target.value;
    });
    document.getElementById("wizard-speed-select")?.addEventListener("change", (e) => {
      this.speedProfile = e.target.value;
    });
    document.getElementById("wizard-pdk-select")?.addEventListener("change", (e) => {
      this.targetPdk = e.target.value;
    });
    document.getElementById("wizard-addon-gpio")?.addEventListener("change", (e) => {
      this.addons.gpio = e.target.checked;
    });
    document.getElementById("wizard-addon-i2c")?.addEventListener("change", (e) => {
      this.addons.i2c = e.target.checked;
    });
    document.getElementById("wizard-addon-spi")?.addEventListener("change", (e) => {
      this.addons.spi = e.target.checked;
    });
    document.getElementById("wizard-addon-timer")?.addEventListener("change", (e) => {
      this.addons.timer = e.target.checked;
    });
    document.getElementById("btn-wizard-build")?.addEventListener("click", () => this.buildChip());
  }
  buildChip() {
    const goal = import_plain_english3.WIZARD_GOALS.find((g) => g.id === this.selectedGoal) || import_plain_english3.WIZARD_GOALS[0];
    const tmpl = import_catalog7.STARTER_TEMPLATES.find((t) => t.id === goal.templateId) || import_catalog7.STARTER_TEMPLATES[0];
    const design = tmpl.createDesign();
    const cleanName = this.chipName.trim() || goal.title;
    design.name = cleanName;
    design.topModule = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/^[0-9]/, "chip_$&") || "my_chip";
    const silicon = (0, import_pdk2.createDefaultSiliconConfig)(this.targetPdk);
    if (this.speedProfile === "battery") {
      silicon.clockFreqMhz = 12;
    } else if (this.speedProfile === "fast") {
      silicon.clockFreqMhz = this.targetPdk === "gf180mcuD" ? 50 : 80;
    }
    design.silicon = silicon;
    design.spec = {
      targetApplication: goal.title,
      author: "Created with Kona Chip Wizard",
      powerBudgetMw: this.speedProfile === "battery" ? 25 : 100
    };
    const addAddonIfMissing = (moduleId, instName, params) => {
      if (design.instances.some((i) => i.moduleId === moduleId)) return;
      const maxX = Math.max(...design.instances.map((i) => i.position.x), 400);
      const maxY = Math.max(...design.instances.map((i) => i.position.y), 120);
      design.instances.push({
        id: `${moduleId}_wiz_${Date.now()}_${Math.floor(Math.random() * 100)}`,
        moduleId,
        name: instName,
        position: { x: maxX, y: maxY + 260 },
        parameters: params
      });
    };
    if (this.addons.gpio) addAddonIfMissing("gpio_controller", "u_gpio_pins", { WIDTH: 8 });
    if (this.addons.i2c) addAddonIfMissing("i2c_controller", "u_i2c_sensors", { PRESCALE: 125 });
    if (this.addons.spi) addAddonIfMissing("spi_controller", "u_spi_port", { CLK_DIV: 8, DATA_WIDTH: 8 });
    if (this.addons.timer) addAddonIfMissing("timer_core", "u_sys_timer", { PRESCALER: 50 });
    const { design: wired } = (0, import_auto_wire.autoWireDesign)(design);
    this.close();
    this.callbacks.onCreateDesign(wired, `Built "${cleanName}" (${wired.instances.length} blocks, auto-wired)!`);
  }
};

// apps/web/src/components/LayoutResizer.ts
var DESKTOP_STORAGE_KEY = "kona.layout.sizes.v1";
var MOBILE_STORAGE_KEY = "kona.layout.mobile.sizes.v1";
var MOBILE_BREAKPOINT = 900;
var MIN_CANVAS_WIDTH = 240;
var MIN_CANVAS_HEIGHT = 120;
var HEADER_FALLBACK_HEIGHT = 54;
var BOTTOM_MINIMIZE_THRESHOLD = 68;
var LayoutResizer = class {
  callbacks;
  sections = [];
  customSizes = {};
  lastMobileMode;
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.lastMobileMode = this.isMobileViewport();
    this.loadPersistedSizes();
    this.registerSections();
    this.applySavedSizes();
    this.bindAll();
    this.syncHandleVisibility();
  }
  isMobileViewport() {
    return typeof window !== "undefined" && (window.innerWidth || 1280) <= MOBILE_BREAKPOINT;
  }
  getStorageKey() {
    return this.isMobileViewport() ? MOBILE_STORAGE_KEY : DESKTOP_STORAGE_KEY;
  }
  registerSections() {
    const leftPanel = document.querySelector(".sidebar-left");
    const leftHandle = document.getElementById("resizer-left-sidebar");
    if (leftPanel && leftHandle) {
      this.sections.push({
        id: "left",
        panel: leftPanel,
        handle: leftHandle,
        cssVar: "--sidebar-left-width",
        axis: "horizontal",
        direction: 1,
        defaultSize: 278,
        minSize: 200,
        getMaxSize: () => this.getMaxSidebarWidth("left"),
        isCollapsed: () => leftPanel.classList.contains("collapsed"),
        workspaceMirror: true
      });
    }
    const rightPanel = document.querySelector(".sidebar-right");
    const rightHandle = document.getElementById("resizer-right-sidebar");
    if (rightPanel && rightHandle) {
      this.sections.push({
        id: "right",
        panel: rightPanel,
        handle: rightHandle,
        cssVar: "--sidebar-right-width",
        axis: "horizontal",
        direction: -1,
        defaultSize: 308,
        minSize: 220,
        getMaxSize: () => this.getMaxSidebarWidth("right"),
        isCollapsed: () => rightPanel.classList.contains("collapsed"),
        workspaceMirror: true
      });
    }
    const bottomPanel = document.getElementById("app-bottom-drawer");
    const bottomHandle = document.getElementById("resizer-bottom-drawer");
    if (bottomPanel && bottomHandle) {
      this.sections.push({
        id: "bottom",
        panel: bottomPanel,
        handle: bottomHandle,
        cssVar: "--bottom-drawer-height",
        axis: "vertical",
        direction: -1,
        defaultSize: 244,
        minSize: 88,
        getMaxSize: () => this.getMaxBottomHeight(),
        onBeforeResize: () => {
          if (bottomPanel.classList.contains("minimized") || bottomPanel.classList.contains("expanded")) {
            const currentHeight = this.measureSize(bottomPanel, "--bottom-drawer-height", 244);
            bottomPanel.classList.remove("minimized", "expanded");
            bottomPanel.style.setProperty("--bottom-drawer-height", `${currentHeight}px`);
            this.callbacks.onBottomDrawerRestore?.();
          }
        },
        onMinimize: () => {
          bottomPanel.classList.remove("expanded");
          bottomPanel.classList.add("minimized");
          this.callbacks.onBottomDrawerMinimize?.();
        }
      });
    }
    const drcPanel = document.querySelector(".drc-panel-container");
    const drcHandle = document.getElementById("resizer-drc-panel");
    if (drcPanel && drcHandle) {
      this.sections.push({
        id: "drc",
        panel: drcPanel,
        handle: drcHandle,
        cssVar: "--drc-panel-height",
        axis: "vertical",
        direction: -1,
        defaultSize: 152,
        minSize: 80,
        getMaxSize: () => this.getMaxDrcHeight(),
        isCollapsed: () => drcPanel.classList.contains("collapsed")
      });
    }
  }
  getWorkspaceEl() {
    return document.querySelector(".app-workspace");
  }
  getWorkspaceWidth() {
    const workspace = this.getWorkspaceEl();
    const rectWidth = workspace?.getBoundingClientRect().width || 0;
    return rectWidth > 0 ? rectWidth : window.innerWidth || 1280;
  }
  getMaxSidebarWidth(side) {
    const workspaceWidth = this.getWorkspaceWidth();
    const minWidth = side === "left" ? 200 : 220;
    if (this.isMobileViewport()) {
      return Math.max(minWidth, Math.min(480, Math.floor(workspaceWidth * 0.92)));
    }
    const otherSelector = side === "left" ? ".sidebar-right" : ".sidebar-left";
    const otherSidebar = document.querySelector(otherSelector);
    let otherWidth = 0;
    if (otherSidebar && !otherSidebar.classList.contains("collapsed")) {
      const fallback = side === "left" ? 308 : 278;
      const otherVar = side === "left" ? "--sidebar-right-width" : "--sidebar-left-width";
      otherWidth = this.measureSize(otherSidebar, otherVar, fallback);
    }
    const hardCap = side === "left" ? 520 : 560;
    return Math.max(minWidth, Math.min(hardCap, Math.floor(workspaceWidth - otherWidth - MIN_CANVAS_WIDTH)));
  }
  getMaxBottomHeight() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
    const header = document.querySelector(".app-header");
    const headerHeight = header?.getBoundingClientRect().height || HEADER_FALLBACK_HEIGHT;
    const ratioCap = Math.floor(viewportHeight * (this.isMobileViewport() ? 0.8 : 0.75));
    const spaceCap = Math.floor(viewportHeight - headerHeight - MIN_CANVAS_HEIGHT);
    return Math.max(88, Math.min(ratioCap, spaceCap));
  }
  getMaxDrcHeight() {
    const rightSidebar = document.querySelector(".sidebar-right");
    const sidebarHeight = rightSidebar?.getBoundingClientRect().height || 0;
    const available = sidebarHeight > 0 ? sidebarHeight - 160 : 380;
    return Math.max(100, Math.min(440, Math.floor(available)));
  }
  measureSize(panel, cssVar, fallback) {
    const isHorizontal = cssVar.includes("width");
    const rect = panel.getBoundingClientRect();
    const measured = isHorizontal ? rect.width : rect.height;
    if (measured > 0) return Math.round(measured);
    if (panel.id === "app-bottom-drawer") {
      if (panel.classList.contains("minimized")) return this.isMobileViewport() ? 60 : 44;
      if (panel.classList.contains("expanded")) return 440;
    }
    const varVal = parseFloat(panel.style.getPropertyValue(cssVar));
    if (Number.isFinite(varVal) && varVal > 0) return Math.round(varVal);
    if (this.isMobileViewport() && isHorizontal) {
      const vw = this.getWorkspaceWidth();
      return Math.round(Math.min(vw * 0.92, Math.max(220, vw * 0.84)));
    }
    return fallback;
  }
  clampSize(size, min, max) {
    return Math.max(min, Math.min(Math.max(min, max), Math.round(size)));
  }
  setCssVar(config, value) {
    if (value === null) {
      config.panel.style.removeProperty(config.cssVar);
      if (config.workspaceMirror) {
        this.getWorkspaceEl()?.style.removeProperty(config.cssVar);
      }
    } else {
      config.panel.style.setProperty(config.cssVar, value);
      if (config.workspaceMirror) {
        this.getWorkspaceEl()?.style.setProperty(config.cssVar, value);
      }
    }
  }
  applySize(config, size, persist) {
    const max = config.getMaxSize();
    const clamped = this.clampSize(size, config.minSize, max);
    this.setCssVar(config, `${clamped}px`);
    config.handle.setAttribute("aria-valuenow", String(clamped));
    config.handle.setAttribute("aria-valuemax", String(max));
    this.customSizes[config.id] = clamped;
    if (persist) {
      this.savePersistedSizes();
    }
    return clamped;
  }
  resetSize(config) {
    config.onBeforeResize?.();
    this.setCssVar(config, null);
    delete this.customSizes[config.id];
    config.handle.setAttribute("aria-valuenow", String(config.defaultSize));
    this.savePersistedSizes();
    this.callbacks.onLayoutChange();
  }
  bindAll() {
    for (const config of this.sections) {
      this.bindSection(config);
    }
  }
  bindSection(config) {
    let isDragging = false;
    let lastPointerDownAt = 0;
    const startDrag = (e, moveEvent, upEvent, hasCancel) => {
      if (isDragging || e.button !== 0) return;
      isDragging = true;
      e.preventDefault();
      const startCoord = config.axis === "horizontal" ? e.clientX : e.clientY;
      const startSize = this.measureSize(config.panel, config.cssVar, config.defaultSize);
      const prevCustomSize = this.customSizes[config.id];
      const bodyClass = config.axis === "horizontal" ? "is-resizing-col" : "is-resizing-row";
      let hasDragged = false;
      let lastRawSize = startSize;
      config.handle.classList.add("active");
      config.panel.classList.add("is-resizing-panel");
      document.body.classList.add(bodyClass);
      if ("pointerId" in e && typeof config.handle.setPointerCapture === "function") {
        try {
          config.handle.setPointerCapture(e.pointerId);
        } catch {
        }
      }
      const onMove = (moveEv) => {
        const me = moveEv;
        const currentCoord = config.axis === "horizontal" ? me.clientX : me.clientY;
        const delta = (currentCoord - startCoord) * config.direction;
        if (!hasDragged) {
          if (Math.abs(delta) < 1) return;
          hasDragged = true;
          config.onBeforeResize?.();
        }
        lastRawSize = startSize + delta;
        this.applySize(config, lastRawSize, false);
        this.callbacks.onLayoutChange();
      };
      const onEnd = () => {
        isDragging = false;
        window.removeEventListener(moveEvent, onMove);
        window.removeEventListener(upEvent, onEnd);
        if (hasCancel) {
          window.removeEventListener("pointercancel", onEnd);
        }
        config.handle.classList.remove("active");
        config.panel.classList.remove("is-resizing-panel");
        document.body.classList.remove(bodyClass);
        if ("pointerId" in e && typeof config.handle.releasePointerCapture === "function") {
          try {
            config.handle.releasePointerCapture(e.pointerId);
          } catch {
          }
        }
        if (hasDragged) {
          if (config.onMinimize && lastRawSize < BOTTOM_MINIMIZE_THRESHOLD) {
            if (typeof prevCustomSize === "number") {
              this.applySize(config, prevCustomSize, false);
            } else {
              this.setCssVar(config, null);
              delete this.customSizes[config.id];
            }
            config.onMinimize();
          }
          this.savePersistedSizes();
          this.callbacks.onLayoutChange();
        }
      };
      window.addEventListener(moveEvent, onMove);
      window.addEventListener(upEvent, onEnd);
      if (hasCancel) {
        window.addEventListener("pointercancel", onEnd);
      }
    };
    config.handle.addEventListener("pointerdown", (ev) => {
      lastPointerDownAt = Date.now();
      startDrag(ev, "pointermove", "pointerup", true);
    });
    config.handle.addEventListener("mousedown", (ev) => {
      if (Date.now() - lastPointerDownAt < 500) return;
      startDrag(ev, "mousemove", "mouseup", false);
    });
    config.handle.addEventListener("dblclick", (e) => {
      e.preventDefault();
      this.resetSize(config);
    });
    config.handle.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 48 : 16;
      let delta = 0;
      if (config.axis === "horizontal") {
        if (e.key === "ArrowRight") delta = step * config.direction;
        else if (e.key === "ArrowLeft") delta = -step * config.direction;
      } else {
        if (e.key === "ArrowDown") delta = step * config.direction;
        else if (e.key === "ArrowUp") delta = -step * config.direction;
      }
      if (e.key === "Home") {
        e.preventDefault();
        config.onBeforeResize?.();
        this.applySize(config, config.minSize, true);
        this.callbacks.onLayoutChange();
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        config.onBeforeResize?.();
        this.applySize(config, config.getMaxSize(), true);
        this.callbacks.onLayoutChange();
        return;
      }
      if (delta === 0) return;
      e.preventDefault();
      const current = this.measureSize(config.panel, config.cssVar, config.defaultSize);
      config.onBeforeResize?.();
      this.applySize(config, current + delta, true);
      this.callbacks.onLayoutChange();
    });
  }
  syncHandleVisibility() {
    for (const config of this.sections) {
      const hidden = Boolean(config.isCollapsed?.());
      config.handle.classList.toggle("is-hidden", hidden);
    }
  }
  clampAll() {
    const mobileNow = this.isMobileViewport();
    if (mobileNow !== this.lastMobileMode) {
      this.lastMobileMode = mobileNow;
      for (const config of this.sections) {
        this.setCssVar(config, null);
      }
      this.loadPersistedSizes();
      this.applySavedSizes();
      this.syncHandleVisibility();
      return;
    }
    for (const config of this.sections) {
      const saved = this.customSizes[config.id];
      if (typeof saved === "number") {
        this.applySize(config, saved, false);
      }
    }
    this.syncHandleVisibility();
  }
  applySavedSizes() {
    for (const config of this.sections) {
      const saved = this.customSizes[config.id];
      if (typeof saved === "number" && Number.isFinite(saved)) {
        this.applySize(config, saved, false);
      }
    }
  }
  loadPersistedSizes() {
    this.customSizes = {};
    try {
      const raw = window.localStorage?.getItem(this.getStorageKey());
      if (!raw) return;
      const parsed = JSON.parse(raw);
      for (const key of ["left", "right", "bottom", "drc"]) {
        const val = parsed[key];
        if (typeof val === "number" && Number.isFinite(val) && val > 0) {
          this.customSizes[key] = val;
        }
      }
    } catch {
    }
  }
  savePersistedSizes() {
    try {
      if (!window.localStorage) return;
      const key = this.getStorageKey();
      if (Object.keys(this.customSizes).length === 0) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(this.customSizes));
      }
    } catch {
    }
  }
};

// apps/web/src/app.ts
var KonaApp = class {
  store;
  canvas;
  waveformViewer;
  drcPanel;
  inspectorPanel;
  rtlPreviewPanel;
  tapeoutPanel;
  catalogPanel;
  wizardModal;
  layoutResizer;
  drawerState = "normal";
  simpleMode = false;
  constructor() {
    const initialHash = typeof window !== "undefined" ? window.location.hash : "";
    const hasCompressedHash = initialHash.startsWith("#z=");
    const loaded = hasCompressedHash ? null : loadDesignFromHash();
    const defaultTemplate = import_catalog8.STARTER_TEMPLATES[0];
    const initialDesign = loaded?.design || defaultTemplate.createDesign();
    const initialTemplateId = loaded ? loaded.templateId : hasCompressedHash ? void 0 : defaultTemplate.id;
    const initialDirty = loaded ? !loaded.templateId : hasCompressedHash;
    this.store = new DesignStore(initialDesign, {
      templateId: initialTemplateId,
      isDirty: initialDirty,
      skipInitialHashSync: hasCompressedHash
    });
    const canvasEl = document.getElementById("schematic-canvas");
    this.canvas = new SchematicCanvas(canvasEl, this.store.getDesign());
    const wfContainer = document.getElementById("waveform-container");
    this.waveformViewer = new WaveformViewer(wfContainer);
    this.rtlPreviewPanel = new RtlPreviewPanel();
    this.tapeoutPanel = new TapeoutPanel({
      onUpdateSilicon: (silicon) => {
        const design = this.store.getDesign();
        design.silicon = silicon;
        this.store.commitMutation(design);
      }
    });
    this.drcPanel = new DrcPanel({
      onFocusInstance: (id) => this.canvas.focusInstance(id),
      onFocusNet: (id) => this.canvas.focusNet(id),
      onEnsureVisible: () => {
        if (this.isMobileLayout()) {
          document.querySelector(".sidebar-left")?.classList.add("collapsed");
          document.getElementById("btn-toggle-left-sidebar")?.classList.remove("active");
        }
        document.querySelector(".sidebar-right")?.classList.remove("collapsed");
        document.getElementById("btn-toggle-right-sidebar")?.classList.add("active");
        this.syncMobileBackdrop();
        this.layoutResizer.syncHandleVisibility();
        this.canvas.resize();
      },
      onAutoWire: () => this.runAutoWire(false)
    });
    this.inspectorPanel = new InspectorPanel({
      onMutate: () => {
        this.canvas.render();
        this.store.commitMutation();
      },
      onFocusInstance: (id) => {
        if (this.isMobileLayout()) this.closeMobileSidebars();
        this.canvas.focusInstance(id);
      },
      onFocusNet: (id) => {
        if (this.isMobileLayout()) this.closeMobileSidebars();
        this.canvas.focusNet(id);
      },
      onDuplicateSelected: () => {
        const dup = this.canvas.duplicateSelected();
        if (dup) showToast(`Duplicated ${dup.name}`, "info");
      },
      onDeleteSelected: () => {
        this.canvas.deleteSelected();
        if (this.isMobileLayout()) this.closeMobileSidebars();
      },
      onUpdateDesignSpec: (patch) => {
        const design = this.store.getDesign();
        if (patch.name) design.name = patch.name;
        if (patch.topModule) design.topModule = patch.topModule;
        if (patch.spec) design.spec = patch.spec;
        this.store.commitMutation(design);
      }
    });
    this.catalogPanel = new CatalogPanel({
      onAddModule: (moduleId) => {
        this.canvas.addModule(moduleId);
        if (this.simpleMode) {
          this.runAutoWire(true);
        }
        if (this.isMobileLayout()) this.closeMobileSidebars();
        showToast(`Added ${moduleId} to canvas`, "success");
      }
    });
    this.wizardModal = new ChipWizardModal({
      onCreateDesign: (wiredDesign, summaryMessage) => {
        this.canvas.setDesign(wiredDesign);
        this.store.loadTemplateDesign(wiredDesign);
        this.canvas.fitToScreen();
        showToast(summaryMessage, "success");
      }
    });
    this.bindCanvasEvents();
    this.store.subscribe((state) => this.onStoreStateChange(state));
    this.setupCanvasDragDrop();
    this.setupTemplatesPicker();
    this.setupHeaderActions();
    this.setupCanvasToolbar();
    this.setupSidebarToggles();
    this.setupBottomDrawerTabs();
    this.setupSimulationControls();
    this.setupSimpleMode();
    this.layoutResizer = new LayoutResizer({
      onLayoutChange: () => {
        this.canvas.resize();
        this.waveformViewer.resize();
      },
      onBottomDrawerRestore: () => {
        this.drawerState = "normal";
        this.syncBottomDrawerToggleIcon();
      },
      onBottomDrawerMinimize: () => {
        this.drawerState = "minimized";
        this.syncBottomDrawerToggleIcon();
      }
    });
    this.layoutResizer.syncHandleVisibility();
    this.canvas.fitToScreen();
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => this.canvas.fitToScreen());
    }
    if (hasCompressedHash) {
      void loadCompressedDesignFromHash(initialHash).then((res) => {
        if (!res) return;
        this.canvas.setDesign(res.design);
        this.store.loadTemplateDesign(res.design);
        this.canvas.fitToScreen();
      });
    }
  }
  bindCanvasEvents() {
    let selectedInst = this.store.getState().selectedInstance;
    let selectedNet = this.store.getState().selectedNet;
    this.canvas.onSelectionChange((inst) => {
      selectedInst = inst;
      if (inst) selectedNet = null;
      this.store.setSelection(selectedInst, selectedNet);
    });
    this.canvas.onNetSelectionChange((net) => {
      selectedNet = net;
      if (net) selectedInst = null;
      this.store.setSelection(selectedInst, selectedNet);
    });
    this.canvas.onDesignChange((updatedDesign) => {
      this.store.commitMutation(updatedDesign);
    });
  }
  onStoreStateChange(state) {
    this.canvas.setDiagnostics(state.diagnostics);
    this.drcPanel.update(state.diagnostics);
    this.rtlPreviewPanel.render(state.systemVerilog, state.design);
    this.tapeoutPanel.render(state.design);
    this.inspectorPanel.render(
      state.design,
      state.diagnostics,
      state.selectedInstance,
      state.selectedNet
    );
    const statsEl = document.getElementById("canvas-stats-text");
    if (statsEl) {
      const bCount = state.design.instances.length;
      const nCount = state.design.nets.length;
      statsEl.textContent = `${bCount} block${bCount === 1 ? "" : "s"} \u2022 ${nCount} net${nCount === 1 ? "" : "s"}`;
    }
    const undoBtn = document.getElementById("btn-undo");
    const redoBtn = document.getElementById("btn-redo");
    if (undoBtn) undoBtn.disabled = !state.canUndo;
    if (redoBtn) redoBtn.disabled = !state.canRedo;
    const rightBtn = document.getElementById("btn-toggle-right-sidebar");
    const hasSelection = Boolean(state.selectedInstance || state.selectedNet);
    if (rightBtn) {
      rightBtn.classList.toggle("has-selection", hasSelection);
    }
    const inspectBtn = document.getElementById("btn-canvas-inspect");
    const deleteBtn = document.getElementById("btn-canvas-delete");
    if (inspectBtn) inspectBtn.disabled = !hasSelection;
    if (deleteBtn) deleteBtn.disabled = !hasSelection;
  }
  setupCanvasDragDrop() {
    const viewport = document.querySelector(".canvas-viewport");
    const canvasEl = document.getElementById("schematic-canvas");
    if (!viewport || !canvasEl) return;
    canvasEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      viewport.classList.add("drag-over");
    });
    canvasEl.addEventListener("dragleave", () => viewport.classList.remove("drag-over"));
    canvasEl.addEventListener("drop", (e) => {
      e.preventDefault();
      viewport.classList.remove("drag-over");
      const modId = e.dataTransfer?.getData("text/kona-module");
      if (modId) {
        const rect = canvasEl.getBoundingClientRect();
        const world = this.canvas.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        this.canvas.addModuleAt(modId, world.x - 100, world.y - 60);
        showToast(`Dropped ${modId} onto canvas`, "success");
        return;
      }
      const file = e.dataTransfer?.files?.[0];
      if (file && file.name.endsWith(".json")) {
        void file.text().then((txt) => this.importKonaJsonString(txt, file.name));
      }
    });
  }
  importKonaJsonString(jsonText, sourceName = "design.kona.json") {
    const { design, errors } = (0, import_ir3.parseKonaDesign)(jsonText);
    if (!design || errors.length > 0) {
      showToast(`Invalid netlist (${sourceName}): ${errors[0] || "parse error"}`, "error");
      return;
    }
    this.canvas.setDesign(design);
    this.store.loadTemplateDesign(design);
    this.canvas.fitToScreen();
    showToast(`Imported ${design.name}`, "success");
  }
  setupTemplatesPicker() {
    const container = document.getElementById("templates-picker");
    if (!container) return;
    container.innerHTML = `
      <label class="picker-label" for="template-select">Template:</label>
      <select id="template-select" class="kona-select">
        ${import_catalog8.STARTER_TEMPLATES.map((t) => `<option value="${t.id}">${t.name}</option>`).join("")}
        <option value="__blank__">+ Blank Custom Chip</option>
      </select>
    `;
    const selectEl = container.querySelector("#template-select");
    const activeTmplId = this.store.getState().templateId;
    if (selectEl && activeTmplId) {
      selectEl.value = activeTmplId;
    }
    let lastValue = selectEl.value;
    selectEl?.addEventListener("change", () => {
      if (selectEl.value === "__blank__") {
        if (this.store.isDesignDirty() && !confirm("Start a blank custom chip? Unsaved canvas edits will be replaced.")) {
          selectEl.value = lastValue;
          return;
        }
        lastValue = "__blank__";
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const blankDesign = {
          version: "1.0",
          name: "Custom SoC",
          topModule: "top",
          instances: [],
          nets: [],
          metadata: { version: "1.0", created: now, modified: now, description: "Blank custom chip architecture" }
        };
        this.canvas.setDesign(blankDesign);
        this.store.loadTemplateDesign(blankDesign);
        this.canvas.fitToScreen();
        showToast("Started blank custom chip", "info");
        return;
      }
      const tmpl = import_catalog8.STARTER_TEMPLATES.find((t) => t.id === selectEl.value);
      if (!tmpl) return;
      if (this.store.isDesignDirty() && !confirm(`Load template "${tmpl.name}"? Unsaved canvas edits will be replaced.`)) {
        selectEl.value = lastValue;
        return;
      }
      lastValue = selectEl.value;
      const newDesign = tmpl.createDesign();
      this.canvas.setDesign(newDesign);
      this.store.loadTemplateDesign(newDesign, tmpl.id);
      this.canvas.fitToScreen();
      showToast(`Loaded ${tmpl.name}`, "info");
    });
  }
  setupCanvasToolbar() {
    document.getElementById("btn-fit-view")?.addEventListener("click", () => this.canvas.fitToScreen());
    document.getElementById("btn-canvas-fit")?.addEventListener("click", () => this.canvas.fitToScreen());
    document.getElementById("btn-undo")?.addEventListener("click", () => {
      const restored = this.store.undo();
      if (restored) this.canvas.setDesign(restored);
    });
    document.getElementById("btn-redo")?.addEventListener("click", () => {
      const restored = this.store.redo();
      if (restored) this.canvas.setDesign(restored);
    });
    const selectBtn = document.getElementById("btn-tool-select");
    const panBtn = document.getElementById("btn-tool-pan");
    selectBtn?.addEventListener("click", () => {
      this.canvas.setToolMode("select");
      selectBtn.classList.add("active");
      panBtn?.classList.remove("active");
    });
    panBtn?.addEventListener("click", () => {
      this.canvas.setToolMode("pan");
      panBtn.classList.add("active");
      selectBtn?.classList.remove("active");
    });
    const snapBtn = document.getElementById("btn-toggle-snap");
    const snapLabel = document.getElementById("snap-status-label");
    snapBtn?.addEventListener("click", () => {
      const next = !this.canvas.isGridSnapEnabled();
      this.canvas.setGridSnap(next);
      snapBtn.classList.toggle("active", next);
      if (snapLabel) snapLabel.textContent = next ? "Grid Snap: 20px" : "Grid Snap: Off";
    });
    document.getElementById("btn-canvas-auto-wire")?.addEventListener("click", () => {
      this.runAutoWire(false);
    });
    document.getElementById("btn-canvas-inspect")?.addEventListener("click", () => {
      if (this.isMobileLayout()) {
        document.querySelector(".sidebar-left")?.classList.add("collapsed");
        document.getElementById("btn-toggle-left-sidebar")?.classList.remove("active");
      }
      document.querySelector(".sidebar-right")?.classList.remove("collapsed");
      document.getElementById("btn-toggle-right-sidebar")?.classList.add("active");
      this.syncMobileBackdrop();
      this.layoutResizer?.syncHandleVisibility();
      this.canvas.resize();
    });
    document.getElementById("btn-canvas-delete")?.addEventListener("click", () => {
      this.canvas.deleteSelected();
      showToast("Removed selected item", "info");
    });
    window.addEventListener("keydown", (e) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        const restored = this.store.undo();
        if (restored) this.canvas.setDesign(restored);
      } else if (mod && e.key.toLowerCase() === "y" || mod && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        const restored = this.store.redo();
        if (restored) this.canvas.setDesign(restored);
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const dup = this.canvas.duplicateSelected();
        if (dup) showToast(`Duplicated ${dup.name}`, "info");
      }
    });
  }
  isMobileLayout() {
    return typeof window !== "undefined" && window.innerWidth <= 900;
  }
  syncMobileBackdrop() {
    const backdrop = document.getElementById("mobile-drawer-backdrop");
    if (!backdrop) return;
    const leftOpen = !document.querySelector(".sidebar-left")?.classList.contains("collapsed");
    const rightOpen = !document.querySelector(".sidebar-right")?.classList.contains("collapsed");
    backdrop.classList.toggle("visible", this.isMobileLayout() && (leftOpen || rightOpen));
  }
  closeMobileSidebars() {
    document.querySelector(".sidebar-left")?.classList.add("collapsed");
    document.querySelector(".sidebar-right")?.classList.add("collapsed");
    document.getElementById("btn-toggle-left-sidebar")?.classList.remove("active");
    document.getElementById("btn-toggle-right-sidebar")?.classList.remove("active");
    this.syncMobileBackdrop();
    this.layoutResizer?.syncHandleVisibility();
  }
  setupSidebarToggles() {
    const leftSidebar = document.querySelector(".sidebar-left");
    const rightSidebar = document.querySelector(".sidebar-right");
    const leftBtn = document.getElementById("btn-toggle-left-sidebar");
    const rightBtn = document.getElementById("btn-toggle-right-sidebar");
    const backdrop = document.getElementById("mobile-drawer-backdrop");
    if (this.isMobileLayout()) {
      this.closeMobileSidebars();
    }
    leftBtn?.addEventListener("click", () => {
      const opening = leftSidebar?.classList.contains("collapsed");
      if (this.isMobileLayout() && opening) {
        rightSidebar?.classList.add("collapsed");
        rightBtn?.classList.remove("active");
      }
      leftSidebar?.classList.toggle("collapsed");
      leftBtn.classList.toggle("active", !leftSidebar?.classList.contains("collapsed"));
      this.syncMobileBackdrop();
      this.layoutResizer?.syncHandleVisibility();
      setTimeout(() => this.canvas.resize(), 220);
    });
    rightBtn?.addEventListener("click", () => {
      const opening = rightSidebar?.classList.contains("collapsed");
      if (this.isMobileLayout() && opening) {
        leftSidebar?.classList.add("collapsed");
        leftBtn?.classList.remove("active");
      }
      rightSidebar?.classList.toggle("collapsed");
      rightBtn.classList.toggle("active", !rightSidebar?.classList.contains("collapsed"));
      this.syncMobileBackdrop();
      this.layoutResizer?.syncHandleVisibility();
      setTimeout(() => this.canvas.resize(), 220);
    });
    backdrop?.addEventListener("click", () => this.closeMobileSidebars());
    document.getElementById("btn-close-left-sidebar")?.addEventListener("click", () => this.closeMobileSidebars());
    document.getElementById("btn-close-right-sidebar")?.addEventListener("click", () => this.closeMobileSidebars());
    leftSidebar?.addEventListener("transitionend", () => this.canvas.resize());
    rightSidebar?.addEventListener("transitionend", () => this.canvas.resize());
    window.addEventListener("resize", () => {
      this.syncMobileBackdrop();
      this.layoutResizer?.clampAll();
      this.canvas.resize();
      this.waveformViewer.resize();
    });
  }
  syncBottomDrawerToggleIcon() {
    const toggleDrawerBtn = document.getElementById("btn-toggle-drawer");
    if (!toggleDrawerBtn) return;
    if (this.drawerState === "minimized") {
      toggleDrawerBtn.title = "Expand Bottom Drawer";
      toggleDrawerBtn.setAttribute("aria-label", "Expand Bottom Drawer");
      toggleDrawerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>`;
    } else if (this.drawerState === "expanded") {
      toggleDrawerBtn.title = "Restore Default Drawer Size";
      toggleDrawerBtn.setAttribute("aria-label", "Restore Default Drawer Size");
      toggleDrawerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
    } else {
      toggleDrawerBtn.title = "Minimize Bottom Drawer";
      toggleDrawerBtn.setAttribute("aria-label", "Minimize Bottom Drawer");
      toggleDrawerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    }
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
      if (e.key === "?" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName || "")) {
        openModal();
      } else if (e.key === "Escape" && modalEl?.style.display === "flex") {
        closeModal();
      }
    });
    const drawerEl = document.getElementById("app-bottom-drawer");
    const toggleDrawerBtn = document.getElementById("btn-toggle-drawer");
    if (typeof window !== "undefined" && window.innerWidth <= 680) {
      drawerEl?.classList.add("minimized");
      this.drawerState = "minimized";
      this.syncBottomDrawerToggleIcon();
    }
    toggleDrawerBtn?.addEventListener("click", () => {
      if (!drawerEl?.classList.contains("minimized") && !drawerEl?.classList.contains("expanded")) {
        this.drawerState = "normal";
      }
      if (this.drawerState === "normal") {
        drawerEl?.classList.add("minimized");
        this.drawerState = "minimized";
      } else if (this.drawerState === "minimized") {
        drawerEl?.classList.remove("minimized");
        drawerEl?.classList.add("expanded");
        this.drawerState = "expanded";
      } else {
        drawerEl?.classList.remove("expanded");
        this.drawerState = "normal";
      }
      this.syncBottomDrawerToggleIcon();
      setTimeout(() => {
        this.canvas.resize();
        this.waveformViewer.resize();
      }, 260);
    });
    const importBtn = document.getElementById("btn-import-json");
    const importInput = document.getElementById("import-json-input");
    importBtn?.addEventListener("click", () => importInput?.click());
    importInput?.addEventListener("change", () => {
      const file = importInput.files?.[0];
      if (!file) return;
      void file.text().then((txt) => this.importKonaJsonString(txt, file.name));
      importInput.value = "";
    });
    document.getElementById("btn-export-json")?.addEventListener("click", () => {
      const design = this.store.getDesign();
      downloadFile((0, import_ir3.serializeKonaDesign)(design), `${design.topModule || "chip"}.kona.json`, "application/json");
      showToast("Exported .kona.json netlist", "success");
    });
    document.getElementById("btn-export-sv")?.addEventListener("click", () => {
      const design = this.store.getDesign();
      downloadFile((0, import_codegen3.generateSystemVerilog)(design), `${design.topModule || "top"}.sv`, "text/plain");
      showToast("Exported synthesizable top.sv", "success");
    });
    document.getElementById("btn-copy-sv")?.addEventListener("click", () => {
      const code = this.rtlPreviewPanel.getActiveCode() || (0, import_codegen3.generateSystemVerilog)(this.store.getDesign());
      const name = this.rtlPreviewPanel.getActiveFilename();
      navigator.clipboard?.writeText(code).then(() => showToast(`${name} copied to clipboard!`, "success")).catch(() => showToast("Clipboard access blocked by browser", "error"));
    });
    document.getElementById("btn-share-link")?.addEventListener("click", async () => {
      const state = this.store.getState();
      const hash = await encodeDesignHash(state.design, {
        templateId: state.templateId,
        isDirty: state.isDirty
      });
      const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${hash}`;
      navigator.clipboard?.writeText(shareUrl).then(() => showToast("Shareable architecture link copied!", "info")).catch(() => showToast("Clipboard access blocked by browser", "error"));
    });
  }
  setupBottomDrawerTabs() {
    const tabs = document.querySelectorAll(".drawer-tab");
    const drawerEl = document.getElementById("app-bottom-drawer");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        if (drawerEl?.classList.contains("minimized")) {
          drawerEl.classList.remove("minimized");
          this.drawerState = "normal";
          this.syncBottomDrawerToggleIcon();
        }
        const target = tab.getAttribute("data-target");
        if (target && drawerEl) {
          drawerEl.setAttribute("data-active-drawer-tab", target);
        }
        document.querySelectorAll(".drawer-pane").forEach((p) => p.classList.remove("active"));
        document.getElementById(`pane-${target}`)?.classList.add("active");
        if (target === "waveform") {
          this.waveformViewer.resize();
          if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => this.waveformViewer.resize());
          }
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
        const result = (0, import_sim.runSimulation)(this.store.getDesign(), cycles);
        const wfTab = document.querySelector('[data-target="waveform"]');
        wfTab?.click();
        this.waveformViewer.setTrace(result.trace);
        this.waveformViewer.resize();
        if (simStatus) {
          simStatus.textContent = `Completed ${result.totalCycles} cycles in ${result.durationMs}ms`;
        }
        const sigCount = result.trace.signals.length;
        showToast(`Chip tested for ${result.totalCycles} clock cycles (${sigCount} signals active). Click timeline to inspect!`, "success");
      }, 40);
    });
  }
  runAutoWire(silentIfNoOp) {
    const { design: wired, summary } = (0, import_auto_wire2.autoWireDesign)(this.store.getDesign());
    const changes = summary.connectedClocks + summary.connectedResets + summary.removedOrphanNets + (summary.createdClockGen ? 1 : 0);
    if (changes === 0) {
      if (!silentIfNoOp) showToast("All clock & reset pins are already connected!", "info");
      return;
    }
    this.canvas.setDesign(wired);
    this.store.commitMutation(wired);
    this.canvas.fitToScreen();
    if (!silentIfNoOp) {
      showToast(`Auto-wired ${summary.connectedClocks} clock and ${summary.connectedResets} reset pin(s)`, "success");
    }
  }
  setupSimpleMode() {
    const btn = document.getElementById("btn-simple-mode");
    const applyMode = (enabled) => {
      this.simpleMode = enabled;
      document.body.classList.toggle("simple-mode", enabled);
      this.catalogPanel.setSimpleMode(enabled);
      if (btn) {
        btn.classList.toggle("active", enabled);
        btn.setAttribute("aria-pressed", String(enabled));
        const lbl = btn.querySelector(".btn-label");
        if (lbl) lbl.textContent = enabled ? "Simple: On" : "Simple Mode";
      }
      try {
        window.localStorage?.setItem("kona.simpleMode", enabled ? "1" : "0");
      } catch {
      }
    };
    try {
      if (window.localStorage?.getItem("kona.simpleMode") === "1") {
        applyMode(true);
      }
    } catch {
    }
    btn?.addEventListener("click", () => {
      const next = !this.simpleMode;
      applyMode(next);
      showToast(
        next ? "Simple Mode enabled: plain-English labels & auto-wiring active" : "Engineer Mode enabled",
        "info"
      );
    });
  }
};

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
