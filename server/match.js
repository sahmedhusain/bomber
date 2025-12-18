import { gameState, timers, GAME_TICK_MS, LOBBY_WAIT_TIME, COUNTDOWN_TIME, createGameState } from './state.js';
import { broadcast, broadcastGameUpdate, broadcastPlayers, broadcastSpectators } from './broadcast.js';
import { wsToPlayer, playerToWs } from './connections.js';
import { processInputs, processBombs, cleanupExplosions } from './gameLogic.js';
import { MAP_WIDTH, MAP_HEIGHT, DEFAULT_LIVES, DEFAULT_BOMB_CAPACITY, DEFAULT_BOMB_RANGE } from '../game/models.js';

export function startLobbyTimer() {
  if (timers.lobbyTimer) clearInterval(timers.lobbyTimer);

  let lobbyTimeLeft = LOBBY_WAIT_TIME;

  broadcast(JSON.stringify({
    type: 'lobby_timer_start',
    lobbyTimeLeft: lobbyTimeLeft
  }));

  timers.lobbyTimer = setInterval(() => {
    const players = Object.values(gameState.players);

    if (players.length >= 4 && gameState.room.status === 'waiting') {
      clearInterval(timers.lobbyTimer);
      timers.lobbyTimer = null;
      startCountdown();
      return;
    }

    if (players.length < 2) {
      clearInterval(timers.lobbyTimer);
      timers.lobbyTimer = null;
      broadcast(JSON.stringify({
        type: 'lobby_timer_cancelled'
      }));
      return;
    }

    lobbyTimeLeft--;

    broadcast(JSON.stringify({
      type: 'lobby_timer_update',
      lobbyTimeLeft: lobbyTimeLeft
    }));

    if (lobbyTimeLeft <= 0) {
      clearInterval(timers.lobbyTimer);
      timers.lobbyTimer = null;
      startCountdown();
    }
  }, 1000);
}

export function stopLobbyTimer() {
  if (timers.lobbyTimer) {
    clearInterval(timers.lobbyTimer);
    timers.lobbyTimer = null;
  }
}

export function stopCountdownTimer() {
  if (timers.countdownTimer) {
    clearInterval(timers.countdownTimer);
    timers.countdownTimer = null;
  }
}

export function stopGameLoop() {
  if (timers.gameLoopTimer) {
    clearInterval(timers.gameLoopTimer);
    timers.gameLoopTimer = null;
  }
}

export function stopAllTimers() {
  stopLobbyTimer();
  stopCountdownTimer();
  stopGameLoop();

  // Stop play again and spectator join timers
  if (timers.playAgainTimer) {
    clearTimeout(timers.playAgainTimer);
    timers.playAgainTimer = null;
  }
  if (timers.spectatorJoinTimer) {
    clearInterval(timers.spectatorJoinTimer);
    timers.spectatorJoinTimer = null;
  }
}

export function startCountdown() {
  if (timers.countdownTimer) {
    clearInterval(timers.countdownTimer);
  }

  const players = Object.values(gameState.players);
  if (players.length < 2) {
    gameState.room.status = 'waiting';
    gameState.room.countdown = null;
    return;
  }

  gameState.room.status = 'countdown';
  gameState.room.countdown = COUNTDOWN_TIME;

  broadcast(JSON.stringify({
    type: 'countdown_start',
    countdown: gameState.room.countdown
  }));

  timers.countdownTimer = setInterval(() => {
    gameState.room.countdown--;

    broadcast(JSON.stringify({
      type: 'countdown_update',
      countdown: gameState.room.countdown
    }));

    if (gameState.room.countdown <= 0) {
      clearInterval(timers.countdownTimer);
      timers.countdownTimer = null;
      startGame();
    }
  }, 1000);
}

export function startGameLoop() {
  if (timers.gameLoopTimer) clearInterval(timers.gameLoopTimer);
  timers.gameLoopTimer = setInterval(() => {
    if (gameState.room.status !== 'playing') return;
    processInputs();
    processBombs();
    cleanupExplosions();
    checkGameEnd();
    broadcastGameUpdate();
  }, GAME_TICK_MS);
}

