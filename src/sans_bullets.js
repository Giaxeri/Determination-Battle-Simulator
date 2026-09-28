// Balas y generadores del combate contra Sans (obj_sansbullet_parent y sus hijos, obj_gasterbl_gen, obj_3platgen,
// obj_sansshadowgen, obj_menubone*). W es el combate (SansBattle): W.ib = global.idealborder [izq, der, arriba, abajo],
// W.box = el borde que se ve, W.H = el alma (obj_heart) y W.objs = las instancias vivas.
import { SPR, drawSprite, playSound } from './assets.js';
import { rotBBox, R, hit, lineHits, ldx, ldy, pdir, choose, rnd, dsin } from './gm.js';
import { drawPart } from './sans_gfx.js';

const BLUE = '#14a9ff';                               // image_blend 16754964 de los huesos azules
const fill = (ctx, x1, y1, x2, y2) => {               // ossafe_fill_rectangle (esquinas incluidas)
  x1 = Math.round(x1); y1 = Math.round(y1); x2 = Math.round(x2); y2 = Math.round(y2);
  if (x2 >= x1 && y2 >= y1) ctx.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
};
const outline = (ctx, x1, y1, x2, y2, color) => {     // draw_rectangle(..., 1)
  const a = Math.round(Math.min(x1, x2)), b = Math.round(Math.min(y1, y2)), c = Math.round(Math.max(x1, x2)), d = Math.round(Math.max(y1, y2));
  ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(a + 0.5, b + 0.5, c - a, d - b);
};
// draw_self_border: solo la parte que queda dentro del borde (izq/der del borde que se ve, arriba/abajo de idealborder)
function clipped(ctx, W, fn) {
  const [, , t, b] = W.ib;
  ctx.save(); ctx.beginPath(); ctx.rect(W.box.l + 1, t + 1, W.box.r - W.box.l, b - t); ctx.clip(); fn(); ctx.restore();
}

// ---------------------------------------------------------------- scr_sbo: obj_sans_bonebul (hueso de abajo, azul o de arriba)
export class BoneBul {
  constructor(W, ht, hs, dist, type) {
    this.kind = 'bonebul'; this.y = W.ib[3] - ht; this.hs = hs; this.type = type; this.x = 320 - hs * dist; this.karma = 6;
  }
  update() { this.x += this.hs; }
  clip(W) {                                          // obj_sans_bonebul User Event 10: cuánto se ve dentro de la caja
    const [l, r] = W.ib; let width = 0, le = 0, rc_cut = 0, rc_le = 0;
    const ww1 = r - this.x; if (ww1 > 0) width = ww1;
    const ww2 = this.x - (l + 5); if (ww2 < 0) { le = -ww2; width = 10 + ww2; }
    if (width > 10) width = 10;
    if (width < 9) { rc_cut = 8 - width; if (rc_cut < 1) rc_cut = 0; }
    if (le > 1) { rc_le = le - 2; rc_cut = 0; if (rc_le > 8) rc_le = 0; }
    return { width, le, rc_cut, rc_le };
  }
  collide(W) {
    const [, , t, b] = W.ib, hb = W.heartBox(), c = this.c = this.clip(W), x = this.x;
    if (c.width > 0) {
      const rc = this.type === 2 ? R(x + 2 + c.rc_le, t + 11, x + 8 - c.rc_cut, this.y) : R(x + 2 + c.rc_le, this.y + 5, x + 8 - c.rc_cut, b - 6);
      if (hit(rc, hb) && (this.type !== 1 || W.heartMoved())) W.hit(this);    // User Event 2 (el azul solo si te mueves)
    }
    if (hit(rotBBox('spr_s_bonebul_top', x, this.y), hb)) W.hit(this);        // colisión de obj_sansbullet_parent
    if ((x < 0 && this.hs < 0) || (x > 640 && this.hs > 0)) this.dead = true;
  }
  draw(ctx, W) {
    const [, , t, b] = W.ib, c = this.c || this.clip(W), x = this.x, w = Math.floor(c.width), le = Math.round(c.le);
    if (c.width <= 0) return;
    if (this.type !== 2) {
      const col = this.type === 1 ? BLUE : null;
      drawPart(ctx, 'spr_s_bonebul_top', 0, le, 0, w, 6, x + le, this.y, col);
      ctx.fillStyle = col || '#fff'; fill(ctx, x + 2 + c.rc_le, this.y + 5, x + 8 - c.rc_cut, b - 6);
      drawPart(ctx, 'spr_s_bonebul_bottom', 0, le, 0, w, 6, x + le, b - 6, col);
    } else {
      drawPart(ctx, 'spr_s_bonebul_top', 0, le, 0, w, 6, x + le, t + 6);
      ctx.fillStyle = '#fff'; fill(ctx, x + 2 + c.rc_le, t + 11, x + 8 - c.rc_cut, this.y);
      drawPart(ctx, 'spr_s_bonebul_bottom', 0, le, 0, w, 6, x + le, this.y);
    }
  }
}

