import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseKonaManifest, isSimulationMode } from "../packages/compute-contract/dist/index.js";

test("loads the example Kona manifest", async () => {
  const source = await readFile("examples/kona.yaml", "utf8");
  const validation = parseKonaManifest(source);
  assert.equal(validation.ok, true);
  assert.equal(validation.manifest.project_name, "counter");
  assert.equal(validation.manifest.sim_mode, "fast_2state");
  assert.deepEqual(validation.manifest.rtl_files, ["rtl/counter.sv"]);
});

test("rejects a manifest with missing required fields", () => {
  const validation = parseKonaManifest("project_name: demo");
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.length >= 3);
});

test("recognizes supported simulation modes", () => {
  assert.equal(isSimulationMode("formal"), true);
  assert.equal(isSimulationMode("unknown"), false);
});
