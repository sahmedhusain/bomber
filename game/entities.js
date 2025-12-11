import {
  TileType,
  PowerUpKind,
  PlayerStatus,
  DEFAULT_BOMB_FUSE_MS,
  DEFAULT_BOMB_RANGE,
  DEFAULT_BOMB_CAPACITY,
  DEFAULT_LIVES,
  DEFAULT_SPEED
} from './constants.js';
import { uid, now, isWalkable } from './helpers.js';

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

export { isWalkable };
