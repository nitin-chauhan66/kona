# Kona MVP Task Plan (Phase 1)

This board tracks the Phase 1 Minimum Viable Product for the **Kona Visual Chip Design & Verification Platform** as defined in [REQUIREMENTS.md](REQUIREMENTS.md).

## Status Legend

- **Ready** — specified and ready to execute
- **In progress** — active implementation
- **Done** — fully implemented and verified with tests

## Phase 1 Feature Matrix

| ID | Task | Status | Requirement | Description |
| --- | --- | --- | --- | --- |
| FR-1.1 | Infinite 2D Schematic Canvas | Done | FR-1.1 | Pan, zoom, grid snap, multi-select, undo/redo, orthogonal wire routing, port pins |
| FR-1.2 | Real-Time Bus & DRC Validator | Done | FR-1.2 | Bit-width checking, multi-driver detection, unconnected clock/reset warnings |
| FR-1.3 | Starter IP & Template Library | Done | FR-1.3 | RISC-V cores, AXI/Wishbone, UART, SPI, I2C, GPIO, FIFO, ClkDiv, RAM with live parameter inspector |
| FR-1.4 | Deterministic RTL Generator & Preview | Done | FR-1.4 | Live `top.sv` generator, split-screen code view, one-click copy, and file export |
| FR-1.5 | Wasm Simulation & Waveform Viewer | Done | FR-1.5 | In-browser simulation execution and integrated VCD timeline viewer with radix selection |
| FR-1.6 | Shareable Links & Project Persistence | Done | FR-1.6 | URL-encoded design sharing (`kona.dev/p/...` / hash state) and `.kona.json` import/export |

---

## Detailed Task Breakdown

### FR-1.1: Schematic Canvas & Routing
- Infinite 2D pan/zoom viewport with high-DPI canvas rendering.
- Grid snapping (10px / 20px) and multi-block drag selection.
- Orthogonal Manhattan wire auto-router connecting output ports to input ports.
- Color-coded port pins: Clocks (purple), Resets (amber), Inputs (cyan), Outputs (green), Inouts (yellow), Buses (bold).

### FR-1.2: Real-Time DRC Engine
- Live validation of all net connections.
- Bit-width matching (e.g. `[31:0]` bus to `[31:0]` port; warn on mismatches like 32-bit to 8-bit).
- Multi-driver conflict detection (multiple outputs driving the same net without tri-state).
- Floating clock/reset pin diagnostics.

### FR-1.3: Parameterized IP Library
- Curated IP block definitions:
  - `picorv32`: RISC-V RV32IMC core (parameters: `ENABLE_COUNTERS`, `ENABLE_MUL`, `ENABLE_DIV`)
  - `axi_crossbar`: 1-to-2 or 1-to-4 AXI4-Lite interconnect
  - `uart_core`: 8-N-1 UART transceiver (baud divisor parameter)
  - `gpio_controller`: Configurable width GPIO controller (default 8/16/32-bit)
  - `sync_fifo`: Parameterized depth and width FIFO
  - `clock_divider`: Configurable integer clock divider
  - `ram_dual_port`: Parameterized address and data width SRAM
- Parameter inspector allowing on-the-fly reconfiguration of selected blocks.

### FR-1.4: Deterministic RTL Generator
- Netlist AST to clean, readable SystemVerilog (`top.sv`).
- Explicit parameter overrides, wire declarations, and instance port bindings.
- Zero proprietary wrappers; byte-for-byte deterministic output sorted by instance ID.
- Split-screen live preview code editor with copy and download.

### FR-1.5: In-Browser Simulation & Waveform Viewer
- Interactive simulation runner generating VCD traces directly in the browser.
- Interactive timeline viewer with signal hierarchy, zoom, cursor tracking, and Hex/Bin/Dec radix switching.

### FR-1.6: Shareable Links & Netlist Storage
- Standard `.kona.json` netlist format.
- Compressed URL hash export/import for one-click sharing.
