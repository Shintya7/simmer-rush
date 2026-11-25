// audio.js — every sound in Simmer Rush is a WebAudio oscillator or a short
// burst of generated noise. No audio files, no network, nothing to load.
// The context is created on the first user gesture, so browsers allow it.
let audioContext = null;
let noiseBuffer = null;

export function unlockAudio() {
  try {
    if (!audioContext) {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctor) return;
      audioContext = new Ctor();
      const length = Math.floor(audioContext.sampleRate * 0.12);
      noiseBuffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (audioContext.state === 'suspended') void audioContext.resume();
  } catch {
    audioContext = null;
  }
}

function tone(freq, duration, type, volume, delay = 0, slideTo = null) {
  if (!audioContext) return;
  try {
    const start = audioContext.currentTime + delay;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  } catch {
    // Sound is garnish: a failed beep must never break the game.
  }
}

function noiseBurst(duration, volume) {
  if (!audioContext || !noiseBuffer) return;
  try {
    const start = audioContext.currentTime;
    const source = audioContext.createBufferSource();
    source.buffer = noiseBuffer;
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(gain).connect(audioContext.destination);
    source.start(start);
    source.stop(start + duration + 0.02);
  } catch {
    // Sound is garnish: a failed burst must never break the game.
  }
}

export function sfxPickup() {
  tone(520, 0.07, 'triangle', 0.1);
}

export function sfxPlace() {
  tone(300, 0.06, 'triangle', 0.09);
}

export function sfxChop() {
  noiseBurst(0.05, 0.16);
  tone(180, 0.05, 'square', 0.05);
}

export function sfxCookReady() {
  tone(880, 0.12, 'sine', 0.12);
  tone(1174, 0.16, 'sine', 0.1, 0.1);
}

export function sfxServe() {
  tone(660, 0.1, 'triangle', 0.12);
  tone(880, 0.14, 'triangle', 0.12, 0.09);
  tone(1320, 0.2, 'sine', 0.1, 0.18);
}

export function sfxFail() {
  tone(180, 0.28, 'sawtooth', 0.09, 0, 110);
}

export function sfxTick() {
  tone(1200, 0.04, 'square', 0.045);
}

export function sfxClick() {
  tone(440, 0.05, 'triangle', 0.08);
}

export function sfxSizzle() {
  noiseBurst(0.09, 0.045);
}

export function sfxStart() {
  tone(523, 0.1, 'triangle', 0.11);
  tone(659, 0.1, 'triangle', 0.11, 0.09);
  tone(784, 0.18, 'triangle', 0.12, 0.18);
}

// A short rising chirp when a fresh ticket lands on the order board.
export function sfxNewTicket() {
  tone(740, 0.08, 'sine', 0.09);
  tone(988, 0.12, 'sine', 0.09, 0.08);
}
