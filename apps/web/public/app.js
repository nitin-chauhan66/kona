const manifest = document.querySelector("#manifest");
const results = document.querySelector("#results");
const status = document.querySelector("#status");
const runButton = document.querySelector("#runButton");
const operationButtons = [...document.querySelectorAll("[data-operation]")];
let operation = "lint";

operationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    operationButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    operation = button.dataset.operation;
  });
});

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
  status.textContent = "Running";
  results.innerHTML = '<p class="muted">Executing Kona…</p>';

  try {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation, manifest: manifest.value }),
    });
    const payload = await response.json();
    const diagnostics = payload.diagnostics ?? [];
    status.textContent = payload.ok ? "Passed" : "Failed";
    status.style.color = payload.ok ? "#67d391" : "#ef6b73";
    results.innerHTML = diagnostics.length
      ? diagnostics.map((item) => `
          <div class="diagnostic ${item.severity}">
            ${escapeHtml(item.file ? `${item.file}:${item.line ?? ""}: ` : "")}
            ${escapeHtml(item.message)}
          </div>`).join("")
      : '<p class="muted">No diagnostics returned.</p>';
  } catch (error) {
    status.textContent = "Failed";
    status.style.color = "#ef6b73";
    results.innerHTML = `<div class="diagnostic error">${escapeHtml(String(error))}</div>`;
  } finally {
    runButton.disabled = false;
    runButton.textContent = "Run";
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);
}
