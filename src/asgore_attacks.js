// ============================================================================
//  Ataques de Asgore (generadores y balas), traducidos de obj_asgoreattackgen, obj_helixfiregen,
//  obj_sinefire_asghelix, obj_sinefiregen_asg_lv2_usethis / _asglv3, obj_sidedam, obj_sided_fire,
//  obj_handbulletgen, obj_randomhandgen, obj_handbullet_new, obj_genericfire, obj_cfiregen, obj_cfire,
//  obj_firestormgen, obj_asgore_spearswipegen, obj_asgore_spearswipe, obj_eyeflash y obj_flasher.
//  Todas las balas son hijas de obj_asgorebulparent: hacen daño = ATQ actual de Asgore (curatk) y
//  desaparecen cuando se acaba el turno (global.turntimer < 0).
// ============================================================================
import { drawSprite, playSound, spriteBBox, VOLUME } from './assets.js';
import { rnd, choose, gmMove, ldx, ldy, pdir, setSpeedDir, rotBBox, hit } from './gm.js';

// Colores del juego (BGR de GameMaker): 16754964 = azul claro, 4235519 = naranja
export const BLUE = 'rgb(20,169,255)', ORANGE = 'rgb(255,160,64)';
const TYPE_COLOR = { 0: 'rgb(255,0,0)', 1: BLUE, 2: ORANGE };
const near1 = v => Math.abs(v - 1) < 1e-5;                  // == de GameMaker (con epsilon)

function sfx(name, vol = 1, pitch = 1) {                     // caster_play(snd, volumen, tono)
  const s = playSound(name, { volume: VOLUME.sfx * vol });
  if (s && pitch !== 1) s.playbackRate.value = pitch;
}

// ---------------------------------------------------------------- instancia genérica (movimiento de GameMaker)
class Obj {
  constructor(x, y, spr = null) {
    this.x = x; this.y = y; this.spr = spr; this.hs = 0; this.vs = 0; this.grav = 0; this.gdir = 270; this.friction = 0;
    this.frame = 0; this.fspeed = 1; this.xs = 1; this.ys = 1; this.angle = 0; this.alpha = 1; this.color = null;
    this.dead = false; this.hurts = false; this.clip = false; this.alarm = [];
  }
  update(A, inp) {
    for (let i = 0; i < this.alarm.length; i++) if (this.alarm[i] > 0 && --this.alarm[i] === 0) this['alarm' + i](A);
    if (this.dead) return;
    this.step(A, inp);
    if (this.dead) return;
    gmMove(this);
    this.endStep(A, inp);
    this.frame += this.fspeed;
  }
  step() {} endStep() {}
  bbox() { return rotBBox(this.spr, this.x, this.y, this.angle, this.xs, this.ys); }
  outside() { const b = this.bbox(); return b.x2 < 0 || b.x1 > 640 || b.y2 < 0 || b.y1 > 480; }   // Other_0 (fuera de la sala)
  draw(ctx) { if (this.spr) drawSprite(ctx, this.spr, this.frame, this.x, this.y, { xs: this.xs, ys: this.ys, rot: this.angle, alpha: this.alpha, color: this.color }); }
}

// obj_genericfire: fuego que sigue su velocidad; se destruye al salir de la sala
class Fire extends Obj {
  constructor(x, y, sc = 1) { super(x, y, 'spr_firebullet_center_generous'); this.xs = this.ys = sc; this.hurts = true; }
  endStep() { if (this.outside()) this.dead = true; }
}

// obj_sinefire_asghelix: cae y oscila de lado a lado (x += sin(s/sv)*sf)
class SineFire extends Obj {
  constructor(x, y, s, sf, sv, vs) { super(x, y, 'spr_firebullet_center_generous'); this.s = s; this.sf = sf; this.sv = sv; this.vs = vs; this.hurts = true; }
  step() { this.s++; this.x += Math.sin(this.s / this.sv) * this.sf; if (this.y > 480 + 100) this.dead = true; }
}

