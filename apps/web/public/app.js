import { parseKonaManifest } from "@kona/compute-contract";
import { Exit, runYosys, version as yosysVersion } from "@yowasp/yosys";
import {
  normalizeWaveformResult,
  formatWaveValue,
} from "./waveform.js";
import { createVcdWorkerParser } from "./vcd-parser.js";

const manifest = document.querySelector("#manifest");
const results = document.querySelector("#results");
const status = document.querySelector("#status");
const runButton = document.querySelector("#runButton");
const workspaceFiles = document.querySelector("#workspaceFiles");
const capability = document.querySelector("#capability");
const operationButtons = [...document.querySelectorAll("[data-operation]")];
const paneButtons = [...document.querySelectorAll("[data-pane]")];
const editorPane = document.querySelector(".editor-pane");
const resultsPane = document.querySelector(".results-pane");
const waveformPane = document.querySelector("#waveformPane");
let operation = "lint";
let saveTimer;
let saveSequence = 0;
let runInProgress = false;
let runSequence = 0;
const localSessionKey = "kona-session";
const selectedFiles = new Map();
const browserLimits = {
  maxFiles: 256,
  maxBytes: 8 * 1024 * 1024,
};

loadSession();
setStatus(`Browser WASM ready (Yosys ${yosysVersion})`, "success");
restoreWorkspace();
initWaveformViewer();

workspaceFiles.addEventListener("change", async () => {
  selectedFiles.clear();
  const paths = [...workspaceFiles.files].map((file) => file.webkitRelativePath || file.name);
  const root = paths.length > 0 && paths.every((file) => file.includes("/"))
    ? paths[0].split("/")[0]
    : "";
  for (const file of workspaceFiles.files) {
    const path = (file.webkitRelativePath || file.name)
      .replace(root ? `${root}/` : "", "");
    selectedFiles.set(path, await file.text());
  }
  await persistWorkspace();
  setStatus(`${selectedFiles.size} workspace files loaded`, "success");
});

manifest.addEventListener("input", () => {
  window.clearTimeout(saveTimer);
  setStatus("Saving session", "loading");
  saveTimer = window.setTimeout(saveSession, 500);
});

async function loadSession() {
  setStatus("Loading session", "loading");
  try {
    const response = await fetch("/api/session");
    if (response.status === 404) {
      restoreLocalSession();
      return;
    }
    if (!response.ok) {
      const payload = await readJson(response);
      setStatus(typeof payload.error === "string" ? payload.error : "Session unavailable", "error");
      setInitialResults();
      return;
    }
    const session = await readJson(response);
    if (typeof session.manifest === "string") manifest.value = session.manifest;
    if (["lint", "run", "prove"].includes(session.operation)) {
      selectOperation(session.operation);
    }
    if (session.waveform) restoreWaveformSession(session.waveform);
    setStatus("Session restored", "success");
    await restoreWorkspace();
    await updateCapabilities();
  } catch {
    restoreLocalSession();
  }
}

function restoreLocalSession() {
  const saved = readLocalSession();
  if (saved) {
    if (typeof saved.manifest === "string") manifest.value = saved.manifest;
    if (["lint", "run", "prove"].includes(saved.operation)) selectOperation(saved.operation);
    if (saved.waveform) restoreWaveformSession(saved.waveform);
    setStatus("Standalone session restored", "success");
  } else {
    setStatus("Standalone browser mode", "success");
    setInitialResults();
  }
  updateCapabilities();
  restoreWorkspace();
}

async function saveSession() {
  const sequence = ++saveSequence;
  const startedRunSequence = runSequence;
  const session = { manifest: manifest.value, operation, waveform: getWaveformSession() };
  localStorage.setItem(localSessionKey, JSON.stringify(session));
  try {
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manifest: manifest.value, operation, waveform: getWaveformSession() }),
    });
    if (!response.ok) {
      const payload = await readJson(response);
      throw new Error(typeof payload.error === "string" ? payload.error : "Save failed");
    }

    if (sequence === saveSequence && startedRunSequence === runSequence && !runInProgress) {
      setStatus("Session saved", "success");
    }
  } catch (error) {
    if (sequence === saveSequence && startedRunSequence === runSequence && !runInProgress) {
      setStatus("Session saved locally", "success");
    }
  }
}