// ---------------------------------------------------------------- scr_bwall: obj_bonewall (huesos de 50 px que asoman del suelo)
export class BoneWall {
  constructor(x, y, hs) { this.kind = 'bonewall'; this.x = x; this.y = y; this.hs = hs; this.ys = 1; this.karma = 6; }
  update() { if ((this.x < 0 && this.hs < 0) || (this.x > 640 && this.hs > 0)) { this.dead = true; return; } this.x += this.hs; }
  collide(W) { if (hit(rotBBox('spr_s_bonewall', this.x, this.y, 0, 1, this.ys), W.heartBox())) W.hit(this); }
  draw(ctx, W) {
    clipped(ctx, W, () => { ctx.beginPath(); ctx.rect(0, 0, 640, this.y + 50 * this.ys); ctx.clip(); drawSprite(ctx, 'spr_s_bonewall', 0, this.x, this.y); });
  }
}
export function scrBwall(W, ht, hs, dist, count) {
  for (let i = 0; i < count; i++) {
    const bn = new BoneWall(320 - dist * hs, W.ib[3] - ht, hs);
    if (bn.x < 320) bn.x -= i * 15; if (bn.x > 320) bn.x += i * 15;
    W.add(bn); if (i === count - 1) return bn;
  }
}

// ---------------------------------------------------------------- obj_bonewall_normal: muros enteros (spr_s_bonewall_tall / _wide)
export class WallNormal {
  constructor(x, y, spr, hs, vs) { this.kind = 'bonewall'; this.x = x; this.y = y; this.spr = spr; this.hs = hs; this.vs = vs; this.karma = 6; }
  update() { this.x += this.hs; this.y += this.vs; if (Math.abs(this.x - 320) > 2500 || Math.abs(this.y - 240) > 2500) this.dead = true; }
  collide(W) { if (hit(rotBBox(this.spr, this.x, this.y), W.heartBox())) W.hit(this); }
  draw(ctx) { drawSprite(ctx, this.spr, 0, this.x, this.y); }     // sin Draw propio: se dibuja entero
}

// ---------------------------------------------------------------- obj_bonestab: huesos que salen de un lado de la caja
export class BoneStab {
  constructor({ dir = 0, height = 25, warning = 9, retain = 4 } = {}) {
    this.kind = 'bonestab'; this.con = 0; this.dir = dir; this.height = height; this.warning = warning; this.retain = retain;
    this.racket = 3; this.active = 0; this.timer = 0; this.a0 = 1; this.karma = 6; this.spr = null; this.x = 0; this.y = 0;
  }
  alarm0(W) {                                        // Alarm_0: se coloca pegado al borde, fuera de la caja
    const [l, r, t, b] = W.ib, d = this.dir;
    this.active = 1; this.con = 1;
    this.spr = d === 1 || d === 3 ? 'spr_s_bonestab_h_tall' : 'spr_s_bonestab_v_wide';
    const s = SPR[this.spr];
    if (d === 0 || d === 2) this.x = l; if (d === 3) this.x = l - s.w; if (d === 1) this.x = r;
    if (d === 0) this.y = b; if (d === 1 || d === 3) this.y = t; if (d === 2) this.y = t - s.h;
    this.iy = this.y; this.ix = this.x;
    if (this.warning > 4) playSound('sans_b');
  }
  update(W) {                                        // Draw_0
    if (this.a0 && --this.a0 === 0) this.alarm0(W);
    const [l, r, t, b] = W.ib, h = this.height, d = this.dir;
    if (this.active === 1) {
      this.warning--;
      if (this.warning > 0) {
        this.warn = d === 0 ? [l + 8, b - 3, r - 3, b - h] : d === 1 ? [r - h, t + 8, r - 3, b - 3] : d === 2 ? [l + 8, t + 6, r - 3, t + 5 + h] : [l + 5 + h, t + 8, l + 8, b - 3];
      } else { this.warn = null; if (this.con === 1) this.con = 2; }
    }
    if (this.con !== 2) return;
    const tm = this.timer;
    if (tm === 0) playSound('spearrise');
    if (tm >= 0 && tm <= 2) { const s = Math.floor(h / 3); if (d === 0) this.y -= s; if (d === 1) this.x -= s; if (d === 2) this.y += s; if (d === 3) this.x += s; }
    if (this.retain >= 0 && tm >= 4 && tm <= 8) {
      const rr = rnd(this.racket) - rnd(this.racket), rr2 = rnd(this.racket) - rnd(this.racket);
      if (this.racket > 1) this.racket--;
      if (d === 0) { this.y = this.iy - h + rr; this.x = this.ix + rr2; }
      if (d === 1) { this.y = this.iy + rr; this.x = this.ix - h + rr2; }
      if (d === 2) { this.y = this.iy + h + rr; this.x = this.ix + rr2; }
      if (d === 3) { this.y = this.iy + rr; this.x = this.ix + h + rr2; }
    }
    if (tm >= 9 + this.retain) {
      const s = Math.floor(h / 4);
      if (d === 0) { this.y += s; if (this.y > this.iy) this.dead = true; }
      if (d === 1) { this.x += s; if (this.x > this.ix) this.dead = true; }
      if (d === 2) { this.y -= s; if (this.y < this.iy) this.dead = true; }
      if (d === 3) { this.x -= s; if (this.x < this.ix) this.dead = true; }
    }
    this.timer++;
  }
  collide(W) { if (this.spr && hit(rotBBox(this.spr, this.x, this.y), W.heartBox())) W.hit(this); }
  draw(ctx, W) {
    if (this.warn) return outline(ctx, ...this.warn, '#f00');
    if (this.spr && this.active) clipped(ctx, W, () => drawSprite(ctx, this.spr, 0, this.x, this.y));
  }
}

