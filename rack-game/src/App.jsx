import { useEffect, useState } from 'react';
import RackScene, { fpsRef } from './three/RackScene.jsx';
import { useGame } from './game/store.js';
import MenuScreen from './ui/MenuScreen.jsx';
import LearnScreen from './ui/LearnScreen.jsx';
import GameScreen from './ui/GameScreen.jsx';
import { HowToModal, CreditsModal, LevelSelectModal } from './ui/Modals.jsx';

// Escenario de UI diseñado a 1920x1080 y escalado para cualquier pantalla.
function useStageScale() {
  const calc = () => Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  const [s, setS] = useState(calc);
  useEffect(() => {
    const on = () => setS(calc());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return s;
}

export default function App() {
  const screen = useGame((s) => s.screen);
  const modal = useGame((s) => s.modal);
  const showFps = useGame((s) => s.showFps);
  const scale = useStageScale();

  return (
    <div className="app">
      <RackScene />
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {screen === 'menu' && <MenuScreen />}
        {screen === 'learn' && <LearnScreen />}
        {screen === 'game' && <GameScreen />}
        {modal === 'howto' && <HowToModal />}
        {modal === 'credits' && <CreditsModal />}
        {modal === 'levels' && <LevelSelectModal />}
      </div>
      {showFps && <div className="fps" ref={(el) => (fpsRef.el = el)}>-- FPS</div>}
    </div>
  );
}
