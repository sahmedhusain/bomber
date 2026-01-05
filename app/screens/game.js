import { createElement } from '../../framework/core.js';
import { TileType, MAP_WIDTH, MAP_HEIGHT } from '../../game/models.js';
import { getIconSVG } from '../icons/iconComponent.js';

const icon = (name, className = '') => createElement('span', {
  className: `icon-wrapper ${className}`.trim(),
  innerHTML: getIconSVG(name)
});

const joinNames = (names) => {
  if (!names || names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  const head = names.slice(0, -1).join(', ');
  const tail = names[names.length - 1];
  return `${head} & ${tail}`;
};

let frameCount = 0;
let currentFPS = 0;
let fpsInterval = null;

// Game timer
let gameStartTime = null;
let gameTimerInterval = null;
let currentGameTime = '00:00';

const formatGameTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const hitPlayers = new Set();

let arenaResizeFrame = null;
let arenaResizeObserver = null;
let arenaResizeListenerAttached = false;
let lastArenaShape = { cols: MAP_WIDTH, rows: MAP_HEIGHT };

// Cache for tile VNodes - only recreate when state changes
let tileVNodeCache = new Map();
let lastTileStates = new Map();

function initFPS() {
  if (fpsInterval) return;
  fpsInterval = setInterval(() => {
    currentFPS = frameCount;
    frameCount = 0;
  }, 1000);
}

function initGameTimer() {
  if (!gameStartTime) {
    gameStartTime = Date.now();
  }
  if (!gameTimerInterval) {
    gameTimerInterval = setInterval(() => {
      currentGameTime = formatGameTime(Date.now() - gameStartTime);
    }, 1000);
  }
}

export function resetGameTimer() {
  gameStartTime = null;
  currentGameTime = '00:00:00';
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval);
    gameTimerInterval = null;
  }
}

export function clearTileCache() {
  tileVNodeCache.clear();
  lastTileStates.clear();
}

export function markPlayerHit(playerId) {
  hitPlayers.add(playerId);
  setTimeout(() => hitPlayers.delete(playerId), 400);
}

function applyArenaSizing(cols, rows) {
  const container = document.querySelector('.arena-container');
  const arenaEl = container?.querySelector('.arena');
  if (!container || !arenaEl || !cols || !rows) return;

  const availableWidth = container.clientWidth;
  const availableHeight = container.clientHeight;
  if (availableWidth <= 0 || availableHeight <= 0) return;

  const tileSize = Math.max(8, Math.floor(Math.min(availableWidth / cols, availableHeight / rows)));
  arenaEl.style.setProperty('--cols', cols);
  arenaEl.style.setProperty('--rows', rows);
  arenaEl.style.setProperty('--tile-size', `${tileSize}px`);
  arenaEl.style.width = '100%';
  arenaEl.style.height = '100%';
}

function attachArenaResizeObserver() {
  if (arenaResizeObserver) return;
  if (typeof ResizeObserver === 'undefined') return;
  const container = document.querySelector('.arena-container');
  if (!container) return;

  arenaResizeObserver = new ResizeObserver(() => {
    applyArenaSizing(lastArenaShape.cols, lastArenaShape.rows);
  });
  arenaResizeObserver.observe(container);

  if (!arenaResizeListenerAttached) {
    arenaResizeListenerAttached = true;
    window.addEventListener('resize', () => applyArenaSizing(lastArenaShape.cols, lastArenaShape.rows));
  }
}

function scheduleArenaSizing(cols, rows) {
  lastArenaShape = { cols, rows };
  if (arenaResizeFrame) cancelAnimationFrame(arenaResizeFrame);
  arenaResizeFrame = requestAnimationFrame(() => {
    arenaResizeFrame = null;
    applyArenaSizing(cols, rows);
    attachArenaResizeObserver();
  });
}