export function startGame() {
  gameState.room.status = 'playing';
  gameState.room.countdown = null;
  gameState.game = createGameState();
  gameState.game.status = 'running';
  gameState.game.explosions = {};

  const players = Object.values(gameState.players);

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
      lives: DEFAULT_LIVES,
      bombCapacity: DEFAULT_BOMB_CAPACITY,
      bombRange: DEFAULT_BOMB_RANGE,
      activePowerUps: {},
      status: 'alive'
    };
  });

  broadcast(JSON.stringify({
    type: 'countdown_end'
  }));

  broadcast(JSON.stringify({
    type: 'game_start',
    gameState: gameState.game,
    playerIds: Object.keys(gameState.players),
    spectatorIds: Object.keys(gameState.spectators)
  }));

  startGameLoop();
}

export function handleInGameDisconnect(playerId) {
  const gamePlayer = gameState.game.players[playerId];

  if (!gamePlayer) return;

  gamePlayer.status = 'eliminated';
  gamePlayer.lives = 0;
  gamePlayer.disconnected = true;

  delete gameState.players[playerId];
  delete gameState.userRoles[playerId];
  delete gameState.userIntentions[playerId];
  delete gameState.userPriorities[playerId];

  broadcastPlayers();
  broadcastGameUpdate();

  checkGameEnd();
}

export function checkGameEnd() {
  if (gameState.room.status !== 'playing') return;

  const alivePlayers = Object.values(gameState.game.players).filter(p => p.status === 'alive');

  if (alivePlayers.length <= 1) {
    endGame();
  }
}

export function resetUserRoles() {

  const allUserIds = [...Object.keys(gameState.players), ...Object.keys(gameState.spectators)];

  allUserIds.forEach(userId => {
    gameState.userRoles[userId] = null;
  });

  const usersByPriority = allUserIds
    .filter(userId => gameState.userIntentions[userId] !== 'leave')
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
        priority: gameState.userPriorities[userId] || 999,
        wasPlayer: isCurrentPlayer,
        wasSpectator: isCurrentSpectator
      };
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.id.localeCompare(b.id);
    });


  const newPlayers = {};
  const newSpectators = {};
  const spectatorsToRemove = [];

  let playersAssigned = 0;
  const maxPlayers = 4;

  usersByPriority.forEach(user => {

    if (user.intention === 'leave') {
      return;
    }

    if (user.wasSpectator && user.intention === undefined) {
      spectatorsToRemove.push(user.id);
      return;
    }

    if (user.wasPlayer && user.intention === undefined) {
      spectatorsToRemove.push(user.id);
      return;
    }


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
    } else {
      newSpectators[user.id] = {
        id: user.id,
        nickname: user.nickname,
        connected: true
      };
      gameState.userRoles[user.id] = 'spectator';
    }
  });

  gameState.players = newPlayers;
  gameState.spectators = newSpectators;

  spectatorsToRemove.forEach(userId => {
    const playerWs = playerToWs.get(userId);
    if (playerWs) {
      playerWs.send(JSON.stringify({
        type: 'forced_logout',
        message: 'You were removed from the lobby for inactivity on the results screen. Please rejoin if you want to play.'
      }));
    }
    playerToWs.delete(userId);
    wsToPlayer.delete(playerWs);
  });

  gameState.userIntentions = {};
  gameState.userPriorities = {};
}

export function resetGameToLobby() {

  stopAllTimers();

  gameState.game = createGameState();
  gameState.room.status = 'waiting';
  gameState.room.countdown = null;

  resetUserRoles();

  const playerCount = Object.keys(gameState.players).length;
  if (playerCount >= 2) {
    startLobbyTimer();
  }

  broadcast(JSON.stringify({
    type: 'return_to_lobby',
    gameState: gameState.game,
    roomState: gameState.room,
    players: Object.values(gameState.players),
    spectators: Object.values(gameState.spectators),
    userRoles: gameState.userRoles
  }));
}

export function endGame() {
  stopGameLoop();
  gameState.room.status = 'game_ending';

  const alivePlayers = Object.values(gameState.game.players).filter(p => p.status === 'alive');
  const allGamePlayers = Object.values(gameState.game.players);

  let winner = null;
  if (alivePlayers.length === 1) {
    winner = alivePlayers[0];
  } else if (alivePlayers.length > 1) {
    winner = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
  } else if (allGamePlayers.length > 0) {
    winner = allGamePlayers[Math.floor(Math.random() * allGamePlayers.length)];
  }

  if (winner) {
    gameState.game.winnerId = winner.id;
  }

  gameState.game.status = 'finished';

  broadcast(JSON.stringify({
    type: 'game_end',
    gameState: gameState.game
  }));

  // Show results immediately (reduced from 30s to 2s)
  setTimeout(() => {
    gameState.room.status = 'results';

    broadcast(JSON.stringify({
      type: 'show_results',
      gameState: gameState.game,
      winner: winner
    }));

    // No automatic transition - wait for player intentions
    // The transition is now handled by handlePlayAgain and handleJoinGameFromResults
  }, 2000);
}