async function updateCapabilities() {
  try {
    const response = await fetch("/api/toolchain");
    if (!response.ok) throw new Error("Native toolchain unavailable");
    const payload = await readJson(response);
    const tools = payload.tools || {};
    const available = Object.entries(tools)
      .filter(([, version]) => version !== "unavailable")
      .map(([name]) => name);
    capability.textContent = available.length > 0
      ? `Native mode connected: ${available.join(", ")}. Browser WASM lint is also available.`
      : "Browser mode: Yosys WASM lint and Verilator WASM compile checks are available. Simulation and formal proof use native engines when connected.";
  } catch {
    capability.textContent = "Standalone browser mode: Yosys WASM lint and Verilator WASM compile checks are available. Simulation and formal proof require the native app or CLI.";
  }
}

operationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectOperation(button.dataset.operation);
    window.clearTimeout(saveTimer);
    setStatus("Saving session", "loading");
    saveTimer = window.setTimeout(saveSession, 200);
  });
});

function selectOperation(nextOperation) {
  if (!["lint", "run", "prove"].includes(nextOperation)) return;
  operation = nextOperation;
  operationButtons.forEach((button) => {
    const active = button.dataset.operation === operation;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  runButton.textContent = `Run ${operation[0].toUpperCase()}${operation.slice(1)}`;
  runButton.setAttribute("aria-label", `Run ${operation} operation`);
}

runButton.addEventListener("click", run);

manifest.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    const start = manifest.selectionStart;
    const end = manifest.selectionEnd;
    manifest.setRangeText("  ", start, end, "end");
  }
});

