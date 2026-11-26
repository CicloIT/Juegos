// Configuración de niveles.
// devices: equipos presentes en el rack · sectors: sectores a conectar
// prewired: cables ya instalados al empezar (ok:false = mal conectados, hay que quitarlos)
import { requiredLinksFor } from './network.js';

const BASE_SECTORS = ['aula1', 'aula2', 'lab', 'biblio', 'admin', 'patio'];
const ALL_SECTORS = [...BASE_SECTORS, 'info', 'gym', 'profes'];
const BASE_DEVICES = ['odf', 'ont', 'router', 'switch', 'patch', 'ap'];

export const LEVELS = [
  {
    id: 1,
    name: 'Principiante',
    stars: 1,
    description: 'Un switch y 6 sectores. Ayudas visuales y explicaciones en cada error.',
    intro: 'Conectá el rack para que la señal llegue a todos los sectores.',
    time: 90,
    devices: BASE_DEVICES,
    sectors: BASE_SECTORS,
    ethCables: 8,
    helpsDefault: true,
    helpsAllowed: true,
    prewired: [],
  },
  {
    id: 2,
    name: 'Técnico',
    stars: 2,
    description: 'Dos switches en cascada, 9 sectores y más cables. Menos ayudas.',
    intro: 'El colegio creció: hay más sectores y un segundo switch. ¡Uní los switches entre sí!',
    time: 120,
    devices: [...BASE_DEVICES, 'switch2'],
    sectors: ALL_SECTORS,
    ethCables: 12,
    helpsDefault: false,
    helpsAllowed: true,
    prewired: [],
  },
  {
    id: 3,
    name: 'Experto',
    stars: 3,
    description: 'Instalación completa con cables mal conectados de entrada. Menos tiempo y sin ayudas.',
    intro: 'Alguien dejó cables mal conectados (en rojo). Encontralos, quitalos y terminá la instalación.',
    time: 105,
    devices: [...BASE_DEVICES, 'switch2'],
    sectors: ALL_SECTORS,
    ethCables: 12,
    helpsDefault: false,
    helpsAllowed: false,
    prewired: [
      { a: 'ont-lan', b: 'rt-lan2', medium: 'eth', ok: false }, // ONT a un LAN en vez del WAN
      { a: 'pp-2', b: 'ap-eth', medium: 'eth', ok: false }, // patch panel al AP (el patch no reparte)
      { a: 'sw-3', b: 'sw-6', medium: 'eth', ok: false }, // bucle en el switch
      // algunos cables ya están bien puestos
      { a: 'sw2-2', b: 'pp-7', medium: 'eth', ok: true, key: 'sector-gym' },
      { a: 'sw-2', b: 'pp-1', medium: 'eth', ok: true, key: 'sector-aula1' },
    ],
  },
].map((l) => ({ ...l, required: requiredLinksFor(l) }));

export const levelById = (id) => LEVELS.find((l) => l.id === id) || LEVELS[0];
