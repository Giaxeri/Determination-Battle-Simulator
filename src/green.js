import { drawSprite, spriteBBox, playSound } from './assets.js';

// ============================================================================
//  Ataques del modo verde (alma verde + escudo), traducidos del juego:
//    obj_spearblocker  -> GreenAttack (escudo, colisiones, fin del turno)
//    obj_greenspeargen -> el temporizador que lanza cada lanza
//    obj_blockbullet   -> Spear (la flecha que viaja hacia el alma)
//  Cada ataque ("lesson") es una lista de llamadas scr_sr(dir, tipo, tiempo, velocidad):
//    dir: 0 izquierda, 1 derecha, 2 abajo, 3 arriba, 4 aleatoria
//    tiempo: multiplica la espera hasta la siguiente lanza (espera = rating * tiempo)
//    velocidad: multiplica los 8 px/frame de la lanza.  0 en tiempo/velocidad = 1
// ============================================================================
// Ataques verdes de Undyne the Undying (obj_spearblocker Other_11, lessons -5 a -14).
// rep = cuántas veces se repite la lista (bucles "repeat" del juego); refuse = al terminar, el alma pasa a roja.
const L = (list, rep = 1, refuse = false) => ({ list: Array.from({ length: rep }, () => list).flat(), refuse });
export const LESSONS = {
  [-5]:  L([[3,0,2,.5],[3,0,2,.5],[3,0,6.5,.5],[1,0,0,1.6],[2,0,0,1.6],[0,0,0,1.6],[3,0,0,1.6],[0,0,0,1.6],[2,0,0,1.6],[1,0,0,1.6],[2,0,0,1.6],[0,0,0,1.6],[3,0,0,1.6]]),
  [-6]:  L([[0,0,0,1.8],[1,0,0,1.8],[0,0,.5,1.8],[0,0,0,1.8],[1,0,0,1.8],[1,0,0,1.8],[0,0,0,1.8],[1,0,.5,1.8],[1,0,0,1.8],[0,0,0,1.8],[1,0,0,2],[0,0,0,2],[1,0,0,2],[0,0,0,2]]),
  [-7]:  L([[4,0,0,.4]], 18, true),
  [-8]:  L([[3,0,0,1],[0,0,0,1.8],[2,0,0,1],[1,0,0,1.8],[0,0,0,1],[3,0,0,.5],[2,0,0,.47],[1,0,0,1.8],[0,0,0,1]]),
  [-9]:  L([[3,0,.5,2],[3,0,.5,2],[3,0,.5,2],[3,0,0,2],[0,0,.5,2],[3,0,.5,2],[3,0,.5,2],[3,0,.5,2],[3,0,0,2],[1,0,.5,2],[3,0,.5,2],[3,0,.5,2],[3,0,1,2],[0,0,.5,2],[3,0,.5,2],[3,0,.5,2],[3,0,1,2],[1,0,.5,2],[3,0,.5,2],[3,0,.5,2],[3,0,.5,2]]),
  [-10]: L([[0,0,0,0],[3,0,0,0],[0,0,0,0],[3,0,0,0],[0,0,0,0],[3,0,0,0],[0,0,0,0],[3,0,0,0],[0,1,0,0],[3,1,0,0],[0,1,0,0],[3,1,0,0],[0,1,0,0],[3,1,0,0]], 1, true),
  [-11]: L([[1,1,1.25,2],[3,1,1.25,2],[0,1,1.25,2],[2,1,2,2],[3,0,1.25,2],[0,0,1.25,2],[2,0,1.25,2],[1,0,2,2],[2,1,1.25,2],[0,1,1.25,2],[1,1,1.25,2],[3,1,1.25,2]]),
  [-12]: L([[0,0,0,1.3],[1,0,0,1.3],[3,0,.1,1.3],[2,1,2.2,1.3],[0,0,0,1.3],[1,0,0,1.3],[2,0,.1,1.3],[3,1,2.2,1.3]], 2),
  [-13]: L([[0,0,0,1.5],[0,1,2,1.5],[2,0,0,1.5],[2,1,2,1.5],[1,0,0,1.5],[1,1,2.2,1.5],[3,0,0,1.5],[3,1,2,1.5],[0,0,0,1.5],[0,1,2,1.5],[2,0,0,1.5],[2,1,2,1.5],[1,0,0,1.5],[1,1,2.2,1.5]]),
  [-14]: L([[4,0,0,.3]], 24, true),
};

const R = 30;                                    // radio del escudo
const X_BLUE = 'rgb(64,64,255)';                 // merge_color(c_blue, c_white, 0.25)

