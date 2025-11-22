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

function getValidRoute(state) {
  const { session, websocket, lobby, game } = state;
  
  // If user has no nickname, must stay on home
  if (!session?.nickname || !session?.playerId) {
    return '#/';
  }
  
  // If not connected to websocket, must stay on home
  if (!websocket?.connected) {
    return '#/';
  }
  
  // If game is running or finished, must be on game/results screen
  if (game?.status === 'running') {
    return '#/game';
  }
  
  if (game?.status === 'finished' || game?.winnerId) {
    return '#/results';
  }
  
  // If countdown is active, must be in lobby
  if (lobby?.countdown?.phase === 'pre-start') {
    return '#/lobby';
  }
  
  // If user has session, default to lobby
  if (session?.nickname && websocket?.connected) {
    return '#/lobby';
  }
  
  // Default to home
  return '#/';
}

function view(state) {
  const routes = Routes(state, store);
  const validRoute = getValidRoute(state);
  
  // Force correct route if user is on wrong screen
  if (state.route !== validRoute) {
    // Delay route correction to avoid infinite loops
    setTimeout(() => {
      store.setState({ route: validRoute });
      window.location.hash = validRoute;
    }, 0);
  }
  
  const currentRoute = validRoute;
  const screen = routes[currentRoute] || routes['#/'];

  return createElement('main', { className: 'app' },
    createElement('nav', { className: 'topnav' },
      createElement('div', { 
        className: `nav-item ${currentRoute === '#/' ? 'active' : 'disabled'}`,
        title: currentRoute !== '#/' ? 'Navigation restricted during game' : ''
      }, '🏠 Home'),
      createElement('div', { 
        className: `nav-item ${currentRoute === '#/lobby' ? 'active' : 'disabled'}`,
        title: currentRoute !== '#/lobby' ? 'Navigation restricted during game' : ''
      }, '🎮 Lobby'),
      createElement('div', { 
        className: `nav-item ${currentRoute === '#/game' ? 'active' : 'disabled'}`,
        title: currentRoute !== '#/game' ? 'Navigation restricted during game' : ''
      }, '⚔️ Game'),
      createElement('div', { 
        className: `nav-item ${currentRoute === '#/results' ? 'active' : 'disabled'}`,
        title: currentRoute !== '#/results' ? 'Navigation restricted during game' : ''
      }, '🏆 Results')
    ),
    state.session?.nickname ?
      createElement('div', { className: 'session-bar' }, 
        '👤 Welcome back, ', 
        createElement('strong', {}, state.session.nickname),
        state.websocket?.connected ? 
          createElement('span', { className: 'connection-indicator' }, ' • 🟢 Online') :
          createElement('span', { className: 'connection-indicator' }, ' • 🔴 Offline')
      ) : null,
    screen()
  );
}

const rootEl = document.getElementById('root');
const initial = initialRootState();
initial.route = window.location.hash || '#/';

store = createApp({ view, initialState: initial, rootElement: rootEl });

// Prevent manual navigation - routes are controlled by game state
window.addEventListener('hashchange', (event) => {
  const newHash = window.location.hash || '#/';
  const currentState = store.getState();
  const validRoute = getValidRoute(currentState);
  
  // If user tries to navigate to invalid route, redirect to valid one
  if (newHash !== validRoute) {
    event.preventDefault();
    window.location.hash = validRoute;
    return false;
  }
  
  store.setState(setRoute(newHash));
});

window.__appStore = store;

// Helper function to add chat messages to state
function pushChat(state, message) {
  const newChat = [...(state.chat || []), message];
  // Keep only last 50 messages
  if (newChat.length > 50) {
    return { chat: newChat.slice(-50) };
  }
  return { chat: newChat };
}

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
    const chatUpdate = pushChat(state, data.message);
    store.setState({ ...state, ...chatUpdate });
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
  } else if (data.type === 'countdown_end') {
    store.setState({
      lobby: {
        ...state.lobby,
        countdown: { phase: 'waiting', remainingMs: 0 }
      }
    });
  } else if (data.type === 'game_start') {
    // Update game state and navigate to game automatically
    const newState = {
      ...state,
      game: { ...data.gameState, status: 'running' },
      lobby: { ...state.lobby, countdown: { phase: 'waiting', remainingMs: 0 } },
      route: '#/game'
    };
    store.setState(newState);
    window.location.hash = '#/game';
  } else if (data.type === 'game_end') {
    // Game finished, navigate to results
    const newState = {
      ...state,
      game: { ...state.game, ...data.gameState, status: 'finished' },
      route: '#/results'
    };
    store.setState(newState);
    window.location.hash = '#/results';
  } else if (data.type === 'game_reset') {
    // Game reset, return to lobby
    const newState = {
      ...state,
      game: data.gameState,
      lobby: { ...state.lobby, countdown: { phase: 'waiting', remainingMs: 0 } },
      route: '#/lobby'
    };
    store.setState(newState);
    window.location.hash = '#/lobby';
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
