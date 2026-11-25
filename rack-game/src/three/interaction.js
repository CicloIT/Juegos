// Estado de interacción de alta frecuencia (arrastre de cables, cámara).
// Separado del store del juego para no re-renderizar la UI en cada movimiento.
import { create } from 'zustand';
import * as THREE from 'three';
import { useGame } from '../game/store.js';
import { compatibleTargets } from '../game/rules.js';
import { PORT_BY_ID, portsFor } from '../game/network.js';
import { sfx } from '../audio/sound.js';

export const pointerWorld = new THREE.Vector3(); // punto bajo el puntero en el plano de los cables

export const useInteraction = create((set, get) => ({
  from: null, // puerto de origen del cable en curso
  dragging: false, // true si el puntero está apretado
  targets: [], // puertos compatibles (para ayudas)
  hover: null,
  zoom: 1,
  pan: [0, 0],

  setHover: (id) => set({ hover: id }),
  setZoom: (z) => set({ zoom: Math.min(2.2, Math.max(1, z)) }),
  setPan: (p) => set({ pan: p }),
  resetView: () => set({ zoom: 1, pan: [0, 0] }),

  start: (portId) => {
    const g = useGame.getState();
    const targets = compatibleTargets(portId, g.cable, g.links, portsFor(g.level));
    sfx('pick');
    set({ from: portId, dragging: true, targets });
  },
  release: () => set({ dragging: false }),
  cancel: () => set({ from: null, dragging: false, targets: [] }),
  refreshTargets: () => {
    const { from } = get();
    if (!from) return;
    const g = useGame.getState();
    set({ targets: compatibleTargets(from, g.cable, g.links, portsFor(g.level)) });
  },
}));

// Cuando cambia el cable elegido, se recalculan los destinos sugeridos.
useGame.subscribe((s, prev) => {
  if (s.cable !== prev.cable || s.links !== prev.links) useInteraction.getState().refreshTargets();
  if (s.status !== 'playing' && prev.status === 'playing') useInteraction.getState().cancel();
});

// --- manejo de puertos (mouse y táctil) ---
let handledByScene = false;
export const markHandled = () => {
  handledByScene = true;
};

export function onPortDown(portId) {
  markHandled();
  const g = useGame.getState();
  if (g.screen === 'learn') {
    g.setLearnSel(PORT_BY_ID[portId].device === 'odf' ? 'fiber' : PORT_BY_ID[portId].device);
    sfx('click');
    return;
  }
  if (g.screen !== 'game' || g.status !== 'playing') return;
  const it = useInteraction.getState();
  const busy = g.links.some((l) => l.a === portId || l.b === portId);
  if (it.from && it.from !== portId) {
    // segundo toque del modo "tocar y tocar"
    g.tryConnect(it.from, portId);
    it.cancel();
    return;
  }
  if (busy) {
    g.occupiedPortTap();
    return;
  }
  if (it.from === portId) {
    it.cancel();
    return;
  }
  it.start(portId);
}

export function onPortUp(portId) {
  markHandled();
  const it = useInteraction.getState();
  if (!it.from) return;
  if (it.from === portId) {
    // fue un toque: queda seleccionado esperando el destino
    it.release();
    return;
  }
  useGame.getState().tryConnect(it.from, portId);
  it.cancel();
}

// Soltar fuera de un puerto cancela el cable en curso
if (typeof window !== 'undefined') {
  window.addEventListener('pointerup', (e) => {
    const onCanvas = e.target && e.target.tagName === 'CANVAS';
    setTimeout(() => {
      const it = useInteraction.getState();
      if (!handledByScene && it.from) {
        // arrastre soltado en cualquier lado, o toque en el vacío del escenario
        if (it.dragging || onCanvas) it.cancel();
      }
      handledByScene = false;
    }, 0);
  });
}
