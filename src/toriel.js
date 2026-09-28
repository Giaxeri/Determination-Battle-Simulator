import { drawSprite, drawText, playSound, playMusic, stopMusic, setMusicVolume, spriteBBox, registerMusic, registerSounds, SPR } from './assets.js';
import { Battle, BORDER, playerAt, Slice, DmgWriter, Vapor } from './battle.js';
import { Writer } from './text.js';
import { texts, tr } from './i18n.js';
import { gmMove, rotBBox, hit, rnd, pdir, setSpeedDir } from './gm.js';

// ============================================================================
//  Toriel (obj_torielboss), al final de las RUINAS. Música: "Heartache" (music/boss1.ogg).
//  Alma roja. Sus ataques salen de obj_1sidegen (bullettype 7 / 8 / 9 / 10) y de las manos
//  blt_handbullet1/2, que sueltan blt_chasefire1/2. Con poca vida el fuego te esquiva (blt_avoidfire)
//  y los ataques terminan antes. Perdonarla (o fallar a propósito) hace avanzar su conversación
//  hasta que te deja ir; si la matas, habla de rodillas, se hace polvo y su alma se rompe.
// ============================================================================
registerMusic({ toriel: 'mus_boss1.ogg' });                                   // scr_battlegroup 22: music/boss1.ogg
registerSounds({ txttor: 'snd_txttor.wav', txttor2: 'snd_txttor2.wav' });

// Ataques sueltos. El juego no les pone nombre: son inventados. cmd = el mycommand que los elige.
export const TORIEL_ATTACKS = [
  { name: 'Falling Flames', kind: 'helix', cmd: 10 },     // obj_1sidegen bullettype 7 (blt_firehelix1)
  { name: 'Fire Dance', kind: 'mini', cmd: 30 },          // bullettype 8 (blt_minihelix)
  { name: 'Flame Curtain', kind: 'curtain', cmd: 50 },    // bullettype 10 (blt_firehelix1 + blt_floatfire)
  { name: 'Two Hands', kind: 'hands', cmd: 70 },          // blt_handbullet1 + blt_handbullet2 (blt_chasefire2)
  { name: 'Hand of Fire', kind: 'hand', cmd: 90 },        // blt_handbullet1 (blt_chasefire1)
  { name: 'Gentle Flames', kind: 'avoid', cmd: -1 },      // bullettype 9 (blt_avoidfire): el fuego te esquiva
];

// Textos (textdata_en: obj_torielboss, scr_battlegroup, SCR_TEXT 1010)
const T = texts('toriel', {
  intro: '* Toriel blocks the way!',
  check: '* TORIEL - ATK 80 DEF 80&* Knows best for you./^',
  talk: ["* You couldn't think of&  any conversation&  topics./^", '* You tried to think&  of something to say&  again^1, but.../^',
         '* Ironically^1, talking does not&  seem to be the solution&  to this situation./^'],
  talkTK: ['* You thought about telling&  Toriel that you saw&  her die./', "* But...&* That's creepy./",
           '* Can you show mercy without&  fighting or running&  away...?/^'],
  talkTK2: '* Can you show mercy&  without running away...?/^',
  flavors: ['* Toriel prepares a magical&  attack.', '* Toriel looks through you.', '* Toriel is acting aloof.', '* Toriel takes a deep breath.', '* ...'],
  // conversation 1..13 (globo pequeño)
  small: [' .....', ' .....& .....', ' .....& .....& .....', ' ...?', ' What are& you& doing?', ' Attack& or run& away!',
          ' What are& you& proving& this way?', ' Fight me& or& leave!', ' Stop it.', ' Stop& looking& at me& that way.', ' Go away!', ' ...', ' ...& ...'],
  // conversation 14..24 (globo ancho)
  wide: ['I know you want&to go home^1, but...', 'But please... go&upstairs now.', 'I promise I will&take good care&of you here.',
         'I know we do not&have much^1, but...', 'We can have a&good life here.', 'Why are you&making this so&difficult?', 'Please^1, go upstairs.',
         '.....', 'Ha ha...', 'Pathetic^1, is it not^2?&I cannot save even&a single child.', '...'],
  // conversation 25: te deja ir
  spare: ['No^1, I understand./', 'You would just be&unhappy trapped&down here./', 'The RUINS are very&small once you&get used to them./',
          'It would not be&right for you to&grow up in a&place like this./', 'My expectations...&My loneliness...&My fear.../',
          'For you^1, my child...&I will put them aside./%%'],
  // Si la matas (typer 12..15 según la cara: kill1 con 12/13, kill2 con 14, kill3 con 15)
  kill1: ['\\E0Urgh.../', '\\E0You are stronger&than I thought.../', 'Listen to me^1,& small one.../', 'If you go beyond&this door,/',
          'Keep walking as&far as you can./', 'Eventually you will&reach an exit./', '\\E1..^1.&..../',
          '\\RASGORE\\X..^1.&Do not let \\RASGORE\\X &take your soul./', 'His plan&cannot be allowed&to succeed./'],
  kill2: ['\\E2....../', "Be good^1,&won't you?/"],
  kill3: ['\\E3My child.      %%'],
  // Si la matas cuando ya te dejaba ir (conversation > 13): typer 13 y al final 15
  betray1: ['\\E4You.../', '... at my most&vulnerable&moment.../', "To think I was&worried you&wouldn't fit&in out there.../",
            '\\E5Eheheheh!!!&You really are&no different than&them!/'],
  betray2: ['\\E3Ha... ha... %%'],
});

