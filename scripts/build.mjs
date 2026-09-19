import { build } from 'esbuild';
import path from 'node:path';

await build({
  entryPoints: ['node_modules/@mercuryworkshop/epoxy-transport/dist/module.js'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  globalName: 'EpoxyTransport',
  footer: {
    js: 'self.EpoxyTransport = EpoxyTransport; self.epoxy = EpoxyTransport; self.Epoxy = EpoxyTransport;'
  },
  outfile: path.join('src/static', 'epoxy.mjs'),
  logLevel: 'warning'
});
console.log('bundled OK: src/static/epoxy.mjs');
