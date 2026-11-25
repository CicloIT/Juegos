// Reglas de conexión, validación con mensajes educativos y cálculo de conectividad.
// Funciones puras: reciben datos, devuelven datos.
import { PORT_BY_ID, ROLE, MEDIUM, SECTORS } from './network.js';

// Pares de roles permitidos (sin importar el orden) y su medio.
const ALLOWED = [
  { a: ROLE.ODF, b: ROLE.ONT_PON, medium: MEDIUM.FIBER, key: () => 'fiber' },
  { a: ROLE.ONT_LAN, b: ROLE.WAN, medium: MEDIUM.ETH, key: () => 'ont-router' },
  { a: ROLE.LAN, b: ROLE.SWITCH, medium: MEDIUM.ETH, key: () => 'router-switch' },
  { a: ROLE.SWITCH, b: ROLE.PATCH, medium: MEDIUM.ETH, key: (pa, pb) => sectorKey(pa, pb) },
  { a: ROLE.SWITCH, b: ROLE.AP, medium: MEDIUM.ETH, key: () => 'sector-patio' },
  // switches en cascada (sólo entre switches distintos; el mismo switch se rechaza antes)
  { a: ROLE.SWITCH, b: ROLE.SWITCH, medium: MEDIUM.ETH, key: () => 'switch-switch' },
];

function sectorKey(pa, pb) {
  const term = pa.role === ROLE.SWITCH ? pb : pa;
  const s = SECTORS.find((x) => x.terminal === term.id);
  return s ? `sector-${s.id}` : null;
}

function findRule(pa, pb) {
  return ALLOWED.find(
    (r) => (r.a === pa.role && r.b === pb.role) || (r.a === pb.role && r.b === pa.role),
  );
}

const has = (pa, pb, ra, rb) =>
  (pa.role === ra && pb.role === rb) || (pa.role === rb && pb.role === ra);
const any = (pa, pb, r) => pa.role === r || pb.role === r;

// Qué puerto sería el correcto para un puerto de origen (para ayudas visuales).
export function correctRolesFor(role) {
  return ALLOWED.filter((r) => r.a === role || r.b === role).map((r) => (r.a === role ? r.b : r.a));
}

export function portOccupied(links, portId) {
  return links.find((l) => l.a === portId || l.b === portId);
}

/**
 * Valida una conexión.
 * @returns {{ok:true, key:string} | {ok:false, kind:string, title:string, text:string, hint:string, counts:boolean}}
 */
export function validateConnection(aId, bId, cable, links) {
  const pa = PORT_BY_ID[aId];
  const pb = PORT_BY_ID[bId];
  if (!pa || !pb || aId === bId) return { ok: false, kind: 'noop', counts: false };

  if (portOccupied(links, aId) || portOccupied(links, bId)) {
    return fail('busy', 'Puerto ocupado', 'Ese puerto ya tiene un cable.', 'Tocá el cable para desconectarlo si querés cambiarlo.', false);
  }

  if (pa.device === pb.device && pa.role === ROLE.SWITCH) {
    return fail('loop', '¡Bucle!', 'Unir dos puertos del mismo switch crea un bucle y la red se satura.', 'Llevá el cable del switch al patch panel, al AP o a otro switch.');
  }
  if (pa.device === pb.device) {
    return fail('same', 'Mismo equipo', 'Conectar un equipo consigo mismo no lleva la señal a ningún lado.', 'Uní equipos distintos siguiendo el camino de la señal.');
  }

  // Medio del cable vs. puerto
  const fiberPort = pa.medium === MEDIUM.FIBER || pb.medium === MEDIUM.FIBER;
  if (cable === MEDIUM.FIBER && !(pa.medium === MEDIUM.FIBER && pb.medium === MEDIUM.FIBER)) {
    return fail('medium', 'Cable equivocado',
      '¡Atención! La fibra óptica debe conectarse al ONT, que convierte la señal óptica en Ethernet.',
      'Usá la fibra entre la ENTRADA DE FIBRA y el puerto PON del ONT.');
  }
  if (cable === MEDIUM.ETH && fiberPort) {
    return fail('medium', 'Cable equivocado',
      'Los puertos de fibra transmiten luz: un cable Ethernet (cobre) no sirve ahí.',
      'Elegí el cable de FIBRA ÓPTICA (amarillo) para unir la entrada de fibra con el PON del ONT.');
  }

  const rule = findRule(pa, pb);
  if (rule) {
    // Restricciones de cantidad
    if (rule.a === ROLE.LAN && links.some((l) => l.ok && l.key === 'router-switch')) {
      return fail('dup', 'Enlace repetido', 'El router ya está conectado al switch. Con un enlace alcanza.', 'Usá los puertos libres del switch para llegar a los sectores.');
    }
    if (rule.a === ROLE.SWITCH && rule.b === ROLE.SWITCH && links.some((l) => l.ok && l.key === 'switch-switch')) {
      return fail('dup', 'Enlace repetido', 'Los dos switches ya están unidos. Un segundo cable entre ellos formaría un bucle.', 'Usá los puertos libres para llegar a los sectores.');
    }
    const key = rule.key(pa, pb);
    return { ok: true, key };
  }

  return fail('topology', ...explainTopology(pa, pb));
}

