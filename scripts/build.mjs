import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'src/static';

async function bundle(src, out) {
  try {
    await build({
      entryPoints: [src],
      bundle: true,
      format: 'esm',
      platform: 'browser',
      outfile: out,
      logLevel: 'warning'
    });
    console.log('bundled OK:', out, 'from', src);
    return true;
  } catch (e) {
    console.log('bundle failed:', src, '-', e.message);
    return false;
  }
}

// ---- bare-mux ----
await bundle('node_modules/@mercuryworkshop/bare-mux/dist/index.js', path.join(OUT, 'bmx.mjs'));

// ---- epoxy ----
// dist/module.js is the browser ESM build; never touch esbuild.bundle.mjs (it's their build script)
const epoxyRoot = 'node_modules/@mercuryworkshop/epoxy-transport';
const candidates = [
  path.join(epoxyRoot, 'dist', 'module.js'),
  path.join(epoxyRoot, 'dist', 'index.js'),
  path.join(epoxyRoot, 'index.mjs')
];
const epoxyEntry = candidates.find(p => fs.existsSync(p));
console.log('epoxy entry chosen:', epoxyEntry);

if (epoxyEntry) await bundle(epoxyEntry, path.join(OUT, 'epoxy.mjs'));
else console.log('NO epoxy entry found — expected dist/module.js');