async function run() {
  runSequence += 1;
  runInProgress = true;
  window.clearTimeout(saveTimer);
  runButton.disabled = true;
  runButton.textContent = "Running...";
  setStatus("Running", "loading");
  results.replaceChildren(makeMuted("Executing Kona…"));

  try {
    const validation = parseKonaManifest(manifest.value);
    if (!validation.ok || !validation.manifest) {
      setStatus("Failed", "error");
      renderDiagnostics(validation.errors);
      return;
    }
    const payload = await executeBrowserOrServer(validation.manifest);
    const diagnostics = Array.isArray(payload.diagnostics) ? payload.diagnostics : [];
    setStatus(payload.ok ? "Passed" : "Failed", payload.ok ? "success" : "error");
    renderDiagnostics(diagnostics);
  } catch (error) {
    setStatus("Failed", "error");
    const diagnostic = document.createElement("div");
    diagnostic.className = "diagnostic error";
    diagnostic.textContent = error instanceof Error ? error.message : String(error);
    results.replaceChildren(diagnostic);
  } finally {
    runInProgress = false;
    runButton.disabled = false;
    runButton.textContent = `Run ${operation[0].toUpperCase()}${operation.slice(1)}`;
  }

  async function executeBrowserOrServer(projectManifest) {
    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation, manifest: manifest.value }),
      });
      const payload = await readJson(response);
      if (response.ok && payload && typeof payload.ok === "boolean") return payload;
    } catch {
      // Static deployments intentionally use the local WASM engine below.
    }
    if (operation === "lint") return runBrowserLint(projectManifest);
    if (operation === "run" && projectManifest.sim_mode === "fast_2state") {
      return runBrowserVerilatorCheck(projectManifest);
    }
    return {
      ok: false,
      diagnostics: [{
        severity: "warning",
        message: `Standalone browser mode does not provide ${operation} execution. Use the native Docker/CLI engine.`,
      }],
    };
  }

  async function runBrowserVerilatorCheck(projectManifest) {
    const files = Object.fromEntries(selectedFiles);
    const missing = projectManifest.rtl_files.filter((file) => !selectedFiles.has(file));
    if (projectManifest.testbench && !selectedFiles.has(projectManifest.testbench)) {
      missing.push(projectManifest.testbench);
    }
    if (missing.length > 0) {
      return {
        ok: false,
        diagnostics: [{
          severity: "error",
          message: `Load the RTL workspace directory; missing ${missing.join(", ")}`,
        }],
      };
    }
    if (selectedFiles.size > browserLimits.maxFiles) {
      return {
        ok: false,
        diagnostics: [{
          severity: "error",
          message: `Browser workspace exceeds ${browserLimits.maxFiles} files. Use the native engine handoff.`,
        }],
      };
    }
    const byteSize = [...selectedFiles.values()]
      .reduce((total, source) => total + new TextEncoder().encode(source).byteLength, 0);
    if (byteSize > browserLimits.maxBytes) {
      return {
        ok: false,
        diagnostics: [{
          severity: "error",
          message: `Browser workspace exceeds ${browserLimits.maxBytes / 1024 / 1024} MiB. Use the native engine handoff.`,
        }],
      };
    }
    const args = [
      "--lint-only",
      "--language", "1800-2012",
      "--top-module", projectManifest.top_module,
      ...(projectManifest.include_dirs ?? []).map((directory) => `-I${directory}`),
      ...projectManifest.rtl_files,
      ...(projectManifest.testbench ? [projectManifest.testbench] : []),
    ];
    try {
      const result = await runVerilatorWorker({ ...files, "/dev/null": "" }, args);
      if (!result.ok) {
        return { ok: false, diagnostics: parseToolOutput(result.stderr || result.error || "Verilator WASM failed") };
      }
      return {
        ok: false,
        diagnostics: [
          { severity: "info", message: "Verilator WASM compile check passed." },
          { severity: "warning", message: "Standalone browser simulation is not available because Verilator execution requires a native build step. Use Docker/CLI for the run result." },
        ],
      };
    } catch (error) {
      return {
        ok: false,
        diagnostics: [{
          severity: "error",
          message: error instanceof Error ? error.message : String(error),
        }],
      };
    }
  }

  async function runBrowserLint(projectManifest) {
    const missing = projectManifest.rtl_files.filter((file) => !selectedFiles.has(file));
    if (missing.length > 0) {
      return {
        ok: false,
        diagnostics: [{
          severity: "error",
          message: `Load the RTL workspace directory; missing ${missing.join(", ")}`,
        }],
      };
    }
    const tree = {};
    for (const [file, source] of selectedFiles) {
      let node = tree;
      const parts = file.split("/").filter(Boolean);
      for (const part of parts.slice(0, -1)) node = node[part] ||= {};
      node[parts.at(-1)] = new TextEncoder().encode(source);
    }
    const output = [];
    const errors = [];
    const decode = new TextDecoder();
    try {
      const includeArgs = (projectManifest.include_dirs ?? [])
        .map((directory) => `-I${directory}`)
        .join(" ");
      await runYosys([
        "-p",
        `read_verilog -sv ${includeArgs} ${projectManifest.rtl_files.join(" ")}; hierarchy -check -top ${projectManifest.top_module}; proc; check`,
      ], tree, {
        stdout: (bytes) => { if (bytes) output.push(decode.decode(bytes)); },
        stderr: (bytes) => { if (bytes) errors.push(decode.decode(bytes)); },
      });
      return {
        ok: true,
        diagnostics: [{ severity: "info", message: `Browser Yosys lint passed (${yosysVersion}).` }],
      };
    } catch (error) {
      const message = errors.join("") || (error instanceof Exit ? `Yosys exited with code ${error.code}` : String(error));
      return { ok: false, diagnostics: parseToolOutput(message) };
    }
  }

  function parseToolOutput(output) {
    return output.split(/\r?\n/).filter(Boolean).map((message) => ({
      severity: /error/i.test(message) ? "error" : "warning",
      message: message.replace(/\x1b\[[0-9;]*m/g, ""),
    }));
  }

}

