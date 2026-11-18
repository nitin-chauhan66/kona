# Kona MVP Task Plan

This plan tracks the completed local-first MVP and the next implementation
phase. Native desktop execution, browser simulation, waveform debugging,
protocol decoders, formal counterexample UX, and AI assistance are separate
follow-up workstreams.

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
| WEB-01 | Make static browser mode reliable | Done | MVP-04, MVP-05 |
| WEB-02 | Add browser Yosys WASM lint | Done | WEB-01 |
| WEB-03 | Persist browser workspace in OPFS | Done | WEB-01 |
| WEB-04 | Document web capability boundaries | Done | WEB-02, WEB-03 |
| DESKTOP-01 | Package macOS Tauri app | In progress | MVP-04 |
| DESKTOP-02 | Add native engine discovery | Ready | DESKTOP-01 |
| DESKTOP-03 | Add native operation IPC | Blocked | DESKTOP-02 |
| DESKTOP-04 | Add macOS smoke-test workflow | Ready | DESKTOP-03 |
| SIM-01 | Define browser simulation contract | Done | WEB-02 |
| SIM-02 | Integrate Verilator WASM worker | In progress | SIM-01 |
| SIM-03 | Add browser run diagnostics | Done | SIM-02 |
| WAVE-01 | Define waveform artifact contract | Done | MVP-02 |
| WAVE-02 | Add VCD parser worker | Done | WAVE-01 |
| WAVE-03 | Add waveform signal viewer | Done | WAVE-02 |

The MVP workstream is complete. The next parallel workstreams are desktop
packaging (DESKTOP-01) and browser simulation (SIM-02/SIM-03).

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

## Next phase task definitions

### WEB-01 — Make static browser mode reliable

**Status:** Done

**Acceptance criteria:**

- Static hosting works without `/api/session`, `/api/toolchain`, or `/api/run`.
- Browser mode reports its capabilities without claiming native engines.
- A selected RTL workspace can be loaded and reused after reload.

### WEB-02 — Add browser Yosys WASM lint

**Status:** Done

**Acceptance criteria:**

- The build generates the browser bundle and Yosys WASM assets locally.
- Yosys runs against selected RTL files in the browser.
- Include directories and top-module diagnostics are preserved.

### WEB-03 — Persist browser workspace in OPFS

**Status:** Done

**Acceptance criteria:**

- Selected RTL sources are stored under a Kona OPFS workspace.
- Reload restores the workspace when OPFS is available.
- The file picker remains available when OPFS is unsupported.

### WEB-04 — Document web capability boundaries

**Status:** Done

**Acceptance criteria:**

- Static browser lint support is documented.
- Native-only run/prove behavior is documented.
- Unsupported SRS features are not presented as implemented.

### DESKTOP-01 — Package macOS Tauri app

**Status:** In progress

**Scope:** Make the Tauri shell build a clickable `.app` and DMG using the
existing browser cockpit and macOS setup script.

**Acceptance criteria:**

- `scripts/setup-macos.command` installs prerequisites or gives actionable
  instructions.
- Tauri build hooks run from the repository root.
- A macOS `.app` and DMG are produced in the documented bundle directory.

### DESKTOP-02 — Add native engine discovery

**Status:** Ready

**Scope:** Add a desktop capability command that reports Verilator, Icarus,
Yosys, and SymbiYosys versions and executable paths.

**Acceptance criteria:**

- Discovery runs without blocking the UI.
- Missing engines are reported individually.
- Results use the shared structured diagnostic contract.

### DESKTOP-03 — Add native operation IPC

**Status:** Blocked

**Scope:** Expose lint, run, and prove through Tauri commands backed by the
existing CLI runner.

**Acceptance criteria:**

- The desktop UI can execute operations without a local HTTP server.
- Manifest and workspace paths are validated before process launch.
- Process failures and cancellation return structured diagnostics.

### DESKTOP-04 — Add macOS smoke-test workflow

**Status:** Ready

**Scope:** Validate the packaged app on supported Intel and Apple Silicon
macOS runners.

**Acceptance criteria:**

- The app opens from a clean installation.
- The counter sample passes lint and simulation.
- Missing-engine behavior is visible and actionable.

### SIM-01 — Define browser simulation contract

**Status:** Done

**Scope:** Extend `IComputeEngine` metadata for browser simulation limits,
artifacts, cancellation, and memory/design-size thresholds.

**Acceptance criteria:**

- Supported browser modes and limits are explicit.
- Results can carry diagnostics and waveform artifacts.
- Abort behavior is testable without a native process.

**Implementation:** Shared request metadata now supports request IDs, timeouts,
cancellation reasons, browser capability declarations, design-size limits, and
memory limits.

### SIM-02 — Integrate Verilator WASM worker

**Status:** In progress

**Scope:** Run supported 2-state unit simulations in a Web Worker without
freezing the editor.

**Acceptance criteria:**

- Worker startup and progress are reported.
- RTL/testbench inputs remain local to the browser.
- A passing and failing sample produce structured results.

**Implementation:** Standalone web builds now include a real Verilator WASM
worker for local compile diagnostics and browser-size checks. Full 2-state
simulation remains dependent on a native build-capable engine because this WASM
distribution does not compile generated C++ in the browser.

### SIM-03 — Add browser run diagnostics

**Status:** Done

**Scope:** Render simulation output, source locations, runtime failures, and
resource-limit guidance in the web cockpit.

**Acceptance criteria:**

- Compile and runtime diagnostics are distinguishable.
- Failed simulations never appear as successful results.
- Designs exceeding browser limits receive a desktop handoff message.

**Implementation:** Standalone run requests distinguish compile failures from
the unsupported simulation step, preserve non-success status, and provide
actionable native handoff guidance for oversized workspaces.

### WAVE-01 — Define waveform artifact contract

**Status:** Done

**Scope:** Specify browser-safe VCD/FST metadata and session persistence before
adding a viewer.

**Acceptance criteria:**

- Artifact format, signal names, timestamps, and source references are typed.
- Session state includes cursor, zoom, grouping, and radix.
- The contract is compatible with native CLI results.

**Implementation:** Shared types and validators now cover VCD/FST artifacts,
timestamps, signal/source metadata, cursor, zoom, grouping, and radix state.

### WAVE-02 — Add VCD parser worker

**Status:** Done

**Scope:** Parse supported VCD output off the main thread.

**Acceptance criteria:**

- Parser handles scalar and vector value changes.
- Malformed VCD returns actionable diagnostics.
- Parsing large files does not block editor interaction.

**Implementation:** Added a browser-safe VCD parser in the shared compute
contract, a module worker in the web public assets, and a worker-backed parser
hook with cancellation support. The parser handles scalar and vector changes,
hierarchy and timescale metadata, and line-scoped diagnostics for malformed
VCD. Focused tests cover valid changes and malformed headers/value streams.

### WAVE-03 — Add waveform signal viewer

**Status:** Done

**Scope:** Add a minimal timeline viewer before Surfer integration.

**Acceptance criteria:**

- Signals can be selected and grouped.
- Cursor and zoom state persist.
- A selected transition can identify its signal and timestamp.

**Implementation:** The web cockpit now includes a dedicated waveform pane,
VCD file loading through `KonaWaveformParser`, scalar/vector timeline rendering,
signal selection and grouping, cursor and zoom controls, radix selection, and
localStorage/OPFS plus server session persistence.
