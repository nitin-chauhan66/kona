export type VcdDiagnosticSeverity = "error" | "warning";

export interface VcdDiagnostic {
  severity: VcdDiagnosticSeverity;
  code:
    | "missing_enddefinitions"
    | "missing_timescale"
    | "invalid_timescale"
    | "invalid_scope"
    | "invalid_var"
    | "invalid_timestamp"
    | "timestamp_regression"
    | "unknown_identifier"
    | "invalid_scalar"
    | "invalid_vector"
    | "vector_width_mismatch"
    | "empty_source";
  message: string;
  line?: number;
  column?: number;
}

export interface VcdSignal {
  id: string;
  name: string;
  width: number;
  type: string;
  hierarchy?: string;
  reference?: string;
}

export interface VcdValueChange {
  timestamp: number;
  signalId: string;
  value: string;
  kind: "scalar" | "vector";
}

export interface VcdParseResult {
  ok: boolean;
  diagnostics: VcdDiagnostic[];
  signals: VcdSignal[];
  changes: VcdValueChange[];
  timescaleFs?: number;
  duration?: number;
  endTime?: number;
  sampleCount: number;
}

export interface VcdWorkerParser {
  parse(source: string, signal?: AbortSignal): Promise<VcdParseResult>;
  terminate(): void;
}

interface VcdScope {
  kind: string;
  name: string;
}

function diagnostic(
  severity: VcdDiagnosticSeverity,
  code: VcdDiagnostic["code"],
  message: string,
  line?: number,
  column?: number,
): VcdDiagnostic {
  return { severity, code, message, line, column };
}

function parseTimescale(body: string, line: number): number | undefined {
  const match = /^\s*([0-9]+(?:\.[0-9]+)?|\.[0-9]+)\s*(s|ms|us|ns|ps|fs)\s*$/.exec(body);
  if (!match) return undefined;
  const scales: Record<string, number> = { s: 1e15, ms: 1e12, us: 1e9, ns: 1e6, ps: 1e3, fs: 1 };
  return Number(match[1]) * scales[match[2]];
}

