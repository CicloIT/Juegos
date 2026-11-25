import { create } from 'zustand';
import { levelById } from './levels.js';
import { SCHOOL_L1, SCHOOL_LEARN } from './maps.js';
import { DEVICE_TYPES } from './devices.js';
import { buildBlockers, computeCoverage } from './signal.js';
import { computeLinks } from './network.js';
import { adviceFor, overlappingPairs } from './advice.js';
import { computeScore } from './score.js';
import { sfx } from '../audio/sound.js';

let seq = 1;
const mkDev = (type, x, y) => ({ id: `${type}-${seq++}`, type, x, y });

const LEARN_LIMITS = { ontRouter: 99, routerSwitch: 99, switchAp: 99 };

// Escenarios de demostración del modo aprendizaje (posiciones en metros)
export const LEARN_DEMOS = {
  router: { map: SCHOOL_L1, devices: [['router', 20, 4]] },
  ap: { map: SCHOOL_L1, devices: [['router', 20, 4], ['switch', 19, 4.5], ['ap', 8, 7]] },
  switch: { map: SCHOOL_L1, devices: [['router', 20, 4], ['switch', 19, 4.5], ['ap', 5, 7], ['ap', 13, 7], ['apOut', 12, 17]] },
  eth: { map: SCHOOL_L1, devices: [['router', 20, 4], ['switch', 19, 4.5], ['ap', 5, 7], ['ap', 13, 7]] },
  fiber: { map: SCHOOL_L1, devices: [['router', 20, 3]] },
  coverage: { map: SCHOOL_L1, devices: [['ap', 12, 7]] },
  interference: { map: SCHOOL_LEARN, devices: [['ap', 19, 10.5]] },
  walls: { map: SCHOOL_L1, devices: [['ap', 11.5, 11]] },
};

const loadPref = (k, d) => {
  try {
    const v = localStorage.getItem('senal.' + k);
    return v === null ? d : JSON.parse(v);
  } catch {
    return d;
  }
};
const savePref = (k, v) => {
  try {
    localStorage.setItem('senal.' + k, JSON.stringify(v));
  } catch {
    /* sin almacenamiento */
  }
};

const clampPos = (map, x, y) => ({
  x: Math.round(Math.min(map.width - 0.5, Math.max(0.5, x)) * 4) / 4,
  y: Math.round(Math.min(map.depth - 0.5, Math.max(0.5, y)) * 4) / 4,
});

function evaluate(s, devices) {
  const learn = s.screen !== 'game';
  const limits = learn ? LEARN_LIMITS : s.level.limits;
  const links = computeLinks(s.map, devices, limits);
  const tx = devices.filter((d) => DEVICE_TYPES[d.type].wifi && (learn || links.active.has(d.id)));
  const coverage = computeCoverage(s.map, s.blockers, tx, learn ? 0.8 : s.level.minCoverage);
  return { links, coverage };
}

function stats(s, placed, coverage) {
  const required = s.map.rooms.filter((r) => !r.notRequired);
  const sectorsOk = required.filter((r) => coverage.sectors[r.id].pct >= s.level.minCoverage).length;
  const overlaps = overlappingPairs(placed);
  return { sectorsOk, sectorsTotal: required.length, overlaps };
}

const blockersL1 = buildBlockers(SCHOOL_L1);

