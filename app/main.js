import { createApp, createElement } from '../framework/core.js';
import { initialRootState, setRoute } from '../game/models.js';
import { NicknameScreen } from './screens/nickname.js';
import { LobbyScreen } from './screens/lobby.js';
import { GameScreen } from './screens/game.js';
import { ResultsScreen } from './screens/results.js';

function Routes(state, store) {
  return {
    '#/': () => NicknameScreen(state, store),
    '#/lobby': () => LobbyScreen(state, store),
    '#/game': () => GameScreen(state, store),
    '#/results': () => ResultsScreen(state, store)
  };
}

function view(state) {
  const routes = Routes(state, store);
  const screen = routes[state.route] || routes['#/'];

  return createElement('main', { className: 'app' },
    createElement('nav', { className: 'topnav' },
      createElement('a', { href: '#/' }, 'Home'), ' | ',
      createElement('a', { href: '#/lobby' }, 'Lobby'), ' | ',
      createElement('a', { href: '#/game' }, 'Game'), ' | ',
      createElement('a', { href: '#/results' }, 'Results')
    ),
    state.session?.nickname ?
      createElement('div', { className: 'session-bar' }, 'You are ', createElement('strong', {}, state.session.nickname)) : null,
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