export function parseVcd(source: string): VcdParseResult {
  const diagnostics: VcdDiagnostic[] = [];
  const signals: VcdSignal[] = [];
  const changes: VcdValueChange[] = [];
  const signalsById = new Map<string, VcdSignal>();
  const scopes: VcdScope[] = [];
  let timescaleFs: number | undefined;
  let sawEndDefinitions = false;
  let sawTimescale = false;
  let inDefinitions = true;
  let currentTime = 0;
  let endTime = 0;

  if (source.trim().length === 0) {
    diagnostics.push(diagnostic("error", "empty_source", "VCD source is empty"));
  }

  const lines = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  for (let index = 0; index < lines.length; index++) {
    const lineNumber = index + 1;
    const raw = lines[index].trim();
    if (!raw) continue;

    if (raw.startsWith("$")) {
      if (/^\$timescale\b/.test(raw)) {
        sawTimescale = true;
        const match = /^\$timescale\s+([\s\S]*?)\s+\$end\s*$/.exec(raw);
        const body = match ? match[1] : raw.replace(/^\$timescale/, "").replace(/\$end\s*$/, "").trim();
        const parsed = parseTimescale(body, lineNumber);
        if (parsed === undefined) {
          diagnostics.push(diagnostic("error", "invalid_timescale", "Invalid $timescale value; use a value and unit such as '10 ns'.", lineNumber));
        } else {
          timescaleFs = parsed;
        }
        continue;
      }

      if (/^\$scope\b/.test(raw)) {
        const match = /^\$scope\s+(\S+)\s+(\S+)\s+\$end\s*$/.exec(raw);
        if (!match) {
          diagnostics.push(diagnostic("error", "invalid_scope", "Malformed $scope declaration; expected '$scope scope_type name $end'.", lineNumber));
        } else {
          scopes.push({ kind: match[1], name: match[2] });
        }
        continue;
      }
      if (/^\$upscope\b/.test(raw)) {
        scopes.pop();
        continue;
      }
      if (/^\$var\b/.test(raw)) {
        const match = /^\$var\s+(\S+)\s+(\d+)\s+(\S+)\s+(.+?)\s+\$end\s*$/.exec(raw);
        if (!match) {
          diagnostics.push(diagnostic("error", "invalid_var", "Malformed $var declaration; expected '$var type width identifier reference $end'.", lineNumber));
        } else {
          const [, type, widthText, id, remainder] = match;
          const width = Number(widthText);
          if (!Number.isSafeInteger(width) || width < 1) {
            diagnostics.push(diagnostic("error", "invalid_var", `Invalid signal width '${widthText}'.`, lineNumber));
            continue;
          }
          const remainderParts = remainder.trim().split(/\s+/);
          const reference = remainderParts[0] || "";
          const name = reference.replace(/^\[.*\]$/, "");
          const hierarchy = scopes.map((scope) => scope.name).join(".");
          const signal: VcdSignal = {
            id,
            name,
            width,
            type,
            hierarchy: hierarchy || undefined,
            reference: remainder.trim() || undefined,
          };
          if (signalsById.has(id)) {
            diagnostics.push(diagnostic("error", "invalid_var", `Duplicate identifier '${id}' in $var declarations.`, lineNumber));
          } else {
            signals.push(signal);
            signalsById.set(id, signal);
          }
        }
        continue;
      }
      if (/^\$enddefinitions\b/.test(raw)) {
        sawEndDefinitions = true;
        inDefinitions = false;
        continue;
      }
      continue;
    }

    if (raw.startsWith("#")) {
      if (!/^#(\d+)$/.test(raw)) {
        diagnostics.push(diagnostic("error", "invalid_timestamp", `Malformed timestamp '${raw}'; expected '#0' or another non-negative integer.`, lineNumber, 1));
        continue;
      }
      const nextTime = Number(raw.slice(1));
      if (!Number.isSafeInteger(nextTime) || nextTime < 0) {
        diagnostics.push(diagnostic("error", "invalid_timestamp", `Timestamp '${raw}' is outside the supported integer range.`, lineNumber, 1));
        continue;
      }
      if (nextTime < currentTime) {
        diagnostics.push(diagnostic("error", "timestamp_regression", `Timestamp ${nextTime} is earlier than preceding timestamp ${currentTime}.`, lineNumber, 1));
      }
      currentTime = nextTime;
      endTime = nextTime;
      continue;
    }

    if (inDefinitions) {
      continue;
    }

    let value: string;
    let id: string;
    let kind: "scalar" | "vector";
    if (/^[bBoOrRsS]/.test(raw)) {
      const parts = raw.split(/\s+/);
      if (parts.length !== 2) {
        diagnostics.push(diagnostic("error", "invalid_vector", `Malformed vector change '${raw}'. Use '<value> <identifier>'.`, lineNumber));
        continue;
      }
      const prefix = parts[0][0];
      id = parts[1];
      value = parts[0].slice(1);
      kind = "vector";
      if (prefix.toLowerCase() === "b") {
        if (!/^[01xXzZ]+$/.test(value)) {
          diagnostics.push(diagnostic("error", "invalid_vector", `Invalid binary vector value '${value}' for identifier '${id}'.`, lineNumber, 1));
          continue;
        }
      } else if (prefix.toLowerCase() === "r") {
        if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) {
          diagnostics.push(diagnostic("error", "invalid_vector", `Invalid real vector value '${value}' for identifier '${id}'.`, lineNumber, 1));
          continue;
        }
      } else if (prefix.toLowerCase() === "s") {
        if (value.length === 0) {
          diagnostics.push(diagnostic("error", "invalid_vector", `Empty string vector value for identifier '${id}'.`, lineNumber, 1));
          continue;
        }
      }
    } else {
      const match = /^([01xXzZhHuUwWlL\-])(\S+)$/.exec(raw);
      if (!match) {
        diagnostics.push(diagnostic("error", "invalid_scalar", `Malformed scalar change '${raw}'. Use '0<identifier>', '1<identifier>', or a logic-state plus identifier.`, lineNumber));
        continue;
      }
      value = match[1];
      id = match[2];
      kind = "scalar";
    }

    const signal = signalsById.get(id);
    if (!signal) {
      diagnostics.push(diagnostic("error", "unknown_identifier", `Value change references unknown identifier '${id}' at timestamp ${currentTime}.`, lineNumber));
      continue;
    }
    if (kind === "vector" && /^b/i.test(raw) && value.length !== signal.width) {
      diagnostics.push(diagnostic("error", "vector_width_mismatch", `Vector value '${value}' has ${value.length} bits, but signal '${signal.name}' has width ${signal.width}.`, lineNumber));
      continue;
    }
    changes.push({ timestamp: currentTime, signalId: id, value, kind });
  }

  if (!sawTimescale) {
    diagnostics.push(diagnostic("warning", "missing_timescale", "No $timescale declaration found; waveform timestamps use VCD ticks."));
  }
  if (!sawEndDefinitions) {
    diagnostics.push(diagnostic("error", "missing_enddefinitions", "Missing $enddefinitions declaration; signal changes may precede a complete VCD header."));
  }

  return {
    ok: !diagnostics.some((item) => item.severity === "error"),
    diagnostics,
    signals,
    changes,
    timescaleFs,
    duration: timescaleFs === undefined ? undefined : endTime * timescaleFs,
    endTime,
    sampleCount: changes.length,
  };
}

