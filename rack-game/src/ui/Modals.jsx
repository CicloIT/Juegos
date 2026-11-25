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
        <div className="howto-anim anim-select">
          <span className="cable-chip fiber" />
          <span className="cable-chip eth" />
        </div>
        <b>1. Elegí el cable</b>
        <p>Fibra óptica (amarilla) o Ethernet (azul), en el panel izquierdo.</p>
      </div>
      <div className="howto-step">
        <div className="howto-anim anim-drag">
          <span className="port a" />
          <span className="wire" />
          <span className="port b" />
          <span className="finger">👆</span>
        </div>
        <b>2. Uní dos puertos</b>
        <p>Arrastrá desde un puerto hasta otro, o tocá uno y después el otro.</p>
      </div>
      <div className="howto-step">
        <div className="howto-anim anim-path">
          <span>💡</span>→<span>ONT</span>→<span>RT</span>→<span>SW</span>→<span>🏫</span>
        </div>
        <b>3. Seguí la señal</b>
        <p>Fibra → ONT → Router (WAN) → Switch → Patch panel y Wi-Fi.</p>
      </div>
      <div className="howto-step">
        <div className="howto-anim anim-unplug">
          <span className="wire red" />
          <span className="x">✕</span>
        </div>
        <b>4. Corregí</b>
        <p>Tocá un cable para desconectarlo. ¡Los errores también enseñan!</p>
      </div>
    </div>
  );
}

export function HowToModal() {
  const close = useGame((s) => s.closeModal);
  return (
    <Modal title="Cómo jugar" onClose={close}>
      <HowToSteps />
      <p className="modal-note">Tenés tiempo limitado. Cada sector del colegio se pone verde cuando le llega Internet. Usá la rueda del mouse o los botones +/− para acercarte.</p>
    </Modal>
  );
}

export function CreditsModal() {
  const close = useGame((s) => s.closeModal);
  return (
    <Modal title="Créditos" onClose={close}>
      <div className="credits">
        <p>
          <b>Armá el Rack del Colegio</b>
          <br />
          Videojuego educativo de redes y telecomunicaciones.
        </p>
        <p>Desarrollado para los alumnos de la orientación en Electromecánica.</p>
        <p className="muted">Hecho con React, Three.js y React Three Fiber. Funciona sin conexión a Internet.</p>
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
          {LEVELS.map((l) => (
            <button key={l.id} className={`level-card lv${l.id}`} onClick={() => { sfx('click'); startGame(l.id); }}>
              <span className="lv-stars">{'★'.repeat(l.stars)}{'☆'.repeat(3 - l.stars)}</span>
              <b>Nivel {l.id}</b>
              <span className="lv-name">{l.name}</span>
              <p>{l.description}</p>
              <span className="lv-facts">
                <span>⏱ {l.time} s</span>
                <span>🔌 {l.required.length} conexiones</span>
                <span>🏫 {l.sectors.length} sectores</span>
                <span>{l.helpsAllowed ? (l.helpsDefault ? '💡 Con ayudas' : '💡 Ayudas opcionales') : '🚫 Sin ayudas'}</span>
              </span>
              <span className="lv-play">▶ JUGAR</span>
            </button>
          ))}
        </div>
        <button className="btn modal-close" onClick={close}>Volver</button>
      </div>
    </div>
  );
}
