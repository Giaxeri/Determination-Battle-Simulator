import { drawSprite, spriteBBox, playSound } from './assets.js';

// ============================================================================
//  Ataques del alma roja de Undyne the Undying, traducidos del juego:
//    SpearSummon   <- obj_spearbulletfollowgen + obj_spearbullet_follow
//    RisingSpears  <- obj_risespearbulletgen   + obj_risespearbullet
//    SpearCircle   <- obj_rotspeargen_gen      + obj_rotspeargen + obj_rotspear
//    SpinAmbush    <- obj_followspeargen_2     + obj_followspear_2
// ============================================================================
const rad = d => d * Math.PI / 180;
const ldx = (len, dir) => Math.cos(rad(dir)) * len;           // lengthdir_x
const ldy = (len, dir) => -Math.sin(rad(dir)) * len;          // lengthdir_y
const pdir = (x1, y1, x2, y2) => Math.atan2(-(y2 - y1), x2 - x1) * 180 / Math.PI;  // point_direction
const choose = (...a) => a[Math.floor(Math.random() * a.length)];

// ¿El segmento toca el rectángulo?
function lineHitsRect(x1, y1, x2, y2, r) {
  let t0 = 0, t1 = 1; const dx = x2 - x1, dy = y2 - y1;
  for (const [p, q] of [[-dx, x1 - r.x1], [dx, r.x2 + 1 - x1], [-dy, y1 - r.y1], [dy, r.y2 + 1 - y1]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
}
const overlap = (a, b) => a.x1 <= b.x2 && a.x2 >= b.x1 && a.y1 <= b.y2 && a.y2 >= b.y1;

// Movimiento estilo GameMaker (speed/direction/friction)
class Mover {
  step() {
    if (this.friction) {
      if (this.friction > 0) this.speed = Math.max(0, this.speed - this.friction);
      else this.speed -= this.friction;
    }
    this.x += ldx(this.speed, this.direction); this.y += ldy(this.speed, this.direction);
  }
}

// La lanza golpea con una línea de 25 px en su dirección (collision_line con el alma)
function spearLineHits(s, dir, heartRect) {
  const xo = ldx(25, dir), yo = ldy(25, dir);
  return lineHitsRect(s.x - xo / 2, s.y - yo / 2, s.x + xo, s.y + yo, heartRect);
}

class RedAttack {
  constructor(b) { this.b = b; this.bullets = []; this.done = false; }
  heart() { return this.b.heart; }
  heartRect() { const h = this.b.heart; return { x1: h.x + 2, y1: h.y + 2, x2: h.x + 13, y2: h.y + 13 }; }
  updateBullets() { for (const s of this.bullets) s.update(this); this.bullets = this.bullets.filter(s => !s.dead); }
  draw(ctx) { for (const s of this.bullets) s.draw(ctx, this); }
}

// ---------------------------------------------------------------- "Spear Summon"
class FollowSpear extends Mover {            // obj_spearbullet_follow
  constructor(h) {
    super();
    this.rotspeed = 32; this.alpha = 0; this.angle = 0;
    this.x = h.x - 4 + Math.random() * 8; this.y = h.y - 4 + Math.random() * 8;
    const off = pdir(this.x, this.y, h.x, h.y);
    this.x += ldx(140, off); this.y += ldy(140, off);
    this.direction = off; this.speed = 4; this.friction = 0.2;
    this.dmg = 11; this.deactivate = 0;
    playSound('spearappear');
  }
  update(a) {
    this.alpha += 0.05;
    this.angle -= this.rotspeed;
    if (this.rotspeed > 0) this.rotspeed--;
    if (this.rotspeed === 0 && this.speed < 1) {
      playSound('arrow');
      const h = a.heart();
      this.direction = pdir(this.x, this.y, h.x + 10, h.y + 10); this.speed = 3;
      this.friction = -0.3; this.angle = this.direction;
    }
    this.step();
    if (this.rotspeed === 0 && this.deactivate === 0 && spearLineHits(this, this.direction, a.heartRect())) a.b.hurtPlayer(this.dmg);
    if (this.deactivate === 1) { this.alpha -= 0.1; if (this.alpha <= 0) this.dead = true; }
    if (Math.abs(this.x - 320) > 900 || Math.abs(this.y - 240) > 900) this.dead = true;
  }
  draw(ctx) { drawSprite(ctx, 'spr_whitespearbullet', 0, this.x, this.y, { rot: this.angle, alpha: this.alpha }); }
}

export class SpearSummon extends RedAttack {
  constructor(b) { super(b); this.alarm = 1; }
  update() {
    const tt = this.b.turntimer;
    if (this.done) { this.updateBullets(); return; }   // el generador ya no existe: no crea más lanzas
    if (tt < 3) { this.bullets.forEach(s => s.deactivate = 1); this.done = true; }
    else if (--this.alarm <= 0) { this.bullets.push(new FollowSpear(this.heart())); this.alarm = this.b.firingrate; }
    this.updateBullets();
  }
}

// ---------------------------------------------------------------- "Rising Spears"
class RiseSpear {                             // obj_risespearbullet
  constructor(x, y) {
    this.x = x; this.y = y; this.visible = false; this.alarm1 = 1; this.alarm0 = 20;
    this.part = 0; this.vs = 0; this.alpha = 1; this.deactivate = 0; this.dmg = 11;
  }
  update(a) {
    if (this.alarm1 > 0 && --this.alarm1 === 0) { this.visible = true; this.vs = -1; playSound('spearappear'); }
    if (this.alarm0 > 0 && --this.alarm0 === 0) {
      if (this.part === 3) this.part = 4;
      else if (this.part === 2) { this.vs = 0; this.part = 3; this.alarm0 = 2; }
      else if (this.part === 1) { this.vs = -10; playSound('spearrise'); this.part = 2; this.alarm0 = 6; }
      else if (this.part === 0) { this.part = 1; this.vs = 0; this.alarm0 = 12; }
    }
    if (this.part === 4 || this.deactivate === 1) { this.alpha -= 0.1; if (this.alpha <= 0) this.dead = true; }
    this.y += this.vs;
    if (this.part > 0 && this.part < 4 && this.deactivate === 0) {
      const h = a.heart();
      if (overlap(spriteBBox('spr_risespearbullet', this.x, this.y), { x1: h.x, y1: h.y, x2: h.x + 15, y2: h.y + 15 })) a.b.hurtPlayer(this.dmg);
    }
  }
  draw(ctx, a) {                              // draw_self_border_ext: solo se ve dentro de la caja
    if (!this.visible) return;
    const bx = a.b.box;
    ctx.save(); ctx.beginPath(); ctx.rect(bx.l + 5, bx.t + 5, bx.r - bx.l - 5, bx.b - bx.t - 5); ctx.clip();
    drawSprite(ctx, 'spr_risespearbullet', 0, this.x, this.y, { alpha: this.alpha });
    ctx.restore();
  }
}

export class RisingSpears extends RedAttack {
  constructor(b) { super(b); this.alarm = 10; this.xsetmem = -1; }
  update() {
    const b = this.b;
    if (this.done) { this.updateBullets(); return; }
    if (b.turntimer < 4) { this.bullets.forEach(s => s.deactivate = 1); this.done = true; }
    else if (--this.alarm <= 0 && b.turntimer > 8) {
      let xset = Math.floor(Math.random() * 3);
      if (xset === this.xsetmem) xset++;
      if (xset === 3) xset = 0;
      this.xsetmem = xset;
      const [l, , , bottom] = b.ideal();
      this.bullets.push(new RiseSpear(l + xset * 23, bottom));
      this.alarm = b.firingrate;
    }
    this.updateBullets();
  }
}

// ---------------------------------------------------------------- "Circle of Spears" / "Chaotic Circle"
class RotSpear {                              // obj_rotspear
  constructor(x, y) { this.x = x; this.y = y; this.alpha = 0; this.deactivate = 0; this.angle = 0; this.dmg = 12; }
  update(a) {
    if (this.deactivate === 0 && this.alpha < 1) this.alpha += 0.2;
    if (this.deactivate === 1) { this.alpha -= 0.2; if (this.alpha < 0.3) this.dead = true; }
    if (this.deactivate === 0 && this.alpha >= 0.8 && spearLineHits(this, this.angle, a.heartRect())) a.b.hurtPlayer(this.dmg);
  }
  draw(ctx) { drawSprite(ctx, 'spr_followspear_2', 0, this.x, this.y, { rot: this.angle, alpha: this.alpha }); }
}

class SpearRing {                             // obj_rotspeargen: anillo que se cierra girando
  constructor(a, x, y, type) {
    this.x = x; this.y = y; this.alarm = 1; this.active = false; this.spears = [];
    const T = { 0: [0, 8, 2, 7, 220], 1: [0, -8, -2, 7, 220], 2: [Math.random() * 360, 8, 2, 8, 230], 3: [Math.random() * 360, -8, -2, 8, 230] }[type];
    [this.curang, this.rotspeed, this.rotmin, this.num, this.rr] = T;
    this.a = a;
  }
  place(s, i) {
    s.x = this.x + ldx(this.rr, this.curang + i / this.num * 360);
    s.y = this.y + ldy(this.rr, this.curang + i / this.num * 360);
    s.angle = pdir(s.x, s.y, this.x, this.y);
  }
  update() {
    if (this.alarm > 0 && --this.alarm === 0) {
      for (let i = 0; i < this.num; i++) { const s = new RotSpear(0, 0); this.place(s, i); this.spears.push(s); this.a.bullets.push(s); }
      this.active = true;
    }
    if (!this.active) return;
    if (this.rotspeed > this.rotmin) this.rotspeed -= 0.2;
    if (this.rotspeed < this.rotmin) this.rotspeed += 0.2;
    this.spears.forEach((s, i) => { if (!s.dead) { this.place(s, i); if (this.rr < 8) s.deactivate = 1; } });
    if (this.rr < 8) { this.rr += 1; this.rotspeed *= 0.8; }
    if (this.rr < -20) this.dead = true;
    this.rr -= 4;
    this.curang += this.rotspeed;
  }
}

export class SpearCircle extends RedAttack {  // obj_rotspeargen_gen (type 0 = alterna el giro, type 1 = ángulo al azar)
  constructor(b, type) { super(b); this.type = type; this.alarm = 1; this.t = 0; this.rings = []; }
  update() {
    const b = this.b, h = this.heart();
    if (this.done) { this.updateBullets(); return; }
    if (b.turntimer < 4) {
      if (!this.done) { this.bullets.forEach(s => { s.deactivate = 1; }); this.rings = []; }
      this.done = true;
    } else if (--this.alarm <= 0) {
      if (this.type === 0) { this.rings.push(new SpearRing(this, h.x + 8, h.y + 8, this.t)); this.t = this.t === 0 ? 1 : 0; this.alarm = 27; }
      else { this.rings.push(new SpearRing(this, h.x + 8, h.y + 8, choose(2, 3))); this.alarm = 24; }
    }
    this.rings.forEach(r => r.update()); this.rings = this.rings.filter(r => !r.dead);
    this.updateBullets();
  }
}

// ---------------------------------------------------------------- "Spinning Ambush"
class AmbushSpear extends Mover {            // obj_followspear_2
  constructor(x, y, h, fade) {
    super();
    this.x = x; this.y = y; this.rotspeed = 38; this.alpha = 0;
    const off = pdir(x, y, h.x + 8, h.y + 8);
    this.angle = off + 20; this.direction = off; this.speed = 4; this.friction = 0.2;
    this.dmg = 11; this.deactivate = 0; this.timer = 0; this.fade = fade;
  }
  update(a) {
    this.alpha += 0.05;
    this.angle -= this.rotspeed;
    if (this.rotspeed > 0) this.rotspeed -= 2;
    if (this.rotspeed === 0 && this.speed < 1) {
      if (++this.timer === 5) { this.speed = 8; this.friction = -0.3; this.direction = this.angle; }
    }
    if (this.fade === 1 && this.speed >= 7) { if (++this.timer >= 22) this.deactivate = 1; }
    this.step();
    if (this.rotspeed === 0 && this.deactivate === 0 && spearLineHits(this, this.direction, a.heartRect())) {
      if (a.b.player.hp > 1) a.b.hurtPlayer(this.dmg, { minHp: 1 });   // este ataque no puede matarte
    }
    if (this.deactivate === 1) { this.alpha -= 0.25; if (this.alpha <= 0) this.dead = true; }
  }
  draw(ctx) { drawSprite(ctx, 'spr_followspear_2', 0, this.x, this.y, { rot: this.angle, alpha: this.alpha }); }
}

export class SpinAmbush extends RedAttack {  // obj_followspeargen_2 (type 1)
  constructor(b) { super(b); this.alarm = 1; this.curang = 0; this.num = 6; this.rate = 20; this.rr = 180; }
  update() {
    if (this.done) { this.updateBullets(); return; }
    if (this.b.turntimer < 3) { this.bullets.forEach(s => s.deactivate = 1); this.done = true; }
    else if (--this.alarm <= 0) {
      const h = this.heart();
      for (let i = 0; i < this.num; i++) {
        const ang = this.curang + i / this.num * 360;
        this.bullets.push(new AmbushSpear(h.x + 8 + ldx(this.rr, ang), h.y + 8 + ldy(this.rr, ang), h, 1));
      }
      if (this.rate > 10) this.rate--;
      this.curang += 10 + choose(10, 20, 30);
      this.alarm = this.rate;
    }
    this.updateBullets();
  }
}
