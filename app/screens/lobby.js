import { createElement } from '../../framework/core.js';

export function LobbyScreen(state, store) {
  const playerCount = Object.keys(state.game.players || {}).length;
  return createElement('section', { className: 'screen lobby' },
    createElement('h2', {}, 'Lobby'),
    createElement('p', {}, `Players (local-only): ${playerCount}`),
    createElement('p', {}, 'Countdown and chat will be added after WebSockets.'),
    createElement('p', {},
      createElement('a', { href: '#/game' }, 'Go to Game (placeholder)')
    )
  );
}
