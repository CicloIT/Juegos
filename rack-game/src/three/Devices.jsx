import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../game/store.js';
import { PORTS, portsFor } from '../game/network.js';
import { DEVICE_LAYOUT, PORT_LAYOUT, AP_LAYOUT, RACK, U } from './layout.js';
import { deviceFaceTexture, labelTexture, rackRailTexture } from './faceTexture.js';
import Port from './Port.jsx';
import { markHandled } from './interaction.js';
import { sfx } from '../audio/sound.js';

const HL = new THREE.Color('#38bdf8');
const WIN = new THREE.Color('#22c55e');

function selectFromScene(id) {
  markHandled();
  const g = useGame.getState();
  if (g.screen === 'learn') {
    g.setLearnSel(id);
    sfx('click');
  }
}

/** Devuelve si el equipo debe resaltarse (modo aprendizaje o foco desde el panel). */
function isHighlighted(g, id) {
  if (g.screen === 'learn') return g.learnSel === id;
  return g.focusDevice === id;
}

function useHighlight(materials, id) {
  useFrame(({ clock }) => {
    const g = useGame.getState();
    if (g.status === 'won' && g.screen === 'game') {
      // celebración: todo el rack late en verde
      const k = 0.07 + 0.07 * Math.sin(clock.elapsedTime * 6);
      for (const m of materials) m.emissive.copy(WIN).multiplyScalar(k);
      return;
    }
    const on = isHighlighted(g, id);
    const k = on ? 0.25 + 0.2 * Math.sin(clock.elapsedTime * 4) : 0;
    for (const m of materials) m.emissive.copy(HL).multiplyScalar(k);
  });
}

// --- LEDs de estado de cada equipo ---
function statusOf(deviceId, ledId, g, t) {
  const has = (key) => g.links.some((l) => l.ok && l.key === key && g.net.activeLinks.has(l.id));
  const blink = (f) => (Math.sin(t * f) > -0.2 ? 'green' : 'off');
  switch (`${deviceId}.${ledId}`) {
    case 'odf.light':
      return 'green';
    case 'ont.pwr':
    case 'router.pwr':
    case 'switch.pwr':
      return 'green';
    case 'ont.pon':
      return has('fiber') ? 'green' : 'off';
    case 'ont.los':
      return has('fiber') ? 'off' : Math.sin(t * 5) > 0 ? 'red' : 'off';
    case 'ont.lan':
      return has('ont-router') ? blink(19) : 'off';
    case 'router.wan':
      return has('ont-router') ? blink(17) : 'amber';
    case 'router.net':
      return has('ont-router') ? 'green' : 'red';
    case 'switch.up':
      return has('router-switch') ? blink(21) : 'off';
    case 'switch2.pwr':
      return 'green';
    case 'switch2.up':
      return has('switch-switch') ? blink(19) : 'off';
    default:
      return 'off';
  }
}
const LEDC = { off: new THREE.Color('#14181e'), green: new THREE.Color('#22ff77'), amber: new THREE.Color('#ffb020'), red: new THREE.Color('#ff2a2a') };

function StatusLeds({ layout }) {
  const mats = useMemo(() => (layout.leds || []).map(() => new THREE.MeshStandardMaterial({ color: '#14181e', emissive: '#000' })), [layout]);
  useFrame(({ clock }) => {
    const g = useGame.getState();
    (layout.leds || []).forEach((led, i) => {
      const st = statusOf(layout.id, led.id, g, clock.elapsedTime);
      mats[i].color.copy(LEDC[st]);
      mats[i].emissive.copy(LEDC[st]).multiplyScalar(st === 'off' ? 0 : 1.8);
    });
  });
  const [, , d] = layout.size;
  return (layout.leds || []).map((led, i) => (
    <mesh key={led.id} position={[led.x, led.y, d / 2 + 0.006]} material={mats[i]}>
      <boxGeometry args={[0.022, 0.014, 0.01]} />
    </mesh>
  ));
}