// obj_helixfiregen: cada 2 frames suelta dos fuegos en hélice (16 veces)
class HelixGen extends Obj {
  constructor(x, y) {
    super(x, y); this.mys = 0; this.mysadd = 0.1; this.mysv = 4; this.mysf = 4; this.alarm[0] = 1; this.count = 0;
    this.selfspeed = rnd(1.5); this.selfspeed2 = this.selfspeed - 0.1 + rnd(0.1);
  }
  alarm0(A) {
    this.mys += this.mysadd;
    A.add(new SineFire(this.x, this.y, this.mys, this.mysf, this.mysv, 5.5 + this.selfspeed));
    A.add(new SineFire(this.x, this.y, this.mys, this.mysf, -this.mysv, 5.5 + this.selfspeed2));
    this.alarm[0] = 2;
    if (++this.count > 15) this.dead = true;
  }
}

// obj_asgoreattackgen: 2 filas de 4 hélices que caen desde arriba (t = 1 o 2)
class HelixRain extends Obj {
  constructor(t) { super(0, 0); this.t = t; this.alarm[0] = 1; }
  alarm0(A) {
    const [gil, gir, giu] = A.ib(), giw = gir - gil;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) {
      const x = gil + j * (giw / 4) + 20 - rnd(10) + 10 * j;
      if (this.t === 1) { const g = A.add(new HelixGen(x, giu - 80 - 360 * i - rnd(90))); g.vs = rnd(0.25) - rnd(0.25); }
      else { const g = A.add(new HelixGen(x, giu - 80 - 340 * i - rnd(90))); g.mysf = 5.5; g.mysv = 3.5; g.mys = rnd(2); g.vs = rnd(2) - rnd(2); }
    }
    this.dead = true;
  }
}

// obj_sinefiregen_asg_lv2_usethis / obj_sinefiregen_asglv3: columna de fuego ondulante + avisos laterales (obj_sidedam)
const SINE = { 2: { ds: 1.5, sf: 3.5, vs: 4, sv: 10, rate: 5, dam: 50, len: 75, wait: 35 },
               3: { ds: 2, sf: 5, vs: 5, sv: 9, rate: 6, dam: 40, len: 60, wait: 25 } };
class SineGen extends Obj {
  constructor(lv) { super(0, 0); this.P = SINE[lv]; this.alarm[0] = 1; this.side = 0; this.off = 0; this.alarm[1] = 30; this.s = rnd(360); }
  alarm1(A) {                                    // aviso en el lado donde está el alma
    const h = A.b.heart;
    A.add(new SideDam(h.x + 6 < 320 ? 0 : 1, this.P.len, this.P.wait));
    this.alarm[1] = this.P.dam;
  }
  alarm0(A) {
    const P = this.P, [l, r] = A.ib();
    this.s += P.ds;
    const f = A.add(new SineFire(l + (r - l) / 2 + Math.cos(this.off / 6) * 20, 130 + Math.sin(this.off / 5) * 12 + Math.sin(this.off / 5) * 12, this.s, P.sf, 5, P.vs));
    this.side++;
    if (this.side >= 4) this.side = choose(-2, -1);
    if (this.side <= 1) f.sv = P.sv;
    if (this.side >= 1) f.sv = -P.sv;
    this.alarm[0] = P.rate;
    this.off++;
    f.vs += Math.sin(this.off / 6) * 0.2;
  }
}

// obj_sidedam: "!" parpadeando y un rectángulo rojo en un lado de la caja; luego salen fuegos por arriba y por abajo
class SideDam extends Obj {
  constructor(side, len, wait) { super(0, 0); this.side = side; this.len = len; this.wait = wait; this.con = 0; this.eo = 0; this.showEo = -1; }
  alarm4() { this.con++; }
  step(A) {                                      // (en el juego todo esto está en el Draw)
    if (this.con === 0) { this.con = 1; this.alarm[4] = this.wait; }
    this.showEo = -1;
    if (this.con < 2) {
      if (this.eo === 1) playSound('asg_credit');
      this.showEo = this.eo;
      if (++this.eo > 2) this.eo = 0;
    }
    if (this.con === 2) { this.con = 3; playSound('break2'); this.alarm[4] = 14; }
    if (this.con === 3) {
      const [l, r] = A.ib();
      for (let i = 0; i < 4; i++) A.add(new SidedFire(A, this.side === 0 ? l + rnd(this.len - 6) - 6 : r - rnd(this.len + 6) - 8));
    }
    if (this.con === 4) this.dead = true;
  }
  draw(ctx, A) {
    if (this.showEo < 0) return;
    const [l, r, t, b] = A.ib(), len = this.len;
    drawSprite(ctx, 'spr_exclamationpoint', this.showEo, this.side === 0 ? l + 12 : r - 38, t + 40);
    ctx.strokeStyle = this.side === 0 ? '#f00' : ['#f00', '#ff0', '#000'][this.showEo]; ctx.lineWidth = 1;   // el lado derecho usa el color del "!" 
    const rect = (x1, y1, x2, y2) => ctx.strokeRect(Math.min(x1, x2) + 0.5, Math.min(y1, y2) + 0.5, Math.abs(x2 - x1), Math.abs(y2 - y1));
    if (this.side === 0) { rect(l + 5, t + 5, l + len, b - 5); rect(l + 6, t + 6, l + len - 1, b - 4); }
    else { rect(r - 5, t + 5, r - len, b - 5); rect(r - 4, t + 4, r - len + 1, b - 4); }
  }
}

