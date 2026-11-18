import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, watch as watchFile } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import {
  parseKonaManifest,
  type ComputeResult,
  type Diagnostic,
  type ProjectManifest,
} from "../../../packages/compute-contract/dist/index.js";

const args = process.argv.slice(2);
const operation = args.find((arg) => !arg.startsWith("-")) ?? "lint";
const manifestArg = args.find((arg) =>
  arg.endsWith(".yaml") || arg.endsWith(".yml") || arg.endsWith(".json"),
) ?? "kona.yaml";
const jsonOutput = args.includes("--json");

async function main(): Promise<void> {
  if (operation === "--help" || operation === "-h" || operation === "help") {
    printHelp();
    return;
  }
  if (operation === "watch") {
    await watchManifest(manifestArg);
    return;
  }
  if (operation === "lock") {
    const lock = await generateLock();
    await writeFile("kona.lock", JSON.stringify(lock, null, 2) + "\n");
    emit({ ok: true, operation: "lock", lock });
    return;
  }

  let source: string;
  try {
    source = await readFile(manifestArg, "utf8");
  } catch {
    emit({ ok: false, operation, diagnostics: [{
      severity: "error",
      message: `Manifest not found: ${manifestArg}`,
    }] });
    process.exitCode = 1;
    return;
  }

  const validation = parseKonaManifest(source);
  if (!validation.ok || !validation.manifest) {
    emit({ ok: false, operation, diagnostics: validation.errors });
    process.exitCode = 1;
    return;
  }

  const result = await executeOperation(operation, validation.manifest, path.dirname(path.resolve(manifestArg)));
  emit(result);
  if (!result.ok) process.exitCode = 1;
}

async function executeOperation(
  operation: string,
  manifest: ProjectManifest,
  manifestDirectory = process.cwd(),
): Promise<ComputeResult & { lock?: Record<string, string> }> {
  if (!["lint", "run", "prove"].includes(operation)) {
    return failure(operation, [{
      severity: "error",
      message: `Unknown operation: ${operation}. Use lint, run, prove, or lock.`,
    }]);
  }

  const outputDirectory = path.join(manifestDirectory, ".kona");
  await mkdir(outputDirectory, { recursive: true });
  const workspaceRoot = manifestDirectory;
  const rtlFiles = manifest.rtl_files.map((file) => path.resolve(workspaceRoot, file));
  const testbench = manifest.testbench
    ? path.resolve(workspaceRoot, manifest.testbench)
    : undefined;
  let simulationTop = manifest.top_module;
  if (testbench) {
    try {
      simulationTop = await inferTopModule(testbench, manifest.top_module);
    } catch (error) {
      return failure(operation, [{
        severity: "error",
        message: `Unable to read testbench: ${String(error)}`,
        file: testbench,
      }]);
    }
  }
  const includeArgs = (manifest.include_dirs ?? []).flatMap((dir) => [
    `-I${path.resolve(workspaceRoot, dir)}`,
  ]);
  const missingInputs = [...rtlFiles, ...(testbench ? [testbench] : [])]
    .filter((file) => !existsSync(file));
  if (missingInputs.length > 0) {
    return failure(operation, missingInputs.map((file) => ({
      severity: "error" as const,
      message: `Declared input file not found: ${path.relative(workspaceRoot, file)}`,
      file,
    })));
  }

  if (operation === "lint") {
    const unavailable = await commandAvailable("verilator");
    if (!unavailable) {
      return success(operation, [{
        severity: "warning",
        message: "Verilator is unavailable; manifest validation passed, but RTL lint was not run.",
      }], manifest);
    }
    const result = await runCommand("verilator", [
      "--lint-only", "--Wall", "--top-module", manifest.top_module, ...includeArgs, ...rtlFiles,
    ]);
    return toolResult(operation, result, manifest);
  }

  if (operation === "run") {
    if (manifest.sim_mode === "accurate_4state") {
      const available = await commandAvailable("iverilog");
      if (!available) {
        return success(operation, [{
          severity: "warning",
          message: "Icarus Verilog is unavailable; accurate 4-state simulation was not run.",
        }], manifest);
      }
      const output = path.join(outputDirectory, `${manifest.top_module}.vvp`);
      const compile = await runCommand("iverilog", [
        "-g2012", "-s", simulationTop, "-o", output, ...includeArgs,
        ...rtlFiles, ...(testbench ? [testbench] : []),
      ]);
      if (!compile.ok) return toolResult(operation, compile, manifest);
      const run = await runCommand("vvp", [output]);
      return toolResult(operation, run, manifest);
    }

    const available = await commandAvailable("verilator");
    if (!available) {
      return success(operation, [{
        severity: "warning",
        message: "Verilator is unavailable; fast 2-state simulation was not run.",
      }], manifest);
    }
    const buildDir = path.join(outputDirectory, "verilator");
    const compile = await runCommand("verilator", [
      "--binary", "--timing", "--top-module", simulationTop,
      "--Mdir", buildDir, ...includeArgs, ...rtlFiles, ...(testbench ? [testbench] : []),
    ]);
    if (!compile.ok) return toolResult(operation, compile, manifest);
    const executable = path.join(buildDir, `V${simulationTop}`);
    const run = await runCommand(executable, []);
    return toolResult(operation, run, manifest);
  }

  async function inferTopModule(testbenchPath: string, fallback: string): Promise<string> {
    const source = await readFile(testbenchPath, "utf8");
    const match = /^\s*module\s+([A-Za-z_][A-Za-z0-9_$]*)\b/m.exec(source);
    return match?.[1] ?? fallback;
  }

  const available = await commandAvailable("sby");
  if (!available) {
    return success(operation, [{
      severity: "warning",
      message: "SymbiYosys is unavailable; formal proof was not run.",
    }], manifest);
  }
  return success(operation, [{
    severity: "info",
    message: "SymbiYosys is installed. Add an .sby proof configuration before running kona prove.",
  }], manifest);
}

