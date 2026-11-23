# Kona — Visual Chip Design & Verification Platform

Browser-native, collaborative chip design platform that combines the template-driven accessibility of Canva with the real-time multiplayer engineering precision of Figma.

Visually assemble digital architectures, validate buses & Design Rules (DRC) in real time, simulate locally via WebAssembly, and export deterministic, production-ready SystemVerilog (`top.sv`).

---

## Core Capabilities (MVP Phase 1)

- **Infinite 2D Schematic Canvas**: 60 FPS pan, zoom, grid snap, multi-select, and orthogonal auto-routing with color-coded ports (Inputs, Outputs, Inouts, Clocks, Resets).
- **Real-Time Bus & DRC Validation**: Single-bit and multi-bit buses (`[31:0]`), live bit-width mismatch detection, multi-driver conflict checks, and unconnected clock/reset warnings.
- **Starter IP & Template Library**: Parameterized open-source blocks & real-world architectures:
  - **Prebuilt Open-Source Systems**:
    - **OpenTitan Silicon Root-of-Trust (Google / lowRISC)**: Ibex RV32IMC core, AXI-Lite crossbar, secure SRAM, 32-bit hardware timer, and UART.
    - **PULPissimo Edge AI & IoT SoC (ETH Zürich / UniBo)**: Taped-out silicon RISC-V SoC with AXI-Lite crossbar, multi-bank SRAM, SPI master, and I2C sensor bus.
    - **LiteX Wishbone SoC (Fomu / Betrusted)**: FPGA SoC standard with Wishbone B4 interconnect, Block RAM, SPI Flash controller, and LiteUART.
    - **TinyFPGA BX Industrial Sensor Hub**: FPGA telemetry pipeline with clock divider, I2C sensor controller, synchronous FIFO queue, GPIO pads, and UART downlink.
    - **PicoRV32 Microcontroller Starter**: RV32IMC core with AXI crossbar, dual-port RAM, and UART.
    - **UART + FIFO Loopback Processor**: Real-time UART RX/TX with synchronous FIFO queue and GPIO status indicators.
  - **IP Blocks**: PicoRV32 & Ibex cores, AXI-Lite & Wishbone crossbars, Dual-Port SRAM, UART, SPI, I2C, GPIO, 32-bit Timer/Watchdog, Synchronous FIFO, Clock Divider, Clock/Reset Generator.
- **Deterministic RTL Generator**: Byte-for-byte deterministic IEEE 1800 SystemVerilog (`top.sv`) without proprietary black-box wrappers.
- **Live Split-Screen RTL Preview**: Real-time syntax-highlighted code editor with copy and project export (.zip / .kona.json).
- **Local Wasm Simulation & Waveform Viewer**: In-browser client-side Verilog simulation with integrated interactive VCD waveform viewer (pan, zoom, radices, cursor).
- **Shareable Links**: URL-encoded state for instant sharing of interactive schematics and simulation runs.

---

## Project Structure

```
kona/
├── packages/
│   └── core/                 # Shared domain logic
│       ├── src/
│       │   ├── ir.ts         # .kona.json Intermediate Representation schema & validators
│       │   ├── catalog.ts    # Starter IP catalog & parameter definitions
│       │   ├── drc.ts        # Real-time Design Rule Checking engine
│       │   ├── codegen.ts    # Deterministic SystemVerilog (top.sv) generator
│       │   ├── sim.ts        # In-browser Verilog simulator & event engine
│       │   ├── vcd.ts        # VCD waveform parser & signal tracer
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   └── web/                  # Visual Canvas & Cockpit UI
│       ├── src/
│       │   ├── canvas.ts     # 2D schematic canvas & orthogonal router
│       │   ├── app.ts        # Main UI orchestrator, state manager & panels
│       │   ├── waveform.ts   # Interactive VCD signal visualizer
│       │   └── index.ts
│       ├── public/
│       │   ├── index.html    # Canva-meets-Figma chip designer UI
│       │   └── styles.css    # Clean modern dark theme
│       ├── build.mjs         # Fast esbuild bundle pipeline
│       └── package.json
├── tests/                    # Comprehensive unit and integration test suite
│   ├── ir.test.mjs
│   ├── drc.test.mjs
│   ├── codegen.test.mjs
│   └── sim.test.mjs
├── package.json
├── tsconfig.json
└── REQUIREMENTS.md           # Product Requirements Document
```

---

## Quickstart

```bash
# Install dependencies
npm install

# Build core and web application
npm run build

# Start local development server
npm run dev
# Visit http://127.0.0.1:4173

# Run test suite
npm test
```
