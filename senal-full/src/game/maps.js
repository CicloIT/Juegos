// Planos del colegio. Coordenadas en metros: x hacia la derecha, y hacia el frente (patio).
// Sin nada visual: la vista 3D y la simulación leen estos datos.

const r = (id, name, x0, y0, x1, y1, extra = {}) => ({ id, name, x0, y0, x1, y1, ...extra });
const w = (x1, y1, x2, y2, mat) => ({ x1, y1, x2, y2, mat });
const box = (x0, y0, x1, y1, mat, kind) => ({ x0, y0, x1, y1, mat, kind });

// Divide una pared recta dejando huecos de puertas/ventanas de otro material.
function wallLine(axis, at, from, to, mat, gaps = []) {
  const out = [];
  let cur = from;
  for (const g of [...gaps].sort((a, b) => a.from - b.from)) {
    if (g.from > cur) out.push(seg(axis, at, cur, g.from, mat));
    if (g.mat) out.push(seg(axis, at, g.from, g.to, g.mat));
    cur = g.to;
  }
  if (cur < to) out.push(seg(axis, at, cur, to, mat));
  return out;
}
const seg = (axis, at, a, b, mat) => (axis === 'h' ? w(a, at, b, at, mat) : w(at, a, at, b, mat));
const door = (from, size = 1.2) => ({ from, to: from + size });
const glass = (from, to) => ({ from, to, mat: 'vidrio' });

export const SCHOOL_L1 = {
  id: 'l1',
  width: 24,
  depth: 22,
  building: { x0: 0, y0: 0, x1: 24, y1: 14 },
  cell: 0.5,
  rooms: [
    r('aula1', 'Aula 1', 0, 0, 8, 6, { floor: '#2b3a55', icon: '📚' }),
    r('aula2', 'Aula 2', 8, 0, 16, 6, { floor: '#2d4a4f', icon: '✏️' }),
    r('info', 'Sala de informática', 16, 0, 24, 6, { floor: '#33324f', icon: '💻' }),
    r('pasillo', 'Pasillo', 0, 6, 24, 8, { floor: '#3a3f47', icon: '🚶', notRequired: true }),
    r('lab', 'Laboratorio de electromecánica', 0, 8, 9, 14, { floor: '#4a3d2e', icon: '⚙️' }),
    r('biblio', 'Biblioteca', 9, 8, 16, 14, { floor: '#3d2f3f', icon: '📖' }),
    r('dir', 'Dirección', 16, 8, 24, 14, { floor: '#2f4436', icon: '🗂️' }),
    r('patio', 'Patio', 0, 14, 24, 22, { floor: '#2f4a2a', icon: '🌳', outdoor: true }),
  ],
  walls: [
    // perímetro
    ...wallLine('h', 0, 0, 24, 'hormigon', [glass(2, 5), glass(10, 13), glass(18.5, 21.5)]),
    ...wallLine('v', 0, 0, 14, 'hormigon'),
    ...wallLine('v', 24, 0, 14, 'hormigon'),
    ...wallLine('h', 14, 0, 24, 'hormigon', [glass(2, 6), door(11, 2), glass(18, 22)]),
    // aulas hacia el pasillo
    ...wallLine('h', 6, 0, 24, 'ladrillo', [door(3), door(11), door(19)]),
    ...wallLine('h', 8, 0, 24, 'ladrillo', [door(4), door(12), door(20)]),
    w(8, 0, 8, 6, 'ladrillo'),
    w(16, 0, 16, 6, 'ladrillo'),
    // laboratorio con muro grueso, dirección con durlock
    w(9, 8, 9, 14, 'hormigon'),
    w(16, 8, 16, 14, 'durlock'),
  ],
  obstacles: [
    // máquinas del laboratorio
    box(1.5, 9.5, 3.2, 10.6, 'metal', 'torno'),
    box(5, 9.5, 6.7, 10.6, 'metal', 'torno'),
    box(1.5, 12, 3.2, 13.1, 'metal', 'fresadora'),
    box(5, 12, 6.7, 13.1, 'metal', 'banco'),
    // estanterías de la biblioteca
    box(10, 9.6, 15, 10.0, 'madera', 'estante'),
    box(10, 11.2, 15, 11.6, 'madera', 'estante'),
    // rack de la sala de informática
    box(22.6, 0.3, 23.6, 1.0, 'metal', 'rack'),
  ],
  furniture: {
    desks: [
      ...grid(1.2, 1.6, 4, 3, 1.6, 1.3),
      ...grid(9.2, 1.6, 4, 3, 1.6, 1.3),
      ...grid(17, 2.4, 3, 2, 1.8, 1.5),
    ],
    trees: [[2, 20.5], [6, 21], [18, 21], [22, 20.2], [12.5, 21.3]],
    benches: [[4, 16.5], [20, 16.5]],
  },
  // la fibra llega a la sala de informática
  ont: { x: 21.6, y: 0.7 },
  fiberEntry: { x: 21.6, y: -3 },
  interference: [],
};