function runVerilatorWorker(files, args) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("/verilator-worker.js", { type: "module" });
    const id = crypto.randomUUID();
    const cleanup = () => {
      worker.onmessage = null;
      worker.onerror = null;
      void worker.terminate();
    };
    worker.onmessage = (event) => {
      if (event.data?.id !== id) return;
      cleanup();
      resolve(event.data);
    };
    worker.onerror = (event) => {
      cleanup();
      reject(new Error(event.message || "Verilator WASM worker failed"));
    };
    worker.postMessage({ id, files, args });
  });
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function readLocalSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(localSessionKey) || "null");
    return saved && typeof saved === "object" ? saved : null;
  } catch {
    return null;
  }
}

async function persistWorkspace() {
  if (!navigator.storage?.getDirectory) return;
  const root = await navigator.storage.getDirectory();
  const workspace = await root.getDirectoryHandle("kona-workspace", { create: true });
  for (const [file, source] of selectedFiles) {
    let directory = workspace;
    const parts = file.split("/").filter(Boolean);
    for (const part of parts.slice(0, -1)) {
      directory = await directory.getDirectoryHandle(part, { create: true });
    }
    const handle = await directory.getFileHandle(parts.at(-1), { create: true });
    const writable = await handle.createWritable();
    await writable.write(source);
    await writable.close();
  }
}

async function restoreWorkspace() {
  if (!navigator.storage?.getDirectory) return;
  try {
    const root = await navigator.storage.getDirectory();
    const workspace = await root.getDirectoryHandle("kona-workspace");
    await readWorkspaceDirectory(workspace, "");
    if (selectedFiles.size > 0) setStatus(`${selectedFiles.size} workspace files restored`, "success");
  } catch {
    // A workspace is optional; the file picker remains available.
  }
}

async function readWorkspaceDirectory(directory, prefix) {
  for await (const [name, handle] of directory.entries()) {
    const path = prefix ? `${prefix}/${name}` : name;
    if (handle.kind === "directory") {
      await readWorkspaceDirectory(handle, path);
    } else {
      selectedFiles.set(path, await (await handle.getFile()).text());
    }
  }
}

function setStatus(text, state, detail) {
  status.textContent = text;
  status.dataset.state = state;
  status.title = detail instanceof Error ? detail.message : "";
}

function setInitialResults() {
  results.replaceChildren(makeMuted("Edit the project manifest, then run the selected operation."));
}

let waveFile = document.querySelector("#waveformFile");
let waveArtifactName = document.querySelector("#waveArtifactName");
let waveCursorLabel = document.querySelector("#waveCursor");
let waveSignalList = document.querySelector("#waveSignalList");
let waveGroupList = document.querySelector("#waveGroupList");
let waveTimeline = document.querySelector("#waveTimeline");
let waveEmpty = document.querySelector("#waveEmpty");
let waveRadix = document.querySelector("#waveRadix");
const waveState = {
  artifact: null,
  model: null,
  selected: [],
  cursor: null,
  zoom: null,
  grouping: [],
  radix: {},
};
let waveSaveTimer;

