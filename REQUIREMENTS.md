
Product Requirements Document: Kona

Product Name: Kona — Visual Chip Design & Verification Platform
Version: 1.0
Status: Final

1. Executive Summary

Kona is a browser-native, collaborative chip design platform that combines the template-driven accessibility of Canva with the real-time multiplayer engineering precision of Figma. It enables hardware engineers, startups, and students to visually assemble digital architectures, simulate them locally via WebAssembly, and export deterministic, production-ready SystemVerilog.

Core Product Principles

• Deterministic RTL Output: Every visual action generates clean, human-readable, lint-free SystemVerilog (top.sv) without proprietary black-box wrappers.
• Local-First Browser Architecture: Zero-setup web access powered by WebAssembly (Wasm) for instant linting and simulation, paired with an optional native CLI bridge (kona-cli) for heavy workloads.
• Git & AI Native: Designs are stored as structured, diff-friendly JSON/YAML netlists (.kona.json) with built-in Model Context Protocol (MCP) support for seamless integration with VS Code, GitHub Copilot, and Claude Code.

2. Problem Statement & Target Users


Industry Bottlenecks

• Legacy UX: Desktop Electronic Design Automation (EDA) tools suffer from outdated interfaces, steep learning curves, and heavy Linux setup overhead.
• Manual Wiring Boilerplate: Connecting Intellectual Property (IP) blocks (AXI/Wishbone buses, clocks, resets) requires thousands of lines of error-prone SystemVerilog port mapping.
• Broken Collaboration: Monolithic or binary project files prevent clean Git branching, visual pull request diffs, and multiplayer editing.
• Prohibitive Cost: Six-figure annual commercial EDA seat licenses block startups, independent creators, and students.

Target Personas

1. Hardware Startups & SoC Architects: Rapidly assemble RISC-V or custom accelerator SoCs using pre-verified IP blocks without massive license costs.
2. Senior RTL & Verification Engineers: Leverage bidirectional code-to-canvas sync, visual Git diffs, fast waveform debugging, and AI agent integration.
3. FPGA Developers: Prototype peripherals (UART, SPI, I2C, GPIO) in seconds without launching multi-gigabyte vendor IDEs.
4. Students & Open-Source Silicon Creators: Build and verify designs in the browser with zero local toolchain installation.

3. System Architecture

• Schematic Canvas: Hardware-accelerated WebGL / HTML5 2D canvas supporting 60 FPS pan/zoom, orthogonal wire auto-routing, and hierarchical sub-modules.
• Intermediate Representation (IR): Deterministic .kona.json / .kona.yaml netlist schema designed for clean Git version control.
• Compiler & Parser Engine (Rust → Wasm):
	• Canvas → RTL: Deterministic IEEE 1800 SystemVerilog generator.
	• RTL → Canvas: SystemVerilog AST parser enabling two-way code/canvas synchronization.
• In-Browser Verification Runner: Wasm-compiled Verilator and Yosys for client-side linting, synthesis checks, and VCD waveform generation.
• MCP Server Interface: Exposes netlist state, Design Rule Check (DRC) diagnostics, and simulation logs to external AI coding assistants.

4. Phased Product Requirements


Phase 1: Minimum Viable Product (MVP)

Goal: Validate browser-based visual SoC assembly, live SystemVerilog generation, and zero-setup Wasm simulation.
• FR-1.1 Infinite 2D Schematic Canvas: Pan, zoom, grid snapping, multi-select, undo/redo, and orthogonal auto-routing with color-coded module ports (Inputs, Outputs, Inouts, Clocks, Resets).
• FR-1.2 Real-Time Bus & DRC Validation: Support single-bit nets and multi-bit buses (e.g., data[31:0]). Flag bit-width mismatches, multi-driver conflicts, and unconnected clock/reset pins in real time.
• FR-1.3 Starter IP & Template Library: Curated, parameterized open-source blocks (PicoRV32/Ibex RISC-V cores, AXI-Lite/Wishbone interconnects, UART, SPI, I2C, GPIO, Sync FIFO, Clock Divider, Block RAM) with a live parameter inspector.
• FR-1.4 Live Split-Screen RTL Preview: Real-time, syntax-highlighted top.sv code pane with one-click copy and .zip project export.
• FR-1.5 Local Wasm Simulation & Waveform Viewer: In-browser linting/synthesis via Yosys/Verilator Wasm and an integrated VCD waveform viewer (zoom, search, Hex/Bin/Dec radix, time cursors).
• FR-1.6 Shareable Links: Read-only public URLs (kona.dev/p/...) for sharing interactive schematics and simulation runs.