function success(operation: string, diagnostics: Diagnostic[], manifest: ProjectManifest): ComputeResult {
  return {
    ok: true,
    target: "headless-cli",
    operation: operation as "lint" | "run" | "prove",
    diagnostics,
    metadata: { project_name: manifest.project_name, top_module: manifest.top_module },
  };
}

function failure(operation: string, diagnostics: Diagnostic[]): ComputeResult {
  return {
    ok: false,
    target: "headless-cli",
    operation: operation as "lint" | "run" | "prove",
    diagnostics,
  };
}

function toolResult(
  operation: string,
  result: CommandResult,
  manifest: ProjectManifest,
): ComputeResult {
  const diagnostics = parseToolDiagnostics(result.stderr || result.stdout);
  if (diagnostics.length === 0 && result.ok) {
    diagnostics.push({ severity: "info", message: "EDA command completed successfully." });
  }
  const base = result.ok ? success(operation, diagnostics, manifest) : failure(operation, diagnostics);
  if (!result.ok && diagnostics.length === 0) {
    base.diagnostics.push({ severity: "error", message: `EDA command failed with exit code ${result.code}.` });
  }
  return base;
}

function parseToolDiagnostics(output: string): Diagnostic[] {
  return output.split(/\r?\n/).filter(Boolean).map((line) => {
    const match = /^(.+?):(\d+):(?:(\d+):)?\s*(.*)$/.exec(line);
    if (match) {
      return {
        severity: /\berror\b/i.test(line) ? "error" as const : "warning" as const,
        message: match[4] || line,
        file: match[1],
        line: Number(match[2]),
        column: match[3] ? Number(match[3]) : undefined,
      };
    }
    return {
      severity: /\berror\b/i.test(line) ? "error" as const : "info" as const,
      message: line,
    };
  });
}

