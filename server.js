const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8765 });

// Import game models
const {
  createGameState,
  createPlayer,
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  TileType
} = require('./game/models.js');

// Game state (authoritative on server)
let gameState = {
  players: {},
  room: {
    id: 'main',
    status: 'waiting', // waiting, countdown, playing, finished
    countdown: null,
    chat: []
  },
  game: createGameState()
};

let lobbyTimer = null;

function startLobbyTimer() {
  if (lobbyTimer) clearInterval(lobbyTimer);
  lobbyTimer = setInterval(() => {
    const players = Object.values(gameState.players);
    if (players.length >= 2 && gameState.room.status === 'waiting') {
      gameState.room.status = 'countdown';
      gameState.room.countdown = 10;
      broadcast(JSON.stringify({
        type: 'countdown_start',
        countdown: 10
      }));
      startCountdown();
      clearInterval(lobbyTimer);
      lobbyTimer = null;
    }
  }, 1000);
}

function stopLobbyTimer() {
  if (lobbyTimer) {
    clearInterval(lobbyTimer);
    lobbyTimer = null;
  }
}

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

      // Start lobby timer if first player
      if (Object.keys(gameState.players).length === 1) {
        startLobbyTimer();
      }

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
      startGame();
    }
  }, 1000);
}

function startGame() {
  gameState.room.status = 'playing';

  // Place players at spawn positions
  const players = Object.values(gameState.players);
  const spawnPositions = [
    { x: 1, y: 1 },           // Top-left
    { x: MAP_WIDTH - 2, y: 1 },   // Top-right
    { x: 1, y: MAP_HEIGHT - 2 },  // Bottom-left
    { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 2 } // Bottom-right
  ];

  players.forEach((player, index) => {
    const spawn = spawnPositions[index % spawnPositions.length];
    gameState.game.players[player.id] = {
      id: player.id,
      nickname: player.nickname,
      x: spawn.x,
      y: spawn.y,
      dir: 'down',
      speed: 1,
      lives: 3,
      bombCapacity: 1,
      bombRange: 1,
      activePowerUps: {},
      status: 'alive'
    };
  });

  // Broadcast game start with full state
  broadcast(JSON.stringify({
    type: 'game_start',
    gameState: gameState.game
  }));

  console.log('🎮 Game started with', players.length, 'players!');
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

    // Stop lobby timer if less than 2 players
    if (Object.keys(gameState.players).length < 2) {
      stopLobbyTimer();
      gameState.room.status = 'waiting';
    }

    // Broadcast updated player list
    broadcast(JSON.stringify({
      type: 'players_update',
      players: Object.values(gameState.players)
    }));
  });
});

console.log('✅ Server ready!');