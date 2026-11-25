// Texturas de canvas (sin archivos externos).
import * as THREE from 'three';

const cache = new Map();
const FONT = '"Segoe UI", "Roboto", Arial, sans-serif';

export function labelTexture(text, { color = '#e8eef6', bg = 'rgba(10,16,24,0.85)', size = 64, pad = 22 } = {}) {
  const key = `${text}|${color}|${bg}|${size}`;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `800 ${size}px ${FONT}`;
  c.width = Math.ceil(g.measureText(text).width) + pad * 2;
  c.height = size + pad * 1.4;
  g.font = `800 ${size}px ${FONT}`;
  g.fillStyle = bg;
  g.beginPath();
  g.roundRect(0, 0, c.width, c.height, 18);
  g.fill();
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, c.width / 2, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.userData.aspect = c.width / c.height;
  cache.set(key, t);
  return t;
}

// Baldosas / pasto con ruido suave
export function floorTexture(kind) {
  const key = 'floor:' + kind;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  if (kind === 'grass') {
    g.fillStyle = '#3f6b33';
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = Math.random() > 0.5 ? 'rgba(90,140,70,0.5)' : 'rgba(40,80,35,0.5)';
      g.fillRect(Math.random() * 128, Math.random() * 128, 2, 3);
    }
  } else {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(0,0,0,0.12)';
    g.lineWidth = 2;
    for (let i = 0; i <= 128; i += 32) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 128);
      g.stroke();
      g.beginPath();
      g.moveTo(0, i);
      g.lineTo(128, i);
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  cache.set(key, t);
  return t;
}
