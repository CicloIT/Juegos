import { useGame } from '../game/store.js';
import { LEVELS } from '../game/levels.js';
import { sfx } from '../audio/sound.js';

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
        <button className="btn btn-primary modal-close" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}

export function HowToSteps() {
  return (
    <div className="howto-steps">
      <div className="howto-step">
        <div className="howto-anim anim-chain">
          <span>💡</span>→<span>ONT</span>→<span>🧭</span>→<span>🔀</span>→<span>📶</span>
        </div>
        <b>1. Armá la red</b>
        <p>Router cerca del ONT, después el switch, y los Access Point conectados al switch.</p>
      </div>
      <div className="howto-step">
        <div className="howto-anim anim-place">
          <span className="item">📶</span>
          <span className="spot" />
          <span className="finger">👆</span>
        </div>
        <b>2. Arrastrá los equipos</b>
        <p>Desde el panel al plano. O tocá un equipo y después un lugar del plano.</p>
      </div>
      <div className="howto-step">
        <div className="howto-anim anim-heat">
          <i className="g" />
          <i className="y" />
          <i className="o" />
          <i className="r" />
        </div>
        <b>3. Mirá la señal</b>
        <p>Verde excelente · amarillo intermedia · naranja débil · rojo sin señal.</p>
      </div>
      <div className="howto-step">
        <div className="howto-anim anim-walls">
          <span className="src">📶</span>
          <span className="wall" />
          <span className="wave" />
        </div>
        <b>4. Cuidado con las paredes</b>
        <p>El hormigón y las máquinas debilitan mucho la señal. ¡Pensá dónde ubicar cada AP!</p>
      </div>
    </div>
  );
}

export function HowToModal() {
  const close = useGame((s) => s.closeModal);
  return (
    <Modal title="Cómo jugar" onClose={close}>
      <HowToSteps />
      <p className="modal-note">
        Objetivo: que todos los sectores tengan al menos 80% de su superficie con señal adecuada antes de que termine el tiempo. Usar menos equipos y no amontonarlos da más puntos. Para retirar un equipo, arrastralo de vuelta al panel.
      </p>
    </Modal>
  );
}

export function CreditsModal() {
  const close = useGame((s) => s.closeModal);
  return (
    <Modal title="Créditos" onClose={close}>
      <div className="credits">
        <p>
          <b>Misión: Señal Full</b>
          <br />
          Videojuego educativo de redes inalámbricas.
        </p>
        <p>Desarrollado para los alumnos de la orientación en Electromecánica.</p>
        <p className="muted">La simulación de señal es simplificada: distancia + atenuación por materiales + interferencias. Hecho con React y Three.js, funciona sin Internet.</p>
      </div>
    </Modal>
  );
}

export function LevelSelectModal() {
  const close = useGame((s) => s.closeModal);
  const startGame = useGame((s) => s.startGame);
  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal levels" onClick={(e) => e.stopPropagation()}>
        <h2>Elegí el nivel</h2>
        <div className="level-cards">
          {LEVELS.map((l) => {
            const rooms = l.map.rooms.filter((r) => !r.notRequired).length;
            const wifi = (l.budget.ap || 0) + (l.budget.apOut || 0);
            return (
              <button key={l.id} className={`level-card lv${l.id}`} onClick={() => { sfx('click'); startGame(l.id); }}>
                <span className="lv-stars">{'★'.repeat(l.stars)}{'☆'.repeat(3 - l.stars)}</span>
                <b>Nivel {l.id}</b>
                <span className="lv-name">{l.name}</span>
                <p>{l.description}</p>
                <span className="lv-facts">
                  <span>⏱ {l.time} s</span>
                  <span>🏫 {rooms} sectores · {l.map.width}×{l.map.depth} m</span>
                  <span>📶 {wifi} access points</span>
                  <span>🎯 {Math.round(l.minCoverage * 100)}% de señal</span>
                  <span className="wide">{l.helpsAllowed ? (l.helpsDefault ? '💡 Con ayudas' : '💡 Ayudas opcionales') : '🚫 Sin ayudas'}</span>
                </span>
                <span className="lv-play">▶ JUGAR</span>
              </button>
            );
          })}
        </div>
        <button className="btn modal-close" onClick={close}>Volver</button>
      </div>
    </div>
  );
}
