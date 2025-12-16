import {
  createGameState,
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  TileType,
  PowerUpKind,
  DEFAULT_BOMB_FUSE_MS,
  DEFAULT_BOMB_RANGE,
  DEFAULT_BOMB_CAPACITY,
  DEFAULT_LIVES
} from '../game/models.js';

export const gameState = {
  players: {},
  spectators: {},
  room: {
    id: 'main',
    status: 'waiting',
    countdown: null,
    chat: []
  },
  game: createGameState(),
  userIntentions: {},
  userRoles: {},
  userPriorities: {}
};

export const timers = {
  lobbyTimer: null,
  countdownTimer: null,
  gameLoopTimer: null,
  playAgainTimer: null,
  spectatorJoinTimer: null
};

export const pendingInputs = [];

export const GAME_TICK_MS = 100;
export const EXPLOSION_DURATION_MS = 600;
export const LOBBY_WAIT_TIME = 20;
export const COUNTDOWN_TIME = 10;

export {
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  TileType,
  PowerUpKind,
  DEFAULT_BOMB_FUSE_MS,
  DEFAULT_BOMB_RANGE,
  DEFAULT_BOMB_CAPACITY,
  DEFAULT_LIVES,
  createGameState
};
