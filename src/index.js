try {
  const express = (await import('express')).default;
  const { createServer } = await import('node:http');
  const uvMod = await import('@titaniumnetwork-dev/ultraviolet');
  const bareMod = await import('bare-server-node');
  const path = (await import('node:path')).default;
  const { fileURLToPath } = await import('node:url');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // what does this version actually export?
  console.log('bare-server-node exports:', Object.keys(bareMod));
  if (bareMod.default) console.log('bare default keys:', Object.keys(bareMod.default));

  const app = express();
  const server = createServer(app);

  app.use((req, res, next) => {
    if (req.path === '/uv/uv.sw.js') res.setHeader('Service-Worker-Allowed', '/');
    next();
  });

  app.use('/uv/', express.static(uvMod.uvPath));
  app.use(express.static(path.join(__dirname, 'static')));

  // find the right factory function no matter its name
  const candidates = [
    bareMod.createBareServer,
    bareMod.attachBareServer,
    bareMod.default?.createBareServer,
    bareMod.default?.default,
    bareMod.default
  ].filter(f => typeof f === 'function');

  if (!candidates.length) {
    throw new Error('No bare factory found. Exports: ' + Object.keys(bareMod).join(', '));
  }

  let bare = null;
  for (const make of candidates) {
    try {
      const b = make('/bare/');
      if (b && typeof b.shouldRoute === 'function') { bare = b; break; }
    } catch (e) { console.log('factory attempt failed:', e.message); }
  }
  if (!bare) throw new Error('Created bare server but it has no shouldRoute');
  console.log('bare server ready');

  server.on('request', (req, res) => {
    if (bare.shouldRoute(req)) bare.routeRequest(req, res);
    else app(req, res);
  });

  const PORT = process.env.PORT || 3000;
