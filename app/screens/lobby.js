import { createElement } from '../../framework/core.js';

export function LobbyScreen(state, store) {
  const { lobby, session, chat, websocket } = state;
  const players = lobby.players || [];
  const playerCount = players.length;
  const isReady = players.find(p => p.id === session.playerId)?.ready || false;
  const minPlayers = playerCount >= 2;

  return createElement('section', { className: 'screen lobby' },
    createElement('h2', {}, '🏟️ Game Lobby'),
    createElement('div', { className: 'connection-status' },
      websocket.connected ?
        createElement('span', { className: 'connected' }, '🟢 Connected to server') :
        createElement('span', { className: 'disconnected loading' }, '🔄 Connecting to server...')
    ),
    
    createElement('div', { className: 'two-column' },
      // Left column - Players
      createElement('div', { className: 'card players-card' },
        createElement('h3', {}, `👥 Players (${playerCount}/4)`),
        createElement('div', { className: 'progress-bar' },
          createElement('div', { 
            className: 'progress-fill',
            style: { width: `${(playerCount / 4) * 100}%` }
          })
        ),
        (() => {
          // Create combined array of existing players and empty slots
          const playerElements = players.map(player =>
            createElement('li', {
              className: `player-item ${player.ready ? 'ready' : 'waiting'} ${player.id === session.playerId ? 'self' : ''}`
            },
              createElement('div', { className: 'player-avatar' }, 
                player.nickname.charAt(0).toUpperCase()
              ),
              createElement('div', { className: 'player-info' },
                createElement('span', { className: 'player-nickname' }, player.nickname),
                createElement('span', { className: 'player-status' },
                  player.ready ? '✅ Ready' : '⏳ Waiting'
                ),
                player.id === session.playerId ? 
                  createElement('span', { className: 'you-badge' }, 'YOU') : null
              )
            )
          );
          
          const emptySlots = Array(4 - playerCount).fill(0).map((_, i) =>
            createElement('li', { className: 'player-item empty' },
              createElement('div', { className: 'player-avatar empty' }, '?'),
              createElement('div', { className: 'player-info' },
                createElement('span', { className: 'player-nickname' }, 'Waiting for player...'),
                createElement('span', { className: 'player-status' }, '💭 Empty slot')
              )
            )
          );
          
          return createElement('ul', { className: 'player-list' }, playerElements.concat(emptySlots));
        })(),
        createElement('div', { className: 'lobby-actions' },
          createElement('button', {
            className: `ready-btn ${isReady ? 'button-danger' : 'button-success'}`,
            onclick: () => {
              if (session.playerId) {
                window.sendMessage({
                  type: 'ready',
                  player_id: session.playerId
                });
              }
            },
            disabled: !websocket.connected
          }, isReady ? '❌ Cancel Ready' : '✅ Ready to Play')
        ),
        !minPlayers ? createElement('p', { className: 'hint' }, 
          '⚠️ Need at least 2 players to start the game'
        ) : null,
        createElement('p', { className: 'navigation-info' },
          '🔒 Navigation is restricted during the game - you will be moved automatically'
        )
      ),
      
      // Right column - Chat
      createElement('div', { className: 'card chat-card' },
        createElement('h3', {}, '💬 Chat'),
        createElement('div', { className: 'chat-container' },
          createElement('div', { 
            className: 'chat-messages',
            ref: (el) => {
              if (el && chat.length > 0) {
                setTimeout(() => el.scrollTop = el.scrollHeight, 0);
              }
            }
          },
            chat.length === 0 ? 
              createElement('div', { className: 'chat-empty' },
                createElement('p', {}, '👋 Say hello to other players!')
              ) :
              chat.map((msg, i) =>
                createElement('div', { 
                  className: `chat-message ${msg.player_id === session.playerId ? 'own' : 'other'}`,
                  key: `msg-${i}`
                },
                  createElement('div', { className: 'message-header' },
                    createElement('strong', { className: 'message-author' }, msg.nickname),
                    createElement('span', { className: 'message-time' }, 
                      new Date(msg.timestamp).toLocaleTimeString()
                    )
                  ),
                  createElement('div', { className: 'message-content' }, msg.text)
                )
              )
          ),
          createElement('form', {
            className: 'chat-form',
            onsubmit: (e) => {
              e.preventDefault();
              const input = e.target.querySelector('input[name="message"]');
              const text = input.value.trim();
              if (text && session.playerId && websocket.connected) {
                window.sendMessage({
                  type: 'chat',
                  player_id: session.playerId,
                  text: text
                });
                input.value = '';
                input.focus();
              } else if (!websocket.connected) {
                console.warn('Cannot send message: not connected to server');
              }
            }
          },
            createElement('div', { className: 'chat-input-group' },
              createElement('input', {
                name: 'message',
                type: 'text',
                placeholder: websocket.connected ? 'Type your message...' : 'Connecting to server...',
                maxlength: 200,
                disabled: !websocket.connected,
                onkeydown: (e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.target.form.dispatchEvent(new Event('submit'));
                  }
                }
              }),
              createElement('button', { 
                type: 'submit',
                className: `chat-send-btn ${!websocket.connected ? 'disabled' : ''}`,
                disabled: !websocket.connected,
                title: websocket.connected ? 'Send message' : 'Connecting...'
              }, websocket.connected ? '📤' : '⏳')
            )
          )
        )
      )
    ),
    
    // Countdown overlay (only show if in lobby and countdown is active)
    (lobby.countdown.phase === 'pre-start' && state.route === '#/lobby') ?
      createElement('div', { className: 'countdown-overlay' },
        createElement('div', { className: 'countdown-card' },
          createElement('h2', {}, '🚀 Game Starting!'),
          createElement('div', { className: 'countdown-timer' }, 
            Math.ceil(lobby.countdown.remainingMs / 1000)
          ),
          createElement('p', {}, 'Get ready to battle!')
        )
      ) : null
  );
}
