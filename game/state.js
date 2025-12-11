import { MAP_WIDTH, MAP_HEIGHT, TileType, GameStatus } from './constants.js';
import { createTile } from './entities.js';
import { pos } from './helpers.js';

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
    winnerId: undefined
  };
}

export function generateGameMap({ width = MAP_WIDTH, height = MAP_HEIGHT, blockDensity = 0.75 } = {}) {
  const tiles = new Array(width * height);

  const spawnPositions = [
    { x: 1, y: 1 },
    { x: width - 2, y: 1 },
    { x: 1, y: height - 2 },
    { x: width - 2, y: height - 2 }
  ];

  for (let i = 0; i < tiles.length; i++) {
    const { x, y } = pos(i, width);
    let tileType = TileType.Floor;

    if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
      tileType = TileType.Wall;
    }
    else if (x % 2 === 0 && y % 2 === 0) {
      tileType = TileType.Wall;
    }
    else {
      let isSafeCorridor = false;
      for (const spawn of spawnPositions) {
        if (Math.abs(x - spawn.x) <= 1 && Math.abs(y - spawn.y) <= 1) {
          isSafeCorridor = true;
          break;
        }
      }

      if (!isSafeCorridor && Math.random() < blockDensity) {
        tileType = TileType.Block;
      }
    }

    tiles[i] = createTile({ x, y, type: tileType });
  }

  return { width, height, tiles };
}

export function createGameState({ width = MAP_WIDTH, height = MAP_HEIGHT, blockDensity = 0.75 } = {}) {
  const map = generateGameMap({ width, height, blockDensity });
  return {
    map,
    players: Object.create(null),
    bombs: Object.create(null),
    powerUps: Object.create(null),
    status: GameStatus.Waiting,
    lastUpdate: Date.now(),
    winnerId: undefined
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
