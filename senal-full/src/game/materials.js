// Materiales de paredes y obstáculos con su atenuación aproximada (dB) a 2,4 GHz.
export const MATERIALS = {
  hormigon: { id: 'hormigon', name: 'Hormigón', att: 12, color: '#8d939c', height: 1.1, thick: 0.32 },
  ladrillo: { id: 'ladrillo', name: 'Ladrillo', att: 7, color: '#b8674b', height: 1.0, thick: 0.22 },
  durlock: { id: 'durlock', name: 'Durlock (yeso)', att: 3, color: '#ddd6c6', height: 1.0, thick: 0.12 },
  vidrio: { id: 'vidrio', name: 'Vidrio', att: 2, color: '#9fd8ff', height: 1.0, thick: 0.08 },
  metal: { id: 'metal', name: 'Metal (máquinas)', att: 8, color: '#5b6573', height: 0.9 },
  madera: { id: 'madera', name: 'Madera (estanterías)', att: 4, color: '#8a5a33', height: 1.1 },
};
