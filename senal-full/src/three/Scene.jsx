import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../game/store.js';
import School from './School.jsx';
import { Heatmap, SignalRays } from './Coverage.jsx';
import { PlacedDevices, Ghost, Cables } from './Devices.jsx';
import { view } from './placement.js';

// Encuadres (vista isométrica de maqueta)
const SHOTS = {
  game: { pos: [0, 34, 18.5], look: [0, 0, 0.2] },
  learn: { pos: [6.5, 33, 18.5], look: [6.5, 0, 0.2] },
};

export const fpsRef = { el: null };

function CameraRig() {
  const { camera, gl } = useThree();
  const look = useRef(new THREE.Vector3());
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tmpLook = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    view.camera = camera;
    view.canvas = gl.domElement;
  }, [camera, gl]);
  useFrame(({ clock, pointer }, dt) => {
    const g = useGame.getState();
    const t = clock.elapsedTime;
    if (g.screen === 'menu') {
      const a = t * 0.08;
      tmp.set(Math.sin(a) * 26 - 6, 21, Math.cos(a) * 26);
      tmpLook.set(-6, 0, 0);
    } else {
      const s = SHOTS[g.screen] || SHOTS.game;
      // planos más grandes => cámara más lejos (proporcional al tamaño del colegio)
      const k = Math.max(g.map.width / 24, g.map.depth / 22);
      tmp.set(s.pos[0] * k + pointer.x * 0.3, s.pos[1] * k, s.pos[2] * k + pointer.y * 0.2);
      tmpLook.set(s.look[0] * k, s.look[1], s.look[2] * k);
    }
    const f = 1 - Math.pow(0.03, dt);
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

// Piso "clickeable": un toque coloca el equipo elegido o deselecciona
function GroundCatcher() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.1, 0]}
      onClick={(e) => {
        const g = useGame.getState();
        if (g.armed && g.canEdit()) {
          const map = g.map;
          g.placeAt(g.armed, e.point.x + map.width / 2, e.point.z + map.depth / 2);
        } else if (g.selected) g.select(null);
      }}
    >
      <planeGeometry args={[60, 60]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function Lights({ shadows }) {
  return (
    <>
      <hemisphereLight args={['#dbeafe', '#1f2a1a', 1.1]} />
      <directionalLight
        position={[10, 22, 12]}
        intensity={2.2}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <ambientLight intensity={0.25} />
    </>
  );
}

export default function Scene() {
  const quality = useGame((s) => s.quality);
  const high = quality === 'high';
  // Resolución real de la pantalla (evita el desenfoque en pantallas táctiles con escalado)
  const native = window.devicePixelRatio || 1;
  const maxDpr = high ? Math.min(2, native) : Math.min(1.5, native);
  const minDpr = Math.min(1, maxDpr);
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
      camera={{ fov: 42, near: 0.5, far: 150, position: [0, 30, 30] }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0b1220');
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
    >
      {/* En calidad Alta la resolución queda fija: bajarla en caliente redimensiona el
          canvas (se ve como una "mini recarga") y cada vez se pierde nitidez.
          En Liviana se adapta, pero se congela tras pocos cambios para no oscilar. */}
      {!high && (
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => setDpr((d) => Math.max(minDpr, +(d - 0.25).toFixed(2)))}
          onIncline={() => setDpr((d) => Math.min(maxDpr, +(d + 0.25).toFixed(2)))}
        />
      )}
      <fog attach="fog" args={['#0b1220', 40, 80]} />
      <Lights shadows={high} />
      <CameraRig />
      <Suspense fallback={null}>
        <School />
        <Heatmap />
        <SignalRays />
        <Cables />
        <PlacedDevices />
        <Ghost />
        <GroundCatcher />
      </Suspense>
    </Canvas>
  );
}