function fail(kind, title, text, hint, counts = true) {
  return { ok: false, kind, title, text, hint, counts };
}

function explainTopology(pa, pb) {
  if (any(pa, pb, ROLE.WAN)) {
    return ['Revisá el router',
      'El router tiene una entrada WAN y salidas LAN. Revisá qué conexión estás realizando.',
      'El puerto WAN recibe Internet desde la salida LAN del ONT.'];
  }
  if (has(pa, pb, ROLE.ONT_LAN, ROLE.LAN)) {
    return ['Entrada equivocada',
      'El ONT entrega Internet al router por su ENTRADA, el puerto WAN. Los LAN son salidas.',
      'Conectá el LAN del ONT al puerto WAN del router.'];
  }
  if (any(pa, pb, ROLE.ONT_LAN)) {
    return ['Falta el router',
      'El ONT entrega Internet al router. El router es el que administra la red y la reparte.',
      'Conectá la salida LAN del ONT al puerto WAN del router.'];
  }
  if (has(pa, pb, ROLE.LAN, ROLE.PATCH) || has(pa, pb, ROLE.LAN, ROLE.AP)) {
    return ['Usá el switch',
      'El switch permite distribuir la conexión hacia diferentes equipos.',
      'Conectá un LAN del router al switch, y desde el switch a los sectores.'];
  }
  if (has(pa, pb, ROLE.PATCH, ROLE.PATCH) || has(pa, pb, ROLE.PATCH, ROLE.AP)) {
    return ['El patch panel no reparte',
      'El patch panel organiza las conexiones físicas, pero no distribuye por sí mismo la señal.',
      'Cada puerto del patch panel va conectado a un puerto del switch.'];
  }
  if (any(pa, pb, ROLE.AP)) {
    return ['Conectá el AP a la red',
      'El punto de acceso Wi-Fi necesita una conexión a la infraestructura de red.',
      'Conectá el AP a un puerto libre del switch.'];
  }
  if (has(pa, pb, ROLE.SWITCH, ROLE.SWITCH)) {
    return ['¡Bucle!',
      'Unir dos puertos del mismo switch crea un bucle y la red se satura.',
      'Llevá el cable del switch al patch panel o al AP.'];
  }
  return ['Conexión incorrecta',
    'Esa conexión no sigue el camino de la señal.',
    'Fibra → ONT → Router (WAN) → Switch → Patch panel / AP.'];
}

/**
 * Calcula qué nodos reciben Internet. Cada puerto del patch panel es un nodo
 * propio (representa un cable que va a un sector distinto).
 */
export function computeConnectivity(links) {
  const nodeOf = (portId) => {
    const pt = PORT_BY_ID[portId];
    return pt.device === 'patch' ? portId : pt.device;
  };
  const adj = new Map();
  const add = (x, y) => {
    if (!adj.has(x)) adj.set(x, []);
    adj.get(x).push(y);
  };
  for (const l of links) {
    if (!l.ok) continue;
    const x = nodeOf(l.a);
    const y = nodeOf(l.b);
    add(x, y);
    add(y, x);
  }
  const reached = new Set(['odf']);
  const queue = ['odf'];
  while (queue.length) {
    const n = queue.shift();
    for (const m of adj.get(n) || []) {
      if (!reached.has(m)) {
        reached.add(m);
        queue.push(m);
      }
    }
  }
  const activeLinks = new Set(
    links.filter((l) => l.ok && reached.has(nodeOf(l.a)) && reached.has(nodeOf(l.b))).map((l) => l.id),
  );
  const sectors = {};
  for (const s of SECTORS) {
    const node = nodeOf(s.terminal);
    const wired = links.some((l) => l.ok && (l.a === s.terminal || l.b === s.terminal));
    sectors[s.id] = reached.has(node) && wired ? 'green' : wired ? 'yellow' : 'red';
  }
  return { reached, activeLinks, sectors };
}

/** Puertos libres que aceptarían una conexión desde `fromId` con el cable dado. */
export function compatibleTargets(fromId, cable, links, allPorts) {
  return allPorts
    .filter((pt) => pt.id !== fromId)
    .filter((pt) => validateConnection(fromId, pt.id, cable, links).ok)
    .map((pt) => pt.id);
}

/** Por qué una conexión (ya hecha) es incorrecta: se usa al quitar cables mal puestos. */
export function explainWrong(aId, bId) {
  const pa = PORT_BY_ID[aId];
  const pb = PORT_BY_ID[bId];
  if (pa.device === pb.device && pa.role === ROLE.SWITCH) return ['¡Era un bucle!', 'Unir dos puertos del mismo switch crea un bucle y la red se satura.'];
  const [title, text] = explainTopology(pa, pb);
  return [title, text];
}
