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

// bare-mux browser bundle
await bundle('node_modules/@mercuryworkshop/bare-mux/index.js', 'static/bmx.mjs');

// epoxy — find its real entry point from package.json
const epoxyRoot = 'node_modules/@mercuryworkshop/epoxy-transport';
const epoxyEntry = (() => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(epoxyRoot, 'package.json'), 'utf8'));
    const ep = pkg.exports || {};
    for (const key of ['.', './index', './lib']) {
      const v = ep[key];
      const f = typeof v === 'string' ? v : (v && (v.import || v.module || v.default));
      if (f) return path.join(epoxyRoot, f);
    }
    if (pkg.module) return path.join(epoxyRoot, pkg.module);
    if (pkg.main) return path.join(epoxyRoot, pkg.main);
  } catch (e) {}
  const guesses = ['dist/index.mjs', 'index.mjs', 'dist/index.js', 'index.js']
    .map(p => path.join(epoxyRoot, p));
  return guesses.find(p => fs.existsSync(p));
})();

console.log('epoxy entry:', epoxyEntry);
if (epoxyEntry) await bundle(epoxyEntry, 'static/epoxy.mjs');