// ---------------------------------------------------------------- obj_boneloop_v: huesos que suben/bajan y dan la vuelta
export class BoneLoop {
  constructor(x, y, vs) { this.kind = 'boneloop'; this.x = x; this.y = y; this.vs = vs; this.karma = 5; }
  update(W) {
    const [, , t, b] = W.ib;
    if (this.vs < 0 && this.y < t - 40) this.y = b;
    if (this.vs > 0 && this.y > b) this.y = t - 40;
    this.y += this.vs;
  }
  collide(W) { if (hit(rotBBox('spr_s_boneloop', this.x, this.y), W.heartBox())) W.hit(this); }
  draw(ctx, W) { clipped(ctx, W, () => drawSprite(ctx, 'spr_s_boneloop', 0, this.x, this.y)); }
}

// ---------------------------------------------------------------- scr_hplat: obj_boneplat (plataforma; el alma azul se sube)
export class BonePlat {
  constructor(W, ht, hs, dist, len) {
    this.kind = 'plat'; this.y = W.ib[3] - ht; this.hs = hs; this.vs = 0; this.x = 320 - dist * hs; this.len = len;
    this.lock = 0; this.siner = 0; this.z_a = 0; this.z_b = 0; this.jud = 0; this.jtimer = 0;
  }
  update() { this.x += this.hs; this.y += this.vs; }
  collide(W) {                                       // Draw_0: colisión, arrastrar el alma, desaparecer, ir y volver (jud)
    const H = W.H, [l, r, , b] = W.ib, len = this.len;
    this.siner++;
    if (this.z_b !== 0) this.hs = Math.cos(this.z_a * this.siner) * this.z_b;
    if (hit(R(this.x - len + 2, this.y + 2, this.x + len - 2, this.y - 4), W.heartBox())) {
      if (H.vs >= 0 && H.y <= this.y - 11) { this.lock = 1; H.y = this.y - 16; H.vs = 0; H.js = 1; }
    } else {
      if (this.lock === 1 && H.js === 1) { H.js = 2; H.vs = 0; }
      this.lock = 0;
    }
    if (this.lock === 1) {
      H.x += this.hs; H.y += this.vs;
      if (H.x < l + 5) H.x = l + 5; if (H.x > r - 16) H.x = r - 16;
    }
    if ((this.x < -len && this.hs < 0) || (this.x > 640 + len && this.hs > 0) || (this.vs > 0 && this.y > b)) this.destroy(W);
    if (this.jud === 1) {
      this.jtimer++;
      if (this.jtimer >= 5 && this.jtimer <= 20) this.hs += 0.25;
      if (this.jtimer === 21) this.hs = 3;
      if (this.x > r - len && this.hs > 0) this.hs *= -1;
      if (this.x < l + len && this.hs < 0) this.hs *= -1;
    }
  }
  destroy(W) { if (this.lock === 1 && W.H.js === 1) { W.H.js = 2; W.H.vs = 0; } this.lock = 0; this.dead = true; }   // Destroy_0
  draw(ctx) {
    outline(ctx, this.x - this.len, this.y, this.x + this.len, this.y + 6, '#fff');
    outline(ctx, this.x - this.len, this.y + 2, this.x + this.len, this.y - 4, '#008000');
  }
}

