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
