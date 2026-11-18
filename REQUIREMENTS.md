# Software Requirements Specification (SRS) v3.0

**Product:** Kona  
**Category:** Electronic Design Automation (EDA) — RTL verification, formal
checking, and waveform debugging  
**Architecture:** Local-first hybrid (browser WebAssembly, native Tauri desktop,
and CLI)  
**Target ecosystem:** Indian fabless semiconductor startups (180nm–28nm),
MeitY Chips to Startup labs, and RISC-V developers

## 1. Purpose and strategic positioning

### 1.1 Problem statement

Commercial verification suites cost more than ₹50L per seat annually. Open-source
tools such as Verilator, Yosys, Icarus Verilog, and GTKWave require fragmented
Tcl/Makefile workflows, provide weak cross-probing and SystemVerilog UVM
ergonomics, and often lose waveform layouts. Browser-only environments impose
memory limits and can expose proprietary RTL to third-party clouds. Verilator's
2-state model also misses X/Z behavior relevant to silicon bugs.

### 1.2 Product vision

Kona is a zero-setup RTL verification and debugging cockpit inspired by Figma,
Synopsys Verdi, and VS Code:

- Browser onboarding runs locally through WebAssembly with no cloud simulation
  compute and no required IP upload.
- Tauri desktop and the `vayu` CLI provide native filesystems, Git,
  multi-core simulation, Python/PyUVM regressions, and CI integration.
- A shared React/TypeScript presentation layer provides Monaco RTL editing,
  Surfer waveform debugging, and trace-grounded AI assistance.

## 2. System architecture and runtime modes

The presentation layer communicates with a unified `IComputeEngine` abstraction
implemented by three targets:

| Target | Responsibilities |
| --- | --- |
| Web WASM | OPFS virtual filesystem, YoWASP/Yosys, Verilator-WASM, Surfer WASM; designs below roughly 50k gates |
| Tauri desktop | Native filesystem/Git, multi-core Verilator, Icarus 4-state simulation, SymbiYosys, Cocotb/PyUVM |
| Headless CLI/MCP | `kona test`, JSON output, CI execution, VS Code synchronization, and AI-agent tools |

## 3. Functional requirements

### 3.1 Workspace, interoperability, and build configuration

- **FR-01:** Define a human-readable `kona.yaml` containing
  `project_name`, `top_module`, `rtl_files`, `include_dirs`, `sim_mode`
  (`fast_2state`, `accurate_4state`, or `formal`), `testbench`, and
  `waveform_signals`.
- **FR-02:** Desktop mode must watch standard local folders with filesystem
  notifications so VS Code, Neovim, and Emacs edits trigger recompilation and
  waveform refresh without proprietary filesystem lock-in.
- **FR-03:** Projects created in the GUI must execute identically through
  `kona run`, `kona lint`, and `kona prove` in GitHub Actions and GitLab CI.
- **FR-04:** Provide an embedded MCP server and structured JSON CLI output so
  Claude Code, GitHub Copilot, and other agents can run simulations, inspect
  assertions, and read traces programmatically.
- **FR-05:** Generate `vayu.lock` with exact Yosys, Verilator, Icarus, and
  SymbiYosys versions for reproducible Web, Desktop, and CI runs.

### 3.2 Multi-engine simulation and formal verification

- **FR-06:** Support both fast 2-state Verilator simulation and accurate
  4-state (0, 1, X, Z) Icarus Verilog simulation.
- **FR-07:** Provide zero-configuration Cocotb and PyUVM execution on Desktop,
  with lightweight Pyodide unit tests on Web where supported.
- **FR-08:** Integrate SymbiYosys (`sby`) for one-click bounded proof of
  SystemVerilog assertions, producing a counterexample `.vcd` when a proof
  fails.
- **FR-09:** Monitor WebAssembly heap usage and design size. When a design
  exceeds roughly 50,000 gates or 2GB RAM, offer a one-click Desktop handoff
  that preserves workspace state.

### 3.3 Waveform cockpit and protocol debugging

