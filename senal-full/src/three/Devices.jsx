import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../game/store.js';
import { DEVICE_TYPES } from '../game/devices.js';
import { toWorld, startDeviceDrag } from './placement.js';

// Altura de montaje de cada equipo (los AP van "en el techo")
const MOUNT = { router: 0.9, switch: 0.9, ap: 1.9, apOut: 2.1 };

function Model({ type, ghost = false }) {
  const t = DEVICE_TYPES[type];
  const matProps = ghost ? { transparent: true, opacity: 0.55, depthWrite: false } : {};
  const h = MOUNT[type];
  return (
    <group>
      {/* soporte */}
      {type === 'ap' || type === 'apOut' ? (
        <mesh position={[0, h / 2, 0]}>
          <cylinderGeometry args={[0.05, 0.05, h, 6]} />
          <meshStandardMaterial color="#94a3b8" {...matProps} />
        </mesh>
      ) : (
        <mesh position={[0, (h - 0.1) / 2, 0]}>
          <boxGeometry args={[1.1, h - 0.1, 0.7]} />
          <meshStandardMaterial color="#5b4636" {...matProps} />
        </mesh>
      )}
      {type === 'router' && (
        <group position={[0, h + 0.06, 0]}>
          <mesh>
            <boxGeometry args={[0.9, 0.16, 0.55]} />
            <meshStandardMaterial color={t.color} metalness={0.3} roughness={0.5} {...matProps} />
          </mesh>
          {[-0.35, 0.35].map((x) => (
            <mesh key={x} position={[x, 0.32, -0.22]}>
              <cylinderGeometry args={[0.03, 0.03, 0.55, 6]} />
              <meshStandardMaterial color="#0f172a" {...matProps} />
            </mesh>
          ))}
          <mesh position={[0, 0.02, 0.28]}>
            <boxGeometry args={[0.5, 0.03, 0.01]} />
            <meshBasicMaterial color={t.accent} {...matProps} />
          </mesh>
        </group>
      )}
      {type === 'switch' && (
        <group position={[0, h + 0.05, 0]}>
          <mesh>
            <boxGeometry args={[1.0, 0.12, 0.5]} />
            <meshStandardMaterial color={t.color} metalness={0.4} roughness={0.5} {...matProps} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position={[-0.38 + i * 0.15, 0, 0.255]}>
              <boxGeometry args={[0.1, 0.06, 0.01]} />
              <meshBasicMaterial color={t.accent} {...matProps} />
            </mesh>
          ))}
        </group>
      )}
      {type === 'ap' && (
        <group position={[0, h, 0]}>
          <mesh>
            <cylinderGeometry args={[0.5, 0.55, 0.14, 28]} />
            <meshStandardMaterial color={t.color} roughness={0.35} {...matProps} />
          </mesh>
          <mesh position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.14, 0.2, 24]} />
            <meshBasicMaterial color={t.accent} {...matProps} />
          </mesh>
        </group>
      )}
      {type === 'apOut' && (
        <group position={[0, h, 0]}>
          <mesh>
            <cylinderGeometry args={[0.32, 0.36, 0.5, 16]} />
            <meshStandardMaterial color={t.color} roughness={0.4} {...matProps} />
          </mesh>
          {[-0.18, 0.18].map((x) => (
            <mesh key={x} position={[x, 0.5, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
              <meshStandardMaterial color="#334155" {...matProps} />
            </mesh>
          ))}
          <mesh position={[0, 0.05, 0.34]}>
            <boxGeometry args={[0.2, 0.04, 0.02]} />
            <meshBasicMaterial color={t.accent} {...matProps} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function PlacedDevice({ device }) {
  const map = useGame((s) => s.map);
  const selected = useGame((s) => s.selected === device.id);
  const dragging = useGame((s) => s.drag?.kind === 'move' && s.drag.id === device.id);
  const [x, z] = toWorld(map, device.x, device.y);
  const ring = useRef();
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#22c55e', transparent: true, opacity: 0.85, depthWrite: false }), []);
  useFrame(({ clock }) => {
    const g = useGame.getState();
    const active = g.screen !== 'game' || g.links.active.has(device.id);
    const t = clock.elapsedTime;
    if (selected) ringMat.color.set('#38bdf8');
    else ringMat.color.set(active ? '#22c55e' : '#ef4444');
    ringMat.opacity = active ? 0.85 : 0.45 + 0.4 * Math.abs(Math.sin(t * 4));
    if (ring.current) ring.current.scale.setScalar(selected ? 1.15 + 0.05 * Math.sin(t * 6) : 1);
  });
  if (dragging) return null;
  return (
    <group
      position={[x, 0, z]}
      onPointerDown={(e) => {
        e.stopPropagation();
        startDeviceDrag(e.nativeEvent, device);
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerOver={() => (document.body.style.cursor = 'grab')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]} material={ringMat}>
        <ringGeometry args={[0.65, 0.85, 32]} />
      </mesh>
      {/* zona táctil grande */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 2.4, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Model type={device.type} />
    </group>
  );
}

export function PlacedDevices() {
  const placed = useGame((s) => s.placed);
  return placed.map((d) => <PlacedDevice key={d.id} device={d} />);
}

export function Ghost() {
  const drag = useGame((s) => s.drag);
  const map = useGame((s) => s.map);
  if (!drag || drag.x == null) return null;
  const [x, z] = toWorld(map, drag.x, drag.y);
  return (
    <group position={[x, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
        <ringGeometry args={[0.7, 0.95, 32]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} depthWrite={false} />
      </mesh>
      <Model type={drag.type} ghost />
    </group>
  );
}

const CABLE_COLORS = { 'ont-router': '#3b82f6', 'router-switch': '#22c55e', 'switch-ap': '#22d3ee' };

export function Cables() {
  const links = useGame((s) => s.links);
  const map = useGame((s) => s.map);
  const sel = useGame((s) => s.learnSel);
  const screen = useGame((s) => s.screen);
  const hl = screen === 'learn' && (sel === 'eth' || sel === 'switch');
  return links.cables.map((c, i) => {
    const pts = c.points.map(([x, y]) => {
      const [wx, wz] = toWorld(map, x, y);
      return [wx, 0.16, wz];
    });
    return (
      <Line
        key={`${c.from}-${c.to}-${i}`}
        points={pts}
        color={c.ok ? CABLE_COLORS[c.kind] : '#ef4444'}
        lineWidth={hl ? 6 : 3.5}
        dashed={!c.ok}
        dashSize={0.4}
        gapSize={0.3}
        renderOrder={4}
      />
    );
  });
}
