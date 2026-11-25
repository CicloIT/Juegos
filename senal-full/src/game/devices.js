// Tipos de equipo y sus características de cobertura.
// p0: potencia recibida a 1 metro (dBm). Mayor p0 = más alcance.
export const DEVICE_TYPES = {
  router: {
    id: 'router',
    name: 'Router Wi-Fi',
    short: 'Router',
    icon: '🧭',
    p0: -35,
    wifi: true,
    color: '#1e293b',
    accent: '#60a5fa',
    desc: 'Conecta con el ONT y reparte Internet. Tiene Wi-Fi de alcance corto.',
  },
  switch: {
    id: 'switch',
    name: 'Switch',
    short: 'Switch',
    icon: '🔀',
    p0: null,
    wifi: false,
    color: '#334155',
    accent: '#4ade80',
    desc: 'Distribuye la red cableada hacia los puntos de acceso. No emite Wi-Fi.',
  },
  ap: {
    id: 'ap',
    name: 'Access Point interior',
    short: 'AP interior',
    icon: '📶',
    p0: -30,
    wifi: true,
    color: '#f1f5f9',
    accent: '#38bdf8',
    desc: 'Cobertura media, ideal para aulas y pasillos.',
  },
  apOut: {
    id: 'apOut',
    name: 'Access Point exterior',
    short: 'AP exterior',
    icon: '📡',
    p0: -27,
    wifi: true,
    color: '#cbd5e1',
    accent: '#a78bfa',
    desc: 'Más potencia y alcance, pensado para espacios abiertos como el patio.',
  },
};

export const PATH_LOSS_N = 3.0; // exponente de pérdida en interiores
export const THRESHOLDS = { excellent: -60, medium: -67, weak: -74 }; // dBm
export const OK_LEVEL = THRESHOLDS.medium; // nivel mínimo "adecuado"
