try {
  const express = (await import('express')).default;
  const { createServer } = await import('node:http');
  const uvMod = await import('@titaniumnetwork-dev/ultraviolet');
  const bmxMod = await import('@mercuryworkshop/bare-mux/node');
  const wispMod = await import('@mercuryworkshop/wisp-js');
  const bareMod = await import('bare-server-node');
  const path = (await import('node:path')).default;
  const fs = (await import('node:fs')).default;
  const { fileURLToPath } = await import('node:url');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // teach Express that .mjs and .cjs are JavaScript
  express.static.mime.define({ 'application/javascript': ['mjs', 'cjs'] });

  // prove bare-mux is really installed
  const bareCjs = path.join(bmxMod.baremuxPath, 'bare.cjs');
  console.log('DIAG bare.cjs exists:', fs.existsSync(bareCjs), '| path:', bmxMod.baremuxPath);

  const app = express();
  const server = createServer();

  app.use((req, res, next) => {
    if (req.path === '/uv/uv.sw.js') res.setHeader('Service-Worker-Allowed', '/');
    next();
  });

  app.use('/uv/', express.static(uvMod.uvPath));
  app.use('/bmx/', express.static(bmxMod.baremuxPath));
  app.use(express.static(path.join(__dirname, 'static')));

  app.get('/sw.js', (req, res) => {
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Content-Type', 'application/javascript');
    res.send(
      "self.addEventListener('error', e => console.error('[sw] error:', e.message));" +
      "try { importScripts('/uv/uv.bundle.js'); console.log('[sw] bundle ok'); }" +
      "catch(e) { console.error('[sw] bundle fail:', e.message); }" +
      "try { importScripts('/uv/uv.config.js'); console.log('[sw] config ok, prefix =', self.__uv$config && self.__uv$config.prefix); }" +
      "catch(e) { console.error('[sw] config fail:', e.message); }" +
      "try { importScripts('/bmx/bare.cjs'); console.log('[sw] baremux ok, SetSingletonTransport:', typeof self.BareMux !== 'undefined' && typeof self.BareMux.SetSingletonTransport); }" +
      "catch(e) { console.error('[sw] baremux fail:', e.message); }" +
      "try { BareMux.SetSingletonTransport('/epoxy.mjs', { wisp: 'wss://" + req.headers.host + "/wisp/' }); console.log('[sw] transport set'); }" +
      "catch(e) { console.error('[sw] transport fail:', e.message); }" +
      "try { importScripts('/uv/uv.sw.js'); console.log('[sw] uv handler loaded'); }" +
      "catch(e) { console.error('[sw] uv handler fail:', e.message); }"
    );
  });

  const bare = bareMod.createBareServer('/bare/');

  server.on('request', (req, res) => {
    if (bare.shouldRoute(req)) bare.routeRequest(req, res);
    else app(req, res);
  });

  server.on('upgrade', (req, socket, head) => {
    if (bare.shouldRoute(req, socket)) bare.routeRequest(req, socket, head);
    else wispMod.server.routeRequest(req, socket, head);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log('StudyHub live on :' + PORT));

} catch (err) {
  console.error('STARTUP ERROR:', err);
  process.exit(1);
}
