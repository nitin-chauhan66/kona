import test from "node:test";
import assert from "node:assert/strict";
import {
  isWaveformFormat,
  isWaveformRadix,
  validateWaveformArtifact,
  validateWaveformSession,
} from "../packages/compute-contract/dist/index.js";

test("recognizes browser-safe waveform formats and radices", () => {
  assert.equal(isWaveformFormat("vcd"), true);
  assert.equal(isWaveformFormat("fst"), true);
  assert.equal(isWaveformFormat("saif"), false);
  assert.equal(isWaveformRadix("hex"), true);
  assert.equal(isWaveformRadix("roman"), false);
});

test("validates an artifact with timestamps and source metadata", () => {
  const artifact = {
    artifact_id: "run-001",
    path: ".kona/waveforms/run.vcd",
    format: "vcd",
    signal_names: ["count", "clk"],
    duration_fs: 50_000,
    time_range: {
      start: { value: 0, unit: "fs" },
      end: { value: 50_000, unit: "fs" },
    },
    sources: [
      { file: "rtl/counter.sv", line: 8, hierarchy: "counter", symbol: "count" },
    ],
  };

  assert.deepEqual(validateWaveformArtifact(artifact), { ok: true, errors: [] });
});

test("rejects malformed artifact identity and signal names", () => {
  const result = validateWaveformArtifact({
    path: "",
    format: "ghw",
    signal_names: [""],
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.length >= 3);
});

test("validates persistent cursor, zoom, grouping, and radix state", () => {
  const session = {
    artifact: {
      path: ".kona/waveforms/run.fst",
      format: "fst",
    },
    cursor: {
      timestamp: { value: 25, unit: "ns" },
      signal_name: "count",
    },
    zoom: {
      start: { value: 0, unit: "ns" },
      end: { value: 50, unit: "ns" },
    },
    grouping: [
      { id: "core", name: "Core", signal_names: ["clk", "count"], expanded: true },
    ],
    radix: {
      count: "hex",
      clk: "binary",
    },
  };

  assert.deepEqual(validateWaveformSession(session), { ok: true, errors: [] });
});

test("rejects unsupported radix and malformed session containers", () => {
  const bad = validateWaveformSession({
    artifact: { path: "run.vcd", format: "vcd" },
    cursor: null,
    zoom: null,
    grouping: [],
    radix: { count: "roman" },
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some((error) => error.includes("radix")));
});
