import { createApp, createElement } from '../framework/core.js';
import { initialRootState, setRoute } from '../game/models.js';
import { NicknameScreen } from './screens/nickname.js';
import { LobbyScreen } from './screens/lobby.js';
import { GameScreen, markPlayerHit } from './screens/game.js';
import { ResultsScreen } from './screens/results.js';

let previousPlayerLives = {};

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

  if (!session?.nickname || !session?.playerId) {
    return '#/';
  }

  if (!websocket?.connected) {
    return '#/';
  }

  if (game?.status === 'finished' || game?.winnerId) {
    return '#/results';
  }

  if (game?.status === 'running' || session?.isSpectator) {
    return '#/game';
  }

  if (lobby?.countdown?.phase === 'pre-start') {
    return '#/lobby';
  }

  if (session?.nickname && websocket?.connected) {
    return '#/lobby';
  }

  return '#/';
}

function view(state) {
  const routes = Routes(state, store);
  const validRoute = getValidRoute(state);

  if (state.route !== validRoute) {
    setTimeout(() => {
      store.setState({ route: validRoute });
      window.location.hash = validRoute;
    }, 0);
  }

  const currentRoute = validRoute;
  const screen = routes[currentRoute] || routes['#/'];
  const modal = state.ui?.modal;

  return createElement('main', { className: 'app' },
    screen(),
    modal ? createElement('div', { className: 'modal-backdrop' },
      createElement('div', { className: 'modal-card' },
        createElement('h3', {}, modal.title || 'Confirm'),
        modal.description ? createElement('p', { className: 'modal-text' }, modal.description) : null,
        createElement('div', { className: 'modal-actions' },
          createElement('button', { className: 'button-secondary', onclick: () => closeModal() }, 'Cancel'),
          createElement('button', { className: 'button-danger', onclick: () => handleModalAction(modal.action, modal.payload) }, modal.confirmLabel || 'Confirm')
        )
      )
    ) : null
  );
}

const rootEl = document.getElementById('root');
const initial = initialRootState();
initial.route = window.location.hash || '#/';
initial.ui = { modal: null };

store = createApp({ view, initialState: initial, rootElement: rootEl });

window.addEventListener('hashchange', (event) => {
  const newHash = window.location.hash || '#/';
  const currentState = store.getState();
  const validRoute = getValidRoute(currentState);

  if (newHash !== validRoute) {
    event.preventDefault();
    window.location.hash = validRoute;
    return false;
  }

  store.setState(setRoute(newHash));
});

window.__appStore = store;

function openModal(modal) {
  const current = store.getState();
  store.setState({ ...current, ui: { ...(current.ui || {}), modal } });
}

function closeModal() {
  const current = store.getState();
  store.setState({ ...current, ui: { ...(current.ui || {}), modal: null } });
}

function handleModalAction(action, payload) {
  const current = store.getState();
  if (action === 'leaveLobby') {
    if (current.session?.playerId) {
      window.sendMessage({
        type: 'disconnect',
        player_id: current.session.playerId
      });
    }
    store.setState({
      session: { connected: false },
      route: '#/',
      lobby: { players: [], countdown: { phase: 'waiting', remainingMs: 0 } },
      ui: { ...(current.ui || {}), modal: null }
    });
    window.location.hash = '#/';
  } else {
    closeModal();
  }
}

function pushChat(state, message) {
  const newChat = [...(state.chat || []), message];
  if (newChat.length > 50) {
    return { chat: newChat.slice(-50) };
  }
  return { chat: newChat };
}

const setLobbyCountdown = (state, phase, remainingMs) => store.setState({
  ...state,
  lobby: { ...state.lobby, countdown: { phase, remainingMs } }
});

const setLobbyTimerState = (state, active, remainingMs) => store.setState({
  ...state,
  lobby: { ...state.lobby, lobbyTimer: { active, remainingMs } }
});

const resetLobbyTimers = (state) => store.setState({
  ...state,
  lobby: {
    ...state.lobby,
    countdown: { phase: 'waiting', remainingMs: 0 },
    lobbyTimer: { active: false, remainingMs: 0 }
  }
});

const routeTo = (route, newState) => {
  store.setState(newState);
  window.location.hash = route;
};

let ws = null;

function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  const wsHost = window.location.hostname;
  const wsUrl = `ws://${wsHost}:8765`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    store.setState({ websocket: { connected: true } });
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    } catch (error) {
    }
  };

  ws.onclose = () => {
    store.setState({ websocket: { connected: false } });
    setTimeout(connectWebSocket, 1000);
  };

  ws.onerror = (error) => {
  };
}

