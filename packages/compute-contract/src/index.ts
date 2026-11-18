import type { WaveformArtifact } from "./waveform.js";

export * from "./waveform.js";
export * from "./vcd.js";

export type ComputeTarget = "web-wasm" | "desktop-native" | "headless-cli";

export type SimulationMode = "fast_2state" | "accurate_4state" | "formal";

export type ComputeOperation = "lint" | "run" | "prove";

export type ComputeCancellationReason =
  | "user"
  | "superseded"
  | "timeout"
  | "resource_limit";

export interface ComputeRequestMetadata {
  request_id?: string;
  timeout_ms?: number;
  cancellation?: {
    requested: boolean;
    reason?: ComputeCancellationReason;
  };
}

export interface ProjectManifest {
  project_name: string;
  top_module: string;
  rtl_files: string[];
  include_dirs?: string[];
  sim_mode: SimulationMode;
  testbench?: string;
  waveform_signals?: string[];
}

export interface ToolchainVersions {
  yosys?: string;
  verilator?: string;
  icarus?: string;
  symbiyosys?: string;
}

export interface DesignSizeLimits {
  max_rtl_files?: number;
  max_rtl_bytes?: number;
  max_design_gates?: number;
  max_simulation_steps?: number;
}

export interface MemoryLimits {
  max_memory_bytes?: number;
  max_waveform_bytes?: number;
}

export interface BrowserSimulationLimits {
  design_size: DesignSizeLimits;
  memory: MemoryLimits;
  max_execution_time_ms?: number;
}

export interface BrowserSimulationCapabilities {
  supported_modes: readonly SimulationMode[];
  supports_waveforms: boolean;
  supports_counterexamples: boolean;
  supports_cancellation: boolean;
  limits: BrowserSimulationLimits;
}

export interface ComputeRequest {
  operation: ComputeOperation;
  manifest: ProjectManifest;
  toolchain?: ToolchainVersions;
  signal_names?: string[];
  workspace_root?: string;
  metadata?: ComputeRequestMetadata;
}

export interface Diagnostic {
  severity: "error" | "warning" | "info";
  message: string;
  file?: string;
  line?: number;
  column?: number;
}

export interface ArtifactMetadata {
  artifact_id?: string;
  byte_size?: number;
  created_at?: string;
  content_type?: string;
}

export interface ComputeResult {
  ok: boolean;
  target: ComputeTarget;
  operation: ComputeOperation;
  diagnostics: Diagnostic[];
  waveform?: WaveformArtifact;
  counterexample?: WaveformArtifact;
  metadata?: Record<string, string | number | boolean>;
}

export interface IComputeEngine {
  readonly target: ComputeTarget;
  readonly supportedModes: readonly SimulationMode[];
  readonly capabilities?: BrowserSimulationCapabilities;
  execute(request: ComputeRequest, signal?: AbortSignal): Promise<ComputeResult>;
}

export function isSimulationMode(value: string): value is SimulationMode {
  return value === "fast_2state" ||
    value === "accurate_4state" ||
    value === "formal";
}

export interface ManifestValidation {
  ok: boolean;
  manifest?: ProjectManifest;
  errors: Diagnostic[];
}

export function parseKonaManifest(source: string): ManifestValidation {
  let raw: Record<string, unknown>;

  try {
    const parsed: unknown = JSON.parse(source);
    raw = parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    raw = parseSimpleYaml(source);
  }

  const errors: Diagnostic[] = [];
  const knownKeys = new Set([
    "project_name", "top_module", "rtl_files", "include_dirs",
    "sim_mode", "testbench", "waveform_signals",
  ]);
  for (const key of Object.keys(raw)) {
    if (!knownKeys.has(key)) {
      errors.push({ severity: "error", message: `Unknown manifest field: ${key}` });
    }
  }
  const requiredStrings = ["project_name", "top_module"] as const;
  for (const key of requiredStrings) {
    if (typeof raw[key] !== "string" || raw[key].trim() === "") {
      errors.push({ severity: "error", message: `Missing required string: ${key}` });
    }
  }

  if (!Array.isArray(raw.rtl_files) || raw.rtl_files.length === 0 ||
      raw.rtl_files.some((value) => typeof value !== "string" || value.trim() === "")) {
    errors.push({ severity: "error", message: "rtl_files must contain at least one non-empty file path" });
  }
  if (typeof raw.top_module === "string" &&
      !/^[A-Za-z_][A-Za-z0-9_$]*$/.test(raw.top_module)) {
    errors.push({ severity: "error", message: "top_module must be a valid Verilog identifier" });
  }
  if (typeof raw.sim_mode !== "string" || !isSimulationMode(raw.sim_mode)) {
    errors.push({
      severity: "error",
      message: "sim_mode must be fast_2state, accurate_4state, or formal",
    });
  }

  for (const key of ["include_dirs", "waveform_signals"] as const) {
    if (raw[key] !== undefined && (!Array.isArray(raw[key]) ||
        raw[key].some((value) => typeof value !== "string" || value.trim() === ""))) {
      errors.push({ severity: "error", message: `${key} must contain only non-empty strings` });
    }
  }
  if (raw.testbench !== undefined &&
      (typeof raw.testbench !== "string" || raw.testbench.trim() === "")) {
    errors.push({ severity: "error", message: "testbench must be a non-empty string" });
  }

  if (errors.length > 0) return { ok: false, errors };

  const manifest: ProjectManifest = {
    project_name: raw.project_name as string,
    top_module: raw.top_module as string,
    rtl_files: raw.rtl_files as string[],
    include_dirs: asStringArray(raw.include_dirs),
    sim_mode: raw.sim_mode as SimulationMode,
    testbench: typeof raw.testbench === "string" ? raw.testbench : undefined,
    waveform_signals: asStringArray(raw.waveform_signals),
  };
  return { ok: true, manifest, errors: [] };
}

function asStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value as string[]
    : undefined;
}

function parseSimpleYaml(source: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let activeArray: string[] | undefined;
  let activeKey: string | undefined;

  for (const line of source.replace(/\r/g, "").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (/^- /.test(trimmed) && activeKey && activeArray) {
      activeArray.push(trimmed.slice(2).trim().replace(/^["']|["']$/g, ""));
      continue;
    }

    const match = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(trimmed);
    if (!match) continue;

    activeKey = match[1];
    const value = match[2].trim();
    if (value === "") {
      activeArray = [];
      result[activeKey] = activeArray;
    } else {
      activeArray = undefined;
      result[activeKey] = value.replace(/^["']|["']$/g, "");
    }
  }
  return result;
}
