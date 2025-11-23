import { createElement } from '../../framework/core.js';
import { TILE_SIZE, TileType } from '../../game/models.js';

export function GameScreen(state, store) {
  const { map, players, bombs, powerUps, status } = state.game;
  const { width, height, tiles } = map;
  const playersArray = Object.values(players);
  const alivePlayers = playersArray.filter(p => p.status === 'alive');

  // Create tile grid
  const tileElements = tiles.map((tile, index) => {
    const { x, y, type } = tile;
    let className = 'game-tile';

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
      // Tile content based on type
      type === TileType.Wall ? createElement('div', { className: 'wall-icon' }, '🧱') :
      type === TileType.Block ? createElement('div', { className: 'block-icon' }, '📊') : null,
      
      // Player on tile
      playerOnTile ? createElement('div', { 
        className: `game-player player-${playersArray.indexOf(playerOnTile)}`,
        'data-player-id': playerOnTile.id 
      },
        createElement('div', { className: 'player-avatar' }, 
          playerOnTile.nickname.charAt(0).toUpperCase()
        ),
        createElement('div', { className: 'player-name' }, playerOnTile.nickname)
      ) : null,
      
      // Bomb on tile
      bombOnTile ? createElement('div', { className: 'game-bomb' }, '💣') : null,
      
      // Power-up on tile
      powerUpOnTile ? createElement('div', { className: `game-powerup powerup-${powerUpOnTile.kind}` },
        powerUpOnTile.kind === 'bomb' ? '💥' :
        powerUpOnTile.kind === 'flame' ? '🔥' :
        powerUpOnTile.kind === 'speed' ? '⚡' : '✨'
      ) : null
    );
  });

  const mapStyle = {
    width: `${width * TILE_SIZE}px`,
    height: `${height * TILE_SIZE}px`,
    position: 'relative',
    margin: '0 auto',
    border: '3px solid var(--accent-primary)',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-secondary)',
    boxShadow: 'var(--shadow), var(--shadow-glow)',
    overflow: 'hidden'
  };

  return createElement('section', { className: 'screen game' },
    createElement('div', { className: 'game-header' },
      createElement('h2', {}, '💣 Battle Arena'),
      createElement('div', { className: 'game-timer' },
        createElement('span', { className: 'timer-label' }, 'Testing Mode:'),
        createElement('span', { className: 'timer-text' }, 'Auto-ending in 5 seconds...')
      ),
      createElement('div', { className: 'game-status' },
        createElement('span', { className: `status-badge status-${status}` }, 
          status === 'waiting' ? '⏳ Waiting' :
          status === 'running' ? '⚔️ In Progress' :
          '🏆 Finished'
        ),
        createElement('span', { className: 'player-counter' }, 
          `👥 ${alivePlayers.length}/${playersArray.length} alive`
        )
      )
    ),
    
    createElement('div', { className: 'game-container' },
      // Left panel - Player stats
      createElement('div', { className: 'game-sidebar' },
        createElement('div', { className: 'card players-stats' },
          createElement('h3', {}, '🎮 Players'),
          createElement('div', { className: 'player-stats-list' },
            playersArray.map((player, index) =>
              createElement('div', {
                className: `player-stat ${player.status === 'alive' ? 'alive' : 'eliminated'}`,
                key: player.id
              },
                createElement('div', { className: `player-avatar player-${index}` },
                  player.nickname.charAt(0).toUpperCase()
                ),
                createElement('div', { className: 'player-details' },
                  createElement('div', { className: 'player-nickname' }, player.nickname),
                  createElement('div', { className: 'player-stats' },
                    createElement('span', { className: 'stat' }, `❤️ ${player.lives || 3}`),
                    createElement('span', { className: 'stat' }, `💣 ${player.bombCapacity || 1}`),
                    createElement('span', { className: 'stat' }, `🔥 ${player.bombRange || 1}`)
                  )
                ),
                createElement('div', { className: `status-indicator ${player.status}` },
                  player.status === 'alive' ? '✅' : '❌'
                )
              )
            )
          )
        ),
        createElement('div', { className: 'card game-controls' },
          createElement('h3', {}, '🎮 Controls'),
          createElement('div', { className: 'controls-grid' }, [
            createElement('div', { className: 'control-item' }, '⬆️ W - Move Up'),
            createElement('div', { className: 'control-item' }, '⬇️ S - Move Down'),
            createElement('div', { className: 'control-item' }, '⬅️ A - Move Left'),
            createElement('div', { className: 'control-item' }, '➡️ D - Move Right'),
            createElement('div', { className: 'control-item' }, '💣 Space - Drop Bomb')
          ]),
          createElement('div', { className: 'testing-notice' },
            createElement('h4', {}, '🧪 Testing Mode'),
            createElement('p', {}, 'Game will automatically end after 5 seconds with a random winner for testing purposes.')
          )
        )
      ),
      
      // Center - Game map
      createElement('div', { className: 'game-map-container' },
        createElement('div', { className: 'game-map', style: mapStyle }, tileElements)
      )
    )
  );
}
