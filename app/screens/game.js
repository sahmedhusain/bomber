import { createElement } from '../../framework/core.js';

export function GameScreen(state, store) {
  return createElement('section', { className: 'screen game' },
    createElement('h2', {}, 'Game'),
    createElement('p', {}, 'Map and gameplay will render here.'),
    createElement('p', {}, 'Players: ', Object.keys(state.game.players || {}).length)
  );
}