// obj_sided_fire: sube o baja rápido por el lado marcado (solo se ve dentro de la caja)
class SidedFire extends Obj {
  constructor(A, x) {
    super(x, 0, 'spr_firebullet_noc'); this.hurts = true; this.clip = true;
    const [, , t, b] = A.ib();
    this.side = choose(0, 1);
    if (this.side === 0) { this.y = t - 16 - 5; this.vs = 9 + rnd(0.5); }
    else { this.vs = -9 - rnd(0.5); this.y = b + 5; }
    this.hs = rnd(0.5) * choose(1, -1);
  }
  step(A) {
    const [, , t, b] = A.ib();
    if (this.y > b && this.vs > 0) this.dead = true;
    if (this.y < t - 16 && this.vs < 0) this.dead = true;
  }
}

// obj_handbullet_new: una mano que cruza la pantalla dejando fuegos; al salir, los fuegos van hacia el alma
const HAND_SPR = { 1: 'spr_handbullet_old_u', 2: 'spr_handbullet_old_d', 3: 'spr_handbullet_old_r', 4: 'spr_handbullet_old_l', 5: 'spr_handbullet_old_u' };
class Hand extends Obj {
  constructor(x, y, type) { super(x, y, 'spr_handbullet_old_r'); this.type = type; this.alarm[0] = 5; this.c = []; this.xs = this.ys = 2; this.alarm[1] = 1; this.alpha = 0; this.moved = 0; this.fspeed = 0; }
  alarm1() {
    const t = this.type; this.spr = HAND_SPR[t];
    if (t === 1) { this.hs = 8; this.vs = 3; this.grav = 0.1; this.gdir = 90; }
    if (t === 2) { this.hs = -8; this.vs = -3; this.grav = -0.1; this.gdir = 90; }
    if (t === 3) this.vs = 6;
    if (t === 4) this.vs = -6;
    if (t === 5) this.hs = 8;
  }
  alarm0(A) {
    if (near1(this.alpha)) this.c.push(A.add(new Fire(this.x + 30, this.y + 30, 2)));
    this.alarm[0] = 4;
  }
  step(A) {
    const [l, r, t, b] = A.ib();
    if (this.hs > 0 && this.x > r + 20) this.user0(A);
    if (this.hs < 0 && this.x < l - 100) this.user0(A);
    if (this.vs < 0 && this.y < t - 100) this.user0(A);
    if (this.vs > 0 && this.y > b + 20) this.user0(A);
    if (this.alpha < 1) this.alpha += 0.2;
  }
  user0(A) {                                     // Other_10
    if (this.moved === 0) {
      this.alarm[0] = 0;
      const h = A.b.heart;
      for (const c of this.c) { setSpeedDir(c, 2, pdir(c.x, c.y, h.x + 6, h.y + 6)); c.friction = -0.2; }
      this.moved = 1;
    }
    this.alpha -= 0.2;
    if (this.alpha < -0.4) this.dead = true;
  }
}
function makeHand(A, tt) {                       // posiciones de obj_handbulletgen / obj_randomhandgen
  const [l, r, t, b] = A.ib();
  if (tt === 1) A.add(new Hand(104, 146, 1));
  if (tt === 2) A.add(new Hand(440, 382, 2));
  if (tt === 3) A.add(new Hand(r - 50, t - 90, 3));
  if (tt === 4) A.add(new Hand(l - 10, b + 10, 4));
}
class HandGen extends Obj {                      // obj_handbulletgen (type 1: el primer turno)
  constructor() { super(0, 0); this.alarm[0] = 1; }
  alarm0(A) { A.add(new Hand(440, 352, 2)); A.add(new Hand(104, 176, 1)); this.dead = true; }
}
class RandomHandGen extends Obj {                // obj_randomhandgen: una mano al azar cada "factor" frames
  constructor(factor) { super(0, 0); this.factor = factor; this.alarm[0] = 1; }
  alarm0(A) { this.alarm[0] = this.factor; makeHand(A, choose(1, 2, 3, 4)); }
}