function grid(x0, y0, cols, rows, dx, dy) {
  const out = [];
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) out.push([x0 + i * dx, y0 + j * dy]);
  return out;
}

// Variante para el modo aprendizaje: con una fuente de interferencia (microondas)
export const SCHOOL_LEARN = {
  ...SCHOOL_L1,
  id: 'learn',
  interference: [{ x: 22, y: 12, radius: 6, penalty: 14, name: 'Microondas' }],
};

// ---------------------------------------------------------------------------
// NIVEL 2 · TÉCNICO: colegio más grande y paredes de distintos materiales
export const SCHOOL_L2 = {
  id: 'l2',
  width: 32,
  depth: 24,
  building: { x0: 0, y0: 0, x1: 32, y1: 16 },
  cell: 0.5,
  rooms: [
    r('aula1', 'Aula 1', 0, 0, 8, 6, { floor: '#2b3a55', icon: '📚' }),
    r('aula2', 'Aula 2', 8, 0, 16, 6, { floor: '#2d4a4f', icon: '✏️' }),
    r('aula3', 'Aula 3', 16, 0, 24, 6, { floor: '#3a3355', icon: '📐' }),
    r('info', 'Sala de informática', 24, 0, 32, 6, { floor: '#33324f', icon: '💻' }),
    r('pasillo', 'Pasillo', 0, 6, 32, 8, { floor: '#3a3f47', icon: '🚶', notRequired: true }),
    r('lab', 'Laboratorio de electromecánica', 0, 8, 10, 16, { floor: '#4a3d2e', icon: '⚙️' }),
    r('biblio', 'Biblioteca', 10, 8, 17, 16, { floor: '#3d2f3f', icon: '📖' }),
    r('profes', 'Sala de profesores', 17, 8, 24, 16, { floor: '#2f3f4a', icon: '☕' }),
    r('dir', 'Dirección', 24, 8, 32, 16, { floor: '#2f4436', icon: '🗂️' }),
    r('patio', 'Patio', 0, 16, 32, 24, { floor: '#2f4a2a', icon: '🌳', outdoor: true }),
  ],
  walls: [
    ...wallLine('h', 0, 0, 32, 'hormigon', [glass(2, 5), glass(10, 13), glass(18, 21), glass(26, 29)]),
    ...wallLine('v', 0, 0, 16, 'hormigon'),
    ...wallLine('v', 32, 0, 16, 'hormigon'),
    ...wallLine('h', 16, 0, 32, 'hormigon', [glass(2, 6), door(14, 2), glass(20, 23), glass(26, 30)]),
    ...wallLine('h', 6, 0, 32, 'ladrillo', [door(3), door(11), door(19), door(27)]),
    ...wallLine('h', 8, 0, 32, 'ladrillo', [door(4), door(13), door(20), door(28)]),
    w(8, 0, 8, 6, 'ladrillo'),
    w(16, 0, 16, 6, 'hormigon'),
    w(24, 0, 24, 6, 'durlock'),
    w(10, 8, 10, 16, 'hormigon'),
    w(17, 8, 17, 16, 'vidrio'),
    w(24, 8, 24, 16, 'durlock'),
  ],
  obstacles: [
    box(1.5, 9.5, 3.5, 10.8, 'metal', 'torno'),
    box(6, 9.5, 8, 10.8, 'metal', 'torno'),
    box(1.5, 13, 3.5, 14.3, 'metal', 'fresadora'),
    box(6, 13, 8, 14.3, 'metal', 'banco'),
    box(11, 9.8, 16, 10.2, 'madera', 'estante'),
    box(11, 12, 16, 12.4, 'madera', 'estante'),
    box(11, 14.2, 16, 14.6, 'madera', 'estante'),
    box(30.6, 0.3, 31.6, 1.0, 'metal', 'rack'),
  ],
  furniture: {
    desks: [...grid(1.2, 1.6, 4, 3, 1.6, 1.3), ...grid(9.2, 1.6, 4, 3, 1.6, 1.3), ...grid(17.2, 1.6, 4, 3, 1.6, 1.3), ...grid(25, 2.4, 3, 2, 1.8, 1.5), ...grid(18.5, 10.5, 2, 2, 2.2, 2.5)],
    trees: [[2, 22.5], [7, 23], [16, 23.2], [25, 22.8], [30, 22.2]],
    benches: [[5, 18.5], [27, 18.5], [16, 20]],
  },
  ont: { x: 29.6, y: 0.7 },
  fiberEntry: { x: 29.6, y: -3 },
  interference: [],
};

