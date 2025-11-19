import { createElement } from '../../framework/core.js';

export function LobbyScreen(state, store) {
  const { lobby, session, chat, websocket } = state;
  const players = lobby.players || [];
  const playerCount = players.length;
  const isReady = players.find(p => p.id === session.playerId)?.ready || false;

  return createElement('section', { className: 'screen lobby' },
    createElement('h2', {}, 'Lobby'),
    createElement('div', { className: 'connection-status' },
      websocket.connected ?
        createElement('span', { className: 'connected' }, '🟢 Connected to server') :
        createElement('span', { className: 'disconnected' }, '🔴 Connecting to server...')
    ),
    createElement('div', { className: 'players' },
      createElement('h3', {}, `Players (${playerCount})`),
      createElement('ul', { className: 'player-list' },
        ...players.map(player =>
          createElement('li', {
            className: `player ${player.ready ? 'ready' : 'waiting'} ${player.id === session.playerId ? 'self' : ''}`
          },
            createElement('span', { className: 'nickname' }, player.nickname),
            player.ready ? ' ✅ Ready' : ' ⏳ Waiting',
            player.id === session.playerId ? ' (You)' : ''
          )
        )
      )
    ),
    lobby.countdown.phase === 'pre-start' ?
      createElement('div', { className: 'countdown' },
        createElement('h3', {}, 'Game starting in...'),
        createElement('div', { className: 'countdown-timer' }, Math.ceil(lobby.countdown.remainingMs / 1000))
      ) : null,
    createElement('div', { className: 'chat' },
      createElement('h3', {}, 'Chat'),
      createElement('div', { className: 'chat-messages' },
        ...chat.map(msg =>
          createElement('div', { className: 'chat-message' },
            createElement('strong', {}, `${msg.nickname}: `),
            msg.text
          )
        )
      ),
      createElement('form', {
        className: 'chat-form',
        onsubmit: (e) => {
          e.preventDefault();
          const input = e.target.querySelector('input[name="message"]');
          const text = input.value.trim();
          if (text && session.playerId) {
            window.sendMessage({
              type: 'chat',
              player_id: session.playerId,
              text: text
            });
            input.value = '';
          }
        }
      },
        createElement('input', {
          name: 'message',
          type: 'text',
          placeholder: 'Type a message...',
          maxlength: 200
        }),
        createElement('button', { type: 'submit' }, 'Send')
      )
    ),
    createElement('div', { className: 'actions' },
      createElement('button', {
        className: `ready-btn ${isReady ? 'ready' : 'not-ready'}`,
        onclick: () => {
          if (session.playerId) {
            window.sendMessage({
              type: 'ready',
              player_id: session.playerId
            });
          }
        },
        disabled: !websocket.connected
      }, isReady ? 'Cancel Ready' : 'Ready to Play'),
      createElement('p', { className: 'hint' }, 'Wait for at least 2 players to start the game.')
    )
  );
}
