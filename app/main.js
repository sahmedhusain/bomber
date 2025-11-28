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
  // This includes both players and spectators
  if (game?.status === 'running' || session?.isSpectator) {
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
    const newState = {
      ...state,
      lobby: { ...state.lobby, players: data.players }
    };
    
    // Update session nickname if server assigned a different one
    const currentPlayer = data.players.find(p => p.id === state.session?.playerId);
    if (currentPlayer && currentPlayer.nickname !== state.session?.nickname) {
      newState.session = { 
        ...state.session, 
        nickname: currentPlayer.nickname 
      };
      console.log(`Nickname updated to: ${currentPlayer.nickname}`);
    }
    
    store.setState(newState);
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
  } else if (data.type === 'lobby_timer_start') {
    store.setState({
      lobby: {
        ...state.lobby,
        lobbyTimer: { active: true, remainingMs: data.lobbyTimeLeft * 1000 }
      }
    });
  } else if (data.type === 'lobby_timer_update') {
    store.setState({
      lobby: {
        ...state.lobby,
        lobbyTimer: { active: true, remainingMs: data.lobbyTimeLeft * 1000 }
      }
    });
  } else if (data.type === 'lobby_timer_cancelled') {
    store.setState({
      lobby: {
        ...state.lobby,
        lobbyTimer: { active: false, remainingMs: 0 }
      }
    });
  } else if (data.type === 'countdown_cancelled') {
    store.setState({
      lobby: {
        ...state.lobby,
        countdown: { phase: 'waiting', remainingMs: 0 }
      }
    });
  } else if (data.type === 'game_cancelled') {
    store.setState({
      lobby: {
        ...state.lobby,
        countdown: { phase: 'waiting', remainingMs: 0 },
        lobbyTimer: { active: false, remainingMs: 0 }
      }
    });
  } else if (data.type === 'lobby_cancelled') {
    // Reset to waiting state when lobby is cancelled due to insufficient players
    store.setState({
      lobby: {
        ...state.lobby,
        countdown: { phase: 'waiting', remainingMs: 0 },
        lobbyTimer: { active: false, remainingMs: 0 }
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
  } else if (data.type === 'player_disconnected') {
    // Show notification that player disconnected and has grace period to reconnect
    console.log(`Player ${data.playerId} disconnected, ${data.gracePeriod}s to reconnect`);
  } else if (data.type === 'player_reconnected') {
    // Show notification that player reconnected
    console.log(`Player ${data.playerId} reconnected successfully`);
  } else if (data.type === 'player_eliminated') {
    // Show notification that player was eliminated
    console.log(`Player ${data.playerId} eliminated: ${data.reason}`);
  } else if (data.type === 'reconnected') {
    // Handle successful reconnection - restore session
    console.log('Successfully reconnected to ongoing game');
    const newState = {
      ...state,
      session: { ...state.session, playerId: data.playerId },
      game: data.gameState,
      route: data.roomState.status === 'playing' ? '#/game' : '#/lobby'
    };
    store.setState(newState);
    window.location.hash = newState.route;
  } else if (data.type === 'game_update') {
    // Update game state
    const newState = { ...state, game: data.gameState };
    store.setState(newState);
  } else if (data.type === 'joined_as_spectator') {
    // Handle joining as spectator - always go to game screen when game is playing
    console.log('Joined as spectator');
    const newState = {
      ...state,
      session: { 
        ...state.session, 
        playerId: data.playerId,
        isSpectator: true
      },
      game: data.gameState,
      lobby: { 
        ...state.lobby, 
        players: data.players || [],
        spectators: data.spectators || []
      },
      route: '#/game'  // Always go to game screen as spectator
    };
    store.setState(newState);
    window.location.hash = '#/game';
  } else if (data.type === 'spectators_update') {
    // Update spectator list
    const newState = {
      ...state,
      lobby: { 
        ...state.lobby, 
        spectators: data.spectators || []
      }
    };
    store.setState(newState);
  } else if (data.type === 'return_to_lobby') {
    // Game ended, return to lobby
    const newState = {
      ...state,
      game: data.gameState,
      lobby: { 
        ...state.lobby, 
        players: data.players || [],
        spectators: data.spectators || [],
        countdown: { phase: 'waiting', remainingMs: 0 } 
      },
      route: '#/lobby'
    };
    store.setState(newState);
    window.location.hash = '#/lobby';
  } else if (data.type === 'show_results') {
    // Show results screen
    const newState = {
      ...state,
      game: { ...data.gameState, winner: data.winner },
      route: '#/results'
    };
    store.setState(newState);
    window.location.hash = '#/results';
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