const statDefs = [
  { iconName: 'heart', label: 'Lives', value: (p) => p.lives || 0 },
  { iconName: 'bomb', label: 'Bombs', value: (p) => p.bombCapacity || 1 },
  { iconName: 'fire', label: 'Range', value: (p) => p.bombRange || 1 },
  { iconName: 'speed', label: 'Speed', value: (p) => (p.speed || 1).toFixed(1) }
];

// Each powerup in its own container box
const powerupsBar = (player) => !player ? null :
  createElement('div', { className: 'powerups-bar' },
    ...statDefs.map(({ iconName, label, value }) =>
      createElement('div', { className: 'powerup-box', key: label },
        icon(iconName, 'powerup-icon'),
        createElement('span', { className: 'powerup-label' }, label),
        createElement('span', { className: 'powerup-value' }, value(player))
      )
    )
  );

// Sidebar title section (matching lobby design - no box)
const sidebarTitle = () => createElement('div', { className: 'sidebar-game-header' },
  createElement('div', { className: 'title-icon hero-icon' }, icon('bomb')),
  createElement('h1', {}, 'Bomberman'),
  createElement('p', { className: 'subtitle icon-text' },
    createElement('span', {}, 'RETRO BATTLE ARENA')
  )
);

const playerRow = (player, idx, sessionId) => {
  const hearts = player.status === 'alive'
    ? Array(Math.max(0, player.lives || 0)).fill(null).map(() => icon('heart'))
    : [];

  const statusTag = player.status !== 'alive'
    ? createElement('span', { className: 'player-status-tag' }, player.disconnected ? 'LEFT' : 'OUT')
    : null;

  return createElement('div', {
    className: `player-card ${player.status} ${player.id === sessionId ? 'is-me' : ''}`,
    key: player.id
  },
    createElement('div', { className: `player-avatar p${idx}` },
      player.nickname.substring(0, 2).toUpperCase()
    ),
    createElement('div', { className: 'player-details' },
      createElement('span', { className: 'player-name' },
        player.nickname,
        player.id === sessionId ? createElement('span', { className: 'you-tag' }, 'YOU') : null
      ),
      createElement('span', { className: 'player-hearts' },
        ...(hearts.length ? hearts : []),
        hearts.length === 0 && statusTag ? statusTag : null
      )
    )
  );
};

const playersSection = (players, sessionId) => createElement('div', { className: 'sidebar-section players-section' },
  createElement('h3', { className: 'sidebar-title' },
    icon('players', 'section-title-icon'),
    ' Players'
  ),
  createElement('div', { className: 'players-list' }, players.map((p, idx) => playerRow(p, idx, sessionId)))
);

const chatMessages = (chat, sessionId) => chat.length === 0
  ? createElement('p', { className: 'chat-empty' }, 'Say hello to other players!')
  : chat.slice(-10).map((msg, i) =>
    createElement('div', {
      className: `chat-msg ${msg.player_id === sessionId ? 'own' : ''}`,
      key: `m-${i}`
    },
      createElement('strong', { className: 'msg-author' }, msg.nickname),
      createElement('span', { className: 'msg-text' }, msg.text)
    )
  );

const chatForm = (session, websocket) => createElement('form', {
  className: 'chat-form',
  onsubmit: (e) => {
    e.preventDefault();
    const inp = e.target.querySelector('textarea');
    const txt = inp.value.trim();
    if (txt && session?.playerId && websocket?.connected) {
      window.sendMessage({ type: 'chat', player_id: session.playerId, text: txt });
      inp.value = '';
      inp.style.height = 'auto'; // Reset height
    }
  }
},
  createElement('textarea', {
    className: 'chat-input',
    placeholder: 'Type message...',
    maxlength: 100,
    rows: 1,
    disabled: !websocket?.connected,
    oninput: (e) => {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
    },
    onkeydown: (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.target.form.dispatchEvent(new Event('submit'));
      }
    }
  }),
  createElement('button', { type: 'submit', className: 'chat-send btn-icon' }, icon('arrowRight'))
);

