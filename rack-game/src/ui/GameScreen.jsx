import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store.js';
import { useInteraction } from '../three/interaction.js';
import { SECTORS, MEDIUM } from '../game/network.js';
import { LEVELS } from '../game/levels.js';
import { sfx } from '../audio/sound.js';
import { HowToSteps } from './Modals.jsx';

function useGameLoop() {
  const tick = useGame((s) => s.tick);
  useEffect(() => {
    let raf;
    let last = performance.now();
    const loop = (now) => {
      tick(Math.min(0.25, (now - last) / 1000));
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick]);
}

const fmt = (t) => {
  const s = Math.ceil(t);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function Hud() {
  const timeLeft = useGame((s) => s.timeLeft);
  const correct = useGame((s) => s.correct);
  const errors = useGame((s) => s.errors);
  const score = useGame((s) => s.score);
  const level = useGame((s) => s.level);
  const openModal = useGame((s) => s.openModal);
  const wrong = useGame((s) => s.wrong);
  const total = level.required.length;
  const pct = Math.round((correct / total) * 100);
  const danger = timeLeft <= 10;
  return (
    <div className="hud">
      <button className="btn" onClick={() => { sfx('click'); openModal('quit'); }}>☰ Menú</button>
      <div className="hud-level">
        <small>NIVEL {level.id}</small>
        {level.name}
      </div>
      <div className={`hud-timer ${danger ? 'danger' : ''}`}>
        <small>TIEMPO</small>
        {fmt(timeLeft)}
        <div className="timer-bar"><i style={{ width: `${(timeLeft / level.time) * 100}%` }} /></div>
      </div>
      <div className="hud-stat">
        <small>INSTALACIÓN</small>
        {pct}%
        <div className="progress"><i style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="hud-stat ok">
        <small>CORRECTAS</small>
        {correct}/{total}
      </div>
      <div className="hud-stat bad">
        <small>ERRORES</small>
        {errors}
      </div>
      {level.prewired.some((l) => !l.ok) && (
        <div className={`hud-stat warn ${wrong ? 'blink' : ''}`}>
          <small>MAL CONECTADOS</small>
          {wrong}
        </div>
      )}
      <div className="hud-stat score">
        <small>PUNTOS</small>
        {score}
      </div>
    </div>
  );
}

const DEVICE_CHIPS = [
  { id: 'fiber', label: 'Entrada de fibra', icon: '💡' },
  { id: 'ont', label: 'ONT', icon: '🔆' },
  { id: 'router', label: 'Router', icon: '🧭' },
  { id: 'switch', label: 'Switch', icon: '🔀' },
  { id: 'patch', label: 'Patch panel', icon: '🏷️' },
  { id: 'ap', label: 'Punto de acceso', icon: '📶' },
];

const PATH = [
  { key: 'fiber', label: 'Fibra → ONT' },
  { key: 'ont-router', label: 'ONT → WAN router' },
  { key: 'router-switch', label: 'LAN router → Switch' },
  { key: 'switch-switch', label: 'Switch → Switch 2', needs: 'switch2' },
  { key: 'sectors', label: 'Switch → Sectores' },
];

function LeftPanel() {
  const cable = useGame((s) => s.cable);
  const setCable = useGame((s) => s.setCable);
  const links = useGame((s) => s.links);
  const helps = useGame((s) => s.helps);
  const setHelps = useGame((s) => s.setHelps);
  const level = useGame((s) => s.level);
  const setFocus = useGame((s) => s.setFocusDevice);
  const focus = useGame((s) => s.focusDevice);
  const timer = useRef();
  const okKeys = new Set(links.filter((l) => l.ok).map((l) => l.key));
  const usedFiber = links.filter((l) => l.medium === MEDIUM.FIBER).length;
  const usedEth = links.filter((l) => l.medium === MEDIUM.ETH).length;
  const levelSectors = SECTORS.filter((s) => level.sectors.includes(s.id));
  const sectorsDone = levelSectors.filter((s) => okKeys.has(`sector-${s.id}`)).length;

  const pick = (c) => {
    sfx('click');
    setCable(c);
  };
  const focusOn = (id) => {
    sfx('click');
    setFocus(id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFocus(null), 2500);
  };

  return (
    <div className="side left panel">
      <h3>CABLES</h3>
      <button className={`cable-btn fiber ${cable === MEDIUM.FIBER ? 'active' : ''}`} onClick={() => pick(MEDIUM.FIBER)}>
        <span className="cable-swatch" />
        <span className="cable-info">
          <b>Fibra óptica</b>
          <small>Transmite luz · {usedFiber}/1 usado</small>
        </span>
      </button>
      <button className={`cable-btn eth ${cable === MEDIUM.ETH ? 'active' : ''}`} onClick={() => pick(MEDIUM.ETH)}>
        <span className="cable-swatch" />
        <span className="cable-info">
          <b>Ethernet</b>
          <small>Datos por cobre · {usedEth}/{level.ethCables} usados</small>
        </span>
      </button>

      <h3>EQUIPOS</h3>
      <div className="device-chips">
        {DEVICE_CHIPS.map((d) => (
          <button key={d.id} className={`dev-chip ${focus === d.id ? 'active' : ''}`} onClick={() => focusOn(d.id)}>
            <span>{d.icon}</span>
            {d.label}
          </button>
        ))}
      </div>

      {helps && (
        <>
          <h3>CAMINO DE LA SEÑAL</h3>
          <ol className="path">
            {PATH.filter((p) => !p.needs || level.devices.includes(p.needs)).map((p) => {
              const done = p.key === 'sectors' ? sectorsDone === levelSectors.length : okKeys.has(p.key);
              return (
                <li key={p.key} className={done ? 'done' : ''}>
                  <span className="dot">{done ? '✓' : ''}</span>
                  {p.label}
                  {p.key === 'sectors' && <em>{sectorsDone}/{levelSectors.length}</em>}
                </li>
              );
            })}
          </ol>
        </>
      )}

      <div className="left-bottom">
        <button
          className={`toggle ${helps ? 'on' : ''}`}
          disabled={!level.helpsAllowed}
          onClick={() => { sfx('click'); setHelps(!helps); }}
        >
          <span className="knob" />
          Ayudas {helps ? 'activadas' : 'desactivadas'}
        </button>
      </div>
    </div>
  );
}

const STATUS_TXT = { red: 'Sin conexión', yellow: 'Instalación incompleta', green: 'Conectado' };

function SchoolPanel() {
  const sectors = useGame((s) => s.net.sectors);
  const levelSectors = useGame((s) => s.level.sectors);
  const list = SECTORS.filter((s) => levelSectors.includes(s.id));
  const online = list.filter((s) => sectors[s.id] === 'green').length;
  return (
    <div className="side right panel">
      <h3>COLEGIO <em>{online}/{list.length} conectados</em></h3>
      <div className={`sectors ${list.length > 6 ? 'compact' : ''}`}>
        {list.map((s) => {
          const st = sectors[s.id];
          return (
            <div key={s.id} className={`sector ${st}`}>
              <span className="sector-ico">{s.icon}</span>
              <span className="sector-txt">
                <b>{s.name}</b>
                <small>{STATUS_TXT[st]}</small>
              </span>
              <span className="sector-led" />
            </div>
          );
        })}
      </div>
      <div className="legend">
        <span><i className="red" /> Sin conexión</span>
        <span><i className="yellow" /> Incompleto</span>
        <span><i className="green" /> Conectado</span>
      </div>
    </div>
  );
}

function Toast() {
  const toast = useGame((s) => s.toast);
  const dismiss = useGame((s) => s.dismissToast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismiss, toast.kind === 'error' ? 7000 : 2600);
    return () => clearTimeout(t);
  }, [toast, dismiss]);
  if (!toast) return null;
  return (
    <div className={`toast ${toast.kind}`} key={toast.id} onClick={dismiss}>
      <div className="toast-icon">{toast.kind === 'error' ? '⚠️' : 'ℹ️'}</div>
      <div className="toast-body">
        <b>{toast.title}</b>
        <p>{toast.text}</p>
        {toast.hint && <p className="hint">✅ {toast.hint}</p>}
      </div>
    </div>
  );
}

