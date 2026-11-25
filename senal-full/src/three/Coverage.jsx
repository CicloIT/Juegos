import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame, previewDevices } from '../game/store.js';
import { DEVICE_TYPES, THRESHOLDS } from '../game/devices.js';
import { signalAt } from '../game/signal.js';
import { toWorld } from './placement.js';

// Colores del mapa de calor
const GREEN = [34, 197, 94];
const YELLOW = [250, 204, 21];
const ORANGE = [249, 115, 22];
const RED = [239, 68, 68];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const band = (v, edge, a, b) => mix(a, b, Math.min(1, Math.max(0, (edge + 1.5 - v) / 3)));

export function colorFor(dbm) {
  // transiciones suaves de 3 dB alrededor de cada umbral
  if (dbm >= THRESHOLDS.excellent + 1.5) return GREEN;
  if (dbm >= THRESHOLDS.excellent - 1.5) return band(dbm, THRESHOLDS.excellent, GREEN, YELLOW);
  if (dbm >= THRESHOLDS.medium + 1.5) return YELLOW;
  if (dbm >= THRESHOLDS.medium - 1.5) return band(dbm, THRESHOLDS.medium, YELLOW, ORANGE);
  if (dbm >= THRESHOLDS.weak + 1.5) return ORANGE;
  if (dbm >= THRESHOLDS.weak - 1.5) return band(dbm, THRESHOLDS.weak, ORANGE, RED);
  return RED;
}

/** Capa de colores sobre el piso, actualizada con cada cambio de cobertura. */
export function Heatmap() {
  const map = useGame((s) => s.map);
  const coverage = useGame((s) => s.coverage);
  const show = useGame((s) => s.showHeatmap);
  const { cols, rows } = coverage;
  const tex = useMemo(() => {
    const t = new THREE.DataTexture(new Uint8Array(cols * rows * 4), cols, rows, THREE.RGBAFormat);
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [cols, rows]);
  useEffect(() => () => tex.dispose(), [tex]);

  useEffect(() => {
    const data = tex.image.data;
    const g = coverage.grid;
    for (let j = 0; j < rows; j++) {
      const row = rows - 1 - j; // la textura crece hacia arriba
      for (let i = 0; i < cols; i++) {
        const v = g[j * cols + i];
        const c = colorFor(v);
        const k = (row * cols + i) * 4;
        data[k] = c[0];
        data[k + 1] = c[1];
        data[k + 2] = c[2];
        data[k + 3] = v < -88 ? 70 : v < THRESHOLDS.weak ? 120 : 175;
      }
    }
    tex.needsUpdate = true;
  }, [coverage, tex, cols, rows]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]} visible={show} renderOrder={2}>
      <planeGeometry args={[map.width, map.depth]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/**
 * Animación de propagación: partículas que salen del emisor en todas las direcciones.
 * Su color/brillo se toma de la simulación, así se ve cómo las paredes la debilitan.
 */
const RAYS = 56;
const STEPS = 36;
const MAX_R = 16;
export function SignalRays() {
  const map = useGame((s) => s.map);
  const blockers = useGame((s) => s.blockers);
  const placed = useGame((s) => s.placed);
  const drag = useGame((s) => s.drag);
  const links = useGame((s) => s.links);
  const screen = useGame((s) => s.screen);
  const devices = previewDevices(placed, drag);
  const tx = devices.filter((d) => DEVICE_TYPES[d.type].wifi && (screen !== 'game' || links.active.has(d.id) || d.id === 'ghost'));
  const key = tx.map((d) => `${d.type}${d.x},${d.y}`).join('|');

  // Precalcula color y alfa a lo largo de cada rayo
  const samples = useMemo(() => {
    return tx.map((d) => {
      const arr = new Float32Array(RAYS * STEPS * 4);
      for (let r = 0; r < RAYS; r++) {
        const a = (r / RAYS) * Math.PI * 2;
        for (let s = 0; s < STEPS; s++) {
          const dist = ((s + 0.5) / STEPS) * MAX_R;
          const x = d.x + Math.cos(a) * dist;
          const y = d.y + Math.sin(a) * dist;
          const out = x < 0 || y < 0 || x > map.width || y > map.depth;
          const v = out ? -120 : signalAt(map, blockers, d, x, y);
          const c = colorFor(v);
          const k = (r * STEPS + s) * 4;
          arr[k] = c[0] / 255;
          arr[k + 1] = c[1] / 255;
          arr[k + 2] = c[2] / 255;
          arr[k + 3] = v < -80 ? 0 : Math.min(1, (v + 80) / 18);
        }
      }
      return { d, arr };
    });
  }, [key, map, blockers]); // eslint-disable-line

  const count = Math.max(1, tx.length) * RAYS * 2;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 4), 4));
    return g;
  }, [count]);
  useEffect(() => () => geo.dispose(), [geo]);
  const mat = useMemo(() => new THREE.PointsMaterial({ size: 0.32, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false }), []);

  useFrame(({ clock }) => {
    const pos = geo.attributes.position.array;
    const col = geo.attributes.color.array;
    const t = clock.elapsedTime;
    let n = 0;
    for (const { d, arr } of samples) {
      const [wx, wz] = toWorld(map, d.x, d.y);
      for (let r = 0; r < RAYS; r++) {
        const a = (r / RAYS) * Math.PI * 2;
        for (let p = 0; p < 2; p++) {
          const ph = (t * 0.28 + p * 0.5 + (r % 2) * 0.07) % 1;
          const dist = ph * MAX_R;
          const s = Math.min(STEPS - 1, Math.floor(ph * STEPS));
          const k = (r * STEPS + s) * 4;
          pos[n * 3] = wx + Math.cos(a) * dist;
          pos[n * 3 + 1] = 0.5;
          pos[n * 3 + 2] = wz + Math.sin(a) * dist;
          col[n * 4] = arr[k];
          col[n * 4 + 1] = arr[k + 1];
          col[n * 4 + 2] = arr[k + 2];
          col[n * 4 + 3] = arr[k + 3] * (1 - ph * 0.4);
          n++;
        }
      }
    }
    for (; n < count; n++) col[n * 4 + 3] = 0;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  });

  return <points geometry={geo} material={mat} renderOrder={3} />;
}