// Tipos de texto (SCR_TEXTTYPE): fnt_plain negro; el 8 es su voz normal, 12..15 los de rodillas (más lentos y temblorosos)
const TY = (speed, shake, hspace, sound) => ({ font: 'fnt_plain', color: '#000', ox: 0, oy: 0, hspace, vspace: 20, speed, shake, sound });
const TYPER = { 8: TY(1, 0, 9, 'txttor'), 12: TY(3, 1, 10, 'txttor2'), 13: TY(4, 2, 11, 'txttor2'), 14: TY(5, 3, 14, 'txttor2'), 15: TY(10, 0, 18, 'txttor2') };
const EMO_TYPER = { 0: 12, 1: 13, 2: 14, 3: 15, 4: 13 };
// Caras de rodillas (obj_torielboss Step, destroyed == 1)
const EMO_SPR = { 0: 'spr_torielboss_kneel', 1: 'spr_torielboss_kneelanguish', 2: 'spr_torielboss_kneelanguish2', 3: 'spr_torielboss_kneelsmile', 4: 'spr_torielboss_murdered', 5: 'spr_torielboss_murdered' };

const TX = 250, TY0 = 42, TW = 144;                // instance_create(250, 42, obj_torielboss), escala 2 (72x102)
const B6 = [227, 407, 250, 385];                   // SCR_BORDERSETUP 6 (el 7 ya está en BORDER)

// Escritor con colores (\R rojo ... \X normal), como OBJ_WRITER
const COLORS = { R: '#f00', Y: '#ff0', B: '#00f', G: '#0f0', W: '#fff', X: null };
class TWriter extends Writer {
  constructor(text, x, y, opts) {
    let clean = '', col = null; const cols = [];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\\' && text[i + 1] in COLORS) { col = COLORS[text[i + 1]]; i++; continue; }
      clean += text[i]; cols.push(col);
    }
    super(clean, x, y, opts);
    const q = this.queue.filter(a => a.ch !== undefined); let k = 0;
    for (let i = 0; i < clean.length && k < q.length; i++) {      // mismo recorrido que Writer
      const c = clean[i];
      if (c === '&') continue;
      if (c === '/' || c === '%') break;
      if (c === '^') { i++; continue; }
      if (c === '\\') { i += 2; continue; }
      q[k++].color = cols[i];
    }
  }
  draw(ctx) {
    const { font, color, hspace, vspace, shake } = this.o;
    for (const c of this.cells) {
      const jx = shake ? Math.round((Math.random() - 0.5) * shake) : 0, jy = shake ? Math.round((Math.random() - 0.5) * shake) : 0;
      drawText(ctx, font, c.ch, this.x + c.col * hspace + jx, this.y + c.row * vspace + jy, { color: c.color || color });
    }
  }
}

