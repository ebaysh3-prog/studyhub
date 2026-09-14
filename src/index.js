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

  const app = express();
  const server = createServer(app);

  app.use('/uv/', express.static(uvMod.uvPath));
  app.use('/bmx/', express.static(bmxMod.baremuxPath));

  // list what the bare-mux package actually contains
  const bmxFiles = fs.readdirSync(bmxMod.baremuxPath, { recursive: true })
    .map(f => String(f).replace(/\\/g, '/'))
    .filter(f => f.endsWith('.mjs') || f.endsWith('.cjs'));
  console.log('baremux files:', bmxFiles);
  app.get('/bmx-files', (req, res) => res.json(bmxFiles));

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