const chatSection = (chat, session, websocket) => createElement('div', { className: 'sidebar-section chat-section' },
  createElement('h3', { className: 'sidebar-title' },
    icon('chatBubble', 'section-title-icon'),
    ' Chat'
  ),
  createElement('div', { className: 'chat-messages' }, chatMessages(chat, session?.playerId)),
  chatForm(session, websocket)
);

const sidebar = (currentPlayer, isSpectator, playersArray, session, chat, websocket) => createElement('aside', { className: 'sidebar sidebar-left' },
  sidebarTitle(),
  playersSection(playersArray, session?.playerId),
  chatSection(chat, session, websocket)
);

// Generate a state key for a tile that captures all relevant state
function getTileStateKey(tile, playerOnTile, bombOnTile, powerUpOnTile, explosionOnTile, playerIdx, isSelf, isHit, bombState) {
  // Create a unique string representing the tile's current state
  let stateKey = `${tile.type}`;
  if (playerOnTile) {
    stateKey += `-p${playerIdx}-${isSelf ? 's' : 'o'}-${isHit ? 'h' : 'n'}`;
  }
  if (bombOnTile) {
    stateKey += `-b${bombState}`;
  }
  if (powerUpOnTile) {
    stateKey += `-pu${powerUpOnTile.kind}`;
  }
  if (explosionOnTile) {
    stateKey += '-ex';
  }
  return stateKey;
}

// Simple and efficient tile builder - with caching
const buildTileElements = (tiles, players, bombs, powerUps, explosions, sessionId, playersArray) => {
  // Build lookup maps for O(1) entity access
  const playerMap = new Map();
  const bombMap = new Map();
  const powerUpMap = new Map();
  const explosionMap = new Map();
  const playerIndexMap = new Map();

  playersArray.forEach((p, idx) => playerIndexMap.set(p.id, idx));

  for (const id in players) {
    const p = players[id];
    if (p.status === 'alive') playerMap.set(`${p.x},${p.y}`, p);
  }
  for (const id in bombs) {
    const b = bombs[id];
    bombMap.set(`${b.x},${b.y}`, b);
  }
  for (const id in powerUps) {
    const pu = powerUps[id];
    powerUpMap.set(`${pu.x},${pu.y}`, pu);
  }
  for (const id in explosions) {
    const ex = explosions[id];
    explosionMap.set(`${ex.x},${ex.y}`, ex);
  }

  const now = Date.now();
  const result = new Array(tiles.length);

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const { x, y, type } = tile;
    const key = `${x},${y}`;

    const playerOnTile = playerMap.get(key);
    const bombOnTile = bombMap.get(key);
    const powerUpOnTile = powerUpMap.get(key);
    const explosionOnTile = explosionMap.get(key);

    const playerIdx = playerOnTile ? (playerIndexMap.get(playerOnTile.id) ?? -1) : -1;
    const isSelf = playerOnTile?.id === sessionId;
    const isHit = playerOnTile ? hitPlayers.has(playerOnTile.id) : false;

    let bombState = '';
    if (bombOnTile) {
      const age = now - bombOnTile.placedAt;
      const fuse = bombOnTile.fuseMs || 2500;
      if (age > fuse * 0.7) bombState = 'c';
      else if (age > fuse * 0.4) bombState = 'w';
      else bombState = 'n';
    }

    const stateKey = getTileStateKey(tile, playerOnTile, bombOnTile, powerUpOnTile, explosionOnTile, playerIdx, isSelf, isHit, bombState);
    const lastState = lastTileStates.get(key);

    // If tile state hasn't changed, reuse cached VNode
    if (lastState === stateKey && tileVNodeCache.has(key)) {
      result[i] = tileVNodeCache.get(key);
      continue;
    }

    // Build class string based on tile type
    let cls = 'tile';
    if (type === TileType.Wall) cls += ' wall';
    else if (type === TileType.Block) cls += ' block';
    else cls += ' floor';

    if (playerOnTile) {
      cls += ' has-player';
      if (isHit) cls += ' hit';
    }
    if (bombOnTile) {
      cls += ' has-bomb';
      if (bombState === 'c') cls += ' critical';
      else if (bombState === 'w') cls += ' warning';
    }
    if (powerUpOnTile) cls += ` has-powerup ${powerUpOnTile.kind}`;
    if (explosionOnTile) cls += ' has-explosion';

    const vNode = createElement('div', {
      key: `t-${x}-${y}`,
      className: cls,
      style: { gridColumn: x + 1, gridRow: y + 1 }
    },
      playerOnTile ? createElement('div', { className: `player p${playerIdx} ${isSelf ? 'me' : ''}` },
        createElement('span', { className: 'initial' }, playerOnTile.nickname.substring(0, 2).toUpperCase())
      ) : null,
      bombOnTile ? createElement('div', { className: 'bomb' }) : null,
      powerUpOnTile ? createElement('div', { className: `powerup ${powerUpOnTile.kind}` }) : null,
      explosionOnTile ? createElement('div', { className: 'explosion' }) : null
    );

    // Cache the VNode and state
    tileVNodeCache.set(key, vNode);
    lastTileStates.set(key, stateKey);
    result[i] = vNode;
  }

  return result;
};