// ---------------------------------------------------------------- obj_gasterblaster
export class Blaster {
  constructor(W, x = 0, y = 0) {
    this.kind = 'blaster'; this.x = x; this.y = y; this.con = 1; this.idealx = 200; this.idealy = 200; this.idealrot = 90;
    this.xs = 1; this.ys = 1; this.frame = 0; this.pause = 8; this.col_o = 0; this.bt = 0; this.btimer = 0; this.fade = 1;
    this.terminal = 10; this.bb = 0; this.bbsiner = 0; this.karma = 10; this.ang = 0; this.speed = 0; this.dir = 0; this.a4 = 0;
    W.pPower = 1;                                    // obj_sansb: suena sfx_segapower
  }
  set(o) { Object.assign(this, o); return this; }
  update(W) {
    if (this.a4 > 0 && --this.a4 === 0) this.con++;
    if (this.speed) { this.x += ldx(this.speed, this.dir); this.y += ldy(this.speed, this.dir); }
    if (this.con === 1) {                            // Draw_0: se acerca a su sitio girando
      this.x += Math.floor((this.idealx - this.x) / 3); this.y += Math.floor((this.idealy - this.y) / 3);
      if (this.x < this.idealx) this.x++; if (this.y < this.idealy) this.y++;
      if (this.x > this.idealx) this.x--; if (this.y > this.idealy) this.y--;
      if (Math.abs(this.x - this.idealx) < 3) this.x = this.idealx;
      if (Math.abs(this.y - this.idealy) < 3) this.y = this.idealy;
      this.ang += Math.floor((this.idealrot - this.ang) / 3);
      if (this.ang < this.idealrot) this.ang++; if (this.ang > this.idealrot) this.ang--;
      if (Math.abs(this.ang - this.idealrot) < 3) this.ang = this.idealrot;
      if (Math.abs(this.x - this.idealx) < 0.1 && Math.abs(this.y - this.idealy) < 0.1 && Math.abs(this.idealrot - this.ang) < 0.01) { this.con = 4; this.a4 = this.pause; }
    }
    if (this.con === 5) { this.con = 6; this.a4 = 4; }
    if (this.con === 6) this.frame++;
    this.beam = null;
    if (this.con === 7) {                            // dispara: retrocede y el rayo crece y se apaga
      this.frame = this.frame === 4 ? 5 : 4;
      this.dir = this.idealrot + 90;
      if (this.btimer === 0) { W.pBeam = 1; if (this.xs >= 2) W.shaker(5); }
      this.btimer++;
      if (this.btimer < 5) { this.speed += 1; this.bt += Math.floor(35 * this.xs / 4); } else this.speed += 4;
      if (this.btimer > 5 + this.terminal) { this.bt *= 0.8; this.fade -= 0.1; if (this.bt <= 2) { this.dead = true; return; } }
      const sw = 43 * this.xs, sh = 57 * this.ys;
      if (this.x < -sw || this.x > 640 + sw || this.y > 480 + sh || this.x < -sh) this.speed = 0;
      this.bbsiner++;
      this.bb = Math.sin(this.bbsiner / 1.5) * this.bt / 4;
      const a = this.ang - 90, k = this.xs / 2;
      this.beam = { xx: ldx(70, a) * k, yy: ldy(70, a) * k, xxx: ldx(1000, a), yyy: ldy(1000, a), xxa: ldx(50, a) * k, yya: ldy(50, a) * k,
                    xxb: ldx(60, a) * k, yyb: ldy(60, a) * k, rr: rnd(2) - rnd(2), rr2: rnd(2) - rnd(2), alpha: this.btimer > 5 + this.terminal ? this.fade : 1 };
    }
  }
  collide(W) {
    const hb = W.heartBox();
    if (hit(rotBBox('spr_gasterblaster', this.x, this.y, this.ang, this.xs, this.ys), hb)) W.hit(this);
    if (this.con !== 7 || !this.beam) return;
    if (this.col_o === 1 && this.fade >= 0.8) {     // 8 líneas a lo ancho del rayo (collision_line)
      const B = this.beam, nx = ldx(1, this.ang), ny = ldy(1, this.ang), x = this.x, y = this.y;
      for (const s of [-1, 1]) for (let cl = 0; cl < 4; cl++) {
        const ox = s * nx * this.bt / 2 * cl / 4, oy = s * ny * this.bt / 2 * cl / 4;
        if (lineHits(x + B.xx + ox, y + B.yy + oy, x + B.xxx + ox, y + B.yyy + oy, hb)) W.hit(this);
      }
    }
    if (this.col_o === 0) this.col_o = 1;
  }
  draw(ctx) {
    drawSprite(ctx, 'spr_gasterblaster', this.frame, this.x, this.y, { xs: this.xs, ys: this.ys, rot: this.ang });
    const B = this.beam; if (!B) return;
    const x = this.x + B.rr, y = this.y + B.rr2, line = (x1, y1, x2, y2, w) => {
      if (w <= 0) return; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    };
    ctx.save(); ctx.globalAlpha = Math.max(0, B.alpha); ctx.strokeStyle = '#fff'; ctx.lineCap = 'butt';
    line(x + B.xx, y + B.yy, x + B.xxx, y + B.yyy, this.bt + this.bb);
    line(x + B.xx, y + B.yy, x + B.xxa, y + B.yya, this.bt / 2 + this.bb);
    line(x + B.xx, y + B.yy, x + B.xxb, y + B.yyb, this.bt / 1.25 + this.bb);
    ctx.restore();
  }
}
// El alma: centro (obj_heart.x+8, obj_heart.y+8)
const hc = W => [W.H.x + 8, W.H.y + 8];

