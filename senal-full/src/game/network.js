// Conexiones físicas simplificadas: Fibra → ONT → Router → Switch → Access Points.
// Los cables se tienden automáticamente en "L" (como canaletas) y tienen largo máximo.

export function cableLength(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** Recorrido en L del cable (primero en x, después en y). */
export function cablePath(a, b) {
  return [
    [a.x, a.y],
    [b.x, a.y],
    [b.x, b.y],
  ];
}

/**
 * Determina qué equipos están conectados y los cables a dibujar.
 * @returns {active:Set<id>, cables:[{from,to,points,len,max,ok,kind}], issues:{[id]: {code, ...}}}
 */
export function computeLinks(map, placed, limits) {
  const active = new Set();
  const cables = [];
  const issues = {};
  const ont = { id: 'ont', x: map.ont.x, y: map.ont.y };
  const router = placed.find((d) => d.type === 'router');
  const sw = placed.find((d) => d.type === 'switch');

  if (router) {
    const len = cableLength(ont, router);
    const ok = len <= limits.ontRouter;
    cables.push({ from: 'ont', to: router.id, points: cablePath(ont, router), len, max: limits.ontRouter, ok, kind: 'ont-router' });
    if (ok) active.add(router.id);
    else issues[router.id] = { code: 'router-far', len, max: limits.ontRouter };
  }
  if (sw) {
    if (!router) issues[sw.id] = { code: 'no-router' };
    else {
      const len = cableLength(router, sw);
      const ok = len <= limits.routerSwitch;
      cables.push({ from: router.id, to: sw.id, points: cablePath(router, sw), len, max: limits.routerSwitch, ok, kind: 'router-switch' });
      if (ok && active.has(router.id)) active.add(sw.id);
      else if (!ok) issues[sw.id] = { code: 'switch-far', len, max: limits.routerSwitch };
      else issues[sw.id] = { code: 'router-off' };
    }
  }
  for (const ap of placed.filter((d) => d.type === 'ap' || d.type === 'apOut')) {
    if (!sw) {
      issues[ap.id] = { code: 'no-switch' };
      continue;
    }
    const len = cableLength(sw, ap);
    const ok = len <= limits.switchAp;
    cables.push({ from: sw.id, to: ap.id, points: cablePath(sw, ap), len, max: limits.switchAp, ok, kind: 'switch-ap' });
    if (ok && active.has(sw.id)) active.add(ap.id);
    else if (!ok) issues[ap.id] = { code: 'ap-far', len, max: limits.switchAp };
    else issues[ap.id] = { code: 'switch-off' };
  }
  return { active, cables, issues, ont };
}
