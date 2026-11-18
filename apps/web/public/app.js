import { parseKonaManifest } from "@kona/compute-contract";
import { Exit, runYosys, version as yosysVersion } from "@yowasp/yosys";

const manifest = document.querySelector("#manifest");
const results = document.querySelector("#results");
const status = document.querySelector("#status");
const runButton = document.querySelector("#runButton");
const workspaceFiles = document.querySelector("#workspaceFiles");
const capability = document.querySelector("#capability");
const operationButtons = [...document.querySelectorAll("[data-operation]")];
let operation = "lint";
let saveTimer;
let saveSequence = 0;
let runInProgress = false;
let runSequence = 0;
const localSessionKey = "kona-session";
const selectedFiles = new Map();

loadSession();
setStatus(`Browser WASM ready (Yosys ${yosysVersion})`, "success");
restoreWorkspace();

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
  const session = { manifest: manifest.value, operation };
  localStorage.setItem(localSessionKey, JSON.stringify(session));
  try {
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manifest: manifest.value, operation }),
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
      : "Browser mode: Yosys WASM lint is available. Run and Prove use native engines when connected.";
  } catch {
    capability.textContent = "Standalone browser mode: Yosys WASM lint is available. Run and Prove require the native app or CLI.";
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
    return {
      ok: false,
      diagnostics: [{
        severity: "error",
        message: `Standalone browser mode does not yet provide ${operation} execution. Use lint or the native Docker/CLI engine.`,
      }],
    };
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