// ---------------------------------------------------------------- obj_gasterbl_gen: blasters que apuntan al alma desde todas partes
export class GasterGen {
  constructor(type) { this.kind = 'gen'; this.type = type; this.a0 = 10; }
  update(W) {
    if (--this.a0 > 0) return;
    const T = this.type, [px, py] = hc(W);
    this.a0 = [13, 16, 20][T];
    const dd = rnd(360), gb = new Blaster(W, px, py);
    gb.idealx = Math.min(590, Math.max(50, gb.x + ldx(200, dd)));
    gb.idealy = Math.min(440, Math.max(40, gb.y + ldy(200, dd)));
    gb.x += ldx(400, dd); gb.y += ldy(300, dd);
    gb.idealrot = pdir(gb.idealx, gb.idealy, px, py) + 90;
    gb.xs = T === 2 ? 2 : 1; gb.ys = 2; gb.terminal = 1; gb.pause = [9, 14, 20][T];
    W.add(gb);
  }
}

// ---------------------------------------------------------------- obj_3platgen: plataformas a dos alturas con huesos o blasters
export class PlatGen3 {
  constructor(type) { this.kind = 'gen'; this.type = type; this.a = [1, 1, 1, 0]; this.g = 4; this.gg = 4; this.gg2 = 4; this.skl = 0; this.sd = 0; }
  zone(W) {
    const t = W.ib[2], y = W.H.y; let zone = 0; if (y >= t + 40) zone = 1; if (y >= t + 80) zone = 2;
    this.gg2 = this.gg; this.gg = this.g; this.g = choose(0, 1, 2);
    let reroll = 0;
    if (this.gg === this.g && this.gg2 === this.gg) reroll = 1;
    if (this.g === 0 && zone === 0) reroll = 1;
    if (this.g === 1 && zone === 2) reroll = 1;
    if (reroll) this.g = choose(0, 1, 2);
  }
  update(W) {
    for (let i = 0; i < 4; i++) if (this.a[i] > 0 && --this.a[i] === 0) this['alarm' + i](W);
  }
  alarm0(W) {
    const T = this.type;
    if (T === 0) { this.a[0] = 100; W.add(new BonePlat(W, 40, -2, 125, 60)); }
    if (T === 1) { this.a[0] = 55; W.add(new BonePlat(W, 40, -4, 65, 60)); }
    if (T === 2 || T === 3) { this.a[0] = 35; W.add(new BonePlat(W, 40, -4, 65, 25)); this.a[2] = -1; if (this.skl === 0) { this.skl = 1; this.a[3] = 1; } }
  }
  alarm1(W) {
    const T = this.type;
    if (T === 0) { this.a[1] = 100; W.add(new BonePlat(W, 80, 2, 125, 60)); }
    if (T === 1) { this.a[1] = 70; W.add(new BonePlat(W, 80, 4, 80, 80)); }
    if (T === 2 || T === 3) { this.a[1] = 40; W.add(new BonePlat(W, 80, 4, 80, 25)); }
  }
  alarm2(W) {
    this.zone(W);
    if (this.g === 0) W.add(new BoneBul(W, 35, -4, 50, 0));
    if (this.g === 1) W.add(new BoneBul(W, 90, -4, 50, 2));
    if (this.g === 2) scrBwall(W, 80, 4, 50, 1).ys = 0.8;
    if (this.type === 0 || this.type === 1) this.a[2] = 15;
  }
  alarm3(W) {
    this.zone(W);
    const [l, r, t, b] = W.ib, gb = new Blaster(W);
    if (this.sd === 0) gb.idealx = l - 60; else { gb.idealx = r + 60; gb.x = 640; }
    gb.idealy = [b - 20, t + 35, t + 75][this.g];
    gb.idealrot = this.sd === 0 ? 90 : -90;
    W.add(gb);
    for (const o of W.objs) if (o.kind === 'blaster') { o.pause = 17; o.terminal = 3; o.ys = 2; }
    this.sd = this.sd ? 0 : 1;
    this.a[3] = this.type === 3 ? 21 : 26;
  }
}

