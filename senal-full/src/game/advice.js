// Explicaciones educativas según dónde se ubicó un equipo.
// Recibe el estado ya calculado y devuelve un mensaje corto: {kind, title, text, hint}.
import { DEVICE_TYPES } from './devices.js';
import { pathAttenuation } from './signal.js';
import { MATERIALS } from './materials.js';

const m = (n) => `${Math.round(n)} m`;
export const OVERLAP_DIST = 5;

export function roomAt(map, x, y) {
  return map.rooms.find((r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1);
}

export function overlappingPairs(placed) {
  const wifi = placed.filter((d) => DEVICE_TYPES[d.type].wifi);
  let n = 0;
  for (let i = 0; i < wifi.length; i++)
    for (let j = i + 1; j < wifi.length; j++)
      if (Math.hypot(wifi[i].x - wifi[j].x, wifi[i].y - wifi[j].y) < OVERLAP_DIST) n++;
  return n;
}

export function adviceFor({ device, map, placed, links, coverage, blockers, level }) {
  const issue = links.issues[device.id];
  const type = DEVICE_TYPES[device.type];
  if (issue) {
    switch (issue.code) {
      case 'router-far':
        return warn('Router sin conexión', `El router está a ${m(issue.len)} del ONT y el cable alcanza ${m(issue.max)}.`, 'La fibra llega a la Sala de informática: ubicá el router cerca del ONT.');
      case 'no-router':
        return warn('Falta el router', 'El switch recibe la red desde el router.', 'Instalá primero el router cerca del ONT.');
      case 'switch-far':
        return warn('Switch muy lejos', `El cable del router al switch mediría ${m(issue.len)} (máximo ${m(issue.max)}).`, 'Acercá el switch al router.');
      case 'no-switch':
        return warn('AP sin cable', 'Los puntos de acceso se conectan a la red mediante Ethernet.', 'Instalá el switch: él distribuye la red hacia los AP.');
      case 'ap-far':
        return warn('Demasiado lejos del switch', `El cable mediría ${m(issue.len)} y el máximo es ${m(issue.max)}.`, 'Acercá el punto de acceso o mové el switch a un lugar más central.');
      case 'router-off':
      case 'switch-off':
        return warn('Sin Internet aguas arriba', 'Este equipo está cableado, pero el equipo anterior no tiene conexión.', 'Revisá el camino: ONT → Router → Switch → AP.');
      default:
        break;
    }
  }

  if (!type.wifi) {
    if (device.type === 'switch') return ok('Switch conectado', 'Ahora los puntos de acceso pueden recibir la red por cable.', null);
    return null;
  }

  // dos emisores muy juntos
  const close = placed.find((d) => d.id !== device.id && DEVICE_TYPES[d.type].wifi && Math.hypot(d.x - device.x, d.y - device.y) < OVERLAP_DIST);
  if (close) {
    return warn('Demasiado cerca', 'Colocar dos puntos de acceso demasiado cerca puede generar una distribución poco eficiente: sus zonas se superponen.', 'Separalos para cubrir más superficie con los mismos equipos.');
  }

  // AP exterior metido adentro del edificio
  const room = roomAt(map, device.x, device.y);
  const patio = map.rooms.find((r) => r.id === 'patio');
  if (device.type === 'apOut' && room && !room.outdoor && patio && patio.y0 - device.y > 3) {
    return warn('AP exterior adentro', 'El AP exterior está pensado para espacios abiertos.', 'El patio necesita un punto de acceso con cobertura adecuada: probalo cerca del patio.');
  }

  // sector más débil y por qué
  const required = map.rooms.filter((r) => !r.notRequired);
  const weakest = required.reduce((a, b) => (coverage.sectors[a.id].pct <= coverage.sectors[b.id].pct ? a : b));
  const wp = coverage.sectors[weakest.id].pct;
  if (wp < level.minCoverage) {
    if (weakest.id === 'patio') {
      return info('El patio sigue débil', 'El patio necesita un punto de acceso con cobertura adecuada.', 'Un AP exterior cerca del patio cubre mejor los espacios abiertos.');
    }
    const cx = (weakest.x0 + weakest.x1) / 2;
    const cy = (weakest.y0 + weakest.y1) / 2;
    const noise = (map.interference || []).find((it) => Math.hypot(cx - it.x, cy - it.y) < it.radius + 2);
    if (noise) {
      return info(`${weakest.name}: interferencia`, `El ${noise.name.toLowerCase()} interfiere y empeora la calidad de la señal cerca.`, `Necesitás un emisor más cerca de ${weakest.name} para compensar.`);
    }
    const mats = [];
    pathAttenuation(blockers, device.x, device.y, cx, cy, mats);
    const dist = Math.hypot(cx - device.x, cy - device.y);
    if (mats.includes('hormigon')) {
      return info(`${weakest.name}: señal débil`, `Las paredes gruesas de hormigón reducen mucho la intensidad de la señal (−${MATERIALS.hormigon.att} dB cada una).`, `Acercá un equipo o ubicalo del mismo lado del muro que ${weakest.name}.`);
    }
    if (mats.includes('metal') || mats.includes('madera')) {
      return info(`${weakest.name}: señal débil`, 'La señal no atraviesa todos los materiales con la misma intensidad: máquinas y estanterías la debilitan.', 'Buscá una ubicación con menos obstáculos en el camino.');
    }
    if (dist > 12) {
      return info(`${weakest.name}: señal débil`, `${device.type === 'router' ? 'El router' : 'Este punto de acceso'} está demasiado lejos de ${weakest.name} (${m(dist)}).`, 'La señal pierde intensidad con la distancia.');
    }
    if (mats.length >= 2) {
      return info(`${weakest.name}: señal débil`, `Para llegar a ${weakest.name} la señal cruza ${mats.length} paredes, y cada una resta intensidad.`, 'Las puertas y pasillos ayudan a que la señal llegue mejor.');
    }
  }
  return ok('¡Buena ubicación!', `Cobertura total: ${Math.round(coverage.totalPct * 100)}%.`, null);
}

const warn = (title, text, hint) => ({ kind: 'warn', title, text, hint });
const info = (title, text, hint) => ({ kind: 'info', title, text, hint });
const ok = (title, text, hint) => ({ kind: 'ok', title, text, hint });
