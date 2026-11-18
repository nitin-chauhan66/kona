# Kona MVP Task Plan

This plan scopes the MVP to the local-first Phase 1 runner and web cockpit.
Desktop-native execution, WASM engines, protocol decoders, formal counterexample
UX, and AI assistance remain follow-up work.

## Status legend

- **Ready** — can start now
- **Blocked** — waiting on a dependency
- **In progress** — actively being implemented
- **Done** — acceptance criteria verified

## Task board

| ID | Task | Status | Depends on |
| --- | --- | --- | --- |
| MVP-01 | Finalize manifest contract | Done | — |
| MVP-02 | Harden CLI runner | Done | MVP-01 |
| MVP-03 | Add executable sample design | Done | MVP-01 |
| MVP-04 | Complete web cockpit | Done | MVP-02 |
| MVP-05 | Stabilize session storage | Done | MVP-04 |
| MVP-06 | Add workspace watch integration | Done | MVP-02 |
| MVP-07 | Add MVP CI validation | Done | MVP-02, MVP-03, MVP-05 |
| MVP-08 | Document MVP workflows | Done | MVP-07 |

MVP-01 and MVP-03 are the first parallel workstream opportunities after the
manifest contract is agreed. MVP-04 and MVP-06 can then proceed independently.

## Focused task definitions

### MVP-01 — Finalize manifest contract

**Scope:** Align `kona.yaml` parsing, `schemas/kona.schema.json`, TypeScript
contracts, path semantics, and diagnostics.

**Acceptance criteria:**

- Required and optional fields have the same validation rules in code and schema.
- Relative RTL, include, and testbench paths are resolved from the manifest.
- Malformed YAML/JSON and invalid field types return actionable diagnostics.
- Focused parser tests cover valid, missing-field, invalid-type, and path cases.

### MVP-02 — Harden CLI runner

**Scope:** Make `lint`, `run`, `prove`, and `lock` predictable for local and CI
use.

**Acceptance criteria:**

- `--json` always emits a stable result shape.
- Missing tools, failed processes, and unknown operations produce non-zero exits.
- Tool output is mapped to file/line/column diagnostics where available.
- Generated artifacts stay inside the project’s `.kona/` directory.
- A command-level test covers each operation without requiring every EDA tool.

### MVP-03 — Add executable sample design

**Scope:** Add a minimal counter RTL module and deterministic testbench referenced
by `examples/kona.yaml`.

**Acceptance criteria:**

- The sample files are committed and referenced with correct relative paths.
- Lint and simulation work when the corresponding tool is installed.
- The sample remains useful when tools are absent by reporting explicit warnings.

### MVP-04 — Complete web cockpit

**Scope:** Finish the editor-to-operation flow in `apps/web/public`.

**Acceptance criteria:**

- Users can edit a manifest and select lint, run, or prove.
- Loading, success, diagnostics, and failure states are distinct.
- Diagnostic locations and messages render safely as escaped text.
- The cockpit uses the same CLI result contract as headless execution.

### MVP-05 — Stabilize session storage

**Scope:** Persist manifest text and selected operation through the local web API.

**Acceptance criteria:**

- A fresh workspace loads with sensible defaults.
- Valid session state restores after restart.
- Malformed request bodies return HTTP 400 with structured errors.
- Writes do not leave partially serialized JSON.

### MVP-06 — Add workspace watch integration

**Scope:** Watch the manifest, RTL files, and include directories and rerun lint
with debounce protection.

**Acceptance criteria:**

- Changes to any declared input trigger lint.
- Bursts of filesystem events result in one effective run.
- Deleted or unreadable inputs produce diagnostics instead of crashing.
- Watch mode can terminate cleanly on process interruption.

### MVP-07 — Add MVP CI validation

**Scope:** Build a focused automated validation suite for the contract, CLI,
sample project, web API, and watch behavior.

**Acceptance criteria:**

- CI runs typecheck/build and focused tests on supported Node versions.
- Tests cover structured JSON output and non-zero failure paths.
- Tests do not require proprietary tools or network access.
- The sample project is validated end to end when open-source tools are present.

### MVP-08 — Document MVP workflows

**Scope:** Keep `README.md` aligned with the actual MVP behavior.

**Acceptance criteria:**

- Setup and all CLI commands have copy-pasteable examples.
- Tool availability and warning/error behavior are documented.
- Web cockpit and watch workflows are documented.
- Phase 2+ exclusions are clearly separated from MVP capabilities.
