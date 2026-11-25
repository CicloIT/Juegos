import { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../game/store.js';
import { MATERIALS } from '../game/materials.js';
import { floorTexture } from './textures.js';
import { toWorld } from './placement.js';

const FLOOR_Y = 0.06;

function Floors({ map }) {
  const tile = useMemo(() => floorTexture('tile'), []);
  const grass = useMemo(() => floorTexture('grass'), []);
  const mats = useRef({});
  useFrame(({ clock }) => {
    const g = useGame.getState();
    const won = g.status === 'won' && g.screen === 'game';
    for (const room of map.rooms) {
      const m = mats.current[room.id];
      if (!m) continue;
      const lvl = g.coverage.sectors[room.id]?.level;
      let k = 0;
      if (won) k = 0.25 + 0.15 * Math.sin(clock.elapsedTime * 5);
      else if (g.screen === 'game' && g.status === 'playing' && lvl === 'green' && !room.notRequired) k = 0.08;
      m.emissive.set('#22c55e').multiplyScalar(k);
    }
  });
  return map.rooms.map((room) => {
    const w = room.x1 - room.x0;
    const d = room.y1 - room.y0;
    const [cx, cz] = toWorld(map, (room.x0 + room.x1) / 2, (room.y0 + room.y1) / 2);
    const tex = (room.outdoor ? grass : tile).clone();
    tex.needsUpdate = true;
    tex.repeat.set(w / 2, d / 2);
    return (
      <mesh key={room.id} position={[cx, FLOOR_Y / 2, cz]} receiveShadow>
        <boxGeometry args={[w, FLOOR_Y, d]} />
        <meshStandardMaterial
          ref={(m) => (mats.current[room.id] = m)}
          map={tex}
          color={room.outdoor ? '#ffffff' : room.floor}
          roughness={0.9}
        />
      </mesh>
    );
  });
}

function Walls({ map }) {
  const mats = useMemo(() => {
    const o = {};
    for (const k of Object.keys(MATERIALS)) {
      const mt = MATERIALS[k];
      o[k] = new THREE.MeshStandardMaterial({
        color: mt.color,
        roughness: k === 'vidrio' ? 0.1 : 0.85,
        metalness: k === 'vidrio' || k === 'metal' ? 0.4 : 0.05,
        transparent: k === 'vidrio',
        opacity: k === 'vidrio' ? 0.35 : 1,
      });
    }
    return o;
  }, []);
  return map.walls.map((w, i) => {
    const mt = MATERIALS[w.mat];
    const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
    const [cx, cz] = toWorld(map, (w.x1 + w.x2) / 2, (w.y1 + w.y2) / 2);
    const horizontal = Math.abs(w.y2 - w.y1) < 1e-6;
    const L = len + (w.mat === 'vidrio' ? 0 : mt.thick);
    return (
      <mesh key={i} position={[cx, mt.height / 2, cz]} material={mats[w.mat]} castShadow>
        <boxGeometry args={horizontal ? [L, mt.height, mt.thick] : [mt.thick, mt.height, L]} />
      </mesh>
    );
  });
}

function Obstacles({ map }) {
  return map.obstacles.map((o, i) => {
    const mt = MATERIALS[o.mat];
    const [cx, cz] = toWorld(map, (o.x0 + o.x1) / 2, (o.y0 + o.y1) / 2);
    return (
      <mesh key={i} position={[cx, mt.height / 2, cz]} castShadow>
        <boxGeometry args={[o.x1 - o.x0, mt.height, o.y1 - o.y0]} />
        <meshStandardMaterial color={mt.color} metalness={o.mat === 'metal' ? 0.6 : 0.1} roughness={0.5} />
      </mesh>
    );
  });
}

// Mobiliario liviano con instancias (una sola llamada de dibujo por tipo)
function Desks({ map }) {
  const ref = useRef();
  const list = map.furniture.desks;
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    list.forEach(([x, y], i) => {
      const [wx, wz] = toWorld(map, x, y);
      m.makeTranslation(wx, 0.38, wz);
      ref.current.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [list, map]);
  return (
    <instancedMesh ref={ref} args={[null, null, list.length]}>
      <boxGeometry args={[1.1, 0.08, 0.6]} />
      <meshStandardMaterial color="#c9a46b" roughness={0.7} />
    </instancedMesh>
  );
}

function Trees({ map }) {
  return map.furniture.trees.map(([x, y], i) => {
    const [wx, wz] = toWorld(map, x, y);
    return (
      <group key={i} position={[wx, 0, wz]}>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.12, 0.16, 1.2, 6]} />
          <meshStandardMaterial color="#6b4a2b" />
        </mesh>
        <mesh position={[0, 1.6, 0]} castShadow>
          <icosahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial color="#2f7d3a" flatShading roughness={0.8} />
        </mesh>
      </group>
    );
  });
}

function Benches({ map }) {
  return map.furniture.benches.map(([x, y], i) => {
    const [wx, wz] = toWorld(map, x, y);
    return (
      <mesh key={i} position={[wx, 0.25, wz]}>
        <boxGeometry args={[2, 0.12, 0.5]} />
        <meshStandardMaterial color="#8a5a33" />
      </mesh>
    );
  });
}

