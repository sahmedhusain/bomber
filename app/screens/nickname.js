import { createElement } from '../../framework/core.js';
import { createPlayer, upsertPlayer, uid } from '../../game/models.js';
import { getIconSVG } from '../icons/iconComponent.js';

const icon = (name, className = '') => createElement('span', {
  className: `icon-wrapper ${className}`.trim(),
  innerHTML: getIconSVG(name)
});

const playCoinSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const clink = audioCtx.createOscillator();
    const clinkGain = audioCtx.createGain();
    clink.connect(clinkGain);
    clinkGain.connect(audioCtx.destination);
    clink.frequency.setValueAtTime(2500, audioCtx.currentTime);
    clink.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.03);
    clink.type = 'square';
    clinkGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    clinkGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    clink.start(audioCtx.currentTime);
    clink.stop(audioCtx.currentTime + 0.05);

    const bounce1 = audioCtx.createOscillator();
    const bounce1Gain = audioCtx.createGain();
    bounce1.connect(bounce1Gain);
    bounce1Gain.connect(audioCtx.destination);
    bounce1.frequency.setValueAtTime(1400, audioCtx.currentTime + 0.06);
    bounce1.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
    bounce1.type = 'square';
    bounce1Gain.gain.setValueAtTime(0.12, audioCtx.currentTime + 0.06);
    bounce1Gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    bounce1.start(audioCtx.currentTime + 0.06);
    bounce1.stop(audioCtx.currentTime + 0.1);

    const bounce2 = audioCtx.createOscillator();
    const bounce2Gain = audioCtx.createGain();
    bounce2.connect(bounce2Gain);
    bounce2Gain.connect(audioCtx.destination);
    bounce2.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.12);
    bounce2.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.16);
    bounce2.type = 'square';
    bounce2Gain.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.12);
    bounce2Gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.16);
    bounce2.start(audioCtx.currentTime + 0.12);
    bounce2.stop(audioCtx.currentTime + 0.16);

    const settle = audioCtx.createOscillator();
    const settleGain = audioCtx.createGain();
    settle.connect(settleGain);
    settleGain.connect(audioCtx.destination);
    settle.frequency.setValueAtTime(600, audioCtx.currentTime + 0.18);
    settle.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.25);
    settle.type = 'triangle';
    settleGain.gain.setValueAtTime(0.08, audioCtx.currentTime + 0.18);
    settleGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    settle.start(audioCtx.currentTime + 0.18);
    settle.stop(audioCtx.currentTime + 0.25);

  } catch (e) {
    console.log('Audio not supported');
  }
};

const showCoinInsertedPopup = (store, callback) => {
  const curr = store.getState();
  store.setState({ ...curr, ui: { ...(curr.ui || {}), coinInserted: true } });

  playCoinSound();

  setTimeout(() => {
    const state = store.getState();
    store.setState({ ...state, ui: { ...(state.ui || {}), coinInserted: false } });
    callback();
  }, 1200);
};

const submitNickname = (store) => (e) => {
  e.preventDefault();
  const input = e.target.querySelector('input[name="nickname"]');
  const nickname = input.value.trim().slice(0, 16);
  if (!nickname) return input.focus();

  const playerId = uid('p_');
  const curr = store.getState();
  const player = createPlayer({ id: playerId, nickname, x: 0, y: 0 });

  showCoinInsertedPopup(store, () => {
    window.sendMessage({ type: 'join', player_id: playerId, nickname });
    store.setState({
      ...upsertPlayer(store.getState(), player),
      session: { ...store.getState().session, nickname, playerId, connected: true },
      route: '#/lobby'
    });
    window.location.hash = '#/lobby';
  });
};

export function NicknameScreen(state, store) {
  const showCoinPopup = state.ui?.coinInserted;

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
          createElement('span', {}, 'JOIN GAME')
        )
      )
    ),

    showCoinPopup ? createElement('div', { className: 'coin-inserted-overlay' },
      createElement('div', { className: 'coin-inserted-card' },
        createElement('div', { className: 'coin-icon-wrapper' }, icon('coin')),
        createElement('h2', { className: 'coin-inserted-title' }, 'COIN INSERTED'),
        createElement('p', { className: 'coin-inserted-subtitle' }, 'GET READY TO PLAY!')
      )
    ) : null
  );
}
