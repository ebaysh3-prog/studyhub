import express from 'express';
import { createServer } from 'node:http';
import { uvPath } from '@titaniumnetwork-dev/ultraviolet';
import { baremuxPath } from '@mercuryworkshop/bare-mux/node';
import { createWisp } from 'wisp-server-node';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);

app.use('/uv/', express.static(uvPath));
app.use('/bmx/', express.static(baremuxPath));
app.use(express.static(path.join(__dirname, '..', 'static')));

const wisp = createWisp(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`StudyHub live on :${PORT}`));
