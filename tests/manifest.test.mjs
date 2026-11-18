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
  assert.deepEqual(validation.manifest.rtl_files, ["../rtl/counter.sv"]);
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

test("rejects malformed optional manifest fields", () => {
  const validation = parseKonaManifest([
    "project_name: demo",
    "top_module: top",
    "rtl_files:",
    "  - rtl/top.sv",
    "sim_mode: fast_2state",
    "include_dirs: invalid",
    "testbench:",
  ].join("\n"));
  assert.equal(validation.ok, false);
  assert.deepEqual(
    validation.errors.map((error) => error.message),
    [
      "include_dirs must contain only non-empty strings",
      "testbench must be a non-empty string",
    ],
  );
});

test("rejects a JSON manifest that is not an object", () => {
  const validation = parseKonaManifest("null");
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some((error) => error.message.includes("project_name")));
});

test("enforces Verilog identifiers and non-empty RTL paths", () => {
  const validation = parseKonaManifest([
    "project_name: demo",
    "top_module: 123top",
    "rtl_files:",
    "  - ''",
    "sim_mode: fast_2state",
  ].join("\n"));
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some((error) => error.message.includes("top_module")));
  assert.ok(validation.errors.some((error) => error.message.includes("rtl_files")));
});

test("rejects unknown manifest fields", () => {
  const validation = parseKonaManifest([
    "project_name: demo",
    "top_module: top",
    "rtl_files:",
    "  - rtl/top.sv",
    "sim_mode: fast_2state",
    "unexpected: true",
  ].join("\n"));
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some((error) => error.message.includes("unexpected")));
});
