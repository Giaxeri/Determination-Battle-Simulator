// Movimiento fluido a cualquier FPS de pantalla (como Bad Time Simulator) sin tocar la lógica del juego.
// La lógica sigue a 30 FPS como Undertale. Tras cada frame de lógica se hace el dibujo "real" en un lienzo que no
// se ve (muchos objetos traducidos del juego tienen lógica en su evento Draw y debe correr una vez por frame).
// Lo que se ve es un dibujo "fantasma" en cada refresco de la pantalla: se guardan todos los objetos del combate,
// se interpolan sus posiciones entre el frame anterior y el actual, se dibuja sin sonido y se deja todo como estaba.
import { SPR, FNT, RENDER } from './assets.js';

const KEYS = ['x', 'y', 'cx', 'ang', 'angle', 'rot', 'xs', 'ys', 'bt', 'xoff', 'yoff', 'headx', 'heady'];
const BOX = ['l', 'r', 't', 'b'];                     // cajas (solo si el objeto tiene los cuatro bordes numéricos)
const LIMIT = { ang: 60, angle: 60, rot: 60, xs: 1, ys: 1 };   // saltos más grandes (teletransportes, vueltas) no se interpolan
const SKIP = new Set([SPR, FNT]);

function skippable(o) {
  return SKIP.has(o) || (typeof Node !== 'undefined' && o instanceof Node) || ArrayBuffer.isView(o) || o instanceof ArrayBuffer ||
    (typeof ImageData !== 'undefined' && o instanceof ImageData) || (typeof ImageBitmap !== 'undefined' && o instanceof ImageBitmap) ||
    (typeof AudioNode !== 'undefined' && o instanceof AudioNode) || (typeof AudioParam !== 'undefined' && o instanceof AudioParam) ||
    (typeof AudioBuffer !== 'undefined' && o instanceof AudioBuffer) || (typeof CanvasRenderingContext2D !== 'undefined' && o instanceof CanvasRenderingContext2D) ||
    o instanceof Map || o instanceof Set || o instanceof WeakMap || o instanceof Promise || o instanceof Date || o instanceof RegExp;
}
// Todos los objetos alcanzables desde el combate (balas, cuerpos, cajas, textos...)
function collect(root) {
  const seen = new Set(), list = [], st = [root];
  while (st.length) {
    const o = st.pop();
    if (!o || typeof o !== 'object' || seen.has(o) || skippable(o)) continue;
    seen.add(o); list.push(o);
    if (list.length > 30000) break;
    const vals = Array.isArray(o) ? o : Object.values(o);
    for (const v of vals) if (v && typeof v === 'object') st.push(v);
  }
  return list;
}
function pick(o) {
  let p = null;
  for (const k of KEYS) { const v = o[k]; if (typeof v === 'number' && isFinite(v)) (p || (p = {}))[k] = v; }
  if (BOX.every(k => typeof o[k] === 'number')) for (const k of BOX) (p || (p = {}))[k] = o[k];
  return p;
}

export class Smoother {
  constructor() { this.prev = new Map(); this.cur = new Map(); this.dummy = null; }
  reset() { this.prev = new Map(); this.cur = new Map(); }
  // Tras cada frame de lógica: dibujo real (con sus efectos) en un lienzo oculto y foto de las posiciones
  step(scene) {
    if (!this.dummy) { const c = document.createElement('canvas'); c.width = 640; c.height = 480; this.dummy = c.getContext('2d'); this.dummy.imageSmoothingEnabled = false; }
    this.dummy.setTransform(1, 0, 0, 1, 0, 0);
    scene.draw(this.dummy);
    this.prev = this.cur; this.cur = new Map();
    for (const o of collect(scene)) { const p = pick(o); if (p) this.cur.set(o, p); }
  }
  // Cada refresco de pantalla: dibujo interpolado (alpha = fracción del frame siguiente que ya pasó) sin efectos
  render(scene, ctx, alpha) {
    const t0 = performance.now();
    const list = collect(scene);
    const snap = list.map(o => Array.isArray(o) ? o.slice() : { ...o });
    for (const o of list) {
      const p = this.prev.get(o), c = this.cur.get(o); if (!p || !c) continue;
      for (const k in c) {
        if (!(k in p)) continue;
        const d = c[k] - p[k];
        if (d !== 0 && Math.abs(d) <= (LIMIT[k] ?? 64) && o[k] === c[k]) o[k] = p[k] + d * alpha;
      }
    }
    RENDER.ghost = true;
    try { scene.draw(ctx); }
    finally {
      RENDER.ghost = false;
      list.forEach((o, i) => {                      // todo vuelve a como estaba antes del dibujo fantasma
        const s = snap[i];
        if (Array.isArray(o)) { o.length = s.length; for (let j = 0; j < s.length; j++) o[j] = s[j]; }
        else { for (const k of Object.keys(o)) if (!(k in s)) delete o[k]; Object.assign(o, s); }
      });
      this.ms = performance.now() - t0; this.objs = list.length;   // (medida para depurar)
    }
  }
}
