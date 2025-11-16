import { createElement } from '../../framework/core.js';
import { createPlayer, upsertPlayer } from '../../game/models.js';

export function NicknameScreen(state, store) {
  return createElement('section', { className: 'screen nickname' },
    createElement('h1', {}, 'Bomberman DOM'),
    createElement('form', {
      onsubmit: (e) => {
        e.preventDefault();
        const form = e.target;
        const input = form.querySelector('input[name="nickname"]');
        const raw = input.value.trim();
        const nickname = raw.slice(0, 16);
        if (!nickname) return;
        const curr = store.getState();
        const player = createPlayer({ nickname, x: 0, y: 0 });
        store.setState({
          ...upsertPlayer(curr, player),
          session: { ...curr.session, nickname, playerId: player.id, connected: true },
          route: '#/lobby'
        });
        window.location.hash = '#/lobby';
      }
    },
      createElement('label', { htmlFor: 'nickname-input' }, 'Enter nickname:'),
      createElement('input', {
        id: 'nickname-input',
        name: 'nickname',
        type: 'text',
        placeholder: 'Player name',
        autofocus: true,
        maxlength: 16
      }),
      createElement('button', { type: 'submit' }, 'Join')
    ),
    createElement('p', { className: 'hint' }, 'Nickname max 16 chars. Local-only until multiplayer is enabled.')
  );
}
