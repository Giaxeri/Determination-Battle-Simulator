// ============================================================================
//  Asriel Dreemurr: balas y generadores de ataques (traducidos de los objetos del juego).
//  Cada objeto tiene update(b), draw(ctx), depth (como en GameMaker: mayor = más al fondo) y dead.
//  b = la batalla (AsrielBattle): box, heart, body, add(), asHit(), bltHit(), snd(), shakeView()...
// ============================================================================
import { drawSprite, SPR } from './assets.js';
import { rnd, choose, dsin, dcos, ldx, ldy, pdir, gmMove, dirOf, setSpeedDir, setDir, rotBBox, R, hit, lineHits } from './gm.js';

// make_color_hsv de GameMaker (0-255). El tono se redondea para no llenar la caché de tintes.
export function hsv(h, s, v) {
  h = ((Math.round(h / 4) * 4) % 256 + 256) % 256;
  const H = h / 255 * 6, S = s / 255, V = v / 255, i = Math.floor(H) % 6, f = H - Math.floor(H);
  const p = V * (1 - S), q = V * (1 - f * S), t = V * (1 - (1 - f) * S);
  const [r, g, b] = [[V, t, p], [q, V, p], [p, V, t], [p, q, V], [t, p, V], [V, p, q]][i];
  const x = n => Math.round(n * 255).toString(16).padStart(2, '0');
  return '#' + x(r) + x(g) + x(b);
}
export const gmColor = c => '#' + [c & 255, (c >> 8) & 255, (c >> 16) & 255].map(n => n.toString(16).padStart(2, '0')).join('');   // BGR -> #rgb
const outside = (o, m = 40) => o.x < -m || o.x > 640 + m || o.y < -m || o.y > 480 + m;   // Other_0 (fuera de la sala)
const heartBox = b => ({ x1: b.heart.x, y1: b.heart.y, x2: b.heart.x + 15, y2: b.heart.y + 15 });
export { heartBox };
// Bordes de la caja (obj_lborder, obj_uborder...): 5 px de grosor
function borders(box) {
  const { l, r, t, b } = box;
  return { L: R(l, t, l + 4, b + 4), Rt: R(r, t, r + 4, b + 4), U: R(l, t, r + 4, t + 4), D: R(l, b, r + 4, b + 4) };
}

// Objeto con alarmas al estilo GameMaker (alarm[n] = k: salta k pasos después)
class Obj {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; this.hs = 0; this.vs = 0; this.depth = 0; this.al = {}; this.dead = false; }
  tickAlarms() { for (const k of Object.keys(this.al)) { if (this.al[k] > 0 && --this.al[k] === 0) { delete this.al[k]; this.alarm(+k); } } }
  alarm() {}
  get speed() { return Math.hypot(this.hs, this.vs); }
  set speed(s) { setSpeedDir(this, s, this.hs || this.vs ? dirOf(this) : (this._dir ?? 0)); }
  get direction() { return this.hs || this.vs ? dirOf(this) : (this._dir ?? 0); }
  set direction(d) { this._dir = d; setSpeedDir(this, this.speed, d); }
}

// ============================================================================ efectos visuales
// obj_afterimage_asriel: silueta de Asriel que se desvanece cambiando de color
export class Afterimage extends Obj {
  constructor(x, y, depth) { super(x, y); this.alpha = 0.5; this.hue = -20; this.depth = depth; }
  update() {}
  draw(ctx) {
    this.alpha -= 0.02; this.hue += 9;
    drawSprite(ctx, 'spr_asriel_afterimager', 0, this.x, this.y, { xs: 2, ys: 2, color: hsv(this.hue, 255, 250), alpha: this.alpha });
    if (this.alpha < 0.06) this.dead = true;
  }
}

// obj_handlightning: chispas (estrellas o rayos) que salen de las manos al preparar el ataque
export class HandLightning extends Obj {
  constructor(x, y, type, depth) {
    super(x, y); this.type = type; this.depth = depth; this.alpha = 0; this.timer = 0; this.siner = rnd(360);
    setSpeedDir(this, 3 + rnd(1), rnd(360)); this.friction = 0.1; this.visible = false;
    this.al[0] = 1;
  }
  alarm() {
    if (this.type === 0) { this.spr = 'spr_regstar'; this.xs = 0.1; this.ys = 0.1; this.angle = rnd(360); }
    else { this.spr = 'spr_handlightning'; this.xs = 0.1; this.ys = 1; this.angle = this.direction; }
    this.visible = true; this.alpha = 0;
  }
  update() {
    this.tickAlarms();
    this.alpha += 0.3; this.timer++; this.siner++;
    if (this.timer > 5) { this.alpha -= 0.5; if (this.alpha < 0) { this.dead = true; return; } }
    this.color = hsv(this.siner * 8, 150, 255);
    if (this.type === 0) { this.angle += 12; this.xs += 0.1; this.ys += 0.1; } else this.xs += 0.1;
    gmMove(this);
  }
  draw(ctx) { if (this.visible) drawSprite(ctx, this.spr, 0, this.x, this.y, { xs: this.xs, ys: this.ys, rot: this.angle, alpha: this.alpha, color: this.color }); }
}

// ============================================================================ "It's the end": fuego en hélice (obj_1sidegen tipo 7 + blt_firehelix1)
export class FireHelixGen extends Obj {
  constructor(b) { super(); this.b = b; this.al[0] = 1; this.firingspeed = b.firingrate; }
  alarm() {
    const b = this.b, [l, r, t] = b.ideal();
    const x = l + (r - l) / 2 - 3, y = t - 25;
    let dmg = b.monsteratk; const hp = b.player.hp;
    if (hp < 8) dmg = 2; if (hp < 6) dmg = 1;
    b.add(new FireHelix(b, x, y, dmg));
    if (hp <= 2) b.turntimer = -100;
    this.al[0] = this.firingspeed;
  }
  update() { this.tickAlarms(); }
  endStep(b) { if (b.turntimer < 1) { b.turntimer = -1; this.dead = true; b.endAttack(); } }   // obj_bulletgenparent Step_2
  draw() {}
}
class FireHelix extends Obj {
  constructor(b, x, y, dmg) {
    super(x, y); this.dmg = dmg; this.frame = 0; this.grav = 0.12; this.gdir = 270; this.vs = 0.7; this.r = Math.round(rnd(1));
    const [, , t, bt] = b.ideal();
    if (this.y > bt - 20) this.y -= 20;
    if (this.y < t + 20) this.y += 20;
  }
  bbox() { return rotBBox('spr_firebullet', this.x, this.y); }
  update(b) {
    this.hs = Math.sin(b.time / 10) * 4 * (this.r === 0 ? -1 : 1);
    const py = this.y;
    gmMove(this); this.frame += 0.5;
    const bb = this.bbox(), B = borders(b.box);
    if (hit(bb, B.D)) { this.y = py; this.vs = 0; this.gdir = this.r === 1 ? 180 : 0; }     // Collision_762: resbala por el suelo
    if ((hit(bb, B.U) && this.vs < 0) || (hit(bb, B.L) && this.hs < 0) || (hit(bb, B.Rt) && this.hs > 0)) { this.dead = true; return; }
    if (hit(this.bbox(), heartBox(b))) { if (b.bltHit(this.dmg)) this.dead = true; }
  }
  endStep(b) { if (b.turntimer < 0) this.dead = true; }       // blt_parent Step_2
  draw(ctx) { drawSprite(ctx, 'spr_firebullet', Math.floor(this.frame), this.x, this.y); }
}

