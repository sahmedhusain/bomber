import { WebSocket } from 'ws';
import { gameState } from './state.js';

let wssRef = null;

export const initBroadcaster = (wss) => {
  wssRef = wss;
};

export const broadcast = (message, exclude = null) => {
  if (!wssRef) return;
  wssRef.clients.forEach(client => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

export const broadcastPlayers = () => broadcast(JSON.stringify({
  type: 'players_update',
  players: Object.values(gameState.players)
}));

export const broadcastSpectators = () => broadcast(JSON.stringify({
  type: 'spectators_update',
  spectators: Object.values(gameState.spectators)
}));

export const broadcastGameUpdate = () => broadcast(JSON.stringify({
  type: 'game_update',
  gameState: gameState.game
}));
