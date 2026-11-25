import { create } from 'zustand';
import { validateConnection, computeConnectivity, compatibleTargets, explainWrong } from './rules.js';
import { levelById } from './levels.js';
import { MEDIUM, PORT_BY_ID, portsFor } from './network.js';
import { liveScore, finalScore } from './score.js';
import { sfx } from '../audio/sound.js';

let linkSeq = 1;
const mkLink = (a, b, medium, ok, key = null) => ({ id: `L${linkSeq++}`, a, b, medium, ok, key });

// Topología completa (para el menú y el modo aprendizaje)
export const FULL_TOPOLOGY = () => [
  mkLink('odf-in', 'ont-pon', MEDIUM.FIBER, true, 'fiber'),
  mkLink('ont-lan', 'rt-wan', MEDIUM.ETH, true, 'ont-router'),
  mkLink('rt-lan1', 'sw-1', MEDIUM.ETH, true, 'router-switch'),
  mkLink('sw-2', 'pp-1', MEDIUM.ETH, true, 'sector-aula1'),
  mkLink('sw-3', 'pp-2', MEDIUM.ETH, true, 'sector-aula2'),
  mkLink('sw-4', 'pp-3', MEDIUM.ETH, true, 'sector-lab'),
  mkLink('sw-5', 'pp-4', MEDIUM.ETH, true, 'sector-biblio'),
  mkLink('sw-6', 'pp-5', MEDIUM.ETH, true, 'sector-admin'),
  mkLink('sw-8', 'ap-eth', MEDIUM.ETH, true, 'sector-patio'),
];

const loadPref = (k, d) => {
  try {
    const v = localStorage.getItem('rack.' + k);
    return v === null ? d : JSON.parse(v);
  } catch {
    return d;
  }
};
const savePref = (k, v) => {
  try {
    localStorage.setItem('rack.' + k, JSON.stringify(v));
  } catch {
    /* sin almacenamiento */
  }
};

const derive = (links) => computeConnectivity(links);

// Avance de la instalación según el nivel
export function progressOf(links, level) {
  const done = new Set(links.filter((l) => l.ok).map((l) => l.key));
  const correct = level.required.filter((r) => done.has(r.key)).length;
  const wrong = links.filter((l) => !l.ok).length;
  return { correct, wrong, completed: correct === level.required.length && wrong === 0 };
}

