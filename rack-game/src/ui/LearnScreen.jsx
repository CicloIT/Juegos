import { useGame } from '../game/store.js';
import { LEARN_ITEMS } from '../data/components.js';
import { sfx } from '../audio/sound.js';

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
          Conocé los componentes
        </div>
        <button className="btn btn-primary" onClick={() => { sfx('click'); openModal('levels'); }}>▶ ¡A jugar!</button>
      </div>

      <div className="learn-hint">👆 Tocá un equipo o cable del rack, o elegilo en la lista</div>

      <div className="learn-panel panel">
        <div className="learn-grid">
          {LEARN_ITEMS.map((i) => (
            <button key={i.id} className={`learn-chip ${i.id === item.id ? 'active' : ''}`} onClick={() => { sfx('click'); setSel(i.id); }}>
              <span className="ico">{i.icon}</span>
              {i.name.split(' / ')[0]}
            </button>
          ))}
        </div>

        <div className="learn-card" key={item.id}>
          <div className="learn-head">
            <span className="big-ico" style={item.color ? { color: item.color } : null}>{item.icon}</span>
            <h2>{item.name}</h2>
          </div>
          <div className="flow">
            <span className="flow-node">{item.flow[0]}</span>
            <span className="flow-wire"><i /><i /><i /></span>
            <span className="flow-node main">{item.flow[1]}</span>
            <span className="flow-wire"><i /><i /><i /></span>
            <span className="flow-node">{item.flow[2]}</span>
          </div>
          <dl className="learn-facts">
            <dt>¿Qué es?</dt>
            <dd>{item.what}</dd>
            <dt>¿Para qué sirve?</dt>
            <dd>{item.use}</dd>
            <dt>¿Dónde se usa?</dt>
            <dd>{item.where}</dd>
            <dt>Conexiones</dt>
            <dd>
              <ul>
                {item.connections.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