const messageHandlers = {
  state_sync: (state, data) => store.setState({ ...state, ...data.state }),
  players_update: (state, data) => {
    const lobby = { ...state.lobby, players: data.players };
    const currentPlayer = data.players.find(p => p.id === state.session?.playerId);
    const session = currentPlayer && currentPlayer.nickname !== state.session?.nickname
      ? { ...state.session, nickname: currentPlayer.nickname }
      : state.session;
    store.setState({ ...state, lobby, session });
  },
  chat: (state, data) => store.setState({ ...state, ...pushChat(state, data.message) }),
  countdown_start: (state, data) => setLobbyCountdown(state, 'pre-start', data.countdown * 1000),
  countdown_update: (state, data) => setLobbyCountdown(state, 'pre-start', data.countdown * 1000),
  countdown_end: (state) => setLobbyCountdown(state, 'waiting', 0),
  lobby_timer_start: (state, data) => setLobbyTimerState(state, true, data.lobbyTimeLeft * 1000),
  lobby_timer_update: (state, data) => setLobbyTimerState(state, true, data.lobbyTimeLeft * 1000),
  lobby_timer_cancelled: (state) => setLobbyTimerState(state, false, 0),
  countdown_cancelled: (state) => setLobbyCountdown(state, 'waiting', 0),
  game_cancelled: resetLobbyTimers,
  lobby_cancelled: resetLobbyTimers,
  game_start: (state, data) => {
    previousPlayerLives = {};
    Object.values(data.gameState?.players || {}).forEach(player => {
      previousPlayerLives[player.id] = player.lives;
    });
    const isSpectatorInGame = data.spectatorIds?.includes(state.session?.playerId);
    const newState = {
      ...state,
      game: { ...data.gameState, status: 'running' },
      lobby: { ...state.lobby, countdown: { phase: 'waiting', remainingMs: 0 } },
      session: { ...state.session, isSpectator: isSpectatorInGame },
      route: '#/game'
    };
    routeTo('#/game', newState);
  },
  game_end: (state, data) => routeTo('#/results', {
    ...state,
    game: { ...state.game, ...data.gameState, status: 'finished' },
    route: '#/results'
  }),
  game_reset: (state, data) => routeTo('#/lobby', {
    ...state,
    game: data.gameState,
    lobby: { ...state.lobby, countdown: { phase: 'waiting', remainingMs: 0 } },
    route: '#/lobby'
  }),
  input_ack: () => {},
  player_disconnected: () => {},
  player_reconnected: () => {},
  player_eliminated: () => {},
  reconnected: (state, data) => {
    const newState = {
      ...state,
      session: { ...state.session, playerId: data.playerId },
      game: data.gameState,
      route: data.roomState.status === 'playing' ? '#/game' : '#/lobby'
    };
    routeTo(newState.route, newState);
  },
  game_update: (state, data) => {
    const newPlayers = data.gameState?.players || {};
    Object.values(newPlayers).forEach(player => {
      const prevLives = previousPlayerLives[player.id];
      if (prevLives !== undefined && player.lives < prevLives) {
        markPlayerHit(player.id);
      }
      previousPlayerLives[player.id] = player.lives;
    });
    store.setState({ ...state, game: data.gameState });
  },
  joined_as_spectator: (state, data) => {
    const newState = {
      ...state,
      session: { ...state.session, playerId: data.playerId, isSpectator: true },
      game: data.gameState,
      lobby: { ...state.lobby, players: data.players || [], spectators: data.spectators || [] },
      route: '#/game'
    };
    routeTo('#/game', newState);
  },
  spectators_update: (state, data) => store.setState({
    ...state,
    lobby: { ...state.lobby, spectators: data.spectators || [] }
  }),
  return_to_lobby: (state, data) => {
    const userNewRole = data.userRoles?.[state.session?.playerId];
    const isNowSpectator = userNewRole === 'spectator';
    const newState = {
      ...state,
      session: { ...state.session, isSpectator: isNowSpectator, intention: undefined },
      game: data.gameState,
      lobby: {
        ...state.lobby,
        players: data.players || [],
        spectators: data.spectators || [],
        countdown: { phase: 'waiting', remainingMs: 0 }
      },
      route: '#/lobby'
    };
    routeTo('#/lobby', newState);
  },
  show_results: (state, data) => routeTo('#/results', {
    ...state,
    game: { ...data.gameState, winner: data.winner },
    route: '#/results'
  }),
  intention_recorded: (state, data) => store.setState({
    ...state,
    session: { ...state.session, intention: data.intention }
  }),
  role_updated: (state, data) => store.setState({
    ...state,
    session: { ...state.session, isSpectator: data.isSpectator }
  }),
  forced_logout: (state, data) => {
    alert(data.message);
    routeTo('#/', {
      session: { connected: false },
      route: '#/',
      lobby: { players: [], countdown: { phase: 'waiting', remainingMs: 0 }, spectators: [] },
      game: { status: 'waiting', players: {}, winnerId: undefined }
    });
  }
};

function handleWebSocketMessage(data) {
  const state = store.getState();
  const handler = messageHandlers[data.type];
  if (handler) handler(state, data);
}

function sendMessage(message) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
}

window.sendMessage = sendMessage;

function handleKeydown(event) {
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
    return;
  }

  const state = store.getState();
  const { websocket, session, game } = state;
  if (!websocket?.connected) return;
  if (!session?.playerId) return;
  if (session?.isSpectator) return;
  if (game?.status !== 'running') return;

  const key = event.key.toLowerCase();
  let input = null;

  if (key === 'w' || key === 'arrowup') input = { kind: 'move', dir: 'up' };
  else if (key === 's' || key === 'arrowdown') input = { kind: 'move', dir: 'down' };
  else if (key === 'a' || key === 'arrowleft') input = { kind: 'move', dir: 'left' };
  else if (key === 'd' || key === 'arrowright') input = { kind: 'move', dir: 'right' };
  else if (key === ' ' || key === 'spacebar' || event.code === 'Space') input = { kind: 'bomb' };

  if (input) {
    sendMessage({
      type: 'input',
      player_id: session.playerId,
      input
    });
  }
}

connectWebSocket();
window.addEventListener('keydown', handleKeydown);