function initWaveformViewer() {
  waveFile = waveFile || document.querySelector("#waveformFile");
  waveArtifactName = waveArtifactName || document.querySelector("#waveArtifactName");
  waveCursorLabel = waveCursorLabel || document.querySelector("#waveCursor");
  waveSignalList = waveSignalList || document.querySelector("#waveSignalList");
  waveGroupList = waveGroupList || document.querySelector("#waveGroupList");
  waveTimeline = waveTimeline || document.querySelector("#waveTimeline");
  waveEmpty = waveEmpty || document.querySelector("#waveEmpty");
  waveRadix = waveRadix || document.querySelector("#waveRadix");
  if (!waveFile || !waveArtifactName || !waveCursorLabel || !waveSignalList
    || !waveGroupList || !waveTimeline || !waveEmpty || !waveRadix
    || !waveformPane || !editorPane || !resultsPane) {
    return;
  }
  if (!globalThis.KonaWaveformParser) {
    const workerParser = createVcdWorkerParser();
    globalThis.KonaWaveformParser = {
      parseVcd: async (file) => {
        const parsed = await workerParser.parse(await file.text());
        if (!parsed.ok) {
          const details = parsed.diagnostics
            .filter((diagnostic) => diagnostic.severity === "error")
            .map((diagnostic) => diagnostic.message)
            .join("; ");
          throw new Error(details || "The VCD artifact is malformed");
        }
        const signalNames = parsed.signals.map((signal) =>
          signal.hierarchy ? `${signal.hierarchy}.${signal.name}` : signal.name);
        const namesById = new Map(parsed.signals.map((signal, index) => [signal.id, signalNames[index]]));
        const transitions = Object.fromEntries(signalNames.map((name) => [name, []]));
        for (const change of parsed.changes) {
          const name = namesById.get(change.signalId);
          if (name) transitions[name].push({ timestamp: change.timestamp, value: change.value });
        }
        return {
          artifact: {
            path: file.name,
            format: "vcd",
            signal_names: signalNames,
            duration_fs: parsed.duration,
            timescale_fs: parsed.timescaleFs,
            time_range: {
              start: { value: 0, unit: "fs" },
              end: { value: parsed.duration ?? parsed.endTime, unit: "fs" },
            },
          },
          signals: parsed.signals.map((signal, index) => ({
            name: signalNames[index],
            width: signal.width,
            source: signal.hierarchy ? { hierarchy: signal.hierarchy, symbol: signal.name } : undefined,
          })),
          transitions,
        };
      },
      terminate: () => workerParser.terminate(),
    };
  }
  paneButtons.forEach((button) => button.addEventListener("click", () => {
    const pane = button.dataset.pane;
    paneButtons.forEach((item) => {
      const active = item.dataset.pane === pane;
      item.classList.toggle("active", active);
      item.setAttribute("aria-current", active ? "page" : "false");
    });
    const waveformActive = pane === "waveform";
    editorPane.hidden = waveformActive;
    resultsPane.hidden = waveformActive;
    waveformPane.hidden = !waveformActive;
  }));

  waveFile.addEventListener("change", loadWaveformFile);
  document.querySelector("#waveZoomIn").addEventListener("click", () => zoomWaveform(0.7));
  document.querySelector("#waveZoomOut").addEventListener("click", () => zoomWaveform(1.4));
  document.querySelector("#waveZoomReset").addEventListener("click", () => {
    waveState.zoom = null;
    renderWaveform();
    persistWaveformState();
  });
  waveRadix.addEventListener("change", () => {
    const selected = waveState.selected[0];
    if (selected) waveState.radix[selected] = waveRadix.value;
    else waveState.radix["*"] = waveRadix.value;
    renderWaveform();
    persistWaveformState();
  });
  document.querySelector("#waveGroupSelected").addEventListener("click", () => {
    if (waveState.selected.length === 0) return;
    const name = `Group ${waveState.grouping.length + 1}`;
    waveState.grouping.push({
      id: `group-${Date.now()}`,
      name,
      signal_names: [...waveState.selected],
      expanded: true,
    });
    renderWaveformSignals();
    persistWaveformState();
  });
  restoreWaveformOpfs();
}

