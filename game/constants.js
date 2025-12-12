export const TILE_SIZE = 24;
export const MAP_WIDTH = 27;
export const MAP_HEIGHT = 15;

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