// ---------------------------------------------------------------- obj_sansshadowgen: ataques rápidos separados por un corte a negro
export class ShadowGen {
  constructor(W, level, max, a0 = 0) {
    this.kind = 'shadowgen'; this.shadow = 0; this.level = level; this.prev_s = 3; this.laser_d = 0; this.num = 0; this.max = max; this.a = [0, 0];
    W.insta = 1; W.border = -1;
    this.user0(W);
    if (a0) this.a[0] = a0;
  }
  user0(W) {                                         // User Event 0: pantalla negra, se borra todo, suena snd_noise
    this.shadow = 1; this.a[0] = this.level >= 2 ? 3 : 12;
    W.musicPause();
    W.objs = W.objs.filter(o => !['bonestab', 'bonewall', 'plat', 'bonebul', 'blaster'].includes(o.kind) || o === this);
    W.shakeV = null;
    if (this.num >= this.max) W.border = 0;
    playSound('sans_noise'); W.showBox = false;
  }
  update(W) {
    if (this.a[0] > 0 && --this.a[0] === 0) this.alarm0(W);
    if (this.a[1] > 0 && --this.a[1] === 0) this.user0(W);
  }
  blue(W, l, r, js = 2) { const H = W.H; H.mv = 2; H.js = js; H.spr = 'spr_heartblue'; H.hs = 0; H.vs = 0; W.ib = [l, r, W.ib[3] - 110, W.ib[3]]; }
  alarm0(W) {
    W.showBox = true; playSound('sans_noise'); W.musicResume(); this.shadow = 0; W.ib[3] = 385;
    const L = this.level;
    let s;
    const pick = (...a) => { s = choose(...a); if (this.prev_s === s) s = choose(...a); if (this.prev_s === s) s = choose(...a); };
    if (L === 0) pick(0, 1, 2, 3, 4);
    if (L === 1) pick(5, 6, 7, 8);
    if (L === 2) pick(0, 1, 2, 3, 4, 5, 6, 7, 8);
    if (L === 3) { s = 50; if (this.prev_s === 50) s = 51; if (this.prev_s === 51) s = 52; if (this.prev_s === 52) s = 53; if (this.prev_s === 53) s = 54; }
    this.prev_s = s;
    const H = W.H, body = W.body;
    if (this.num >= this.max) {                      // se acabó: vuelve el menú
      body.x = 320; W.insta = 0; this.dead = true;
      H.mv = 1; H.js = 0; H.spr = 'spr_heart'; H.hs = H.vs = 0;
      W.endTurn(L < 3);
      return;
    }
    if (L < 3) body.x = 100 + rnd(440);
    this.num++;
    const sbo = (...a) => W.add(new BoneBul(W, ...a));
    let [l, r, t, b] = W.ib;
    if (s === 0 || s === 1) {
      this.blue(W, 120, 520); [l, r, t, b] = W.ib;
      H.x = l + (r - l) / 2 - 5; H.y = b - 15;
      if (s === 0) { for (const k of [25, 27, 29, 31]) { sbo(45, 8, k, 0); sbo(45, -8, k, 0); } sbo(100, 8, 33, 0); sbo(100, -8, 33, 0); this.a[1] = 28; }
      else { sbo(100, 8, 25, 1); sbo(100, -8, 25, 1); sbo(20, 8, 34, 0); sbo(20, -8, 34, 0); sbo(100, 8, 38, 0); sbo(100, -8, 38, 0); this.a[1] = 35; }
    }
    if (s === 2 || s === 3) {
      this.blue(W, 170, 470); [l, r, t, b] = W.ib;
      H.x = l + (r - l) / 2 - 5; H.y = b - 15;
      if (s === 2) {
        let value = 0;
        for (let i = 0; i < 7; i++) {
          const ht = choose(20, 30, 40); let xx = 0; if (i > 0) xx = choose(-2, 0, 2);
          const d = 25 + i * 22 + value;
          sbo(ht, 6 + xx, d, 0); sbo(ht, -6 + xx, d, 0); sbo(ht + 24, 6 + xx, d, 2); sbo(ht + 24, -6 + xx, d, 2);
          if (ht === 30) value += 5; if (ht === 40) value += 10;
        }
        this.a[1] = 58;
      } else {
        for (let i = 0; i < 8; i++) { sbo(15, 5, 25 + i * 25, 0); sbo(15, -5, 25 + i * 25, 0); sbo(40, 5, 25 + i * 25, 2); sbo(40, -5, 25 + i * 25, 2); }
        this.a[1] = 52;
      }
    }
    if (s === 4) {
      H.mv = 2; H.js = 2; H.spr = 'spr_heartblue'; H.hs = H.vs = 0;
      W.ib[0] = 120; W.ib[1] = 520;
      const sd = choose(1, -1);
      H.x = sd === 1 ? W.ib[0] + 20 : W.ib[1] - 20; H.y = W.ib[3] - 15; W.ib[2] = W.ib[3] - 110;
      for (let k = 11; k <= 31; k += 2) sbo(55, -12 * sd, k, 0);
      for (let k = 33; k <= 51; k += 2) sbo(15, -12 * sd, k, 0);
      this.a[1] = 47;
    }
    if (s === 5) {
      this.blue(W, 120, 520); H.vs = 1; [l, r, t, b] = W.ib;
      H.x = l + (r - l) / 2; H.y = b - 90;
      const d = choose(1, -1);
      sbo(75, 8 * d, 27, 2); sbo(65, -8 * d, 42, 0);
      W.add(new BonePlat(W, 70, 0, 0, 20)).x += 8;
      W.add(new BonePlat(W, 30, 0, 0, 20)).x += 8;
      for (let i = 0; i < 30; i++) W.add(new BoneWall(l + i * 16, b - 20, 0));
      this.a[1] = 45;
    }
    if (s === 6 || s === 7) {
      H.mv = 1; H.spr = 'spr_heart_battle_pl'; H.hs = H.vs = 0;
      W.ib = [240, 400, W.ib[3] - 160, W.ib[3]]; [l, r, t, b] = W.ib;
      const hwd = l + (r - l) / 2, hht = t + (b - t) / 2;
      H.x = hwd - 8; H.y = hht - 8;
      if (s === 6) {
        const set = (rot, ix, iy) => W.add(new Blaster(W, 0, 0)).set({ idealrot: rot, idealx: ix, idealy: iy, xs: 2, ys: 2 });
        if (choose(0, 1) === 0) { set(90, l - 50, hht); set(-90, r + 50, hht); set(0, hwd, t - 60); set(180, hwd, b + 60); }
        else { set(45, l - 50, t - 50); set(-45, r + 50, t - 50); set(135, l - 50, b + 50); set(-135, r + 50, b + 50); }
        for (const o of W.objs) if (o.kind === 'blaster') { o.pause = 18 - this.laser_d; o.terminal = 8; o.x = o.idealx; o.y = o.idealy; o.ang = o.idealrot; }
        this.a[1] = 37 - this.laser_d;
      } else {
        const dd = choose(-1, 1);
        if (dd === -1) { H.x = l + 20; W.ib[1] = r + 60; }
        if (dd === 1) { H.x = r - 20; W.ib[0] = l - 60; }
        const rr = choose(-1, 1);
        for (let i = 0; i < 16; i++) { sbo(105 - Math.sin(i / 3) * 28 * rr, 10 * dd, 16 + i * 2, 2); sbo(60 - Math.sin(i / 3) * 28 * rr, 10 * dd, 16 + i * 2, 0); }
        this.a[1] = 52;
      }
    }
    if (s === 8) {
      this.blue(W, 120, 520); [l, r, t, b] = W.ib;
      const sd = choose(1, -1);
      H.x = sd === 1 ? r - 40 : l + 40; H.y = b - 15;
      for (let i = 0; i < 10; i++) { sbo(20, 4 * sd, -5 + i * 19, 0); sbo(28, -4 * sd, -5 + i * 19, 2); }
      this.a[1] = 57;
    }
    if (s >= 50) {                                   // nivel 3 (ataque final): golpes contra las paredes
      W.ib = [240, 400, W.ib[3] - 160, W.ib[3]]; [l, r, t, b] = W.ib;
      const hwd = l + (r - l) / 2, hht = t + (b - t) / 2;
      H.hs = H.vs = 0;
      const st = (dir, warning, o = {}) => W.add(new BoneStab({ dir, warning, height: 50, ...o }));
      if (s === 50) { H.mv = 2; H.js = 2; H.spr = 'spr_heartblue'; H.vs = 1; H.x = hwd - 8; H.y = b - 15; st(0, 18); st(2, 18); this.a[1] = 27; }
      if (s === 51) { H.mv = 12; H.spr = 'spr_heartblue_u'; H.vs = -2; H.x = l + 15; H.y = t + 10; st(2, 19); st(3, 19); this.a[1] = 27; }
      if (s === 52) { H.mv = 11; H.spr = 'spr_heartblue_r'; H.hs = 2; H.x = r - 15; H.y = b - 15; st(0, 19); st(1, 19); this.a[1] = 27; }
      if (s === 53) {                                // (el juego pone obj_heart.y = (idealborder[2] == hht-8), o sea 0: queda arriba)
        H.mv = 13; H.spr = 'spr_heartblue_l'; H.hs = -2; H.x = l + 10; H.y = 0; st(3, 19, { retain: 10 }); this.a[1] = 22;
        body.x = 320; body.lac = 49; body.a[5] = 20; this.dead = true;
      }
    }
  }
  draw(ctx) { if (this.shadow === 1) { ctx.fillStyle = '#000'; ctx.fillRect(-10, -10, 1010, 1010); } }
}

