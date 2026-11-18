import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { parseKonaManifest } from "../packages/compute-contract/dist/index.js";

const root = path.resolve(".");

test("the counter sample declares existing executable inputs", async () => {
  const source = await readFile(path.join(root, "examples/kona.yaml"), "utf8");
  const validation = parseKonaManifest(source);
  assert.equal(validation.ok, true);

  const manifest = validation.manifest;
  for (const file of [...manifest.rtl_files, manifest.testbench]) {
    await access(path.join(root, "examples", file));
  }
});

test("the counter sample has a deterministic reset and increment check", async () => {
  const rtl = await readFile(path.join(root, "rtl/counter.sv"), "utf8");
  const testbench = await readFile(path.join(root, "tests/test_counter.sv"), "utf8");

  assert.match(rtl, /module counter\b/);
  assert.match(rtl, /if \(!rst_n\)/);
  assert.match(rtl, /count <= count \+ 1'b1/);
  assert.match(testbench, /counter dut/);
  assert.match(testbench, /expected 3/);
  assert.match(testbench, /\$finish/);
});
