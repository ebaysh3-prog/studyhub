import { build } from 'esbuild';
import path from 'node:path';

// epoxy MUST be IIFE — bare-mux loads it inside a classic worker
await build({
  entryPoints: ['node_modules/@mercuryworkshop/epoxy-transport/dist/module.js'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  outfile: path.join('src/static', 'epoxy.mjs'),
  logLevel: 'warning'
});
console.log('bundled OK: src/static/epoxy.mjs');
