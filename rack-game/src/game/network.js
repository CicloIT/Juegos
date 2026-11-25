// Definición semántica de la red: equipos, puertos y sectores del colegio.
// No contiene nada visual: la vista (3D o 2D) lee estos datos.

export const MEDIUM = { FIBER: 'fiber', ETH: 'eth' };

// Roles de puerto: definen qué se puede conectar con qué (ver rules.js)
export const ROLE = {
  ODF: 'odf',            // entrada de fibra del proveedor
  ONT_PON: 'ont-pon',    // entrada óptica del ONT
  ONT_LAN: 'ont-lan',    // salida Ethernet del ONT
  WAN: 'router-wan',
  LAN: 'router-lan',
  SWITCH: 'switch',
  PATCH: 'patch',
  AP: 'ap',
};

export const DEVICES = {
  odf: { id: 'odf', name: 'Entrada de fibra', short: 'FIBRA' },
  ont: { id: 'ont', name: 'ONT', short: 'ONT' },
  router: { id: 'router', name: 'Router', short: 'ROUTER' },
  switch: { id: 'switch', name: 'Switch', short: 'SWITCH' },
  switch2: { id: 'switch2', name: 'Switch 2', short: 'SWITCH 2' },
  patch: { id: 'patch', name: 'Patch panel', short: 'PATCH' },
  ap: { id: 'ap', name: 'Punto de acceso Wi-Fi', short: 'AP' },
};

const p = (id, device, role, medium, label) => ({ id, device, role, medium, label });

export const PORTS = [
  p('odf-in', 'odf', ROLE.ODF, MEDIUM.FIBER, 'FIBRA'),
  p('ont-pon', 'ont', ROLE.ONT_PON, MEDIUM.FIBER, 'PON'),
  p('ont-lan', 'ont', ROLE.ONT_LAN, MEDIUM.ETH, 'LAN'),
  p('rt-wan', 'router', ROLE.WAN, MEDIUM.ETH, 'WAN'),
  p('rt-lan1', 'router', ROLE.LAN, MEDIUM.ETH, 'LAN 1'),
  p('rt-lan2', 'router', ROLE.LAN, MEDIUM.ETH, 'LAN 2'),
  p('rt-lan3', 'router', ROLE.LAN, MEDIUM.ETH, 'LAN 3'),
  p('rt-lan4', 'router', ROLE.LAN, MEDIUM.ETH, 'LAN 4'),
  ...Array.from({ length: 8 }, (_, i) => p(`sw-${i + 1}`, 'switch', ROLE.SWITCH, MEDIUM.ETH, `${i + 1}`)),
  p('pp-1', 'patch', ROLE.PATCH, MEDIUM.ETH, 'AULA 1'),
  p('pp-2', 'patch', ROLE.PATCH, MEDIUM.ETH, 'AULA 2'),
  p('pp-3', 'patch', ROLE.PATCH, MEDIUM.ETH, 'LAB'),
  p('pp-4', 'patch', ROLE.PATCH, MEDIUM.ETH, 'BIBLIO'),
  p('pp-5', 'patch', ROLE.PATCH, MEDIUM.ETH, 'ADMIN'),
  p('pp-6', 'patch', ROLE.PATCH, MEDIUM.ETH, 'INFO'),
  p('pp-7', 'patch', ROLE.PATCH, MEDIUM.ETH, 'GIMNASIO'),
  p('pp-8', 'patch', ROLE.PATCH, MEDIUM.ETH, 'PROFES'),
  ...Array.from({ length: 8 }, (_, i) => p(`sw2-${i + 1}`, 'switch2', ROLE.SWITCH, MEDIUM.ETH, `${i + 1}`)),
  p('ap-eth', 'ap', ROLE.AP, MEDIUM.ETH, 'ETH'),
];

export const PORT_BY_ID = Object.fromEntries(PORTS.map((x) => [x.id, x]));

export const SECTORS = [
  { id: 'aula1', name: 'Aula 1', icon: '📚', terminal: 'pp-1' },
  { id: 'aula2', name: 'Aula 2', icon: '✏️', terminal: 'pp-2' },
  { id: 'lab', name: 'Laboratorio de electromecánica', icon: '⚙️', terminal: 'pp-3' },
  { id: 'biblio', name: 'Biblioteca', icon: '📖', terminal: 'pp-4' },
  { id: 'admin', name: 'Administración', icon: '🗂️', terminal: 'pp-5' },
  { id: 'patio', name: 'Wi-Fi del patio', icon: '📶', terminal: 'ap-eth' },
  { id: 'info', name: 'Sala de informática', icon: '💻', terminal: 'pp-6' },
  { id: 'gym', name: 'Gimnasio', icon: '🏀', terminal: 'pp-7' },
  { id: 'profes', name: 'Sala de profesores', icon: '☕', terminal: 'pp-8' },
];

// Conexiones necesarias para completar la instalación de un nivel.
export function requiredLinksFor(level) {
  return [
    { key: 'fiber', label: 'Fibra → ONT' },
    { key: 'ont-router', label: 'ONT → Router (WAN)' },
    { key: 'router-switch', label: 'Router (LAN) → Switch' },
    ...(level.devices.includes('switch2') ? [{ key: 'switch-switch', label: 'Switch → Switch 2' }] : []),
    ...SECTORS.filter((s) => level.sectors.includes(s.id)).map((s) => ({ key: `sector-${s.id}`, label: `Switch → ${s.name}` })),
  ];
}

/** Puertos presentes en un nivel (según sus equipos y sectores). */
export function portsFor(level) {
  const terminals = new Set(SECTORS.filter((s) => level.sectors.includes(s.id)).map((s) => s.terminal));
  return PORTS.filter((p) => level.devices.includes(p.device) && (p.role !== ROLE.PATCH || terminals.has(p.id)));
}