async function loadWaveformFile() {
  const file = waveFile.files?.[0];
  if (!file) return;
  const parser = globalThis.KonaWaveformParser;
  if (!parser || typeof parser.parseVcd !== "function") {
    setStatus("VCD parser unavailable", "error");
    waveEmpty.hidden = false;
    waveEmpty.innerHTML = "No parser is connected. Install a WAVE-02 parser that exports "
      + "<code>window.KonaWaveformParser.parseVcd(file)</code>, then retry.";
    return;
  }
  setStatus("Parsing VCD", "loading");
  try {
    const result = await parser.parseVcd(file);
    const normalized = normalizeWaveformResult(result, file.name);
    waveState.artifact = normalized.artifact;
    waveState.model = normalized;
    waveState.selected = normalized.signals.map((signal) => signal.name);
    waveState.zoom = null;
    waveArtifactName.textContent = file.name;
    waveEmpty.hidden = true;
    waveTimeline.hidden = false;
    renderWaveform();
    persistWaveformState();
    setStatus("Waveform loaded", "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus("Waveform load failed", "error");
    waveEmpty.hidden = false;
    waveEmpty.textContent = message;
  }
}

function renderWaveform() {
  renderWaveformSignals();
  renderWaveformTimeline();
  renderCursor();
}

function renderWaveformSignals() {
  waveSignalList.replaceChildren();
  const names = waveState.model?.artifact?.signal_names
    || waveState.artifact?.signal_names
    || [];
  for (const name of names) {
    const row = document.createElement("label");
    row.className = "wave-signal";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = waveState.selected.includes(name);
    checkbox.addEventListener("change", () => {
      waveState.selected = checkbox.checked
        ? [...waveState.selected, name]
        : waveState.selected.filter((selected) => selected !== name);
      renderWaveform();
      persistWaveformState();
    });
    const label = document.createElement("span");
    label.className = "wave-signal-name";
    label.textContent = name;
    const radix = document.createElement("select");
    radix.setAttribute("aria-label", `Radix for ${name}`);
    for (const option of ["binary", "hex", "octal", "decimal", "signed", "unsigned"]) {
      const item = document.createElement("option");
      item.value = option;
      item.textContent = option;
      item.selected = (waveState.radix[name] || "hex") === option;
      radix.append(item);
    }
    radix.addEventListener("change", () => {
      waveState.radix[name] = radix.value;
      waveRadix.value = radix.value;
      renderWaveform();
      persistWaveformState();
    });
    row.append(checkbox, label, radix);
    waveSignalList.append(row);
  }

  waveGroupList.replaceChildren();
  for (const group of waveState.grouping) {
    const row = document.createElement("label");
    row.className = "wave-group";
    const expanded = document.createElement("input");
    expanded.type = "checkbox";
    expanded.checked = group.expanded !== false;
    expanded.addEventListener("change", () => {
      group.expanded = expanded.checked;
      persistWaveformState();
    });
    const text = document.createElement("span");
    text.textContent = `${group.name} (${group.signal_names.length})`;
    row.append(expanded, text);
    waveGroupList.append(row);
  }
}

function renderWaveformTimeline() {
  waveTimeline.replaceChildren();
  if (!waveState.model) return;
  const names = waveState.selected;
  if (names.length === 0) return;
  const svgWidth = 1000;
  const left = 180;
  const right = 982;
  const rowHeight = 44;
  const top = 28;
  const height = top + names.length * rowHeight + 20;
  waveTimeline.setAttribute("viewBox", `0 0 ${svgWidth} ${height}`);

  const range = waveState.zoom || waveState.artifact.time_range;
  const start = Number(range?.start?.value ?? 0);
  const end = Math.max(start + 1, Number(range?.end?.value ?? 100));
  const xAt = (time) => left + ((time - start) / (end - start)) * (right - left);
  const ns = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  for (let index = 0; index <= 5; index += 1) {
    const x = left + ((right - left) * index / 5);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x); line.setAttribute("x2", x);
    line.setAttribute("y1", top - 8); line.setAttribute("y2", height - 8);
    line.setAttribute("class", "wave-grid");
    waveTimeline.append(line);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x); label.setAttribute("y", 16); label.setAttribute("class", "wave-time");
    label.textContent = String(Math.round(start + (end - start) * index / 5));
    waveTimeline.append(label);
  }

  names.forEach((name, rowIndex) => {
    const y = top + rowIndex * rowHeight;
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", 8); label.setAttribute("y", y + 18); label.setAttribute("class", "wave-row-name");
    label.textContent = name;
    waveTimeline.append(label);
    const samples = (waveState.model.transitions[name] || []).filter((sample) =>
      sample.timestamp >= start && sample.timestamp <= end);
    if (samples.length === 0) return;
    const width = waveState.model.signals.find((signal) => signal.name === name)?.width || 1;
    const radix = waveState.radix[name] || "hex";
    samples.forEach((sample, sampleIndex) => {
      const next = samples[sampleIndex + 1];
      const x1 = xAt(sample.timestamp);
      const x2 = next ? xAt(next.timestamp) : right;
      const text = String(sample.value).toLowerCase();
      if (width === 1 && /^[01xzh]$/i.test(text)) {
        const high = text === "1";
        const level = high ? y + 4 : y + 26;
        const lowLevel = y + 26;
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1); line.setAttribute("x2", x2);
        line.setAttribute("y1", text === "x" || text === "z" ? y + 15 : level);
        line.setAttribute("y2", text === "x" || text === "z" ? y + 15 : level);
        line.setAttribute("class", text === "x" || text === "z" ? "wave-x" : high ? "wave-high" : "wave-low");
        line.setAttribute("stroke-width", "2");
        group.append(line);
        if (x2 - x1 > 12 && sampleIndex === 0) {
          const edge = document.createElementNS("http://www.w3.org/2000/svg", "line");
          edge.setAttribute("x1", x1); edge.setAttribute("x2", x1);
          edge.setAttribute("y1", level); edge.setAttribute("y2", lowLevel);
          edge.setAttribute("class", line.getAttribute("class"));
          group.append(edge);
        }
        const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        hit.setAttribute("x", x1); hit.setAttribute("y", y);
        hit.setAttribute("width", Math.max(3, x2 - x1)); hit.setAttribute("height", rowHeight);
        hit.setAttribute("fill", "transparent");
        hit.style.cursor = "crosshair";
        hit.addEventListener("click", (event) => {
          event.stopPropagation();
          setWaveCursor(name, sample.timestamp);
        });
        group.append(hit);
        waveTimeline.append(group);
      } else {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x1 + 1); rect.setAttribute("y", y + 4);
        rect.setAttribute("width", Math.max(2, x2 - x1 - 2)); rect.setAttribute("height", 30);
        rect.setAttribute("fill", "#1d2540"); rect.setAttribute("stroke", "#e7b75e");
        rect.style.cursor = "crosshair";
        rect.addEventListener("click", (event) => {
          event.stopPropagation();
          setWaveCursor(name, sample.timestamp);
        });
        waveTimeline.append(rect);
        if (x2 - x1 > 32) {
          const value = document.createElementNS("http://www.w3.org/2000/svg", "text");
          value.setAttribute("x", x1 + (x2 - x1) / 2); value.setAttribute("y", y + 23);
          value.setAttribute("text-anchor", "middle"); value.setAttribute("class", "wave-vector");
          value.textContent = formatWaveValue(text, radix, width);
          waveTimeline.append(value);
        }
      }
    });
  });

  waveTimeline.onclick = (event) => {
    const bounds = waveTimeline.getBoundingClientRect();
    const viewX = (event.clientX - bounds.left) / bounds.width * svgWidth;
    if (viewX < left || viewX > right) return;
    const timestamp = start + ((viewX - left) / (right - left)) * (end - start);
    setWaveCursor(waveState.selected[0] || null, timestamp);
  };
  renderCursor(start, end, left, right);
}

