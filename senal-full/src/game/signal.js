// Simulación simplificada de propagación Wi-Fi.
// Modelo: pérdida log-distancia + atenuación por cada pared/obstáculo atravesado
// + penalización por fuentes de interferencia. Cada celda toma la mejor señal.
import { MATERIALS } from './materials.js';
import { DEVICE_TYPES, PATH_LOSS_N, THRESHOLDS, OK_LEVEL } from './devices.js';

export const NO_SIGNAL = -100;

/** Segmentos que atenúan: paredes + bordes de obstáculos (cada borde, mitad de la atenuación). */
export function buildBlockers(map) {
  const segs = [];
  for (const w of map.walls) segs.push({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2, att: MATERIALS[w.mat].att, mat: w.mat });
  for (const o of map.obstacles) {
    const a = MATERIALS[o.mat].att / 2;
    segs.push({ x1: o.x0, y1: o.y0, x2: o.x1, y2: o.y0, att: a, mat: o.mat });
    segs.push({ x1: o.x1, y1: o.y0, x2: o.x1, y2: o.y1, att: a, mat: o.mat });
    segs.push({ x1: o.x1, y1: o.y1, x2: o.x0, y2: o.y1, att: a, mat: o.mat });
    segs.push({ x1: o.x0, y1: o.y1, x2: o.x0, y2: o.y0, att: a, mat: o.mat });
  }
  return segs;
}

// ¿Se cruzan los segmentos p-q y a-b? (cruce propio)
function crosses(px, py, qx, qy, s) {
  const rx = qx - px;
  const ry = qy - py;
  const sx = s.x2 - s.x1;
  const sy = s.y2 - s.y1;
  const den = rx * sy - ry * sx;
  if (den === 0) return false;
  const t = ((s.x1 - px) * sy - (s.y1 - py) * sx) / den;
  const u = ((s.x1 - px) * ry - (s.y1 - py) * rx) / den;
  return t > 0 && t < 1 && u >= 0 && u <= 1;
}

/** Atenuación total (dB) y lista de materiales atravesados entre dos puntos. */
export function pathAttenuation(blockers, ax, ay, bx, by, collect = null) {
  let att = 0;
  for (let i = 0; i < blockers.length; i++) {
    const s = blockers[i];
    // descarte rápido por caja envolvente
    if (Math.max(ax, bx) < Math.min(s.x1, s.x2) || Math.min(ax, bx) > Math.max(s.x1, s.x2)) continue;
    if (Math.max(ay, by) < Math.min(s.y1, s.y2) || Math.min(ay, by) > Math.max(s.y1, s.y2)) continue;
    if (crosses(ax, ay, bx, by, s)) {
      att += s.att;
      if (collect) collect.push(s.mat);
    }
  }
  return att;
}

export function signalAt(map, blockers, tx, x, y) {
  const type = DEVICE_TYPES[tx.type];
  const d = Math.max(0.5, Math.hypot(x - tx.x, y - tx.y));
  let s = type.p0 - 10 * PATH_LOSS_N * Math.log10(d);
  s -= pathAttenuation(blockers, tx.x, tx.y, x, y);
  for (const it of map.interference || []) {
    const di = Math.hypot(x - it.x, y - it.y);
    if (di < it.radius) s -= it.penalty * (1 - di / it.radius);
  }
  return s;
}

/**
 * Calcula la cobertura de todo el mapa.
 * @param transmitters [{type, x, y}] sólo equipos activos que emiten Wi-Fi
 * @returns {cols, rows, grid: Float32Array (dBm), sectors: {id: {ok, pct, avg, level}}, totalPct}
 */
export function computeCoverage(map, blockers, transmitters, required = 0.8) {
  const cell = map.cell;
  const cols = Math.round(map.width / cell);
  const rows = Math.round(map.depth / cell);
  const grid = new Float32Array(cols * rows).fill(NO_SIGNAL);
  for (const tx of transmitters) {
    for (let j = 0; j < rows; j++) {
      const y = (j + 0.5) * cell;
      for (let i = 0; i < cols; i++) {
        const x = (i + 0.5) * cell;
        const v = signalAt(map, blockers, tx, x, y);
        const k = j * cols + i;
        if (v > grid[k]) grid[k] = v;
      }
    }
  }
  const sectors = {};
  let okAll = 0;
  let nAll = 0;
  for (const room of map.rooms) {
    let ok = 0;
    let n = 0;
    let sum = 0;
    for (let j = Math.floor(room.y0 / cell); j < Math.ceil(room.y1 / cell); j++) {
      for (let i = Math.floor(room.x0 / cell); i < Math.ceil(room.x1 / cell); i++) {
        const v = grid[j * cols + i];
        n++;
        sum += v;
        if (v >= OK_LEVEL) ok++;
      }
    }
    const pct = n ? ok / n : 0;
    sectors[room.id] = { pct, avg: sum / n, level: sectorLevel(pct, required) };
    if (!room.notRequired) {
      okAll += ok;
      nAll += n;
    }
  }
  return { cols, rows, grid, sectors, totalPct: nAll ? okAll / nAll : 0 };
}

export function sectorLevel(pct, required = 0.8) {
  if (pct >= required) return 'green';
  if (pct >= 0.55) return 'yellow';
  if (pct >= 0.2) return 'orange';
  return 'red';
}

export function qualityOf(dbm) {
  if (dbm >= THRESHOLDS.excellent) return 'excellent';
  if (dbm >= THRESHOLDS.medium) return 'medium';
  if (dbm >= THRESHOLDS.weak) return 'weak';
  return 'none';
}
