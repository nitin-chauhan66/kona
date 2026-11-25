import * as esbuild from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = resolve(__dirname, 'public');
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

async function build() {
  console.log('[BUILD] Bundling Kona Web Cockpit...');
  await esbuild.build({
    entryPoints: [resolve(__dirname, 'src/index.ts')],
    bundle: true,
    outfile: resolve(publicDir, 'bundle.js'),
    format: 'esm',
    sourcemap: true,
    target: ['es2022', 'chrome100', 'firefox100', 'safari15'],
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  });
  console.log('[BUILD] Kona Web Cockpit bundle ready: apps/web/public/bundle.js');
}

build().catch(err => {
  console.error('[BUILD ERROR]', err);
  process.exit(1);
});
