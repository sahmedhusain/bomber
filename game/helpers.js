import { TileType } from './constants.js';

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
