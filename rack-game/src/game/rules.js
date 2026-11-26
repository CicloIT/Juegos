// Reglas de conexión, validación con mensajes educativos y cálculo de conectividad.
// Funciones puras: reciben datos, devuelven datos.
import { PORT_BY_ID, ROLE, MEDIUM, SECTORS } from './network.js';

// Pares de roles permitidos (sin importar el orden) y su medio.
// Se aceptan también conexiones que funcionan aunque no sean las más prolijas
// (router directo al AP o al patch panel, router a los dos switches): al terminar
// se explican como mejoras posibles (ver improvementsFor).
const ALLOWED = [
  { a: ROLE.ODF, b: ROLE.ONT_PON, medium: MEDIUM.FIBER, key: () => 'fiber' },
  { a: ROLE.ONT_LAN, b: ROLE.WAN, medium: MEDIUM.ETH, key: () => 'ont-router' },
  { a: ROLE.LAN, b: ROLE.SWITCH, medium: MEDIUM.ETH, key: (pa, pb) => (devOf(pa, pb, ROLE.SWITCH) === 'switch2' ? 'router-switch2' : 'router-switch') },
  { a: ROLE.SWITCH, b: ROLE.PATCH, medium: MEDIUM.ETH, key: (pa, pb) => sectorKey(pa, pb) },
  { a: ROLE.SWITCH, b: ROLE.AP, medium: MEDIUM.ETH, key: (pa, pb) => sectorKey(pa, pb) },
  { a: ROLE.LAN, b: ROLE.PATCH, medium: MEDIUM.ETH, key: (pa, pb) => sectorKey(pa, pb) },
  { a: ROLE.LAN, b: ROLE.AP, medium: MEDIUM.ETH, key: (pa, pb) => sectorKey(pa, pb) },
  // switches en cascada (sólo entre switches distintos; el mismo switch se rechaza antes)
  { a: ROLE.SWITCH, b: ROLE.SWITCH, medium: MEDIUM.ETH, key: () => 'switch-switch' },
];

const devOf = (pa, pb, role) => (pa.role === role ? pa.device : pb.device);

function sectorKey(pa, pb) {
  const term = pa.role === ROLE.PATCH || pa.role === ROLE.AP ? pa : pb;
  const s = SECTORS.find((x) => x.terminal === term.id);
  return s ? `sector-${s.id}` : null;
}

// Nodo lógico de un puerto: cada puerto del patch panel es un nodo propio
// (representa un cable que va a un sector distinto).
const nodeOf = (portId) => {
  const pt = PORT_BY_ID[portId];
  return pt.device === 'patch' ? portId : pt.device;
};

// ¿Los dos nodos ya están unidos por cables correctos? Entonces otro cable cerraría un bucle.
function alreadyConnected(links, x, y) {
  const adj = new Map();
  const add = (u, v) => {
    if (!adj.has(u)) adj.set(u, []);
    adj.get(u).push(v);
  };
  for (const l of links) {
    if (!l.ok) continue;
    add(nodeOf(l.a), nodeOf(l.b));
    add(nodeOf(l.b), nodeOf(l.a));
  }
  const seen = new Set([x]);
  const queue = [x];
  while (queue.length) {
    const n = queue.shift();
    if (n === y) return true;
    for (const m of adj.get(n) || []) if (!seen.has(m)) { seen.add(m); queue.push(m); }
  }
  return false;
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
    // Un segundo camino entre equipos que ya están unidos forma un bucle.
    if (alreadyConnected(links, nodeOf(aId), nodeOf(bId))) {
      const both = [pa.device, pb.device].sort().join('+');
      const text = both === 'switch+switch2'
        ? 'Los dos switches ya están unidos (directo o a través del router). Otro cable entre ellos formaría un bucle y la red se satura.'
        : `El ${nameOf(pa)} y el ${nameOf(pb)} ya están conectados por otro camino. Un segundo cable formaría un bucle y la red se satura.`;
      return fail('loop', '¡Bucle!', text, 'Con un solo camino entre dos equipos alcanza. Usá los puertos libres para llegar a los sectores.');
    }
    const key = rule.key(pa, pb);
    return { ok: true, key };
  }

  return fail('topology', ...explainTopology(pa, pb));
}

const NAMES = { router: 'router', switch: 'switch', switch2: 'switch 2', ap: 'punto de acceso', patch: 'patch panel', ont: 'ONT', odf: 'entrada de fibra' };
const nameOf = (pt) => NAMES[pt.device] || pt.device;

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

/**
 * Qué pasos de la instalación están cumplidos (claves de level.required).
 * Se mide por conectividad real, no por un cableado único: cualquier camino que
 * funcione vale.
 */
export function doneKeys(level, links, net) {
  const done = new Set();
  const okKeys = new Set(links.filter((l) => l.ok).map((l) => l.key));
  if (okKeys.has('fiber')) done.add('fiber');
  if (okKeys.has('ont-router')) done.add('ont-router');
  if (net.reached.has('switch')) done.add('router-switch');
  if (net.reached.has('switch2')) done.add('switch-switch');
  for (const s of SECTORS) if (net.sectors[s.id] === 'green') done.add(`sector-${s.id}`);
  return done;
}

/**
 * Mejoras posibles de una instalación que funciona: conexiones válidas pero
 * no ideales. Devuelve [{title, text}].
 */
export function improvementsFor(links) {
  const ok = links.filter((l) => l.ok);
  const roles = (l) => [PORT_BY_ID[l.a], PORT_BY_ID[l.b]];
  const out = [];

  const direct = ok.filter((l) => {
    const [pa, pb] = roles(l);
    return has(pa, pb, ROLE.LAN, ROLE.PATCH) || has(pa, pb, ROLE.LAN, ROLE.AP);
  });
  if (direct.length) {
    const names = direct.map((l) => SECTORS.find((s) => `sector-${s.id}` === l.key)?.name).filter(Boolean);
    out.push({
      title: `Router directo a ${names.join(', ')}`,
      text: 'Funciona, porque el router trae unos pocos puertos LAN. Pero lo prolijo es que el router salga a un switch y el switch reparta a los sectores: el router administra la red, el switch la distribuye, y así quedan puertos libres en el router.',
    });
  }

  const toSwitches = ok.filter((l) => l.key === 'router-switch' || l.key === 'router-switch2');
  if (toSwitches.length > 1) {
    out.push({
      title: 'El router alimenta a los dos switches',
      text: 'Funciona, pero lo más ordenado es una sola salida del router a un switch principal y, desde ahí, el segundo switch en cascada. La red queda más fácil de seguir y el router conserva puertos libres.',
    });
  } else if (toSwitches.length === 1 && toSwitches[0].key === 'router-switch2' && ok.some((l) => l.key === 'switch-switch')) {
    out.push({
      title: 'El router entra por el Switch 2',
      text: 'Funciona igual, pero por convención el router se conecta al switch principal (el de arriba) y el Switch 2 cuelga de él. Así cualquier técnico entiende la red de un vistazo.',
    });
  }
  return out;
}
