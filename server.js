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
  spectators: {},
  room: {
    id: 'main',
    status: 'waiting',
    countdown: null,
    chat: []
  },
  game: createGameState(),
  userIntentions: {}, // Track post-game intentions: { userId: 'play_again' | 'join_game' | 'leave' }
  userRoles: {}, // Track current user roles: { userId: 'player' | 'spectator' | null }
  userPriorities: {} // Track role assignment priorities: { userId: number }
};

let lobbyTimer = null;
let countdownTimer = null;

// Map WebSocket connections to player IDs
const wsToPlayer = new Map();
const playerToWs = new Map();
const LOBBY_WAIT_TIME = 20; // 20 seconds to wait for more players
const COUNTDOWN_TIME = 10;  // 10 seconds countdown before game starts

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
      let nickname = data.nickname;
      
      // Normal join process - ensure unique nickname
      nickname = getUniqueNickname(nickname);
      
      // Map this WebSocket to the player
      wsToPlayer.set(ws, playerId);
      playerToWs.set(playerId, ws);
      
      const currentPlayerCount = Object.keys(gameState.players).length;
      
      // If game is active or lobby is full (4 players), join as spectator
      if (gameState.room.status === 'playing' || gameState.room.status === 'countdown' || currentPlayerCount >= 4) {
        gameState.spectators[playerId] = {
          id: playerId,
          nickname: nickname,
          connected: true
        };
        
        // Track user role
        gameState.userRoles[playerId] = 'spectator';
        
        console.log(`Player ${nickname} (${playerId}) joined as spectator`);
        
        // Send spectator state
        ws.send(JSON.stringify({
          type: 'joined_as_spectator',
          playerId: playerId,
          gameState: gameState.game,
          roomState: gameState.room,
          players: Object.values(gameState.players),
          spectators: Object.values(gameState.spectators)
        }));
        
        // Broadcast updated spectator list
        broadcast(JSON.stringify({
          type: 'spectators_update',
          spectators: Object.values(gameState.spectators)
        }));
        
        return;
      }
      
      // Join as regular player
      gameState.players[playerId] = {
        id: playerId,
        nickname: nickname,
        connected: true,
        ready: false
      };
      
      // Track user role
      gameState.userRoles[playerId] = 'player';
      
      console.log(`Player ${nickname} (${playerId}) joined`);

      const playerCount = Object.keys(gameState.players).length;
      
      // Start lobby timer when we reach 2 players
      if (playerCount === 2 && gameState.room.status === 'waiting' && !lobbyTimer) {
        startLobbyTimer();
      }
      // Reset lobby timer when 3rd player joins
      else if (playerCount === 3 && gameState.room.status === 'waiting' && lobbyTimer) {
        console.log('🔄 3rd player joined, resetting lobby timer');
        startLobbyTimer(); // This will clear the existing timer and start a new one
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
      
      let nickname = null;
      let isSpectator = false;
      
      // Check if it's a player or spectator
      if (gameState.players[playerId]) {
        nickname = gameState.players[playerId].nickname;
      } else if (gameState.spectators[playerId]) {
        nickname = gameState.spectators[playerId].nickname;
        isSpectator = true;
      } else {
        console.warn('Chat message from unknown user:', playerId);
        return;
      }
      const chatMsg = {
        player_id: playerId,
        nickname: nickname,
        text: text.slice(0, 200), // Limit message length
        timestamp: new Date().toISOString(),
        isSpectator: isSpectator
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
      console.log(`Player ${playerId} wants to play again`);
      
      // Record intention and set high priority (previous players get priority 1)
      gameState.userIntentions[playerId] = 'play_again';
      gameState.userPriorities[playerId] = 1; // Highest priority
      
      // Acknowledge the intention
      const playerWs = playerToWs.get(playerId);
      if (playerWs) {
        playerWs.send(JSON.stringify({
          type: 'intention_recorded',
          intention: 'play_again'
        }));
      }
      
    } else if (msgType === 'join_game') {
      const playerId = data.player_id;
      console.log(`Spectator ${playerId} wants to join game`);
      
      // Record intention and set medium priority (spectators get priority 2)
      gameState.userIntentions[playerId] = 'join_game';
      gameState.userPriorities[playerId] = 2; // Lower priority than previous players
      
      // Acknowledge the intention
      const playerWs = playerToWs.get(playerId);
      if (playerWs) {
        playerWs.send(JSON.stringify({
          type: 'intention_recorded',
          intention: 'join_game'
        }));
      }
      
    } else if (msgType === 'leave_lobby') {
      const playerId = data.player_id;
      console.log(`User ${playerId} wants to leave lobby`);
      
      // Clean up all data for this user
      delete gameState.userIntentions[playerId];
      delete gameState.userRoles[playerId];
      delete gameState.userPriorities[playerId];
      
      // Remove from players or spectators
      if (gameState.players[playerId]) {
        delete gameState.players[playerId];
        handlePlayerLeave();
      } else if (gameState.spectators[playerId]) {
        delete gameState.spectators[playerId];
        broadcast(JSON.stringify({
          type: 'spectators_update',
          spectators: Object.values(gameState.spectators)
        }));
      }
      
      // Remove WebSocket mappings
      const userWs = playerToWs.get(playerId);
      if (userWs) {
        wsToPlayer.delete(userWs);
        playerToWs.delete(playerId);
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
      } else if (gameState.spectators[playerId]) {
        console.log(`Spectator ${gameState.spectators[playerId].nickname} requested to leave`);
        
        // Remove spectator and WebSocket mappings
        delete gameState.spectators[playerId];
        const spectatorWs = playerToWs.get(playerId);
        if (spectatorWs) {
          wsToPlayer.delete(spectatorWs);
          playerToWs.delete(playerId);
        }
        
        // Broadcast updated spectator list
        broadcast(JSON.stringify({
          type: 'spectators_update',
          spectators: Object.values(gameState.spectators)
        }));
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
  // If we still have 2+ players and lobby timer was running, reset it
  else if (playerCount >= 2 && gameState.room.status === 'waiting' && lobbyTimer) {
    console.log('🔄 Player left but still have enough players, resetting lobby timer');
    startLobbyTimer(); // This will reset the timer
  }

  // If we went from 1 to 2 players (someone joined after everyone left), start timer
  else if (playerCount === 2 && gameState.room.status === 'waiting' && !lobbyTimer) {
    console.log('👥 Back to 2 players, starting lobby timer');
    startLobbyTimer();
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
  
  // For testing: automatically end game after 30 seconds
  setTimeout(() => {
    if (gameState.room.status === 'playing') {
      endGame();
    }
  }, 30000);
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
  
  console.log(`💀 Player ${lobbyPlayer.nickname} disconnected during game - immediate elimination`);
  
  // Eliminate player immediately
  gamePlayer.status = 'eliminated';
  gamePlayer.lives = 0;
  
  // Remove from lobby players
  delete gameState.players[playerId];
  
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
  
  broadcast(JSON.stringify({
    type: 'players_update',
    players: Object.values(gameState.players)
  }));
  
  // Check if game should end
  checkGameEnd();
}



function checkGameEnd() {
  if (gameState.room.status !== 'playing') return;
  
  const alivePlayers = Object.values(gameState.game.players).filter(p => p.status === 'alive');
  
  if (alivePlayers.length <= 1) {
    console.log(`🏆 Game ending - ${alivePlayers.length} players remaining`);
    endGame();
  }
}

function resetUserRoles() {
  console.log(`🔄 Resetting user roles and applying priority logic`);
  
  // Step 1: Temporarily reset all user roles to null
  const allUserIds = [...Object.keys(gameState.players), ...Object.keys(gameState.spectators)];
  
  allUserIds.forEach(userId => {
    gameState.userRoles[userId] = null;
  });
  
  // Step 2: Collect all users with their intentions and priorities
  const usersByPriority = allUserIds
    .filter(userId => gameState.userIntentions[userId] !== 'leave') // Exclude users who want to leave
    .map(userId => {
      const isCurrentPlayer = gameState.players[userId] !== undefined;
      const isCurrentSpectator = gameState.spectators[userId] !== undefined;
      
      let nickname = '';
      if (isCurrentPlayer) {
        nickname = gameState.players[userId].nickname;
      } else if (isCurrentSpectator) {
        nickname = gameState.spectators[userId].nickname;
      }
      
      return {
        id: userId,
        nickname: nickname,
        intention: gameState.userIntentions[userId],
        priority: gameState.userPriorities[userId] || 999, // Default to lowest priority
        wasPlayer: isCurrentPlayer,
        wasSpectator: isCurrentSpectator
      };
    })
    .sort((a, b) => {
      // Sort by priority (lower number = higher priority), then by user ID for consistency
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.id.localeCompare(b.id);
    });
  
  console.log('Users by priority:', usersByPriority.map(u => `${u.nickname}(${u.intention},p:${u.priority})`));
  
  // Step 3: Clear current players and spectators
  const newPlayers = {};
  const newSpectators = {};
  
  // Step 4: Reassign roles based on priorities
  let playersAssigned = 0;
  const maxPlayers = 4;
  
  usersByPriority.forEach(user => {
    if (user.intention === 'leave') {
      return; // Skip users who want to leave
    }
    
    // Assign to players if there's room and user wants to play
    if (playersAssigned < maxPlayers && 
        (user.intention === 'play_again' || user.intention === 'join_game')) {
      newPlayers[user.id] = {
        id: user.id,
        nickname: user.nickname,
        connected: true,
        ready: false
      };
      gameState.userRoles[user.id] = 'player';
      playersAssigned++;
      console.log(`✅ Assigned ${user.nickname} as player (priority ${user.priority})`);
    } else {
      // Assign remaining users as spectators
      newSpectators[user.id] = {
        id: user.id,
        nickname: user.nickname,
        connected: true
      };
      gameState.userRoles[user.id] = 'spectator';
      console.log(`👁️ Assigned ${user.nickname} as spectator`);
    }
  });
  
  // Step 5: Update game state
  gameState.players = newPlayers;
  gameState.spectators = newSpectators;
  
  // Step 6: Clear intentions and priorities (they've been processed)
  gameState.userIntentions = {};
  gameState.userPriorities = {};
  
  console.log(`🎭 Role reassignment complete: ${Object.keys(newPlayers).length} players, ${Object.keys(newSpectators).length} spectators`);
}

function resetGameToLobby() {
  console.log(`🔄 Resetting game back to lobby`);
  
  // Stop all timers
  stopAllTimers();
  
  // Reset game state
  gameState.game = createGameState();
  gameState.room.status = 'waiting';
  gameState.room.countdown = null;
  
  // Apply role reset and priority logic
  resetUserRoles();
  
  // Restart lobby timer if we have 2+ players
  const playerCount = Object.keys(gameState.players).length;
  if (playerCount >= 2) {
    startLobbyTimer();
  }
  
  // Broadcast reset to all clients
  broadcast(JSON.stringify({
    type: 'return_to_lobby',
    gameState: gameState.game,
    roomState: gameState.room,
    players: Object.values(gameState.players),
    spectators: Object.values(gameState.spectators)
  }));
}

function getUniqueNickname(desiredNickname) {
  const existingNicknames = new Set();
  
  // Collect all existing nicknames from active players
  Object.values(gameState.players).forEach(player => {
    existingNicknames.add(player.nickname);
  });
  
  // Collect all existing nicknames from spectators
  Object.values(gameState.spectators).forEach(spectator => {
    existingNicknames.add(spectator.nickname);
  });
  
  // If nickname is unique, return as-is
  if (!existingNicknames.has(desiredNickname)) {
    return desiredNickname;
  }
  
  // Find the next available number suffix
  let counter = 2;
  let uniqueNickname = `${desiredNickname}${counter}`;
  
  while (existingNicknames.has(uniqueNickname)) {
    counter++;
    uniqueNickname = `${desiredNickname}${counter}`;
  }
  
  console.log(`Nickname "${desiredNickname}" taken, assigned "${uniqueNickname}"`);
  return uniqueNickname;
}

function endGame() {
  gameState.room.status = 'game_ending';
  
  // Pick a random winner for testing from game players
  const alivePlayers = Object.values(gameState.game.players).filter(p => p.status === 'alive');
  const allGamePlayers = Object.values(gameState.game.players);
  
  let winner = null;
  if (alivePlayers.length === 1) {
    winner = alivePlayers[0];
  } else if (alivePlayers.length > 1) {
    // Multiple survivors, pick random
    winner = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
  } else if (allGamePlayers.length > 0) {
    // No survivors, pick random from all players
    winner = allGamePlayers[Math.floor(Math.random() * allGamePlayers.length)];
  }
  
  if (winner) {
    gameState.game.winnerId = winner.id;
    console.log(`🏆 Game ended! Winner: ${winner.nickname}`);
  } else {
    console.log(`🏆 Game ended with no winner`);
  }
  
  gameState.game.status = 'finished';
  
  // Broadcast game end (but not results yet)
  broadcast(JSON.stringify({
    type: 'game_end',
    gameState: gameState.game
  }));
  
  // Wait 30 seconds before showing results
  setTimeout(() => {
    gameState.room.status = 'results';
    
    console.log(`📊 Showing results screen`);
    
    broadcast(JSON.stringify({
      type: 'show_results',
      gameState: gameState.game,
      winner: winner
    }));
    
    // After showing results for 10 seconds, return to lobby
    setTimeout(() => {
      resetGameToLobby();
    }, 10000);
  }, 30000);
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
    
    // Check if it's a regular player
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
    }
    // Check if it's a spectator
    else if (playerId && gameState.spectators[playerId]) {
      const spectatorName = gameState.spectators[playerId].nickname;
      console.log(`Spectator ${spectatorName} (${playerId}) disconnected`);
      delete gameState.spectators[playerId];
      
      // Broadcast updated spectator list
      broadcast(JSON.stringify({
        type: 'spectators_update',
        spectators: Object.values(gameState.spectators)
      }));
    }
    
    // Always clean up WebSocket mappings
    wsToPlayer.delete(ws);
    playerToWs.delete(playerId);
  });
});

console.log('✅ Server ready!');