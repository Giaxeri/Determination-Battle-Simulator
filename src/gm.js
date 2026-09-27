// Utilidades que imitan el runner de GameMaker (movimiento, colisiones y geometría)
import { SPR } from './assets.js';

export const rnd = n => Math.random() * n;                         // random(n)
export const choose = (...a) => a[Math.floor(Math.random() * a.length)];
export const dsin = d => Math.sin(d * Math.PI / 180), dcos = d => Math.cos(d * Math.PI / 180);
export const ldx = (len, dir) => len * dcos(dir);                    // lengthdir_x
export const ldy = (len, dir) => -len * dsin(dir);                   // lengthdir_y
export const pdir = (x1, y1, x2, y2) => (Math.atan2(-(y2 - y1), x2 - x1) * 180 / Math.PI + 360) % 360;   // point_direction

// Movimiento de una instancia: fricción, gravedad y luego x += hspeed, y += vspeed
export function gmMove(o) {
  if (o.friction) {
    const s = Math.hypot(o.hs, o.vs);
    if (s > 0) {
      if (o.friction > 0 && s <= o.friction) { o.hs = 0; o.vs = 0; }
      else { const k = (s - o.friction) / s; o.hs *= k; o.vs *= k; }
    }
  }
  if (o.grav) { o.hs += ldx(o.grav, o.gdir); o.vs += ldy(o.grav, o.gdir); }
  o.x += o.hs; o.y += o.vs;
}
export const dirOf = o => (Math.atan2(-o.vs, o.hs) * 180 / Math.PI + 360) % 360;
export function setSpeedDir(o, speed, dir) { o.hs = ldx(speed, dir); o.vs = ldy(speed, dir); }
export function setDir(o, dir) { setSpeedDir(o, Math.hypot(o.hs, o.vs), dir); }
export function setSpeed(o, speed) { const d = (o.hs || o.vs) ? dirOf(o) : 270; setSpeedDir(o, speed, d); }

// bbox de un sprite con escala y rotación (girando la caja alrededor del origen, como image_angle)
export function rotBBox(name, x, y, ang = 0, xs = 1, ys = xs) {
  const s = SPR[name], [l, t, r, b] = s.bbox, a = ang * Math.PI / 180, c = Math.cos(a), si = Math.sin(a);
  const X = [], Y = [];
  for (const [px, py] of [[l, t], [r + 1, t], [l, b + 1], [r + 1, b + 1]]) {
    const lx = (px - s.ox) * xs, ly = (py - s.oy) * ys;
    X.push(x + lx * c + ly * si); Y.push(y - lx * si + ly * c);
  }
  return { x1: Math.min(...X), y1: Math.min(...Y), x2: Math.max(...X) - 1, y2: Math.max(...Y) - 1 };
}
// Rectángulo (x1,y1,x2,y2) de collision_rectangle, normalizado
export const R = (x1, y1, x2, y2) => ({ x1: Math.min(x1, x2), y1: Math.min(y1, y2), x2: Math.max(x1, x2), y2: Math.max(y1, y2) });
export const hit = (a, b) => a.x1 <= b.x2 && b.x1 <= a.x2 && a.y1 <= b.y2 && b.y1 <= a.y2;

// collision_line: ¿el segmento toca el rectángulo?
export function lineHits(x1, y1, x2, y2, r) {
  const inside = (x, y) => x >= r.x1 && x <= r.x2 + 1 && y >= r.y1 && y <= r.y2 + 1;
  if (inside(x1, y1) || inside(x2, y2)) return true;
  const edges = [[r.x1, r.y1, r.x2 + 1, r.y1], [r.x2 + 1, r.y1, r.x2 + 1, r.y2 + 1], [r.x2 + 1, r.y2 + 1, r.x1, r.y2 + 1], [r.x1, r.y2 + 1, r.x1, r.y1]];
  const cross = (ax, ay, bx, by, cx, cy, dx, dy) => {
    const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx); if (!d) return false;
    const u = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d, v = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
    return u >= 0 && u <= 1 && v >= 0 && v <= 1;
  };
  return edges.some(e => cross(x1, y1, x2, y2, ...e));
}
