const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8765 });

// Game state (authoritative on server)
let gameState = {
  players: {},
  room: {
    id: 'main',
    status: 'waiting', // waiting, countdown, playing, finished
    countdown: null,
    chat: []
  }
};

console.log('🚀 Starting Bomberman WebSocket Server');
console.log('📡 Listening on ws://localhost:8765');

function broadcast(message, exclude = null) {
  wss.clients.forEach(client => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function handleMessage(ws, message) {
  try {
    const data = JSON.parse(message);
    const msgType = data.type;

    if (msgType === 'join') {
      const playerId = data.player_id;
      const nickname = data.nickname;
      gameState.players[playerId] = {
        id: playerId,
        nickname: nickname,
        connected: true,
        ready: false
      };
      console.log(`Player ${nickname} (${playerId}) joined`);

      // Broadcast updated player list
      broadcast(JSON.stringify({
        type: 'players_update',
        players: Object.values(gameState.players)
      }));

    } else if (msgType === 'chat') {
      const playerId = data.player_id;
      const text = data.text;
      if (gameState.players[playerId]) {
        const nickname = gameState.players[playerId].nickname;
        const chatMsg = {
          player_id: playerId,
          nickname: nickname,
          text: text,
          timestamp: new Date().toISOString()
        };
        gameState.room.chat.push(chatMsg);
        console.log(`Chat: ${nickname}: ${text}`);

        // Broadcast chat message
        broadcast(JSON.stringify({
          type: 'chat',
          message: chatMsg
        }));
      }

    } else if (msgType === 'ready') {
      const playerId = data.player_id;
      if (gameState.players[playerId]) {
        gameState.players[playerId].ready = true;
        console.log(`Player ${gameState.players[playerId].nickname} is ready`);

        // Check if all players ready and start countdown
        const readyPlayers = Object.values(gameState.players).filter(p => p.ready);
        if (readyPlayers.length >= 2 && gameState.room.status === 'waiting') {
          gameState.room.status = 'countdown';
          gameState.room.countdown = 10; // 10 second countdown

          broadcast(JSON.stringify({
            type: 'countdown_start',
            countdown: 10
          }));

          // Start countdown timer
          startCountdown();
        }
      }

    } else if (msgType === 'input') {
      // Handle player input (movement, bomb placement)
      // For now, just broadcast
      broadcast(message, ws); // exclude sender
    }

  } catch (error) {
    console.error('Invalid JSON received:', message);
  }
}

function startCountdown() {
  const interval = setInterval(() => {
    gameState.room.countdown--;

    broadcast(JSON.stringify({
      type: 'countdown_update',
      countdown: gameState.room.countdown
    }));

    if (gameState.room.countdown <= 0) {
      clearInterval(interval);
      // Countdown finished, start game
      gameState.room.status = 'playing';
      broadcast(JSON.stringify({
        type: 'game_start'
      }));
      console.log('Game started!');
    }
  }, 1000);
}

wss.on('connection', function connection(ws) {
  const clientIp = ws._socket.remoteAddress || 'unknown';
  console.log(`Client connected from ${clientIp}`);

  // Send current state to new client
  ws.send(JSON.stringify({
    type: 'state_sync',
    state: gameState
  }));

  ws.on('message', function incoming(message) {
    handleMessage(ws, message);
  });

  ws.on('close', function() {
    console.log(`Client ${clientIp} disconnected`);

    // Handle player disconnection
    // For now, just remove from players (in real game, handle properly)
    const disconnectedPlayers = [];
    for (const playerId in gameState.players) {
      // Simple check: if no client has this player, remove
      // In real implementation, track client to player mapping
      disconnectedPlayers.push(playerId);
    }

    disconnectedPlayers.forEach(playerId => {
      delete gameState.players[playerId];
      console.log(`Player ${playerId} disconnected`);
    });

    // Broadcast updated player list
    broadcast(JSON.stringify({
      type: 'players_update',
      players: Object.values(gameState.players)
    }));
  });
});

console.log('✅ Server ready!');