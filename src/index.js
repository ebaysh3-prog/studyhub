import express from 'express';
import { createServer } from 'node:http';
import { uvPath } from '@titaniumnetwork-dev/ultraviolet';
import { baremuxPath } from '@mercuryworkshop/bare-mux/node';
import * as wispModule from '@mercuryworkshop/wisp-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// probe inside the server export
console.log('wisp.server keys:', Object.keys(wispModule.server));
console.log('wisp.server.default keys:', wispModule.server.default ? Object.keys(wispModule.server.default) : 'none');

const app = express();
const server = createServer(app);

app.use('/uv/', express.static(uvPath));
app.use('/bmx/', express.static(baremuxPath));
app.use(express.static(path.join(__dirname, '..', 'static')));

// try common names
const WispServerClass = wispModule.server.WispServer
  || wispModule.server.default?.WispServer
  || wispModule.server.Server
  || wispModule.server.default?.Server;

if (!WispServerClass) {
  console.error('Could not find WispServer class. Check the keys printed above.');
  process.exit(1);
}

const wisp = new WispServerClass({ allowed_origins: [/.*/] });

server.on('upgrade', (req, socket, head) => {
  const route = wisp.routeUpgrade || wisp.routeRequest || wisp.handleUpgrade;
  route.call(wisp, req, socket, head);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`StudyHub live on :${PORT}`));