const overlays = ({ showLeaveConfirm, handleLeaveCancel, handleLeaveConfirm, isEliminated, showEliminationOverlay, status, isWinner, isSpectator, winnerNames, isDraw }) => [
  showLeaveConfirm ? createElement('div', { className: 'game-overlay leave-confirm' },
    createElement('div', { className: 'overlay-box confirm-box' },
      createElement('span', { className: 'overlay-emoji hero-icon' }, icon('door')),
      createElement('h2', {}, 'Leave Game?'),
      createElement('p', {}, 'Are you sure you want to leave? You will lose your progress.'),
      createElement('div', { className: 'confirm-actions' },
        createElement('button', { className: 'btn-cancel btn-icon', onclick: handleLeaveCancel },
          icon('cancel'),
          ' Stay'
        ),
        createElement('button', { className: 'btn-confirm btn-icon', onclick: handleLeaveConfirm },
          icon('check'),
          ' Leave'
        )
      )
    )
  ) : null,
  isEliminated && status === 'running' && showEliminationOverlay ? createElement('div', { className: 'game-overlay eliminated' },
    createElement('div', { className: 'overlay-box' },
      createElement('span', { className: 'overlay-emoji hero-icon' }, icon('cancel')),
      createElement('h2', {}, 'ELIMINATED'),
      createElement('p', {}, 'Spectating the battle...')
    )
  ) : null,
  status === 'finished' && isWinner ? createElement('div', { className: 'game-overlay victory' },
    createElement('div', { className: 'overlay-box' },
      createElement('span', { className: 'overlay-emoji hero-icon trophy' }, icon('trophy')),
      createElement('h2', {}, isDraw ? 'DRAW!' : 'VICTORY!'),
      createElement('p', {}, isDraw ? 'Shared victory!' : 'You won!')
    )
  ) : null,
  status === 'finished' && !isWinner && !isSpectator ? createElement('div', { className: 'game-overlay defeat' },
    createElement('div', { className: 'overlay-box' },
      createElement('span', { className: 'overlay-emoji hero-icon' }, icon('bomb')),
      createElement('h2', {}, 'GAME OVER'),
      createElement('p', {}, winnerNames.length
        ? (isDraw ? `Draw: ${joinNames(winnerNames)}` : `Winner: ${winnerNames[0]}`)
        : 'No winner')
    )
  ) : null
].filter(Boolean);