// ---------------------------------------------------------------- obj_menubone_maker / obj_menubone / obj_menubone_bottom
// Huesos que atacan al alma en los menús (de hit_try 14 a 22). Como en el juego, no te pueden dejar con menos de 1 PV.
export class MenuBoneMaker {
  constructor(W) {
    this.kind = 'menumaker'; this.a = [0, 0, 0, 0, 0, 0];
    if (W.mobjs.some(o => o.kind === 'menubone')) { this.dead = true; return; }
    const ht = W.hitTry; let h = 0;
    if (ht === 14 || ht === 15) h = 1; if (ht === 16 || ht === 17) h = 2;
    if (ht >= 23) { this.dead = true; return; }
    if (h !== 2) this.a[0] = 1;
    if (h !== 1) { this.a[1] = 3; this.a[2] = 20; this.a[3] = 3; this.a[4] = 20; }
    this.a[5] = 50;
  }
  update(W) {
    for (let i = 0; i < 6; i++) if (this.a[i] > 0 && --this.a[i] === 0) {
      if (i === 0) W.mobjs.push(new MenuBone());
      if (i >= 1 && i <= 4) W.mobjs.push(new MenuBoneBottom(i - 1));
      if (i === 5 || i === 4) { this.dead = true; return; }
    }
  }
  draw() {}
}
class MenuBone {                                     // el que se asoma por la izquierda del menú de FIGHT/ACT
  constructor() { this.kind = 'menubone'; this.y = 270; this.x = -10; this.siner = 0; this.terminate = 0; }
  update(W) {
    this.siner++;
    this.x = -30 + Math.abs(Math.sin(this.siner / 9) * 105);
    if (this.x >= 64) this.siner -= 0.72;
    if (this.x <= -8 && this.terminate) { this.dead = true; return; }
    const hb = W.menuHeartBox();
    if (hb && hit(rotBBox('spr_s_boneloop_out', this.x, this.y), hb) && W.body.damageturn === 0) {
      if (W.player.hp >= 60) W.km += 1;
      W.bodyHurt(); if (W.player.hp < 1) W.player.hp = 1;
    }
  }
  draw(ctx) { drawSprite(ctx, 'spr_s_boneloop_out', 0, this.x, this.y); }
}
class MenuBoneBottom {                               // los que suben bajo los botones y los recorren
  constructor(spot) {
    this.kind = 'menubone'; this.spot = spot; this.con = 1; this.terminate = 0; this.x = -20; this.y = -20; this.hs = 0; this.vs = 0;
    this.myspeed = -5; this.idealy = 440; [this.idealx, this.idealx2] = [[140, 10], [300, 170], [450, 320], [620, 490]][spot];
  }
  update(W) {
    if (this.con === 1) { this.x = this.idealx; this.y = 480; this.vs = -10; this.con = 2; }
    if (this.con === 2 && this.y <= this.idealy) { this.vs = 0; this.hs = this.myspeed; this.con = 3; }
    if (this.con === 3 && ((this.hs < 0 && this.x <= this.idealx2) || (this.hs > 0 && this.x >= this.idealx2))) { this.hs = 0; this.vs = 10; this.con = 4; }
    if (this.con === 4 && this.y >= 480) { this.hs = this.vs = 0; this.con = 1; if (this.terminate) { this.dead = true; return; } }
    this.x += this.hs; this.y += this.vs;
    const hb = W.menuHeartBox();
    if (hb && hit(rotBBox('spr_s_boneloop_out', this.x, this.y), hb) && W.body.damageturn === 0) {
      W.bodyHurt(); if (W.player.hp < 1) W.player.hp = 1;
    }
  }
  draw(ctx) { drawSprite(ctx, 'spr_s_boneloop_out', 0, this.x, this.y); }
}

