import { gameState, timers } from './state.js';
import { wsToPlayer, playerToWs } from './connections.js';
import { broadcast, broadcastPlayers, broadcastSpectators, broadcastGameUpdate } from './broadcast.js';
import { queueInput } from './gameLogic.js';
import { startLobbyTimer, handlePlayerLeave, handleInGameDisconnect, handlePlayAgain, handleJoinGameFromResults, resetGameToLobby } from './match.js';
import { getUniqueNickname } from './utils.js';

export function handleMessage(ws, message) {
  try {
    const data = JSON.parse(message);
    const msgType = data.type;

    if (msgType === 'join') {
      const playerId = data.player_id;
      let nickname = getUniqueNickname(data.nickname);

      wsToPlayer.set(ws, playerId);
      playerToWs.set(playerId, ws);

      if (gameState.room.status === 'results') {
        resetGameToLobby();
      }

      const currentPlayerCount = Object.keys(gameState.players).length;

      if (gameState.room.status === 'playing' || gameState.room.status === 'countdown' || currentPlayerCount >= 4) {
        gameState.spectators[playerId] = {
          id: playerId,
          nickname: nickname,
          connected: true
        };

        gameState.userRoles[playerId] = 'spectator';


        ws.send(JSON.stringify({
          type: 'joined_as_spectator',
          playerId: playerId,
          gameState: gameState.game,
          roomState: gameState.room,
          players: Object.values(gameState.players),
          spectators: Object.values(gameState.spectators)
        }));

        broadcastSpectators();

        return;
      }

      gameState.players[playerId] = {
        id: playerId,
        nickname: nickname,
        connected: true,
        ready: false
      };

      gameState.userRoles[playerId] = 'player';


      const playerCount = Object.keys(gameState.players).length;

      if (playerCount === 2 && gameState.room.status === 'waiting' && !timers.lobbyTimer) {
        startLobbyTimer();
      }
      else if (playerCount === 3 && gameState.room.status === 'waiting' && timers.lobbyTimer) {
        startLobbyTimer();
      }

      broadcastPlayers();

    } else if (msgType === 'chat') {
      const playerId = data.player_id;
      const text = data.text?.trim();

      if (!text || text.length === 0) {
        return;
      }

      let nickname = null;
      let isSpectator = false;

      if (gameState.players[playerId]) {
        nickname = gameState.players[playerId].nickname;
      } else if (gameState.spectators[playerId]) {
        nickname = gameState.spectators[playerId].nickname;
        isSpectator = true;
      } else {
        return;
      }
      const chatMsg = {
        player_id: playerId,
        nickname: nickname,
        text: text.slice(0, 200),
        timestamp: new Date().toISOString(),
        isSpectator: isSpectator
      };

      if (!Array.isArray(gameState.room.chat)) {
        gameState.room.chat = [];
      }

      gameState.room.chat.push(chatMsg);

      if (gameState.room.chat.length > 50) {
        gameState.room.chat = gameState.room.chat.slice(-50);
      }


      broadcast(JSON.stringify({
        type: 'chat',
        message: chatMsg
      }));
    } else if (msgType === 'ready') {
      const playerId = data.player_id;
      if (gameState.players[playerId]) {
        gameState.players[playerId].ready = !gameState.players[playerId].ready;

        broadcastPlayers();
      }

    } else if (msgType === 'input') {
      const playerId = data.player_id;
      const input = data.input;
      if (!playerId || !input) return;
      if (gameState.room.status !== 'playing') return;
      if (!gameState.game.players[playerId] || gameState.game.players[playerId].status !== 'alive') return;

      if (input.kind === 'move') {
        const allowed = new Set(['up', 'down', 'left', 'right']);
        if (!allowed.has(input.dir)) return;
      } else if (input.kind === 'bomb') {
      } else {
        return;
      }
      queueInput(playerId, input);
    } else if (msgType === 'play_again') {
      const playerId = data.player_id;

      handlePlayAgain(playerId);

    } else if (msgType === 'join_game') {
      const playerId = data.player_id;

      if (gameState.room.status === 'results') {
        handleJoinGameFromResults(playerId);
        return;
      }

      const currentPlayerCount = Object.keys(gameState.players).length;
      const maxPlayers = 4;

      if (currentPlayerCount < maxPlayers) {

        const spectatorInfo = gameState.spectators[playerId];

        if (spectatorInfo) {
          delete gameState.spectators[playerId];
          gameState.players[playerId] = {
            id: playerId,
            nickname: spectatorInfo.nickname,
            connected: true,
            ready: false
          };
          gameState.userRoles[playerId] = 'player';

          const playerWs = playerToWs.get(playerId);
          if (playerWs) {
            playerWs.send(JSON.stringify({
              type: 'role_updated',
              isSpectator: false,
              role: 'player'
            }));

            if (gameState.room.status === 'countdown') {
              playerWs.send(JSON.stringify({
                type: 'countdown_start',
                countdown: gameState.room.countdown
              }));
            }
          }

          broadcastPlayers();
          broadcastSpectators();
        }
      } else {
        gameState.userIntentions[playerId] = 'join_game';
        gameState.userPriorities[playerId] = 2;

        const playerWs = playerToWs.get(playerId);
        if (playerWs) {
          playerWs.send(JSON.stringify({
            type: 'intention_recorded',
            intention: 'join_game',
            message: 'No player slots available. You are in the waiting queue.'
          }));
        }
      }

    } else if (msgType === 'leave_lobby') {
      const playerId = data.player_id;

      delete gameState.userIntentions[playerId];
      delete gameState.userPriorities[playerId];

      let handledInGame = false;
      if (gameState.room.status === 'playing' && gameState.game.players[playerId]) {
        handleInGameDisconnect(playerId);
        handledInGame = true;
      }

      if (!handledInGame) {
        delete gameState.userRoles[playerId];

        if (gameState.players[playerId]) {
          delete gameState.players[playerId];
          if (gameState.game.players[playerId]) {
            delete gameState.game.players[playerId];
            broadcastGameUpdate();
          }
          handlePlayerLeave();
        } else if (gameState.spectators[playerId]) {
          delete gameState.spectators[playerId];
          broadcastSpectators();
        }
      }

      const userWs = playerToWs.get(playerId);
      if (userWs) {
        wsToPlayer.delete(userWs);
        playerToWs.delete(playerId);
      }

    } else if (msgType === 'disconnect') {
      const playerId = data.player_id;

      if (gameState.players[playerId]) {

        delete gameState.players[playerId];
        const playerWs = playerToWs.get(playerId);
        if (playerWs) {
          wsToPlayer.delete(playerWs);
          playerToWs.delete(playerId);
        }

        handlePlayerLeave();
      } else if (gameState.spectators[playerId]) {

        delete gameState.spectators[playerId];
        const spectatorWs = playerToWs.get(playerId);
        if (spectatorWs) {
          wsToPlayer.delete(spectatorWs);
          playerToWs.delete(playerId);
        }

        broadcastSpectators();
      }
    }

  } catch (error) {
  }
}

export function handleDisconnect(ws) {
  const playerId = wsToPlayer.get(ws);

  if (playerId && gameState.players[playerId]) {
    const playerName = gameState.players[playerId].nickname;

    if (gameState.room.status === 'playing' && gameState.game.players[playerId]) {
      handleInGameDisconnect(playerId);
    } else {
      delete gameState.players[playerId];
      handlePlayerLeave();
    }
  }
  else if (playerId && gameState.spectators[playerId]) {
    const spectatorName = gameState.spectators[playerId].nickname;
    delete gameState.spectators[playerId];

    broadcastSpectators();
  }

  wsToPlayer.delete(ws);
  playerToWs.delete(playerId);
}
