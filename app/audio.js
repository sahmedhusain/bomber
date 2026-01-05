let audioCtx = null;

export const playCountdownBeep = (remaining) => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Resume context if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const isLastSecond = remaining === 0;

    // Retro square wave for 8-bit feel
    osc.type = 'square';

    if (isLastSecond) {
      // "GO!" sound: Higher pitch, sliding up
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.3);
    } else {
      // Countdown tick: Lower pitch, short blip
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.1);
    }
  } catch (e) {
    console.error('Audio playback failed', e);
  }
};

// Bomb placement sound - Deep "thud" with metallic click
export const playBombPlaceSound = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Deep thud
    const thud = audioCtx.createOscillator();
    const thudGain = audioCtx.createGain();
    thud.connect(thudGain);
    thudGain.connect(audioCtx.destination);
    thud.type = 'sine';
    thud.frequency.setValueAtTime(120, audioCtx.currentTime);
    thud.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.1);
    thudGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    thudGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    thud.start(audioCtx.currentTime);
    thud.stop(audioCtx.currentTime + 0.1);

    // Metallic click
    const click = audioCtx.createOscillator();
    const clickGain = audioCtx.createGain();
    click.connect(clickGain);
    clickGain.connect(audioCtx.destination);
    click.type = 'square';
    click.frequency.setValueAtTime(1800, audioCtx.currentTime + 0.05);
    click.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.08);
    clickGain.gain.setValueAtTime(0.08, audioCtx.currentTime + 0.05);
    clickGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    click.start(audioCtx.currentTime + 0.05);
    click.stop(audioCtx.currentTime + 0.08);
  } catch (e) {
    console.error('Bomb place sound failed', e);
  }
};

// Bomb ticking sound - Urgent beeping as it's about to explode
export const playBombTickSound = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const beep = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    beep.connect(gain);
    gain.connect(audioCtx.destination);
    beep.type = 'square';
    beep.frequency.setValueAtTime(800, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    beep.start(audioCtx.currentTime);
    beep.stop(audioCtx.currentTime + 0.05);
  } catch (e) {
    console.error('Bomb tick sound failed', e);
  }
};

// Bomb explosion sound - Big boom with rumble
export const playExplosionSound = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Initial blast - white noise burst
    const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.3, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = audioCtx.createGain();
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1200, audioCtx.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.3);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noiseGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    noise.start(audioCtx.currentTime);
    noise.stop(audioCtx.currentTime + 0.3);

    // Deep rumble
    const rumble = audioCtx.createOscillator();
    const rumbleGain = audioCtx.createGain();
    rumble.connect(rumbleGain);
    rumbleGain.connect(audioCtx.destination);
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(80, audioCtx.currentTime);
    rumble.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.4);
    rumbleGain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    rumble.start(audioCtx.currentTime);
    rumble.stop(audioCtx.currentTime + 0.4);

    // High-frequency crack
    const crack = audioCtx.createOscillator();
    const crackGain = audioCtx.createGain();
    crack.connect(crackGain);
    crackGain.connect(audioCtx.destination);
    crack.type = 'sawtooth';
    crack.frequency.setValueAtTime(2000, audioCtx.currentTime);
    crack.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.15);
    crackGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    crackGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    crack.start(audioCtx.currentTime);
    crack.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    console.error('Explosion sound failed', e);
  }
};
