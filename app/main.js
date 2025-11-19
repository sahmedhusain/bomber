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

let store;

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

store = createApp({ view, initialState: initial, rootElement: rootEl });

window.addEventListener('hashchange', () => {
  const hash = window.location.hash || '#/';
  store.setState(setRoute(hash));
});

window.__appStore = store;

// WebSocket connection
let ws = null;

function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  ws = new WebSocket('ws://localhost:8765');

  ws.onopen = () => {
    console.log('WebSocket connected');
    store.setState({ websocket: { connected: true } });
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    store.setState({ websocket: { connected: false } });
    // Auto-reconnect after 1 second
    setTimeout(connectWebSocket, 1000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

function handleWebSocketMessage(data) {
  const state = store.getState();

  if (data.type === 'state_sync') {
    // Sync entire state from server
    const newState = { ...state, ...data.state };
    store.setState(newState);
  } else if (data.type === 'players_update') {
    store.setState({
      lobby: { ...state.lobby, players: data.players }
    });
  } else if (data.type === 'chat') {
    store.setState(pushChat(state, data.message));
  } else if (data.type === 'countdown_start') {
    store.setState({
      lobby: {
        ...state.lobby,
        countdown: { phase: 'pre-start', remainingMs: data.countdown * 1000 }
      }
    });
  } else if (data.type === 'countdown_update') {
    store.setState({
      lobby: {
        ...state.lobby,
        countdown: { phase: 'pre-start', remainingMs: data.countdown * 1000 }
      }
    });
  } else if (data.type === 'game_start') {
    // Update game state and navigate to game
    const newState = {
      ...state,
      game: data.gameState || state.game,
      route: '#/game'
    };
    store.setState(newState);
  } else if (data.type === 'input_ack') {
    // Handle input acknowledgment if needed
  }
}

function sendMessage(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.warn('WebSocket not connected, message not sent:', message);
  }
}

// Make sendMessage available globally
window.sendMessage = sendMessage;

// Connect to WebSocket
connectWebSocket();
