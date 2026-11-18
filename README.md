# Kona

Local-first RTL verification, formal checking, and waveform debugging.

## Repository layout

- `apps/web` — browser presentation layer (planned Phase 1)
- `packages/compute-contract` — shared TypeScript compute-engine contracts
- `crates/kona-core` — Rust compute-engine contracts for Tauri and CLI
- `schemas/kona.schema.json` — JSON Schema for `kona.yaml`
- `examples/kona.yaml` — minimal project manifest
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

## Local web cockpit

```bash
npm run dev
```

Open `http://127.0.0.1:4173`. The cockpit provides an editor, lint/run/prove
operation tabs, and structured diagnostics. It uses the local CLI; no RTL is
uploaded to a server.

## Phase 2 workspace integration

Use `npm run watch` to re-run lint whenever `kona.yaml` changes. VS Code users
can run the included Kona lint, run, and watch tasks from the command palette.
The web cockpit automatically restores and saves editor state in `.kona/session.json`.

`apps/desktop/src-tauri` contains the Tauri v2 desktop shell scaffold. Native
Verilator/Icarus process integration remains delegated to the shared CLI runner
until native IPC commands are installed.

The Phase 1 scaffold includes manifest contracts, a structured CLI runner, and
a local web cockpit. Additional native desktop, WASM, and AI integrations can
build on these shared contracts in later phases.