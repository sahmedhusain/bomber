import {
  gameState,
  pendingInputs,
  EXPLOSION_DURATION_MS,
  MAP_WIDTH,
  MAP_HEIGHT
} from './state.js';
import {
  TileType,
  PowerUpKind,
  DEFAULT_BOMB_FUSE_MS,
  DEFAULT_BOMB_RANGE,
  DEFAULT_BOMB_CAPACITY,
  DEFAULT_LIVES,
  createBomb,
  createPowerUp
} from '../game/models.js';

export const getTile = (x, y) => {
  const { width, tiles } = gameState.game.map;
  const index = (y * width) + x;
  return tiles[index];
};

export const setTile = (x, y, updater) => {
  const { width, tiles } = gameState.game.map;
  const index = (y * width) + x;
  const prev = tiles[index];
  const next = typeof updater === 'function' ? updater(prev) : updater;
  gameState.game.map.tiles = tiles.slice();
  gameState.game.map.tiles[index] = next;
};

export const isWalkable = (x, y) => {
  if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return false;
  const tile = getTile(x, y);
  if (!tile) return false;
  if (tile.type !== TileType.Floor) return false;
  if (tile.occupiedByBombId) return false;
  const otherPlayer = Object.values(gameState.game.players).find(p => p.status === 'alive' && p.x === x && p.y === y);
  if (otherPlayer) return false;
  return true;
};

export const queueInput = (playerId, input) => {
  if (!playerId || !input) return;
  pendingInputs.push({ playerId, input, ts: Date.now() });
};

export function applyPowerUpToPlayer(player, powerUpKind) {
  if (!player) return;
  switch (powerUpKind) {
    case PowerUpKind.Bomb:
      player.bombCapacity = (player.bombCapacity || DEFAULT_BOMB_CAPACITY) + 1;
      break;
    case PowerUpKind.Flame:
      player.bombRange = (player.bombRange || DEFAULT_BOMB_RANGE) + 1;
      break;
    case PowerUpKind.Speed:
      player.speed = (player.speed || 1) + 0.5;
      break;
  }
}

export function spawnPowerUpAt(x, y) {
  if (Math.random() > 0.4) return null;
  const kinds = [PowerUpKind.Bomb, PowerUpKind.Flame, PowerUpKind.Speed];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const pu = createPowerUp({ kind, x, y });
  gameState.game.powerUps[pu.id] = pu;
  setTile(x, y, (tile) => ({ ...tile, powerUpId: pu.id }));
  return pu;
}

export function placeBombForPlayer(player) {
  if (!player || player.status !== 'alive') return null;

  const currentBombs = Object.values(gameState.game.bombs).filter(b => b.ownerId === player.id);
  const capacity = player.bombCapacity || DEFAULT_BOMB_CAPACITY;
  if (currentBombs.length >= capacity) return null;

  const tile = getTile(player.x, player.y);
  if (tile.occupiedByBombId) return null;

  const bomb = createBomb({
    ownerId: player.id,
    x: player.x,
    y: player.y,
    fuseMs: DEFAULT_BOMB_FUSE_MS,
    range: player.bombRange || DEFAULT_BOMB_RANGE
  });
  gameState.game.bombs[bomb.id] = bomb;
  setTile(player.x, player.y, (t) => ({ ...t, occupiedByBombId: bomb.id }));
  return bomb;
}

export function computeExplosionTiles(bomb) {
  const affected = new Set();
  const add = (x, y) => affected.add(`${x},${y}`);
  add(bomb.x, bomb.y);

  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ];

  for (const dir of directions) {
    for (let i = 1; i <= bomb.range; i++) {
      const nx = bomb.x + dir.dx * i;
      const ny = bomb.y + dir.dy * i;
      if (nx < 0 || ny < 0 || nx >= MAP_WIDTH || ny >= MAP_HEIGHT) break;
      const tile = getTile(nx, ny);
      add(nx, ny);
      if (tile.type === TileType.Wall) break;
      if (tile.type === TileType.Block) break;
    }
  }
  return affected;
}

export function registerExplosions(explosionTiles) {
  if (!gameState.game.explosions) gameState.game.explosions = {};
  explosionTiles.forEach(coord => {
    const [xStr, yStr] = coord.split(',');
    const id = `ex_${xStr}_${yStr}_${Date.now()}`;
    gameState.game.explosions[id] = {
      x: parseInt(xStr, 10),
      y: parseInt(yStr, 10),
      expiresAt: Date.now() + EXPLOSION_DURATION_MS
    };
  });
}

export function explodeBomb(bomb) {
  if (!bomb) return;
  const explosionTiles = computeExplosionTiles(bomb);
  registerExplosions(explosionTiles);

  Object.values(gameState.game.players).forEach(player => {
    if (player.status !== 'alive') return;
    if (explosionTiles.has(`${player.x},${player.y}`)) {
      player.lives = Math.max(0, (player.lives || DEFAULT_LIVES) - 1);
      if (player.lives <= 0) {
        player.status = 'eliminated';
      }
    }
  });

  explosionTiles.forEach(coord => {
    const [xStr, yStr] = coord.split(',');
    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);
    const tile = getTile(x, y);
    if (tile.type === TileType.Block) {
      spawnPowerUpAt(x, y);
      const latestTile = getTile(x, y);
      setTile(x, y, { ...latestTile, type: TileType.Floor });
    }
    if (tile.occupiedByBombId) {
      delete gameState.game.bombs[tile.occupiedByBombId];
      setTile(x, y, { ...tile, occupiedByBombId: undefined });
    }
  });

  const originTile = getTile(bomb.x, bomb.y);
  setTile(bomb.x, bomb.y, { ...originTile, occupiedByBombId: undefined });
  delete gameState.game.bombs[bomb.id];
}

export function processInputs() {
  while (pendingInputs.length > 0) {
    const next = pendingInputs.shift();
    const { playerId, input } = next;
    const player = gameState.game.players[playerId];
    if (!player || player.status !== 'alive') continue;

    if (input.kind === 'move') {
      const dir = input.dir;
      let dx = 0, dy = 0;
      if (dir === 'up') dy = -1;
      else if (dir === 'down') dy = 1;
      else if (dir === 'left') dx = -1;
      else if (dir === 'right') dx = 1;

      const nx = player.x + dx;
      const ny = player.y + dy;
      if (isWalkable(nx, ny)) {
        const tile = getTile(nx, ny);
        if (tile.powerUpId && gameState.game.powerUps[tile.powerUpId]) {
          const pu = gameState.game.powerUps[tile.powerUpId];
          applyPowerUpToPlayer(player, pu.kind);
          delete gameState.game.powerUps[pu.id];
          setTile(nx, ny, { ...tile, powerUpId: undefined });
        }
        player.x = nx;
        player.y = ny;
        player.dir = dir;
      }
    } else if (input.kind === 'bomb') {
      placeBombForPlayer(player);
    }
  }
}

export function processBombs() {
  const now = Date.now();
  Object.values(gameState.game.bombs).forEach(bomb => {
    if (bomb.exploding) return;
    if (now - bomb.placedAt >= bomb.fuseMs) {
      bomb.exploding = true;
      explodeBomb(bomb);
    }
  });
}

export function cleanupExplosions() {
  if (!gameState.game.explosions) return;
  const now = Date.now();
  Object.keys(gameState.game.explosions).forEach(id => {
    if (gameState.game.explosions[id].expiresAt <= now) {
      delete gameState.game.explosions[id];
    }
  });
}
