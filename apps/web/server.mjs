import http from "node:http";
import { readFile, writeFile, mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const root = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(root, "../..");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const maxRequestBytes = 1024 * 1024;
const allowedOperations = new Set(["lint", "run", "prove"]);

export const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    if (request.method === "GET" && url.pathname === "/api/session") {
      await handleSessionGet(response);
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/toolchain") {
      await handleToolchainGet(response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/session") {
      await handleSessionPost(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/run") {
      await handleRun(request, response);
      return;
    }

    const relativePath = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\/+/, "");
    const filePath = path.resolve(root, "public", relativePath);
    const publicRoot = path.resolve(root, "public");
    if (filePath !== publicRoot && !filePath.startsWith(publicRoot + path.sep)) {
      sendError(response, 403, "Forbidden");
      return;
    }
    const content = await readFile(filePath);
    const type = filePath.endsWith(".css") ? "text/css"
      : filePath.endsWith(".js") ? "text/javascript"
      : "text/html";
    response.writeHead(200, { "Content-Type": `${type}; charset=utf-8` });
    response.end(content);
  } catch (error) {
    if (error?.code === "ENOENT") {
      response.writeHead(404).end("Not found");
      return;
    }
    sendError(response, error?.statusCode || 500,
      error?.statusCode ? error.message : String(error));
  }
});

async function readRequestBody(request) {
  let body = "";
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > maxRequestBytes) {
      const error = new Error("Request body is too large");
      error.statusCode = 413;
      throw error;
    }
    body += buffer.toString("utf8");
  }
  return body;
}

function sendError(response, status, error) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ error }));
}

async function atomicWrite(filePath, content) {
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, content, { encoding: "utf8", flag: "wx" });
    await rename(temporaryPath, filePath);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
}

async function handleSessionGet(response) {
  try {
    const source = await readFile(path.join(workspace, ".kona", "session.json"), "utf8");
    let session;
    try {
      session = JSON.parse(source);
    } catch {
      sendError(response, 500, "Saved session is malformed");
      return;
    }

    if (!session || typeof session !== "object" || Array.isArray(session)) {
      sendError(response, 500, "Saved session is malformed");
      return;
    }
    if (session.manifest !== undefined && typeof session.manifest !== "string") {
      sendError(response, 500, "Saved session is malformed");
      return;
    }
    if (session.operation !== undefined && !allowedOperations.has(session.operation)) {
      sendError(response, 500, "Saved session is malformed");
      return;
    }
    const restored = {
      manifest: typeof session.manifest === "string" ? session.manifest : "",
      operation: allowedOperations.has(session.operation) ? session.operation : "lint",
      ...(session.waveform && typeof session.waveform === "object" ? { waveform: session.waveform } : {}),
    };
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(restored));
  } catch (error) {
    if (error?.code === "ENOENT") {
      sendError(response, 404, "No saved session");
      return;
    }
    throw error;
  }
}

async function handleToolchainGet(response) {
  const tools = ["yosys", "verilator", "iverilog", "sby"];
  const versions = {};
  for (const tool of tools) {
    const result = await runToolVersion(tool);
    versions[tool] = result.available ? result.version : "unavailable";
  }
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({
    packaged: process.platform === "linux" && Boolean(process.env.KONA_PACKAGED),
    tools: versions,
  }));
}

function runToolVersion(tool) {
  return new Promise((resolve) => {
    const probeArgs = tool === "iverilog" ? ["-V"]
      : tool === "sby" ? ["--help"]
      : ["--version"];
    const child = spawn(tool, probeArgs, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", () => resolve({ available: false, version: "unavailable" }));
    child.on("close", (code) => {
      const version = (stdout || stderr).trim().split(/\r?\n/)[0];
      resolve({
        available: code === 0 && Boolean(version),
        version: code === 0 && version ? version : "unavailable",
      });
    });
  });
}

async function handleSessionPost(request, response) {
  let body;
  try {
    body = await readRequestBody(request);
  } catch (error) {
    sendError(response, error?.statusCode || 400, error?.message || "Invalid request body");
    return;
  }
  let session;
  try {
    session = JSON.parse(body);
  } catch {
    sendError(response, 400, "Request body must be valid JSON");
    return;
  }
  if (!session || typeof session !== "object" || Array.isArray(session)) {
    sendError(response, 400, "Session must be a JSON object");
    return;
  }
  if (session.manifest !== undefined && typeof session.manifest !== "string") {
    sendError(response, 400, "manifest must be a string");
    return;
  }
  const operation = session.operation === undefined ? "lint" : session.operation;
  if (typeof operation !== "string" || !allowedOperations.has(operation)) {
    sendError(response, 400, "Unsupported operation");
    return;
  }
  await mkdir(path.join(workspace, ".kona"), { recursive: true });
  await atomicWrite(
    path.join(workspace, ".kona", "session.json"),
    JSON.stringify({
      manifest: typeof session.manifest === "string" ? session.manifest : "",
      operation,
      ...(session.waveform && typeof session.waveform === "object" ? { waveform: session.waveform } : {}),
      updatedAt: new Date().toISOString(),
    }, null, 2) + "\n",
  );
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ ok: true }));
}

async function handleRun(request, response) {
  let body;
  try {
    body = await readRequestBody(request);
  } catch (error) {
    sendError(response, error?.statusCode || 400, error?.message || "Invalid request body");
    return;
  }
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    sendError(response, 400, "Request body must be valid JSON");
    return;
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    sendError(response, 400, "Run request must be a JSON object");
    return;
  }
  const { operation = "lint", manifest } = payload;
  if (typeof operation !== "string" || !allowedOperations.has(operation)) {
    sendError(response, 400, "Unsupported operation");
    return;
  }
  if (typeof manifest !== "string") {
    sendError(response, 400, "manifest must be a string");
    return;
  }
  await mkdir(path.join(workspace, ".kona"), { recursive: true });
  const manifestPath = path.join(workspace, `.kona-web-manifest-${randomUUID()}.yaml`);
  await atomicWrite(manifestPath, manifest);
  await atomicWrite(
    path.join(workspace, ".kona", "session.json"),
    JSON.stringify({ manifest: manifest || "", operation, updatedAt: new Date().toISOString() }, null, 2) + "\n",
  );

  const child = spawn(process.execPath, [
    path.join(workspace, "apps/cli/dist/cli.js"),
    operation,
    manifestPath,
    "--json",
  ], { cwd: workspace });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
  child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
  let settled = false;
  child.on("error", (error) => {
    if (settled) return;
    settled = true;
    sendError(response, 500, `Unable to execute Kona CLI: ${error.message}`);
  });
  child.on("close", (code) => {
    if (settled) return;
    settled = true;
    rm(manifestPath, { force: true }).catch(() => {});
    response.writeHead(code === 0 ? 200 : 422, { "Content-Type": "application/json" });
    try {
      const payload = JSON.parse(stdout);
      if (!payload || typeof payload !== "object" || typeof payload.ok !== "boolean") {
        throw new Error("Invalid CLI result");
      }
      if (!Array.isArray(payload.diagnostics)) payload.diagnostics = [];
      if (!payload.operation) payload.operation = operation;
      if (!payload.target) payload.target = "headless-cli";
      response.end(JSON.stringify(payload));
    } catch {
      response.end(JSON.stringify({
        ok: false,
        target: "headless-cli",
        operation,
        diagnostics: [{
        severity: "error",
        message: stderr || "CLI execution failed",
      }] }));
    }
  });
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  server.listen(port, host, () => {
    console.log(`Kona web cockpit running at http://${host}:${port}`);
  });
}
