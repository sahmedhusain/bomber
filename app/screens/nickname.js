import { createElement } from '../../framework/core.js';
import { createPlayer, upsertPlayer, uid } from '../../game/models.js';
import { getIconSVG } from '../icons/iconComponent.js';

// Helper to create icon element
const icon = (name, className = '') => createElement('span', {
  className: `icon-wrapper ${className}`.trim(),
  innerHTML: getIconSVG(name)
});

const submitNickname = (store) => (e) => {
  e.preventDefault();
  const input = e.target.querySelector('input[name="nickname"]');
  const nickname = input.value.trim().slice(0, 16);
  if (!nickname) return input.focus();

  const playerId = uid('p_');
  const curr = store.getState();
  const player = createPlayer({ id: playerId, nickname, x: 0, y: 0 });

  window.sendMessage({ type: 'join', player_id: playerId, nickname });
  store.setState({
    ...upsertPlayer(curr, player),
    session: { ...curr.session, nickname, playerId, connected: true },
    route: '#/lobby'
  });
  window.location.hash = '#/lobby';
};

export function NicknameScreen(state, store) {
  return createElement('section', { className: 'screen nickname', key: 'screen-nickname' },
    createElement('div', { className: 'card welcome-card' },
      createElement('div', { className: 'title-icon hero-icon' }, icon('bomb')),
      createElement('h1', {}, 'Bomberman'),
      createElement('p', { className: 'subtitle icon-text' },
        icon('gamepad'),
        createElement('span', {}, 'RETRO BATTLE ARENA'),
        icon('gamepad')
      ),
      createElement('div', { className: 'card-divider' }),
      createElement('p', { className: 'description' }, 'Enter your nickname to join the battle. Up to 16 characters.'),
      createElement('form', { onsubmit: submitNickname(store) },
        createElement('label', { htmlFor: 'nickname-input', className: 'icon-text' },
          icon('gamepad'),
          createElement('span', {}, 'PLAYER NAME'),
          icon('gamepad')
        ),
        createElement('input', {
          id: 'nickname-input',
          name: 'nickname',
          type: 'text',
          placeholder: 'TYPE YOUR NAME...',
          autofocus: true,
          maxlength: 16,
          required: true
        }),
        createElement('button', { type: 'submit', className: 'join-button' },
          icon('arrowRight'),
          createElement('span', {}, 'START GAME')
        )
      )
    )
  );
}