function ViewControls() {
  const zoom = useInteraction((s) => s.zoom);
  const setZoom = useInteraction((s) => s.setZoom);
  const reset = useInteraction((s) => s.resetView);
  return (
    <div className="view-controls">
      <button className="round" onClick={() => setZoom(zoom * 1.2)} aria-label="Acercar">＋</button>
      <button className="round" onClick={() => setZoom(zoom / 1.2)} aria-label="Alejar">－</button>
      <button className="round" onClick={reset} aria-label="Vista inicial">⟲</button>
    </div>
  );
}

function SelectionTip() {
  const from = useInteraction((s) => s.from);
  const cable = useGame((s) => s.cable);
  return (
    <div className={`tipline ${from ? 'active' : ''}`}>
      {from
        ? `Cable ${cable === 'fiber' ? 'de fibra' : 'Ethernet'} en la mano: soltalo o tocá el puerto de destino`
        : 'Arrastrá desde un puerto hasta otro · o tocá uno y después el otro'}
    </div>
  );
}

function Guide() {
  const begin = useGame((s) => s.beginPlaying);
  const level = useGame((s) => s.level);
  return (
    <div className="overlay">
      <div className="guide panel">
        <div className="badge">Nivel {level.id} · {level.name} · {level.time} segundos</div>
        <h2>¡El colegio se quedó sin Internet!</h2>
        <p className="lead">{level.intro}</p>
        <HowToSteps />
        <button className="btn btn-primary btn-xl" onClick={() => { sfx('click'); begin(); }}>
          ¡EMPEZAR!
        </button>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 70 }, (_, i) => i);
  const colors = ['#22c55e', '#38bdf8', '#facc15', '#f472b6', '#a855f7', '#f97316'];
  return (
    <div className="confetti">
      {pieces.map((i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 14) * 0.12}s`,
            animationDuration: `${2.4 + (i % 5) * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}

function Counter({ to, duration = 1500, suffix = '' }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / duration);
      setV(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return (
    <>
      {v}
      {suffix}
    </>
  );
}

function Results() {
  const s = useGame();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), s.status === 'won' ? 1800 : 700);
    return () => clearTimeout(t);
  }, [s.status]);
  const won = s.status === 'won';
  const used = s.level.time - s.timeLeft;
  const okKeys = new Set(s.links.filter((l) => l.ok).map((l) => l.key));
  const missing = s.level.required.filter((r) => !okKeys.has(r.key));
  const next = LEVELS.find((l) => l.id === s.level.id + 1);

  if (!show) return won ? <div className="win-flash">¡RED ACTIVADA!</div> : null;
  return (
    <div className="overlay">
      {won && <Confetti />}
      <div className={`results panel ${won ? 'won' : 'lost'}`}>
        {won ? (
          <>
            <div className="res-ico">🏆</div>
            <h2>¡MISIÓN CUMPLIDA!</h2>
            <p className="lead">¡EL COLEGIO ESTÁ CONECTADO!</p>
          </>
        ) : (
          <>
            <div className="res-ico">⏱️</div>
            <h2>DESAFÍO INCOMPLETO</h2>
            <p className="lead">Se terminó el tiempo. ¡Casi! Probá de nuevo.</p>
          </>
        )}
        <div className="res-stats">
          <div><small>Tiempo utilizado</small>{fmt(used)}</div>
          <div><small>Conexiones correctas</small>{s.correct}/{s.level.required.length}</div>
          <div><small>Errores</small>{s.errors}</div>
          <div className="big"><small>Puntuación final</small><Counter to={s.finalScore} /></div>
          {won && (
            <div className="speed"><small>Velocidad de enlace</small><Counter to={1000} duration={2200} suffix=" Mbps" /></div>
          )}
        </div>
        {!won && (missing.length > 0 || s.wrong > 0) && (
          <div className="missing">
            <b>Te faltó:</b>
            <ul>
              {s.wrong > 0 && <li>Quitar {s.wrong} cable(s) mal conectado(s)</li>}
              {missing.map((m) => (
                <li key={m.key}>{m.label}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="res-buttons">
          <button className="btn btn-primary btn-xl" onClick={() => { sfx('click'); s.startGame(s.level.id); }}>
            ↻ {won ? 'Jugar de nuevo' : 'Intentar de nuevo'}
          </button>
          {won && next && (
            <button className="btn btn-xl" onClick={() => { sfx('click'); s.startGame(next.id); }}>
              ⏭ Nivel {next.id}: {next.name}
            </button>
          )}
          <button className="btn btn-xl" onClick={() => { sfx('click'); s.goMenu(); }}>⌂ Menú</button>
        </div>
      </div>
    </div>
  );
}

function QuitModal() {
  const close = useGame((s) => s.closeModal);
  const goMenu = useGame((s) => s.goMenu);
  const restart = useGame((s) => s.startGame);
  const level = useGame((s) => s.level);
  const sound = useGame((s) => s.sound);
  const setSound = useGame((s) => s.setSound);
  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal small" onClick={(e) => e.stopPropagation()}>
        <h2>Pausa</h2>
        <div className="pause-buttons">
          <button className="btn btn-primary btn-xl" onClick={close}>▶ Seguir jugando</button>
          <button className="btn btn-xl" onClick={() => restart(level.id)}>↻ Reiniciar</button>
          <button className="btn btn-xl" onClick={() => setSound(!sound)}>{sound ? '🔊 Sonido activado' : '🔇 Sonido apagado'}</button>
          <button className="btn btn-xl" onClick={goMenu}>⌂ Salir al menú</button>
        </div>
      </div>
    </div>
  );
}

export default function GameScreen() {
  useGameLoop();
  const status = useGame((s) => s.status);
  const modal = useGame((s) => s.modal);
  const resetView = useInteraction((s) => s.resetView);
  useEffect(() => resetView, [resetView]);
  useEffect(() => resetView(), [status === 'guide', resetView]); // eslint-disable-line
  return (
    <div className={`screen game st-${status}`}>
      <Hud />
      <LeftPanel />
      <SchoolPanel />
      <ViewControls />
      <SelectionTip />
      <Toast />
      {status === 'guide' && <Guide />}
      {(status === 'won' || status === 'lost') && <Results />}
      {modal === 'quit' && <QuitModal />}
    </div>
  );
}
