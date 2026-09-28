// ============================================================================
//  Asgore: cuerpo por partes (obj_asgoreb_body), tridente con brazos (obj_asgorespear) y
//  sprites en español que hacen falta en su combate (botones huecos y el botón MERCY que se rompe).
// ============================================================================
import { drawSprite, SPR } from './assets.js';
import { ldx, ldy, pdir } from './gm.js';

// obj_asgoreb_body: 8 partes a escala 2 que se mecen (party[i] += sin/cos(siner/15) * k)
const PARTS = ['spr_asgoreb_cape', 'spr_asgoreb_feet', 'spr_asgoreb_legs', 'spr_asgoreb_dress',
               'spr_asgoreb_armr', 'spr_asgoreb_arml', 'spr_asgoreb_armor', 'spr_asgoreb_head1'];
export class AsgBody {
  constructor(x, y) {
    this.x = x; this.y = y; this.fakeanim = 0; this.siner = 0; this.visible = true;
    this.partx = [-48, 32, 54, 50, 168, 16, 0, 68];
    this.party = [62, 210, 156, 130, 70, 70, 28, 0];
  }
  step() {                                         // Draw_0 (después de dibujar)
    if (!this.visible) return;
    this.siner++; this.fakeanim += 0.1;
    const s = Math.sin(this.siner / 15), c = Math.cos(this.siner / 15), P = this.party;
    P[7] += s * 0.3; P[6] += s * 0.2; P[5] += c * 0.1; P[4] += c * 0.1; P[3] += s * 0.1; P[0] += s * 0.05;
  }
  draw(ctx) {
    if (!this.visible) return;
    PARTS.forEach((p, i) => drawSprite(ctx, p, this.fakeanim, this.x + this.partx[i], this.y + this.party[i], { xs: 2, ys: 2 }));
  }
}

// obj_asgorespear: el tridente rojo flotando, con las dos manos y los brazos de bolitas estirados hasta el cuerpo
export class AsgSpear {
  constructor(x, y) { this.x = x; this.y = y; this.angle = -25; this.siner = 0; this.armtest = 1; this.color = '#f00'; this.visible = true; }
  step() {
    if (!this.visible) return;
    this.siner++;
    this.y += Math.sin(this.siner / 15) * 0.3;
    this.angle += Math.sin(this.siner / 15) * 0.02;
  }
  draw(ctx, body) {
    if (!this.visible) return;
    const { x, y, angle } = this, xh = ldx(55, angle), yh = ldy(55, angle);
    let rx = x + xh * 2, ry = y + yh * 2;
    if (this.armtest === 1 && body) {
      // brazo izquierdo: del hombro (partx[5] + 14, party[5] + 64) a la mano de atrás
      let px = body.partx[5] + 14 + body.x, py = body.party[5] + 64 + body.y;
      let len = Math.hypot(x - xh - px, y - yh - py), ang = pdir(px, py, x - xh, y - yh), sz = len / 40;
      if (sz < 0.35) sz = 0;
      drawSprite(ctx, 'spr_asgoreb_ballarm', 0, px, py, { xs: sz * 2, ys: 2, rot: ang });
      // brazo derecho: si queda muy largo, la mano se acerca por el mango
      px = body.partx[4] + 34 + body.x; py = body.party[4] + 64 + body.y;
      len = Math.hypot(rx - px, ry - py);
      if (len > 100) {
        const off = (len - 100) / 2;
        rx = x + ldx(55 - off, angle) * 2; ry = y + ldy(55 - off, angle) * 2;
        len = Math.hypot(rx - px, ry - py);
      }
      ang = pdir(px, py, rx, ry);
      if (ang > 100) py -= 12;
      sz = len / 40; if (sz < 0.6) sz = 0;
      drawSprite(ctx, 'spr_asgoreb_ballarm', 0, px, py, { xs: sz * 2, ys: 2, rot: ang });
    }
    drawSprite(ctx, 'spr_asgorespear', 0, x, y, { xs: 2, ys: 2, rot: angle, color: this.color });
    drawSprite(ctx, 'spr_spearhandr', 0, rx, ry, { xs: 2, ys: 2, rot: angle });
    drawSprite(ctx, 'spr_spearhandl', 0, x - xh, y - yh, { xs: 2, ys: 2, rot: angle });
  }
}

// ---------------------------------------------------------------- sprites en español (se crean la primera vez)
// Botones huecos (spr_*bt_hollow: sin fondo, para el destello blanco de la intro) y el botón MERCY que
// Asgore rompe (spr_mercybutton_normal / _shatter). Se hacen a partir de los botones en español de
// sprites_es.js; los 11 pedazos se reparten dando cada píxel al pedazo original más cercano.
// Cada lienzo lleva .src propio porque drawSprite guarda los sprites teñidos por src.
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function register(name, frames, like) { SPR[name] = { ...SPR[like], frames, w: frames[0].width, h: frames[0].height }; }
function hollow(im, key) {
  const c = canvas(im.width, im.height), g = c.getContext('2d');
  g.drawImage(im, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) if (p[i + 3] > 0 && p[i] < 24 && p[i + 1] < 24 && p[i + 2] < 24) p[i + 3] = 0;
  g.putImageData(d, 0, 0);
  c.src = 'asgore-es:' + key;
  return c;
}
export function buildAsgoreES() {
  if (SPR.spr_mercybutton_normal_es || !SPR.spr_fightbt_es || !SPR.spr_mercybutton_shatter) return;
  for (const n of ['spr_fightbt', 'spr_talkbt', 'spr_itembt'])
    register(n + '_hollow_es', SPR[n + '_es'].frames.map((im, i) => hollow(im, n + i)), n + '_hollow');
  const normal = hollow(SPR.spr_sparebt_es.frames[0], 'mercy');
  register('spr_mercybutton_normal_es', [normal], 'spr_mercybutton_normal');
  // pedazos: píxeles con tinta de cada pedazo original (110x42, mismo encuadre que el botón)
  const W = 110, H = 42, pieces = SPR.spr_mercybutton_shatter.frames.map(im => {
    const c = canvas(W, H), g = c.getContext('2d'); g.drawImage(im, 0, 0);
    const p = g.getImageData(0, 0, W, H).data, pts = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (p[(y * W + x) * 4 + 3] > 0) pts.push([x, y]);
    return pts;
  });
  const src = normal.getContext('2d').getImageData(0, 0, W, H).data;
  const outs = pieces.map(() => { const c = canvas(W, H); return { c, g: c.getContext('2d'), d: null }; });
  for (const o of outs) o.d = o.g.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4; if (src[i + 3] === 0) continue;
    let best = 0, bd = Infinity;
    pieces.forEach((pts, k) => { for (const [px, py] of pts) { const dd = (px - x) ** 2 + (py - y) ** 2; if (dd < bd) { bd = dd; best = k; } } });
    outs[best].d.data.set(src.subarray(i, i + 4), i);
  }
  register('spr_mercybutton_shatter_es', outs.map((o, k) => { o.g.putImageData(o.d, 0, 0); o.c.src = 'asgore-es:shatter' + k; return o.c; }), 'spr_mercybutton_shatter');
}