export const useGame = create((set, get) => ({
  // navegación
  screen: 'menu', // menu | learn | game
  modal: null, // howto | credits | quit | null

  // preferencias
  sound: loadPref('sound', true),
  quality: loadPref('quality', 'low'), // low | high
  showFps: loadPref('fps', false),

  // partida
  level: levelById(1),
  status: 'idle', // idle | guide | playing | won | lost
  timeLeft: 0,
  links: FULL_TOPOLOGY(),
  net: derive(FULL_TOPOLOGY()),
  cable: MEDIUM.ETH,
  helps: true,
  errors: 0,
  correct: 0,
  wrong: 0,
  fixed: 0,
  score: 0,
  finalScore: 0,
  toast: null, // {kind:'error'|'ok'|'info', title, text, hint, id}
  flash: null, // {ports:[], type:'error'|'ok', at}
  highlightPorts: [], // puertos sugeridos tras un error
  focusDevice: null, // resaltar un equipo desde el panel izquierdo
  shake: 0,

  // aprendizaje
  learnSel: null,

  // ---------- navegación ----------
  goMenu: () => {
    const links = FULL_TOPOLOGY();
    set({ screen: 'menu', modal: null, level: levelById(1), status: 'idle', links, net: derive(links), toast: null, learnSel: null, focusDevice: null, highlightPorts: [] });
  },
  goLearn: () => {
    const links = FULL_TOPOLOGY();
    set({ screen: 'learn', modal: null, level: levelById(1), status: 'idle', links, net: derive(links), toast: null, learnSel: 'rack' });
  },
  openModal: (m) => set({ modal: m }),
  closeModal: () => set({ modal: null }),

  setSound: (v) => {
    savePref('sound', v);
    set({ sound: v });
  },
  setQuality: (v) => {
    savePref('quality', v);
    set({ quality: v });
  },
  setShowFps: (v) => {
    savePref('fps', v);
    set({ showFps: v });
  },
  setLearnSel: (id) => set({ learnSel: id }),
  setFocusDevice: (id) => set({ focusDevice: id }),

  // ---------- juego ----------
  startGame: (levelId = 1) => {
    const level = levelById(levelId);
    const links = level.prewired.map((l) => mkLink(l.a, l.b, l.medium, l.ok, l.key || null));
    const pr = progressOf(links, level);
    set({
      screen: 'game',
      modal: null,
      level,
      status: 'guide',
      timeLeft: level.time,
      links,
      net: derive(links),
      cable: MEDIUM.ETH,
      helps: level.helpsDefault,
      errors: 0,
      correct: pr.correct,
      wrong: pr.wrong,
      fixed: 0,
      score: liveScore(pr.correct, 0),
      finalScore: 0,
      toast: null,
      flash: null,
      highlightPorts: [],
      focusDevice: null,
    });
  },
  beginPlaying: () => set({ status: 'playing' }),
  setCable: (c) => set({ cable: c }),
  setHelps: (v) => set({ helps: v && get().level.helpsAllowed }),
  dismissToast: () => set({ toast: null, highlightPorts: [] }),

  tick: (dt) => {
    const s = get();
    if (s.status !== 'playing' || s.modal) return;
    const prev = s.timeLeft;
    const t = Math.max(0, prev - dt);
    if (Math.ceil(t) !== Math.ceil(prev) && t <= 10 && t > 0) sfx('tick');
    if (t <= 0) {
      sfx('lose');
      set({ timeLeft: 0, status: 'lost', finalScore: finalScore({ correct: s.correct, errors: s.errors, fixed: s.fixed, timeLeft: 0, completed: false }) });
    } else set({ timeLeft: t });
  },

  tryConnect: (a, b) => {
    const s = get();
    if (s.status !== 'playing') return;
    const res = validateConnection(a, b, s.cable, s.links);
    if (res.kind === 'noop') return;
    if (!res.ok) {
      const errors = res.counts ? s.errors + 1 : s.errors;
      sfx(res.counts ? 'error' : 'soft');
      set({
        errors,
        score: liveScore(s.correct, errors, s.fixed),
        flash: { ports: [a, b], type: 'error', at: performance.now() },
        shake: res.counts ? performance.now() : s.shake,
        toast: {
          kind: 'error',
          id: performance.now(),
          title: res.title,
          // sin ayudas no se explica el error (los avisos de puerto ocupado sí se muestran)
          text: s.helps || !res.counts ? res.text : 'Esa conexión no es correcta.',
          hint: s.helps || !res.counts ? res.hint : null,
        },
        highlightPorts: s.helps ? suggestPorts(a, b, s) : [],
      });
      return;
    }
    const links = [...s.links, mkLink(a, b, s.cable, true, res.key)];
    const net = derive(links);
    const { correct, wrong, completed } = progressOf(links, s.level);
    sfx(completed ? 'win' : 'ok');
    const patch = {
      links,
      net,
      correct,
      wrong,
      score: liveScore(correct, s.errors, s.fixed),
      flash: { ports: [a, b], type: 'ok', at: performance.now() },
      toast: s.toast?.kind === 'error' ? null : s.toast,
      highlightPorts: [],
    };
    if (completed) {
      patch.status = 'won';
      patch.finalScore = finalScore({ correct, errors: s.errors, fixed: s.fixed, timeLeft: s.timeLeft, completed: true });
    }
    set(patch);
  },

  removeLink: (id) => {
    const s = get();
    if (s.status !== 'playing') return;
    const removed = s.links.find((l) => l.id === id);
    const links = s.links.filter((l) => l.id !== id);
    const { correct, wrong, completed } = progressOf(links, s.level);
    const fixed = removed && !removed.ok ? s.fixed + 1 : s.fixed;
    let toast = { kind: 'info', id: performance.now(), title: 'Cable desconectado', text: 'Podés volver a conectarlo donde corresponda.' };
    if (removed && !removed.ok) {
      // se encontró un cable mal conectado: explicamos por qué estaba mal
      const [title, text] = explainWrong(removed.a, removed.b);
      toast = { kind: 'ok', id: performance.now(), title: `¡Bien visto! ${title}`, text };
    }
    sfx(removed && !removed.ok ? 'ok' : 'unplug');
    const patch = { links, net: derive(links), correct, wrong, fixed, score: liveScore(correct, s.errors, fixed), toast };
    if (completed) {
      patch.status = 'won';
      patch.toast = null;
      patch.finalScore = finalScore({ correct, errors: s.errors, fixed, timeLeft: s.timeLeft, completed: true });
      sfx('win');
    }
    set(patch);
  },

  occupiedPortTap: () => {
    const s = get();
    sfx('soft');
    set({ toast: { kind: 'info', id: performance.now(), title: 'Puerto ocupado', text: 'Ese puerto ya tiene un cable. Tocá el cable para desconectarlo.' } });
  },
}));

// Puertos a resaltar como "correctos" después de un error
function suggestPorts(a, b, s) {
  // Preferimos el puerto de origen del arrastre (a)
  for (const from of [a, b]) {
    const pt = PORT_BY_ID[from];
    const cable = pt.medium;
    const targets = compatibleTargets(from, cable, s.links, portsFor(s.level));
    if (targets.length) return [from, ...targets];
  }
  return [];
}

if (import.meta.env.DEV) window.__game = useGame;
