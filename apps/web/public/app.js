const manifest = document.querySelector("#manifest");
const results = document.querySelector("#results");
const status = document.querySelector("#status");
const runButton = document.querySelector("#runButton");
const operationButtons = [...document.querySelectorAll("[data-operation]")];
let operation = "lint";
let saveTimer;
let saveSequence = 0;

loadSession();
loadToolchainStatus();

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
      setStatus("Ready", "ready");
      setInitialResults();
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
  } catch {
    setStatus("Session unavailable", "error");
    setInitialResults();
  }
}

async function saveSession() {
  const sequence = ++saveSequence;
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
    if (sequence === saveSequence) setStatus("Session saved", "success");
  } catch (error) {
    if (sequence === saveSequence) setStatus("Save failed", "error", error);
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
  runButton.disabled = true;
  runButton.textContent = "Running...";
  setStatus("Running", "loading");
  results.replaceChildren(makeMuted("Executing Kona…"));

  try {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation, manifest: manifest.value }),
    });
    const payload = await readJson(response);
    if (!response.ok && typeof payload.error === "string") {
      throw new Error(payload.error);
    }
    if (!payload || typeof payload !== "object" || typeof payload.ok !== "boolean") {
      throw new Error("The Kona CLI returned an invalid result");
    }
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
    runButton.disabled = false;
    runButton.textContent = `Run ${operation[0].toUpperCase()}${operation.slice(1)}`;
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function loadToolchainStatus() {
  try {
    const response = await fetch("/api/toolchain");
    if (!response.ok) return;
    const payload = await readJson(response);
    const tools = payload.tools || {};
    const available = Object.entries(tools)
      .filter(([, version]) => version !== "unavailable")
      .map(([name]) => name);
    const unavailable = Object.entries(tools)
      .filter(([, version]) => version === "unavailable")
      .map(([name]) => name);
    if (available.length > 0) {
      setStatus(`${available.length} EDA tools available`, "success");
    } else if (unavailable.length > 0) {
      setStatus("EDA tools unavailable", "error");
    }
  } catch {
    // Toolchain status is supplemental; operation diagnostics remain authoritative.
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
