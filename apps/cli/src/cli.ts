import { readFile, writeFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { watch } from "node:fs";
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

  const result = await executeOperation(operation, validation.manifest);
  emit(result);
  if (!result.ok) process.exitCode = 1;
}

async function executeOperation(
  operation: string,
  manifest: ProjectManifest,
): Promise<ComputeResult & { lock?: Record<string, string> }> {
  if (!["lint", "run", "prove"].includes(operation)) {
    return failure(operation, [{
      severity: "error",
      message: `Unknown operation: ${operation}. Use lint, run, prove, or lock.`,
    }]);
  }

  await mkdir(".kona", { recursive: true });
  const workspaceRoot = process.cwd();
  const rtlFiles = manifest.rtl_files.map((file) => path.resolve(workspaceRoot, file));
  const includeArgs = (manifest.include_dirs ?? []).flatMap((dir) => [
    "-I", path.resolve(workspaceRoot, dir),
  ]);

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
      const output = path.resolve(".kona", `${manifest.top_module}.vvp`);
      const compile = await runCommand("iverilog", [
        "-g2012", "-s", manifest.top_module, "-o", output, ...includeArgs, ...rtlFiles,
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
    const buildDir = path.resolve(".kona", "verilator");
    const compile = await runCommand("verilator", [
      "--binary", "--timing", "--top-module", manifest.top_module,
      "--Mdir", buildDir, ...includeArgs, ...rtlFiles,
    ]);
    if (!compile.ok) return toolResult(operation, compile, manifest);
    const executable = path.join(buildDir, `V${manifest.top_module}`);
    const run = await runCommand(executable, []);
    return toolResult(operation, run, manifest);
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
  const result = await runCommand(command, ["--version"]);
  return result.code !== 127;
}

async function generateLock(): Promise<Record<string, string>> {
  const tools = ["yosys", "verilator", "iverilog", "sby"];
  const lock: Record<string, string> = {};
  for (const tool of tools) {
    const result = await runCommand(tool, ["--version"]);
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
  watch(manifestPath, { persistent: true }, () => {
    void run();
  });
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
