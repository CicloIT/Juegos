import { useGame } from '../game/store.js';
import { LEARN_ITEMS } from '../data/learn.js';
import { sfx } from '../audio/sound.js';
import { HeatLegend } from './GameScreen.jsx';

export default function LearnScreen() {
  const sel = useGame((s) => s.learnSel);
  const setSel = useGame((s) => s.setLearnSel);
  const goMenu = useGame((s) => s.goMenu);
  const openModal = useGame((s) => s.openModal);
  const item = LEARN_ITEMS.find((i) => i.id === sel) || LEARN_ITEMS[0];

  return (
    <div className="screen learn">
      <div className="topbar">
        <button className="btn" onClick={() => { sfx('click'); goMenu(); }}>← Menú</button>
        <div className="topbar-title">
          <small>MODO APRENDIZAJE</small>
          Redes inalámbricas
        </div>
        <button className="btn btn-primary" onClick={() => { sfx('click'); openModal('levels'); }}>▶ ¡A jugar!</button>
      </div>

      <div className="learn-try">{item.try}</div>
      <div className="learn-legend"><HeatLegend /></div>

      <div className="learn-panel panel">
        <div className="learn-grid">
          {LEARN_ITEMS.map((i) => (
            <button key={i.id} className={`learn-chip ${i.id === item.id ? 'active' : ''}`} onClick={() => { sfx('click'); setSel(i.id); }}>
              <span className="ico">{i.icon}</span>
              {i.name}
            </button>
          ))}
        </div>
        <div className="learn-card" key={item.id}>
          <div className="learn-head">
            <span className="big-ico">{item.icon}</span>
            <h2>{item.name}</h2>
          </div>
          <dl className="learn-facts">
            <dt>¿Qué es?</dt>
            <dd>{item.what}</dd>
            <dt>¿Cómo funciona?</dt>
            <dd>{item.how}</dd>
            <dt>Probalo</dt>
            <dd>{item.try}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
