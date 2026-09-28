// Movimiento fluido a cualquier FPS de pantalla (como Bad Time Simulator) sin cambiar la lógica del juego:
// la lógica sigue a 30 FPS como Undertale, y al dibujar cada refresco de pantalla se interpolan las posiciones
// entre el frame anterior y el actual (alpha = cuánto del siguiente frame ya pasó).
// Un combate lo activa con `this.smooth = true`, llama a capture() al empezar cada update y envuelve su dibujo
// con apply() (que devuelve la función que deja los valores como estaban).
const KEYS = ['x', 'y', 'cx', 'ang', 'xs', 'ys', 'bt', 'l', 'r', 't', 'b', 'xoff', 'yoff', 'headx', 'heady'];
const LIMIT = { ang: 60, xs: 1, ys: 1 };              // saltos más grandes (teletransportes, vueltas) no se interpolan

export class Smoother {
  constructor() { this.prev = new Map(); }
  capture(list) {
    this.prev.clear();
    for (const o of list) {
      if (!o || typeof o !== 'object') continue;
      const s = {};
      for (const k of KEYS) if (typeof o[k] === 'number') s[k] = o[k];
      this.prev.set(o, s);
    }
  }
  apply(list, alpha) {
    const saved = [];
    if (!(alpha >= 0 && alpha < 1)) return () => {};
    for (const o of list) {
      const p = o && this.prev.get(o); if (!p) continue;
      const cur = {};
      for (const k in p) {
        const c = o[k]; if (typeof c !== 'number') continue;
        const d = c - p[k];
        if (d === 0 || Math.abs(d) > (LIMIT[k] ?? 64)) continue;
        cur[k] = c; o[k] = p[k] + d * alpha;
      }
      saved.push([o, cur]);
    }
    return () => { for (const [o, cur] of saved) Object.assign(o, cur); };
  }
}
