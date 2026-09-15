import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

async function bundle(src, out) {
  try {
    if (!fs.existsSync(src)) { console.log('skip (missing):', src); return; }
    await build({
      entryPoints: [src],
      bundle: true,
      format: 'esm',
      platform: 'browser',
      outfile: out,
      logLevel: 'warning'
    });
    console.log('bundled OK:', out);
  } catch (e) {
    console.log('bundle failed:', src, '-', e.message);
  }
}

const bmxSrc = 'node_modules/@mercuryworkshop/bare-mux/index.js';
const epoxyRoot = 'node_modules/@mercuryworkshop/epoxy-transport';
const epoxyCandidates = [
  'dist/index.mjs', 'index.mjs', 'dist/index.js', 'index.js'
].map(p => path.join(epoxyRoot, p));
const epoxySrc = epoxyCandidates.find(p => fs.existsSync(p));
console.log('epoxy source chosen:', epoxySrc);

await bundle(bmxSrc, 'static/bmx.mjs');
if (epoxySrc) await bundle(epoxySrc, 'static/epoxy.mjs');