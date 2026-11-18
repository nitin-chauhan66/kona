export type WaveformFormat = "vcd" | "fst";

export type WaveformTimeUnit =
  | "fs"
  | "ps"
  | "ns"
  | "us"
  | "ms"
  | "s";

export interface WaveformTimestamp {
  value: number;
  unit: WaveformTimeUnit;
}

export interface WaveformTimeRange {
  start: WaveformTimestamp;
  end: WaveformTimestamp;
}

export interface WaveformSourceReference {
  file: string;
  line?: number;
  column?: number;
  hierarchy?: string;
  symbol?: string;
}

export interface WaveformSignal {
  name: string;
  width?: number;
  source?: WaveformSourceReference;
}

export interface WaveformArtifact {
  artifact_id?: string;
  byte_size?: number;
  created_at?: string;
  content_type?: string;
  path: string;
  format: WaveformFormat;
  signal_names: string[];
  duration_fs?: number;
  timescale_fs?: number;
  signal_count?: number;
  sample_count?: number;
  time_range?: WaveformTimeRange;
  timestamps?: WaveformTimestamp[];
  signals?: WaveformSignal[];
  sources?: WaveformSourceReference[];
}

export type WaveformRadix =
  | "binary"
  | "octal"
  | "decimal"
  | "signed"
  | "unsigned"
  | "hex";

export interface WaveformCursor {
  timestamp: WaveformTimestamp;
  signal_name?: string;
}

export interface WaveformZoom {
  start: WaveformTimestamp;
  end: WaveformTimestamp;
}

export interface WaveformGroup {
  id: string;
  name: string;
  signal_names: string[];
  expanded?: boolean;
}

export interface WaveformSession {
  artifact: {
    path: string;
    format: WaveformFormat;
  };
  cursor: WaveformCursor | null;
  zoom: WaveformZoom | null;
  grouping: WaveformGroup[];
  radix: Record<string, WaveformRadix>;
}

export type WaveformViewSession = WaveformSession;

export interface WaveformValidation {
  ok: boolean;
  errors: string[];
}

export function isWaveformFormat(value: unknown): value is WaveformFormat {
  return value === "vcd" || value === "fst";
}

export function isWaveformRadix(value: unknown): value is WaveformRadix {
  return value === "binary" || value === "octal" ||
    value === "decimal" || value === "signed" ||
    value === "unsigned" || value === "hex";
}

export function validateWaveformArtifact(
  artifact: unknown,
): WaveformValidation {
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
    return { ok: false, errors: ["artifact must be an object"] };
  }

  const value = artifact as Record<string, unknown>;
  const errors: string[] = [];
  if (typeof value.path !== "string" || value.path.trim() === "") {
    errors.push("path must be a non-empty string");
  }
  if (!isWaveformFormat(value.format)) {
    errors.push("format must be vcd or fst");
  }
  if (!Array.isArray(value.signal_names) ||
      value.signal_names.some((name) => typeof name !== "string" || name.trim() === "")) {
    errors.push("signal_names must contain only non-empty strings");
  }
  if (value.duration_fs !== undefined &&
      (typeof value.duration_fs !== "number" ||
       !Number.isFinite(value.duration_fs) ||
       value.duration_fs < 0)) {
    errors.push("duration_fs must be a non-negative finite number");
  }
  return { ok: errors.length === 0, errors };
}

export function validateWaveformSession(
  session: unknown,
): WaveformValidation {
  if (!session || typeof session !== "object" || Array.isArray(session)) {
    return { ok: false, errors: ["session must be an object"] };
  }

  const value = session as Record<string, unknown>;
  const errors: string[] = [];
  const artifact = value.artifact;
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
    errors.push("artifact must be an object");
  } else {
    const artifactValue = artifact as Record<string, unknown>;
    if (typeof artifactValue.path !== "string" || artifactValue.path.trim() === "") {
      errors.push("artifact.path must be a non-empty string");
    }
    if (!isWaveformFormat(artifactValue.format)) {
      errors.push("artifact.format must be vcd or fst");
    }
  }
  if (!Array.isArray(value.grouping)) {
    errors.push("grouping must be an array");
  }
  if (!value.radix || typeof value.radix !== "object" || Array.isArray(value.radix)) {
    errors.push("radix must be an object");
  } else {
    for (const radix of Object.values(value.radix)) {
      if (!isWaveformRadix(radix)) {
        errors.push("radix values must be supported radix names");
        break;
      }
    }
  }
  if (value.cursor !== null && typeof value.cursor !== "object") {
    errors.push("cursor must be an object or null");
  }
  if (value.zoom !== null && typeof value.zoom !== "object") {
    errors.push("zoom must be an object or null");
  }
  return { ok: errors.length === 0, errors };
}
