import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const root = path.resolve(".");
const publicDir = path.join(root, "apps/web/public");
await mkdir(publicDir, { recursive: true });
await build({
  entryPoints: [path.join(publicDir, "app.js")],
  bundle: true,
  format: "esm",
  outfile: path.join(publicDir, "app.bundle.js"),
  platform: "browser",
  target: "es2022",
  external: ["node:fs/promises"],
});
await build({
  entryPoints: [path.join(root, "packages/compute-contract/src/vcd.ts")],
  bundle: true,
  format: "esm",
  outfile: path.join(publicDir, "vcd-parser.js"),
  platform: "browser",
  target: "es2022",
});
for (const wasm of ["yosys.core.wasm", "yosys.core2.wasm", "yosys.core3.wasm", "yosys.core4.wasm"]) {
  await cp(path.join(root, "node_modules/@yowasp/yosys/gen", wasm), path.join(publicDir, wasm));
}