// ---------------------------------------------------------------- caminos de las manos (path_hand1 / path_hand2)
// Caminos suaves de GameMaker: curvas cuadráticas entre los puntos medios; se recorren por longitud
function buildPath(pts) {
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length, out = [pts[0]];
  for (let i = 1; i < n - 1; i++) {
    const a = i === 1 ? pts[0] : mid(pts[i - 1], pts[i]), b = pts[i], c = i === n - 2 ? pts[n - 1] : mid(pts[i], pts[i + 1]);
    for (let k = 1; k <= 16; k++) {
      const t = k / 16, u = 1 - t;
      out.push([u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]);
    }
  }
  const len = [0];
  for (let i = 1; i < out.length; i++) len.push(len[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  const L = len[len.length - 1];
  return {
    L, p0: pts[0],
    at(pos) {
      const d = pos * L; let i = 1;
      while (i < len.length - 1 && len[i] < d) i++;
      const f = (d - len[i - 1]) / ((len[i] - len[i - 1]) || 1);
      return [out[i - 1][0] + (out[i][0] - out[i - 1][0]) * f, out[i - 1][1] + (out[i][1] - out[i - 1][1]) * f];
    },
  };
}
const PATH = {
  1: buildPath([[32, 192], [76, 216], [88, 220], [112, 224], [132, 224], [168, 216], [192, 208], [224, 196], [264, 192]]),
  2: buildPath([[260, 208], [208, 192], [188, 184], [176, 180], [156, 176], [112, 176], [96, 180], [72, 188], [16, 192]]),
};

// ---------------------------------------------------------------- balas (hijas de blt_parent)
class Flash {                                      // blt_gen: destello de 3 frames donde nace el fuego
  constructor(x, y) { this.x = x; this.y = y; this.f = 0; }
  update() { if (++this.f >= 3) this.dead = true; }
  draw(ctx) { drawSprite(ctx, 'spr_bulletgenmd', this.f, this.x, this.y); }
}

class Bullet {
  constructor(x, y, spr = 'spr_firebullet') {
    this.x = x; this.y = y; this.spr = spr; this.hs = 0; this.vs = 0; this.grav = 0; this.gdir = 270; this.friction = 0;
    this.frame = 0; this.ispd = 0.5; this.dmg = 0; this.visible = true; this.clip = false;
  }
  alarms(a) {}
  step(a) {}
  move() { this.xp = this.x; this.yp = this.y; gmMove(this); this.frame += this.ispd; }
  bbox() { return rotBBox(this.spr, this.x, this.y); }
  // blt_parent Collision_759..762: se destruye al salir de la caja
  border(a, side) {
    if ((side === 'L' && this.hs < 0) || (side === 'R' && this.hs > 0) || (side === 'U' && this.vs < 0) || (side === 'D' && this.vs > 0)) this.dead = true;
  }
  endStep(a) { if (a.b.turntimer < 0) this.dead = true; }   // blt_parent Step_2
  draw(ctx) { if (this.visible) drawSprite(ctx, this.spr, Math.floor(this.frame), this.x, this.y); }
}

class FireHelix extends Bullet {                   // blt_firehelix1: cae meciéndose y se queda en el suelo
  constructor(a, x, y) {
    super(x, y); this.grav = 0.12; this.gdir = 270; this.vs = 0.7; this.r = Math.round(rnd(1));
    const [, , t, b] = a.b.ideal();
    if (this.y > b - 20) this.y -= 20;
    if (this.y < t + 20) this.y += 20;
  }
  step(a) { const s = Math.sin(a.time() / 10) * 4; this.hs = this.r === 0 ? -s : s; }
  border(a, side) {
    if (side === 'D') { this.y = this.yp; this.vs = 0; this.gdir = this.r === 1 ? 180 : 0; }
    else super.border(a, side);
  }
}

class MiniHelix extends Bullet {                   // blt_minihelix: zigzag rápido que rebota en el suelo
  constructor(a, x, y) {
    super(x, y); this.grav = 0.06; this.gdir = 270; this.vs = Math.abs(Math.sin(a.time() / 20) * 0.95);
    this.r = Math.round(rnd(1)); this.h = 0; this.dink = 0;
  }
  step() { const s = Math.sin(this.h / 5) * 8; this.hs = this.r === 0 ? -s : s; this.h++; }
  border(a, side) {
    if (side === 'D') {
      this.grav = 0; this.vs = -0.2; playSound('noise'); this.dink++; this.y = this.yp;
      if (this.dink === 3) this.dead = true;
    } else super.border(a, side);
  }
}

class FloatFire extends Bullet {                   // blt_floatfire: sube o baja pegado a un lado
  constructor(a, x, y) {
    super(x, y); a.fx.push(new Flash(x, y));
    this.dmg = a.hp() < 7 ? 2 : 4; this.vs = rnd(8) - 4;
  }
}

class AvoidFire extends Bullet {                   // blt_avoidfire: cae y se aparta de tu alma
  constructor(a, x, y) {
    super(x, y); this.ispd = 0.2; this.vs = 0; this.grav = 0.1 + rnd(0.2); this.gdir = 250 + rnd(40); this.visible = false; this.dmg = 1;
  }
  endStep(a) {                                     // Step_2
    const h = a.b.heart, bb = this.bbox();
    const dist = (px, py) => Math.hypot(Math.max(bb.x1 - px, 0, px - bb.x2), Math.max(bb.y1 - py, 0, py - bb.y2));   // distance_to_point
    if (dist(this.x, h.y) < 100) this.hs = 180 / (dist(h.x, this.y) + 10) - 1;
    if (h.x > this.x) this.hs = -this.hs;
    const [l, r, t, b] = a.b.ideal();
    if (a.b.turntimer < 1 || this.x < l || this.x > r) this.dead = true;
    if (this.y > t) this.visible = true;
    if (this.y > b) this.dead = true;
  }
}

class ChaseFire1 extends Bullet {                  // blt_chasefire1: espera, se lanza hacia ti acelerando y rebota
  constructor(a, x, y) {
    super(x, y); a.fx.push(new Flash(x, y)); this.clip = true;
    this.dmg = a.hp() < 7 ? 2 : 4;
    if (x < a.b.ideal()[0]) this.dead = true;
    this.a1 = 45; this.a2 = 0; this.bounced = 0;
  }
  alarms(a) {
    const h = a.b.heart;
    if (this.a1 > 0 && --this.a1 === 0) {          // Alarm_1: move_towards_point(alma, 2), friction -0.05
      setSpeedDir(this, 2, pdir(this.x, this.y, h.x + 2, h.y + 2)); this.friction = -0.05; this.a2 = 4;
      this.dmg = a.hp() < 7 ? 2 : 5;
    }
    if (this.a2 > 0 && --this.a2 === 0) {          // Alarm_2: se corrige hacia el alma cada 2 frames
      this.hs += h.x > this.x ? 0.1 : -0.1; this.vs += h.y > this.y ? 0.1 : -0.1; this.a2 = 2;
    }
  }
  step(a) { if (this.y > a.b.ideal()[3] + 4) this.dead = true; }
  border(a, side) {
    if (side === 'L' || side === 'R') { this.hs = -this.hs; this.friction = 0.04; }
    if (side === 'U') { this.vs = -this.vs; this.friction = 0.04; this.bounced = 1; }
    if (side === 'D') { this.vs = -this.vs; if (this.bounced === 1) this.dead = true; this.friction = 0.04; }
  }
}

class ChaseFire2 extends Bullet {                  // blt_chasefire2: cuando la mano 1 acaba su camino, va hacia ti
  constructor(a, x, y) { super(x, y); a.fx.push(new Flash(x, y)); this.clip = true; this.dmg = a.hp() < 7 ? 2 : 5; this.goof = 0; }
  step(a) {
    const h1 = a.hands.find(o => o.which === 1 && !o.dead), h = a.b.heart;
    if (h1 && h1.pos === 1 && this.goof === 0) { setSpeedDir(this, 0.6, pdir(this.x, this.y, h.x + 2, h.y + 2)); this.goof = 1; this.friction = -0.1; }
    if (this.y > a.b.ideal()[3] + 4) this.dead = true;
  }
  border(a, side) {
    this.friction = 0.08;
    if (side === 'L' || side === 'R') this.hs = -this.hs; else this.vs = -this.vs;
  }
}

class Hand extends Bullet {                        // blt_handbullet1 / blt_handbullet2: recorre su camino soltando fuego
  constructor(a, which, x, y) {
    super(x, y, 'spr_handbullet'); this.which = which; this.clip = true; this.ispd = 0;
    this.frame = y < a.b.ideal()[2] + 60 ? 1 : 0;
    this.path = PATH[which]; this.ox = x - this.path.p0[0]; this.oy = y - this.path.p0[1];
    this.pos = 0; this.pspeed = 0.2; this.a0 = 8; this.a1 = 0; this.inactive = 0; this.x1 = 0;
  }
  alarms(a) {
    if (this.a0 > 0 && --this.a0 === 0) {         // Alarm_0: fuego cada 4 frames mientras se mueve
      if (this.inactive === 0) {
        const f = (this.which === 1 && this.x1 === 0) ? new ChaseFire1(a, this.x + 22, this.y + 5) : new ChaseFire2(a, this.x + 22, this.y + 5);
        if (!f.dead) { if (a.hp() < 8) f.dmg = 2; if (a.hp() < 6) f.dmg = 1; }
        a.bullets.push(f); playSound('noise'); this.a0 = 4;
      } else this.a1 = this.which === 1 ? 100 : 70;
      if (a.hp() < 8) this.dmg = 2; if (a.hp() < 6) this.dmg = 1;
    }
    if (this.a1 > 0 && --this.a1 === 0) this.dead = true;     // Alarm_1 (Destroy: se acaba el turno)
  }
  move() {                                         // path_start(path, 0.2, 0, 0): camino relativo
    if (this.inactive) return;
    this.pos = Math.min(1, this.pos + this.pspeed / this.path.L);
    const [px, py] = this.path.at(this.pos); this.x = this.ox + px; this.y = this.oy + py;
  }
  border() {}                                      // hspeed/vspeed = 0: nunca sale "hacia fuera"
  endStep(a) {                                     // Step_2
    if (a.b.turntimer < 1) { this.dead = true; return; }
    if (this.pos < 0.5) this.pspeed += 0.2;
    if (this.pos > 0.5) this.pspeed -= 0.1;
    if (this.pos === 1) this.inactive = 1;
    if (a.hp() <= 2) a.b.turntimer = -100;
  }
}

// ---------------------------------------------------------------- generador (obj_1sidegen / manos)
class TorielAttack {
  constructor(b, kind) {
    this.b = b; this.kind = kind; this.bullets = []; this.fx = []; this.hands = []; this.finished = false;
    this.alarm = 1; this.firing = b.firingrate;
    const [l, r, t, b2] = b.ideal();
    if (kind === 'hand' || kind === 'hands') {     // obj_torielboss Step (mnfight == 2)
      const h1 = new Hand(this, 1, l - 45, t + 5);
      this.hands.push(h1);
      if (kind === 'hands') { h1.x1 = 1; this.hands.push(new Hand(this, 2, r + 5, b2 - 15)); }
      for (const h of this.hands) h.dmg = b.enemy.atk;    // gen.dmg = global.monsteratk (pisa el 5 anterior)
      this.bullets.push(...this.hands);
    }
  }
  hp() { return this.b.player.hp; }
  time() { return this.b.clock; }                  // obj_time.time
  withDmg(o) {                                     // iii.dmg = monsteratk; 2 si PV < 8; 1 si PV < 6
    o.dmg = this.b.enemy.atk; if (this.hp() < 8) o.dmg = 2; if (this.hp() < 6) o.dmg = 1;
    return o;
  }
  fire() {                                         // obj_1sidegen Alarm_0
    const b = this.b, [l, r, t] = b.ideal(), cx = l + (r - l) / 2 - 3, K = this.kind;
    if (K === 'helix' || K === 'curtain') {        // bullettype 7 / 10
      this.bullets.push(this.withDmg(new FireHelix(this, cx, t - 25)));
      if (this.hp() <= 2) b.turntimer = -100;      // con 2 PV o menos el ataque se acaba
      if (K === 'curtain') {
        const y = t + 90;
        this.bullets.push(this.withDmg(new FloatFire(this, l + 2, y)), this.withDmg(new FloatFire(this, r - 18, y)));
      }
    }
    if (K === 'mini') {                            // bullettype 8
      this.bullets.push(this.withDmg(new MiniHelix(this, cx, t + 5)));
      if (this.hp() <= 2) b.turntimer = -100;
    }
    if (K === 'avoid') {                           // bullettype 9: SCR_BORDER(0, 80)
      const xx = Math.round(rnd(r - l)) + l;
      this.bullets.push(new AvoidFire(this, xx - 40, t - 20));
    }
    this.alarm = this.firing;
  }
  update() {
    const b = this.b;
    if (!this.hands.length && --this.alarm <= 0) this.fire();
    for (const s of [...this.bullets]) { if (!s.dead) { s.alarms(this); if (!s.dead) s.step(this); } }
    for (const s of this.bullets) if (!s.dead) s.move();
    // Colisiones: primero con el alma (Collision_744), luego con los bordes (759 izq, 760 arriba, 761 der, 762 abajo)
    const hb = spriteBBox('spr_heart', b.heart.x, b.heart.y), { l, r, t, b: bt } = b.box;
    const BR = { L: { x1: l, y1: t, x2: l + 4, y2: bt + 4 }, U: { x1: l, y1: t, x2: r + 4, y2: t + 4 },
                 R: { x1: r, y1: t, x2: r + 4, y2: bt + 4 }, D: { x1: l, y1: bt, x2: r + 4, y2: bt + 4 } };
    for (const s of this.bullets) {
      if (s.dead) continue;
      if (b.invc < 1 && hit(s.bbox(), hb)) { b.bulletHit(s.dmg); s.dead = true; if (b.state === 'gameover') return; continue; }
      for (const side of ['L', 'U', 'R', 'D']) if (!s.dead && hit(s.bbox(), BR[side])) s.border(this, side);
    }
    for (const s of this.bullets) if (!s.dead) s.endStep(this);
    for (const f of this.fx) f.update(); this.fx = this.fx.filter(f => !f.dead);
    // Fin del turno: obj_bulletgenparent Step_2 (turntimer < 1) o una mano destruida (Destroy de blt_handbullet)
    if (this.hands.length ? this.hands.some(h => h.dead) : b.turntimer < 1) this.finished = true;
    this.bullets = this.bullets.filter(s => !s.dead);
  }
  draw(ctx) {
    const { l, r, t, b } = this.b.box;
    for (const s of this.bullets) {
      if (!s.clip) { s.draw(ctx); continue; }
      ctx.save(); ctx.beginPath(); ctx.rect(l + 1, t + 1, r - l, b - t); ctx.clip(); s.draw(ctx); ctx.restore();   // draw_self_border
    }
    for (const f of this.fx) f.draw(ctx);
    // los bordes (obj_lborder & co., profundidad -999) tapan las balas
    ctx.fillStyle = '#fff';
    ctx.fillRect(l, t, r + 5 - l, 5); ctx.fillRect(l, b, r + 5 - l, 5); ctx.fillRect(l, t, 5, b + 5 - t); ctx.fillRect(r, t, 5, b + 5 - t);
  }
}

// ============================================================================
export class TorielBattle extends Battle {
  constructor(single = null) { super(single); }

  // Toriel: final de las RUINAS, NV 1 con el Toy Knife y la Faded Ribbon; Monster Candy y Spider Donut
  playerSetup() { return playerAt(1, { name: 'Toy Knife', atk: 3, knife: true }, { name: 'Faded Ribbon', def: 3 }); }
  itemSetup() { return ['candy', 'candy', 'donut']; }

  reset() {
    super.reset();
    this.enemy = { hp: 440, maxHp: 440, atk: 6, def: 1, x: TX, y: TY0, wd: TW };   // scr_monstersetup tipo 10
    this.body = { shake: 0, shakeRate: 2, shakeX: 0 };
    this.flavor = T.intro; this.soul = 'spr_heart';
    this.spr = 'spr_torielboss'; this.frame = 0; this.ispd = 0; this.sideface = 0; this.dx = 0;
    this.conversation = 0; this.hplastturn = 440; this.talked = -1; this.tt = 0; this.mycommand = 0; this.destroyed = 0;
    this.tb = null; this.clock = 0; this.actPos = 0; this.shudder = 0; this.faceemotion = 0; this.heartHidden = false;
    this.bare = false; this.dust = null; this.soulT = null; this.shards = []; this.slowTick = 0; this.fadeSpeed = 0.08;
  }

  // ---------------------------------------------------------------- ganchos de la base
  startIntro() { playMusic('toriel'); if (this.single) this.startEnemyTurn(); else this.startMenu(); }
  ideal() { return this.border === 6 ? B6 : BORDER[this.border]; }
  enemyTake(d) { return d; }
  missPos() { return [TX + TW / 2 - 48, TY0 - 24]; }
  dmgPos() { return [TX, TY0 - 12]; }             // obj_dmgwriter en (x, y - 20), bajado un poco para que el número quepa
  gameOver() { super.gameOver(); this.tb = null; }
  updateMenu(inp) { if (inp.confirm) this.talked = -1; super.updateMenu(inp); }   // obj_battlecontroller: global.talked = -1
  useItem(i) { this.talked = 91; super.useItem(i); }

  // Daño de las balas (blt_parent Collision obj_heart): sin los extras por PV de scr_damagestandard
  bulletHit(dmg) {
    if (this.invc >= 1 || this.state === 'gameover') return;
    const p = this.player, amt = Math.max(1, Math.round(dmg - (p.df + p.armor.def) / 5));
    p.hp = Math.max(0, p.hp - amt);
    playSound('hurt'); this.shake = 2; this.invc = 20;
    if (p.hp <= 0) this.gameOver();
  }

  // Golpe del jugador (obj_torielboss Alarm_3): tiembla a los lados y luego baja la vida (hurtanim == 2)
  onStrike(damage) {
    if (damage === null) return super.onStrike(null);
    const take = damage;
    this.slice = new Slice(this);
    this.later(this.slice.damagetimer, () => {
      const [dx, dy] = this.dmgPos();
      this.dmgw = new DmgWriter(this, take, dx, dy, 0);
      if (this.conversation < 4) this.conversation = 0;
      this.spr = 'spr_torielboss_hurt';
      if (take > 100) { this.spr = 'spr_torielboss_reallyhurt'; setMusicVolume(0); }
      if (take > 100 && this.conversation > 13) this.spr = 'spr_torielboss_murdered';
      this.frame = 0;
      playSound('damage');
      this.shudder = take > 100 ? 32 : 16; this.shudderRate = take > 100 ? 3 : 2; this.shudderT = 0; this.take = take;
      this.shudderStep();
    });
  }
  shudderStep() {                                  // x = xstart + shudder; el signo alterna y se va apagando
    this.dx = this.shudder;
    this.shudder = this.shudder < 0 ? -(this.shudder + 2) : -this.shudder;
    this.shudder -= 2;
    if (this.shudder === 0) this.later(1, () => this.applyDamage());   // se queda 4 px a la izquierda, como en el juego
  }
  applyDamage() {                                  // Step, hurtanim == 2
    const e = this.enemy, take = this.take;
    e.hp = Math.max(0, e.hp - take);
    this.dmgw.life = take > 100 ? 60 : 15;
    if (e.hp <= 150) e.def = -140;                 // ya casi no se defiende
    if (e.hp >= 1 && this.conversation < 13) this.spr = this.player.hp > 2 ? 'spr_torielboss' : 'spr_torielboss_side';
    this.startEnemyTurn();
  }

  // ---------------------------------------------------------------- ACT (Check / Talk) y MERCY
  drawSubmenu(ctx) {
    const x = BORDER[0][0] + 20, y = BORDER[0][2] + 20, line = (s, dx = 0) => drawText(ctx, 'fnt_main', s, x + dx, y, { mono: 16 });
    const S = this.state;
    if (S === 'fightTarget' || S === 'actTarget') {
      line('   * Toriel');
      if (S === 'fightTarget') {                   // obj_battlecontroller Draw: xwrite = 190 + largo del nombre * 16
        const bx = 190 + 6 * 16, w = Math.floor(this.enemy.hp / this.enemy.maxHp * 100);
        ctx.fillStyle = '#f00'; ctx.fillRect(bx, 280, 101, 17);
        ctx.fillStyle = '#0f0'; if (this.enemy.hp > 0) ctx.fillRect(bx, 280, w + 1, 17);
      }
    }
    if (S === 'actList') { line('   * ' + tr('Check')); line('   * ' + tr('Talk'), 256); }   // SCR_TEXT 1010
    if (S === 'mercyList') line('   * ' + tr('Spare'));
    if (S === 'itemList') super.drawSubmenu(ctx);
  }
  updateSub(inp) {
    if (this.state === 'actList') {
      if (inp.cancel) { this.go('actTarget'); return; }
      if (inp.left || inp.right) { this.actPos = 3 - this.actPos; playSound('squeak'); }
      if (inp.confirm) { playSound('select'); this.doAct(this.actPos); }
      return;
    }
    if (this.state === 'actTarget' && inp.confirm) { playSound('select'); this.actPos = 0; this.go('actList'); return; }
    super.updateSub(inp);
  }
  doAct(pos) {                                     // obj_torielboss Step (myfight == 2)
    this.talked = pos;
    if (pos === 0) return this.boxMsgs([T.check]);
    this.tt++;                                     // Talk
    let msgs = [this.tt > 2 ? T.talk[2] : this.tt > 1 ? T.talk[1] : T.talk[0]];
    const tk = torielKills();
    if (tk > 0) msgs = T.talkTK;
    if (tk > 0 && this.tt > 1) msgs = [T.talkTK2];
    this.boxMsgs(msgs);
  }
  boxMsgs(msgs) { this.boxQ = [...msgs]; this.writer = new Writer(this.boxQ.shift(), BORDER[0][0], BORDER[0][2]); this.go('tBox'); }

  // ---------------------------------------------------------------- turno de Toriel
  startEnemyTurn() {                               // mnfight = 1: alarm[5] = 15, alarm[6] = 2
    this.writer = null; this.go('tTalk'); this.heartHidden = true;
    this.a5 = this.enemy.hp > 0 ? 15 : -1; this.a6 = 2;
  }
  alarm6() {                                       // obj_torielboss Alarm_6
    const e = this.enemy;
    let talk = false;
    if (!this.single && this.hplastturn === e.hp && this.talked === -1) { this.conversation++; talk = true; }   // no la heriste
    this.hplastturn = e.hp;
    if (e.hp > 0) {
      if (talk) {
        const c = this.conversation;
        this.a5 += 70;
        if (c === 10) this.sideface = 1;
        const S = { 12: 'spr_torielboss_side', 13: 'spr_torielboss_sidesad', 14: 'spr_torielboss_sad', 19: 'spr_torielboss_sad', 20: 'spr_torielboss_sidesad',
                    21: 'spr_torielboss_sidesad2', 22: 'spr_torielboss_sidesadhappy', 24: 'spr_torielboss_sidesad' };
        if (c > 15) this.spr = 'spr_torielboss_sadhappy';
        if (S[c]) this.spr = S[c];
        if (c <= 13) this.say('sm', [T.small[c - 1]]);
        else {
          this.a5 += 400;
          if (c === 14) stopMusic();               // caster_free(global.batmusic): se acaba la música
          if (c === 25) {                          // te deja ir (conversation = 99, mnfight = 99)
            this.spr = 'spr_torielboss_neutral'; this.a5 = -1; this.conversation = 99;
            this.say('wd', T.spare);
          } else this.say('wd', [T.wide[c - 14]]);
        }
      }
    } else {                                       // destroyed = 1: cae de rodillas y habla
      stopMusic(); this.dmgw = null; this.destroyed = 1; this.ispd = 0.2;
      const bet = this.conversation > 13;
      this.faceemotion = bet ? 4 : 0;
      this.say('kill', bet ? [...T.betray1, ...T.betray2] : [...T.kill1, ...T.kill2, ...T.kill3]);
    }
    this.mycommand = this.single && this.single.cmd >= 0 ? this.single.cmd : Math.round(rnd(100));
    this.setBorder(6); this.heartHidden = false;
    this.heart = { x: Math.round((B6[0] + B6[1]) / 2) - 8, y: Math.round((B6[2] + B6[3]) / 2) - 8 };
  }

  // Globos: 'sm' = obj_blconsm, 'wd' = obj_blconwdflowey (typer 8); 'kill' = globo ancho con los typer 12..15
  say(kind, msgs) {
    const x = TX + TW + (kind === 'sm' ? 21 : kind === 'wd' ? 3 : 2), y = kind === 'sm' ? TY0 + 24 : kind === 'wd' ? TY0 + 32 : TY0 + 36;
    this.tb = { kind, x, y, msgs, i: 0 };
    this.newTWriter();
  }
  newTWriter() {
    const tb = this.tb, msg = tb.msgs[tb.i], m = /^\\E(\d)/.exec(msg);
    if (tb.kind === 'kill' && m) this.faceemotion = +m[1];
    const typer = tb.kind === 'kill' ? TYPER[EMO_TYPER[this.faceemotion] || 13] : TYPER[8];
    tb.writer = new TWriter(msg, tb.x + (tb.kind === 'sm' ? 15 : 36), tb.y + 10, { ...typer, onFace: n => { this.faceemotion = n; } });
    tb.auto = /%%$/.test(msg) && !msg.includes('/');                  // "%%" sin "/": se cierra solo
  }
  updateTBubble(inp) {                             // Z pasa de mensaje (OBJ_WRITER), X lo muestra entero
    const tb = this.tb; if (!tb) return;
    tb.writer.update();
    if (tb.msgs.length === 1 && tb.kind !== 'kill') return;           // OBJ_NOMSCWRITER: lo cierra alarm[5]
    if (inp.cancel) tb.writer.skip();
    else if (tb.writer.done && (tb.auto || inp.confirm)) {
      if (++tb.i < tb.msgs.length) this.newTWriter(); else { this.tb = null; this.onBubbleEnd(tb); }
    }
  }
  onBubbleEnd(tb) {
    if (tb.kind === 'kill') this.later(4, () => this.vaporize());      // Alarm_9 -> Alarm_10
    if (tb.kind === 'wd' && this.conversation === 99) {                 // runaway = 1, alarm[2] = 20, obj_unfader
      this.conversation = 56; this.go('tLeave');
      this.later(20, () => { this.heartHidden = true; this.setBorder(0); });
      this.fadeOut = 0.001;
    }
  }

  beginAttack() {                                  // Alarm_5 + Step (mnfight == 2)
    this.tb = null;
    if (this.mycommand < 40 || this.player.hp < 3) this.setBorder(7);
    const c = this.mycommand, hp = this.player.hp;
    let kind;
    if (this.single) kind = this.single.kind;
    else if (hp > 2 && this.conversation < 13) kind = c <= 20 ? 'helix' : c <= 40 ? 'mini' : c <= 60 ? 'curtain' : c <= 80 ? 'hands' : 'hand';
    else kind = 'avoid';
    this.turntimer = 140;
    if (kind === 'helix') this.firingrate = 5;
    if (kind === 'mini') this.firingrate = 2;
    if (kind === 'curtain') this.firingrate = 6;
    if (kind === 'hand' || kind === 'hands') { this.turntimer = 200; this.firingrate = 2; }
    if (kind === 'avoid') {                        // poca vida (o ya no quiere pelear): fuego que te esquiva
      this.firingrate = 2;
      if (this.enemy.hp > 150 && !this.single) this.enemy.def = -15;
      if (this.conversation < 13) this.sideface = 1;
      if (this.conversation > 13 && !this.single) { this.turntimer = 1; this.enemy.def = -2000; }   // ya no ataca: un golpe la mata
    }
    // Texto del siguiente turno
    this.flavor = T.flavors[c >= 90 ? 3 : c >= 70 ? 2 : c >= 30 ? 1 : 0];
    if (this.conversation > 13 && !this.single) this.flavor = T.flavors[4];
    this.attack = new TorielAttack(this, kind);
    this.go('tAttack');
  }

  endTurn() {                                      // mnfight = 3: la caja vuelve a crecer y sale el menú
    this.attack = null; this.sideface = 0; this.setBorder(0); this.go('tEnd');
  }

  // ---------------------------------------------------------------- muerte de Toriel (Alarm_10 + obj_torheart)
  vaporize() {
    this.spr = null; this.bare = true;
    try { localStorage.setItem('dbs-toriel-tk', String(torielKills() + 1)); } catch (e) {}   // undertale.ini: [Toriel] TK
    this.dust = new Vapor({ x: TX, y: TY0 + 56 }, SPR['spr_torielboss_kneelsmile2'].frames[0]);   // spr_torielboss_kneelsmile2 a escala 1
    playSound('vaporized');
    this.soulT = { x: this.heart.x, y: TY0 + 56 + 75, t: 0, alpha: 0, broken: false, shake: 3 };   // obj_torheart (x del alma, mitad del sprite)
    this.go('tSoul');
  }
  updateSoul() {
    const s = this.soulT; s.t++;
    s.alpha += 0.01;
    if (s.t === 120) { playSound('break1'); s.broken = true; s.x -= 2; s.shake = 0; }                  // Alarm_0 (room_speed vuelve a 30)
    if (s.t === 160) {                                                                                     // Alarm_1: se hace pedazos
      playSound('break2'); s.gone = true;
      for (const [dx, dy] of [[-2, 0], [0, 3], [2, 6], [8, 0], [10, 3], [12, 6]]) {                       // obj_theartshard
        const d = rnd(2 * Math.PI); this.shards.push({ x: s.x + dx, y: s.y + dy, hs: 7 * Math.cos(d), vs: -7 * Math.sin(d), f: 0 });
      }
    }
    if (s.t === 340) this.fadeOut = 0.001;                                                                 // Alarm_2: obj_unfader
    for (const p of this.shards) { p.vs += 0.2; p.x += p.hs; p.y += p.vs; p.f += 0.25; }
  }

  // ---------------------------------------------------------------- bucle
  update(inp) {
    if (this.state === 'tSoul' && this.soulT.t < 120 && ++this.slowTick % 3 === 0) return;   // room_speed = 20 hasta que se rompe el alma
    super.update(inp);
    if (this.state === 'gameover') return;
    this.clock++;
    this.frame += this.ispd;
    if (this.shudder && this.dmgw && ++this.shudderT >= this.shudderRate) { this.shudderT = 0; this.shudderStep(); }
    const S = this.state;
    if (S === 'tBox') {
      if (inp.cancel) this.writer.skip();
      else if (inp.confirm && this.writer.done) {
        if (this.boxQ.length) this.writer = new Writer(this.boxQ.shift(), BORDER[0][0], BORDER[0][2]); else this.startEnemyTurn();
      }
    }
    if (S === 'tTalk') {
      if (this.a6 > 0 && --this.a6 === 0) { this.a6 = -1; this.alarm6(); }
      this.updateTBubble(inp);
      const tb = this.tb, c = this.conversation;
      if (inp.confirm && this.a5 > 0) {            // Step: Z acorta la espera
        if (c < 13 && this.a5 > 5 && this.box.l === this.ideal()[0] && this.a6 < 0) this.a5 = 2;
        if (c >= 13 && c !== 99 && tb && tb.writer.done) this.a5 = 2;
      }
      if (this.a5 > 0 && --this.a5 === 0) this.beginAttack();
    }
    if (S === 'tAttack') {
      const h = this.heart, [l, r, t, b] = this.ideal(), H = inp.held, sp = this.sp;
      if (H.up) h.y -= sp; if (H.down) h.y += sp; if (H.left) h.x -= sp; if (H.right) h.x += sp;
      h.x = Math.min(Math.max(h.x, l + 4), r - 16); h.y = Math.min(Math.max(h.y, t + 4), b - 16);
      this.turntimer--;
      if (this.attack) this.attack.update();
      if (this.state === 'tAttack' && this.attack && this.attack.finished) this.endTurn();
    }
    if (S === 'tEnd' && this.box.l === BORDER[0][0]) this.startMenu();
    if (S === 'tLeave') this.updateTBubble(inp);
    if (S === 'tSoul') { if (this.dust) this.dust.update(); this.updateSoul(); }
    if (this.fadeOut > 0) {
      this.fadeOut += this.fadeSpeed;
      if (this.fadeOut >= 1.3 && this.onExit) { const f = this.onExit; this.onExit = null; stopMusic(); f(); }
    }
    // Caras de rodillas mientras habla (destroyed == 1)
    if (this.destroyed === 1 && this.spr) { this.spr = EMO_SPR[this.faceemotion] || this.spr; if (this.faceemotion >= 4) this.ispd = 0; }
  }

  // ---------------------------------------------------------------- dibujo
  draw(ctx) {
    if (!this.bare || this.state === 'gameover') return super.draw(ctx);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 640, 480);   // obj_torielboss Destroy: sin botones, caja ni PV
    if (this.dust) this.dust.draw(ctx);
    const s = this.soulT;
    if (s && !s.gone) {
      const jx = s.shake ? rnd(s.shake) - rnd(s.shake) : 0, jy = s.shake ? rnd(s.shake) - rnd(s.shake) : 0;
      drawSprite(ctx, s.broken ? 'spr_torheartbreak' : 'spr_torheart', 0, s.x + jx, s.y + jy, { alpha: Math.min(1, s.alpha) });
    }
    for (const p of this.shards) drawSprite(ctx, 'spr_theartshards', Math.floor(p.f), p.x, p.y);
    if (this.fadeOut > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, this.fadeOut)})`; ctx.fillRect(0, 0, 640, 480); }
  }
  drawEnemy(ctx) {                                 // Draw_0: con sideface se dibuja de lado (salvo tapándose la boca)
    if (!this.spr) return;
    let spr = this.spr, f = this.frame;
    if (this.destroyed === 1 && this.faceemotion === 4) f = 0;
    if (this.destroyed === 1 && this.faceemotion === 5) f = 1;
    if (this.sideface && spr !== 'spr_torielboss_mouthcover') spr = 'spr_torielboss_side';
    drawSprite(ctx, spr, Math.floor(f), TX + this.dx, TY0, { xs: 2, ys: 2 });
  }
  drawExtra(ctx) {
    const tb = this.tb; if (!tb) return;
    drawSprite(ctx, tb.kind === 'sm' ? 'spr_blconsm' : 'spr_blconwdshrt', 0, tb.x, tb.y);
    tb.writer.draw(ctx);
  }
  drawHeart(ctx) {
    const S = this.state;
    if (S === 'tTalk' || S === 'tAttack' || S === 'tEnd' || S === 'tLeave') {
      if (this.heartHidden) return;
      this.hx = this.heart.x; this.hy = this.heart.y;
      drawSprite(ctx, this.soul, Math.floor(this.heartFrame), this.hx, this.hy); return;
    }
    if (S === 'actList') {
      this.hx = 72 + (this.actPos === 3 ? 256 : 0); this.hy = 278;
      drawSprite(ctx, this.soul, 0, this.hx, this.hy); return;
    }
    super.drawHeart(ctx);
  }
}

// Veces que has matado a Toriel (undertale.ini, [Toriel] TK): cambia el texto de Talk
function torielKills() { try { return +localStorage.getItem('dbs-toriel-tk') || 0; } catch (e) { return 0; } }