export function GameScreen(state, store) {
  initFPS();
  initGameTimer();
  frameCount++;

  const game = state.game || {};
  const map = game.map || { width: MAP_WIDTH, height: MAP_HEIGHT, tiles: [] };
  const { players = {}, bombs = {}, powerUps = {}, explosions = {}, status } = game;
  const { width, height, tiles = [] } = map;
  const playersArray = Object.values(players);
  const { session, chat = [], websocket } = state;

  const currentPlayer = playersArray.find(p => p.id === session?.playerId);
  const isEliminated = currentPlayer?.status === 'eliminated';
  const winnerIds = Array.isArray(game.winnerIds) && game.winnerIds.length
    ? game.winnerIds
    : (game.winnerId ? [game.winnerId] : []);
  const winnerNames = winnerIds
    .map(id => players[id]?.nickname)
    .filter(Boolean);
  const isDraw = winnerIds.length > 1;
  const isWinner = session?.playerId ? winnerIds.includes(session.playerId) : false;
  const isSpectator = session?.isSpectator || false;
  const eliminationOverlayState = state.ui?.eliminationOverlay;
  const showEliminationOverlay = eliminationOverlayState
    ? eliminationOverlayState.visible
    : (isEliminated && status === 'running');

  scheduleArenaSizing(width, height);

  if (!tiles || tiles.length === 0) {
    return createElement('div', { className: 'game-page' },
      createElement('div', { className: 'game-loading' },
        createElement('div', { className: 'loader' }),
        createElement('p', {}, 'Loading arena...')
      )
    );
  }

  const tileElements = buildTileElements(tiles, players, bombs, powerUps, explosions, session?.playerId, playersArray);

  const [showLeaveConfirm, setShowLeaveConfirm] = [
    state.ui?.showLeaveConfirm || false,
    (val) => store.setState({ ui: { ...state.ui, showLeaveConfirm: val } })
  ];

  const handleLeaveConfirm = () => {
    if (websocket?.connected && session?.playerId) {
      window.sendMessage({ type: 'leave_lobby', player_id: session.playerId });
    }
    store.setState({
      session: { connected: false },
      route: '#/',
      lobby: { players: [], countdown: { phase: 'waiting', remainingMs: 0 }, spectators: [] },
      game: { status: 'waiting', players: {}, winnerId: undefined, winnerIds: [], winners: [], finalStandings: [], eliminationLog: [] },
      chat: [],
      ui: { showLeaveConfirm: false }
    });
    window.location.hash = '#/';
  };

  return createElement('div', { className: 'game-page', key: 'screen-game' },
    sidebar(currentPlayer, isSpectator, playersArray, session, chat, websocket),

    createElement('main', { className: 'game-main' },
      createElement('header', { className: 'game-header' },
        currentPlayer && !isSpectator ? powerupsBar(currentPlayer) : createElement('div', { className: 'powerups-bar-placeholder' }),
        createElement('div', { className: 'timer-box' },
          icon('clock', 'timer-icon'),
          createElement('span', { className: 'timer-label' }, 'Time'),
          createElement('span', { className: 'timer-value' }, currentGameTime)
        ),
        createElement('button', { className: 'exit-btn', onclick: () => setShowLeaveConfirm(true), title: 'Leave Game' },
          icon('door', 'exit-icon'),
          createElement('span', {}, 'EXIT')
        )
      ),

      createElement('div', { className: 'arena-container' },
        createElement('div', {
          className: 'arena',
          style: { '--cols': width, '--rows': height }
        }, tileElements)
      )
    ),

    ...overlays({
      showLeaveConfirm,
      handleLeaveCancel: () => setShowLeaveConfirm(false),
      handleLeaveConfirm,
      isEliminated,
      status,
      isWinner,
      isSpectator,
      showEliminationOverlay,
      winnerNames,
      isDraw,
      game,
      players,
      handleLeaveClick: () => setShowLeaveConfirm(true)
    })
  );
}
