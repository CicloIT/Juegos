import { useEffect, useState } from 'react';
import { useGame } from '../game/store.js';
import { DEVICE_TYPES } from '../game/devices.js';
import { LEVELS } from '../game/levels.js';
import { startInventoryDrag } from '../three/placement.js';
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

export function HeatLegend() {
  return (
    <div className="heat-legend">
      <span><i className="g" /> Excelente</span>
      <span><i className="y" /> Intermedia</span>
      <span><i className="o" /> Débil</span>
      <span><i className="r" /> Sin cobertura</span>
    </div>
  );
}

function Hud() {
  const timeLeft = useGame((s) => s.timeLeft);
  const level = useGame((s) => s.level);
  const placed = useGame((s) => s.placed);
  const totalPct = useGame((s) => s.coverage.totalPct);
  const sectorsOk = useGame((s) => s.sectorsOk);
  const sectorsTotal = useGame((s) => s.sectorsTotal);
  const score = useGame((s) => s.score);
  const openModal = useGame((s) => s.openModal);
  const budget = Object.values(level.budget).reduce((a, b) => a + b, 0);
  const pct = Math.round(totalPct * 100);
  return (
    <div className="hud">
      <button className="btn" onClick={() => { sfx('click'); openModal('quit'); }}>☰ Menú</button>
      <div className="hud-level">
        <small>NIVEL {level.id}</small>
        {level.name}
      </div>
      <div className={`hud-timer ${timeLeft <= 10 ? 'danger' : ''}`}>
        <small>TIEMPO</small>
        {fmt(timeLeft)}
        <div className="timer-bar"><i style={{ width: `${(timeLeft / level.time) * 100}%` }} /></div>
      </div>
      <div className="hud-stat">
        <small>EQUIPOS</small>
        {budget - placed.length}/{budget}
      </div>
      <div className="hud-stat cov">
        <small>COBERTURA</small>
        {pct}%
        <div className="progress"><i style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="hud-stat ok">
        <small>SECTORES</small>
        {sectorsOk}/{sectorsTotal}
      </div>
      <div className="hud-stat score">
        <small>PUNTOS</small>
        {score}
      </div>
    </div>
  );
}

const ORDER = ['router', 'switch', 'ap', 'apOut'];

function Inventory() {
  const level = useGame((s) => s.level);
  const placed = useGame((s) => s.placed);
  const armed = useGame((s) => s.armed);
  const helps = useGame((s) => s.helps);
  const setHelps = useGame((s) => s.setHelps);
  const showHeatmap = useGame((s) => s.showHeatmap);
  const setShowHeatmap = useGame((s) => s.setShowHeatmap);
  const drag = useGame((s) => s.drag);
  const selected = useGame((s) => s.selected);
  const hasRouter = placed.some((d) => d.type === 'router');
  const hasSwitch = placed.some((d) => d.type === 'switch');
  const next = !hasRouter ? 'router' : !hasSwitch ? 'switch' : null;

  return (
    <div className={`side left panel inventory ${drag?.kind === 'move' ? 'drop-remove' : ''}`}>
      <h3>EQUIPOS DISPONIBLES</h3>
      {ORDER.filter((t) => level.budget[t]).map((t) => {
        const type = DEVICE_TYPES[t];
        const left = level.budget[t] - placed.filter((d) => d.type === t).length;
        return (
          <button
            key={t}
            className={`dev-card ${armed === t ? 'armed' : ''} ${left <= 0 ? 'empty' : ''} ${helps && next === t ? 'suggest' : ''}`}
            onPointerDown={(e) => left > 0 && startInventoryDrag(e, t)}
          >
            <span className="dev-ico">{type.icon}</span>
            <span className="dev-txt">
              <b>{type.name}</b>
              <small>{type.desc}</small>
            </span>
            <span className="dev-count">×{left}</span>
          </button>
        );
      })}
      <div className={`drop-hint ${selected && !drag ? 'hidden' : ''}`}>{drag?.kind === 'move' ? '⬅ Soltá acá para retirar el equipo' : armed ? '👆 Tocá el plano para colocarlo' : 'Arrastrá un equipo al plano'}</div>
      <SelectedInfo />
      <div className="left-bottom">
        <button className={`toggle ${showHeatmap ? 'on' : ''}`} onClick={() => { sfx('click'); setShowHeatmap(!showHeatmap); }}>
          <span className="knob" />
          Mapa de calor
        </button>
        <button className={`toggle ${helps ? 'on' : ''}`} disabled={!level.helpsAllowed} onClick={() => { sfx('click'); setHelps(!helps); }}>
          <span className="knob" />
          Ayudas {helps ? 'activadas' : 'desactivadas'}
        </button>
      </div>
    </div>
  );
}

const ISSUE_TXT = {
  'router-far': 'Lejos del ONT',
  'no-router': 'Falta el router',
  'switch-far': 'Lejos del router',
  'no-switch': 'Falta el switch',
  'ap-far': 'Lejos del switch',
  'router-off': 'Router sin Internet',
  'switch-off': 'Switch sin Internet',
};

function SelectedInfo() {
  const selected = useGame((s) => s.selected);
  const placed = useGame((s) => s.placed);
  const links = useGame((s) => s.links);
  const remove = useGame((s) => s.removeDevice);
  const d = placed.find((x) => x.id === selected);
  if (!d) return null;
  const t = DEVICE_TYPES[d.type];
  const active = links.active.has(d.id);
  const cable = links.cables.find((c) => c.to === d.id);
  const issue = links.issues[d.id];
  return (
    <div className="selected-card">
      <div className="sel-head">
        <span>{t.icon}</span>
        <b>{t.name}</b>
        <em className={active ? 'on' : 'off'}>{active ? '● Conectado' : `● ${ISSUE_TXT[issue?.code] || 'Sin conexión'}`}</em>
      </div>
      {cable && (
        <div className="sel-cable">
          Cable: <b className={cable.ok ? '' : 'bad'}>{Math.round(cable.len)} m</b> / máx. {cable.max} m
        </div>
      )}
      <button className="btn btn-danger" onClick={() => remove(d.id)}>✕ Retirar</button>
    </div>
  );
}

