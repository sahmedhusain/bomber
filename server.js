import { WebSocketServer } from 'ws';
import { gameState } from './server/state.js';
import { initBroadcaster } from './server/broadcast.js';
import { handleMessage, handleDisconnect } from './server/messages.js';

const wss = new WebSocketServer({ port: 8765 });
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