function renderCursor(startValue, endValue, left = 180, right = 982) {
  waveTimeline.querySelector(".wave-cursor-line")?.remove();
  if (!waveState.cursor) {
    waveCursorLabel.textContent = "Cursor: —";
    return;
  }
  const timestamp = waveState.cursor.timestamp.value;
  const range = waveState.zoom || waveState.artifact?.time_range;
  const start = startValue ?? Number(range?.start?.value ?? 0);
  const end = endValue ?? Math.max(start + 1, Number(range?.end?.value ?? 100));
  if (timestamp >= start && timestamp <= end) {
    const x = left + ((timestamp - start) / (end - start)) * (right - left);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "wave-cursor-line");
    line.setAttribute("x1", x); line.setAttribute("x2", x);
    line.setAttribute("y1", 20); line.setAttribute("y2", waveTimeline.viewBox.baseVal.height - 8);
    waveTimeline.append(line);
  }
  const signal = waveState.cursor.signal_name ? `${waveState.cursor.signal_name} @ ` : "";
  waveCursorLabel.textContent = `Cursor: ${signal}${timestamp} ${waveState.cursor.timestamp.unit}`;
}

function setWaveCursor(signalName, timestamp) {
  waveState.cursor = {
    timestamp: { value: Math.round(timestamp), unit: waveState.artifact?.time_range?.start?.unit || "fs" },
    signal_name: signalName || undefined,
  };
  renderCursor();
  persistWaveformState();
}

