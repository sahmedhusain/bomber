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
let currentFPS = 60;
let fpsInterval = null;
let lastFrameTime = 0;
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

const hitPlayers = new Set();

let arenaResizeFrame = null;
let arenaResizeObserver = null;
let arenaResizeListenerAttached = false;
let lastArenaShape = { cols: MAP_WIDTH, rows: MAP_HEIGHT };

function initFPS() {
  if (fpsInterval) return;
  lastFrameTime = performance.now();
  fpsInterval = setInterval(() => {
    currentFPS = Math.max(frameCount, 60);
    frameCount = 0;
  }, 1000);
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

const statsSection = (player) => !player ? null :
  createElement('div', { className: 'sidebar-section my-stats' },
    createElement('h3', { className: 'sidebar-title' },
      icon('stats', 'section-title-icon'),
      ' Your Stats'
    ),
    createElement('div', { className: 'stats-grid' },
      ...statDefs.map(({ iconName, label, value }) =>
        createElement('div', { className: 'stat-box' },
          createElement('span', { className: 'stat-icon' }, icon(iconName)),
          createElement('span', { className: 'stat-value' }, value(player)),
          createElement('span', { className: 'stat-label' }, label)
        )
      )
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
      player.nickname.charAt(0).toUpperCase()
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
  ? createElement('p', { className: 'chat-empty' }, 'No messages yet...')
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
    const inp = e.target.querySelector('input');
    const txt = inp.value.trim();
    if (txt && session?.playerId && websocket?.connected) {
      window.sendMessage({ type: 'chat', player_id: session.playerId, text: txt });
      inp.value = '';
    }
  }
},
  createElement('input', {
    type: 'text',
    className: 'chat-input',
    placeholder: 'Type message...',
    maxlength: 100,
    disabled: !websocket?.connected
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
  currentPlayer && !isSpectator ? statsSection(currentPlayer) : null,
  playersSection(playersArray, session?.playerId),
  chatSection(chat, session, websocket)
);

const buildTileElements = (tiles, players, bombs, powerUps, explosions, sessionId, playersArray) => tiles.map((tile) => {
  const { x, y, type } = tile;
  let cls = 'tile';

  if (type === TileType.Wall) cls += ' wall';
  else if (type === TileType.Block) cls += ' block';
  else cls += ' floor';

  const playerOnTile = Object.values(players).find(p => p.x === x && p.y === y && p.status === 'alive');
  const bombOnTile = Object.values(bombs).find(b => b.x === x && b.y === y);
  const powerUpOnTile = Object.values(powerUps).find(pu => pu.x === x && pu.y === y);
  const explosionOnTile = Object.values(explosions).find(ex => ex.x === x && ex.y === y);

  if (playerOnTile) {
    cls += ' has-player';
    if (hitPlayers.has(playerOnTile.id)) cls += ' hit';
  }
  if (bombOnTile) {
    cls += ' has-bomb';
    const age = Date.now() - bombOnTile.placedAt;
    const fuse = bombOnTile.fuseMs || 2500;
    if (age > fuse * 0.7) cls += ' critical';
    else if (age > fuse * 0.4) cls += ' warning';
  }
  if (powerUpOnTile) cls += ` has-powerup ${powerUpOnTile.kind}`;
  if (explosionOnTile) cls += ' has-explosion';

  const playerIdx = playerOnTile ? playersArray.indexOf(playerOnTile) : -1;
  const isSelf = playerOnTile?.id === sessionId;

  return createElement('div', {
    key: `t-${x}-${y}`,
    className: cls,
    style: { gridColumn: x + 1, gridRow: y + 1 }
  },
    playerOnTile ? createElement('div', { className: `player p${playerIdx} ${isSelf ? 'me' : ''}` },
      createElement('span', { className: 'initial' }, playerOnTile.nickname.charAt(0).toUpperCase())
    ) : null,
    bombOnTile ? createElement('div', { className: 'bomb' }) : null,
    powerUpOnTile ? createElement('div', { className: `powerup ${powerUpOnTile.kind}` }) : null,
    explosionOnTile ? createElement('div', { className: 'explosion' }) : null
  );
});

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
        createElement('h1', { className: 'game-title' },
          createElement('span', { className: 'game-title-icon' }, icon('bomb')),
          ' BOMBERMAN'
        ),
        createElement('button', { className: 'leave-btn btn-icon', onclick: () => setShowLeaveConfirm(true), title: 'Leave Game' },
          icon('door'),
          ' EXIT'
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
