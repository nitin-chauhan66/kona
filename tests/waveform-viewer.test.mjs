import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeWaveformResult,
  formatWaveValue,
} from "../apps/web/public/waveform.js";

test("normalizes parser output with scalar and vector transitions", () => {
  const parsed = normalizeWaveformResult({
    artifact: {
      path: "run.vcd",
      format: "vcd",
      signal_names: ["clk", "count"],
      time_range: {
        start: { value: 0, unit: "ns" },
        end: { value: 20, unit: "ns" },
      },
    },
    signals: [{ name: "clk", width: 1 }, { name: "count", width: 8 }],
    transitions: {
      clk: [{ timestamp: 0, value: "0" }, { timestamp: 10, value: "1" }],
      count: [{ timestamp: 0, value: "00001010" }, { timestamp: 20, value: "00001111" }],
    },
  }, "run.vcd");

  assert.deepEqual(parsed.artifact.signal_names, ["clk", "count"]);
  assert.equal(parsed.signals[1].width, 8);
  assert.equal(parsed.transitions.clk[1].timestamp, 10);
});

test("formats vector values for common radices", () => {
  assert.equal(formatWaveValue("1010", "hex", 4), "0xa");
  assert.equal(formatWaveValue("1010", "octal", 4), "0o12");
  assert.equal(formatWaveValue("1010", "decimal", 4), "10");
  assert.equal(formatWaveValue("1010", "signed", 4), "-6");
  assert.equal(formatWaveValue("x", "hex", 4), "X");
});
