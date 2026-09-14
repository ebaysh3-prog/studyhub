try {
  const express = (await import('express')).default;
  const { createServer } = await import('node:http');
  const uvMod = await import('@titaniumnetwork-dev/ultraviolet');
  const bmxMod = await import('@mercuryworkshop/bare-mux/node');
  const epoxyMod = await import('@mercuryworkshop/epoxy-transport/path');
  const wispMod = await import('@mercuryworkshop/wisp-js');
  const path = (await import('node:path')).default;
  const fs = (await import('node:fs')).default;
  const { fileURLToPath } = await import('node:url');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const app = express();
  const server = createServer(app);

  app.use('/uv/', express.static(uvMod.uvPath));
  app.use('/bmx/', express.static(bmxMod.baremuxPath));
  app.use('/epoxy/', express.static(epoxyMod.epoxyPath));

  // pick the epoxy transport file on the server — browser never guesses
  const epoxyFiles = fs.readdirSync(epoxyMod.epoxyPath, { recursive: true })
    .map(f => String(f).replace(/\\/g, '/'));
  console.log('epoxy files:', epoxyFiles);
  const transport = epoxyFiles.find(f => f.endsWith('index.mjs'))
    || epoxyFiles.find(f => f.endsWith('.mjs'));

  app.get('/bmx-urls', (req, res) => {
    res.json({
      client: '/bmx/bare.cjs',
      transport: transport ? '/epoxy/' + transport : null,
      epoxyFiles
    });
  });

  app.use(express.static(path.join(__dirname, 'static')));

  app.get('/sw.js', (req, res) => {
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(uvMod.uvPath, 'uv.sw.js'));
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