// ============================================================================ STAR BLAZING / GALACTA BLAZING (obj_stormstar_gen)
export class StormStarGen extends Obj {
  constructor(b, hMode) {
    super(); this.b = b; this.hMode = hMode; this.active = 1; this.off = 0; this.vol = 0.8;
    const [l, r, t, bt] = b.ideal(); this.rect = R(l, bt, r, t);
    this.al = { 0: 1, 1: 170, 2: 12 };
  }
  alarm(n) {
    const b = this.b;
    if (n === 0 && this.active) { b.add(new StormStar(this, 580 + rnd(700), -150 - rnd(100), false)); this.al[0] = 8; }
    if (n === 1) { this.active = 0; b.add(new StormStar(this, 830, -170, true)); delete this.al[2]; this.al[3] = 20; }
    if (n === 3) b.snd('star', 1, 0.4);
    if (n === 2) { this.al[2] = 16; b.stopSnd(this.sfx); this.sfx = b.snd('star', 0.7, 1 + rnd(0.2) - rnd(0.3)); }
  }
  smallBoom() { this.b.stopSnd(this.expl); this.expl = this.b.snd('explosion', 0.4, 2); this.b.shakeView(5, 5); }      // Other_11
  bigBoom() { this.expl = this.b.snd('explosion', 0.8, 1.1); this.off = 1; this.vol = 0.8; this.b.shakeView(7, 7); }   // Other_12
  update(b) {
    this.tickAlarms();
    for (const o of b.objs) if (o instanceof StormStar && !o.dead && !o.big && o.con !== 3 && o.con !== 4 && hit(o.bbox(), this.rect)) o.explode();   // Draw: estrellas que tocan la caja
    if (this.off === 1 && this.expl) { this.vol -= 0.0125; if (this.expl.gain) this.expl.gain.gain.value = Math.max(0, this.vol) * b.sfxVol(); }
  }
  destroy() { this.dead = true; this.b.stopSnd(this.sfx); this.b.stopSnd(this.expl); }
  draw() {}
}
class StormStar extends Obj {
  constructor(gen, x, y, big) {
    super(x, y); this.gen = gen; this.big = big; this.hMode = gen.hMode; this.con = 1; this.frame = 0; this.ispd = 0;
    setSpeedDir(this, 14 + rnd(6), 215); this.counter = 0; this.siner = 0; this.xs = 1; this.angle = 0; this.aa = 0; this.alpha = 1;
    this.trail = [[x, y], [x, y], [x, y], [x, y]]; this.oo = 0; this.color = '#fff';
    this.al = { 4: 14 + Math.floor(rnd(10)), 1: 1 };
  }
  alarm(n) {
    if (n === 4) this.con++;
    if (n === 1 && this.big) { this.xs = 2; this.aa = 2; setSpeedDir(this, 8, this.direction); this.counter = -28; }
  }
  bbox() { return rotBBox('spr_stormstar', this.x, this.y, this.angle, this.xs); }
  update() {
    this.tickAlarms();
    this.siner++;
    if (this.counter < 20) this.color = hsv(this.siner * 12, 100, 244);
    if (this.con === 2) {
      if (this.counter > 20) { this.ispd = 0.5; this.color = '#fff'; }
      this.counter++;
      if (this.counter >= 30) return this.explode();
    }
    this.px = this.x; this.py = this.y;
    gmMove(this); this.frame += this.ispd;
  }
  explode() {                                        // Other_13: anillos de estrellas y el destello
    if (this.dead) return;
    const b = this.gen.b; this.hs = 0; this.vs = 0;
    const dir = rnd(360);
    if (!this.big) {
      const [fr, sp] = this.hMode === 0 ? [-0.2, 1.4] : [-0.25, 1.5];
      for (let i = 0; i < 7; i++) b.add(new RegStar(this.x, this.y, dir + 51.42857142857143 * i, sp, fr, this.hMode));
      this.gen.smallBoom();
    } else {
      this.gen.bigBoom();
      for (let i = 0; i < 20; i++) b.add(new RegStar(this.x, this.y, dir + 22.5 * i, 1.6, -0.3, this.hMode));
      for (let i = 0; i < 20; i++) b.add(new RegStar(this.x, this.y, dir + 9 + 22.5 * i, 0.8, -0.24, this.hMode));
      for (let i = 0; i < 20; i++) b.add(new RegStar(this.x, this.y, dir + 9 + 18 * i, 0.2, -0.18, this.hMode));
    }
    b.add(new ExplodeStar(this));
    this.dead = true;
  }
  draw(ctx) {
    const [a, , c] = this.trail;
    this.trail = [[this.px ?? this.x, this.py ?? this.y], ...this.trail.slice(0, 3)];
    const o = { xs: this.xs, ys: this.xs, rot: this.angle, color: this.color };
    drawSprite(ctx, 'spr_stormstar', 1, c[0], c[1], { ...o, alpha: this.alpha - 0.65 });
    drawSprite(ctx, 'spr_stormstar', 1, a[0], a[1], { ...o, alpha: this.alpha - 0.5 });
    if (this.big) {                                  // resplandor alrededor de la estrella gigante
      this.oo = 1 - this.oo;
      ctx.globalAlpha = Math.max(0, (this.oo ? 0.5 : 0.25) - (1 - this.alpha)); ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(this.x, this.y, 200 + this.oo * 20, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    drawSprite(ctx, 'spr_stormstar', Math.floor(this.frame), this.x, this.y, { ...o, alpha: this.alpha });
    if (this.aa > 0) this.angle += this.aa;
  }
}
class ExplodeStar extends Obj {                      // obj_explodestar: la estrella crece y se desvanece
  constructor(s) { super(s.x, s.y); this.big = s.big; this.xs = s.xs; this.frame = s.frame; this.ispd = s.ispd; this.color = s.color; this.angle = s.angle; this.alpha = s.alpha; this.timer = 0; }
  update() {
    this.alpha -= 0.05; this.xs += this.big ? 0.2 : 0.1; this.frame += this.ispd;
    if (++this.timer > 19) this.dead = true;
  }
  draw(ctx) { drawSprite(ctx, 'spr_stormstar', Math.floor(this.frame), this.x, this.y, { xs: this.xs, ys: this.xs, rot: this.angle, alpha: this.alpha, color: this.color }); }
}
// obj_regstar_blt: estrellita que gira (en modo difícil, su dirección también gira)
export class RegStar extends Obj {
  constructor(x, y, dir, speed, friction, hMode, depth = 2) {
    super(x, y); setSpeedDir(this, speed, dir); this.friction = friction; this.hMode = hMode; this.angle = 0; this.depth = depth;
  }
  bbox() { return rotBBox('spr_regstar', this.x, this.y, this.angle); }
  update(b) {
    this.angle += 4;
    if (this.hMode === 1) setDir(this, dirOf(this) + 1.5);
    gmMove(this);
    if (outside(this)) { this.dead = true; return; }
    if (hit(this.bbox(), heartBox(b))) b.asHit();
  }
  draw(ctx) { drawSprite(ctx, 'spr_regstar', 0, this.x, this.y, { rot: this.angle }); }
}

// ============================================================================ SHOCKER BREAKER (obj_rainbowbolt_realgen)
export class RainbowGen extends Obj {
  constructor(b, hMode) { super(); this.b = b; this.hMode = hMode; this.timer = 0; this.i = 0; this.rr = 0; this.hit = 0; this.lbuf = 0; this.oo = 0; }
  target(x, giga = false) { this.b.add(new RainbowTarget(this, x, 360, giga)); }
  update(b) {
    this.lbuf--; const t = ++this.timer;
    const col = sgn => { this.target(-80 + this.x + (this.i / 8) * 640 + 20 * sgn); this.i += sgn; };
    if (this.hMode === 0) {
      if (t > 1 && t < 10) col(1);
      if (t > 21 && t < 30) col(-1);
      if (t > 41 && t < 50) col(1);
      if (t > 61 && t < 70) col(-1);
      if (t === 90 || t === 122) for (const x of [200, 320, 440]) this.target(x, true);
      if (t === 106) for (const x of [260, 380]) this.target(x, true);
    } else {
      if (t > 1 && t < 10) col(1);
      if (t > 17 && t < 27) col(-1);
      if (t > 34 && t < 44) col(1);
      if (t > 54 && t < 70) { this.target(b.heart.x + 8); this.i++; }
      if ([76, 91, 106, 121, 136].includes(t)) { this.target(200 + this.rr * 60, true); this.rr++; }
    }
  }
  bolt() {                                           // Other_10: rayo normal (sonido alterno y temblor)
    if (this.lbuf > 0) return;
    const b = this.b;
    if (this.oo === 0) b.shakeView(3, 3);
    this.oo = 1 - this.oo;
    b.snd(this.oo === 0 ? 'lithit' : 'lithit2', 0.44, 0.6);
    this.lbuf = 2;
  }
  giga() {                                           // Other_11: rayo gigante
    const b = this.b, h = this.hit;
    b.shakeView(8, 8);
    if (this.hMode === 0) { if (h === 0) b.snd('lithit', 0.8, 0.75); if (h === 3) b.snd('lithit2', 0.8, 0.65); if (h === 5) b.snd('lithit', 0.9, 0.9); }
    else { const p = [0.6, 0.65, 0.7, 0.75, 0.8][h]; if (p) b.snd(h % 2 ? 'lithit2' : 'lithit', 0.8, p); }
    this.hit++;
  }
  destroy() { this.dead = true; }
  draw() {}
}
class RainbowTarget extends Obj {                    // obj_rainbowtarget: aviso "!" y, 20 frames después, el rayo
  constructor(gen, x, y, giga) { super(x, y); this.gen = gen; this.giga = giga; this.frame = 0; this.sc = giga ? 3 : 2; this.al[0] = 20; }
  alarm() {
    const bolt = new RainbowBolt(this.x, -10, this.giga);
    this.gen.b.add(bolt);
    if (this.giga) this.gen.giga(); else this.gen.bolt();
    this.dead = true;
  }
  update() { this.tickAlarms(); this.frame += 0.25; }
  draw(ctx) { drawSprite(ctx, 'spr_rainbowtarget', Math.floor(this.frame), this.x, this.y, { xs: this.sc, ys: this.sc }); }
}
class RainbowBolt extends Obj {
  constructor(x, y, giga) {
    super(x, y); this.tx = x; this.ty = y; this.ss = giga ? -2 : 0; this.add = 0; this.ac = rnd(255); this.color = hsv(this.ac, 244, 244);
    this.xs = giga ? 4 : 2; this.frame = choose(0, 1); this.giga = giga; this.non = 0; this.alpha = 1;
  }
  bbox() { const s = SPR.spr_rainbowbolt, [l, t, r, bt] = s.bbox; return { x1: this.x + (l - s.ox) * this.xs, y1: this.y + t * 2, x2: this.x + (r + 1 - s.ox) * this.xs - 1, y2: this.y + (bt + 1) * 2 - 1 }; }
  update(b) {
    const j = this.giga ? 12 : 6;
    this.x = this.tx + rnd(j) - rnd(j); this.y = this.ty + rnd(j) - rnd(j);
    if (this.giga) this.ss -= 0.5;
    this.ss += 1;
    if (this.ss > 2) { this.alpha -= 0.1; if (this.alpha < 0.5) this.xs -= 0.2; if (this.alpha < 0.1) { this.dead = true; return; } }
    this.add += 10; this.color = hsv(this.ac + this.add, 210, 255);
    if (this.alpha > 0.8 && this.non === 1 && hit(this.bbox(), heartBox(b))) b.asHit();
  }
  draw(ctx) {
    drawSprite(ctx, 'spr_rainbowbolt', this.frame, this.x, this.y, { xs: this.xs, ys: 2, color: this.color, alpha: this.alpha });
    if (this.alpha > 0.8) { const q = this.bbox(); ctx.fillStyle = '#fff'; ctx.fillRect(q.x1, q.y1, q.x2 - q.x1 + 1, q.y2 - q.y1); this.non = 1; }
  }
}

// ============================================================================ CHAOS SABER / CHAOS SLICER (obj_asriel_swordmaster + obj_asriel_swordarm)
export class SwordMaster extends Obj {
  constructor(b, x, y, hMode) {
    super(x, y); this.b = b; this.tx = x; this.ty = y; this.hMode = hMode; this.king = b.body; this.depth = 0;
    this.swordB = new SwordArm(this, b.body.x + 36, b.body.y + 35, 0);    // se crea primero: flip 0 (brazo derecho)
    this.swordA = new SwordArm(this, b.body.x - 36, b.body.y + 35, 1);
    b.add(this.swordB); b.add(this.swordA);
    this.lastwhich = 0; this.lastwhichwhich = 0; this.times = 0; this.freakcon = 0; this.last = 0; this.never = 0;
    b.snd('swordappear', 1, 1);
  }
  alarm(n) {
    if (n === 5) {
      const maxtime = this.hMode > 0 ? 6 : 5;
      if (this.times < maxtime) {
        let which = choose(0, 1);
        if (which === this.lastwhichwhich && which === this.lastwhich) which = 1 - which;   // nunca tres veces el mismo brazo
        const t = [106, 109, 112][this.hMode];
        (which === 0 ? this.swordA : this.swordB).timer = t;
        this.swordA.hMode = this.hMode; this.swordB.hMode = this.hMode;
        this.lastwhichwhich = this.lastwhich; this.lastwhich = which;
        this.al[5] = [27, 24, 21][this.hMode];
      } else {                                       // golpe final con las dos espadas
        this.swordA.timer = 89; this.swordB.timer = 89; this.swordA.twinkle = 1; this.swordB.twinkle = 1; this.freakcon = 1;
      }
      this.times++; this.king.headrot = 0;
    }
    if (n === 6) { this.swordA.dead = true; this.swordB.dead = true; this.king.bladecon = 10; this.dead = true; }
  }
  ev(n) {                                            // event_user(n) que llaman las espadas
    const b = this.b, k = this.king, x = this.x, tx = this.tx;
    if (n === 2) {                                   // Other_12: se inclina a la izquierda
      const steps = [[80, 1, 1], [70, 2, 2], [60, 2, 3], [40, 3, 4], [20, 3, 0], [0, 4, 0], [-10, 4, 0]];
      for (const [d, dx, rot] of steps) if (this.x > tx - d) { this.x -= dx; if (rot && this.x > tx - 35) k.torsorot += rot; }
    }
    if (n === 3) {                                   // Other_13: se inclina a la derecha
      const steps = [[80, 1, 1], [70, 2, 2], [60, 2, 3], [40, 3, 4], [20, 3, 0], [0, 4, 0], [-10, 4, 0]];
      for (const [d, dx, rot] of steps) if (this.x < tx + d) { this.x += dx; if (rot && this.x < tx + 25) k.torsorot -= rot; }
    }
    if (n === 5) b.snd('pullback', 0.9, 1);
    if (n === 6) {
      if (this.freakcon === 0) { b.snd('jafe', 1.2, 1); b.snd('cinematiccut', 0.7, 1.4); }
      else if (this.last === 0) { b.snd('cinematiccut', 0.9, 1); b.snd('sparkles', 0.7, 1); this.last = 1; }
    }
    if (n === 7) b.snd('segapower2', 1, 1);
    if (n === 8 && this.never === 0) { b.snd('grab', 1, 1); this.never = 1; }
    if (n === 9) { if (Math.abs(x - tx) < 2) this.x = tx; if (this.x > tx) this.x--; if (this.x < tx) this.x++; }
  }
  update() {
    this.tickAlarms();
    const k = this.king;
    if (this.x < this.tx - 35) this.x = this.tx - 35;
    if (this.x > this.tx + 25) this.x = this.tx + 25;
    k.x = this.x; k.y = this.y;
    k.torsorot *= 0.7; if (Math.abs(k.torsorot) <= 1) k.torsorot = 0;
    if (this.freakcon === 1) { this.ftimer = 0; this.fhy = 90; this.freakcon = 2; this.ev(7); }
    else if (this.freakcon === 2) {                  // la cabeza da vueltas...
      this.fhy *= 0.8; k.heady = this.fhy / 5 - 18; k.headrot -= this.fhy;
      if (++this.ftimer > 34) this.freakcon = 3;
    } else if (this.freakcon === 3) {                // ...y Asriel se hunde y desaparece
      this.al[6] = 20; this.y += 2; k.heady += 8; k.alpha = Math.max(0, k.alpha - 0.1);
      if (k.alpha <= 0) this.freakcon = 4;
    }
  }
  draw() {}
}
class SwordArm extends Obj {
  constructor(m, x, y, flip) {
    super(x, y); this.m = m; this.flip = flip; this.ystart = y; this.con = 0; this.timer = 0; this.sOff = 40; this.oo = 0; this.smear = 0;
    this.dontdraw = 0; this.visible = false; this.relx = x - m.x; this.twinkle = 0; this.shake = 0; this.blazing = 0; this.blo = 0;
    this.depth = m.king.depth + 1; this.start = 1; this.alpha = 0; this.xs = flip ? -2 : 2; this.angle = 0; this.col = 0; this.hMode = 0;
    this.spr = 'spr_asriel_swordlessarm'; this.friction = 0;
    this.al[0] = 1;
  }
  alarm() { this.visible = true; }
  update(b) {
    this.tickAlarms();
    gmMove(this);
    this.x = this.m.x + this.relx;                   // Step_2
    if (this.col === 1) {
      const r = this.flip === 0 ? R(this.x - 3, this.y, this.x + 80, this.y + 260) : R(this.x + 3, this.y, this.x - 80, this.y + 260);
      if (hit(r, heartBox(b))) b.asHit();
    }
  }
  draw(ctx) {
    if (!this.visible) return;
    const m = this.m, k = m.king, S = this.shake;
    if (this.start === 1) { if (this.alpha < 1) this.alpha += 0.2; else this.start = 0; }
    if (this.dontdraw === 0) drawSprite(ctx, this.spr, 0, this.x + rnd(S) - rnd(S), this.y + rnd(S) - rnd(S), { xs: this.xs, ys: 2, rot: this.angle, alpha: this.alpha });
    const t = ++this.timer;
    if (t === 5) this.con = 1;
    if (this.con === 1) {                            // la espada aparece y se junta con la mano
      this.sOff--;
      const side = this.oo === 1 ? -this.sOff : this.sOff;
      drawSprite(ctx, 'spr_asriel_sword', 0, this.x + side + (this.flip ? 22 : -22), this.y - 148, { xs: this.xs, ys: 2, rot: this.angle, alpha: this.alpha });
      this.oo = 1 - this.oo;
      if (this.sOff <= 1) {
        m.ev(8); this.spr = 'spr_asriel_swordarm'; this.con = 2; this.timer = 999;
        if (this.flip === 0) m.al[5] = 14;
      }
    }
    const f = this.flip === 0 ? 1 : -1, tm = this.timer;
    if (this.twinkle === 0) {                        // echa el brazo hacia atrás
      const [t0, dy, hr, da] = [[106, 0.5, 4, 1], [109, 0.75, 6, 1.5], [112, 1.5, 12, 3]][this.hMode];
      if (tm === t0 + 1) m.ev(5);
      if (tm > t0 - 1 && tm < 116) { this.y -= dy; k.headrot += hr * f; m.ev(this.flip === 0 ? 2 : 3); this.angle += da * f; }
    }
    if (this.twinkle === 1) {
      if (tm > 90 && tm < 105) { this.blazing = 1; this.y -= 0.5; m.ev(9); this.angle += 1.5 * f; }
      if (tm > 90 && tm < 115) this.shake = 5;
      if (tm === 115) this.shake = 0;
      if (tm === 120) this.blazing = 0;
    }
    if (tm === 124) { m.ev(6); this.depth = k.depth - 10; this.dontdraw = 1; this.smear = 5; }   // ¡tajo!
    if (tm >= 124 && tm < 127) {
      k.headrot -= 12 * f; this.dontdraw = 0; this.angle = 0;
      if (tm >= 125) { this.col = 1; this.spr = 'spr_asriel_swordextend'; this.y += 3; }
    }
    if (tm === 125 && this.twinkle === 1) {          // el golpe doble rompe las espadas y agranda la caja
      m.b.setBorder(6); this.timer = 200; this.vs = 5; this.friction = 0.5; this.spr = 'spr_asriel_swordextend_shatter';
      for (let i = 0; i < 4; i++) m.b.add(new SwordTwinkle(this.x, this.y + 120 + i * 35));
    }
    if (tm >= 127 && tm < 130) { this.col = 0; this.y += 5; this.angle += 30 * f; }
    if (tm === 130) { k.headrot /= 2; this.depth = k.depth + 1; this.y = this.ystart; this.angle = 0; this.spr = 'spr_asriel_swordarm_half'; }
    if (tm === 131) { k.headrot /= 2; this.y = this.ystart; this.angle = 0; this.spr = 'spr_asriel_swordarm'; }
    if (tm > 200 && this.twinkle === 1) { if (tm > 201) this.col = 0; this.alpha -= 0.1; if (this.alpha <= 0) this.dead = true; }
    if (this.smear > 0) {
      drawSprite(ctx, 'spr_asriel_swordsmear', 0, this.x - 40 * f, this.y - 168, { xs: this.xs, ys: 2.5, alpha: this.smear / 5 });
      this.smear--;
    }
    if (this.blazing === 1) { this.blo = 1 - this.blo; if (this.blo === 1) drawSprite(ctx, 'spr_asriel_swordarm_power', 0, this.x, this.y, { xs: this.xs, ys: 2, rot: this.angle, alpha: this.alpha }); }
  }
}
class SwordTwinkle extends Obj {                     // obj_swordtwinkle: destellos que quedan flotando
  constructor(x, y) {
    super(x, y); this.depth = -1; this.alpha = 1; this.fade = 0;
    this.grav = 0.05 + rnd(0.1); this.gdir = 180 - rnd(40) + rnd(40); this.vs = 1 + rnd(1) - rnd(2);
    if (x < 320) this.grav *= -1;
    this.al[0] = 40;
  }
  alarm() { this.fade = 1; }
  bbox() { return rotBBox('spr_asriel_swordtwinkle', this.x, this.y, 0, 2); }
  update(b) {
    this.tickAlarms();
    if (this.fade === 1) { this.alpha -= 0.05; if (this.alpha < 0.05) { this.dead = true; return; } }
    gmMove(this);
    if (outside(this)) { this.dead = true; return; }
    if (hit(this.bbox(), heartBox(b))) b.asHit();
  }
  draw(ctx) { drawSprite(ctx, 'spr_asriel_swordtwinkle', 0, this.x, this.y, { xs: 2, ys: 2, alpha: this.alpha }); }
}

// ============================================================================ CHAOS BUSTER / CHAOS BLASTER (obj_gunarm_firepattern)
const SCHED = {
  0: { 1: [20, 1, 6], 28: [10, 2, 6], 54: [8, 1, 5], 78: [8, 2, 5], 100: [8, 1, 4], 122: [8, 2, 4], 140: [6, 1, 4], 156: [6, 2, 4], 170: [6, 1, 8] },
  1: { 1: [20, 1, 6], 25: [10, 'r', 6], 50: [8, 'r', 5], 75: [7, 2, 4], 95: [7, 1, 4], 115: [7, 'r', 4], 132: [6, 2, 4], 156: [6, 2, 4], 170: [6, 1, 10] },
};
export class GunArm extends Obj {
  constructor(b, x, y, hMode) {
    super(x, y); this.b = b; this.hMode = hMode; this.tx = x; this.ty = y; this.frame = 0; this.ispd = 0; this.spr = 'spr_asriel_gunarm_shot';
    this.type = 0; this.home = 0; this.txs = 0; this.tys = 0; this.ltimer = 0; this.flash = 0; this.meter = 0; this.mc = 0; this.unhinge = 0;
    this.blast = 0; this.con = 0; this.ctimer = 0; this.alpha = 0; this.depth = -1100; this.king = b.body;
    this.relx = x - b.body.x; this.rely = y - b.body.y; this.ks = 0; this.colo = 0; this.jr = rnd(360);
    this.angle = pdir(x, y, b.heart.x + 8, b.heart.y + 8) + 90; this.fire = 0; this.maxfire = 0;
  }
  alarm(n) { if (n === 5) { if (this.fire < this.maxfire) { this.shoot(); this.al[5] = 2; } this.fire++; } }
  shoot() {                                          // Other_10 + Other_11: retroceso y balas
    const b = this.b;
    this.txs = ldx(7, this.angle + 90); this.tys = ldy(7, this.angle + 90);
    b.stopSnd(this.sfxB); this.sfxB = b.snd('abullet', 0.8, 1);
    this.frame = 2;
    const xx = ldx(95, this.angle - 90), yy = ldy(95, this.angle - 90);
    if (this.type === 0) b.add(new GunBolt(this.x + xx, this.y + yy, this.angle - 90, this.angle - 90));
    if (this.type === 1) for (let i = 0; i < 3; i++) b.add(new GunBolt(this.x + xx, this.y + yy, this.angle - 90, this.angle - 110 + 20 * i));
    if (this.type === 2) for (let i = 0; i < 4; i++) b.add(new GunBolt(this.x + xx, this.y + yy, this.angle - 90, this.angle - 120 + 20 * i));
  }
  update(b) {
    this.tickAlarms();
    const k = this.king;
    this.ks++; k.y += Math.sin(this.ks / 8) * 0.5;
    this.y += this.tys; this.x += this.txs;
    if (Math.abs(this.txs) > 0) this.txs *= 0.5; if (Math.abs(this.txs) <= 1) this.txs = 0;
    if (Math.abs(this.tys) > 0) this.tys *= 0.5; if (Math.abs(this.tys) <= 1) this.tys = 0;
    if (this.x < this.tx) this.x += (this.tx - this.x) / 3;
    if (this.y < this.ty) this.y += (this.ty - this.y) / 3;
    if (this.x > this.tx) this.x += (this.tx - this.x) / 3;
    if (this.y > this.ty) this.y += (this.ty - this.y) / 3;
    if (Math.abs(this.x - this.tx) < 2) this.x = this.tx;
    if (this.unhinge === 0 && this.frame > 0) this.frame -= 1;
    if (this.home === 1) this.angle = pdir(this.x, this.y, b.heart.x + 8, b.heart.y + 8) + 90;
    if (this.con === 0) { if (this.alpha < 1) this.alpha += 0.1; else this.con = 1; }
    if (this.con !== 1) return;
    const h = this.hMode;
    this.ctimer += 0.5; if (this.ctimer >= (h === 0 ? 27.5 : 19.5)) this.ctimer += 0.5;
    const c = this.ctimer, s = SCHED[h][c];
    if (s) { const [lt, ty, mf] = s; this.ltimer = lt; this.home = 1; this.type = ty === 'r' ? choose(1, 2) : ty; this.fire = 0; this.maxfire = mf; this.al[5] = lt; }
    const [cMeter, cSpin, spin0, dSpin, cBlast, cEnd] = h === 0 ? [190, 205, 45, 3, 275, 315] : [200, 215, 90, 6, 270, 310];
    if (c === cMeter) { b.snd('segapower', 1, 0.55); this.meter = 1; }
    if (c === cSpin) { this.home = 0; this.aaspeed = spin0; }
    if (c >= cSpin && c < (h === 0 ? 255 : 240)) {   // gira sobre sí mismo...
      this.angle += this.aaspeed;
      if (this.aaspeed > 0) this.aaspeed -= dSpin; else { this.aaspeed = 0; this.ctimer = 255; }
    }
    if (this.ctimer === 255) this.home = 1;
    if (this.ctimer === 257) { this.spr = 'spr_asriel_gunarm_unhinge'; this.ispd = 1; this.frame = 0; this.unhinge = 1; this.home = 0; }
    if (this.ctimer === cBlast) { this.mc = 7; b.snd('rainbowbeam', 1, 1.1); this.blast = 1; this.bt = 70; this.btimer = 0; }   // ...y dispara el rayo
    if (h === 1 && [272, 274, 276, 278, 280, 282, 284].includes(this.ctimer)) {
      this.jr += 8;
      for (let i = 0; i < 24; i++) b.add(new RegStar(this.x, this.y, this.jr + 15 * i, 8, -0.1, 0, -9000));
    }
    if (this.ctimer >= cEnd) {
      if (k.guncon === 5) k.guncon = 7;
      this.alpha -= 0.1; if (this.alpha < 0.1) this.destroy();
    }
    if (this.blast === 1 && this.colo === 1) {       // colisión del rayo (8 líneas a lo ancho)
      const xx = ldx(115, this.angle - 90), yy = ldy(115, this.angle - 90), xxx = ldx(600, this.angle - 90), yyy = ldy(600, this.angle - 90);
      const nx = ldx(1, this.angle), ny = ldy(1, this.angle), hb = heartBox(b);
      for (const s of [-1, 1]) for (let cl = 0; cl < 4; cl++) {
        const o = s * this.bt / 2 * (cl / 4);
        if (lineHits(this.x + xx + nx * o, this.y + yy + ny * o, this.x + xxx + nx * o, this.y + yyy + ny * o, hb)) b.asHit();
      }
    }
  }
  destroy() { this.dead = true; this.b.stopSnd(this.sfxT); this.sfxT = null; this.b.view.x = 0; this.b.view.y = 0; }
  draw(ctx) {
    const b = this.b;
    this.flash = (this.flash + 1) % 3;
    const xx = ldx(120, this.angle - 90), yy = ldy(120, this.angle - 90);
    this.ltimer--;
    if (this.ltimer > 0) {                           // líneas de mira
      if (!this.sfxT) this.sfxT = b.snd('atarget', 1, 1, true);
      ctx.strokeStyle = ['#ff0000', '#ffa040', '#ffff00'][this.flash]; ctx.lineWidth = 1;
      const angs = this.type === 0 ? [-90] : this.type === 1 ? [-104, -90, -77] : [-110, -96, -84, -70];
      ctx.beginPath();
      for (const a of angs) { ctx.moveTo(this.x + xx, this.y + yy); ctx.lineTo(this.x + ldx(600, this.angle + a), this.y + ldy(600, this.angle + a)); }
      ctx.stroke();
    } else if (this.sfxT) { b.stopSnd(this.sfxT); this.sfxT = null; }
    let spr = this.spr, frame = this.frame;
    if (this.blast === 1) {
      if (this.bt > 4) { b.view.x = choose(1, -1) * rnd(3); b.view.y = choose(1, -1) * rnd(3); } else { b.view.x = 0; b.view.y = 0; }
      frame = this.frame = this.frame === 5 ? 4 : 5;
      this.mc -= 1.25;
      this.x = this.tx + rnd(6) - rnd(6); this.y = this.ty - rnd(15) - 16;
      const k = this.king; k.x = this.x - this.relx + rnd(3) - rnd(3); k.y = this.y - this.rely + rnd(8) + 12;
      const a = this.angle - 90, X = this.x, Y = this.y;
      const c1 = hsv(this.btimer * 18, 180, 255), c2 = hsv(this.btimer * 18 + 60, 180, 255);
      const line = (len0, len1, w) => {
        const g = ctx.createLinearGradient(X + ldx(len0, a), Y + ldy(len0, a), X + ldx(len1, a), Y + ldy(len1, a));
        g.addColorStop(0, c1); g.addColorStop(1, c2);
        ctx.strokeStyle = g; ctx.lineWidth = Math.max(0.1, w); ctx.beginPath(); ctx.moveTo(X + ldx(len0, a), Y + ldy(len0, a)); ctx.lineTo(X + ldx(len1, a), Y + ldy(len1, a)); ctx.stroke();
      };
      line(115, 600, this.bt); line(115, 90, this.bt / 2); line(115, 100, this.bt / 1.5);
      this.colo = 1 - this.colo;
      if (++this.btimer > 15) { this.bt -= 3; if (this.bt < 3) { this.bt = 0; this.blast = 0; this.unhinge = 0; this.meter = 0; b.view.x = 0; b.view.y = 0; } }
    }
    if (this.meter === 1) {                          // medidor de carga de colores
      this.mc++;
      for (let i = 0; i < 7; i++) if (this.mc > i) drawSprite(ctx, 'spr_asriel_gunarm_meter', i, this.x, this.y, { xs: 2, ys: 2, rot: this.angle, color: hsv(this.mc * 12 - i * 24, 180, 255), alpha: this.alpha });
    }
    if (this.unhinge === 1 && this.blast === 0) { this.frame += this.ispd; if (this.frame >= 5) { this.frame = 5; this.ispd = 0; } frame = this.frame; }
    drawSprite(ctx, spr, Math.floor(frame), this.x, this.y, { xs: 2, ys: 2, rot: this.angle, alpha: this.alpha });
  }
}
class GunBolt extends Obj {                          // obj_gunarm_bolt: sale recto y a los 2 frames se abre en abanico
  constructor(x, y, dir, thisd) { super(x, y); setSpeedDir(this, 20, dir); this.angle = dir; this.thisd = thisd; this.depth = -1090; this.al[0] = 2; }
  alarm() { setDir(this, this.thisd); }
  bbox() { return rotBBox('spr_asriel_gunbolt', this.x, this.y, this.angle, 2); }
  update(b) {
    this.tickAlarms(); gmMove(this);
    if (outside(this)) { this.dead = true; return; }
    if (hit(this.bbox(), heartBox(b))) b.asHit();
  }
  draw(ctx) { drawSprite(ctx, 'spr_asriel_gunbolt', 0, this.x, this.y, { xs: 2, ys: 2, rot: this.angle }); }
}

// ============================================================================ HYPER GONER (obj_hg_wholescreen + obj_hg_body + obj_hg_debris)
export class HgWholeScreen extends Obj {
  constructor(b) {
    super(); this.b = b; const [l, r, t, bt] = b.ideal(); Object.assign(this, { xx: l, xx2: r, yy: t, yy2: bt }); this.con = 0; this.scr = 1; this.depth = 1;
    b.heartDepth = -10001;                           // obj_heart.depth = -10001: el alma queda por encima de la calavera
  }
  update() {}
  draw(ctx) {
    if (this.con === 0) {                            // la caja se agranda hasta ocupar toda la pantalla
      this.b.body.alpha = Math.max(0, this.b.body.alpha - 0.1);
      ctx.fillStyle = '#000'; ctx.fillRect(this.xx, this.yy, this.xx2 - this.xx, this.yy2 - this.yy);
    }
    if (this.con === 2) {
      ctx.globalAlpha = Math.max(0, this.scr); ctx.fillStyle = '#fff'; ctx.fillRect(this.xx, this.yy, this.xx2 - this.xx, this.yy2 - this.yy); ctx.globalAlpha = 1;
      this.scr -= 0.1; if (this.scr <= 0) { this.dead = true; return; }
    }
    if (this.xx > -100) this.xx -= 10; if (this.yy > -100) this.yy -= 10;
    if (this.xx2 < 800) this.xx2 += 10; if (this.yy2 < 800) this.yy2 += 10;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) ctx.strokeRect(this.xx + i + 0.5, this.yy + i + 0.5, this.xx2 - this.xx, this.yy2 - this.yy);
  }
}
export class HgBody extends Obj {
  constructor(b) {
    super(176, 16); this.b = b; this.depth = -10000; this.facescale = 0; this.facey = 0; this.con = -1; this.alpha = 0;
    this.bb = 12; this.cc = 1; this.dd = 8; this.cCounter = 0; this.siner = 0; this.a = 1; this.spr = null;
  }
  alarm(n) { if (n === 4) this.con += 1; if (n === 6) { this.b.add(new HgDebris(this.b)); this.al[6] = 2; } }
  update() { this.tickAlarms(); }
  draw(ctx) {
    const b = this.b, x = this.x, y = this.y;
    if (this.con === -1) { this.alpha += 0.05; if (this.alpha >= 1) { this.con = 0.1; this.al[4] = 20; } }
    if (this.con < 3) {                              // la calavera de cabra
      const o = { xs: 2, ys: 2, alpha: this.alpha };
      drawSprite(ctx, 'spr_hg_leftovers', 0, x, y + this.facey / 6, o);
      drawSprite(ctx, 'spr_hg_horns', 0, x, y - this.facey / 2, o);
      drawSprite(ctx, 'spr_hg_mainface', 0, x + 88, y + 72 + this.facey, { ...o, ys: 2 + this.facescale });
      drawSprite(ctx, 'spr_hg_jaws', 0, x + 104, y + 248 - this.facey / 2, o);
    }
    if (Math.abs(this.con - 1.1) < 1e-6) { this.gl = b.snd('hglaugh', 0.8, 1); this.con = 1; }
    if (this.con === 1) {                            // abre la boca
      this.facey -= 3.5; this.facescale -= 0.2; this.siner = 0;
      if (this.facescale < -1) { this.con = 1.9; this.al[4] = 75; this.al[6] = 100; }
    }
    if (Math.abs(this.con - 1.9) < 1e-6) { this.siner++; this.facey += Math.sin(this.siner / 1.5) * 8; this.facescale += Math.sin(this.siner / 1.5) * 0.2; }
    if (Math.abs(this.con - 2.9) < 1e-6) { this.gc = b.snd('hgcharge', 1, 1); this.con = 3; }
    if (this.con === 3) this.drawSuck(ctx);
    const h = b.heart;                               // el alma no sale de la pantalla
    h.x = Math.min(Math.max(h.x, 0), 624); h.y = Math.min(Math.max(h.y, 0), 464);
  }
  drawSuck(ctx) {                                    // con 3: la calavera se ríe, tiembla y absorbe todo
    const b = this.b, h = b.heart;
    if (this.cc < 80) this.cc += 0.5;
    if (this.alpha > 0.14) this.alpha -= 0.02;
    const im = SPR.spr_hg_laughing.frames[0];        // scr_fx_waver_scanline
    this.a++;
    ctx.globalAlpha = this.alpha;
    for (let i = 0; i < im.height; i++) {
      this.a++;
      const hh = Math.sin(this.a) * this.dd;
      if (hh >= 1) ctx.drawImage(im, 0, i, im.width, Math.min(hh, im.height - i), this.x + Math.sin(this.a / this.bb) * this.cc, this.y + i * 2, im.width * 2, Math.min(hh, im.height - i) * 2);
    }
    ctx.globalAlpha = 1 - this.alpha; ctx.lineWidth = 2;
    for (let k = 0; k < 20; k++) {
      const g = ctx.createLinearGradient(320, 240, 320, 480); g.addColorStop(0, '#fff'); g.addColorStop(1, '#808080');
      ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(320 + rnd(10) - rnd(10), 240 + rnd(10) - rnd(10));
      const s = Math.floor(k / 5); ctx.lineTo(s === 0 ? rnd(640) : s === 1 ? rnd(640) : s === 2 ? 0 : 640, s === 0 ? 480 : s === 1 ? 0 : rnd(480)); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    let rad = (this.cCounter - 180) / 1.5; if (rad < 20) rad = 20;
    ctx.strokeStyle = '#008000'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(320, 240, rad, 0, Math.PI * 2); ctx.stroke();
    if (this.cCounter < 295) {                       // collision_circle con el alma
      const hb = heartBox(b), cx = Math.max(hb.x1, Math.min(320, hb.x2)), cy = Math.max(hb.y1, Math.min(240, hb.y2));
      if (Math.hypot(cx - 320, cy - 240) <= rad - 5) b.asHit();
    }
    const pull = this.cCounter < 180 ? 1 : this.cCounter > 180 ? 2 : 0;   // el alma es arrastrada al centro
    if (pull) { const d = pdir(h.x, h.y, 312, 232); h.x += ldx(pull, d); h.y += ldy(pull, d); }
    this.cCounter++;
    if (this.cCounter > 180) {
      ctx.globalAlpha = Math.min(1, (this.cCounter - 180) / 60); ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(320, 240, (this.cCounter - 180) / 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = Math.max(0, Math.min(1, (this.cCounter - 210) / 80)); ctx.fillRect(-10, -10, 1000, 1000); ctx.globalAlpha = 1;
      if (this.cCounter > 275) b.heartAlpha = Math.max(0, b.heartAlpha - 0.05);
      if (this.cCounter > 320) { b.stopSnd(this.gl); b.stopSnd(this.gc); b.body.gonercon = 10; this.dead = true; }
    }
  }
}
class HgDebris extends Obj {
  constructor(b) {
    super(); this.b = b; this.depth = -9900;
    const side = choose(0, 1, 2, 3);
    if (side === 0) { this.x = rnd(800) - 80; this.y = 560; }
    if (side === 1) { this.x = rnd(800) - 80; this.y = -80; }
    if (side === 2) { this.y = rnd(640) - 80; this.x = -80; }
    if (side === 3) { this.y = rnd(640) - 80; this.x = 720; }
    this.size = 2; this.friction = -0.3; setSpeedDir(this, 2, pdir(this.x, this.y, 320, 240));
  }
  bbox() { return rotBBox('spr_hg_debris_mask', this.x, this.y, 0, this.size); }
  update(b) {
    this.size -= 0.03;
    if (this.size < 0.01 || Math.hypot(this.x - 320, this.y - 240) < 10) { this.dead = true; return; }
    gmMove(this);
    const hg = b.objs.find(o => o instanceof HgBody);
    if (hg && hg.cCounter < 280 && hit(this.bbox(), heartBox(b))) b.asHit();
  }
  draw(ctx) { drawSprite(ctx, 'spr_hg_debris_small', 0, this.x, this.y, { xs: this.size, ys: this.size }); }
}

// ============================================================================ forma final: ataques de la forma final (obj_ultimagen, obj_1sidegen tipo 9, obj_lastbeam)
export class UltimaGen extends Obj {
  constructor(b, x, y, type) { super(x, y); this.b = b; this.type = type; this.timer = 0; this.shot = 0; this.tc = 0; }
  bullet(side) { const u = new UltimaBullet(this.b, this.x, this.y, side); this.b.add(u); }
  orb(side) {                                        // Other_18 / Other_19: destello de la mano y sonido
    if (this.shot > 3) {
      this.b.add(new BlastOrb(this.x + (side ? 160 : -160), this.y));
      this.b.stopSnd(this.b.body.seg); this.b.body.seg = this.b.snd('segapower', 0.9, 0.8);
      this.shot = -1;
    }
  }
  update() {
    this.shot++; const t = ++this.timer;
    if (this.type === 0) {
      if (t === 8 || t === 48) this.orb(0);
      if (t === 28 || t === 68) this.orb(1);
      if (t === 103) { this.orb(0); this.orb(1); }
      if ((t > 10 && t < 19) || (t > 50 && t < 58)) this.bullet(0);
      if ((t > 30 && t < 39) || (t > 70 && t < 78)) this.bullet(1);
      if (t > 105 && t < 117) this.bullet(choose(0, 1));
    } else {
      if (t === 1) this.tc = 0;
      this.tc++;
      if (this.tc === 2) { const s = choose(0, 1); this.bullet(s); this.orb(s); this.tc = { 1: -1, 2: 1, 3: -5 }[this.type]; }
    }
  }
  draw() {}
}
export class UltimaTarget extends Obj {              // obj_ultimatarget: punto que persigue al alma
  constructor(b) { super(b.heart.x + 8, b.heart.y + 8); this.b = b; }
  update(b) { const d = pdir(this.x, this.y, b.heart.x + 8, b.heart.y + 8), dist = Math.hypot(b.heart.x + 8 - this.x, b.heart.y + 8 - this.y); const s = Math.min(3, dist); this.x += ldx(s, d); this.y += ldy(s, d); }
  draw() {}
}
class UltimaBullet extends Obj {
  constructor(b, x, y, side) {
    super(x, y); this.b = b; this.depth = -2; this.friction = -0.1; this.side = side; this.huer = rnd(256);
    this.color = hsv(this.huer, 60, 255); this.trail = [];
    if (side === 0) { this.x -= 160; this.hs = -9 - rnd(8); this.vs = 4 + rnd(10); }
    else { this.x += 160; this.hs = 9 + rnd(8); this.vs = 4 + rnd(10); }
    for (let i = 0; i <= 12; i++) this.trail.push([this.x, this.y]);
    this.al[5] = 140;
  }
  alarm() { this.dead = true; }
  bbox() { return rotBBox('spr_ultimabullet', this.x, this.y, this.direction); }
  update(b) {
    this.tickAlarms(); if (this.dead) return;
    const tg = b.objs.find(o => o instanceof UltimaTarget);
    if (tg) {                                        // se curva hacia el objetivo (solo hacia dentro y hacia arriba)
      let hh = Math.max(-1, Math.min(1, (tg.x - this.x) / 20));
      if (this.side === 0 && hh < 0) hh = 0; if (this.side === 1 && hh > 0) hh = 0;
      let vv = Math.max(-1, Math.min(1, (tg.y - this.y) / 20)); if (vv > 0) vv = 0;
      this.hs += hh; this.vs += vv;
      if (this.speed > 22) setSpeedDir(this, 22, this.direction);
    }
    this.huer += 20; this.color = hsv(this.huer, 60, 255);
    gmMove(this);
    const t12 = this.trail[12];
    if ((this.side === 0 && this.x >= 680 && t12[0] >= 640) || (this.side === 1 && this.x < -40 && t12[0] < 0)) { this.dead = true; return; }
    if (hit(this.bbox(), heartBox(b))) b.asHit();
  }
  draw(ctx) {
    this.trail = [[this.x, this.y], ...this.trail.slice(0, 12)];     // obj_ultimatrail
    const t = this.trail; ctx.strokeStyle = this.color; ctx.lineCap = 'round';
    for (const [a, c, w] of [[10, 12, 2], [8, 10, 4], [4, 8, 6], [0, 4, 8]]) { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(t[a][0], t[a][1]); ctx.lineTo(t[c][0], t[c][1]); ctx.stroke(); }
    ctx.lineCap = 'butt';
    drawSprite(ctx, 'spr_ultimabullet', 0, this.x, this.y, { rot: this.direction, color: this.color });
  }
}
class BlastOrb extends Obj {
  constructor(x, y) { super(x, y); this.sc = 1; this.alpha = 1; this.timer = 0; this.depth = -5; }
  update() { this.timer++; this.sc += 1; if (this.timer > 7) this.alpha -= 0.2; if (this.alpha < 0.2) this.dead = true; }
  draw(ctx) { drawSprite(ctx, 'spr_beamcircle', 0, this.x, this.y, { xs: this.sc, ys: this.sc, alpha: this.alpha }); }
}
// obj_1sidegen tipo 9 + blt_avoidfire: fuegos que caen y... se apartan del alma
export class AvoidFireGen extends Obj {
  constructor(b) { super(); this.b = b; this.al[0] = 1; }
  alarm() {
    const [l, r, t] = this.b.ideal();
    this.b.add(new AvoidFire(l + Math.round(rnd(r - l)) - 40, t - 20));
    this.al[0] = this.b.firingrate;
  }
  update() { this.tickAlarms(); }
  endStep(b) { if (b.turntimer < 1) { b.turntimer = -1; this.dead = true; b.endAttack(); } }
  draw() {}
}
class AvoidFire extends Obj {
  constructor(x, y) { super(x, y); this.frame = 0; this.grav = 0.1 + rnd(0.2); this.gdir = 250 + rnd(40); this.visible = false; }
  bbox() { return rotBBox('spr_firebullet', this.x, this.y); }
  update(b) {
    gmMove(this); this.frame += 0.2;
    if (hit(this.bbox(), heartBox(b)) && this.visible) { if (b.bltHit(1)) { this.dead = true; return; } }
  }
  endStep(b) {                                       // Step_2
    const h = b.heart, [l, r, t, bt] = b.ideal();
    if (Math.abs(this.y - h.y) < 100) { this.hs = 180 / (Math.abs(h.x - this.x) + 10) - 1; if (h.x > this.x) this.hs = -this.hs; }
    if (b.turntimer < 1 || this.x < l || this.x > r || this.y > bt) { this.dead = true; return; }
    if (this.y > t) this.visible = true;
  }
  draw(ctx) { if (this.visible) drawSprite(ctx, 'spr_firebullet', Math.floor(this.frame), this.x, this.y); }
}
// obj_lastbeam: el rayo final. Te golpea pase lo que pase y el PV baja a 1, 0.9, 0.5, 0.1, 0.01...
export class LastBeam extends Obj {
  constructor(b, x, y) {
    super(x, y); this.b = b; this.timer = 9; this.siner = 0; this.beamtime = 10; this.last = 300; this.hits = 0; this.bw = 0; this.mbw = 220;
    this.ar = 0.7; this.shaken = 0; this.depth = -1000;
  }
  alarm() {
    const b = this.b;
    b.playHurt(); b.shake = 2;
    const hp = [1, 1, 0.9, 0.5, 0.1, 0.01][this.hits];
    if (hp !== undefined) b.player.hp = hp; else if (this.hits <= 9) b.hpGlitch = this.hits - 5;
    this.hits++; this.al[5] = 40;
  }
  update() { this.tickAlarms(); }
  draw(ctx) {
    const b = this.b; this.timer++; this.siner++;
    const col = hsv(this.siner * 11, 190, 250), col2 = hsv((this.siner + 3) * 11, 190, 250), col3 = hsv((this.siner + 5) * 11, 140, 250);
    if (this.timer === this.beamtime) {
      this.hits = 0; this.al[5] = 1; b.heartDepth = -2100;
      b.snd('rainbowbeam', 0.8, 1); this.s2 = b.snd('beamhold', 1, 1, true); this.svol2 = 0; this.bw = 0;
    }
    if (this.timer > this.beamtime) {
      if (this.timer < this.beamtime + 6) this.bw += this.mbw / 5;
      if (this.bw > 0) {
        if (this.svol2 < 0.8) this.svol2 += 0.05;
        b.setSndVol(this.s2, this.svol2);
        const ob = Math.sin(this.siner / 2) * (this.mbw / 5) * (this.bw / this.mbw), X = this.x, Y = this.y, H = 490;
        ctx.globalAlpha = Math.max(0, this.ar);
        const tri = (w, c) => { const g = ctx.createLinearGradient(X, Y, X, H); g.addColorStop(0, col); g.addColorStop(1, c); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + this.bw + w, H); ctx.lineTo(X - this.bw - w, H); ctx.fill(); };
        tri(ob, col2); tri(ob / 2, col2); tri(-ob, col3);
        const k = this.bw / this.mbw, s = Math.sin(this.siner / 2);
        drawSprite(ctx, 'spr_beamcircle', 0, X, Y, { xs: (7 + s * 3.75) * k, ys: (7 + s * 3.75) * k, color: col, alpha: this.ar });
        drawSprite(ctx, 'spr_beamcircle', 0, X, Y, { xs: (6 + s * 2.5) * k, ys: (6 + s * 2.5) * k, color: col, alpha: this.ar });
        drawSprite(ctx, 'spr_beamcircle', 0, X, Y, { xs: (5 + s) * k, ys: (5 + s) * k, color: col2, alpha: this.ar });
        ctx.globalAlpha = 1;
        if (this.timer === 120) { this.shaken = 1; this.bw += 100; this.mbw += 80; if (this.s2) this.s2.playbackRate.value = 1.3; b.beamSay(0); }
        if ((this.timer === 190 || this.timer === 340)) b.beamSay(-1);
        if (this.timer === 240) { this.shaken = 2; this.bw += 400; this.mbw += 260; if (this.s2) this.s2.playbackRate.value = 1.8; b.beamSay(1); }
        if (this.shaken === 1) b.buttonShake = 1;
        if (this.shaken === 2) { b.buttonShake = 2; b.onlyAct = true; }
        if (this.timer > this.beamtime + 80 + this.last) {
          if (this.svol2 > 0) this.svol2 -= 0.1; b.setSndVol(this.s2, Math.max(0, this.svol2));
          this.bw -= this.mbw / 12; this.ar -= 0.04;
          if (this.bw <= 0) { b.stopSnd(this.s2); this.dead = true; delete this.al[5]; b.beamDone(); }
        }
      }
    }
  }
}
