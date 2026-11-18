import { parseVcd } from "./vcd-parser.js";

globalThis.onmessage = (event) => {
  const { id, source } = event.data || {};
  try {
    if (typeof source !== "string") {
      throw new Error("VCD parser worker expects source text");
    }
    self.postMessage({ id, ok: true, result: parseVcd(source) });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
