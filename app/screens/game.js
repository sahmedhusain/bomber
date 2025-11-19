import { createElement } from '../../framework/core.js';
import { TILE_SIZE, TileType } from '../../game/models.js';

export function GameScreen(state, store) {
  const { map, players, bombs, powerUps, status } = state.game;
  const { width, height, tiles } = map;

  // Create tile grid
  const tileElements = tiles.map((tile, index) => {
    const { x, y, type } = tile;
    let className = 'tile';

    // Add tile type class
    switch (type) {
      case TileType.Wall:
        className += ' wall';
        break;
      case TileType.Block:
        className += ' block';
        break;
      case TileType.Floor:
      default:
        className += ' floor';
        break;
    }

    // Check if tile has a player
    const playerOnTile = Object.values(players).find(p => p.x === x && p.y === y && p.status === 'alive');
    if (playerOnTile) {
      className += ' has-player';
    }

    // Check if tile has a bomb
    const bombOnTile = Object.values(bombs).find(b => b.x === x && b.y === y);
    if (bombOnTile) {
      className += ' has-bomb';
    }

    // Check if tile has a power-up
    const powerUpOnTile = Object.values(powerUps).find(pu => pu.x === x && pu.y === y);
    if (powerUpOnTile) {
      className += ` has-powerup powerup-${powerUpOnTile.kind}`;
    }

    const style = {
      width: `${TILE_SIZE}px`,
      height: `${TILE_SIZE}px`,
      left: `${x * TILE_SIZE}px`,
      top: `${y * TILE_SIZE}px`
    };

    return createElement('div', {
      key: `tile-${x}-${y}`,
      className,
      style,
      'data-x': x,
      'data-y': y
    },
      playerOnTile ? createElement('div', { className: 'player', 'data-player-id': playerOnTile.id },
        createElement('span', { className: 'player-nickname' }, playerOnTile.nickname.slice(0, 3))
      ) : null,
      bombOnTile ? createElement('div', { className: 'bomb' }) : null,
      powerUpOnTile ? createElement('div', { className: `powerup powerup-${powerUpOnTile.kind}` }) : null
    );
  });

  const mapStyle = {
    width: `${width * TILE_SIZE}px`,
    height: `${height * TILE_SIZE}px`,
    position: 'relative',
    margin: '0 auto',
    border: '2px solid var(--accent-primary)',
    borderRadius: '10px',
    background: 'var(--bg-secondary)',
    boxShadow: 'var(--shadow)'
  };

  return createElement('section', { className: 'screen game' },
    createElement('h2', {}, 'Bomberman Arena'),
    createElement('div', { className: 'game-info' },
      createElement('span', { className: 'status' }, `Status: ${status}`),
      createElement('span', { className: 'player-count' }, `Players: ${Object.keys(players).length}`)
    ),
    createElement('div', { className: 'game-map', style: mapStyle }, ...tileElements)
  );
}
