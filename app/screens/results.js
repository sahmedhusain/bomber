import { createElement } from '../../framework/core.js';

export function ResultsScreen(state, store) {
  return createElement('section', { className: 'screen results' },
    createElement('h2', {}, 'Results'),
    createElement('p', {}, state.game?.winnerId ? `Winner: ${state.game.winnerId}` : 'Winner and stats will be displayed here.'),
    createElement('p', {},
      createElement('a', { href: '#/' }, 'Back to Home')
    )
  );
}
