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
let countdownTimer = null;
let disconnectedPlayers = new Map(); // playerId -> { player, disconnectTime, timer }
let reconnectTimers = new Map(); // playerId -> timeout

// Map WebSocket connections to player IDs
const wsToPlayer = new Map();
const playerToWs = new Map();
const LOBBY_WAIT_TIME = 20; // 20 seconds to wait for more players
const COUNTDOWN_TIME = 10;  // 10 seconds countdown before game starts
const RECONNECT_GRACE_PERIOD = 30;  // 30 seconds grace period for reconnection during game

function startLobbyTimer() {
  if (lobbyTimer) clearInterval(lobbyTimer);
  
  let lobbyTimeLeft = LOBBY_WAIT_TIME;
  console.log(`🕐 Starting ${LOBBY_WAIT_TIME}-second lobby timer...`);
  
  // Broadcast lobby timer start
  broadcast(JSON.stringify({
    type: 'lobby_timer_start',
    lobbyTimeLeft: lobbyTimeLeft
  }));
  
  lobbyTimer = setInterval(() => {
    const players = Object.values(gameState.players);
    
    // If we have 4 players, immediately start countdown
    if (players.length >= 4 && gameState.room.status === 'waiting') {
      console.log('🚀 4 players reached, starting countdown immediately!');
      clearInterval(lobbyTimer);
      lobbyTimer = null;
      startCountdown();
      return;
    }
    
    // If less than 2 players, stop the timer
    if (players.length < 2) {
      console.log('👥 Less than 2 players, stopping lobby timer');
      clearInterval(lobbyTimer);
      lobbyTimer = null;
      broadcast(JSON.stringify({
        type: 'lobby_timer_cancelled'
      }));
      return;
    }
    
    lobbyTimeLeft--;
    
    // Broadcast timer update
    broadcast(JSON.stringify({
      type: 'lobby_timer_update',
      lobbyTimeLeft: lobbyTimeLeft
    }));
    
    // If timer reaches 0 and we still have 2+ players, start countdown
    if (lobbyTimeLeft <= 0) {
      console.log('⏰ Lobby timer finished, starting countdown...');
      clearInterval(lobbyTimer);
      lobbyTimer = null;
      startCountdown();
    }
  }, 1000);
}

function stopLobbyTimer() {
  if (lobbyTimer) {
    clearInterval(lobbyTimer);
    lobbyTimer = null;
  }
}

function stopCountdownTimer() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function stopAllTimers() {
  stopLobbyTimer();
  stopCountdownTimer();
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
      
      // Check if this is a reconnection attempt during game
      let isReconnection = false;
      let reconnectPlayerId = null;
      
      // Look for disconnected player with matching nickname
      for (const [disconnectedId, info] of disconnectedPlayers.entries()) {
        if (info.lobbyPlayer.nickname === nickname) {
          isReconnection = true;
          reconnectPlayerId = disconnectedId;
          break;
        }
      }
      
      if (isReconnection && handlePlayerReconnect(reconnectPlayerId, ws, nickname)) {
        // Reconnection successful, send current state
        ws.send(JSON.stringify({
          type: 'reconnected',
          playerId: reconnectPlayerId,
          gameState: gameState.game,
          roomState: gameState.room
        }));
        return;
      }
      
      // Normal join process
      // Map this WebSocket to the player
      wsToPlayer.set(ws, playerId);
      playerToWs.set(playerId, ws);
      
      gameState.players[playerId] = {
        id: playerId,
        nickname: nickname,
        connected: true,
        ready: false
      };
      console.log(`Player ${nickname} (${playerId}) joined`);

      const playerCount = Object.keys(gameState.players).length;
      
      // Start lobby timer when we reach 2 players
      if (playerCount === 2 && gameState.room.status === 'waiting') {
        startLobbyTimer();
      }
      // If we reach 4 players and lobby timer is running, let the timer handle it
      // (it will immediately trigger countdown when it sees 4 players)

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
        // Toggle ready state
        gameState.players[playerId].ready = !gameState.players[playerId].ready; // ready state toggle is just for visuals in the lobby. the countdown gets affected only by player count
        console.log(`Player ${gameState.players[playerId].nickname} is ${gameState.players[playerId].ready ? 'ready' : 'not ready'}`);
        
        broadcast(JSON.stringify({
          type: 'players_update',
          players: Object.values(gameState.players)
        }));
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
        stopAllTimers();
        gameState.game = createGameState();
        gameState.room.status = 'waiting';
        gameState.room.countdown = null;
        
        // Restart lobby timer if we have 2+ players
        const playerCount = Object.keys(gameState.players).length;
        if (playerCount >= 2) {
          startLobbyTimer();
        }
        
        broadcast(JSON.stringify({
          type: 'game_reset',
          gameState: gameState.game
        }));
      }
    } else if (msgType === 'disconnect') {
      const playerId = data.player_id;
      if (gameState.players[playerId]) {
        console.log(`Player ${gameState.players[playerId].nickname} requested to leave`);
        
        // Remove player and WebSocket mappings
        delete gameState.players[playerId];
        const playerWs = playerToWs.get(playerId);
        if (playerWs) {
          wsToPlayer.delete(playerWs);
          playerToWs.delete(playerId);
        }
        
        handlePlayerLeave();
      }
    }

  } catch (error) {
    console.error('Invalid JSON received:', message);
  }
}

