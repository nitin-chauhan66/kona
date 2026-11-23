# Kona — Visual Chip Design & Verification Platform

Browser-native, collaborative chip design platform that combines the template-driven accessibility of Canva with the real-time multiplayer engineering precision of Figma.

Visually assemble digital architectures, validate buses & Design Rules (DRC) in real time, simulate locally via WebAssembly, and export deterministic, production-ready SystemVerilog (`top.sv`).

---

## Core Capabilities (MVP Phase 1)

- **Infinite 2D Schematic Canvas**: 60 FPS pan, zoom, grid snap, multi-select, and orthogonal auto-routing with color-coded ports (Inputs, Outputs, Inouts, Clocks, Resets).
- **Real-Time Bus & DRC Validation**: Single-bit and multi-bit buses (`[31:0]`), live bit-width mismatch detection, multi-driver conflict checks, and unconnected clock/reset warnings.
- **Starter IP & Template Library**: Parameterized open-source blocks:
  - PicoRV32 / Ibex RISC-V cores
  - AXI-Lite / Wishbone interconnect crossbars
  - Peripherals: UART, SPI, I2C, GPIO
  - Infrastructure: Synchronous FIFO, Clock Divider, Dual-port Block RAM
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
