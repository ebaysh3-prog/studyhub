try {
  const express = (await import('express')).default;
  const { createServer } = await import('node:http');
  const uvMod = await import('@titaniumnetwork-dev/ultraviolet');
  const bmxMod = await import('@mercuryworkshop/bare-mux/node');
  const wispMod = await import('@mercuryworkshop/wisp-js');
  const path = (await import('node:path')).default;
  const fs = (await import('node:fs')).default;
  const { fileURLToPath } = await import('node:url');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const hasBmx = fs.existsSync(path.join(__dirname, 'static', 'bmx.mjs'));
  const hasEpoxy = fs.existsSync(path.join(__dirname, 'static', 'epoxy.mjs'));
  console.log('bundles — bmx:', hasBmx, '| epoxy:', hasEpoxy);

  const app = express();
  const server = createServer(app);

  app.use((req, res, next) => {
    if (req.path === '/uv/uv.sw.js') res.setHeader('Service-Worker-Allowed', '/');
    next();
  });

  app.use('/uv/', express.static(uvMod.uvPath));
  app.use('/bmx/', express.static(bmxMod.baremuxPath));
  app.use(express.static(path.join(__dirname, 'static')));

  app.get('/bmx-urls', (req, res) => {
    res.json({
      hasBundle: hasBmx,
      transport: hasEpoxy ? '/epoxy.mjs' : null
    });
  });

  server.on('upgrade', (req, socket, head) => {
    wispMod.server.routeRequest(req, socket, head);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`StudyHub live on :${PORT}`));

} catch (err) {
  console.error('STARTUP ERROR:', err);
  process.exit(1);
}