export function handlePlayerLeave() {
  const playerCount = Object.keys(gameState.players).length;

  if (playerCount < 2) {
    stopAllTimers();
    gameState.room.status = 'waiting';
    gameState.room.countdown = null;

    broadcast(JSON.stringify({
      type: 'lobby_cancelled',
      reason: 'Not enough players'
    }));
  }
  else if (playerCount < 2 && gameState.room.status === 'countdown') {
    stopCountdownTimer();
    gameState.room.status = 'waiting';
    gameState.room.countdown = null;

    broadcast(JSON.stringify({
      type: 'countdown_cancelled',
      reason: 'Player left during countdown'
    }));
  }
  else if (playerCount >= 2 && gameState.room.status === 'waiting' && timers.lobbyTimer) {
    startLobbyTimer();
  }

  else if (playerCount === 2 && gameState.room.status === 'waiting' && !timers.lobbyTimer) {
    startLobbyTimer();
  }

  broadcastPlayers();
}

// Handle "Play Again" - immediate transfer to lobby for first 4 players
export function handlePlayAgain(playerId) {
  if (gameState.room.status !== 'results') return false;

  // Count current play_again intentions
  const playAgainCount = Object.values(gameState.userIntentions).filter(i => i === 'play_again').length;

  if (playAgainCount >= 4) {
    // Already have 4 players, can't add more
    return false;
  }

  // Record intention
  gameState.userIntentions[playerId] = 'play_again';
  gameState.userPriorities[playerId] = 1;

  // Notify player their intention was recorded
  const playerWs = playerToWs.get(playerId);
  if (playerWs) {
    playerWs.send(JSON.stringify({
      type: 'intention_recorded',
      intention: 'play_again'
    }));
  }

  // Check if we should transition to lobby now
  const newPlayAgainCount = Object.values(gameState.userIntentions).filter(i => i === 'play_again').length;

  // Transition immediately when we have at least 1 play_again
  // Use a short delay to allow multiple rapid clicks
  if (!timers.playAgainTimer) {
    timers.playAgainTimer = setTimeout(() => {
      timers.playAgainTimer = null;
      if (gameState.room.status === 'results') {
        resetGameToLobby();
      }
    }, 500); // 500ms delay to batch multiple play_again clicks
  }

  return true;
}

// Handle "Join Game" from spectator - 10 second delay if no players chose play_again
export function handleJoinGameFromResults(playerId) {
  if (gameState.room.status !== 'results') return false;

  // Record intention
  gameState.userIntentions[playerId] = 'join_game';
  gameState.userPriorities[playerId] = 2;

  // Notify spectator their intention was recorded
  const playerWs = playerToWs.get(playerId);
  if (playerWs) {
    playerWs.send(JSON.stringify({
      type: 'intention_recorded',
      intention: 'join_game'
    }));
  }

  // Check if any player has chosen play_again
  const hasPlayAgain = Object.values(gameState.userIntentions).some(i => i === 'play_again');

  if (hasPlayAgain) {
    // Players are choosing play_again, spectator will be handled in resetGameToLobby
    return true;
  }

  // No players chose play_again, start 10 second timer for spectator join
  if (!timers.spectatorJoinTimer) {
    // Broadcast countdown to spectators
    let countdown = 10;

    broadcast(JSON.stringify({
      type: 'spectator_join_countdown',
      countdown: countdown
    }));

    timers.spectatorJoinTimer = setInterval(() => {
      countdown--;

      // Check again if a player chose play_again during countdown
      const playAgainNow = Object.values(gameState.userIntentions).some(i => i === 'play_again');
      if (playAgainNow) {
        clearInterval(timers.spectatorJoinTimer);
        timers.spectatorJoinTimer = null;
        return;
      }

      broadcast(JSON.stringify({
        type: 'spectator_join_countdown',
        countdown: countdown
      }));

      if (countdown <= 0) {
        clearInterval(timers.spectatorJoinTimer);
        timers.spectatorJoinTimer = null;

        if (gameState.room.status === 'results') {
          resetGameToLobby();
        }
      }
    }, 1000);
  }

  return true;
}
