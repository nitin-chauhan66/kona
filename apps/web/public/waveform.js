export function normalizeWaveformResult(result, fileName) {
  const parsed = result?.artifact ? result : { artifact: result, transitions: result?.transitions };
  const artifact = parsed.artifact;
  if (!artifact || typeof artifact !== "object") {
    throw new Error("Waveform parser returned no artifact object");
  }
  const names = Array.isArray(artifact.signal_names)
    ? artifact.signal_names
    : Array.isArray(parsed.signals)
      ? parsed.signals.map((signal) => typeof signal === "string" ? signal : signal.name).filter(Boolean)
      : [];
  if (names.length === 0) throw new Error("Waveform parser returned no signal names");

  const signals = names.map((name) => {
    const supplied = parsed.signals?.find((signal) => signal && typeof signal === "object" && signal.name === name);
    return {
      name,
      width: Number.isFinite(supplied?.width) ? supplied.width : 1,
      source: supplied?.source,
    };
  });
  const transitions = {};
  for (const name of names) {
    const samples = parsed.transitions?.[name];
    transitions[name] = Array.isArray(samples)
      ? samples.map((sample) => ({
          timestamp: typeof sample.timestamp === "number"
            ? sample.timestamp
            : typeof sample.time === "number" ? sample.time : 0,
          value: String(sample.value ?? sample.val ?? "x"),
        })).sort((a, b) => a.timestamp - b.timestamp)
      : [];
  }
  const start = Number.isFinite(artifact.time_range?.start?.value)
    ? artifact.time_range.start.value : 0;
  const end = Number.isFinite(artifact.time_range?.end?.value)
    ? artifact.time_range.end.value
    : Number.isFinite(artifact.duration_fs) ? artifact.duration_fs : 100;
  return {
    artifact: {
      ...artifact,
      path: typeof artifact.path === "string" ? artifact.path : fileName,
      format: "vcd",
      signal_names: names,
      time_range: { start: { value: start, unit: artifact.time_range?.start?.unit || "fs" }, end: { value: end, unit: artifact.time_range?.end?.unit || "fs" } },
    },
    signals,
    transitions,
  };
}

export function formatWaveValue(value, radix, width = 1) {
  const text = String(value).toLowerCase();
  if (text === "x" || text === "z" || /[^01xzh]/.test(text)) return text.toUpperCase();
  if (radix === "binary") return text;
  if (radix === "hex") {
    const bits = text.replace(/[^01]/g, "");
    if (!bits || /[xz]/.test(text)) return text;
    return `0x${(parseInt(bits, 2) >>> 0).toString(16).padStart(Math.max(1, Math.ceil(width / 4)), "0")}`;
  }
  if (radix === "octal") {
    if (!/^[01]+$/.test(text)) return text;
    return `0o${parseInt(text, 2).toString(8)}`;
  }
  if (radix === "decimal" || radix === "signed" || radix === "unsigned") {
    if (!/^[01]+$/.test(text)) return text;
    let number = parseInt(text, 2);
    if (radix === "signed" && width > 1 && text[0] === "1") {
      number -= 2 ** Math.min(width, 31);
    }
    return String(number);
  }
  return text;
}