export function createVcdWorkerParser(
  workerUrl = "/vcd-parser-worker.js",
): VcdWorkerParser {
  type WorkerGlobal = {
    Worker: new (
      url: string | URL,
      options?: { type?: string },
    ) => VcdWorkerLike;
  };
  type VcdWorkerLike = {
    postMessage(message: unknown): void;
    terminate(): void;
    onmessage: ((event: { data: unknown }) => void) | null;
    onerror: ((event: { message?: string }) => void) | null;
  };

  const WorkerConstructor = (globalThis as unknown as WorkerGlobal).Worker;
  if (typeof WorkerConstructor !== "function") {
    throw new Error("Web Workers are unavailable in this environment");
  }

  let worker: VcdWorkerLike | undefined;
  let sequence = 0;
  const pending = new Map<number, { resolve: (value: VcdParseResult) => void; reject: (error: Error) => void }>();

  function getWorker(): VcdWorkerLike {
    if (worker) return worker;
    worker = new WorkerConstructor(workerUrl, { type: "module" });
    worker.onmessage = (event) => {
      const message = event.data as {
        id?: number;
        ok?: boolean;
        result?: VcdParseResult;
        error?: string;
      };
      if (typeof message.id !== "number") return;
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      if (message.ok && message.result) request.resolve(message.result);
      else request.reject(new Error(message.error || "VCD parsing failed"));
    };
    worker.onerror = (event) => {
      for (const request of pending.values()) {
        request.reject(new Error(event.message || "VCD parser worker failed"));
      }
      pending.clear();
    };
    return worker;
  }

  return {
    parse(source, signal) {
      return new Promise<VcdParseResult>((resolve, reject) => {
        if (signal?.aborted) {
          reject(new DOMException("VCD parsing was cancelled", "AbortError"));
          return;
        }
        const id = ++sequence;
        pending.set(id, { resolve, reject });
        const abort = () => {
          if (!pending.delete(id)) return;
          reject(new DOMException("VCD parsing was cancelled", "AbortError"));
        };
        signal?.addEventListener("abort", abort, { once: true });
        getWorker().postMessage({ id, source });
      });
    },
    terminate() {
      worker?.terminate();
      worker = undefined;
      for (const request of pending.values()) {
        request.reject(new Error("VCD parser worker terminated"));
      }
      pending.clear();
    },
  };
}