function zoomWaveform(factor) {
  if (!waveState.model) return;
  const range = waveState.zoom || waveState.artifact.time_range;
  const start = Number(range.start.value);
  const end = Number(range.end.value);
  const cursor = waveState.cursor?.timestamp.value ?? (start + end) / 2;
  const width = (end - start) * factor;
  let nextStart = cursor - width / 2;
  let nextEnd = cursor + width / 2;
  if (nextEnd - nextStart < 1) return;
  waveState.zoom = {
    start: { value: nextStart, unit: range.start.unit || "fs" },
    end: { value: nextEnd, unit: range.end.unit || "fs" },
  };
  renderWaveform();
  persistWaveformState();
}

function getWaveformSession() {
  return {
    artifact: waveState.artifact ? { path: waveState.artifact.path, format: "vcd" } : null,
    cursor: waveState.cursor,
    zoom: waveState.zoom,
    grouping: waveState.grouping,
    radix: waveState.radix,
  };
}

function restoreWaveformSession(session) {
  if (!session || typeof session !== "object") return;
  waveState.cursor = session.cursor && typeof session.cursor === "object" ? session.cursor : null;
  waveState.zoom = session.zoom && typeof session.zoom === "object" ? session.zoom : null;
  waveState.grouping = Array.isArray(session.grouping) ? session.grouping : [];
  waveState.radix = session.radix && typeof session.radix === "object" ? session.radix : {};
  if (session.artifact?.path) {
    waveState.artifact = { path: session.artifact.path, format: "vcd", signal_names: [] };
    waveArtifactName.textContent = session.artifact.path;
  }
  renderWaveformSignals();
  renderCursor();
  if (waveState.artifact?.signal_names?.length) {
    waveEmpty.hidden = true;
  }
}

function persistWaveformState() {
  window.clearTimeout(waveSaveTimer);
  waveSaveTimer = window.setTimeout(() => {
    const payload = getWaveformSession();
    localStorage.setItem("kona-waveform-session", JSON.stringify(payload));
    persistWaveformOpfs(payload);
  }, 250);
}

async function persistWaveformOpfs(payload) {
  if (!navigator.storage?.getDirectory) return;
  try {
    const root = await navigator.storage.getDirectory();
    const directory = await root.getDirectoryHandle("kona-waveform", { create: true });
    const handle = await directory.getFileHandle("session.json", { create: true });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(payload));
    await writable.close();
  } catch {
    // localStorage remains the portable fallback.
  }
}

async function restoreWaveformOpfs() {
  let payload = null;
  try {
    if (navigator.storage?.getDirectory) {
      const root = await navigator.storage.getDirectory();
      const directory = await root.getDirectoryHandle("kona-waveform");
      const handle = await directory.getFileHandle("session.json");
      payload = JSON.parse(await (await handle.getFile()).text());
    }
  } catch {
    payload = null;
  }
  if (!payload) {
    try {
      payload = JSON.parse(localStorage.getItem("kona-waveform-session") || "null");
    } catch {
      payload = null;
    }
  }
  if (payload) restoreWaveformSession(payload);
}

function makeMuted(text) {
  const element = document.createElement("p");
  element.className = "muted";
  element.textContent = text;
  return element;
}

function renderDiagnostics(diagnostics) {
  if (diagnostics.length === 0) {
    results.replaceChildren(makeMuted("No diagnostics returned."));
    return;
  }
  const elements = diagnostics.map((item) => {
    const diagnostic = document.createElement("div");
    const severity = item && ["error", "warning", "info"].includes(item.severity)
      ? item.severity
      : "info";
    diagnostic.className = `diagnostic ${severity}`;
    const location = typeof item?.file === "string"
      ? `${item.file}${item.line != null ? `:${item.line}` : ""}${item.column != null ? `:${item.column}` : ""}: `
      : "";
    const message = typeof item?.message === "string" ? item.message : "Unknown diagnostic";
    diagnostic.textContent = location + message;
    return diagnostic;
  });
  results.replaceChildren(...elements);
}
