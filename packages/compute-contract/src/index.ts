export type ComputeTarget = "web-wasm" | "desktop-native" | "headless-cli";

export type SimulationMode = "fast_2state" | "accurate_4state" | "formal";

export type ComputeOperation = "lint" | "run" | "prove";

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

export interface ComputeRequest {
  operation: ComputeOperation;
  manifest: ProjectManifest;
  toolchain?: ToolchainVersions;
  signal_names?: string[];
  workspace_root?: string;
}

export interface Diagnostic {
  severity: "error" | "warning" | "info";
  message: string;
  file?: string;
  line?: number;
  column?: number;
}

export interface WaveformArtifact {
  path: string;
  format: "vcd" | "fst";
  duration_fs?: number;
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
  execute(request: ComputeRequest, signal?: AbortSignal): Promise<ComputeResult>;
}

export function isSimulationMode(value: string): value is SimulationMode {
  return value === "fast_2state" ||
    value === "accurate_4state" ||
    value === "formal";
}
