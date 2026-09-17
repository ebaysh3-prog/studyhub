try {
  const express = (await import('express')).default;
  const { createServer } = await import('node:http');
  const uvMod = await import('@titaniumnetwork-dev/ultraviolet');
  const bmxMod = await import('@mercuryworkshop/bare-mux/node');
  const wispMod = await import('@mercuryworkshop/wisp-js');
  const bareMod = await import('bare-server-node');
  const path = (await import('node:path')).default;
  const { fileURLToPath } = await import('node:url');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const app = express();
  const server = createServer();

  app.use((req, res, next) => {
    if (req.path === '/uv/uv.sw.js') res.setHeader('Service-Worker-Allowed', '/');
    next();
  });

  app.use('/uv/', express.static(uvMod.uvPath));
  app.use('/bmx/', express.static(bmxMod.baremuxPath));
  app.use(express.static(path.join(__dirname, 'static')));

  // worker bootstraps: bundle + config + bare-mux + epoxy(IIFE) + UV handler
  app.get('/sw.js', (req, res) => {
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Content-Type', 'application/javascript');
    const wispUrl = (req.headers['x-forwarded-proto'] === 'https' ? 'wss://' : 'wss://') + req.headers.host + '/wisp/';
    res.send(
      "importScripts('/uv/uv.bundle.js');" +
      "importScripts('/uv/uv.config.js');" +
      "importScripts('/bmx/bare.cjs');" +
      "BareMux.SetSingletonTransport('/epoxy.mjs', { wisp: '" + wispUrl + "' });" +
      "importScripts('/uv/uv.sw.js');"
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
