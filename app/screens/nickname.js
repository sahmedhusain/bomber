import { createElement } from '../../framework/core.js';
import { createPlayer, upsertPlayer, uid } from '../../game/models.js';

export function NicknameScreen(state, store) {
  return createElement('section', { className: 'screen nickname' },
    createElement('div', { className: 'welcome-header' },
      createElement('h1', {}, '💣 Bomberman DOM'),
      createElement('p', { className: 'subtitle' }, 'Multiplayer Battle Arena')
    ),
    createElement('div', { className: 'card welcome-card' },
      createElement('h2', {}, 'Join the Battle'),
      createElement('p', { className: 'description' }, 'Enter your nickname to join up to 4 players in an explosive multiplayer battle!'),
      createElement('form', {
        onsubmit: (e) => {
          e.preventDefault();
          const form = e.target;
          const input = form.querySelector('input[name="nickname"]');
          const raw = input.value.trim();
          const nickname = raw.slice(0, 16);
          if (!nickname) {
            input.focus();
            return;
          }

          const playerId = uid('p_');
          const curr = store.getState();
          const player = createPlayer({ id: playerId, nickname, x: 0, y: 0 });

          // Send join message to server
          window.sendMessage({
            type: 'join',
            player_id: playerId,
            nickname: nickname
          });

          store.setState({
            ...upsertPlayer(curr, player),
            session: { ...curr.session, nickname, playerId, connected: true },
            route: '#/lobby'
          });
          window.location.hash = '#/lobby';
        }
      },
        createElement('label', { htmlFor: 'nickname-input' }, '👤 Nickname'),
        createElement('input', {
          id: 'nickname-input',
          name: 'nickname',
          type: 'text',
          placeholder: 'Enter your player name...',
          autofocus: true,
          maxlength: 16,
          required: true
        }),
        createElement('button', { type: 'submit', className: 'join-button' }, 
          '🚀 Join Game'
        )
      ),
      createElement('div', { className: 'game-features' },
        createElement('h3', {}, 'Game Features'),
        createElement('ul', { className: 'features-list' }, [
          createElement('li', {}, '🎮 2-4 Player Multiplayer'),
          createElement('li', {}, '💥 Real-time Bomb Battles'),
          createElement('li', {}, '⚡ Power-ups & Upgrades'),
          createElement('li', {}, '💬 Live Chat System')
        ])
      ),
      createElement('p', { className: 'hint' }, '✨ Nickname must be 1-16 characters long')
    )
  );
}