export const useGame = create((set, get) => ({
  screen: 'menu', // menu | learn | game
  modal: null,
  sound: loadPref('sound', true),
  quality: loadPref('quality', 'low'),
  showFps: loadPref('fps', false),

  level: levelById(1),
  map: SCHOOL_L1,
  blockers: blockersL1,
  status: 'idle', // idle | guide | playing | won | lost
  timeLeft: 0,
  placed: [],
  selected: null,
  armed: null, // tipo elegido para colocar con un toque
  drag: null, // {kind:'new'|'move', type, id, x, y}
  links: computeLinks(SCHOOL_L1, [], LEARN_LIMITS),
  coverage: computeCoverage(SCHOOL_L1, blockersL1, []),
  helps: true,
  showHeatmap: true,
  toast: null,
  adjustments: 0, // consejos de ubicación recibidos
  score: 0,
  sectorsOk: 0,
  sectorsTotal: 7,
  overlaps: 0,
  finalScore: 0,
  usedTime: 0,
  learnSel: 'coverage',
  celebrateAt: 0,

  // ---------- navegación ----------
  goMenu: () => {
    const s = get();
    const placed = [mkDev('router', 20, 4), mkDev('switch', 19, 4.5), mkDev('ap', 5, 7), mkDev('ap', 13, 7), mkDev('apOut', 12, 17)];
    const base = { ...s, screen: 'menu', map: SCHOOL_L1, blockers: blockersL1, level: levelById(1) };
    set({ screen: 'menu', modal: null, level: levelById(1), status: 'idle', placed, map: SCHOOL_L1, blockers: blockersL1, selected: null, armed: null, drag: null, toast: null, ...evaluate(base, placed) });
  },
  goLearn: () => {
    set({ screen: 'learn', modal: null, level: levelById(1), status: 'idle', toast: null, selected: null });
    get().setLearnSel(get().learnSel || 'coverage');
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
  setHelps: (v) => set({ helps: v && get().level.helpsAllowed }),
  setShowHeatmap: (v) => set({ showHeatmap: v }),

  setLearnSel: (id) => {
    const demo = LEARN_DEMOS[id] || LEARN_DEMOS.coverage;
    const placed = demo.devices.map(([t, x, y]) => mkDev(t, x, y));
    const blockers = demo.map === SCHOOL_L1 ? blockersL1 : buildBlockers(demo.map);
    const base = { ...get(), map: demo.map, blockers, screen: 'learn' };
    set({ learnSel: id, placed, map: demo.map, blockers, selected: null, ...evaluate(base, placed) });
  },

  // ---------- partida ----------
  startGame: (levelId = 1) => {
    const level = levelById(levelId);
    const blockers = level.map === SCHOOL_L1 ? blockersL1 : buildBlockers(level.map);
    const base = { ...get(), screen: 'game', level, map: level.map, blockers };
    const ev = evaluate(base, []);
    set({
      screen: 'game',
      modal: null,
      level,
      map: level.map,
      blockers,
      status: 'guide',
      timeLeft: level.time,
      placed: [],
      selected: null,
      armed: null,
      drag: null,
      helps: level.helpsDefault,
      showHeatmap: true,
      toast: null,
      adjustments: 0,
      finalScore: 0,
      usedTime: 0,
      ...ev,
      ...stats(base, [], ev.coverage),
      score: 0,
    });
  },
  beginPlaying: () => set({ status: 'playing' }),

  tick: (dt) => {
    const s = get();
    if (s.status !== 'playing' || s.modal) return;
    const prev = s.timeLeft;
    const t = Math.max(0, prev - dt);
    if (Math.ceil(t) !== Math.ceil(prev) && t <= 10 && t > 0) sfx('tick');
    if (t <= 0) {
      sfx('lose');
      set({ timeLeft: 0, status: 'lost', usedTime: s.level.time, drag: null, armed: null, finalScore: s.score });
    } else set({ timeLeft: t });
  },

  remaining: (type) => {
    const s = get();
    return (s.level.budget[type] || 0) - s.placed.filter((d) => d.type === type).length;
  },

  canEdit: () => {
    const s = get();
    return s.screen === 'learn' || (s.screen === 'game' && s.status === 'playing');
  },

  arm: (type) => {
    const s = get();
    if (!s.canEdit()) return;
    sfx('click');
    set({ armed: s.armed === type ? null : type, selected: null });
  },
  select: (id) => set({ selected: id, armed: null }),

  // --- arrastre (nuevo equipo desde el inventario o mover uno existente) ---
  beginDrag: (drag) => {
    const s = get();
    if (!s.canEdit()) return;
    if (drag.kind === 'new' && s.remaining(drag.type) <= 0) {
      sfx('soft');
      set({ toast: { kind: 'info', id: performance.now(), title: 'Sin equipos de ese tipo', text: 'Ya usaste todos. Podés mover o retirar los que colocaste.' } });
      return;
    }
    sfx('pick');
    set({ drag: { ...drag, x: drag.x ?? null, y: drag.y ?? null }, selected: drag.kind === 'move' ? drag.id : null, armed: null });
  },
  updateDrag: (x, y) => {
    const s = get();
    if (!s.drag) return;
    const p = clampPos(s.map, x, y);
    if (p.x === s.drag.x && p.y === s.drag.y) return;
    const drag = { ...s.drag, ...p };
    // vista previa de cobertura en vivo
    const devices = previewDevices(s.placed, drag);
    set({ drag, ...evaluate(s, devices) });
  },
  endDrag: (result) => {
    // result: 'drop' | 'remove' | 'cancel'
    const s = get();
    const d = s.drag;
    if (!d) return;
    if (result === 'drop' && d.x != null) {
      if (d.kind === 'new') get().placeAt(d.type, d.x, d.y, true);
      else get().moveDevice(d.id, d.x, d.y);
    } else if (result === 'remove' && d.kind === 'move') {
      get().removeDevice(d.id);
    } else {
      set({ drag: null, ...evaluate(s, s.placed) });
    }
  },

  placeAt: (type, x, y) => {
    const s = get();
    if (!s.canEdit() || s.remaining(type) <= 0 && s.screen === 'game') return set({ drag: null });
    const p = clampPos(s.map, x, y);
    const dev = mkDev(type, p.x, p.y);
    get().commit([...s.placed, dev], dev);
  },
  moveDevice: (id, x, y) => {
    const s = get();
    const p = clampPos(s.map, x, y);
    const placed = s.placed.map((d) => (d.id === id ? { ...d, ...p } : d));
    get().commit(placed, placed.find((d) => d.id === id));
  },
  removeDevice: (id) => {
    const s = get();
    sfx('unplug');
    const placed = s.placed.filter((d) => d.id !== id);
    const ev = evaluate(s, placed);
    set({ placed, drag: null, selected: null, ...ev, ...stats(s, placed, ev.coverage), score: liveScore(s, placed, ev.coverage), toast: { kind: 'info', id: performance.now(), title: 'Equipo retirado', text: 'Volvió al inventario.' } });
  },

  // aplica un cambio, calcula cobertura, consejo y victoria
  commit: (placed, device) => {
    const s = get();
    const ev = evaluate(s, placed);
    const st = stats(s, placed, ev.coverage);
    const patch = { placed, drag: null, armed: null, selected: device?.id ?? null, ...ev, ...st };
    if (s.screen !== 'game') {
      set(patch);
      return;
    }
    patch.score = liveScore(s, placed, ev.coverage);
    let toast = null;
    if (device) {
      const adv = adviceFor({ device, map: s.map, placed, links: ev.links, coverage: ev.coverage, blockers: s.blockers, level: s.level });
      if (adv) {
        if (adv.kind === 'warn') patch.adjustments = s.adjustments + 1;
        toast = s.helps || adv.kind !== 'info'
          ? { ...adv, id: performance.now(), text: s.helps ? adv.text : adv.title, hint: s.helps ? adv.hint : null }
          : null;
        sfx(adv.kind === 'warn' ? 'error' : 'place');
      } else sfx('place');
    }
    patch.toast = toast;
    if (st.sectorsOk === st.sectorsTotal) {
      const used = placed.length;
      const wifiBudget = ['router', 'ap', 'apOut'].reduce((a, t) => a + (s.level.budget[t] || 0), 0);
      const wifiUsed = placed.filter((d) => DEVICE_TYPES[d.type].wifi).length;
      patch.status = 'won';
      patch.toast = null;
      patch.selected = null;
      patch.usedTime = s.level.time - s.timeLeft;
      patch.equipmentUsed = used;
      patch.finalScore = computeScore({ totalPct: ev.coverage.totalPct, sectorsOk: st.sectorsOk, overlaps: st.overlaps, unusedWifi: wifiBudget - wifiUsed, timeLeft: s.timeLeft, completed: true });
      patch.celebrateAt = performance.now();
      sfx('win');
    }
    set(patch);
  },

  dismissToast: () => set({ toast: null }),
}));

function liveScore(s, placed, coverage) {
  const st = stats(s, placed, coverage);
  return computeScore({ totalPct: coverage.totalPct, sectorsOk: st.sectorsOk, overlaps: st.overlaps });
}

export function previewDevices(placed, drag) {
  if (!drag || drag.x == null) return placed;
  if (drag.kind === 'move') return placed.map((d) => (d.id === drag.id ? { ...d, x: drag.x, y: drag.y } : d));
  return [...placed, { id: 'ghost', type: drag.type, x: drag.x, y: drag.y }];
}

if (import.meta.env.DEV) window.__game = useGame;
