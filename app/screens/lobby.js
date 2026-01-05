import { createElement } from '../../framework/core.js';
import { getIconSVG } from '../icons/iconComponent.js';

const icon = (name, className = '') => createElement('span', {
  className: `icon-wrapper ${className}`.trim(),
  innerHTML: getIconSVG(name)
});

const MAX_PLAYERS = 4;

const getInitials = (nickname) => {
  const parts = nickname.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return nickname.slice(0, 2).toUpperCase();
};

const playerCard = (player, idx, selfId) => createElement('div', {
  className: `lobby-player-card ${player.ready ? 'ready' : ''} ${player.id === selfId ? 'is-you' : ''}`,
  key: player.id
},
  createElement('div', { className: `lobby-player-avatar p${idx}` },
    getInitials(player.nickname)
  ),
  createElement('div', { className: 'lobby-player-info' },
    createElement('span', { className: 'lobby-player-name' },
      player.nickname,
      player.id === selfId ? createElement('span', { className: 'you-tag' }, 'YOU') : null
    ),
    createElement('span', { className: `lobby-player-status ${player.ready ? 'ready' : ''}` },
      player.ready ? '● READY' : '○ WAITING'
    )
  )
);

const emptyCard = (idx) => createElement('div', { className: 'lobby-player-card empty', key: `empty-${idx}` },
  createElement('div', { className: 'lobby-player-avatar empty' }, '?'),
  createElement('div', { className: 'lobby-player-info' },
    createElement('span', { className: 'lobby-player-name empty' }, 'Empty Slot'),
    createElement('span', { className: 'lobby-player-status' }, '◇ WAITING')
  )
);

const playersHeader = (playerCount) => createElement('div', { className: 'players-header' },
  createElement('span', { className: 'players-count' }, `${playerCount}/4 Players`),
  createElement('div', { className: 'players-progress' },
    createElement('div', { className: 'progress-track' },
      createElement('div', {
        className: 'progress-fill',
        style: { width: `${(playerCount / 4) * 100}%` }
      })
    )
  )
);

const playersGrid = (players, sessionId) => createElement('div', { className: 'players-grid' },
  ...players.map((player, idx) => playerCard(player, idx, sessionId)),
  ...Array(MAX_PLAYERS - players.length).fill(0).map((_, i) => emptyCard(i))
);

const readyButton = (isReady, session, websocket) => createElement('button', {
  className: `lobby-ready-btn btn-icon ${isReady ? 'is-ready' : ''}`,
  onclick: () => session.playerId && window.sendMessage({ type: 'ready', player_id: session.playerId }),
  disabled: !websocket.connected
},
  icon(isReady ? 'cancel' : 'check'),
  createElement('span', {}, isReady ? 'NOT READY' : 'READY')
);

const leaveButton = (session, websocket, store) => createElement('button', {
  className: 'lobby-leave-btn btn-icon',
  onclick: () => {
    if (!session.playerId) return;
    const modal = {
      kind: 'confirm',
      title: 'Leave lobby?',
      description: 'You will disconnect from this room.',
      action: 'leaveLobby',
      confirmLabel: 'Leave'
    };
    const curr = store.getState();
    store.setState({ ...curr, ui: { ...(curr.ui || {}), modal } });
  },
  disabled: !websocket.connected
},
  icon('door'),
  createElement('span', {}, 'LEAVE')
);

const chatMessages = (chat, sessionId) => chat.length === 0
  ? createElement('p', { className: 'chat-empty-msg' }, 'Say hello to other players!')
  : chat.slice(-8).map((msg, i) =>
    createElement('div', {
      className: `chat-line ${msg.player_id === sessionId ? 'own' : ''}`,
      key: `msg-${i}`
    },
      createElement('strong', { className: 'chat-author' }, msg.nickname + ':'),
      createElement('span', { className: 'chat-text' }, msg.text)
    )
  );

const chatForm = (session, websocket) => createElement('form', {
  className: 'chat-input-form',
  onsubmit: (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input[name="message"]');
    const text = input.value.trim();
    if (text && session.playerId && websocket.connected) {
      window.sendMessage({ type: 'chat', player_id: session.playerId, text });
      input.value = '';
      input.focus();
    }
  }
},
  createElement('input', {
    name: 'message',
    type: 'text',
    placeholder: websocket.connected ? 'Type message...' : 'Connecting...',
    maxlength: 200,
    disabled: !websocket.connected
  }),
  createElement('button', { type: 'submit', className: 'btn-icon', disabled: !websocket.connected }, icon('arrowRight'))
);

const chatSection = (chat, session, websocket) => createElement('div', { className: 'lobby-chat-section' },
  createElement('div', { className: 'chat-header' },
    createElement('span', { className: 'chat-icon' }, icon('chat')),
    createElement('span', {}, 'CHAT')
  ),
  createElement('div', { className: 'chat-messages-box' }, chatMessages(chat, session.playerId)),
  chatForm(session, websocket)
);

const countdownOverlay = (lobby, route) => lobby.countdown.phase === 'pre-start' && route === '#/lobby'
  ? createElement('div', { className: 'countdown-overlay' },
    createElement('div', { className: 'countdown-card' },
      createElement('div', { className: 'countdown-icon hero-icon' }, icon('bomb')),
      createElement('h2', {}, 'GET READY!'),
      createElement('div', { className: 'countdown-timer' }, Math.ceil(lobby.countdown.remainingMs / 1000)),
      createElement('p', {}, 'Battle begins soon...')
    )
  )
  : null;

export function LobbyScreen(state, store) {
  const { lobby, session, chat, websocket } = state;
  const players = lobby.players || [];
  const playerCount = players.length;
  const isReady = players.find(p => p.id === session.playerId)?.ready || false;
  const lobbyTimerActive = lobby.lobbyTimer?.active || false;
  const lobbyTimeLeft = Math.ceil((lobby.lobbyTimer?.remainingMs || 0) / 1000);

  return createElement('section', { className: 'screen lobby', key: 'screen-lobby' },
    createElement('div', { className: 'lobby-game-header' },
      createElement('div', { className: 'title-icon hero-icon' }, icon('bomb')),
      createElement('h1', {}, 'Bomberman'),
      createElement('p', { className: 'subtitle icon-text' },
        icon('gamepad'),
        createElement('span', {}, 'RETRO BATTLE ARENA'),
        icon('gamepad')
      )
    ),

    createElement('div', { className: 'lobby-container' },
      createElement('div', { className: 'lobby-title-section' },
        createElement('span', { className: 'lobby-icon' }, icon('gamepad')),
        createElement('h1', {}, 'GAME LOBBY'),
        createElement('span', { className: 'lobby-status-text' },
          lobbyTimerActive ? `Starting in ${lobbyTimeLeft}s...` : 'Waiting for players'
        )
      ),

      createElement('div', { className: 'lobby-players-section' },
        playersHeader(playerCount),
        playersGrid(players, session.playerId)
      ),

      createElement('div', { className: 'lobby-actions-section' },
        readyButton(isReady, session, websocket),
        leaveButton(session, websocket, store)
      ),

      playerCount < 2 ? createElement('p', { className: 'lobby-hint icon-text' },
        icon('star'),
        createElement('span', {}, 'Need at least 2 players to start')
      ) : null,

      chatSection(chat, session, websocket)
    ),

    countdownOverlay(lobby, state.route)
  );
}
