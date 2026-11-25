import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../game/store.js';
import { useInteraction } from './interaction.js';
import { AllDevices, RackFrame, RackAccessories } from './Devices.jsx';
import { Cables, DragCable } from './Cables.jsx';
import { labelTexture } from './faceTexture.js';

// Encuadre de cámara por pantalla (posición x,y,z y punto de mira)
const SHOTS = {
  menu: { pos: [-1.55, 0.15, 5.4], look: [-1.55, 0.05, 0] },
  learn: { pos: [1.62, 0.1, 5.3], look: [1.62, 0.05, 0] },
  game: { pos: [0.33, 0.0, 5.5], look: [0.33, 0.0, 0] },
};

export const fpsRef = { el: null };

function CameraRig() {
  const { camera, gl } = useThree();
  const look = useRef(new THREE.Vector3());
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tmpLook = useMemo(() => new THREE.Vector3(), []);

  // zoom con la rueda del mouse (solo en juego)
  useEffect(() => {
    const onWheel = (e) => {
      if (useGame.getState().screen !== 'game') return;
      const it = useInteraction.getState();
      it.setZoom(it.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    };
    const el = gl.domElement;
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => el.removeEventListener('wheel', onWheel);
  }, [gl]);

  useFrame(({ clock, pointer }, dt) => {
    const g = useGame.getState();
    const it = useInteraction.getState();
    const shot = SHOTS[g.screen] || SHOTS.game;
    const t = clock.elapsedTime;
    const z = g.screen === 'game' ? it.zoom : 1;
    const [px, py] = g.screen === 'game' ? it.pan : [0, 0];
    tmp.set(shot.pos[0] + px, shot.pos[1] + py, shot.pos[2] / z);
    tmpLook.set(shot.look[0] + px, shot.look[1] + py, shot.look[2]);
    if (g.screen === 'menu') {
      tmp.x += Math.sin(t * 0.25) * 0.35 + pointer.x * 0.2;
      tmp.y += Math.sin(t * 0.18) * 0.12 + pointer.y * 0.12;
    } else {
      tmp.x += pointer.x * 0.06;
      tmp.y += pointer.y * 0.04;
    }
    // sacudida en error
    const since = performance.now() - g.shake;
    if (since < 300) {
      const k = (1 - since / 300) * 0.03;
      tmp.x += Math.sin(since * 0.12) * k;
      tmp.y += Math.cos(since * 0.15) * k;
    }
    const f = 1 - Math.pow(0.02, dt);
    camera.position.lerp(tmp, f);
    look.current.lerp(tmpLook, f);
    camera.lookAt(look.current);

    if (fpsRef.el) {
      fpsRef.frames = (fpsRef.frames || 0) + 1;
      fpsRef.acc = (fpsRef.acc || 0) + dt;
      if (fpsRef.acc > 0.5) {
        fpsRef.el.textContent = `${Math.round(fpsRef.frames / fpsRef.acc)} FPS · render ${fpsRef.dpr}x · pantalla ${fpsRef.native}x`;
        fpsRef.frames = 0;
        fpsRef.acc = 0;
      }
    }
  });
  return null;
}

function Room() {
  const screen = useGame((s) => s.screen);
  const wall = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#0b1018';
    g.fillRect(0, 0, 512, 256);
    g.strokeStyle = 'rgba(56,189,248,0.07)';
    g.lineWidth = 2;
    for (let x = 0; x <= 512; x += 32) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 256);
      g.stroke();
    }
    for (let y = 0; y <= 256; y += 32) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(512, y);
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 2);
    return t;
  }, []);
  const sign = useMemo(() => labelTexture('SALA DE TELECOMUNICACIONES', { color: '#7dd3fc', bg: 'rgba(8,20,32,0.9)', size: 52 }), []);
  const stripMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#38bdf8' }), []);
  return (
    <group>
      {/* piso */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.43, 0]} receiveShadow>
        <planeGeometry args={[24, 12]} />
        <meshStandardMaterial color="#0d131b" roughness={0.85} metalness={0.1} />
      </mesh>
      <gridHelper args={[24, 48, '#16324a', '#122233']} position={[0, -1.425, 0]} />
      {/* pared */}
      <mesh position={[0, 1.5, -0.75]}>
        <planeGeometry args={[24, 6]} />
        <meshStandardMaterial map={wall} roughness={0.9} />
      </mesh>
      {/* tiras de luz */}
      <mesh position={[0, 2.35, -0.73]} material={stripMat}>
        <boxGeometry args={[24, 0.02, 0.01]} />
      </mesh>
      <mesh position={[0, -1.2, -0.73]} material={stripMat}>
        <boxGeometry args={[24, 0.015, 0.01]} />
      </mesh>
      <mesh position={[0, 1.85, -0.72]} visible={screen === 'menu'}>
        <planeGeometry args={[0.2 * sign.userData.aspect, 0.2]} />
        <meshBasicMaterial map={sign} transparent />
      </mesh>
      {/* fibra que baja del techo hasta la bandeja ODF */}
      <mesh>
        <tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(-0.65, 3.2, -0.3), new THREE.Vector3(-0.65, 1.4, -0.3), new THREE.Vector3(-0.65, 1.12, -0.1)]), 20, 0.012, 6, false]} />
        <meshStandardMaterial color="#ffd21f" emissive="#ffd21f" emissiveIntensity={0.3} />
      </mesh>
      {/* racks vecinos en penumbra */}
      {[-4.2, 4.6].map((x) => (
        <mesh key={x} position={[x, -0.1, -0.35]}>
          <boxGeometry args={[2.6, 2.6, 0.7]} />
          <meshStandardMaterial color="#0f141b" metalness={0.4} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Lights({ shadows }) {
  return (
    <>
      <hemisphereLight args={['#bcd7ff', '#0a0f16', 0.9]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[2.5, 4, 5]}
        intensity={2.2}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <pointLight position={[-3, 1.5, 2]} intensity={6} distance={9} color="#38bdf8" />
      <pointLight position={[3.5, -0.5, 2]} intensity={4} distance={8} color="#a855f7" />
    </>
  );
}

// Plano de fondo: tocar el vacío cancela; arrastrar con zoom desplaza la vista
function PanCatcher() {
  const state = useRef(null);
  return (
    <mesh
      position={[0, 0, -0.7]}
      onPointerDown={(e) => {
        if (useGame.getState().screen !== 'game') return;
        const it = useInteraction.getState();
        if (it.zoom <= 1.01 || it.from) return;
        state.current = { x: e.clientX, y: e.clientY, pan: [...it.pan] };
        const move = (ev) => {
          const s = state.current;
          if (!s) return;
          const k = 0.004 / useInteraction.getState().zoom;
          const nx = THREE.MathUtils.clamp(s.pan[0] - (ev.clientX - s.x) * k, -1.6, 1.8);
          const ny = THREE.MathUtils.clamp(s.pan[1] + (ev.clientY - s.y) * k, -1.2, 1.2);
          useInteraction.getState().setPan([nx, ny]);
        };
        const up = () => {
          state.current = null;
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      }}
    >
      <planeGeometry args={[30, 20]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

export default function RackScene() {
  const quality = useGame((s) => s.quality);
  const high = quality === 'high';
  // Usar la densidad real de la pantalla: en pantallas con escalado (125%, 150%, 200%)
  // renderizar a 1x hace que el 3D se vea borroso frente al texto HTML.
  const native = window.devicePixelRatio || 1;
  const maxDpr = high ? Math.min(2, native) : Math.min(1.5, native);
  const minDpr = Math.min(1, maxDpr); // nunca por debajo de 1x: evita el desenfoque
  const [dpr, setDpr] = useState(maxDpr);
  useEffect(() => setDpr(maxDpr), [maxDpr]);
  fpsRef.dpr = dpr;
  fpsRef.native = native;
  return (
    <Canvas
      key={quality}
      className="scene-canvas"
      dpr={dpr}
      shadows={high}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 38, near: 0.1, far: 60, position: [0, 0, 6] }}
      onCreated={({ gl }) => {
        gl.setClearColor('#070b11');
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(minDpr, +(d - 0.15).toFixed(2)))}
        onIncline={() => setDpr((d) => Math.min(maxDpr, +(d + 0.1).toFixed(2)))}
      />
      <fog attach="fog" args={['#070b11', 8, 16]} />
      <Lights shadows={high} />
      <CameraRig />
      <Suspense fallback={null}>
        <Room />
        <PanCatcher />
        <RackFrame />
        <RackAccessories />
        <AllDevices />
        <Cables />
        <DragCable />
      </Suspense>
    </Canvas>
  );
}
