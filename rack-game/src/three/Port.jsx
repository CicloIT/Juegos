import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../game/store.js';
import { useInteraction, onPortDown, onPortUp } from './interaction.js';
import { PORT_LAYOUT } from './layout.js';

const C = {
  frame: new THREE.Color('#3a4452'),
  hover: new THREE.Color('#9fd6ff'),
  hint: new THREE.Color('#22d3ee'),
  suggest: new THREE.Color('#4ade80'),
  error: new THREE.Color('#ff3b3b'),
  ok: new THREE.Color('#4ade80'),
  from: new THREE.Color('#fbbf24'),
  fiber: new THREE.Color('#2b6cb0'),
};
const LED = {
  off: new THREE.Color('#1a1f26'),
  green: new THREE.Color('#22ff77'),
  amber: new THREE.Color('#ffb020'),
  red: new THREE.Color('#ff2a2a'),
};

const noop = () => {};
const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
const holeMat = new THREE.MeshStandardMaterial({ color: '#05070a', roughness: 0.9 });
const pinMat = new THREE.MeshStandardMaterial({ color: '#c8a24a', metalness: 0.6, roughness: 0.4 });

/** Puerto interactivo (RJ45 o SC de fibra) con su LED. Posición local sobre la cara del equipo. */
export default function Port({ port, position, ledAbove = true }) {
  const pl = PORT_LAYOUT[port.id];
  const w = pl.w || 0.11;
  const h = pl.h || 0.09;
  const isFiber = port.medium === 'fiber';
  const frameRef = useRef();
  const ledRef = useRef();
  const groupRef = useRef();

  const frameMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: isFiber ? '#2b6cb0' : '#3a4452', roughness: 0.5, metalness: 0.3, emissive: '#000000' }),
    [isFiber],
  );
  const ledMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1f26', emissive: '#000000', roughness: 0.3 }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const now = performance.now();
    const g = useGame.getState();
    const it = useInteraction.getState();
    const link = g.links.find((l) => l.a === port.id || l.b === port.id);
    const active = link && g.net.activeLinks.has(link.id);
    const flash = g.flash && g.flash.ports.includes(port.id) && now - g.flash.at < 900 ? g.flash.type : null;

    // marco del puerto
    let col = isFiber ? C.fiber : C.frame;
    let emi = 0;
    const isTarget = g.helps && it.from && it.targets.includes(port.id);
    const isSuggested = g.highlightPorts.includes(port.id);
    if (it.from === port.id) {
      col = C.from;
      emi = 0.8;
    } else if (flash === 'error') {
      col = C.error;
      emi = 0.6 + 0.4 * Math.sin(now / 50);
    } else if (flash === 'ok') {
      col = C.ok;
      emi = 0.8;
    } else if (isTarget) {
      col = C.hint;
      emi = 0.5 + 0.4 * Math.sin(t * 8);
    } else if (isSuggested) {
      col = C.suggest;
      emi = 0.4 + 0.4 * Math.sin(t * 6);
    } else if (it.hover === port.id) {
      col = C.hover;
      emi = 0.35;
    }
    frameMat.color.copy(col);
    frameMat.emissive.copy(col).multiplyScalar(emi);

    // vibración en error
    if (groupRef.current) groupRef.current.position.x = position[0] + (flash === 'error' ? Math.sin(now / 18) * 0.008 : 0);

    // LED
    let lc = LED.off;
    let li = 0;
    if (flash === 'error') {
      lc = LED.red;
      li = 2;
    } else if (active) {
      lc = LED.green;
      li = Math.sin(t * 23 + position[0] * 40) > -0.3 ? 2 : 0.4; // parpadeo de actividad
    } else if (link && !link.ok) {
      lc = LED.red;
      li = Math.sin(t * 6) > 0 ? 1.6 : 0.2;
    } else if (link) {
      lc = LED.amber;
      li = 1.4;
    }
    ledMat.color.copy(li > 0 ? lc : LED.off);
    ledMat.emissive.copy(lc).multiplyScalar(li);

    const target = it.hover === port.id || it.from === port.id || isTarget ? 1.12 : 1;
    const sc = groupRef.current.scale.x + (target - groupRef.current.scale.x) * 0.25;
    groupRef.current.scale.setScalar(sc);
  });

  const handlers = {
    onPointerDown: (e) => {
      e.stopPropagation();
      onPortDown(port.id);
    },
    onPointerUp: (e) => {
      e.stopPropagation();
      onPortUp(port.id);
    },
    onPointerOver: (e) => {
      e.stopPropagation();
      useInteraction.getState().setHover(port.id);
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      if (useInteraction.getState().hover === port.id) useInteraction.getState().setHover(null);
      document.body.style.cursor = '';
    },
  };

  return (
    <group ref={groupRef} position={position}>
      {/* marco */}
      {/* el marco visible marca la zona "real" del puerto (ver prioridad con cables) */}
      <mesh ref={frameRef} material={frameMat} userData={{ portCore: true, portId: port.id }} onPointerDown={noop}>
        <boxGeometry args={[w, h, 0.02]} />
      </mesh>
      {/* boca del conector */}
      <mesh position={[0, isFiber ? 0 : -0.004, 0.006]} material={holeMat}>
        <boxGeometry args={[w * 0.72, h * (isFiber ? 0.6 : 0.62), 0.012]} />
      </mesh>
      {!isFiber && (
        <mesh position={[0, h * 0.18, 0.009]} material={pinMat}>
          <boxGeometry args={[w * 0.55, h * 0.08, 0.008]} />
        </mesh>
      )}
      {/* LED */}
      <mesh ref={ledRef} position={ledAbove ? [w / 2 - 0.012, h / 2 + 0.018, 0.004] : [w / 2 + 0.02, 0, 0.004]} material={ledMat}>
        <boxGeometry args={[0.018, 0.012, 0.01]} />
      </mesh>
      {/* zona táctil ampliada */}
      <mesh material={hitMat} position={[0, 0, 0.02]} userData={{ portHit: true, portId: port.id }} {...handlers}>
        <boxGeometry args={[Math.max(w, 0.17), 0.17, 0.05]} />
      </mesh>
    </group>
  );
}
