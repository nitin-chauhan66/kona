import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(root, "../..");
const port = Number(process.env.PORT || 4173);

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/api/run") {
      await handleRun(request, response);
      return;
    }

    const urlPath = request.url === "/" ? "/index.html" : request.url;
    const relativePath = urlPath.split("?")[0].replace(/^\/+/, "");
    const filePath = path.resolve(root, "public", relativePath);
    if (!filePath.startsWith(path.resolve(root, "public"))) {
      response.writeHead(403).end("Forbidden");
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
    response.writeHead(500, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: String(error) }));
  }
});

async function handleRun(request, response) {
  let body = "";
  for await (const chunk of request) body += chunk;
  const { operation = "lint", manifest } = JSON.parse(body);
  if (!["lint", "run", "prove"].includes(operation)) {
    response.writeHead(400, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Unsupported operation" }));
    return;
  }
  await mkdir(path.join(workspace, ".kona"), { recursive: true });
  const manifestPath = path.join(workspace, ".kona", "web-manifest.yaml");
  await writeFile(manifestPath, manifest || "");

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
  child.on("close", (code) => {
    response.writeHead(code === 0 ? 200 : 422, { "Content-Type": "application/json" });
    try {
      response.end(JSON.stringify(JSON.parse(stdout)));
    } catch {
      response.end(JSON.stringify({ ok: false, diagnostics: [{
        severity: "error",
        message: stderr || "CLI execution failed",
      }] }));
    }
  });
}

server.listen(port, "127.0.0.1", () => {
  console.log(`Kona web cockpit running at http://127.0.0.1:${port}`);
});
