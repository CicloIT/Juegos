// Niveles: plano, tiempo, equipos disponibles, largo de cables y exigencia de cobertura.
import { SCHOOL_L1, SCHOOL_L2, SCHOOL_L3 } from './maps.js';

export const LEVELS = [
  {
    id: 1,
    name: 'Principiante',
    stars: 1,
    description: 'Edificio chico, pocas paredes y ayudas en cada paso.',
    intro: 'Ubicá los equipos para que todos los sectores tengan señal.',
    map: SCHOOL_L1,
    time: 90,
    budget: { router: 1, switch: 1, ap: 2, apOut: 1 },
    limits: { ontRouter: 10, routerSwitch: 12, switchAp: 36 }, // metros de cable
    minCoverage: 0.8, // fracción del sector con señal adecuada
    helpsDefault: true,
    helpsAllowed: true,
  },
  {
    id: 2,
    name: 'Técnico',
    stars: 2,
    description: 'Colegio más grande, paredes de hormigón, ladrillo, durlock y vidrio. Pocos equipos para tanta superficie.',
    intro: 'El colegio es más grande y las paredes son de distintos materiales. ¡Aprovechá cada equipo!',
    map: SCHOOL_L2,
    time: 100,
    budget: { router: 1, switch: 1, ap: 3, apOut: 1 },
    limits: { ontRouter: 9, routerSwitch: 12, switchAp: 40 },
    minCoverage: 0.8,
    helpsDefault: false,
    helpsAllowed: true,
  },
  {
    id: 3,
    name: 'Experto',
    stars: 3,
    description: 'Edificio completo: gimnasio con gradas de metal, microondas y redes vecinas. 85% de cobertura y sin ayudas.',
    intro: 'Edificio completo con interferencias y obstáculos. Cada sector necesita 85% de buena señal.',
    map: SCHOOL_L3,
    time: 80,
    budget: { router: 1, switch: 1, ap: 4, apOut: 1 },
    limits: { ontRouter: 8, routerSwitch: 10, switchAp: 42 },
    minCoverage: 0.85,
    helpsDefault: false,
    helpsAllowed: false,
  },
];

export const levelById = (id) => LEVELS.find((l) => l.id === id) || LEVELS[0];