export function Device({ layout, ports }) {
  const [w, h, d] = layout.size;
  const tex = useMemo(() => deviceFaceTexture(layout, ports), [layout, ports]);
  const mats = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({ color: new THREE.Color(layout.color).offsetHSL(0, 0, -0.05), metalness: 0.5, roughness: 0.45 });
    const front = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.25, roughness: 0.55 });
    return [side, side, side, side, front, side];
  }, [layout, tex]);
  useHighlight([mats[0], mats[4]], layout.id === 'odf' ? 'fiber' : layout.id === 'switch2' ? 'switch' : layout.id);
  return (
    <group position={layout.pos}>
      <mesh material={mats} onPointerDown={(e) => { e.stopPropagation(); selectFromScene(layout.id === 'odf' ? 'fiber' : layout.id); }}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      <StatusLeds layout={layout} />
      {ports.map((p) => {
        const pl = PORT_LAYOUT[p.id];
        return <Port key={p.id} port={p} position={[pl.x, pl.y, d / 2 + 0.012]} />;
      })}
    </group>
  );
}

// --- Punto de acceso Wi-Fi en la pared ---
export function AccessPoint() {
  const { pos, radius } = AP_LAYOUT;
  const port = PORTS.find((p) => p.id === 'ap-eth');
  const pl = PORT_LAYOUT['ap-eth'];
  const body = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f1f4f8', roughness: 0.35, metalness: 0.1 }), []);
  const ring = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1b2533', emissive: '#000' }), []);
  const waveMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#7dd3fc', transparent: true, opacity: 0, depthWrite: false }), []);
  const waves = useRef([]);
  const tex = useMemo(() => labelTexture('AP WI-FI · PATIO', { color: '#e8eef6', size: 56 }), []);
  useHighlight([body], 'ap');
  useFrame(({ clock }) => {
    const g = useGame.getState();
    const on = g.net.sectors.patio === 'green';
    ring.emissive.set(on ? '#38bdf8' : '#000').multiplyScalar(on ? 1.2 : 0);
    ring.color.set(on ? '#38bdf8' : '#1b2533');
    waves.current.forEach((m, i) => {
      if (!m) return;
      const ph = (clock.elapsedTime * 0.6 + i / 3) % 1;
      m.scale.setScalar(0.6 + ph * 1.2);
      m.material.opacity = on ? (1 - ph) * 0.5 : 0;
    });
  });
  return (
    <group position={pos}>
      {/* soporte de pared */}
      <mesh position={[0, 0, -0.08]}>
        <boxGeometry args={[0.5, 0.5, 0.04]} />
        <meshStandardMaterial color="#2a313b" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={body} onPointerDown={(e) => { e.stopPropagation(); selectFromScene('ap'); }}>
        <cylinderGeometry args={[radius, radius * 1.05, 0.08, 40]} />
      </mesh>
      <mesh position={[0, 0.05, 0.042]} material={ring}>
        <ringGeometry args={[0.07, 0.09, 32]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(m) => (waves.current[i] = m)} position={[0, 0.05, 0.05]} material={waveMat.clone()}>
          <ringGeometry args={[0.28, 0.3, 48, 1, Math.PI * 0.15, Math.PI * 0.7]} />
        </mesh>
      ))}
      <Port port={port} position={[pl.x, pl.y, 0.05]} />
      <mesh position={[0, -radius - 0.12, 0]}>
        <planeGeometry args={[0.16 * tex.userData.aspect, 0.16]} />
        <meshBasicMaterial map={tex} transparent />
      </mesh>
    </group>
  );
}

// --- Estructura del rack ---
export function RackFrame() {
  const { width: W, height: H, depth: D, postW } = RACK;
  const rail = useMemo(() => rackRailTexture(), []);
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2b323c', metalness: 0.6, roughness: 0.4 }), []);
  const railMat = useMemo(() => new THREE.MeshStandardMaterial({ map: rail, metalness: 0.5, roughness: 0.45 }), [rail]);
  const side = useMemo(() => new THREE.MeshStandardMaterial({ color: '#161b22', metalness: 0.4, roughness: 0.6 }), []);
  useHighlight([metal, railMat, side], 'rack');
  const zf = 0.27;
  const onDown = (e) => {
    e.stopPropagation();
    selectFromScene('rack');
  };
  return (
    <group onPointerDown={onDown}>
      {/* parantes frontales y traseros */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * (W / 2 - postW / 2), 0, zf]} material={railMat}>
            <boxGeometry args={[postW, H, 0.03]} />
          </mesh>
          <mesh position={[s * (W / 2 - postW / 2), 0, zf - D]} material={metal}>
            <boxGeometry args={[postW, H, 0.03]} />
          </mesh>
          {/* paneles laterales */}
          <mesh position={[s * W / 2, 0, zf - D / 2]} material={side}>
            <boxGeometry args={[0.03, H, D]} />
          </mesh>
        </group>
      ))}
      {/* techo y base */}
      <mesh position={[0, H / 2 + 0.03, zf - D / 2]} material={metal}>
        <boxGeometry args={[W + 0.04, 0.06, D + 0.04]} />
      </mesh>
      <mesh position={[0, -H / 2 - 0.06, zf - D / 2]} material={metal}>
        <boxGeometry args={[W + 0.04, 0.12, D + 0.04]} />
      </mesh>
      {/* fondo */}
      <mesh position={[0, 0, zf - D + 0.02]} material={side}>
        <boxGeometry args={[W, H, 0.02]} />
      </mesh>
      {/* ruedas */}
      {[-1, 1].map((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.1), -H / 2 - 0.17, zf - D / 2 + sz * (D / 2 - 0.1)]}>
          <cylinderGeometry args={[0.05, 0.05, 0.08, 12]} />
          <meshStandardMaterial color="#0a0c10" />
        </mesh>
      )))}
    </group>
  );
}