Phase 2: Collaborative Team Platform (V1.0)

Goal: Enable multi-engineer hardware teams with real-time multiplayer, Git workflows, and bidirectional RTL sync.
• FR-2.1 Real-Time Multiplayer & Review: CRDT-backed simultaneous editing with live user cursors, presence avatars, and contextual pin comments attached to wires, ports, or modules.
• FR-2.2 Bidirectional Code-to-Canvas Sync: Import existing SystemVerilog/Verilog repositories to auto-generate visual schematics; edits in the embedded code editor update the canvas live and vice versa.
• FR-2.3 Hierarchical Sub-Modules: Group blocks into reusable custom components with auto-generated boundary ports and double-click drill-down navigation.
• FR-2.4 Git-Native Integration & Visual Diffs: Native GitHub/GitLab integration with a visual schematic diff overlay (Green = added, Red = removed, Yellow = modified).
• FR-2.5 Register Map & Firmware Header Generator: Visual Control/Status Register (CSR) editor exporting SystemRDL, HTML documentation, and C/Rust header files (.h / .rs).

Phase 3: AI-Native & Full Silicon Flow (V2.0+)

Goal: Scale to commercial ASIC workflows, autonomous AI design agents, and physical layout.
• FR-3.1 Kona AI Copilot & Full MCP Integration: Natural language schematic editing, automated SystemVerilog testbench/SVA assertion generation, and deep agentic workflows inside VS Code and Claude Code.
• FR-3.2 Visual FSM & Datapath Designer: State-bubble diagram editor with deadlock/unreachable-state detection compiling to clean always_ff / always_comb blocks.
• FR-3.3 Cloud RTL-to-GDSII & Floorplanning: Integration with OpenLane/OpenROAD (SkyWater 130nm, GF180MCU) and interactive die floorplanning with Static Timing Analysis (STA) critical-path heatmaps.
• FR-3.4 Enterprise Governance: Role-Based Access Control (RBAC), private organizational IP libraries, SSO/SAML, and SOC2-compliant single-tenant deployments.

5. Non-Functional Requirements

• Performance: ≥ 60 FPS canvas rendering with up to 250 modules and 1,500 nets; Wasm lint feedback under 500 ms for small/medium designs.
• Determinism: Identical .kona.json states must produce byte-for-byte identical SystemVerilog output to eliminate noisy Git diffs.
• Privacy & Security: Client-side Wasm execution keeps proprietary RTL inside the user's browser during local simulation; cloud storage encrypted via AES-256 at rest and TLS 1.3 in transit.
• Platform Compatibility: Modern desktop browsers (Chrome, Edge, Firefox, Safari) plus Windows/Linux CLI companion (kona-cli).

6. Success Metrics (KPIs)

• Activation Rate (MVP): ≥ 45% of new users wire a template design and export valid SystemVerilog within 10 minutes.
• Time-to-First-Simulation: < 3 minutes from initial landing to viewing a live VCD waveform.
• RTL Quality: ≥ 70% of exported top.sv files pass third-party linting (verilator --lint-only) with zero manual edits.
• Collaboration Virality (V1.0): ≥ 2.5 active collaborators or share-link viewers per workspace within 30 days.

7. Risks & Mitigations

• Resistance from Senior Engineers: Mitigated via bidirectional RTL sync, clean human-readable code output, Git-native JSON storage, and VS Code/MCP support from Day 1.
• Visual Clutter on Complex Chips: Mitigated through hierarchical sub-modules, named wireless net labels, and bundled bus interfaces (collapsing multi-wire protocols like AXI into single visual links).
• Browser Compute Limits: Mitigated by handling linting and block-level simulation locally in Wasm while providing a 1-click CLI/cloud runner fallback for full-chip simulations.
