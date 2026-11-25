// Texturas de canvas para las caras frontales (rótulos y etiquetas de puertos).
// Evita fuentes externas y es muy barato para la GPU.
import * as THREE from 'three';
import { PORT_LAYOUT } from './layout.js';
import { PORTS } from '../game/network.js';

const cache = new Map();
const FONT = '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif';

export function deviceFaceTexture(layout, ports = PORTS.filter((p) => p.device === layout.id)) {
  const cacheKey = layout.id + ':' + ports.map((p) => p.id).join(',');
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const [w, h] = layout.size;
  const cw = 2048 * (w / 2.4) < 512 ? 1024 : Math.round(2048 * (w / 2.4));
  const ch = Math.round((cw * h) / w);
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const g = c.getContext('2d');
  const sx = (x) => ((x + w / 2) / w) * cw;
  const sy = (y) => ((h / 2 - y) / h) * ch;
  const px = (u) => (u / h) * ch; // unidades -> píxeles

  // fondo con leve gradiente y bisel
  const base = new THREE.Color(layout.color);
  const grad = g.createLinearGradient(0, 0, 0, ch);
  grad.addColorStop(0, '#' + base.clone().offsetHSL(0, 0, 0.06).getHexString());
  grad.addColorStop(1, '#' + base.clone().offsetHSL(0, 0, -0.04).getHexString());
  g.fillStyle = grad;
  g.fillRect(0, 0, cw, ch);
  g.strokeStyle = 'rgba(255,255,255,0.12)';
  g.lineWidth = 4;
  g.strokeRect(2, 2, cw - 4, ch - 4);

  // tornillos de montaje (orejas del rack) en equipos de ancho completo
  if (w > 2) {
    for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) {
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.beginPath();
      g.arc(sx(x), sy(0), px(0.022), 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(200,210,220,0.6)';
      g.beginPath();
      g.arc(sx(x), sy(0), px(0.014), 0, Math.PI * 2);
      g.fill();
    }
  }

  const tc = layout.textColor;
  g.textBaseline = 'middle';

  // título del equipo
  const titleX = layout.id === 'ont' ? sx(-w / 2 + 0.06) : sx(w / 2 - 0.12);
  g.textAlign = layout.id === 'ont' ? 'left' : 'right';
  g.fillStyle = tc;
  g.font = `800 ${px(0.05)}px ${FONT}`;
  const titleY = layout.id === 'ont' ? sy(0.08) : sy(0.03);
  g.fillText(layout.title, titleX, titleY);
  g.globalAlpha = 0.7;
  g.font = `500 ${px(0.03)}px ${FONT}`;
  g.fillText(layout.subtitle, titleX, titleY + px(0.05));
  g.globalAlpha = 1;

  // etiquetas de los puertos
  for (const p of ports) {
    const pl = PORT_LAYOUT[p.id];
    const ph = pl.h || 0.09;
    g.textAlign = 'center';
    if (layout.id === 'patch') {
      // tira de etiqueta blanca arriba del puerto (como un patch panel real)
      const lw = 0.2;
      g.fillStyle = '#f2f5f8';
      g.fillRect(sx(pl.x - lw / 2), sy(pl.y + ph / 2 + 0.05), px(lw), px(0.04));
      g.fillStyle = '#0d1117';
      g.font = `800 ${px(p.label.length > 6 ? 0.022 : 0.028)}px ${FONT}`;
      g.fillText(p.label, sx(pl.x), sy(pl.y + ph / 2 + 0.03));
    } else {
      const isWan = p.role === 'router-wan';
      g.fillStyle = isWan ? '#5aa7ff' : p.medium === 'fiber' ? '#ffd21f' : tc;
      g.font = `700 ${px(isWan ? 0.032 : 0.026)}px ${FONT}`;
      g.fillText(p.label, sx(pl.x), sy(pl.y - ph / 2 - 0.022));
      if (isWan) {
        g.strokeStyle = '#5aa7ff';
        g.lineWidth = 3;
        g.strokeRect(sx(pl.x - 0.075), sy(pl.y + ph / 2 + 0.012), px(0.15), px(ph + 0.024));
      }
    }
  }

  // extras decorativos
  if (layout.id === 'router') {
    g.fillStyle = 'rgba(90,167,255,0.25)';
    g.fillRect(sx(-0.48), sy(0.07), 3, px(0.14));
  }
  for (const led of layout.leds || []) {
    g.fillStyle = 'rgba(0,0,0,0.45)';
    g.fillRect(sx(led.x - 0.014), sy(led.y + 0.01), px(0.028), px(0.02));
    g.fillStyle = tc;
    g.globalAlpha = 0.8;
    g.textAlign = 'center';
    g.font = `700 ${px(0.022)}px ${FONT}`;
    g.fillText(led.label, sx(led.x), sy(led.y - 0.03));
    g.globalAlpha = 1;
  }
  if (layout.id === 'odf') {
    g.fillStyle = 'rgba(255,210,31,0.85)';
    g.font = `700 ${px(0.026)}px ${FONT}`;
    g.textAlign = 'left';
    g.fillText('⚠ LUZ LÁSER · NO MIRAR', sx(-0.38), sy(0));
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(cacheKey, tex);
  return tex;
}

export function labelTexture(text, { color = '#e8eef6', bg = 'rgba(10,16,24,0.85)', size = 64, pad = 22, weight = 800 } = {}) {
  const key = `lbl:${text}:${color}:${bg}:${size}`;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `${weight} ${size}px ${FONT}`;
  const tw = Math.ceil(g.measureText(text).width);
  c.width = tw + pad * 2;
  c.height = size + pad * 1.4;
  g.font = `${weight} ${size}px ${FONT}`;
  g.fillStyle = bg;
  const r = 18;
  g.beginPath();
  g.roundRect(0, 0, c.width, c.height, r);
  g.fill();
  g.fillStyle = color;
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  g.fillText(text, c.width / 2, c.height / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.userData.aspect = c.width / c.height;
  cache.set(key, tex);
  return tex;
}

// Textura de chapa perforada para los parantes del rack
export function rackRailTexture() {
  if (cache.has('rail')) return cache.get('rail');
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#5b6573';
  g.fillRect(0, 0, 64, 512);
  g.fillStyle = '#1a1f26';
  for (let i = 0; i < 24; i++) {
    const y = 10 + i * 21;
    g.fillRect(24, y, 16, 10);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  cache.set('rail', tex);
  return tex;
}