// obj_cfiregen + obj_cfire: círculos de fuego que se cierran sobre el centro de la caja (con un hueco)
const CFIRE = [{ n: 36, rs: 4, as: 0, rate: 35 }, { n: 36, rs: 6, as: 2, rate: 30 }, { n: 36, rs: 4, as: 4, rate: 30 }, { n: 33, rs: 6, as: 6, rate: 25 }];
class CFire extends Obj {
  constructor(A, ang, rspeed, r, angspeed) {
    super(0, 0, 'spr_firebullet_center_generous'); this.hurts = true;
    const [l, rr, t, b] = A.ib();
    this.cx = l + (rr - l) / 2; this.cy = t + (b - t) / 2;
    this.ang = ang; this.rspeed = rspeed; this.r = r; this.angspeed = angspeed;
  }
  step() {
    this.r -= this.rspeed; this.ang += this.angspeed;
    if (this.r <= 0.5) { this.dead = true; return; }
    this.x = this.cx + ldx(this.r, this.ang); this.y = this.cy + ldy(this.r, this.ang);
  }
}
class CFireGen extends Obj {
  constructor(diff) { super(0, 0); this.diff = diff; this.alarm[0] = 10; }
  alarm0(A) {
    const P = CFIRE[this.diff], choseang = rnd(360), angspeed = P.as ? -P.as + rnd(P.as * 2) : 0;
    for (let i = 0; i < P.n; i++) A.add(new CFire(A, choseang + i * 8, P.rs, 300, angspeed));
    this.alarm[0] = P.rate;
  }
}

// obj_firestormgen: recorre la parte de arriba soltando anillos de fuego; oscurece la pantalla
const STORM = { 1: { hs: 5, add: 1, amt: 20, da: 0, sp: 3, fr: -0.15, rate: 8 }, 2: { hs: 6, add: 1.2, amt: 22, da: 1.5, sp: 3.5, fr: -0.17, rate: 7 },
                3: { hs: 8, add: 1.2, amt: 22, da: 2, sp: 12, fr: 0.06, rate: 6 } };
