import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CatalogRegistry,
  BUILTIN_MODULES,
  BUILTIN_TEMPLATES,
  defaultCatalogRegistry
} from '../packages/core/dist/catalog.js';
import {
  DrcEngine,
  BUILTIN_DRC_RULES
} from '../packages/core/dist/drc.js';

test('Architecture: CatalogRegistry supports runtime module and template registration', () => {
  const registry = new CatalogRegistry(BUILTIN_MODULES, BUILTIN_TEMPLATES);
  const initialCount = registry.listModules().length;

  registry.registerModule({
    id: 'custom_aes_accelerator',
    name: 'AES-256 Crypto Engine',
    category: 'peripheral',
    description: 'Hardware cryptographic accelerator block',
    ports: [
      { id: 'clk', name: 'clk', direction: 'input', type: 'clock', width: 1 },
      { id: 'data_in', name: 'data_in', direction: 'input', type: 'bus', width: 128 }
    ],
    parameters: []
  });

  assert.equal(registry.listModules().length, initialCount + 1);
  const mod = registry.getModule('custom_aes_accelerator');
  assert.ok(mod, 'Registered module must be retrievable');
  assert.equal(mod.name, 'AES-256 Crypto Engine');

  // Default registry remains untouched
  assert.equal(defaultCatalogRegistry.getModule('custom_aes_accelerator'), undefined);
});

test('Architecture: DrcEngine supports pluggable custom DrcRule strategies', () => {
  const engine = new DrcEngine(BUILTIN_DRC_RULES);

  // Register custom fanout limit rule without modifying core DRC files
  engine.registerRule({
    id: 'custom-fanout-limit',
    evaluate(ctx) {
      return ctx.design.nets
        .filter(n => n.targets.length > 3)
        .map(n => ({
          id: `custom_fanout_${n.id}`,
          rule: 'HIGH_FANOUT',
          severity: 'info',
          message: `Net "${n.name}" fans out to ${n.targets.length} loads`,
          netId: n.id
        }));
    }
  });

  const design = BUILTIN_TEMPLATES[0].createDesign();
  const diags = engine.run(design);

  const fanoutNote = diags.find(d => d.rule === 'HIGH_FANOUT');
  assert.ok(fanoutNote, 'Custom registered DRC rule must execute in DrcEngine pipeline');
  assert.equal(fanoutNote.severity, 'info');
});
