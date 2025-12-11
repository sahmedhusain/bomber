import { createElement } from '../../framework/core.js';
import { createPlayer, upsertPlayer, uid } from '../../game/models.js';

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
  return createElement('section', { className: 'screen nickname' },
    createElement('div', { className: 'card welcome-card' },
      createElement('div', { className: 'title-icon' }, '▣'),
      createElement('h1', {}, 'Bomberman'),
      createElement('p', { className: 'subtitle' }, '« RETRO BATTLE ARENA »'),
      createElement('div', { className: 'card-divider' }),
      createElement('p', { className: 'description' }, 'Enter your nickname to join the battle. Up to 16 characters.'),
      createElement('form', { onsubmit: submitNickname(store) },
        createElement('label', { htmlFor: 'nickname-input' }, '◆ PLAYER NAME ◆'),
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
          'START GAME'
        )
      )
    )
  );
}
