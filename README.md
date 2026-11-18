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

The current scaffold defines contracts and configuration only. Runtime adapters
for WebAssembly, native desktop, and the CLI can implement these contracts
incrementally in the phased delivery plan.