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
  const epoxyFiles = fs.readdirSync(epoxyPath, { recursive: true })
    .map(f => String(f).replace(/\\/g, '/'));
  const rawTransport = epoxyFiles.find(f => f.endsWith('index.mjs'))
    || epoxyFiles.find(f => f.endsWith('.mjs') && !f.endsWith('.d.mts'));

  const hasBmxBundle = fs.existsSync(path.join(__dirname, 'static', 'bmx.mjs'));
  const hasEpoxyBundle = fs.existsSync(path.join(__dirname, 'static', 'epoxy.mjs'));
  console.log('bundles — bmx:', hasBmxBundle, '| epoxy:', hasEpoxyBundle, '| raw:', rawTransport);

  const app = express();
  const server = createServer(app);

  app.use((req, res, next) => {
    if (req.path === '/uv/uv.sw.js') res.setHeader('Service-Worker-Allowed', '/');
    next();
  });

  app.use('/uv/', express.static(uvMod.uvPath));
  app.use('/bmx/', express.static(bmxMod.baremuxPath));
  app.use('/epoxy/', express.static(epoxyPath));
  app.use(express.static(path.join(__dirname, 'static')));

  app.get('/bmx-urls', (req, res) => {
    const transports = [];
    if (hasEpoxyBundle) transports.push('/epoxy.mjs');
    if (rawTransport) transports.push('/epoxy/' + rawTransport);
    res.json({ hasBundle: hasBmxBundle, transports, epoxyFiles });
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