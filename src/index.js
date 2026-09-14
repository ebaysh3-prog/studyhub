try {
  const express = (await import('express')).default;
  const { createServer } = await import('node:http');
  const uvMod = await import('@titaniumnetwork-dev/ultraviolet');
  const bmxMod = await import('@mercuryworkshop/bare-mux/node');
  const wispMod = await import('@mercuryworkshop/wisp-js');
  const path = (await import('node:path')).default;
  const { fileURLToPath } = await import('node:url');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  console.log('UV keys:', Object.keys(uvMod));
  console.log('BMX keys:', Object.keys(bmxMod));
  console.log('wisp.server keys:', Object.keys(wispMod.server || {}));
  console.log('wisp.server.default keys:', wispMod.server?.default ? Object.keys(wispMod.server.default) : 'none');

  const app = express();
  const server = createServer(app);

  app.use('/uv/', express.static(uvMod.uvPath));
  app.use('/bmx/', express.static(bmxMod.baremuxPath));
  app.use(express.static(path.join(__dirname, '..', 'static')));

  const WispClass = wispMod.server?.WispServer
    || wispMod.server?.default?.WispServer
    || wispMod.server?.Server
    || wispMod.server?.default?.Server
    || wispMod.server?.default;

  if (typeof WispClass !== 'function') {
    console.error('WispClass is not a function:', typeof WispClass, WispClass);
    process.exit(1);
  }

  const wisp = new WispClass({ allowed_origins: [/.*/] });

  server.on('upgrade', (req, socket, head) => {
    const route = wisp.routeUpgrade || wisp.routeRequest || wisp.handleUpgrade;
    route.call(wisp, req, socket, head);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`StudyHub live on :${PORT}`));

} catch (err) {
  console.error('STARTUP ERROR:', err);
  process.exit(1);
}
