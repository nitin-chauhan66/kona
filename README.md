# Kona

Local-first RTL verification, formal checking, and waveform debugging.

## Repository layout

- `apps/web` — browser presentation layer (planned Phase 1)
- `packages/compute-contract` — shared TypeScript compute-engine contracts
- `crates/kona-core` — Rust compute-engine contracts for Tauri and CLI
- `schemas/kona.schema.json` — JSON Schema for `kona.yaml`
- `examples/kona.yaml` — minimal project manifest
- `MVP_TASKS.md` — scoped MVP task board with status and acceptance criteria
- `REQUIREMENTS.md` — Software Requirements Specification v3.0

## Development

```bash
npm install
npm run build
cargo check
```

## Phase 1 CLI

```bash
npm run build
npm run kona -- lint examples/kona.yaml --json
npm run kona -- run examples/kona.yaml --json
npm run kona -- prove examples/kona.yaml --json
npm run kona -- lock --json
```

The CLI validates `kona.yaml`, invokes Verilator/Icarus/SymbiYosys when they are
installed, and emits structured JSON with `--json`. Missing tools are reported
clearly instead of silently producing a successful result.

Manifest paths are relative to the manifest file. RTL and testbench files are
checked before an EDA tool is started, and generated artifacts are written to
the project `.kona/` directory.

## Local web cockpit

```bash
npm run dev
```

Open `http://127.0.0.1:4173`. The cockpit provides an editor, lint/run/prove
operation tabs, and structured diagnostics. The browser bundle includes a
WebAssembly Yosys lint engine and stores sessions locally; select the RTL
workspace directory when using a static deployment. Native Docker/CLI execution
remains available for Verilator, Icarus, and SymbiYosys run/prove operations.

To build a static browser bundle, run `npm run build` and serve `apps/web/public`
from any static file host. No Kona application server or RTL upload endpoint is
required for browser linting. The browser stores the selected workspace in
OPFS when supported, so reloads do not require reselecting RTL files.

The standalone web mode currently supports real Yosys WebAssembly linting.
Verilator 2-state simulation, Icarus 4-state simulation, and SymbiYosys proof
remain native operations and are used automatically when the local server or
desktop runtime is connected.

## Phase 2 workspace integration

Use `npm run watch` to re-run lint whenever `kona.yaml` changes. VS Code users
can run the included Kona lint, run, and watch tasks from the command palette.
The web cockpit automatically restores and saves editor state in `.kona/session.json`.

Watch mode also observes declared RTL inputs and include directories, debouncing
short bursts of filesystem events before rerunning lint.

## MVP scope

The MVP provides a local manifest editor, structured CLI operations, optional
Verilator/Icarus/SymbiYosys integration, session persistence, and workspace
watching. The complete task board and acceptance criteria are in
[MVP_TASKS.md](MVP_TASKS.md). Native Tauri execution, WebAssembly toolchains,
protocol decoders, and AI assistance are planned after the MVP.

## Packaged web app with EDA tools

The local web container includes Yosys, Verilator, Icarus Verilog, and
SymbiYosys. It keeps RTL in the local container/workspace and exposes tool
availability through the cockpit.

```bash
npm run package:web
npm run start:packaged
```

Then open `http://127.0.0.1:4173`. Alternatively:

```bash
docker compose up --build
```

The first container build downloads the open-source Debian toolchain packages.
This is a packaged Linux-native deployment, not browser-WASM execution.

`apps/desktop/src-tauri` contains the Tauri v2 desktop shell scaffold. Native
Verilator/Icarus process integration remains delegated to the shared CLI runner
until native IPC commands are installed.

## macOS click setup

Double-click [`scripts/setup-macos.command`](./scripts/setup-macos.command) to
install the macOS prerequisites, native Verilator/Icarus/Yosys engines, Rust,
and the Tauri CLI, then build `Kona.app` and a DMG. The script requires
Xcode Command Line Tools, Homebrew, and an internet connection for the
one-time setup. It exits with instructions if Xcode or Homebrew is missing.

The resulting artifacts are written to:

- `apps/desktop/src-tauri/target/release/bundle/macos/Kona.app`
- `apps/desktop/src-tauri/target/release/bundle/dmg/*.dmg`

DMG filenames include the host architecture and may vary by macOS target.

For a manual build from the repository root:

```bash
npm ci
npm run build
npm --workspace apps/desktop run build
```

The current desktop shell packages the browser cockpit. Native run/prove
execution still uses the CLI/server integration; the macOS installer does not
silently claim formal or simulation support when an engine is unavailable.

The Phase 1 scaffold includes manifest contracts, a structured CLI runner, and
a local web cockpit. Additional native desktop, WASM, and AI integrations can
build on these shared contracts in later phases.