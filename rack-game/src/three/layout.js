// Disposición visual del rack. Separado de la semántica de red (game/network.js).
// Todas las caras frontales de los equipos quedan en z = FRONT.
export const FRONT = 0.25;
export const U = 0.2;

const dev = (id, x, y, w, h, d, color, extra = {}) => ({
  id,
  pos: [x, y, FRONT - d / 2],
  size: [w, h, d],
  color,
  ...extra,
});

export const DEVICE_LAYOUT = {
  odf: dev('odf', 0, 1.0, 2.4, 0.18, 0.3, '#3d4756', { title: 'ENTRADA DE FIBRA ÓPTICA', subtitle: 'Bandeja ODF · proveedor', textColor: '#e8eef6',
    leds: [{ id: 'light', x: -0.52, y: 0.045, label: 'LUZ' }] }),
  ont: dev('ont', -0.55, 0.5, 1.0, 0.26, 0.4, '#e9edf2', { title: 'ONT', subtitle: 'Conversor óptico / Ethernet', textColor: '#1d2733',
    leds: [
      { id: 'pwr', x: 0.1, y: 0.09, label: 'PWR' },
      { id: 'pon', x: 0.2, y: 0.09, label: 'PON' },
      { id: 'los', x: 0.3, y: 0.09, label: 'LOS' },
      { id: 'lan', x: 0.4, y: 0.09, label: 'LAN' },
    ] }),
  router: dev('router', 0, 0.2, 2.4, 0.18, 0.5, '#151c27', { title: 'ROUTER', subtitle: 'Gateway del colegio', textColor: '#9cc7ff',
    leds: [
      { id: 'pwr', x: 0.45, y: 0.03, label: 'PWR' },
      { id: 'wan', x: 0.54, y: 0.03, label: 'WAN' },
      { id: 'net', x: 0.63, y: 0.03, label: 'NET' },
    ] }),
  switch: dev('switch', 0, -0.2, 2.4, 0.18, 0.5, '#262d36', { title: 'SWITCH', subtitle: '8 puertos Gigabit', textColor: '#b6f3c9',
    leds: [
      { id: 'pwr', x: 0.68, y: 0.03, label: 'PWR' },
      { id: 'up', x: 0.75, y: 0.03, label: 'UP' },
    ] }),
  switch2: dev('switch2', 0, -0.8, 2.4, 0.18, 0.5, '#262d36', { title: 'SWITCH 2', subtitle: 'Switch de acceso', textColor: '#b6f3c9',
    leds: [
      { id: 'pwr', x: 0.68, y: 0.03, label: 'PWR' },
      { id: 'up', x: 0.75, y: 0.03, label: 'UP' },
    ] }),
  patch: dev('patch', 0, -0.6, 2.4, 0.18, 0.12, '#0d1117', { title: 'PATCH PANEL', subtitle: 'Cableado del edificio', textColor: '#e8eef6' }),
};

// Posición local (x, y) de cada puerto sobre la cara frontal de su equipo.
export const PORT_LAYOUT = {
  'odf-in': { x: -0.65, y: 0.0, w: 0.08, h: 0.08 },
  'ont-pon': { x: -0.22, y: -0.04, w: 0.08, h: 0.08 },
  'ont-lan': { x: 0.2, y: -0.04, w: 0.11, h: 0.09 },
  'rt-wan': { x: -0.7, y: 0.015 },
  'rt-lan1': { x: -0.35, y: 0.015 },
  'rt-lan2': { x: -0.15, y: 0.015 },
  'rt-lan3': { x: 0.05, y: 0.015 },
  'rt-lan4': { x: 0.25, y: 0.015 },
  ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`sw-${i + 1}`, { x: -0.75 + i * 0.19, y: 0.015 }])),
  // patch panel de 8 puertos (el nivel 1 usa los primeros 5)
  ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`pp-${i + 1}`, { x: -1.0 + i * 0.22, y: -0.025 }])),
  ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`sw2-${i + 1}`, { x: -0.75 + i * 0.19, y: 0.015 }])),
};

// Punto de acceso Wi-Fi montado en la pared, a la derecha del rack
export const AP_LAYOUT = { pos: [1.72, 0.55, FRONT - 0.05], radius: 0.27 };
PORT_LAYOUT['ap-eth'] = { x: 0, y: -0.17, w: 0.11, h: 0.09, device: 'ap' };

export function portWorldPos(portId, devicePorts) {
  const pl = PORT_LAYOUT[portId];
  const deviceId = devicePorts[portId];
  if (deviceId === 'ap') {
    const [x, y, z] = AP_LAYOUT.pos;
    return [x + pl.x, y + pl.y, z + 0.06];
  }
  const d = DEVICE_LAYOUT[deviceId];
  return [d.pos[0] + pl.x, d.pos[1] + pl.y, FRONT + 0.012];
}

export const RACK = { width: 2.7, height: 2.4, depth: 0.75, postW: 0.1 };

// Colores de cable por tramo
export const CABLE_COLORS = {
  fiber: '#ffd21f',
  'ont-router': '#2f7dff',
  'router-switch': '#22c55e',
  'router-switch2': '#22c55e',
  'sector-aula1': '#f97316',
  'sector-aula2': '#e11d48',
  'sector-lab': '#a855f7',
  'sector-biblio': '#06b6d4',
  'sector-admin': '#f472b6',
  'sector-patio': '#84cc16',
  'sector-info': '#d946ef',
  'sector-gym': '#16a34a',
  'sector-profes': '#94a3b8',
  'switch-switch': '#14b8a6',
  wrong: '#ef4444',
};
