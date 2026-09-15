import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

// server serves files from src/static — write bundles there
const OUT = 'src/static';

// walk a folder and list every .js/.mjs file inside it
function walk(dir) {
  const out = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...walk(full));
      else if (/\.(m?js)$/.test(entry.name)) out.push(full);
    }
  } catch (e) {}
  return out;
}

// prefer real code files, skip type declarations and maps
function pick(files) {
  return files.filter(f => !/\.d\.(m?ts)$/.test(f) && !f.endsWith('.map'));
}

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
const bmxRoot = 'node_modules/@mercuryworkshop/bare-mux';
const bmxFiles = pick(walk(bmxRoot));
console.log('bare-mux files found:', bmxFiles);

let bmxEntry = bmxFiles.find(f => f.endsWith('/index.js') && !f.includes('/node/'))
  || bmxFiles.find(f => !f.includes('/node/') && !/test|demo/i.test(f))
  || bmxFiles[0];
console.log('bare-mux entry chosen:', bmxEntry);

if (bmxEntry) await bundle(bmxEntry, path.join(OUT, 'bmx.mjs'));
else console.log('NO bare-mux files found at all');

// ---- epoxy ----
const epoxyRoot = 'node_modules/@mercuryworkshop/epoxy-transport';
const epoxyFiles = pick(walk(epoxyRoot));
console.log('epoxy files found:', epoxyFiles);

let epoxyEntry = epoxyFiles.find(f => f.endsWith('index.mjs'))
  || epoxyFiles.find(f => f.endsWith('.mjs'))
  || epoxyFiles.find(f => f.endsWith('index.js'))
  || epoxyFiles[0];
console.log('epoxy entry chosen:', epoxyEntry);

if (epoxyEntry) await bundle(epoxyEntry, path.join(OUT, 'epoxy.mjs'));
else console.log('NO epoxy files found at all');