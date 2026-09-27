import { drawSprite, drawText, playSound, FNT } from './assets.js';
import { rnd, choose, gmMove } from './gm.js';

// ============================================================================
//  Cuerpo de Mettaton EX (obj_mettb_body): piernas, brazos, torso, cara y corazón.
//  Baila (cambia de pose) mientras eliges en el menú; se le caen los brazos y las piernas.
// ============================================================================
const LEG = { 0: ['spr_mettleg1', -14, 10, 36], 1: ['spr_mettleg2', -16, 6, 8], 2: ['spr_mettleg3', -10, 14, 60],
              3: ['spr_mettleg4', -10, 14, 30], 4: ['spr_mettleg5', -18, 2, 42] };
const ARM = i => 'spr_mettarm' + (i + 1);

class FallLimb {                                   // obj_fallofflimb: el miembro cae girando
  constructor(spr, x, y, xs) {
    this.spr = spr; this.x = x; this.y = y; this.xs = xs; this.ang = 0;
    this.grav = 0.3 + rnd(0.1); this.gdir = 270; this.hs = x < 300 ? -2 : 2; this.vs = 0; this.aa = x < 300 ? 2 : -2;
  }
  update(b) {
    this.ang += this.aa; gmMove(this);
    if (this.y > 520) { this.dead = true; if (!b.shaker) { playSound('impact'); b.shake = 3; } }
  }
  draw(ctx) { drawSprite(ctx, this.spr, 0, this.x, this.y, { xs: this.xs, ys: 2, rot: this.ang }); }
}
class Exhaust {                                    // obj_planeexhaust: humo de los muñones de los brazos
  constructor(x, y, dir) {
    this.x = x; this.y = y; this.size = 2; this.siner = 0; this.alpha = 1; this.ang = rnd(360); this.f = 0;
    this.hs = (-2 - rnd(1)) * dir; this.vs = 0; this.grav = 0.2; this.gdir = 90;
  }
  update() {
    this.ang += 1; this.size += 0.05; this.siner++;
    this.x += Math.sin(this.siner / 2); this.y += Math.cos(this.siner / 2);
    if (this.siner > 7) this.alpha -= 0.04;
    if (this.alpha < 0.05) this.dead = true;
    gmMove(this); this.f += 0.2;
  }
  draw(ctx) { drawSprite(ctx, 'spr_tsunderplanecloud', this.f, this.x, this.y, { xs: this.size, ys: this.size, rot: this.ang, alpha: this.alpha }); }
}

