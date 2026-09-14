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

  let epoxyPath = path.join(process.cwd(), 'node_modules', '@mercuryworkshop', 'epoxy-transport', 'dist');
  if (!fs.existsSync(epoxyPath)) {
    epoxyPath = path.join(process.cwd(), 'node_modules', '@mercuryworkshop', 'epoxy-transport');
  }

  const app = express();
  const server = createServer(app);

  // let the UV worker (served from /uv/) control the whole site
  app.use((req, res, next) => {
    if (req.path === '/uv/uv.sw.js') res.setHeader('Service-Worker-Allowed', '/');
    next();
  });

  app.use('/uv/', express.static(uvMod.uvPath));
  app.use('/bmx/', express.static(bmxMod.baremuxPath));
  app.use('/epoxy/', express.static(epoxyPath));

  const epoxyFiles = fs.readdirSync(epoxyPath, { recursive: true }).map(f => String(f).replace(/\\/g, '/'));
  const transport = epoxyFiles.find(f => f.endsWith('index.mjs'))
    || epoxyFiles.find(f => f.endsWith('.mjs') && !f.endsWith('.d.mts'));

  app.get('/bmx-urls', (req, res) => {
    res.json({ client: '/bmx/bare.cjs', transport: transport ? '/epoxy/' + transport : null, epoxyFiles });
  });

  app.use(express.static(path.join(__dirname, 'static')));

  server.on('upgrade', (req, socket, head) => {
    wispMod.server.routeRequest(req, socket, head);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`StudyHub live on :${PORT}`));

} catch (err) {
  console.error('STARTUP ERROR:', err);
  process.exit(1);
}
