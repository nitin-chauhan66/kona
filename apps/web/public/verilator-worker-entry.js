import { createVerilator } from "verilator-wasm";

let enginePromise;

function getEngine() {
  enginePromise ||= createVerilator({ wasmUrl: new URL("./verilator.wasm", self.location.href).href });
  return enginePromise;
}

self.onmessage = async (event) => {
  const { id, files, args } = event.data || {};
  try {
    if (typeof id !== "string" || !files || typeof files !== "object") {
      throw new Error("Verilator worker received an invalid request");
    }
    const engine = await getEngine();
    const result = await engine.run({
      args: Array.isArray(args) ? args : [],
      files,
    });
    self.postMessage({
      id,
      ok: result.exitCode === 0,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      files: result.files,
    });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
