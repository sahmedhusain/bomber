import { createApp, createElement } from '../framework/core.js';
import { initialRootState, setRoute } from '../game/models.js';

function Routes() {
  return {
    '#/': () => (
      createElement('section', { className: 'screen nickname' },
        createElement('h1', {}, 'Bomberman DOM'),
        createElement('p', {}, 'Nickname screen (to be implemented).'),
        createElement('p', {}, 'Go to ',
          createElement('a', { href: '#/lobby' }, 'Lobby'), ' to continue.')
      )
    ),
    '#/lobby': () => (
      createElement('section', { className: 'screen lobby' },
        createElement('h2', {}, 'Lobby'),
        createElement('p', {}, 'Player counter and chat will appear here.'),
        createElement('p', {},
          createElement('a', { href: '#/game' }, 'Start Game (placeholder)')
        )
      )
    ),
    '#/game': () => (
      createElement('section', { className: 'screen game' },
        createElement('h2', {}, 'Game'),
        createElement('p', {}, 'Map and gameplay will render here.')
      )
    ),
    '#/results': () => (
      createElement('section', { className: 'screen results' },
        createElement('h2', {}, 'Results'),
        createElement('p', {}, 'Winner and stats will be displayed here.'),
        createElement('p', {},
          createElement('a', { href: '#/' }, 'Back to Home')
        )
      )
    )
  };
}

function view(state) {
  const routes = Routes();
  const screen = routes[state.route] || routes['#/'];

  return createElement('main', { className: 'app' },
    createElement('nav', { className: 'topnav' },
      createElement('a', { href: '#/' }, 'Home'), ' | ',
      createElement('a', { href: '#/lobby' }, 'Lobby'), ' | ',
      createElement('a', { href: '#/game' }, 'Game'), ' | ',
      createElement('a', { href: '#/results' }, 'Results')
    ),
    screen()
  );
}

const rootEl = document.getElementById('root');
const initial = initialRootState();
initial.route = window.location.hash || '#/';

const store = createApp({ view, initialState: initial, rootElement: rootEl });

window.addEventListener('hashchange', () => {
  const hash = window.location.hash || '#/';
  store.setState(setRoute(hash));
});

window.__appStore = store;