// ---------------------------------------------------------------- efectos: obj_strike_temp, obj_sans_z_battle
export class StrikeTemp {
  constructor(x, y, sc, speed) { this.kind = 'fx'; this.x = x; this.y = y; this.sc = sc; this.speed = speed; this.f = 0; }
  update() { this.f += this.speed; if (this.f >= 6) this.dead = true; }
  draw(ctx) { drawSprite(ctx, 'spr_strike', this.f, this.x, this.y, { xs: this.sc, ys: this.sc }); }
}
export class SleepZ {
  constructor(x, y) { this.kind = 'fx'; this.x = x; this.y = y; this.a = 1; this.sc = 0.1; this.siner = 0; this.vs = -1; }
  update() {
    this.vs -= 0.04; this.x += 2; this.y += this.vs;                 // hspeed 2, gravity -0.04: sube cada vez más rápido
    this.siner++; this.x += Math.sin(this.siner / 4); this.y += Math.cos(this.siner / 4);
    if (this.sc < 1) this.sc += 0.04;
    if (this.siner > 60) { this.a -= 0.1; if (this.a < 0.1) this.dead = true; }
  }
  draw(ctx) { drawSprite(ctx, 'spr_sans_z_battle', 0, this.x, this.y, { xs: this.sc, ys: this.sc, alpha: this.a }); }
}
