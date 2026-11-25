import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../game/store.js';
import { PORT_BY_ID } from '../game/network.js';
import { portWorldPos, CABLE_COLORS, FRONT } from './layout.js';
import { useInteraction, pointerWorld, markHandled } from './interaction.js';
import { sfx } from '../audio/sound.js';

const DEVICE_OF = Object.fromEntries(Object.values(PORT_BY_ID).map((p) => [p.id, p.device]));
const pos = (id) => new THREE.Vector3(...portWorldPos(id, DEVICE_OF));

// orden "aguas arriba" para animar los datos en el sentido correcto
const ORDER = { odf: 0, 'ont-pon': 1, 'ont-lan': 2, 'router-wan': 3, 'router-lan': 4, switch: 5, patch: 6, ap: 6 };

function buildCurve(aId, bId) {
  let a = pos(aId);
  let b = pos(bId);
  if (ORDER[PORT_BY_ID[aId].role] > ORDER[PORT_BY_ID[bId].role]) [a, b] = [b, a];
  const out = 0.16;
  const dist = a.distanceTo(b);
  const sag = 0.12 + dist * 0.12;
  const pts = [
    a.clone(),
    a.clone().add(new THREE.Vector3(0, -0.02, out)),
    new THREE.Vector3((a.x + b.x) / 2, Math.min(a.y, b.y) - sag, FRONT + out + 0.12 + dist * 0.05),
    b.clone().add(new THREE.Vector3(0, -0.02, out)),
    b.clone(),
  ];
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
}

const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
const DOTS = 3;

function Cable({ link }) {
  const curve = useMemo(() => buildCurve(link.a, link.b), [link.a, link.b]);
  const isFiber = link.medium === 'fiber';
  const color = link.ok ? CABLE_COLORS[link.key] || '#3b82f6' : CABLE_COLORS.wrong;
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 56, isFiber ? 0.011 : 0.017, 6, false), [curve, isFiber]);
  const hitGeo = useMemo(() => new THREE.TubeGeometry(curve, 24, 0.05, 5, false), [curve]);

  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, emissive: color, emissiveIntensity: 0.08 }), [color]);
  const plugMat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.4, transparent: true, opacity: 0.92 }), [color]);
  const dotMat = useMemo(() => new THREE.MeshBasicMaterial({ color: isFiber ? '#fff7b0' : '#a5f3fc' }), [isFiber]);
  const dots = useRef([]);
  const grow = useRef(0);
  const meshRef = useRef();
  const ends = useMemo(() => [curve.points[0], curve.points[curve.points.length - 1]], [curve]);
  if (import.meta.env.DEV) {
    // utilidad de pruebas: punto medio del cable (mundo)
    window.__cableMid = window.__cableMid || {};
    window.__cableMid[link.id] = curve;
  }

  useEffect(() => () => {
    geo.dispose();
    hitGeo.dispose();
  }, [geo, hitGeo]);

  useFrame(({ clock }, dt) => {
    // animación de "tendido" del cable
    if (grow.current < 1) {
      grow.current = Math.min(1, grow.current + dt * 3.5);
      geo.setDrawRange(0, Math.floor(geo.index.count * grow.current / 6) * 6);
    }
    const g = useGame.getState();
    const active = g.net.activeLinks.has(link.id);
    const hl = g.screen === 'learn' && (g.learnSel === link.medium || (g.learnSel === 'fiber' && isFiber));
    mat.emissiveIntensity = hl ? 0.5 + 0.3 * Math.sin(clock.elapsedTime * 5) : active ? 0.15 : 0.05;
    const speed = hl ? 0.9 : 0.45;
    dots.current.forEach((m, i) => {
      if (!m) return;
      m.visible = active && grow.current >= 1;
      if (!m.visible) return;
      const t = (clock.elapsedTime * speed + i / DOTS) % 1;
      curve.getPointAt(t, m.position);
    });
  });

  // Prioridad: si el toque cae sobre la boca visible de un puerto LIBRE, gana el puerto
  // (para poder conectarlo aunque tenga un cable colgando delante); si no, gana el cable.
  // Con un cable "en la mano" (puerto elegido) siempre ganan los puertos.
  const freePortBelow = (e) => {
    const links = useGame.getState().links;
    return e.intersections.some((i) => i.object.userData.portCore && !links.some((l) => l.a === i.object.userData.portId || l.b === i.object.userData.portId));
  };
  const holding = () => !!useInteraction.getState().from;
  const onDown = (e) => {
    if (holding() || freePortBelow(e)) return;
    e.stopPropagation();
    markHandled();
    const g = useGame.getState();
    if (g.screen === 'learn') {
      g.setLearnSel(isFiber ? 'fiber' : 'eth');
      sfx('click');
      return;
    }
    if (g.screen === 'game' && g.status === 'playing') g.removeLink(link.id);
  };
  const onUp = (e) => {
    if (holding() || freePortBelow(e)) return;
    e.stopPropagation();
    markHandled();
  };

  return (
    <group>
      <mesh ref={meshRef} geometry={geo} material={mat} />
      <mesh
        geometry={hitGeo}
        material={hitMat}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      />

      {ends.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z + 0.03]} material={plugMat}>
          <boxGeometry args={isFiber ? [0.05, 0.05, 0.06] : [0.075, 0.06, 0.06]} />
        </mesh>
      ))}
      {Array.from({ length: DOTS }, (_, i) => (
        <mesh key={i} ref={(m) => (dots.current[i] = m)} material={dotMat} visible={false}>
          <sphereGeometry args={[isFiber ? 0.018 : 0.022, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
}

export function Cables() {
  const links = useGame((s) => s.links);
  return links.map((l) => <Cable key={l.id} link={l} />);
}

// Cable en curso que sigue al puntero
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -(FRONT + 0.2));
const ray = new THREE.Raycaster();
export function DragCable() {
  const from = useInteraction((s) => s.from);
  const cable = useGame((s) => s.cable);
  const ref = useRef();
  const { camera, size } = useThree();
  if (import.meta.env.DEV) {
    // utilidad de pruebas: posición en pantalla de un puerto
    window.__worldScreen = (v3) => {
      const v = v3.clone().project(camera);
      return [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height];
    };
    window.__portScreen = (id) => {
      const v = pos(id).project(camera);
      return [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height];
    };
  }
  const start = useMemo(() => (from ? pos(from) : new THREE.Vector3()), [from]);
  const mid = useMemo(() => new THREE.Vector3(), []);
  const end = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ pointer }) => {
    ray.setFromCamera(pointer, camera);
    ray.ray.intersectPlane(plane, pointerWorld);
    if (!from || !ref.current) return;
    const hover = useInteraction.getState().hover;
    if (hover && hover !== from) end.copy(pos(hover));
    else end.copy(pointerWorld);
    mid.set((start.x + end.x) / 2, Math.min(start.y, end.y) - 0.15, FRONT + 0.35);
    ref.current.setPoints(start, end, mid);
  });

  if (!from) return null;
  return (
    <QuadraticBezierLine
      ref={ref}
      start={start}
      end={start}
      mid={start}
      color={cable === 'fiber' ? '#ffd21f' : '#60a5fa'}
      lineWidth={5}
      dashed={false}
    />
  );
}
