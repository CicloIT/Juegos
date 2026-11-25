import { useGame } from '../game/store.js';
import { sfx } from '../audio/sound.js';

export default function MenuScreen() {
  const { goLearn, openModal, sound, setSound, quality, setQuality, showFps, setShowFps } = useGame();
  const click = (fn) => () => {
    sfx('click');
    fn();
  };
  return (
    <div className="screen menu">
      <div className="menu-left">
        <div className="badge">Desafío de redes · Electromecánica</div>
        <h1 className="title">
          ARMÁ EL RACK
          <span>DEL COLEGIO</span>
        </h1>
        <p className="subtitle">Tenés una misión: devolverle Internet a toda la escuela.</p>
        <div className="menu-buttons">
          <button className="btn btn-primary btn-xl" onClick={click(() => openModal('levels'))}>
            ▶ JUGAR
          </button>
          <button className="btn btn-xl" onClick={click(goLearn)}>
            🔍 MODO APRENDIZAJE
          </button>
          <div className="menu-row">
            <button className="btn" onClick={click(() => openModal('howto'))}>
              ❓ CÓMO JUGAR
            </button>
            <button className="btn" onClick={click(() => openModal('credits'))}>
              ★ CRÉDITOS
            </button>
          </div>
        </div>
      </div>
      <div className="settings">
        <button className={`chip ${sound ? 'on' : ''}`} onClick={() => setSound(!sound)}>
          {sound ? '🔊 Sonido' : '🔇 Sonido'}
        </button>
        <button className={`chip ${quality === 'high' ? 'on' : ''}`} onClick={() => setQuality(quality === 'high' ? 'low' : 'high')}>
          🎨 Calidad: {quality === 'high' ? 'Alta' : 'Liviana'}
        </button>
        <button className={`chip ${showFps ? 'on' : ''}`} onClick={() => setShowFps(!showFps)}>
          📈 FPS
        </button>
      </div>
    </div>
  );
}
