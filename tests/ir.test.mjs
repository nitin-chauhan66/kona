import test from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_TEMPLATES } from '../packages/core/dist/catalog.js';
import { validateKonaDesignSchema, serializeKonaDesign, parseKonaDesign } from '../packages/core/dist/ir.js';

test('IR: validates valid starter template designs', () => {
  for (const tmpl of STARTER_TEMPLATES) {
    const design = tmpl.createDesign();
    const errors = validateKonaDesignSchema(design);
    assert.deepEqual(errors, [], `Design ${tmpl.id} should have 0 schema errors`);
  }
});

test('IR: catches invalid design schema fields', () => {
  const badDesign = {
    version: '2.0', // invalid version
    name: 123,
    topModule: '',
    instances: [
      { id: 'inst1', moduleId: 'm1', name: 'n1', position: { x: 'invalid', y: 0 } }
    ],
    nets: [
      { id: 'net1', name: 'n', width: -1, targets: [] }
    ]
  };

  const errors = validateKonaDesignSchema(badDesign);
  assert.ok(errors.length >= 3, 'Should detect multiple schema validation errors');
});

test('IR: deterministic serialization is byte-for-byte reproducible', () => {
  const tmpl = STARTER_TEMPLATES[0];
  const design = tmpl.createDesign();

  const json1 = serializeKonaDesign(design);
  const json2 = serializeKonaDesign(design);
  assert.equal(json1, json2, 'Serialization must be 100% deterministic');

  const { design: parsed, errors } = parseKonaDesign(json1);
  assert.equal(errors.length, 0);
  assert.ok(parsed);
  assert.equal(parsed.name, design.name);
  assert.equal(parsed.instances.length, design.instances.length);
});