const LVL_TXT = { green: 'Señal adecuada', yellow: 'Intermedia', orange: 'Débil', red: 'Sin cobertura' };

function SchoolPanel() {
  const map = useGame((s) => s.map);
  const sectors = useGame((s) => s.coverage.sectors);
  const sectorsOk = useGame((s) => s.sectorsOk);
  const sectorsTotal = useGame((s) => s.sectorsTotal);
  const minCov = useGame((s) => s.level.minCoverage);
  return (
    <div className="side right panel">
      <h3>SECTORES <em>{sectorsOk}/{sectorsTotal} con señal</em></h3>
      <div className={`sectors ${map.rooms.length > 9 ? 'compact' : ''}`}>
        {map.rooms.filter((r) => !r.notRequired).map((r) => {
          const st = sectors[r.id];
          const pct = Math.round(st.pct * 100);
          return (
            <div key={r.id} className={`sector ${st.level}`}>
              <span className="sector-ico">{r.icon}</span>
              <span className="sector-txt">
                <b>{r.name}</b>
                <span className="bar"><i style={{ width: `${pct}%` }} /><u style={{ left: `${minCov * 100}%` }} /></span>
                <small>{pct}% · {LVL_TXT[st.level]}</small>
              </span>
              <span className="sector-led" />
            </div>
          );
        })}
      </div>
      <HeatLegend />
    </div>
  );
}

function Toast() {
  const toast = useGame((s) => s.toast);
  const dismiss = useGame((s) => s.dismissToast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismiss, toast.kind === 'ok' ? 2600 : 7000);
    return () => clearTimeout(t);
  }, [toast, dismiss]);
  if (!toast) return null;
  const icon = { warn: '⚠️', info: '💡', ok: '✅' }[toast.kind] || 'ℹ️';
  return (
    <div className={`toast ${toast.kind}`} key={toast.id} onClick={dismiss}>
      <div className="toast-icon">{icon}</div>
      <div className="toast-body">
        <b>{toast.title}</b>
        <p>{toast.text}</p>
        {toast.hint && <p className="hint">👉 {toast.hint}</p>}
      </div>
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
        <h2>¡El colegio se quedó sin Wi-Fi!</h2>
        <p className="lead">{level.intro} Meta: {Math.round(level.minCoverage * 100)}% de cada sector con buena señal.</p>
        <HowToSteps />
        <button className="btn btn-primary btn-xl" onClick={() => { sfx('click'); begin(); }}>
          ¡EMPEZAR!
        </button>
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ['#22c55e', '#38bdf8', '#facc15', '#f472b6', '#a855f7', '#f97316'];
  return (
    <div className="confetti">
      {Array.from({ length: 70 }, (_, i) => (
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
    const t = setTimeout(() => setShow(true), s.status === 'won' ? 2000 : 700);
    return () => clearTimeout(t);
  }, [s.status]);
  const won = s.status === 'won';
  const pct = Math.round(s.coverage.totalPct * 100);
  const next = LEVELS.find((l) => l.id === s.level.id + 1);
  const budget = Object.values(s.level.budget).reduce((a, b) => a + b, 0);
  const weak = s.map.rooms.filter((r) => !r.notRequired && s.coverage.sectors[r.id].pct < s.level.minCoverage);

  if (!show) return won ? <div className="win-flash">¡SEÑAL FULL!</div> : null;
  return (
    <div className="overlay">
      {won && <Confetti />}
      <div className={`results panel ${won ? 'won' : 'lost'}`}>
        {won ? (
          <>
            <div className="res-ico">🏆</div>
            <h2>¡MISIÓN CUMPLIDA!</h2>
            <p className="lead">¡TODO EL COLEGIO TIENE SEÑAL!</p>
          </>
        ) : (
          <>
            <div className="res-ico">⏱️</div>
            <h2>SE TERMINÓ EL TIEMPO</h2>
            <p className="lead">Alcanzaste {pct}% de cobertura. ¡Probá otra estrategia!</p>
          </>
        )}
        <div className="res-stats">
          <div><small>Cobertura total</small><Counter to={pct} suffix="%" /></div>
          <div><small>Sectores conectados</small>{s.sectorsOk}/{s.sectorsTotal}</div>
          <div><small>Equipos utilizados</small>{s.placed.length}/{budget}</div>
          <div><small>Tiempo empleado</small>{fmt(won ? s.usedTime : s.level.time)}</div>
          <div className="big"><small>Puntuación final</small><Counter to={s.finalScore} /></div>
        </div>
        {!won && weak.length > 0 && (
          <div className="missing">
            <b>Sectores con poca señal:</b>
            <ul>
              {weak.map((r) => (
                <li key={r.id}>{r.name} ({Math.round(s.coverage.sectors[r.id].pct * 100)}%)</li>
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
  return (
    <div className={`screen game st-${status}`}>
      <Hud />
      <Inventory />
      <SchoolPanel />
      <Toast />
      {status === 'guide' && <Guide />}
      {(status === 'won' || status === 'lost') && <Results />}
      {modal === 'quit' && <QuitModal />}
    </div>
  );
}