export class MettBody {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.legl = 0; this.legr = 0; this.arml = 0; this.armr = 0; this.leglh = 0; this.legrh = 0; this.legh = 0;
    this.siner = 0; this.lsin = 0; this.rsin = 0; this.faceno = 0;
    this.hurt = 2; this.hurtface = 0; this.alpha = 1; this.sineron = 1; this.pause = 0;
    this.dancewait = 25; this.alarm5 = 25 * 5; this.dsf = 0;
    this.fadewhite = 0; this.whiteval = 0; this.bodyopen = 0; this.bodyimg = 0; this.heartdead = 0;
    this.dance = 1; this.alarm6 = 5; this.noarm = 0; this.noleg = 0; this.endface = 0; this.face_set = 0; this.faceemotion = 0;
    this.limbs = []; this.puffs = [];
    this.shakeX = 0;
  }
  danceMove() {                                    // event_user(0): pose al azar
    this.legr = Math.floor(rnd(5)); this.legl = Math.floor(rnd(5));
    this.arml = Math.floor(rnd(8)); this.armr = Math.floor(rnd(8)); this.faceno = Math.floor(rnd(9));
  }
  open() {                                         // event_user(1): pose neutra y el pecho se abre (sale el corazón)
    this.legl = this.legr = this.arml = this.armr = this.leglh = this.legrh = 0;
    this.siner = this.lsin = this.rsin = 0; this.faceno = 0; this.bodyopen = 1;
  }
  armX(side) { return this.x + (side ? 110 : 36) + Math.sin(this.siner / 3.5); }
  armY() { return this.y - this.legh + 80 + Math.cos(this.siner / 3.5) * 2; }
  dropArms() {                                     // event_user(2)
    if (this.noarm) return; this.noarm = 1;
    this.limbs.push(new FallLimb(ARM(this.arml), this.armX(0), this.armY(), 2), new FallLimb(ARM(this.armr), this.armX(1), this.armY(), -2));
  }
  dropLegs() {                                     // event_user(3)
    if (this.noleg) return; this.dance = 0; this.noleg = 1;
    const yy = s => this.y + 120 + s - this.legh - Math.sin(this.siner / 2) * 0.05;
    this.limbs.push(new FallLimb(LEG[this.legl][0], this.x + 90 - LEG[this.legl][1] - 32, yy(LEG[this.legl][2]), 2),
                    new FallLimb(LEG[this.legr][0], this.x + 90 + LEG[this.legr][1], yy(LEG[this.legr][2]), -2));
  }

  update(b, menuTime) {
    if (--this.alarm5 <= 0) { this.alarm5 = this.dancewait; if (menuTime && this.dance === 1) this.danceMove(); }   // Alarm_5
    if (--this.alarm6 <= 0) {                      // Alarm_6: humo si ya no tiene brazos
      if (this.noarm) this.puffs.push(new Exhaust(this.armX(0), this.armY(), 1), new Exhaust(this.armX(1), this.armY(), -1));
      this.alarm6 = 10;
    }
    for (const l of this.limbs) l.update(b); this.limbs = this.limbs.filter(l => !l.dead);
    for (const p of this.puffs) p.update(); this.puffs = this.puffs.filter(p => !p.dead);
  }

  // Draw_0 de obj_mettb_body, casi línea por línea
  draw(ctx, b) {
    for (const p of this.puffs) p.draw(ctx);
    if (this.sineron === 1) this.y = b.box.t - 136;
    const L = LEG[this.legl], Rr = LEG[this.legr];
    if (!this.noleg) { this.leglh = L[3]; this.legrh = Rr[3]; }
    let offangle = 0;
    if ((this.leglh > 10 || this.legrh > 10) && this.sineron === 1) this.siner++;
    if (this.sineron === 1) { this.rsin++; this.lsin++; }
    if (this.leglh > this.legrh) { this.legh = this.leglh * 2; this.lsin = 0; } else { this.legh = this.legrh * 2; this.rsin = 0; }
    if (Math.abs(this.leglh - this.legrh) < 5) { this.lsin = 0; this.rsin = 0; }
    if (this.noleg) this.legh = Math.max(6, this.legh);
    const ds1 = rnd(this.dsf * 2) - this.dsf, ds2 = rnd(this.dsf * 2) - this.dsf;
    const x = this.x + this.shakeX, y = this.y, legh = this.legh, sn = this.siner;
    const o = { color: null, alpha: this.alpha };
    if (!this.noleg) {
      drawSprite(ctx, Rr[0], 0, x + 90 + Rr[1], y + 120 + Rr[2] - legh - Math.sin(sn / 2) * 0.05, { ...o, xs: 2, ys: 2 - Math.sin(sn / 3.5) * 0.05, rot: Math.sin(this.rsin / 7) * 10 - offangle });
      drawSprite(ctx, L[0], 0, x + 90 - L[1] - 32, y + 120 + L[2] - legh - Math.sin(sn / 2) * 0.05, { ...o, xs: -2, ys: 2 - Math.sin(sn / 3.5) * 0.05, rot: Math.sin(this.lsin / 7) * 10 });
    }
    const ax = s => x + (s ? 110 : 36) + Math.sin(sn / 3.5), ay = y - legh + 80 + Math.cos(sn / 3.5) * 2;
    if (!this.noarm) {
      if (this.arml !== 5) drawSprite(ctx, ARM(this.arml), 0, ax(0), ay, { ...o, xs: 2, ys: 2 });
      if (this.armr !== 5) drawSprite(ctx, ARM(this.armr), 0, ax(1), ay, { ...o, xs: -2, ys: 2 });
    }
    if (this.bodyopen === 1) { if (this.bodyimg < 5) this.bodyimg += 0.25; } else if (this.bodyimg > 0) this.bodyimg -= 0.25;
    const bx = x + 72 + Math.sin(sn / 3.5) + ds1, by = y - legh + 134 + Math.cos(sn / 3.5) * 2 + ds2;
    drawSprite(ctx, 'spr_mettb_upperbody', Math.floor(this.bodyimg), bx, by, { ...o, xs: 2, ys: 2 });
    if (!b.bossHeart && !b.heartBurst && !this.heartdead) drawSprite(ctx, 'spr_mettb_upperbodyheart', 0, bx + 66, by + 108, { ...o, xs: 2, ys: 2 });
    const fy = y + 40 - legh + Math.cos(sn / 3.5) * 3;
    if (this.endface === 0) {
      if (this.hurt === 0 && this.face_set === 0) drawSprite(ctx, 'spr_mettface1', this.faceno, x + 68, fy, { ...o, xs: 2, ys: 2 });
      if (this.hurt === 0 && this.face_set === 1) drawSprite(ctx, 'spr_mettface_defeated', this.faceemotion, x + 68 - ds1, fy - ds2, { ...o, xs: 2, ys: 2 });
      if (this.hurt === 1) drawSprite(ctx, 'spr_mettface_hurt', this.hurtface, x + 68, fy, { ...o, xs: 2, ys: 2 });
      if (this.hurt === 2) drawSprite(ctx, 'spr_mettface_defeated', this.faceemotion, x + 68 - ds1, fy - ds2, { ...o, xs: 2, ys: 2 });
    } else drawSprite(ctx, 'spr_mettface_general', this.faceemotion, x + 68, fy, { ...o, xs: 2, ys: 2 });
    if (!this.noarm) {                             // el brazo 6 (índice 5) va delante de la cara
      if (this.arml === 5) drawSprite(ctx, ARM(this.arml), 0, x + 42 + Math.sin(sn / 3.5), ay, { ...o, xs: 2, ys: 2 });
      if (this.armr === 5) drawSprite(ctx, ARM(this.armr), 0, ax(1), ay, { ...o, xs: -2, ys: 2 });
    }
    if (this.pause === 1 && this.hurt === 0) { this.hurt = 1; this.hurtface = choose(0, 1); }
    if (this.pause === 2 && this.hurt === 0) { this.hurt = 1; this.hurtface = 2; }
    if (this.pause === 0) this.hurt = 0;
    if (this.noleg) {                              // sin piernas va bajando hasta el suelo
      this.legrh = this.legrh > 6 ? this.legrh - 4 : 6; this.leglh = this.leglh > 6 ? this.leglh - 4 : 6;
      this.legh = this.legh > 6 ? this.legh - 4 : 6;
    }
    for (const l of this.limbs) l.draw(ctx);
  }
  // Pantallazo blanco del final (fadewhite): se dibuja encima de todo
  drawFade(ctx, b) {
    if (this.fadewhite !== 1) return;
    this.whiteval += 0.2;
    ctx.save(); ctx.globalAlpha = Math.min(1, this.whiteval); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 640, 480);
    if (this.whiteval > 10) { ctx.globalAlpha = Math.min(1, -1 + this.whiteval / 10); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 640, 480); }
    ctx.restore();
    if (Math.abs(this.whiteval - 10) < 0.01 && b.killedMett) playSound('vaporized');
    if (this.whiteval >= 44 && !this.done) { this.done = true; b.finish(); }
  }
}