// Llegada de la fibra y ONT fijo
function FiberAndOnt({ map }) {
  const [ox, oz] = toWorld(map, map.ont.x, map.ont.y);
  const [fx, fz] = toWorld(map, map.fiberEntry.x, map.fiberEntry.y);
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3([new THREE.Vector3(fx, 0.15, fz), new THREE.Vector3(ox, 0.15, oz - 0.4), new THREE.Vector3(ox, 0.45, oz)]),
    [fx, fz, ox, oz],
  );
  const pulses = useRef([]);
  const fiberMat = useRef();
  useFrame(({ clock }) => {
    const g = useGame.getState();
    const hl = g.screen === 'learn' && g.learnSel === 'fiber';
    if (fiberMat.current) fiberMat.current.emissiveIntensity = hl ? 1 + Math.sin(clock.elapsedTime * 6) * 0.5 : 0.5;
    pulses.current.forEach((m, i) => {
      if (m) curve.getPointAt((clock.elapsedTime * (hl ? 0.6 : 0.35) + i / 4) % 1, m.position);
    });
  });
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 40, hlRadius(), 6, false]} />
        <meshStandardMaterial ref={fiberMat} color="#ffd21f" emissive="#ffd21f" emissiveIntensity={0.5} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} ref={(m) => (pulses.current[i] = m)}>
          <sphereGeometry args={[0.13, 8, 6]} />
          <meshBasicMaterial color="#fffbe0" />
        </mesh>
      ))}
      <group position={[ox, 0, oz]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.5, 0.6, 0.5]} />
          <meshStandardMaterial color="#2a313b" />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.7, 0.2, 0.45]} />
          <meshStandardMaterial color="#f1f4f8" />
        </mesh>
        <Html position={[0, 1.25, 0]} center className="tag3d ont" zIndexRange={[5, 0]}>
          ONT
        </Html>
      </group>
      <Html position={[fx, 0.6, fz + 0.4]} center className="tag3d fiber" zIndexRange={[5, 0]}>
        Fibra óptica
      </Html>
    </group>
  );
}
const hlRadius = () => 0.08;

const LVL_TXT = { green: 'Señal adecuada', yellow: 'Señal intermedia', orange: 'Señal débil', red: 'Sin cobertura' };

function RoomLabels({ map }) {
  const sectors = useGame((s) => s.coverage.sectors);
  const screen = useGame((s) => s.screen);
  const learnSel = useGame((s) => s.learnSel);
  // en la demo de paredes se muestran los materiales en su lugar
  if (screen === 'learn' && learnSel === 'walls') return null;
  return map.rooms
    .filter((r) => !r.notRequired)
    .map((room) => {
      const [cx, cz] = toWorld(map, (room.x0 + room.x1) / 2, room.outdoor ? room.y0 + 2.6 : (room.y0 + room.y1) / 2);
      const st = sectors[room.id];
      const pct = Math.round((st?.pct || 0) * 100);
      return (
        <Html key={room.id} position={[cx, 2.2, cz]} center className={`room-tag ${st?.level}`} zIndexRange={[5, 0]}>
          <b>
            {room.icon} {room.name}
          </b>
          {screen !== 'menu' && (
            <span>
              <i style={{ width: `${pct}%` }} />
            </span>
          )}
          {screen !== 'menu' && <small>{pct}% · {LVL_TXT[st?.level]}</small>}
        </Html>
      );
    });
}

// Etiquetas de materiales en modo aprendizaje "paredes"
function MaterialTags({ map }) {
  const sel = useGame((s) => s.learnSel);
  const screen = useGame((s) => s.screen);
  if (screen !== 'learn' || sel !== 'walls') return null;
  const tags = [
    { x: 9, y: 11, mat: 'hormigon' },
    { x: 16, y: 11, mat: 'durlock' },
    { x: 6, y: 8, mat: 'ladrillo' },
    { x: 4, y: 14, mat: 'vidrio' },
    { x: 4, y: 10, mat: 'metal' },
    { x: 12.5, y: 11.4, mat: 'madera' },
  ];
  return tags.map((t, i) => {
    const [x, z] = toWorld(map, t.x, t.y);
    const mt = MATERIALS[t.mat];
    return (
      <Html key={i} position={[x, 1.6, z]} center className="tag3d mat" zIndexRange={[6, 0]}>
        {mt.name} <b>−{mt.att} dB</b>
      </Html>
    );
  });
}

function Interference({ map }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const ph = (clock.elapsedTime * 0.8) % 1;
    ref.current.scale.setScalar(0.3 + ph * 1);
    ref.current.material.opacity = (1 - ph) * 0.6;
  });
  return (map.interference || []).map((it, i) => {
    const [x, z] = toWorld(map, it.x, it.y);
    return (
      <group key={i} position={[x, 0, z]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.7, 0.4, 0.5]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
          <ringGeometry args={[it.radius * 0.9, it.radius, 48]} />
          <meshBasicMaterial color="#f43f5e" transparent opacity={0.5} depthWrite={false} />
        </mesh>
        <Html position={[0, 1.4, 0]} center className="tag3d interf" zIndexRange={[6, 0]}>
          📡 {it.name}: interferencia
        </Html>
      </group>
    );
  });
}

export default function School() {
  const map = useGame((s) => s.map);
  const ground = useMemo(() => floorTexture('grass'), []);
  return (
    <group>
      {/* terreno alrededor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#1b2a1a" map={ground} roughness={1} />
      </mesh>
      {/* vereda */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -map.depth / 2 - 2.5]}>
        <planeGeometry args={[map.width + 6, 4]} />
        <meshStandardMaterial color="#3b4048" />
      </mesh>
      <Floors map={map} />
      <Walls map={map} />
      <Obstacles map={map} />
      <Desks map={map} />
      <Trees map={map} />
      <Benches map={map} />
      <FiberAndOnt map={map} />
      <RoomLabels map={map} />
      <MaterialTags map={map} />
      <Interference map={map} />
    </group>
  );
}
