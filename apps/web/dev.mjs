/**
 * Kona Dev Server with Automatic Rebundling Watcher
 */
import * as esbuild from 'esbuild';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, 'public');
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4173;

// 1. Setup esbuild watcher context
console.log('⚡ [KONA DEV] Starting esbuild file watcher...');
const ctx = await esbuild.context({
  entryPoints: [path.resolve(__dirname, 'src/index.ts')],
  bundle: true,
  outfile: path.resolve(publicDir, 'bundle.js'),
  format: 'esm',
  sourcemap: true,
  target: ['es2022', 'chrome100', 'firefox100', 'safari15'],
  define: {
    'process.env.NODE_ENV': '"development"'
  }
});

// Watch for file edits
await ctx.watch();
console.log('⚡ [KONA DEV] Watcher active on apps/web/src & packages/core');

// 2. MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.wasm': 'application/wasm'
};

// 3. HTTP Server with dev cache-busting headers
const server = http.createServer((req, res) => {
  const urlPath = req.url ? req.url.split('?')[0] : '/';
  let filePath = path.join(publicDir, urlPath === '/' ? 'index.html' : urlPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(publicDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
===========================================================
⚡ [KONA DEV] Visual Silicon Platform Server Ready
   Local:        http://localhost:${PORT}
   Network:      http://0.0.0.0:${PORT}
   Auto-Watch:   ENABLED (changes auto-rebuild live)
===========================================================
`);
});
