# Kona Architecture Guide (HLD & LLD)

This document defines the High-Level Design (HLD), Low-Level Design (LLD) patterns, dependency boundaries, and extension workflows for **Kona**.

---

## 1. High-Level Design (HLD)

Kona is structured as a strict two-layer TypeScript monorepo:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ apps/web (@kona/web) — Browser Presentation & Interactive Studio        │
│                                                                         │
│  app.ts (Composition Root)                                              │
│   ├── state/        DesignStore (Observer), HistoryManager, Persistence │
│   ├── canvas/       SchematicCanvas (Controller), Renderer, Geometry    │
│   ├── components/   CatalogPanel, InspectorPanel, DrcPanel,             │
│   │                 RtlPreviewPanel, WaveformViewer, ToastService       │
│   └── utils/        html escaping, SystemVerilog syntax highlighter     │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ depends on (unidirectional)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ packages/core (@kona/core) — Pure Domain & Verification Kernel (No DOM) │
│                                                                         │
│  ├── ir.ts          Schema validation & deterministic JSON serializer   │
│  ├── catalog/       CatalogRegistry + domain IP modules + templates     │
│  ├── drc/           DrcEngine (Strategy pipeline) + pluggable rules     │
│  ├── codegen.ts     Deterministic IEEE 1800 SystemVerilog generator     │
│  ├── sim.ts         Cycle-based behavioral simulation & VCD emitter     │
│  └── vcd.ts         VCD parser & radix formatter                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Architectural Invariants
1. **Unidirectional Dependency Rule:** `apps/web` may import from `@kona/core`; `@kona/core` must **never** import DOM, `window`, or UI code. All domain logic executes cleanly in Node.js, headless tests, or Web Workers.
2. **Single Source of Truth (`DesignStore`):** All UI panels subscribe to `DesignStore` state snapshots (`design`, `diagnostics`, `systemVerilog`, selection, undo/redo availability) rather than mutating DOM or cross-calling sibling panels.
3. **Backward-Compatible Facades:** Top-level barrels (`packages/core/src/catalog.ts`, `packages/core/src/drc.ts`, `apps/web/src/canvas.ts`, `apps/web/src/waveform.ts`) preserve stable import paths while internal modules scale independently.

---

## 2. Low-Level Design (LLD) & Design Patterns

### A. Catalog Registry (`packages/core/src/catalog/`) — *Registry + Open-Closed Principle*
- `CatalogRegistry` decouples IP discovery from static arrays.
- IP definitions are grouped by hardware domain under `catalog/modules/` (`processors.ts`, `interconnects.ts`, `memories.ts`, `peripherals.ts`, `infrastructure.ts`).
- Starter architectures live individually under `catalog/templates/`.

### B. DRC Rule Pipeline (`packages/core/src/drc/`) — *Strategy Pattern*
- `DrcEngine` runs an ordered pipeline of `DrcRule` implementations sharing a typed `DrcContext` (`instanceMap`, `drivenPorts`, `drivingPorts`, `resolveModule`).
- Built-in rules live in `drc/rules/` (`missing-module.rule.ts`, `net-connectivity.rule.ts`, `clock-reset.rule.ts`).
- Custom rules (e.g., CDC checks, fanout limits) can be registered dynamically via `engine.registerRule(customRule)`.

### C. Schematic Canvas (`apps/web/src/canvas/`) — *MVC / Pure Geometry Separation*
- `types.ts`: Canonical data contracts and layout constants (`CANVAS_METRICS`).
- `geometry.ts`: Pure, DOM-free geometry, dynamic block sizing (`getInstanceDimensions`), port placement (`computeAllPortPositions`), lane-staggered orthogonal routing (`computeWirePoints`), and segment hit-testing (`findHitWire`).
- `renderer.ts`: Stateless `CanvasRenderer` converting `RenderSceneState` into 2D Canvas draw calls.
- `SchematicCanvas.ts`: Interactive controller managing `ResizeObserver`, pointer/keyboard state machine, and domain callbacks.

### D. Reactive State & History (`apps/web/src/state/`) — *Observer + Memento Pattern*
- `HistoryManager<T>`: Bounded snapshot stack (`push`, `undo`, `redo`, `reset`).
- `DesignStore`: Recomputes DRC diagnostics and SystemVerilog deterministically on every mutation, persists URL hash state, and notifies subscribers.

---

## 3. Extension Guides

### Adding a New IP Block
1. Add the `KonaModuleDef` object to the appropriate domain file under `packages/core/src/catalog/modules/` (or register at runtime via `defaultCatalogRegistry.registerModule(def)`).
2. Add any dynamic port-width parameterization rules in `packages/core/src/drc/port-width.ts` if the block parameterizes port widths.
3. Run `npm run typecheck && npm run build`.

### Adding a New Architecture Template
1. Create a new file in `packages/core/src/catalog/templates/<name>.ts` exporting a `KonaTemplateDef`.
2. Append it to `BUILTIN_TEMPLATES` in `packages/core/src/catalog/templates/index.ts`.

### Adding a New DRC Rule
1. Create `packages/core/src/drc/rules/<rule-name>.rule.ts` implementing the `DrcRule` interface (`id`, `evaluate(ctx)`).
2. Register it in `BUILTIN_DRC_RULES` (`packages/core/src/drc/rules/index.ts`) or register on an engine instance with `engine.registerRule(...)`.
3. Add unit tests in `tests/drc.test.mjs` or `tests/architecture-extensibility.test.mjs`.

### Adding a New Studio Panel
1. Create a focused component class under `apps/web/src/components/` receiving explicit callbacks and subscribing to `DesignSnapshotState` updates.
2. Wire it in the composition root (`apps/web/src/app.ts`) inside `KonaApp` without coupling sibling panels directly.
