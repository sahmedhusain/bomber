import { MAP_WIDTH, MAP_HEIGHT, TileType, GameStatus } from './constants.js';
import { createTile } from './entities.js';
import { pos } from './helpers.js';

export const DIFFICULTY = 'easy';

const DIFFICULTY_CONFIG = {
  easy: {
    blockDensity: 0.35,
    wallDensity: 0.08,
    safeZoneSize: 2
  },
  medium: {
    blockDensity: 0.55,
    wallDensity: 0.15,
    safeZoneSize: 1
  },
  hard: {
    blockDensity: 0.70,
    wallDensity: 0.22,
    safeZoneSize: 1
  }
};

export function createEmptyGameState({ width = MAP_WIDTH, height = MAP_HEIGHT } = {}) {
  const tiles = new Array(width * height);
  for (let i = 0; i < tiles.length; i++) {
    const { x, y } = pos(i, width);
    tiles[i] = createTile({ x, y, type: TileType.Floor });
  }
  return {
    map: { width, height, tiles },
    players: Object.create(null),
    bombs: Object.create(null),
    powerUps: Object.create(null),
    status: GameStatus.Waiting,
    lastUpdate: Date.now(),
    winnerId: undefined,
    winnerIds: [],
    winners: [],
    finalStandings: [],
    eliminationLog: []
  };
}

export function generateGameMap({ width = MAP_WIDTH, height = MAP_HEIGHT, difficulty = DIFFICULTY } = {}) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
  const { blockDensity, safeZoneSize } = config;

  const tiles = new Array(width * height);

  const spawnPositions = [
    { x: 1, y: 1 },
    { x: width - 2, y: 1 },
    { x: 1, y: height - 2 },
    { x: width - 2, y: height - 2 }
  ];

  const isInSafeZone = (x, y) => {
    for (const spawn of spawnPositions) {
      if (Math.abs(x - spawn.x) <= safeZoneSize && Math.abs(y - spawn.y) <= safeZoneSize) {
        return true;
      }
    }
    return false;
  };

  const isOnSpawnPath = (x, y) => {
    for (const spawn of spawnPositions) {
      if ((x === spawn.x && Math.abs(y - spawn.y) <= safeZoneSize + 1) ||
        (y === spawn.y && Math.abs(x - spawn.x) <= safeZoneSize + 1)) {
        return true;
      }
    }
    return false;
  };

  for (let i = 0; i < tiles.length; i++) {
    const { x, y } = pos(i, width);
    let tileType = TileType.Floor;

    const isBorder = x === 0 || x === width - 1 || y === 0 || y === height - 1;
    const isFixedWall = !isBorder && (x % 2 === 0) && (y % 2 === 0);

    if (isBorder || isFixedWall) {
      tileType = TileType.Wall;
    }
    else if (isInSafeZone(x, y)) {
      tileType = TileType.Floor;
    }
    else if (isOnSpawnPath(x, y)) {
      if (Math.random() < blockDensity * 0.5) {
        tileType = TileType.Block;
      }
    }
    else if (Math.random() < blockDensity) {
      tileType = TileType.Block;
    }

    tiles[i] = createTile({ x, y, type: tileType });
  }

  return { width, height, tiles };
}

export function createGameState({ width = MAP_WIDTH, height = MAP_HEIGHT, difficulty = DIFFICULTY } = {}) {
  const map = generateGameMap({ width, height, difficulty });
  return {
    map,
    players: Object.create(null),
    bombs: Object.create(null),
    powerUps: Object.create(null),
    status: GameStatus.Waiting,
    lastUpdate: Date.now(),
    winnerId: undefined,
    winnerIds: [],
    winners: [],
    finalStandings: [],
    eliminationLog: []
  };
}

export function createLobbyState() {
  return {
    players: [],
    joinedCount: 0,
    countdown: { phase: 'waiting', remainingMs: 0 },
    lobbyTimer: { active: false, remainingMs: 0 },
    userIntentions: {},
    rolePriorities: {},
  };
}

export function createSessionState() {
  return {
    connected: false,
    role: null,
    priority: 0,
    intention: null
  };
}

export function initialRootState() {
  return {
    route: '#/',
    session: createSessionState(),
    lobby: createLobbyState(),
    game: createGameState({ width: MAP_WIDTH, height: MAP_HEIGHT }),
    chat: [],
    websocket: { connected: false }
  };
}