interface CommandResult {
  ok: boolean;
  code: number;
  stdout: string;
  stderr: string;
}

async function runCommand(command: string, args: string[]): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", () => resolve({ ok: false, code: 127, stdout, stderr }));
    child.on("close", (code) => resolve({
      ok: code === 0,
      code: code ?? 1,
      stdout,
      stderr,
    }));
  });
}

async function commandAvailable(command: string): Promise<boolean> {
  const probeArgs = command === "iverilog" ? ["-V"]
    : command === "sby" ? ["--help"]
    : ["--version"];
  const result = await runCommand(command, probeArgs);
  return result.code !== 127;
}

async function generateLock(): Promise<Record<string, string>> {
  const tools = ["yosys", "verilator", "iverilog", "sby"];
  const lock: Record<string, string> = {};
  for (const tool of tools) {
    const probeArgs = tool === "iverilog" ? ["-V"]
      : tool === "sby" ? ["--help"]
      : ["--version"];
    const result = await runCommand(tool, probeArgs);
    lock[tool] = result.code === 127
      ? "unavailable"
      : (result.stdout || result.stderr).trim().split(/\r?\n/)[0] || "unknown";
  }
  return lock;
}

function emit(payload: unknown): void {
  if (jsonOutput) {
    console.log(JSON.stringify(payload, null, 2));
  } else if (typeof payload === "object" && payload !== null &&
             "diagnostics" in payload) {
    const value = payload as { ok: boolean; diagnostics: Diagnostic[] };
    for (const diagnostic of value.diagnostics) {
      const location = diagnostic.file
        ? `${diagnostic.file}${diagnostic.line ? `:${diagnostic.line}` : ""}: `
        : "";
      console.log(`${diagnostic.severity.toUpperCase()} ${location}${diagnostic.message}`);
    }
  } else {
    console.log(JSON.stringify(payload, null, 2));
  }
}

async function watchManifest(manifestPath: string): Promise<void> {
  let running = false;
  let timer: NodeJS.Timeout | undefined;
  console.log(`Watching ${manifestPath} for changes...`);

  const run = async () => {
    if (running) return;
    running = true;
    try {
      const source = await readFile(manifestPath, "utf8");
      const validation = parseKonaManifest(source);
      if (!validation.ok || !validation.manifest) {
        for (const diagnostic of validation.errors) {
          console.log(`ERROR ${diagnostic.message}`);
        }
      } else {
        const result = await executeOperation("lint", validation.manifest);
        for (const diagnostic of result.diagnostics) {
          console.log(`${diagnostic.severity.toUpperCase()} ${diagnostic.message}`);
        }
      }
    } catch (error) {
      console.log(`ERROR ${String(error)}`);
    } finally {
      running = false;
    }
  };

  await run();
  const watchers = new Set<ReturnType<typeof watchFile>>();
  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void run(), 150);
  };
  const watchPath = (file: string) => {
    if (!existsSync(file)) return;
    watchers.add(watchFile(file, { persistent: true }, schedule));
  };
  watchPath(path.resolve(manifestPath));
  try {
    const source = await readFile(manifestPath, "utf8");
    const validation = parseKonaManifest(source);
    if (validation.ok && validation.manifest) {
      const base = path.dirname(path.resolve(manifestPath));
      for (const file of validation.manifest.rtl_files) watchPath(path.resolve(base, file));
      for (const directory of validation.manifest.include_dirs ?? []) {
        watchPath(path.resolve(base, directory));
      }
    }
  } catch {
    // The initial run reports manifest read/parse errors.
  }
}

function printHelp(): void {
  console.log(`Kona CLI

Usage:
  kona lint [manifest] [--json]
  kona run [manifest] [--json]
  kona prove [manifest] [--json]
  kona lock [--json]
  kona watch [manifest]

Default manifest: kona.yaml`);
}

await main();
