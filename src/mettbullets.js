import { drawSprite, drawText, playSound, SPR, FNT } from './assets.js';
import { isES, tr } from './i18n.js';
import { ES } from './lang/es.js';
import { rnd, choose, gmMove, dirOf, setSpeedDir, setDir, ldx, ldy, pdir, rotBBox, R, hit, lineHits } from './gm.js';

// ============================================================================
//  Balas de Mettaton EX (hijas de obj_metttestbulletparent) y el generador obj_mettattackgen.
//  El alma es amarilla (mira hacia arriba) y con Z dispara (obj_heartshot).
// ============================================================================

export class Shot {                                // obj_heartshot
  constructor(x, y) { this.x = x; this.y = y; this.vs = -16; this.ys = 1; }
  update() { if (this.y < 0) { this.dead = true; return; } this.ys += 0.2; this.vs -= 0.2; this.y += this.vs; }
  box() { return R(this.x + 1, this.y, this.x + 8, this.y + 15 * this.ys); }
  draw(ctx) { drawSprite(ctx, 'spr_heartbullet', 0, this.x, this.y, { ys: this.ys }); }
}

class BrokenPiece {                                // obj_brokenpiece: el sprite se parte en 4 trozos
  constructor(spr, frame, x, y) { this.spr = spr; this.frame = frame; this.x = x; this.y = y; this.siner = 0; this.alpha = 0.8; this.keep = true; }
  update() { this.siner++; this.alpha -= 0.05; if (this.alpha < 0.1) this.dead = true; }
  draw(ctx) {
    const s = SPR[this.spr]; if (!s) return;
    const im = s.frames[Math.floor(this.frame) % s.frames.length], w = s.w / 2, h = s.h / 2, k = this.siner;
    ctx.save(); ctx.globalAlpha = Math.max(0, this.alpha);
    const X = Math.round(this.x), Y = Math.round(this.y);
    ctx.drawImage(im, 0, 0, w, h, X - k, Y - k, w, h); ctx.drawImage(im, w, 0, w, h, X + k + w, Y - k, w, h);
    ctx.drawImage(im, 0, h, w, h, X - k, Y + k + h, w, h); ctx.drawImage(im, w, h, w, h, X + k + w, Y + k + h, w, h);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- piernas que barren (obj_mettleg_l / _r)
class MettLeg {
  constructor(side, x, y, o = {}) {
    Object.assign(this, { side, x, y, xinit: x, on: 1, s: 0, sf: 30, sp: 6, vs: 3, hs: 0, c: 0, visible: 0, alarm0: 1 }, o);
    if (side === 'r') this.x += 216;
  }
  setx() { this.x = this.xinit + (this.side === 'r' ? 216 : 0) + (this.c === 1 ? Math.cos(this.s / this.sp) : Math.sin(this.s / this.sp)) * this.sf; }
  update(a) {
    if (this.alarm0 && --this.alarm0 === 0) {       // Alarm_0: fase inicial del vaivén
      const l = this.side === 'l', sf = this.sf, sp = this.sp;
      this.s = (l ? 1 : -1) * sp * Math.PI / 2;
      if (this.c === 0) { this.xinit -= Math.sin(this.s / sp) * sf; this.setx(); }
      else if (this.c === 1) { this.xinit -= Math.cos(this.s / sp) * sf; this.setx(); }
      else if (this.c === 2) { this.s = -this.s; this.xinit += Math.sin(this.s / sp) * sf; this.c = 0; this.setx(); }
      this.visible = 1;
    }
    this.y += this.vs;
    if (hit(this.box(), a.heartBox())) a.hurt();
    if (!this.visible) return;
    const sr = this.side === 'l' ? R(this.x, this.y + 1, this.x + 211, this.y + 20) : R(this.x, this.y + 1, this.x - 211, this.y + 20);
    const s = a.shotIn(sr);
    if (s) { a.killShot(s); playSound('swallow'); a.b.rat.ratings += 5; this.on = this.on ? 0 : 1; }
    if (this.on === 1) { this.s += this.side === 'l' ? -1 : 1; this.setx(); }
  }
  box() { return this.side === 'l' ? R(this.x, this.y + 2, this.x + 207, this.y + 16) : R(this.x - 207, this.y + 2, this.x, this.y + 16); }
  draw(ctx) { if (this.visible) drawSprite(ctx, 'spr_mettlegbullet_l', 0, this.x, this.y, { xs: this.side === 'l' ? 1 : -1, color: this.on ? '#ffff00' : null }); }
}

// ---------------------------------------------------------------- brazos con botón amarillo (obj_metthand_l / _r)
class MettHand {
  constructor(side, x, y, o = {}) {
    Object.assign(this, { side, x, y, segx: x, segxinit: x, anim: 0, on: 0, xm: 0, s: 0, vs: 2 }, side === 'l' ? { sf: 25, sp: 15, yseg: 60 } : { sf: 20, sp: 12, yseg: 40 }, o);
    if (this.ysegi === undefined) this.ysegi = this.yseg;
  }
  update(a) {
    this.y += this.vs;
    const [L, Rb] = a.b.ideal(), l = this.side === 'l', y = this.y;
    this.anim += 0.25;
    const trig = l ? this.segx + this.yseg : this.segx - this.yseg;
    let s = a.shotIn(R(trig, y, trig + 20, y + 14));
    if (s) { playSound('burst'); a.killShot(s); this.on = this.on ? 0 : 1; }
    s = a.shotIn(l ? R(this.segx + 3, y - 4, Rb, y + 10) : R(this.segx + 16, y - 4, L, y + 10));
    if (s) { if (!l) a.b.charge = 30; a.killShot(s); this.vs += 0.75; this.y += 3; playSound('swallow'); }
    if (hit(l ? R(this.segx + 5, y + 4, Rb, y + 14) : R(this.segx + 12, y + 4, L, y + 14), a.heartBox())) a.hurt();
    if (l) {
      if (this.on === 1) { if (this.segx < Rb + 5) { this.xm = this.xm <= 0 ? 2 : this.xm + 2; this.segx += this.xm; } else { this.xm = 0; this.segx = Rb + 5; } }
      else if (this.segx > this.segxinit) { this.xm = this.xm >= 0 ? -1 : this.xm - 1; this.segx += this.xm; } else { this.xm = 0; this.segx = this.segxinit; }
    } else {
      if (this.on === 1) { if (this.segx > L - 25) { this.xm = this.xm >= 0 ? -2 : this.xm - 2; this.segx += this.xm; } else { this.xm = 0; this.segx = L - 25; } }
      else if (this.segx < this.segxinit) { this.xm = 1; this.segx += this.xm; } else { this.xm = 0; this.segx = this.segxinit; }
    }
    this.s++; this.yseg = this.ysegi + Math.sin(this.s / this.sp) * this.sf;
  }
  draw(ctx, a) {
    const [L, Rb] = a.b.ideal(), l = this.side === 'l', y = Math.round(this.y), sx = Math.round(this.segx);
    const rect = (x1, y1, x2, y2, c) => { ctx.fillStyle = c; ctx.fillRect(Math.min(x1, x2), y1, Math.abs(x2 - x1) + 1, y2 - y1 + 1); };
    if (l) {
      if (sx + 18 <= Rb + 2) { rect(sx + 18, y + 2, Rb + 2, y + 18, '#000'); rect(sx + 20, y + 4, Rb, y + 16, '#fff'); }
      for (let i = sx + 20; i < Rb; i += 20) rect(i - 1, y + 2, i, y + 18, '#000');
    } else {
      if (sx + 2 >= L - 2) { rect(sx + 2, y + 2, L - 2, y + 18, '#000'); rect(sx, y + 4, L, y + 16, '#fff'); }
      for (let i = sx; i > L; i -= 20) rect(i - 1, y + 2, i, y + 18, '#000');
    }
    const trig = l ? this.segx + this.yseg : this.segx - this.yseg;
    drawSprite(ctx, this.on ? 'spr_yellowtrigger_off_pl' : 'spr_yellowtrigger_pl', this.anim, trig, y);
    drawSprite(ctx, l ? 'spr_metthand_pl' : 'spr_metthand_r', 0, this.segx, y);
  }
}

// ---------------------------------------------------------------- Mettatons con paraguas (obj_mettfodder) y sus besos
class Kissy {                                      // obj_kissybullet_pl (o destello spr_tinysparkle)
  constructor(x, y, speed, dir, o = {}) {
    Object.assign(this, { x, y, hs: 0, vs: 4 + rnd(0.1), grav: 0, gdir: 270, friction: 0, siner: 0, size: 0.1, spr: 'spr_kissbullet', ang: 0, xs: 0.1 }, o);
    setSpeedDir(this, speed, dir);
  }
  update(a) {
    this.siner++; if (this.size < 1) this.size += 0.1;
    this.ang = Math.sin(this.siner / 4) * 12; this.xs = this.size + Math.sin(this.siner / 2) * 0.1;
    gmMove(this);
    if (hit(rotBBox(this.spr, this.x, this.y, this.ang, this.xs), a.heartBox())) a.hurt();
  }
  draw(ctx) { drawSprite(ctx, this.spr, 0, this.x, this.y, { xs: this.xs, ys: this.xs, rot: this.ang }); }
}
class Fodder {
  constructor(x, y, o = {}) {
    Object.assign(this, { x, y, hs: 0, vs: 4, grav: 0, gdir: 270, friction: 0, type: 0, early: 20, flash: 0, alarm4: 0, frame: 0, ispd: 0 }, o);
  }
  update(a) {
    const T = a.b.ideal()[2];
    if (this.alarm4 > 0 && --this.alarm4 === 0) this.flash++;
    if (this.y > T - this.early - 15 && this.flash === 0) { this.flash = 1; this.alarm4 = 20; }
    if (this.flash === 1 && this.early <= 20 && this.vs > 1.5) this.vs -= 0.15;
    if (this.early > 20 && this.y > T - 20 - 15 && this.vs > 1.5) this.vs -= 0.15;
    if (this.flash === 2) { this.flash = 3; this.alarm4 = 30; }
    if (this.flash === 3 && this.alarm4 < 26) this.ispd = 0.5;
    if (this.flash === 4) {                         // lanza un beso hacia el alma
      const h = a.b.heart; a.add(new Kissy(this.x + 10, this.y + 10, 5, pdir(this.x + 10, this.y + 10, h.x + 10, h.y + 10))); this.flash = 5;
    }
    if (this.flash === 5) {
      this.flash = 1; this.alarm4 = 30;
      if (this.type === 2) { this.flash = 9; this.gdir = this.x < 320 ? 180 : 0; this.grav = 0.5; this.friction = 0.2; }
    }
    if (this.y > 480) { this.dead = true; return; }
    const s = a.shotIn(R(this.x + 2, this.y + 2, this.x + 22, this.y + 22));
    if (s) {
      a.killShot(s); playSound('burst'); a.b.rat.ratings += 20;
      a.add(new BrokenPiece('spr_parasolmett', this.frame, this.x - 20, this.y - 23)); this.dead = true; return;
    }
    if (this.frame > 16 && this.ispd > 0) { this.frame = 0; this.ispd = 0; }
    gmMove(this); this.frame += this.ispd;
  }
  leave() { this.flash = 5; this.type = 2; }
  draw(ctx) { drawSprite(ctx, 'spr_parasolmett', this.frame, this.x, this.y); }
}

// ---------------------------------------------------------------- rayos (obj_mettlightning_pl)
class Lightning {
  constructor(x, y, o = {}) { Object.assign(this, { x, y, hs: 0, vs: 4 + rnd(0.1), grav: 0, gdir: 270, friction: 0 }, o); }
  update(a) {
    gmMove(this);
    if (hit(rotBBox('spr_mettlightning_pl', this.x, this.y, dirOf(this)), a.heartBox())) a.hurt();
    if (this.y > 520 || this.y < -600 || this.x < -60 || this.x > 700) this.dead = this.y > 520 || this.x < -60 || this.x > 700;
  }
  draw(ctx) { drawSprite(ctx, 'spr_mettlightning_pl', 0, this.x, this.y, { rot: dirOf(this) }); }
}

// ---------------------------------------------------------------- cajas negras y bombas (obj_blackbox_pl, obj_plusbomb)
class BlackBox {
  constructor(x, y, o = {}) { Object.assign(this, { x, y, xstart: x, hs: 0, vs: 4, grav: 0, gdir: 270, friction: 0, sf: 0, s: 0, sp: 10, spr: 'spr_blackbox_pl' }, o); this.box = true; }
  update(a) {
    if (hit(rotBBox('spr_blackbox_pl', this.x, this.y), a.heartBox())) a.hurt();
    const s = a.shotIn(R(this.x + 2, this.y + 2, this.x + 22, this.y + 22));
    if (s) { a.b.rat.ratings += 20; playSound('burst'); a.killShot(s); a.add(new BrokenPiece('spr_blackbox_pl', 0, this.x, this.y)); this.dead = true; return; }
    this.s++; this.x = this.xstart + Math.sin(this.s / this.sp) * this.sf;
    gmMove(this);
  }
  draw(ctx) { drawSprite(ctx, 'spr_blackbox_pl', 0, this.x, this.y); }
}
class PlusBomb {
  constructor(x, y, o = {}) {
    Object.assign(this, { x, y, xstart: x, hs: 0, vs: 4, grav: 0, gdir: 270, friction: 0, sf: 0, s: 0, sp: 10, frame: 0, ispd: 0, shot: 0, shot2: 0, side: 0 }, o);
    this.bomb = true;
  }
  update(a) {
    const bb = rotBBox('spr_plusbomb', this.x, this.y), hb = a.heartBox();
    let col = hit(bb, hb);
    if (this.side === 1 && hit({ ...bb, x1: bb.x1 + 25, x2: bb.x2 + 25 }, hb)) col = true;
    if (this.side === 2 && hit({ ...bb, x1: bb.x1 - 25, x2: bb.x2 - 25 }, hb)) col = true;
    if (col) a.hurt();
    const s = a.shotIn(R(this.x + 2, this.y + 6, this.x + 22, this.y + 28));
    if (s) {
      a.b.rat.ratings += 20; a.killShot(s);
      if (this.shot === 0) { this.loop = playSound('prebomb', { loop: true }); this.shot = 1; }
    }
    this.s++;
    if (this.shot > 0) {
      this.shot2++; this.ispd = 1;
      if (this.shot2 >= 6) {
        if (this.loop) this.loop.stop(); playSound('bomb'); a.b.shake = Math.max(a.b.shake, 3);
        a.add(new Explosion(this.x + 2, this.y + 6)); this.dead = true; return;
      }
    }
    for (const d of [1, 2]) if (this.side === d) {             // el bloque blanco pegado absorbe los disparos
      const o = d === 1 ? 25 : -25, s2 = a.shotIn(R(this.x + 2 + o, this.y + 6, this.x + 22 + o, this.y + 28));
      if (s2) a.killShot(s2);
    }
    this.x = this.xstart + Math.sin(this.s / this.sp) * this.sf;
    gmMove(this); this.frame += this.ispd;
  }
  kill() { if (this.loop) this.loop.stop(); }
  draw(ctx) {
    drawSprite(ctx, 'spr_plusbomb', this.frame, this.x, this.y);
    ctx.fillStyle = '#fff';
    if (this.side === 1) ctx.fillRect(Math.round(this.x) + 27, Math.round(this.y) + 6, 21, 23);
    if (this.side === 2) ctx.fillRect(Math.round(this.x) - 23, Math.round(this.y) + 6, 21, 23);
  }
}
class Explosion {                                  // obj_plusbomb_explosion: cruz de fuego por toda la pantalla
  constructor(x, y) { this.x = x; this.y = y; this.anim = 0; }
  update(a) {
    this.anim++;
    if (this.anim > 1 && this.anim < 3) {
      const hb = a.heartBox();
      if (hit(R(0, this.y + 4, 640, this.y + 16), hb) || hit(R(this.x + 4, 0, this.x + 16, 480), hb)) a.hurt();
    }
    if (this.anim >= 7) this.dead = true;
  }
  draw(ctx) {
    const { x, y } = this, f = Math.max(0, this.anim - 1);
    for (let i = 0; i <= Math.ceil(y / 20); i++) drawSprite(ctx, 'spr_plusbomb_verblast', f, x, y - 20 - i * 20);
    for (let i = 0; i <= Math.ceil(24 - y / 20); i++) drawSprite(ctx, 'spr_plusbomb_verblast', f, x, y + 20 + i * 20);
    for (let i = 0; i <= Math.ceil(x / 20); i++) drawSprite(ctx, 'spr_plusbomb_horblast', f, x - 20 - i * 20, y);
    for (let i = 0; i <= Math.ceil(32 - x / 20); i++) drawSprite(ctx, 'spr_plusbomb_horblast', f, x + 20 + i * 20, y);
    drawSprite(ctx, 'spr_plusbomb_coreblast', f, x, y);
  }
}
class Rewinder {                                   // obj_blackbox_rewinder: "REC" y luego "REW" (todo sube)
  constructor(o = {}) { Object.assign(this, { rew: 0, rewed: 0, maxrw: 12, f: 0 }, o); }
  update(a) {
    this.rew++; this.f += 0.1;
    const movers = a.objs.filter(o => o.box || o.bomb);
    if (this.rewed === 0 && this.rew > 95) { this.rewed = 1; const m = movers.find(o => o.box); this.vsp = m ? m.vs : 0; }
    if (this.rewed === 1) { this.vsp -= 0.4; if (this.vsp >= -this.maxrw) for (const o of movers) o.vs = this.vsp; }
  }
  draw(ctx, a) {
    const [, Rb, , B] = a.b.ideal(), spr = this.rewed ? 'spr_rewbox' : 'spr_recbox', s = SPR[spr];
    drawSprite(ctx, spr, this.f, Rb - s.w - 5, B - s.h - 5);
  }
}

// ---------------------------------------------------------------- bola de discoteca (obj_discoball_pl)
class DiscoBall {
  constructor(x, y, diff) {
    this.x = x; this.y = y; this.diff = diff; this.active = 0; this.type = 0; this.swaptimer = 0; this.soundtimer = 0; this.alarm0 = 1;
    this.spr = 'spr_discoball_pl'; this.persist = false;
  }
  setup() {
    const D = [{ laser: [1, 1, 2, 1, 1], max: 5, dist: 72, rs: 2, rt: 80, rot: 20 }, { laser: [1, 1, 1, 2, 1], max: 5, dist: 72, rs: 4, rt: 0, rot: 0 },
               { laser: [1, 1, 2, 1, 1], max: 4, dist: 90, rs: 4.75, rt: 0, rot: 0 }][this.diff];
    this.laser = [...D.laser]; this.maxlaser = D.max; this.laserdist = D.dist; this.rotspeed = D.rs; this.rottimer = D.rt; this.rot = D.rot;
    this.laserno = 0; this.active = 1;
  }
  update(a) {
    if (this.alarm0 && --this.alarm0 === 0) this.setup();
    const s = a.shotIn(rotBBox('spr_discoball_pl', this.x, this.y));
    if (s) {                                       // disparo: se invierten los colores de los láseres
      a.killShot(s); this.type = this.type ? 0 : 1; this.swaptimer = 3; this.spr = 'spr_discoball_invert_pl';
      if (this.soundtimer < 0) { playSound('noise'); this.soundtimer = 2; }
      a.b.rat.ratings += 5;
    }
    this.soundtimer--; if (--this.swaptimer < 0) this.spr = 'spr_discoball_pl';
    if (!this.active) return;
    const [L, Rb, T, B] = a.b.ideal(), hb = a.heartBox(), moving = a.b.heartMoved();
    this.beams = [];
    for (let i = 0; i < this.maxlaser; i++) {
      let xx = this.x + ldx(160, this.rot + this.laserdist * i) + 20, yy = this.y + ldy(160, this.rot + this.laserdist * i) + 30;
      xx = Math.min(Math.max(xx, L), Rb); yy = Math.min(Math.max(yy, T), B);
      const blue = this.laser[i] === 1 ? this.type === 0 : this.type !== 0;   // azul: solo daña si te mueves
      if (yy > T) {
        this.beams.push([xx, yy, blue]);
        if (lineHits(this.x + 20, this.y + 30, xx, yy, hb) && (!blue || moving)) a.hurt();
      } else if (this.laserno > 0) {                // por encima de la caja: se elige un nuevo color
        this.laser[i] = choose(1, 2, 3);
        if (i > 0 && this.laser[i] === 3) this.laser[i] = this.laser[i - 1] === 1 ? 2 : 1;
        if (i === 0 && this.laser[i] === 3) this.laser[i] = this.laser[this.maxlaser - 1] === 1 ? 2 : 1;
      }
    }
    if (--this.rottimer < 0) this.rot -= this.rotspeed;
    if (this.rot < -180) { this.laserno++; this.rot += 360; }
  }
  draw(ctx) {
    ctx.lineWidth = 3;
    for (const [xx, yy, blue] of this.beams || []) {
      ctx.strokeStyle = blue ? 'rgb(20,168,255)' : '#fff';
      ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 30); ctx.lineTo(xx, yy); ctx.stroke();
    }
    drawSprite(ctx, this.spr, 0, this.x, this.y);
  }
}

class HappyBreak {                                 // obj_happybreaktime
  constructor(x, y) { this.x = x; this.y = y; this.f = 0; }
  update() { this.f += 0.1; }
  draw(ctx) { drawSprite(ctx, 'spr_happybreaktime', this.f, this.x, this.y, { alpha: 0.75 }); }
}

// ---------------------------------------------------------------- corazón de Mettaton (heart-to-heart) y su explosión
class Starburst {
  constructor(x, y, speed, dir, friction) { this.x = x; this.y = y; this.hs = 0; this.vs = 0; this.friction = friction; setSpeedDir(this, speed, dir); this.size = 3; this.ang = rnd(360); this.aspeed = 60; this.alpha = 1; this.keep = true; }
  update() {
    this.size -= 0.1; if (this.size > 1.5) this.alpha -= 0.05;
    if (this.alpha < 0 || this.size < 0.3) { this.dead = true; return; }
    this.ang += this.aspeed; this.aspeed -= 3; gmMove(this);
  }
  draw(ctx) { drawSprite(ctx, 'spr_starburst_x', 0, this.x, this.y, { xs: this.size, ys: this.size, rot: this.ang, alpha: this.alpha }); }
}
class HeartBurst {                                 // obj_mettheart_burst
  constructor(a, x, y, homex, homey) {
    this.x = x; this.y = y; this.hs = 0; this.vs = 0; this.homex = homex; this.homey = homey; this.size = 1; this.timer = -6; this.shake = 0; this.frame = 0; this.ispd = 0;
    a.b.turntimer = 40; a.dark = 0; this.alarm1 = 1; this.keep = true; a.b.heartBurst = this;
  }
  update(a) {
    const b = a.b;
    if (this.alarm1 && --this.alarm1 === 0) setSpeedDir(this, Math.hypot(this.homex - 5 - this.x, this.homey - this.y) / 5, pdir(this.x, this.y, this.homex - 5, this.homey));
    this.timer++; b.body.hurt = 2; b.body.dsf = 2;
    if (this.timer === 0) { this.shake = 5; this.hs = this.vs = 0; this.x = this.homex; this.y = this.homey; }
    if (this.timer >= 0 && this.timer < 4) { this.shake--; this.ispd = 0.5; this.size -= 0.2; }
    if (this.timer === 7) {
      playSound('explosion'); this.shake = 0;
      for (let i = 0; i < 12; i++) a.add(new Starburst(this.x, this.y, 5.7 + rnd(0.6), i * 30 + rnd(5), 0.24 + rnd(0.02)));
    }
    if (this.timer > 7 && this.timer < 10) { this.shake += 6; this.size += 0.75; }
    if (this.timer === 13) { this.ispd = 0; this.frame = 0; this.size = 1; }
    if (this.timer >= 13) { this.shake -= 2; if (this.shake < 1) this.shake = 0; }
    if (this.timer > 20) { if (b.turntimer > 9) b.turntimer = 9; b.body.dsf = 0; }
    if (this.shake > 0) { this.x = this.homex - 5 + this.shake - rnd(this.shake * 2); this.y = this.homey + this.shake - rnd(this.shake * 2); }
    if (b.turntimer < 0) { b.body.faceemotion = 7; this.dead = true; b.heartBurst = null; return; }
    b.body.faceemotion = 6;
    this.x += this.hs; this.y += this.vs; this.frame += this.ispd;
  }
  draw(ctx) { drawSprite(ctx, 'spr_mettheart_centered', this.frame, this.x, this.y, { xs: this.size, ys: this.size }); }
}

class Blocker {                                    // obj_bulletblocker: cajas que giran alrededor del corazón 2
  constructor(x, y) { this.x = x; this.y = y; this.visible = 1; }
  update(a) {
    if (!this.visible) return;
    if (hit(rotBBox('spr_blackbox_pl', this.x, this.y), a.heartBox())) a.hurt();
    const s = a.shotIn(rotBBox('spr_blackbox_pl', this.x, this.y));
    if (s) { a.killShot(s); a.b.rat.ratings += 20; playSound('burst'); a.add(new BrokenPiece('spr_blackbox_pl', 0, this.x, this.y)); this.visible = 0; }
  }
  draw(ctx) { if (this.visible) drawSprite(ctx, 'spr_blackbox_pl', 0, this.x, this.y); }
}
class OrbitBomb {                                  // obj_bulletbomb: bombas que giran alrededor del corazón 3
  constructor(x, y) { this.x = x; this.y = y; this.visible = 1; this.shot = 0; this.shot2 = 0; this.frame = 0; }
  update(a) {
    if (this.shot > 0) {
      this.x = this.nowx; this.y = this.nowy; this.frame++; this.shot2++;
      if (this.shot2 >= 5) {
        if (this.loop) this.loop.stop(); playSound('bomb'); a.b.shake = Math.max(a.b.shake, 3);
        a.add(new Explosion(this.x, this.y)); this.visible = 0; this.shot2 = -1; this.shot = -1;
      }
    }
    if (!this.visible) return;
    if (hit(rotBBox('spr_plusbomb', this.x, this.y), a.heartBox())) a.hurt();
    const s = a.shotIn(rotBBox('spr_plusbomb', this.x, this.y));
    if (s && this.shot === 0) {
      this.loop = playSound('prebomb', { loop: true }); a.killShot(s); this.shot = 1; this.nowx = this.x; this.nowy = this.y; a.b.rat.ratings += 15;
    }
  }
  kill() { if (this.loop) this.loop.stop(); }
  draw(ctx) { if (this.visible) drawSprite(ctx, 'spr_plusbomb', this.frame, this.x, this.y); }
}
class LegLine {                                    // obj_legline_l / _r: piernas que salen de la pared tras el "!"
  constructor(side) { this.side = side; this.myspeed = 8; this.con = 0; this.eo = 0; this.len = 85; this.shake = 0; this.alarm0 = 1; this.alarm4 = 0; this.myx = 0; }
  update(a) {
    if (this.alarm0 && --this.alarm0 === 0) { this.con = 1; this.alarm4 = 24; }
    if (this.alarm4 > 0 && --this.alarm4 === 0) this.con++;
    if (this.con === 1) { if (this.eo === 1) playSound('block2'); }
    if (this.con === 2) { playSound('spearrise'); this.myx = 0; this.con = 3; }
    if (this.con === 3) { this.myx += this.myspeed; if (this.myx >= this.len - this.myspeed) { this.myx = this.len; this.con = 4; this.alarm4 = 6; this.shake = 5; } }
    if (this.shake > 0) this.shake--;
    if (this.con === 5) { this.shake = 0; this.myx -= this.myspeed; if (this.myx <= 0) { this.dead = true; return; } }
    if (this.con >= 3) {
      const [L, Rb, T] = a.b.ideal(), hb = a.heartBox(), l = this.side === 'l';
      for (let i = 0; i < 5; i++) {
        const y0 = T + i * 30, tip = l ? L + this.myx : Rb - this.myx, d = l ? 1 : -1;
        if (hit(R(l ? L : Rb, y0 + 9, tip - 30 * d, y0 + 18), hb) ||
            lineHits(tip - 30 * d, y0 + 9, tip - 8 * d, y0 + 9, hb) || lineHits(tip - 30 * d, y0 + 23, tip - 8 * d, y0 + 9, hb)) a.hurt();
      }
    }
  }
  draw(ctx, a) {
    const [L, Rb, T, B] = a.b.ideal(), l = this.side === 'l';
    if (this.con === 1) {
      ctx.strokeStyle = ['#f00', '#ff0', '#000'][this.eo]; ctx.lineWidth = 1;
      const x1 = l ? L + 6 : Rb - this.len + 6, x2 = l ? L + this.len - 6 : Rb - 6;
      ctx.strokeRect(x1 + 0.5, T + 6.5, x2 - x1, B - 4 - T - 6); ctx.strokeRect(x1 + 1.5, T + 7.5, x2 - x1, B - 3 - T - 7);
      drawSprite(ctx, 'spr_exclamationpoint', this.eo, l ? L + this.len / 2 : Rb - this.len / 2, T + 30);
      if (++this.eo > 2) this.eo = 0;
    }
    if (this.con >= 3) {
      const im = SPR[l ? 'spr_mettlegbullet_l' : 'spr_mettlegbullet_r'].frames[0];
      for (let i = 0; i < 5; i++) {
        const rr = rnd(this.shake) - rnd(this.shake), w = Math.max(1, Math.round(this.myx + rr)), yy = Math.round(T + 5 + i * 30 + rr);
        if (l) ctx.drawImage(im, Math.round(216 - this.myx + rr), 0, w, 26, L, yy, w, 26);
        else ctx.drawImage(im, 0, 0, w, 26, Math.round(Rb - this.myx), yy, w, 26);
      }
    }
  }
}

class MettHeart {                                  // obj_mettheart_1 .. _4
  constructor(a, n, x, y) {
    this.a = a; this.n = n; this.x = x; this.y = y; this.xstart = x; this.ystart = y; this.hs = 0; this.vs = 0;
    this.s = 0; this.frame = 0; this.ispd = 0; this.shake = 0; this.movetype = 0; this.xs = 1; this.visible = 1;
    if (n === 1) Object.assign(this, { sf: 15, sp: 15, lt: 30, life: 800 });
    if (n === 2) {
      Object.assign(this, { sf: 30, sp: 20, s2: 0, sf2: 30, lt: 20, life: 800, num: 8 });
      this.kids = [...Array(8)].map((_, i) => { const g = i * 2 * Math.PI / 8; return a.add(new Blocker(x + Math.sin(g) * 30 - 10, y + Math.cos(g) * 30 - 10)); });
    }
    if (n === 3) {
      Object.assign(this, { sf: 40, sp: 15, s2: 0, sf2: 40, lt: 20, life: 700, num: 2 });
      this.kids = [0, 1].map(i => { const g = i * Math.PI; return a.add(new OrbitBomb(x + Math.sin(g) * 40 - 14, y + Math.cos(g) * 40 - 15)); });
    }
    if (n === 4) Object.assign(this, { sf: 40, sp: 15, lt: 20, life: 1000, shake: 3, moving: 3, alarm3: 60, ltimer: 0, size: 1, vs: -1.5 });
    this.memx = x; this.memy = y;
    a.b.bossHeart = this;
  }
  burstBolts(count, off, fr, speed = 2) {
    for (let i = 0; i < count; i++) a_add(this.a, new Lightning(this.x, this.y, { friction: fr }), speed, (i + off) * 360 / count + this.ddir);
  }
  update(a) {
    const b = a.b, n = this.n;
    if (n === 4) return this.update4(a);
    if (n >= 2) {                                   // hijos que giran
      this.s2 += n === 2 ? 0.2 : 0.08;
      this.kids.forEach((k, q) => {
        const g = q * 2 * Math.PI / this.num;
        if (n === 2 || k.shot === 0) { k.x = this.x + Math.sin(g + this.s2) * this.sf2 - (n === 2 ? 10 : 14); k.y = this.y + Math.cos(g + this.s2) * this.sf2 - (n === 2 ? 10 : 15); }
      });
    }
    if (this.movetype === 0) {
      this.x = this.xstart + Math.sin(this.s / this.sp) * this.sf;
      if (n >= 2) this.y = this.ystart + Math.sin(this.s / this.sp * 2) * this.sf / 3;
      if (this.shake === 0) this.s++;
      if (this.shake > 0) { this.x = this.memx + rnd(this.shake * 2) - this.shake; this.y = this.memy + rnd(this.shake * 2) - this.shake; this.shake--; }
    }
    this.lt++;
    const t = this.lt, [L, Rb] = b.ideal();
    const charge = n === 1 ? [50, 60] : [40, 50];
    if (t > charge[0] && t < charge[1]) { this.ddir = rnd(360); this.ispd = 0.5; }
    const bolts = n === 1 ? [[60, 0], [66, 0.5], [72, 0]] : n === 2 ? [[50, 0], [56, 0.5], [62, 0]] : [[50, 0], [56, 0.5], [62, 0], [68, 0.5]];
    for (const [tt, off] of bolts) if (t === tt) { this.ispd = 0; this.frame = 0; this.burstBolts(n === 1 ? 10 : 11, off, n === 1 ? -0.1 : -0.09); }
    if (n === 1 && t === 95) {                      // dos Mettatons con paraguas
      a.add(new Fodder(L, -20, { vs: 5, type: 2, early: 200 })); a.add(new Fodder(Rb - 25, -20, { vs: 5, type: 2, early: 200 }));
    }
    if (n === 1 && t === 130) this.lt = 36;
    if (n === 2) {
      if (t > 100 && t < 145) { this.s2 -= 0.17; this.sf2 += 9; }
      if (t === 145) for (const k of this.kids) k.visible = 1;
      if (t > 145 && t < 300) { this.s2 -= 0.15; this.sf2 -= 8; if (this.sf2 < 35) { this.sf2 = 30; this.lt = 40; } }
      if (b.turntimer < 5) b.body.dropArms();
    }
    if (n === 3) {
      if (t === 110) a.add(new LegLine('l'));
      if (t === 140) a.add(new LegLine('r'));
      if (t === 160) this.lt = 20;
    }
    this.life -= n === 3 ? 1.25 : 1;
    this.frame += this.ispd;
    this.collide(a);
  }
  update4(a) {
    const b = a.b;
    this.life--;
    if (this.alarm3 > 0 && --this.alarm3 === 0) { this.moving++; this.hs = this.vs = 0; }
    if (this.movetype === 0) {
      if (this.moving === 0) {                      // se mueve a un punto cercano
        const nx = this.xstart + rnd(60) - rnd(60), ny = this.ystart + rnd(20) - rnd(20);
        const sp = Math.hypot(ny - this.x, nx - this.y) / 20;   // el juego intercambia x e y aquí
        setSpeedDir(this, sp, pdir(this.x, this.y, nx, ny)); this.alarm3 = 8; this.moving = 1; this.ispd = 0.5;
      }
      if (this.moving === 2) {                      // apunta al alma y dispara ráfagas
        this.ispd = 0; this.frame = 0; this.chch = choose(0, 1);
        this.tx = b.heart.x + 10; this.ty = b.heart.y + 10; this.ltimer = 100; this.hs = this.vs = 0; this.moving = 3; this.alarm3 = 30;
      }
      if (this.moving === 4) this.moving = 0;
      if (this.shake > 0) { this.x += rnd(this.shake) - rnd(this.shake); this.y += rnd(this.shake) - rnd(this.shake); this.shake--; }
    }
    this.lt++;
    if (this.ltimer >= 100) {
      this.ltimer++;
      const t = this.ltimer, d = pdir(this.x, this.y, this.tx, this.ty), fire = dir => a_add(a, new Lightning(this.x, this.y, { friction: -0.1 }), 8, dir);
      if ([100, 102, 104, 106].includes(t)) fire(d);
      if ([108, 110, 112, 114].includes(t)) fire(this.chch === 1 ? d - 10 : d + 10);
      if ([116, 118, 120, 122].includes(t)) fire(this.chch === 1 ? d + 10 : d - 10);
      if (t === 125) this.ltimer = 0;
    }
    if (this.size > 1) { this.xs = this.size; this.size -= 0.5; if (this.size === 1) this.frame = 0; }
    this.x += this.hs; this.y += this.vs; this.frame += this.ispd;
    this.collide(a);
  }
  collide(a) {
    if (!this.visible) return;
    const s = a.shotIn(rotBBox('spr_mettheart', this.x, this.y, 0, this.xs));
    if (!s) return;
    playSound('mtthit'); a.killShot(s);
    this.memx = this.x; this.memy = this.y;
    if (this.n === 4) { this.shake = 10; this.frame = 1; this.size = 2; } else this.shake = 6;
    this.life -= 40;
    if (this.life < 1 && this.movetype !== 1) {
      if (this.n === 4) { if (a.b.turntimer > 0) a.b.turntimer = 0; }
      else {
        for (const o of a.objs) { if (o instanceof BlackBox || o instanceof Lightning || o instanceof Kissy) o.dead = true; if (o instanceof Fodder) o.leave(); }
        this.movetype = 1; this.lt = 400; this.visible = 0;
        a.add(new HeartBurst(a, this.x, this.y, this.xstart, this.ystart));
        if (this.kids) for (const k of this.kids) k.visible = 0;
        if (this.n === 2) a.b.body.dropArms();
      }
    }
    a.b.rat.ratings += 20;
  }
  draw(ctx) { if (this.visible) drawSprite(ctx, 'spr_mettheart', this.frame, this.x, this.y, { xs: this.xs, ys: this.xs }); }
}
function a_add(a, o, speed, dir) { setSpeedDir(o, speed, dir); return a.add(o); }

// ---------------------------------------------------------------- el ensayo (obj_essaystuff)
const ESSAY_BEAUT = ['beaut', 'hot', 'sexy', 'pretty', 'handsome', 'gorgeous', 'sparkl', 'charm', 'attract', 'cute', 'smokin', 'elegant', 'good look',
  'goodlook', 'good-look', 'grace', 'comely', 'fine', 'foxy', 'looker', 'dreamboat', 'stun', 'shapely', 'ravishing', 'allur', 'entic', 'seduct',
  'enchant', 'appeal', 'tantaliz', 'adorable', 'radiant', 'capitvat'];
const ESSAY_MEAN = ['ugly', 'hideous', 'repulsive', 'unattractive', 'look bad', 'stupid', 'idiot', 'jerk', 'asshole', 'loser', 'dumbass', 'douche', 'creep'];
const ESSAY_SWEAR = ['fuck', 'shit', 'cock', 'pussy', 'penis', 'vagina', 'anus', 'poop', 'tity', 'titty', 'bepis'];
const ESSAY_EN = {
  speechless: ["Speechless...?&Who can blame you?/%%"], concise: ["Well... that's concise./%%"],
  fewest: ['Beautiful. Sometimes&the fewest words&speak the loudest./%%'], star: ['Nice. You get a&gold star./%%'],
  great: ['Oh my... what a&great answer./%%'],
  passion: ['Oooooh, you said so&much about me.../', 'I love how&passionate you are./', "... even though I&don't understand&what you said.../%%"],
  book: ["Beautiful.&Why don't you&write a book?/%%"],
  beaut1: ["Nice detail...&You're right, I do&look quite nice./%%"], beaut3: ['Wonderful! Amazing! A+...&I AM completely stunning./%%'],
  beaut5: ["Oh, I'm blushing...&You're completely right,&I am beautiful in&every way./%%"],
  beaut7: ["Oh my... I'm speechless...&You've completely&captured how&beautiful I am./%%"],
  legs: ["That's right.&Legs was the&correct answer!/%%"], arms: ['How creative. Arms...&most people just&think about my legs./%%'],
  hair: ['My hair... yes,&I use metal hair&gel./%%'],
  personality: ["Yes^1, my personality&is quite charming^1,&isn't it?/%%"], voice: ['They say I have&the voice of a&Siren..^1./', '... awooga!/%%'],
  dance: ["Dancing...^1?&Thank you^1, I'm&self-taught./%%"], mean: ['Huh? This essay is&supposed to be about&me, not about you.../%%'],
  love: ["What a touching&confession! I'll add&it to the pile./%%"], toby: ['Toby? What the hell&is that?&Sounds... sexy./%%'],
  swear: ['Oh my! This is a family&friendly TV show./', 'Now stand still while&I murder you./%%'],
  W: { beaut: ESSAY_BEAUT, legs: ['leg'], arms: ['arm'], hair: ['hair'], personality: ['personality'], voice: ['voice'], dance: ['dancing', 'dance'],
       mean: ESSAY_MEAN, love: ['i love you'], notLove: ['i love your'], toby: ['toby'], swear: ESSAY_SWEAR },
};
export class Essay {
  constructor(b) { this.b = b; this.str = ' '; this.alarm0 = 450; this.con = 0; this.cantype = 1; this.dotimer = 0; this.drawOn = 1; this.endbuffer = 180; b.typing = true; }
  update(inp) {
    const b = this.b;
    if (this.cantype === 1) {
      for (const c of inp.typed || []) {
        if (c === '\b') { if (this.str.length > 1) this.str = this.str.slice(0, -1); }
        else { if (this.endbuffer < 30) this.endbuffer = 30; this.str += c; }
      }
      this.endbuffer--;
      if (this.endbuffer < 0 && this.alarm0 > 10) this.alarm0 = 10;
    }
    if (this.alarm0 > 0 && --this.alarm0 === 0) { this.cantype = 0; this.con = 1; b.typing = false; }
    if (this.con === 1) { this.con = 4; b.essayDone(this.judge()); }
  }
  judge() {                                        // lo que opina Mettaton y cuántos puntos da
    const s = this.str, l = s.toLowerCase(), has = w => l.includes(w), n = s.length;
    const E = isES() ? ES.essay : ESSAY_EN, W = E.W, any = list => list.some(has);
    let msg = E.speechless;
    if (n === 2) msg = E.concise;
    if (n > 2) msg = E.fewest;
    if (n > 13) msg = E.star;
    if (n > 50) msg = E.great;
    if (n > 90) msg = E.passion;
    if (n > 140) msg = E.book;
    let spec = 0, swear = 0, beaut = 0;
    for (const w of W.beaut) if (has(w)) beaut += 2;
    if (any(W.legs)) { beaut += 2; spec = 1; }
    if (any(W.arms)) { beaut += 2; spec = 2; }
    if (any(W.hair)) { beaut += 2; spec = 3; }
    if (beaut > 1) msg = E.beaut1;
    if (beaut > 3) msg = E.beaut3;
    if (beaut > 5) msg = E.beaut5;
    if (beaut > 7) msg = E.beaut7;
    if (spec === 1) msg = E.legs;
    if (spec === 2) msg = E.arms;
    if (spec === 3) msg = E.hair;
    if (any(W.personality)) spec = 3.1;
    if (any(W.voice)) spec = 3.2;
    if (any(W.dance)) spec = 3.3;
    if (spec === 3.1) msg = E.personality;
    if (spec === 3.2) msg = E.voice;
    if (spec === 3.3) msg = E.dance;
    if (any(W.mean)) spec = 4;
    if (spec === 4) msg = E.mean;
    if (any(W.love)) spec = 5;
    if (any(W.notLove)) spec = 0;
    if (spec === 5) msg = E.love;
    if (any(W.toby)) spec = 6;
    if (spec === 6) msg = E.toby;
    if (any(W.swear)) swear = 1;
    if (swear) msg = E.swear;
    let pts;
    if (swear) pts = -150; else if (spec === 6) pts = 300; else if (spec === 5) pts = 250; else if (spec === 4) pts = -200;
    else if (spec === 1) pts = 350; else if (spec === 2 || spec === 3) pts = 250; else if (spec > 3 && spec < 4) pts = 250;
    else if (beaut >= 7) pts = 360; else if (beaut >= 5) pts = 280; else if (beaut >= 3) pts = 250; else if (beaut >= 1) pts = 200;
    else pts = n >= 140 ? 180 : n >= 90 ? 150 : n >= 50 ? 120 : n >= 13 ? 100 : 80;
    return { msg, pts };
  }
  draw(ctx) {
    const b = this.b, [L, , T] = b.ideal();
    wrapText(ctx, this.str, L + 25, T + 15, 25, 450);
    if (this.cantype === 1) ['ESSAY PROMPT:', 'What do you', 'love most about', 'Mettaton?', '(No X or Z)'].forEach((s, i) => drawText(ctx, 'fnt_main', tr(s), 430, 50 + i * 26));
    else drawText(ctx, 'fnt_main', tr('TIME UP!!!'), 430, 200);
    if (++this.dotimer > 4) { this.drawOn = this.drawOn ? 0 : 1; this.dotimer = 0; }
    if (this.drawOn && this.str.length < 3 && this.cantype === 1) drawText(ctx, 'fnt_main', tr('[START TYPING]'), b.heart.x - 30, b.heart.y + 20);
  }
}
function wrapText(ctx, s, x, y, sep, w) {         // draw_text_ext
  const f = FNT.fnt_main, width = t => { let n = 0; for (const c of t) n += (f.glyphs[c] || f.glyphs['?'])[4]; return n; };
  let line = '', row = 0;
  for (const word of s.split(/(?<= )/)) {
    if (line && width(line + word) > w) { drawText(ctx, 'fnt_main', line, x, y + row * sep); row++; line = ''; }
    line += word;
  }
  drawText(ctx, 'fnt_main', line, x, y + row * sep);
}

// ============================================================================
//  obj_mettattackgen: crea las balas de cada tipo de ataque (global.attacktype)
// ============================================================================
export class MettGen {
  constructor(b, type) {
    this.b = b; this.type = type; this.objs = []; this.alarm0 = 1; this.siner = 0; this.dark = 1; this.darkamt = 0; this.specialtimer = 0;
    b.turntimer = 12;
  }
  add(o) { this.objs.push(o); return o; }
  heartBox() { const h = this.b.heart; return rotBBox('spr_heartyellow_flip', h.x, h.y); }
  hurt() { this.b.mettHurt(); }
  shotIn(r) { return this.b.shots.find(s => !s.dead && hit(s.box(), r)); }
  killShot(s) { s.dead = true; }