function handlePlayerLeave() {
  const playerCount = Object.keys(gameState.players).length;
  
  // If less than 2 players, stop all timers and reset
  if (playerCount < 2) {
    stopAllTimers();
    gameState.room.status = 'waiting';
    gameState.room.countdown = null;
    
    broadcast(JSON.stringify({
      type: 'lobby_cancelled',
      reason: 'Not enough players'
    }));
  }
  // If countdown was running and now have less than 2 players, cancel it
  else if (playerCount < 2 && gameState.room.status === 'countdown') {
    stopCountdownTimer();
    gameState.room.status = 'waiting';
    gameState.room.countdown = null;
    
    broadcast(JSON.stringify({
      type: 'countdown_cancelled',
      reason: 'Player left during countdown'
    }));
  }
  
  // Update all clients with new player list
  broadcast(JSON.stringify({
    type: 'players_update',
    players: Object.values(gameState.players)
  }));
}

function startCountdown() {
  // Prevent multiple countdowns
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  
  // Check if we still have enough players
  const players = Object.values(gameState.players);
  if (players.length < 2) {
    console.log('❌ Not enough players for countdown, cancelling...');
    gameState.room.status = 'waiting';
    gameState.room.countdown = null;
    return;
  }
  
  gameState.room.status = 'countdown';
  gameState.room.countdown = COUNTDOWN_TIME;
  
  console.log(`🎮 Starting ${COUNTDOWN_TIME}-second countdown!`);
  
  broadcast(JSON.stringify({
    type: 'countdown_start',
    countdown: gameState.room.countdown
  }));
  
  countdownTimer = setInterval(() => {
    gameState.room.countdown--;

    broadcast(JSON.stringify({
      type: 'countdown_update',
      countdown: gameState.room.countdown
    }));

    if (gameState.room.countdown <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
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

function handleInGameDisconnect(playerId) {
  const gamePlayer = gameState.game.players[playerId];
  const lobbyPlayer = gameState.players[playerId];
  
  if (!gamePlayer || !lobbyPlayer) return;
  
  console.log(`🔌 Player ${lobbyPlayer.nickname} disconnected during game, starting ${RECONNECT_GRACE_PERIOD}s grace period`);
  
  // Mark player as disconnected in game state
  gamePlayer.disconnected = true;
  gamePlayer.disconnectTime = Date.now();
  
  // Store disconnected player info
  disconnectedPlayers.set(playerId, {
    gamePlayer: { ...gamePlayer },
    lobbyPlayer: { ...lobbyPlayer },
    disconnectTime: Date.now()
  });
  
  // Remove from active lobby players but keep in game
  delete gameState.players[playerId];
  
  // Set timer to eliminate player after grace period
  const timer = setTimeout(() => {
    eliminateDisconnectedPlayer(playerId);
  }, RECONNECT_GRACE_PERIOD * 1000);
  
  reconnectTimers.set(playerId, timer);
  
  // Broadcast updated game state
  broadcast(JSON.stringify({
    type: 'player_disconnected',
    playerId: playerId,
    gracePeriod: RECONNECT_GRACE_PERIOD
  }));
  
  broadcast(JSON.stringify({
    type: 'game_update',
    gameState: gameState.game
  }));
}

function eliminateDisconnectedPlayer(playerId) {
  console.log(`💀 Eliminating disconnected player ${playerId} - grace period expired`);
  
  // Remove from game
  if (gameState.game.players[playerId]) {
    gameState.game.players[playerId].status = 'eliminated';
    gameState.game.players[playerId].lives = 0;
  }
  
  // Clean up tracking
  disconnectedPlayers.delete(playerId);
  reconnectTimers.delete(playerId);
  
  // Broadcast elimination
  broadcast(JSON.stringify({
    type: 'player_eliminated',
    playerId: playerId,
    reason: 'disconnected'
  }));
  
  broadcast(JSON.stringify({
    type: 'game_update',
    gameState: gameState.game
  }));
  
  // Check if game should end
  checkGameEnd();
}

function handlePlayerReconnect(playerId, ws, nickname) {
  const disconnectedInfo = disconnectedPlayers.get(playerId);
  
  if (!disconnectedInfo) {
    console.log(`⚠️ Player ${nickname} tried to reconnect but no disconnect info found`);
    return false;
  }
  
  console.log(`🔄 Player ${nickname} reconnected within grace period!`);
  
  // Cancel elimination timer
  const timer = reconnectTimers.get(playerId);
  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(playerId);
  }
  
  // Restore player to lobby state
  gameState.players[playerId] = disconnectedInfo.lobbyPlayer;
  
  // Update WebSocket mappings
  wsToPlayer.set(ws, playerId);
  playerToWs.set(playerId, ws);
  
  // Update game player state - remove disconnect flag
  if (gameState.game.players[playerId]) {
    delete gameState.game.players[playerId].disconnected;
    delete gameState.game.players[playerId].disconnectTime;
  }
  
  // Clean up tracking
  disconnectedPlayers.delete(playerId);
  
  // Broadcast reconnection
  broadcast(JSON.stringify({
    type: 'player_reconnected',
    playerId: playerId
  }));
  
  broadcast(JSON.stringify({
    type: 'players_update',
    players: Object.values(gameState.players)
  }));
  
  broadcast(JSON.stringify({
    type: 'game_update',
    gameState: gameState.game
  }));
  
  return true;
}

function checkGameEnd() {
  if (gameState.room.status !== 'playing') return;
  
  const alivePlayers = Object.values(gameState.game.players).filter(p => p.status === 'alive');
  
  if (alivePlayers.length <= 1) {
    console.log(`🏆 Game ending - ${alivePlayers.length} players remaining`);
    endGame();
  }
}

function endGame() {
  gameState.room.status = 'finished';
  
  // Clear all disconnect timers
  reconnectTimers.forEach(timer => clearTimeout(timer));
  reconnectTimers.clear();
  disconnectedPlayers.clear();
  
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

    // Only remove the specific player associated with this WebSocket
    const playerId = wsToPlayer.get(ws);
    if (playerId && gameState.players[playerId]) {
      const playerName = gameState.players[playerId].nickname;
      console.log(`Player ${playerName} (${playerId}) disconnected`);
      
      // Check if game is currently running
      if (gameState.room.status === 'playing' && gameState.game.players[playerId]) {
        handleInGameDisconnect(playerId);
      } else {
        // In lobby - remove immediately
        delete gameState.players[playerId];
        handlePlayerLeave();
      }
      
      // Always clean up WebSocket mappings
      wsToPlayer.delete(ws);
      playerToWs.delete(playerId);
    }
  });
});

console.log('✅ Server ready!');