class StormGen extends Obj {
  constructor(lv) { super(0, 0); this.P = STORM[lv]; this.amount = 0; this.maxamount = 12; this.alarm[0] = 1; this.baseang = rnd(100); this.dr = 0; }
  alarm0(A) {
    const P = this.P;
    this.hs = P.hs; this.amount += P.add; this.baseang += P.da;
    for (let i = 0; i < P.amt; i++) {
      const f = A.add(new Fire(this.x, this.y, 2));
      setSpeedDir(f, P.sp, i * (360 / P.amt) + this.baseang); f.friction = P.fr;
    }
    this.alarm[0] = P.rate;
    if (this.amount > this.maxamount) this.alarm[0] = 0;
  }
  step(A) {                                      // Draw_0: capa negra que aparece y se va al final del turno
    if (this.dr < 0.5) this.dr += 0.1;
    if (A.b.turntimer < 6) this.dr -= 0.2;
    if (A.b.turntimer <= 0) this.dead = true;
  }
  drawDark(ctx) { if (this.dr > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, this.dr)})`; ctx.fillRect(0, 0, 640, 480); } }
}

// ---------------------------------------------------------------- tridente: los ojos avisan el color y luego barre la caja
// obj_asgore_spearswipegen: Asgore se vuelve una silueta y sus ojos destellan (azul = no te muevas, naranja = muévete)
const SWIPE = [{ flash: 12, tamt: 1, amt: 1, cut: 0.5, wait: 2, init: 5 }, { flash: 9, tamt: 2, amt: 2, cut: 0.5, wait: 0, init: 8 },
               { flash: 7, tamt: 2, amt: 2, cut: 1, wait: 3, init: 4 }, { flash: 7, tamt: 3, amt: 3, cut: 1, wait: 3, init: 3 }];
class EyeFlash extends Obj {                     // obj_eyeflash: se destruye al acabar la animación
  constructor(x, y, color, serious) { super(x, y, serious ? 'spr_asgore_eyeflash_serious' : 'spr_asgore_eyeflash'); this.xs = this.ys = 2; this.color = color; this.fspeed = serious ? 0.5 : 1; }
  endStep() { if (this.frame + this.fspeed >= 6) this.dead = true; }
}
class Flasher extends Obj {                      // obj_flasher: destello blanco de toda la pantalla
  constructor() { super(0, 0); this.alpha = 0; this.alarm[0] = 2; this.active = 0; this.top = true; }
  alarm0() { this.alpha = 1; this.active = 1; }
  step() { if (this.active) { this.alpha -= 0.1; if (this.alpha < 0.02) this.dead = true; } }
  draw(ctx) { if (this.alpha > 0) { ctx.fillStyle = `rgba(255,255,255,${this.alpha})`; ctx.fillRect(0, 0, 640, 480); } }
}
class SwipeGen extends Obj {
  constructor(A, diff) {
    const bd = A.b.abody;
    super(bd.x - 50, bd.y, 'spr_asgore_flashsilhouette'); this.xs = this.ys = 2; this.fspeed = 0;
    this.diff = diff; this.typeno = 0; this.typeamt = 2; this.flashtimer = 7; this.on = 0;
    this.type = [1, choose(1, 2), choose(1, 2), choose(1, 2), choose(1, 2), choose(1, 2), choose(1, 2)];
    this.alarm[3] = 30;
    playSound('noise'); A.add(new Flasher());
    A.b.bodyHidden = true;                       // obj_asgoreb_body y obj_asgorespear invisibles
  }
  alarm3() {
    for (let i = 0; i < 6; i++) this.type[i] = choose(1, 2);
    const P = SWIPE[this.diff]; this.flashtimer = P.flash; this.typeamt = P.tamt;
    this.alarm[1] = 1; this.typeno = 0;
  }
  alarm1(A) {
    this.eye(A, this.on === 0 ? 146 : 172); this.on = 1 - this.on;          // Other_11 / Other_12 (un ojo y luego el otro)
    if (this.typeno < this.typeamt) { this.alarm[1] = this.flashtimer; sfx('asg_flash', 0.5, 1.05); }
    else { sfx('asg_flash', 0.6, 0.8); this.alarm[2] = this.flashtimer + 15; }
    this.typeno++;
  }
  eye(A, ex) { A.add(new EyeFlash(this.x + ex, this.y + 56, TYPE_COLOR[this.type[this.typeno]], this.typeno >= this.typeamt)); }
  alarm2(A) { A.add(new Swipe(this.x, this.y, this.type.slice(0, this.typeamt + 1), SWIPE[this.diff])); this.dead = true; }
}
// obj_asgore_spearswipe: cada barrido comprueba (una sola vez, en el frame 5) si te moviste
class Swipe extends Obj {
  constructor(x, y, type, P) {
    super(x + 180, y, 'spr_asgore_swipe_nospear'); this.type = type;
    this.amt = P.amt; this.cutspeed = P.cut; this.swipewait = P.wait; this.initswipewait = P.init;
    this.curamt = 0; this.swipetimer = 0; this.fspeed = 0; this.xs = 2; this.ys = 2; this.con = 0; this.hitted = 0; this.cutsdone = 0;
  }
  alarm2(A) { this.dead = true; A.b.swipeDone(); }                           // Destroy: vuelve el cuerpo y acaba el turno
  step() {
    if (this.con === 0) { if (++this.swipetimer > this.initswipewait) this.con = 1; }
    if (this.con === 2) { this.xs = this.xs === 2 ? -2 : 2; this.con = 3; this.hitted = 0; this.frame = 0; this.swipetimer = 0; this.curamt++; }
    if (this.con === 3) {
      if (this.curamt > this.amt) { this.con = 99; this.alarm[2] = 45; }
      else { this.swipetimer++; this.frame = 0; if (this.swipetimer > this.swipewait) this.con = 1; }
    }
    if (this.con === 1) { this.frame += this.cutspeed; if (this.frame >= 6) { this.con = 2; this.swipetimer = 0; } }
  }
  cutting() { return this.frame >= 5 && this.frame < 6; }
  endStep(A, inp) {
    if (!this.cutting()) { this.cutsdone = 0; return; }
    if (!this.cutsdone) { sfx('asg_cut', 0.8); this.cutsdone = 1; }
    const b = A.b, dx = Math.abs(b.heart.x - b.heartPrevX), tp = this.type[this.curamt], H = inp.held;
    if (tp === 1 && this.hitted === 0) {         // azul: te daña si te mueves
      let h = 1;
      if (dx < 0.1) h = 0;
      if (!H.left && !H.right && !H.up && !H.down) h = 0;
      if (h) { b.bulletHit(); this.hitted = 1; }
    }
    if (tp === 2 && this.hitted === 0) {         // naranja: te daña si te quedas quieto
      let h = 1;
      if (dx > 0.1) h = 0;
      if (inp.left || inp.right || inp.up || inp.down) h = 0;
      if (h) { b.bulletHit(); this.hitted = 1; }
    }
    this.hitted = 2;
  }
  draw(ctx, A) {
    const tp = this.type[this.curamt];
    if (this.cutting()) {                        // la caja entera se llena del color del barrido
      const [l, r, t, b] = A.ib();
      ctx.fillStyle = TYPE_COLOR[tp] || '#f00'; ctx.fillRect(l, t, r - l + 1, b - t + 1);
    }
    drawSprite(ctx, 'spr_asgore_swipe_nospear', this.frame, this.x, this.y, { xs: this.xs, ys: this.ys });
    drawSprite(ctx, 'spr_asgore_swipe_spear', this.frame, this.x, this.y, { xs: this.xs, ys: this.ys, color: TYPE_COLOR[tp] || '#f00' });
  }
}

// ---------------------------------------------------------------- el ataque de un turno (contenedor de instancias)
export class AsgoreAttack {
  constructor(b, spec) {
    this.b = b; this.objs = [];
    const g = spec.gen;
    if (g === 'hands') this.add(new HandGen());
    if (g === 'rhand') this.add(new RandomHandGen(spec.factor));
    if (g === 'helix') this.add(new HelixRain(spec.t));
    if (g === 'sine') this.add(new SineGen(spec.lv));
    if (g === 'cfire') this.add(new CFireGen(spec.diff));
    if (g === 'storm') this.add(new StormGen(spec.lv));
    if (g === 'swipe') this.add(new SwipeGen(this, spec.diff));
  }
  add(o) { this.objs.push(o); return o; }
  ib() { return this.b.ideal(); }                // global.idealborder
  update(inp) {
    const b = this.b;
    for (let i = 0; i < this.objs.length; i++) {  // lo creado en este frame también se mueve en este frame
      const o = this.objs[i];
      if (!o.dead) o.update(this, inp);
      if (b.state === 'gameover') return;
    }
    const hb = spriteBBox('spr_heart', b.heart.x, b.heart.y);
    for (const o of this.objs) if (o.hurts && !o.dead && hit(o.bbox(), hb)) { b.bulletHit(); if (b.state === 'gameover') return; }
    this.objs = this.objs.filter(o => !o.dead);
  }
  drawBack(ctx) {                                // detrás del alma: avisos laterales y el barrido del tridente
    for (const o of this.objs) if (o instanceof SideDam || o instanceof Swipe || o instanceof SwipeGen) o.draw(ctx, this);
  }
  drawDark(ctx) { for (const o of this.objs) if (o instanceof StormGen) o.drawDark(ctx); }
  draw(ctx) {
    const bx = this.b.box;
    for (const o of this.objs) {
      if (o instanceof SideDam || o instanceof Swipe || o instanceof SwipeGen || o.top || !o.spr) continue;
      if (o.clip) {                              // draw_self_border: solo dentro de la caja
        ctx.save(); ctx.beginPath(); ctx.rect(bx.l + 5, bx.t + 5, bx.r - bx.l - 5, bx.b - bx.t - 5); ctx.clip();
        o.draw(ctx); ctx.restore();
      } else o.draw(ctx);
    }
  }
  drawTop(ctx) { for (const o of this.objs) if (o.top) o.draw(ctx); }
}