- **FR-10:** Use Surfer to reload waveforms after source/testbench changes while
  preserving zoom, cursor, grouping, and radix settings in
  `.vayu/wave_session.json`.
- **FR-11:** Support bidirectional RTL/waveform cross-probing: waveform
  transitions locate driving RTL assignments, and RTL signal hovers show the
  active cursor value.
- **FR-12:** Provide transaction decoders and assertion checkers for AXI4,
  AXI4-Lite, APB, Wishbone, SPI, I2C, and UART, including human-readable
  timeline entries such as `WRITE 0x4000_0010 [OKAY]`.
- **FR-13:** Parse Verilator line, toggle, and branch coverage into green/red
  editor gutter highlights and exportable HTML/JSON summaries.

### 3.4 Trace-grounded AI verification copilot

- **FR-14:** On an assertion or PyUVM scoreboard failure at timestamp `T`, extract
  the local RTL AST slice and trace window `[T - 15 cycles, T + 2 cycles]`.
  Explanations must cite exact signal transitions and clock timestamps and must
  not fabricate unverified timing claims.
- **FR-15:** Generate Cocotb/PyUVM drivers and monitors plus SVA boilerplate from
  module ports and natural-language interface specifications.
- **FR-16:** Support local Ollama inference and BYOK API routing so enterprise
  and defense users can keep proprietary RTL off external services.

## 4. Non-functional requirements

| Category | Target |
| --- | --- |
| Web performance | YoWASP lint feedback under 500ms; under 4 seconds for compile and wave render of unit designs below 20k gates |
| Desktop performance | Native multi-core Verilator; smooth 60 FPS navigation for FST files up to 5GB |
| Installer | Tauri binary below 30MB, with modular toolchain bundles |
| Security | Fully offline-capable; no mandatory upload of RTL, testbenches, or waveforms |
| Platforms | Chrome, Edge, Firefox with SharedArrayBuffer; Ubuntu/RHEL, Windows 10/11, macOS Intel/Apple Silicon |
| Hosting | Static CDN architecture with ₹0 cloud simulation compute per active user |

## 5. Recommended technology stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Monaco, custom
  SystemVerilog/SVA language support, and Surfer Rust-to-WASM.
- **Desktop/CLI:** Tauri v2, Rust native IPC/file watching/process management,
  and a standalone Rust or Go `vayu` binary sharing the runner core.
- **EDA core:** Yosys/YoWASP, Verilator, Icarus Verilog, SymbiYosys with Z3 or
  Yices, Python 3, Cocotb, and PyUVM.
- **Agent layer:** MCP in Rust or Go, local Ollama (Qwen2.5-Coder or
  DeepSeek-Coder), and optional OpenAI/Anthropic BYOK endpoints.

## 6. Phased delivery and grant milestone plan

| Phase | Timeline | Key deliverables | Milestone |
| --- | --- | --- | --- |
| 1. Core runner and Web MVP | Weeks 1–6 | `kona.yaml`, `IComputeEngine`, Monaco/YoWASP linting, Verilator-WASM, Surfer WASM | Public Web Beta and StartInUP demo |
| 2. Native Desktop and dual simulation | Weeks 7–12 | Tauri v2, native Verilator/Icarus toggle, persistent sessions, VS Code sync | v0.5 pilot in 2–3 C2S labs |
| 3. PyUVM, formal, and protocols | Weeks 13–16 | Cocotb/PyUVM, SymbiYosys, AXI4-Lite/APB/SPI/UART decoders | v1.0 and fabless-user validation |
| 4. Trace-grounded AI and MCP | Weeks 17–20 | Trace debugger, SVA/PyUVM generation, Ollama mode, MCP | Pro tier and ISM DLI DPR |

## 7. Constraints and out of scope for v1.0

Backend physical place and route, foundry-certified sub-28nm signoff STA/DRC,
and decryption of proprietary encrypted vendor IP (`.vp` or IEEE 1735 blocks
encrypted with Synopsys/Cadence keys) are out of scope. Kona must detect
encrypted blocks and notify users clearly.