// ============================================================================
//  obj_ratingsmaster: RATINGS arriba a la izquierda, con la gráfica y la lista de puntos
// ============================================================================
const RQ_NAMES = { 1: 'Violence', 2: 'Disappoint', 3: 'Justice', 4: 'Action', 9: 'OnBrandFood', 10: 'OnBrandFood', 11: 'Dramatic', 12: 'Writing' };
export class Ratings {
  constructor(b) {
    this.b = b; this.x = 20; this.y = 10; this.ratings = 4000;
    this.rq = [...Array(6)].map(() => ({ t: '', v: 0, s: 900 }));
    const thisi = Math.floor(rnd(8));
    this.rp = [...Array(10)].map((_, i) => i === thisi ? this.ratings : 4000 - rnd(500));
    this.alarm5 = 6; this.accu = 0; this.typeuse = Array(15).fill(0);
    this.boastmode = 0; this.siner = 0; this.heel = 0; this.checkhp = b.player.hp;
    this.timeloss = 0; this.o_o = 0; this.o_ob = 0; this.essay = 0; this.active = 1;
  }
  add(curtype) {                                   // event_user(0): nueva entrada en la lista
    const u = this.typeuse[curtype] || 0;
    let v = 0;
    if (curtype === 1) v = [50, 25, 20, 15][u] ?? 10;
    if (curtype === 2) { v = u >= 20 ? -1 : u >= 5 ? -50 : -100; this.boastmode = 0; }
    if (curtype === 3) v = 100;
    if (curtype === 4) v = [300, 200, 150, 100][u] ?? 50;
    if (curtype === 11) {
      const p = this.b.player; v = 100;
      if (p.hp < p.maxHp / 1.5) v = 150; if (p.hp < p.maxHp / 2) v = 250; if (p.hp < p.maxHp / 4) v = 400; if (p.hp < 4) v = 500; if (p.hp === 1) v = 600;
    }
    if (curtype === 9) v = u === 0 ? 300 : 200;                       // Legendary Hero
    if (curtype === 10) v = u === 0 ? 500 : 300;                      // Glamburger
    if (curtype === 12) v = this.essay;
    this.typeuse[curtype] = u + 1;
    if (this.b.turns >= 20 && v > 0) v *= 2;
    this.rq.pop(); this.rq.unshift({ t: RQ_NAMES[curtype], v, s: 0 });
    this.ratings += v;
  }
  update() {
    const b = this.b;
    if (--this.alarm5 <= 0) {                      // Alarm_5: la gráfica se desplaza
      this.rp.pop(); this.rp.unshift(this.ratings - rnd(this.ratings / 2));
      if (this.accu === 6) this.rp[0] = this.ratings;
      if (++this.accu === 10) this.accu = 0;
      this.alarm5 = 6;
    }
    if (!this.active) return;
    const hp = b.player.hp;
    if (this.checkhp > hp) {                       // te han golpeado
      let c = 1;
      if (this.boastmode === 1) { c = 2; this.boastmode = 0; }
      if (this.heel === 1) c = 3;
      this.add(c);
    }
    this.checkhp = hp;
    const attacking = b.state === 'mAttack';
    if (this.boastmode === 1) {                    // Boast: suben mientras no te golpeen
      if (b.turntimer > 0 && attacking) {
        this.o_ob = this.o_ob ? 0 : 1;
        this.ratings += this.o_ob ? 2 : 1;
        if (b.turns >= 20) this.ratings += 2;
      }
      if (b.menuTime()) this.boastmode = 0;
    }
    if (this.heel === 1 && b.menuTime()) this.heel = 0;
    if (b.menuTime()) {                            // en el menú el público se aburre: -1 cada 4 frames
      this.timeloss++; if (++this.o_o > 3) this.o_o = 0;
      if (this.timeloss < 4000 && this.o_o === 0) this.ratings--;
    }
  }
  draw(ctx) {
    this.siner++;
    if (!this.active) return;
    const { x, y } = this, s = this.siner;
    ctx.save(); ctx.translate(x + 20 + Math.sin(s / 4), y + Math.cos(s / 4)); ctx.scale(2 - Math.sin(s / 4) * 0.05, 2 - Math.cos(s / 4) * 0.05);
    drawText(ctx, 'fnt_maintext', 'RATINGS ' + Math.round(this.ratings), 0, 0);
    ctx.restore();
    for (let i = 0; i < 6; i++) {
      const q = this.rq[i];
      q.s += (i + 2) / 2;
      const val = q.v >= 0 ? '+' + q.v : String(q.v), col = q.v >= 0 ? '#0f0' : '#f00';
      ctx.save(); if (q.s > 120) ctx.globalAlpha = Math.max(0, (170 - q.s) / 50);
      const w = q.t ? textWidth(q.t) : 0, sx = w > 70 ? 70 / w : 1, spos = Math.round(130 - w * sx);
      const xx = q.s < 10 ? Math.cos(q.s) * 21 / (q.s * 2 + 1) : 0;
      if (q.t) {
        ctx.save(); ctx.translate(x + spos + xx, y + 140 + i * 12); ctx.scale(sx, 1);
        drawText(ctx, 'fnt_maintext', q.t, 0, 0, { color: col }); ctx.restore();
        drawText(ctx, 'fnt_maintext', val, x + 130 + xx, y + 140 + i * 12, { color: col });
      }
      ctx.restore();
    }
    ctx.fillStyle = '#fff'; ctx.fillRect(x + 9, y + 40, 3, 91); ctx.fillRect(x + 9, y + 129, 172, 3);
    ctx.fillStyle = '#ff0'; ctx.fillRect(x + 10, y + 55, 171, 1);
    const ry = Math.round(this.ratings * 0.0075);
    ctx.fillStyle = '#0ff'; ctx.fillRect(x + 10, y + 130 - ry, 171, 1);
    ctx.strokeStyle = '#f0f'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      ctx.moveTo(x + 10 + i * 20, y + 130 - this.rp[i] * 0.0075); ctx.lineTo(x + 30 + i * 20, y + 130 - this.rp[i + 1] * 0.0075);
    }
    ctx.stroke();
  }
}
function textWidth(s) { const f = FNT.fnt_maintext; let w = 0; for (const ch of s) { const g = f.glyphs[ch]; w += g ? g[4] : 6; } return w; }
