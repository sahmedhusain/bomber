import {
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  TileType,
  PowerUpKind,
  GameStatus,
  PlayerStatus,
  DEFAULT_LIVES,
  DEFAULT_BOMB_FUSE_MS,
  DEFAULT_BOMB_CAPACITY,
  DEFAULT_BOMB_RANGE,
  DEFAULT_SPEED,
  BASE_MOVE_INTERVAL_MS
} from './constants.js';
import {
  uid,
  now,
  clamp,
  inBounds,
  idx,
  pos,
  isWalkable
} from './helpers.js';
import {
  createPlayer,
  createBomb,
  createTile,
  createPowerUp,
  assertPlayer,
  assertBomb,
  assertTile,
  assertPowerUp
} from './entities.js';
import {
  createEmptyGameState,
  generateGameMap,
  createGameState,
  createLobbyState,
  createSessionState,
  initialRootState
} from './state.js';

function nextGame(state, partialGame) {
  return { game: { ...state.game, ...partialGame } };
}

export function upsertPlayer(state, player) {
  const players = { ...state.game.players, [player.id]: player };
  return nextGame(state, { players });
}

export function updatePlayerPos(state, playerId, x, y, dir = undefined) {
  const existing = state.game.players[playerId];
  if (!existing) return {};
  const updated = { ...existing, x, y, dir: dir ?? existing.dir };
  return upsertPlayer(state, updated);
}

export function setPlayerStatus(state, playerId, status) {
  const existing = state.game.players[playerId];
  if (!existing) return {};
  const updated = { ...existing, status };
  return upsertPlayer(state, updated);
}

export function addBomb(state, bomb) {
  const bombs = { ...state.game.bombs, [bomb.id]: bomb };
  return nextGame(state, { bombs });
}

export function removeBomb(state, bombId) {
  const bombs = { ...state.game.bombs };
  delete bombs[bombId];
  return nextGame(state, { bombs });
}

export function addPowerUp(state, powerUp) {
  const powerUps = { ...state.game.powerUps, [powerUp.id]: powerUp };
  return nextGame(state, { powerUps });
}

export function removePowerUp(state, powerUpId) {
  const powerUps = { ...state.game.powerUps };
  delete powerUps[powerUpId];
  return nextGame(state, { powerUps });
}

export function setTile(state, x, y, nextTileObj) {
  const { width, height, tiles } = state.game.map;
  if (!inBounds(x, y, width, height)) return {};
  const i = idx(x, y, width);
  const newTiles = tiles.slice();
  newTiles[i] = nextTileObj;
  return nextGame(state, { map: { ...state.game.map, tiles: newTiles } });
}

export function setGameStatus(state, status) {
  return nextGame(state, { status });
}

export function setWinner(state, winnerId) {
  const winnerIds = Array.isArray(winnerId)
    ? winnerId
    : (winnerId != null ? [winnerId] : []);
  const normalizedWinnerId = winnerIds.length === 1 ? winnerIds[0] : null;
  return nextGame(state, {
    winnerId: normalizedWinnerId,
    winnerIds,
    status: GameStatus.Finished
  });
}

export function pushChat(state, message) {
  const chat = Array.isArray(state.chat) ? state.chat.slice() : [];
  chat.push(message);
  return { chat };
}

export function setRoute(route) {
  return { route };
}

export {
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  TileType,
  PowerUpKind,
  GameStatus,
  PlayerStatus,
  DEFAULT_LIVES,
  DEFAULT_BOMB_FUSE_MS,
  DEFAULT_BOMB_CAPACITY,
  DEFAULT_BOMB_RANGE,
  DEFAULT_SPEED,
  BASE_MOVE_INTERVAL_MS,
  uid,
  now,
  clamp,
  inBounds,
  idx,
  pos,
  isWalkable,
  createPlayer,
  createBomb,
  createTile,
  createPowerUp,
  assertPlayer,
  assertBomb,
  assertTile,
  assertPowerUp,
  createEmptyGameState,
  generateGameMap,
  createGameState,
  createLobbyState,
  createSessionState,
  initialRootState
};