class Spear {                                    // obj_blockbullet
  constructor(att, site, speedmod, countdown) {
    this.att = att; this.site = site; this.speedmod = speedmod;
    this.countdown = countdown; this.down = 0;
    this.alphoid = 0; this.alpha = 0;
    this.x = 0; this.y = 0; this.hs = 0; this.vs = 0;
    this.alarm = 1; this.dead = false;
  }
  update() {
    if (this.alarm > 0 && --this.alarm === 0) {          // Alarm_0: aparece a 300 px y apunta al centro
      const o = this.att;
      if (this.site === 0) { this.x = o.x - 300; this.y = o.y; }
      if (this.site === 1) { this.x = o.x + 300; this.y = o.y; }
      if (this.site === 2) { this.x = o.x; this.y = o.y + 300; }
      if (this.site === 3) { this.x = o.x; this.y = o.y - 300; }
      const d = Math.hypot(o.x - this.x, o.y - this.y), sp = 8 * this.speedmod;
      this.hs = (o.x - this.x) / d * sp; this.vs = (o.y - this.y) / d * sp;
    }
    if (this.down === 1) { this.countdown--; this.down = 0; }
    if (this.alphoid < 1) this.alphoid += 0.2;
    this.alpha = this.alphoid;
    this.x += this.hs; this.y += this.vs;
  }
  get frame() { return this.countdown <= 1 ? 1 : 0; }  // la próxima en llegar se marca
  bbox() { return spriteBBox('spr_bullet_test', this.x, this.y); }
  draw(ctx) {
    const o = { alpha: this.alpha };
    if (this.hs > 0) drawSprite(ctx, 'spr_bullet_test_l', this.frame, this.x, this.y, o);
    if (this.hs < 0) drawSprite(ctx, 'spr_bullet_test_r', this.frame, this.x, this.y, o);
    if (this.vs > 0) drawSprite(ctx, 'spr_bullet_test_d', this.frame, this.x, this.y, o);
    if (this.vs < 0) drawSprite(ctx, 'spr_bullet_test_u', this.frame, this.x, this.y, o);
  }
}

class ReverseSpear extends Spear {            // obj_blockbullet2: salta por encima del alma y vuelve por el otro lado
  constructor(att, site, speedmod, countdown) {
    super(att, site, speedmod, countdown);
    this.truesite = [1, 0, 3, 2][site]; this.part = 0; this.rating = att.rating;
  }
  update() {
    const wasFresh = this.alarm > 0;
    super.update();
    if (wasFresh) return;
    const o = this.att;
    if (this.part === 0 && ((this.site === 0 && this.x > o.x - 80) || (this.site === 1 && this.x < o.x + 80) ||
                            (this.site === 2 && this.y < o.y + 80) || (this.site === 3 && this.y > o.y - 80))) this.part = 1;
    const rater = 10, r2 = 20;
    if (this.part === 1) {
      this.siner = 0; this.part = 2; this.hs = 0; this.vs = 0; this.remx = this.x; this.remy = this.y;
      this.totalx = 145 + (this.rating > 8 ? this.rating - 8 : 0) * 8;
    }
    if (this.part === 2) {
      this.siner++;
      const a = Math.sin(this.siner * Math.PI / r2) * this.totalx, h = Math.sin(this.siner * Math.PI / rater) * 100;
      if (this.site === 0) { this.x = this.remx + a; this.y = this.remy - h; }
      if (this.site === 1) { this.x = this.remx - a; this.y = this.remy - h; }
      if (this.site === 2) { this.y = this.remy - a; this.x = this.remx - h; }
      if (this.site === 3) { this.y = this.remy + a; this.x = this.remx + h; }
      if (this.siner === rater) {
        this.part = 3;
        if (this.site === 0) this.hs = -8 * this.speedmod;
        if (this.site === 1) this.hs = 8 * this.speedmod;
        if (this.site === 2) this.vs = 8 * this.speedmod;
        if (this.site === 3) this.vs = -8 * this.speedmod;
      }
    }
  }
  bbox() { return spriteBBox('spr_bullet_testx', this.x, this.y); }
  draw(ctx) { drawSprite(ctx, 'spr_bullet_testx_arrow', this.truesite, this.x, this.y, { alpha: this.alpha }); }
}

