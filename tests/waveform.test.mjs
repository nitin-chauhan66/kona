import test from "node:test";
import assert from "node:assert/strict";
import {
  isWaveformFormat,
  isWaveformRadix,
  validateWaveformArtifact,
  validateWaveformSession,
} from "../packages/compute-contract/dist/index.js";
import { parseVcd } from "../packages/compute-contract/dist/vcd.js";

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

test("parses scalar and vector VCD value changes", () => {
  const result = parseVcd(`$date today $end
$timescale 10 ns $end
$scope module top $end
$var wire 1 ! clk $end
$var reg 4 # count [3:0] $end
$upscope $end
$enddefinitions $end
#0
0!
b0000 #
#5
1!
b1010 #
`);

  assert.equal(result.ok, true);
  assert.equal(result.signals.length, 2);
  assert.equal(result.signals[1].name, "count");
  assert.equal(result.signals[1].width, 4);
  assert.equal(result.signals[1].hierarchy, "top");
  assert.equal(result.timescaleFs, 10_000_000);
  assert.equal(result.endTime, 5);
  assert.equal(result.duration, 50_000_000);
  assert.equal(result.sampleCount, 4);
  assert.deepEqual(result.changes.map((change) => [change.kind, change.value]), [
    ["scalar", "0"],
    ["vector", "0000"],
    ["scalar", "1"],
    ["vector", "1010"],
  ]);
});

test("returns actionable diagnostics for malformed VCD", () => {
  const result = parseVcd(`$timescale banana $end
$scope broken $end
$var wire 8 # count $end
$enddefinitions $end
#10
2!
b111 #
b111 ?
#3
`);

  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.some((item) => item.code === "invalid_timescale"));
  assert.ok(result.diagnostics.some((item) => item.code === "invalid_scope"));
  assert.ok(result.diagnostics.some((item) => item.code === "invalid_scalar"));
  assert.ok(result.diagnostics.some((item) => item.code === "unknown_identifier"));
  assert.ok(result.diagnostics.some((item) => item.code === "vector_width_mismatch"));
  assert.ok(result.diagnostics.some((item) => item.code === "timestamp_regression"));
  assert.ok(result.diagnostics.every((item) => item.line === undefined || item.line > 0));
});

test("diagnoses missing header sections and empty source", () => {
  const empty = parseVcd("");
  assert.equal(empty.ok, false);
  assert.ok(empty.diagnostics.some((item) => item.code === "empty_source"));

  const incomplete = parseVcd("$timescale 1 ns $end\n#0\n0!");
  assert.ok(incomplete.diagnostics.some((item) => item.code === "missing_enddefinitions"));
  assert.equal(incomplete.signals.length, 0);
});
