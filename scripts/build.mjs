import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'src/static';

// bare-mux: ESM is fine (loaded as a module by the page)
await build({
  entryPoints: ['node_modules/@mercuryworkshop/bare-mux/dist/index.js'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: path.join(OUT, 'bmx.mjs'),
  logLevel: 'warning'
});
console.log('bundled OK: src/static/bmx.mjs');

// epoxy: MUST be IIFE — bare-mux loads transports inside a classic worker
await build({
  entryPoints: ['node_modules/@mercuryworkshop/epoxy-transport/dist/module.js'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  outfile: path.join(OUT, 'epoxy.mjs'),
  logLevel: 'warning'
});
console.log('bundled OK: src/static/epoxy.mjs');
