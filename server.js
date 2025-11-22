import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8765 });

import {
  createGameState,
  createPlayer,
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  TileType
} from './game/models.js';

let gameState = {
  players: {},
  room: {
    id: 'main',
    status: 'waiting',
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

      if (Object.keys(gameState.players).length === 1) {
        startLobbyTimer();
      }

      broadcast(JSON.stringify({
        type: 'players_update',
        players: Object.values(gameState.players)
      }));

    } else if (msgType === 'chat') {
      const playerId = data.player_id;
      const text = data.text?.trim();
      
      if (!text || text.length === 0) {
        console.warn('Empty chat message ignored');
        return;
      }
      
      if (!gameState.players[playerId]) {
        console.warn('Chat message from unknown player:', playerId);
        return;
      }
      
      const nickname = gameState.players[playerId].nickname;
      const chatMsg = {
        player_id: playerId,
        nickname: nickname,
        text: text.slice(0, 200), // Limit message length
        timestamp: new Date().toISOString()
      };
      
      // Ensure chat array exists
      if (!Array.isArray(gameState.room.chat)) {
        gameState.room.chat = [];
      }
      
      gameState.room.chat.push(chatMsg);
      
      // Keep only last 50 messages
      if (gameState.room.chat.length > 50) {
        gameState.room.chat = gameState.room.chat.slice(-50);
      }
      
      console.log(`💬 ${nickname}: ${text}`);

      broadcast(JSON.stringify({
        type: 'chat',
        message: chatMsg
      }));
    } else if (msgType === 'ready') {
      const playerId = data.player_id;
      if (gameState.players[playerId]) {
        gameState.players[playerId].ready = true;
        console.log(`Player ${gameState.players[playerId].nickname} is ready`);

        const readyPlayers = Object.values(gameState.players).filter(p => p.ready);
        if (readyPlayers.length >= 2 && gameState.room.status === 'waiting') {
          gameState.room.status = 'countdown';
          gameState.room.countdown = 10;

          broadcast(JSON.stringify({
            type: 'countdown_start',
            countdown: 10
          }));

          startCountdown();
        }
      }

    } else if (msgType === 'input') {
      broadcast(message, ws);
    } else if (msgType === 'play_again') {
      const playerId = data.player_id;
      if (gameState.players[playerId]) {
        // Reset player ready status for new game
        gameState.players[playerId].ready = false;
        console.log(`Player ${gameState.players[playerId].nickname} wants to play again`);
        
        // Reset game state for new round
        gameState.game = createGameState();
        gameState.room.status = 'waiting';
        gameState.room.countdown = null;
        
        broadcast(JSON.stringify({
          type: 'game_reset',
          gameState: gameState.game
        }));
      }
    } else if (msgType === 'disconnect') {
      const playerId = data.player_id;
      if (gameState.players[playerId]) {
        console.log(`Player ${gameState.players[playerId].nickname} disconnected`);
        delete gameState.players[playerId];
        
        broadcast(JSON.stringify({
          type: 'players_update',
          players: Object.values(gameState.players)
        }));
      }
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
      startGame();
    }
  }, 1000);
}

function startGame() {
  gameState.room.status = 'playing';
  gameState.room.countdown = null;

  const players = Object.values(gameState.players);
  
  // For testing: automatically end game after 5 seconds
  setTimeout(() => {
    if (gameState.room.status === 'playing') {
      endGame();
    }
  }, 5000);
  const spawnPositions = [
    { x: 1, y: 1 },
    { x: MAP_WIDTH - 2, y: 1 },
    { x: 1, y: MAP_HEIGHT - 2 },
    { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 2 }
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

  // Clear countdown first
  broadcast(JSON.stringify({
    type: 'countdown_end'
  }));

  // Then start game
  broadcast(JSON.stringify({
    type: 'game_start',
    gameState: gameState.game
  }));

  console.log('🎮 Game started with', players.length, 'players!');
}

function endGame() {
  gameState.room.status = 'finished';
  
  // Pick a random winner for testing
  const alivePlayers = Object.values(gameState.players);
  if (alivePlayers.length > 0) {
    const randomWinner = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    gameState.game.winnerId = randomWinner.id;
    gameState.game.status = 'finished';
    
    console.log(`🏆 Game ended! Winner: ${randomWinner.nickname}`);
  }
  
  // Broadcast game end
  broadcast(JSON.stringify({
    type: 'game_end',
    gameState: gameState.game
  }));
}

wss.on('connection', function connection(ws) {
  const clientIp = ws._socket.remoteAddress || 'unknown';
  console.log(`Client connected from ${clientIp}`);

  ws.send(JSON.stringify({
    type: 'state_sync',
    state: {
      ...gameState,
      chat: gameState.room.chat
    }
  }));

  ws.on('message', function incoming(message) {
    handleMessage(ws, message);
  });

  ws.on('close', function () {
    console.log(`Client ${clientIp} disconnected`);

    const disconnectedPlayers = [];
    for (const playerId in gameState.players) {
      disconnectedPlayers.push(playerId);
    }

    disconnectedPlayers.forEach(playerId => {
      delete gameState.players[playerId];
      console.log(`Player ${playerId} disconnected`);
    });

    if (Object.keys(gameState.players).length < 2) {
      stopLobbyTimer();
      gameState.room.status = 'waiting';
    }

    broadcast(JSON.stringify({
      type: 'players_update',
      players: Object.values(gameState.players)
    }));
  });
});

console.log('✅ Server ready!');