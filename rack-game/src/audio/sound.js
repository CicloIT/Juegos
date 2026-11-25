// Efectos de sonido sintetizados con Web Audio (sin archivos ni dependencias).
import { useGame } from '../game/store.js';

let ctx = null;
function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, { type = 'sine', vol = 0.15, slide = 0 } = {}) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

const SOUNDS = {
  click: () => tone(660, 0, 0.06, { type: 'triangle', vol: 0.08 }),
  pick: () => tone(520, 0, 0.08, { type: 'triangle', vol: 0.08, slide: 200 }),
  ok: () => {
    tone(880, 0, 0.09, { type: 'triangle', vol: 0.12 });
    tone(1320, 0.08, 0.14, { type: 'triangle', vol: 0.12 });
  },
  error: () => {
    tone(180, 0, 0.22, { type: 'sawtooth', vol: 0.08, slide: -60 });
    tone(140, 0.12, 0.25, { type: 'square', vol: 0.05 });
  },
  soft: () => tone(300, 0, 0.1, { type: 'sine', vol: 0.08 }),
  unplug: () => tone(500, 0, 0.12, { type: 'triangle', vol: 0.08, slide: -250 }),
  tick: () => tone(1000, 0, 0.04, { type: 'square', vol: 0.04 }),
  win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.28, { type: 'triangle', vol: 0.12 })),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.18, 0.3, { type: 'triangle', vol: 0.1 })),
};

export function sfx(name) {
  if (!useGame.getState().sound) return;
  try {
    SOUNDS[name]?.();
  } catch {
    /* audio no disponible */
  }
}
