// Arrastre de equipos con mouse y táctil. Se usan listeners de window para que
// funcione igual al arrastrar desde el inventario (HTML) o desde la escena 3D.
import * as THREE from 'three';
import { useGame } from '../game/store.js';

export const view = { camera: null, canvas: null };

const ray = new THREE.Raycaster();
const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hit = new THREE.Vector3();
const ndc = new THREE.Vector2();

export const toWorld = (map, x, y) => [x - map.width / 2, y - map.depth / 2];

/** Punto del piso (en metros del plano) bajo una posición de pantalla. */
export function groundAt(clientX, clientY) {
  const { camera, canvas } = view;
  if (!camera || !canvas) return null;
  const r = canvas.getBoundingClientRect();
  ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  if (!ray.ray.intersectPlane(ground, hit)) return null;
  const map = useGame.getState().map;
  return { x: hit.x + map.width / 2, y: hit.z + map.depth / 2 };
}

let ptr = null;
let raf = 0;
let pendingXY = null;
const MOVE_PX = 8;

function onMove(e) {
  if (!ptr || e.pointerId !== ptr.pointerId) return;
  const g = useGame.getState();
  if (!ptr.moved && Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y) > MOVE_PX) {
    ptr.moved = true;
    g.beginDrag({ kind: ptr.kind, type: ptr.type, id: ptr.id });
  }
  if (ptr.moved) {
    // como mucho un cálculo de cobertura por cuadro
    pendingXY = [e.clientX, e.clientY];
    if (!raf) {
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!pendingXY || !useGame.getState().drag) return;
        const p = groundAt(pendingXY[0], pendingXY[1]);
        if (p) useGame.getState().updateDrag(p.x, p.y);
      });
    }
  }
}

function onUp(e) {
  if (!ptr || e.pointerId !== ptr.pointerId) return;
  const g = useGame.getState();
  const cur = ptr;
  ptr = null;
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onUp);
  window.removeEventListener('pointercancel', onUp);
  if (!cur.moved) {
    // fue un toque
    if (cur.kind === 'new') g.arm(cur.type);
    else g.select(g.selected === cur.id ? null : cur.id);
    return;
  }
  if (!g.drag) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (el && el.tagName === 'CANVAS') {
    const p = groundAt(e.clientX, e.clientY);
    if (p) g.updateDrag(p.x, p.y);
    g.endDrag('drop');
  } else if (el && el.closest('.inventory') && cur.kind === 'move') g.endDrag('remove');
  else g.endDrag('cancel');
}

function begin(e, info) {
  if (!useGame.getState().canEdit()) return;
  // en táctil el navegador "captura" el dedo en el elemento: lo liberamos
  try {
    e.target?.releasePointerCapture?.(e.pointerId);
  } catch {
    /* nada */
  }
  ptr = { ...info, x: e.clientX, y: e.clientY, pointerId: e.pointerId, moved: false };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
}

export const startInventoryDrag = (e, type) => begin(e, { kind: 'new', type });
export const startDeviceDrag = (e, device) => begin(e, { kind: 'move', type: device.type, id: device.id });

// utilidad de pruebas (solo desarrollo): metros del plano -> píxeles de pantalla
if (import.meta.env.DEV) {
  window.__mapToScreen = (x, y) => {
    const map = useGame.getState().map;
    const v = new THREE.Vector3(x - map.width / 2, 0, y - map.depth / 2).project(view.camera);
    const r = view.canvas.getBoundingClientRect();
    return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height];
  };
}
