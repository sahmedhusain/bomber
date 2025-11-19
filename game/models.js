export const TILE_SIZE = 32;
export const MAP_WIDTH = 15;
export const MAP_HEIGHT = 13;

export const TileType = Object.freeze({
  Floor: 'floor',
  Wall: 'wall',
  Block: 'block'
});

export const PowerUpKind = Object.freeze({
  Bomb: 'bomb',
  Flame: 'flame',
  Speed: 'speed'
});

export const GameStatus = Object.freeze({
  Waiting: 'waiting',
  Running: 'running',
  Finished: 'finished'
});

export const PlayerStatus = Object.freeze({
  Alive: 'alive',
  Eliminated: 'eliminated'
});

export const DEFAULT_LIVES = 3;
export const DEFAULT_BOMB_FUSE_MS = 2500;
export const DEFAULT_BOMB_CAPACITY = 1;
export const DEFAULT_BOMB_RANGE = 1;
export const DEFAULT_SPEED = 1;

let __uidCounter = 0;
export function uid(prefix = '') {
  __uidCounter = (__uidCounter + 1) >>> 0;
  return `${prefix}${Date.now().toString(36)}_${(__uidCounter).toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
export const now = () => Date.now();
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const inBounds = (x, y, width, height) => x >= 0 && y >= 0 && x < width && y < height;
export const idx = (x, y, width) => (y * width) + x;
export const pos = (index, width) => ({ x: index % width, y: Math.floor(index / width) });

export const isWalkable = (tileType) => tileType === TileType.Floor;

export function createPlayer({ id = uid('p_'), nickname, x, y, dir = 'down', speed = DEFAULT_SPEED, lives = DEFAULT_LIVES, bombCapacity = DEFAULT_BOMB_CAPACITY, bombRange = DEFAULT_BOMB_RANGE, activePowerUps = {}, status = PlayerStatus.Alive }) {
  const player = { id, nickname, x, y, dir, speed, lives, bombCapacity, bombRange, activePowerUps, status };
  assertPlayer(player);
  return player;
}

export function createBomb({ id = uid('b_'), ownerId, x, y, range = DEFAULT_BOMB_RANGE, fuseMs = DEFAULT_BOMB_FUSE_MS, placedAt = now(), exploding = false, chainTriggered = false }) {
  const bomb = { id, ownerId, x, y, placedAt, fuseMs, range, exploding, chainTriggered };
  assertBomb(bomb);
  return bomb;
}

export function createTile({ x, y, type = TileType.Floor, occupiedByBombId = undefined, powerUpId = undefined }) {
  if (!Object.values(TileType).includes(type)) {
    throw new Error(`Invalid tile type: ${type}`);
  }
  const tile = { x, y, type, occupiedByBombId, powerUpId };
  assertTile(tile);
  return tile;
}

export function createPowerUp({ id = uid('pu_'), kind, x, y, spawnedAt = now() }) {
  if (!Object.values(PowerUpKind).includes(kind)) {
    throw new Error(`Invalid power-up kind: ${kind}`);
  }
  const pu = { id, kind, x, y, spawnedAt };
  assertPowerUp(pu);
  return pu;
}

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
    lastUpdate: now(),
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
    lastUpdate: now(),
    winnerId: undefined
  };
}

export function createLobbyState() {
  return {
    players: [],
    joinedCount: 0,
    countdown: { phase: 'waiting', remainingMs: 0 }
  };
}

export function createSessionState() {
  return { connected: false };
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

export function assertPlayer(p) {
  if (!p || typeof p.id !== 'string' || typeof p.nickname !== 'string') throw new Error('Invalid Player: id/nickname');
  if (!Number.isInteger(p.x) || !Number.isInteger(p.y)) throw new Error('Invalid Player coords');
  if (!['up', 'down', 'left', 'right'].includes(p.dir)) throw new Error('Invalid Player dir');
  if (typeof p.speed !== 'number' || typeof p.lives !== 'number') throw new Error('Invalid Player speed/lives');
  if (typeof p.bombCapacity !== 'number' || typeof p.bombRange !== 'number') throw new Error('Invalid Player bomb stats');
  if (!Object.values(PlayerStatus).includes(p.status)) throw new Error('Invalid Player status');
}
export function assertBomb(b) {
  if (!b || typeof b.id !== 'string' || typeof b.ownerId !== 'string') throw new Error('Invalid Bomb: id/ownerId');
  if (!Number.isInteger(b.x) || !Number.isInteger(b.y)) throw new Error('Invalid Bomb coords');
  if (typeof b.placedAt !== 'number' || typeof b.fuseMs !== 'number') throw new Error('Invalid Bomb timing');
  if (typeof b.range !== 'number') throw new Error('Invalid Bomb range');
}
export function assertTile(t) {
  if (!t || !Number.isInteger(t.x) || !Number.isInteger(t.y)) throw new Error('Invalid Tile coords');
  if (!Object.values(TileType).includes(t.type)) throw new Error('Invalid Tile type');
}
export function assertPowerUp(pu) {
  if (!pu || typeof pu.id !== 'string') throw new Error('Invalid PowerUp id');
  if (!Object.values(PowerUpKind).includes(pu.kind)) throw new Error('Invalid PowerUp kind');
  if (!Number.isInteger(pu.x) || !Number.isInteger(pu.y)) throw new Error('Invalid PowerUp coords');
}

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
  return nextGame(state, { winnerId, status: GameStatus.Finished });
}

export function pushChat(state, message) {
  const chat = Array.isArray(state.chat) ? state.chat.slice() : [];
  chat.push(message);
  return { chat };
}

export function setRoute(route) {
  return { route };
}