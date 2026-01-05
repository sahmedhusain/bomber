import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFile } from 'fs';
import { extname, join } from 'path';
import { gameState } from './server/state.js';
import { initBroadcaster } from './server/broadcast.js';
import { handleMessage, handleDisconnect } from './server/messages.js';

const HTTP_PORT = 8080;
const WS_PORT = 8765;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const httpServer = createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = join(process.cwd(), filePath);

  if (!filePath.startsWith(process.cwd())) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = extname(filePath);
  const contentType = mimeTypes[ext] || 'text/plain';

  readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Internal server error');
      }
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`HTTP server running at http://localhost:${HTTP_PORT}`);
});

const wss = new WebSocketServer({ port: WS_PORT });
initBroadcaster(wss);

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'state_sync',
    state: {
      ...gameState,
      chat: gameState.room.chat
    }
  }));

  ws.on('message', (message) => {
    handleMessage(ws, message);
  });

  ws.on('close', () => {
    handleDisconnect(ws);
  });
});

console.log(`WebSocket server running at ws://localhost:${WS_PORT}`);