// Elementos complementarios: bandeja del ONT, organizadores, tapas, PDU
export function RackAccessories() {
  const hasSwitch2 = useGame((st) => st.level.devices.includes('switch2'));
  const zf = 0.25;
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1f27', metalness: 0.5, roughness: 0.5 }), []);
  const ringMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#30363f', metalness: 0.4, roughness: 0.5 }), []);
  const blank = useMemo(() => new THREE.MeshStandardMaterial({ color: '#12161c', metalness: 0.4, roughness: 0.6 }), []);
  const pduLed = useMemo(() => new THREE.MeshStandardMaterial({ color: '#22ff77', emissive: '#22ff77', emissiveIntensity: 1.5 }), []);
  const pduTex = useMemo(() => labelTexture('PDU · 220V', { color: '#cbd5e1', bg: 'rgba(0,0,0,0)', size: 48 }), []);
  const organizer = (y) => (
    <group position={[0, y, zf - 0.02]}>
      <mesh material={dark}>
        <boxGeometry args={[2.4, 0.16, 0.04]} />
      </mesh>
      {[-0.9, -0.45, 0, 0.45, 0.9].map((x) => (
        <mesh key={x} position={[x, 0, 0.05]} material={ringMat}>
          <torusGeometry args={[0.05, 0.012, 6, 16, Math.PI]} />
        </mesh>
      ))}
    </group>
  );
  return (
    <group>
      {/* tapa ciega bajo la entrada de fibra */}
      <mesh position={[0, 1.1 - U * 1.5, zf - 0.01]} material={blank}>
        <boxGeometry args={[2.4, 0.18, 0.02]} />
      </mesh>
      {/* bandeja del ONT */}
      <mesh position={[0, 0.355, zf - 0.25]} material={dark}>
        <boxGeometry args={[2.4, 0.02, 0.5]} />
      </mesh>
      {organizer(0.0)}
      {organizer(-0.4)}
      {!hasSwitch2 && (
        <mesh position={[0, -0.8, zf - 0.01]} material={blank}>
          <boxGeometry args={[2.4, 0.18, 0.02]} />
        </mesh>
      )}
      {/* PDU */}
      <group position={[0, -1.0, zf - 0.1]}>
        <mesh material={dark}>
          <boxGeometry args={[2.4, 0.18, 0.2]} />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[-0.6 + i * 0.25, 0, 0.105]}>
            <boxGeometry args={[0.12, 0.1, 0.01]} />
            <meshStandardMaterial color="#0b0d10" />
          </mesh>
        ))}
        <mesh position={[0.95, 0.02, 0.105]} material={pduLed}>
          <boxGeometry args={[0.02, 0.02, 0.01]} />
        </mesh>
        <mesh position={[-0.92, 0, 0.106]}>
          <planeGeometry args={[0.07 * pduTex.userData.aspect, 0.07]} />
          <meshBasicMaterial map={pduTex} transparent />
        </mesh>
      </group>
    </group>
  );
}

export function AllDevices() {
  const level = useGame((st) => st.level);
  const ports = useMemo(() => portsFor(level), [level]);
  return (
    <>
      {Object.values(DEVICE_LAYOUT)
        .filter((l) => level.devices.includes(l.id))
        .map((l) => (
          <Device key={l.id} layout={l} ports={ports.filter((p) => p.device === l.id)} />
        ))}
      <AccessPoint />
    </>
  );
}