// ---------------------------------------------------------------------------
// NIVEL 3 · EXPERTO: edificio completo, obstáculos complejos e interferencias
export const SCHOOL_L3 = {
  id: 'l3',
  width: 36,
  depth: 26,
  building: { x0: 0, y0: 0, x1: 36, y1: 18 },
  cell: 0.5,
  rooms: [
    r('aula1', 'Aula 1', 0, 0, 8, 6, { floor: '#2b3a55', icon: '📚' }),
    r('aula2', 'Aula 2', 8, 0, 16, 6, { floor: '#2d4a4f', icon: '✏️' }),
    r('aula3', 'Aula 3', 16, 0, 24, 6, { floor: '#3a3355', icon: '📐' }),
    r('info', 'Sala de informática', 24, 0, 30, 6, { floor: '#33324f', icon: '💻' }),
    r('buffet', 'Buffet', 30, 0, 36, 6, { floor: '#4a3a2a', icon: '🍔' }),
    r('pasillo', 'Pasillo', 0, 6, 36, 8, { floor: '#3a3f47', icon: '🚶', notRequired: true }),
    r('lab', 'Laboratorio de electromecánica', 0, 8, 10, 18, { floor: '#4a3d2e', icon: '⚙️' }),
    r('gym', 'Gimnasio', 10, 8, 22, 18, { floor: '#5a4630', icon: '🏀' }),
    r('biblio', 'Biblioteca', 22, 8, 29, 18, { floor: '#3d2f3f', icon: '📖' }),
    r('dir', 'Dirección', 29, 8, 36, 18, { floor: '#2f4436', icon: '🗂️' }),
    r('patio', 'Patio', 0, 18, 36, 26, { floor: '#2f4a2a', icon: '🌳', outdoor: true }),
  ],
  walls: [
    ...wallLine('h', 0, 0, 36, 'hormigon', [glass(2, 5), glass(10, 13), glass(18, 21), glass(26, 28)]),
    ...wallLine('v', 0, 0, 18, 'hormigon'),
    ...wallLine('v', 36, 0, 18, 'hormigon'),
    ...wallLine('h', 18, 0, 36, 'hormigon', [glass(2, 6), door(15, 2.5), glass(24, 27), glass(31, 34)]),
    ...wallLine('h', 6, 0, 36, 'ladrillo', [door(3), door(11), door(19), door(26.5), door(32.5)]),
    ...wallLine('h', 8, 0, 36, 'ladrillo', [door(4), door(13), glass(15, 19), door(25), door(32)]),
    w(8, 0, 8, 6, 'ladrillo'),
    w(16, 0, 16, 6, 'hormigon'),
    w(24, 0, 24, 6, 'ladrillo'),
    w(30, 0, 30, 6, 'hormigon'),
    w(10, 8, 10, 18, 'hormigon'),
    w(22, 8, 22, 18, 'hormigon'),
    w(29, 8, 29, 18, 'durlock'),
  ],
  obstacles: [
    box(1.5, 9.5, 3.5, 10.8, 'metal', 'torno'),
    box(6, 9.5, 8, 10.8, 'metal', 'torno'),
    box(1.5, 13, 3.5, 14.3, 'metal', 'fresadora'),
    box(6, 13, 8, 14.3, 'metal', 'banco'),
    box(1.5, 16, 8, 16.6, 'metal', 'tablero'),
    // gradas metálicas del gimnasio
    box(10.6, 9, 21.4, 10.2, 'metal', 'gradas'),
    box(10.6, 16, 21.4, 17.2, 'metal', 'gradas'),
    // estanterías
    box(23, 9.8, 28, 10.2, 'madera', 'estante'),
    box(23, 12, 28, 12.4, 'madera', 'estante'),
    box(23, 14.2, 28, 14.6, 'madera', 'estante'),
    box(23, 16.4, 28, 16.8, 'madera', 'estante'),
    // cocina del buffet
    box(31, 0.4, 35.5, 1.2, 'metal', 'cocina'),
    box(28.6, 0.3, 29.6, 1.0, 'metal', 'rack'),
  ],
  furniture: {
    desks: [...grid(1.2, 1.6, 4, 3, 1.6, 1.3), ...grid(9.2, 1.6, 4, 3, 1.6, 1.3), ...grid(17.2, 1.6, 4, 3, 1.6, 1.3), ...grid(25, 2.4, 3, 2, 1.6, 1.5), ...grid(31.2, 3, 3, 2, 1.6, 1.5)],
    trees: [[2, 24.5], [7, 25], [17, 25.2], [26, 24.8], [33, 24.2]],
    benches: [[5, 20.5], [29, 20.5], [18, 22]],
  },
  ont: { x: 27.6, y: 0.7 },
  fiberEntry: { x: 27.6, y: -3 },
  interference: [
    { x: 33.5, y: 1.5, radius: 6, penalty: 12, name: 'Microondas del buffet' },
    { x: 35, y: 25, radius: 8, penalty: 9, name: 'Red Wi-Fi vecina' },
  ],
};