// ¿El segmento (x1,y1)-(x2,y2) toca el rectángulo? (collision_line, precisión por bbox)
function lineHitsRect(x1, y1, x2, y2, r) {
  let t0 = 0, t1 = 1; const dx = x2 - x1, dy = y2 - y1;
  for (const [p, q] of [[-dx, x1 - r.x1], [dx, r.x2 + 1 - x1], [-dy, y1 - r.y1], [dy, r.y2 + 1 - y1]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
    else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
}
const rectsOverlap = (a, b) => a.x1 <= b.x2 && a.x2 >= b.x1 && a.y1 <= b.y2 && a.y2 >= b.y1;

export class GreenAttack {                       // obj_spearblocker + obj_greenspeargen
  constructor(battle, lesson, rating, dmg) {
    this.b = battle; this.x = 320; this.y = 240;
    this.lesson = lesson; this.dmg = dmg;
    this.dir = 270; this.idealdir = 270; this.neg = 0;
    this.flash = 0; this.buffer = 0; this.finished = false;
    this.spears = [];
    // obj_greenspeargen
    const les = LESSONS[lesson] || LESSONS[-5];
    this.refuse = les.refuse;
    this.list = les.list.map(([d, t, tm, sm]) => [                       // scr_sr
      d === 4 ? Math.floor(Math.random() * 4) : d, t, tm === 0 ? 1 : tm, sm === 0 ? 1 : sm]);
    this.rating = rating; this.spearno = 0; this.genAlarm = 5; this.genDone = false;
  }

  update(input) {
    // --- obj_greenspeargen Alarm_0 ---
    if (!this.genDone && --this.genAlarm <= 0) {
      const [dir, type, timemod, speedmod] = this.list[this.spearno];
      this.genAlarm = this.rating * timemod;
      const alive = this.spears.filter(s => !s.dead).length;
      this.spears.push(new (type === 1 ? ReverseSpear : Spear)(this, dir, speedmod, alive + 1));
      if (++this.spearno >= this.list.length) this.genDone = true;
    }
    for (const s of this.spears) s.update();

    // --- obj_spearblocker Step_0: ¿terminó el turno? ---
    this.buffer++;
    if (this.b.turntimer < 1) this.finished = true;
    if (this.buffer > 30 && this.spears.every(s => s.dead) && this.genDone) this.finished = true;

    // --- obj_spearblocker Draw_0: dirección del escudo según la flecha pulsada ---
    if (input.down) this.idealdir = 90;
    if (input.up) this.idealdir = 270;
    if (input.left) this.idealdir = 0;
    if (input.right) this.idealdir = 180;
    this.rotateShield();
    this.collide();
    this.spears = this.spears.filter(s => !s.dead);
  }

  rotateShield() {                               // giro suave copiado tal cual del juego
    let { dir, idealdir, neg } = this;
    if (dir !== idealdir) {
      if (idealdir === 0 && dir > 180) { neg = 1; dir -= 360; }
      if (dir >= 0 && dir < 90 && idealdir === 270) { neg = 2; dir = 360; }
      if (neg === 0) {
        dir %= 360; const dif = idealdir - dir; dir += dif * 2 / 3;
        if (dir < 0) dir += 360;
        if (Math.abs(dif) < 15) { dir = idealdir; neg = 0; }
      }
      if (neg === 1) {
        dir %= 360; const dif = Math.abs(idealdir - dir); dir += dif * 2 / 3;
        if (Math.abs(Math.abs(idealdir) - Math.abs(dir)) < 15) { dir = idealdir; neg = 0; }
      }
      if (neg === 2) {
        const dif = idealdir - dir; dir += dif * 2 / 3;
        if (Math.abs(Math.abs(idealdir) - Math.abs(dir)) < 15) { dir = idealdir; neg = 0; }
      }
    }
    Object.assign(this, { dir, neg });
  }

  shieldPoints(deg) {
    const t = deg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t), { x, y } = this;
    return [x - c * R - s * R, y + s * R - c * R, x - c * R + s * R, y + s * R + c * R];
  }

  collide() {
    const [ax, ay, bx, by] = this.shieldPoints(this.idealdir);
    const live = this.spears.filter(s => !s.dead && s.alarm === 0);
    const blocked = live.find(s => lineHitsRect(ax, ay, bx, by, s.bbox()));
    if (blocked) {                               // event_user(4): lanza bloqueada
      blocked.dead = true;
      this.spears.forEach(s => s.down = 1);
      this.dir = this.idealdir; this.flash = 5;
      playSound('bell');
    }
    const heart = { x1: this.x - 5, y1: this.y - 5, x2: this.x + 5, y2: this.y + 5 };
    const hit = live.find(s => !s.dead && rectsOverlap(heart, s.bbox()));
    if (hit) {                                   // event_user(5): la lanza llegó al alma
      hit.dead = true;
      this.spears.forEach(s => s.down = 1);
      this.b.hurtPlayer(this.dmg);
    }
  }

  draw(ctx) {
    for (const s of this.spears) s.draw(ctx);
    const t = this.dir * Math.PI / 180, { x, y } = this;
    const [ax, ay, bx, by] = this.shieldPoints(this.dir);
    ctx.lineCap = 'butt';
    ctx.lineWidth = 3;
    ctx.strokeStyle = this.flash < 2 ? X_BLUE : '#f00';
    this.flash--;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    const t2 = t - 0.2;
    ctx.strokeStyle = X_BLUE;
    ctx.beginPath(); ctx.moveTo(ax, ay);
    ctx.lineTo(x + (-Math.cos(t2) * R) / 2 + (Math.sin(t2) * R) / 2, y + (Math.sin(t2) * R) / 2 + (Math.cos(t2) * R) / 2);
    ctx.stroke();
    // círculo verde con 12 lados (draw_set_circle_precision(12))
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgb(0,128,0)';
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI * 2; ctx.lineTo(x + 0.5 + Math.cos(a) * R, y + 0.5 + Math.sin(a) * R); }
    ctx.stroke();
  }
}
