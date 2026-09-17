try {
  const express = (await import('express')).default;
  const { createServer } = await import('node:http');
  const uvMod = await import('@titaniumnetwork-dev/ultraviolet');
  const { attachBareServer } = await import('bare-server-node');
  const path = (await import('node:path')).default;
  const { fileURLToPath } = await import('node:url');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const app = express();
  const server = createServer(app);

  // UV worker controls the whole site
  app.use((req, res, next) => {
    if (req.path === '/uv/uv.sw.js') res.setHeader('Service-Worker-Allowed', '/');
    next();
  });

  app.use('/uv/', express.static(uvMod.uvPath));
  app.use(express.static(path.join(__dirname, 'static')));

  // bare server: the SW proxies everything through /bare/ — no transports needed
  const bare = attachBareServer(server);

  server.on('request', (req, res) => {
    if (bare.shouldRoute(req)) {
      bare.routeRequest(req, res);
    } else {
      app(req, res);
    }
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`StudyHub live on :${PORT}`));

} catch (err) {
  console.error('STARTUP ERROR:', err);
  process.exit(1);
}