  spawn() {                                        // Alarm_0
    const b = this.b, t = this.type, [gil, gir, T] = b.ideal(), A = o => this.add(o);
    const grid = (rows, dy, rnd0, vsAdd) => {         // filas de 4 con cajas y bombas (tipos 45, 46, 52)
      for (let j = 0; j < rows; j++) {
        const g = [choose(0, 1)]; g[1] = g[0] + choose(1, 2); g[2] = g[1] + choose(1, 2); g[3] = choose(5, 6);
        const bb = choose(0, 1, 2, 3), b2 = choose(0, 1, 2, 3), b3 = choose(0, 1, 2, 3); let bm = 0;
        for (let i = 0; i < 4; i++) {
          const y = -j * dy + rnd(rnd0);
          if ((bb === i || b2 === i || b3 === i) && bm < 3) { bm++; A(new PlusBomb(gil + g[i] * 25, y)); } else A(new BlackBox(gil + g[i] * 25, y));
        }
      }
      for (const o of this.objs) if (o.box || o.bomb) o.vs += vsAdd();
    };
    const columns = (rows, dy, y0) => {               // columnas con 2 huecos y bombas (tipos 43, 44, 56)
      for (let j = 0; j < rows; j++) {
        const bm1 = choose(0, 1, 2, 3, 4); let bm2 = choose(0, 1, 2, 3, 4); if (bm2 === bm1) bm2++;
        for (let i = 0; i < 4; i++) {
          if (bm1 === i || bm2 === i || j === i) A(new PlusBomb(gil + i * 25, y0 - j * dy)); else A(new BlackBox(gil + i * 25, y0 - j * dy));
        }
      }
    };
    const sideBombs = (n, gap, x0, withSide) => {
      for (let j = 0; j < n; j++) {
        const a1 = A(new PlusBomb(x0, -200 - j * gap)); a1.side = 1;
        const a2 = A(new PlusBomb(x0 + 20, -200 - j * gap + 120)); a2.side = 2;
      }
    };
    if (t === 30) {
      const legs = [['l', gil - 45, 60, 0, 80], ['r', gil, -80, 0, 80], ['l', gil - 70, -240, 1, 30], ['r', gil + 90, -240, 1, 30], ['l', gil - 140, -380, 1, 30], ['r', gil + 30, -380, 1, 30]];
      for (const [s, x, y, on, sf] of legs) A(new MettLeg(s, x, y, { on, sf, vs: 4 }));
    }
    if (t === 31) {
      for (let i = 0; i < 4; i++) { A(new Fodder(gil, -50 - i * 70, { vs: 5, type: 2 })); A(new Fodder(gir - 25, -50 - i * 70, { vs: 5, type: 2 })); }
      for (let i = 0; i < 5; i++) A(new PlusBomb(gil + 25 + rnd(gir - gil - 75), -50 * i));
    }
    if (t === 32) {
      for (const y of [60, 20, -20]) A(new MettLeg('l', gil - 45, y, { on: 0, sf: 60, vs: 3.3 }));
      for (const y of [-200, -240, -280]) A(new MettLeg('r', gil, y, { on: 0, sf: 60, vs: 3.3 }));
      for (const y of [-175, -50, -150, -75]) A(new BlackBox(gil + 75, y, { vs: 3.3, sf: 20, sp: 10 }));
    }
    if (t === 33) {
      A(new MettHand('l', gil, -25, { sf: 20, sp: 7, vs: 3.5, yseg: 999, ysegi: 40 }));
      A(new MettHand('r', gir, -235, { sf: 20, sp: 7, vs: 3.5, yseg: 999, ysegi: 40 }));
      for (let i = 0; i < 5; i++) A(new Fodder(gil + 25 + i * 25, -80, { vs: 3.5, type: 2, early: 80 }));
    }
    if (t === 34) { b.startEssay(); this.dead = true; return; }
    if (t === 35) A(new MettHeart(this, 1, 320, 162));
    if (t === 36) {
      this.specialtimer = 1;
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) A(new Fodder(gil + rnd(150), -j * 90 - i * 30));
      for (const o of this.objs) o.vs += 1;
    }
    if (t === 37 || t === 38 || t === 51) {
      const diff = t === 37 ? 0 : t === 38 ? (b.specialdam[0] > 1 ? 0 : 1) : 2;
      if (t === 38 && b.specialdam[0] > 1) b.turntimer = 270;
      A(new DiscoBall(308, t === 51 ? T : T - 10, diff));
      if (t !== 51) { b.heart.x += 7; b.heart.y += 10; }
    }
    if (t === 39) { this.specialtimer = 2; sideBombs(2, 260, gil + 5); }
    if (t === 40) {
      this.specialtimer = 2; sideBombs(3, 260, gil + 5);
      for (const o of this.objs) o.vs += b.specialdam[1] < 2 ? 2 : 1;
    }
    if (t === 41) A(new HappyBreak(gil + 30, T + 10));
    if (t === 42) A(new MettHeart(this, 2, 320, 162));
    if (t === 43) { columns(8, 180, 0); for (const o of this.objs) o.vs += 3; A(new Rewinder({ maxrw: 10 })); }
    if (t === 44) {
      columns(8, 250, -60); for (const o of this.objs) o.vs += 6;
      const rw = A(new Rewinder());
      if (b.specialdam[2] > 2) { rw.maxrw = 10; for (const o of this.objs) if (o.vs) o.vs -= 1; }
    }
    if (t === 45) grid(10, 45, 20, () => 1 + rnd(0.5) - 0.2);
    if (t === 46) grid(10, 54, 25, () => 2.5 + rnd(0.5) - 0.2);
    if (t === 47) {
      this.specialtimer = 2; b.heart.x = gil;
      for (let j = 0; j < 6; j++) { const ch = choose(5, 25); A(new PlusBomb(b.heart.x + ch, -100 - j * 180, { side: ch === 5 ? 1 : 2 })); }
      for (const o of this.objs) o.vs += b.specialdam[1] > 3 ? 2 : 3;
    }
    if (t === 48) A(new MettHeart(this, 3, 320, 162));
    if (t === 49) A(new MettHeart(this, 4, 320, 232));
    if (t === 52) grid(9, 45, 25, () => 1 + rnd(0.5) - 0.2);
    if (t === 53) {
      this.specialtimer = 2; b.narrow = true; b.heart.x = gil;
      for (let j = 0; j < 7; j++) { const ch = choose(0, 20); A(new PlusBomb(gil + 5 + ch, -100 - j * 170, { side: ch === 0 ? 1 : 2 })); }
      for (const o of this.objs) o.vs += 3.5;
    }
    if (t === 54) {
      this.specialtimer = 1;
      for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) {
        const f = A(new Fodder(gil + rnd(150), -j * 120 - i * 40)); f.vs += 0.5;
        const l = A(new Lightning(gil + rnd(150), -j * 120 - i * 40 - 20, { friction: -0.02 }));
        setDir(l, dirOf(l) + rnd(20) - 10); l.vs += 2;
      }
    }
    if (t === 56) { columns(8, 240, -100); for (const o of this.objs) o.vs += 5; A(new Rewinder({ rew: -40 })); }
    const TT = { 30: 200, 31: 190, 32: 210, 33: 190, 35: 600, 36: 250, 37: 270, 38: 193, 39: 210, 40: 160, 41: 110, 42: 600, 43: 200, 44: 220,
                 45: 165, 46: 140, 47: 200, 48: 700, 49: 800, 51: 160, 52: 150, 53: 200, 54: 250, 56: 260 };
    if (!(t === 38 && b.specialdam[0] > 1)) b.turntimer = TT[t] ?? b.turntimer;
  }

  update(inp) {
    const b = this.b;
    if (this.alarm0 && --this.alarm0 === 0) this.spawn();
    if (this.dead) return;
    this.siner++;
    for (const o of [...this.objs]) if (!o.dead) o.update(this, inp);
    if (b.turntimer < 1) for (const o of this.objs) if (!o.keep && !(o instanceof MettHeart)) { o.dead = true; if (o.kill) o.kill(); }   // obj_metttestbulletparent End Step
    if (b.turntimer < 0) for (const o of this.objs) if (o instanceof MettHeart) { o.dead = true; b.bossHeart = null; }
    this.objs = this.objs.filter(o => !o.dead);
    if (this.specialtimer === 1 && !this.objs.some(o => o instanceof Fodder) && b.turntimer > 9) b.turntimer = 9;
    if (this.specialtimer === 2 && !this.objs.some(o => o instanceof PlusBomb) && b.turntimer > 9) b.turntimer = 9;
    if (b.turntimer <= 9) this.dark = 0;
    if (this.dark === 1 && this.darkamt < 0.5) this.darkamt += 0.05;
    if (this.dark === 0 && this.darkamt > 0) this.darkamt -= 0.05;
  }
  draw(ctx) {
    for (const o of this.objs) if (!(o instanceof MettHeart) && !(o instanceof HeartBurst)) o.draw(ctx, this);
    for (const o of this.objs) if (o instanceof MettHeart || o instanceof HeartBurst) o.draw(ctx, this);
  }
  stopSounds() { for (const o of this.objs) if (o.kill) o.kill(); }
}
