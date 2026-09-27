import { drawSprite, drawText, playSound, playMusic, spriteBBox, SPR } from './assets.js';
import { Battle, BORDER, Vapor } from './battle.js';
import { Writer } from './text.js';
import { MuffetBody } from './muffetbody.js';

// ============================================================================
//  Muffet (obj_spiderb). Música: "Spider Dance" (mus_spider.ogg).
//  El alma se vuelve morada y queda atrapada en 3 hilos de telaraña (obj_purpleheart):
//  izquierda/derecha para moverte por el hilo, arriba/abajo para saltar de hilo.
// ============================================================================

// Patrones de cada turno (obj_spiderbulletgen Other_13): scr_sp(tipo, velocidad, hilo, lado, espera)
//   tipo: 0 araña, 1 dónut, 2 cruasán, 3 dos arañas   hilo: 1-3 (0 = al azar)   lado: 0 izq, 1 der, 2 al azar
//   espera: frames hasta la siguiente (0 = firingrate).  fr = firingrate, tt = ajuste de la duración del turno
export const PATTERNS = {
  0: { fr: 10, tt: -30, list: [[0, 8, 1, 1, 0], [0, 8, 1, 1, 20], [0, 8, 3, 1, 0], [0, 8, 3, 1, 20], [0, 8, 2, 0, 0], [0, 8, 2, 0, 20], [0, 8, 3, 0, 0], [0, 8, 1, 0, 0]] },
  1: { fr: 8, tt: 0, list: [[0, 8, 2, 1, 0], [0, 8, 3, 1, 16], [0, 8, 1, 1, 0], [0, 8, 2, 1, 16], [0, 8, 2, 0, 0], [0, 8, 1, 0, 16], [0, 8, 2, 0, 0], [0, 8, 3, 0, 16], [0, 8, 2, 1, 0], [0, 8, 3, 1, 16], [0, 8, 1, 1, 0], [0, 8, 2, 1, 16]] },
  2: { fr: 12, tt: 0, list: [[3, 9, 3, 1, 0], [0, 9, 1, 1, 16], [3, 9, 1, 1, 0], [0, 9, 3, 1, 16], [0, 9, 2, 0, 16], [3, 9, 2, 0, 16], [0, 9, 2, 1, 16], [3, 9, 2, 1, 16]] },
  3: { fr: 14, tt: 10, list: [[0, 9, 1, 1, 8], [0, 9, 3, 1, 8], [0, 9, 2, 1, 16], [3, 9, 1, 0, 13], [3, 9, 3, 0, 13], [3, 9, 2, 0, 20], [1, 8, 1, 0, 20], [1, 8, 3, 0, 20], [1, 8, 1, 0, 20]] },
  4: { fr: 14, tt: 0, list: [[3, 8, 2, 1, 18], [0, 8, 2, 1, 18], [3, 9, 2, 1, 15], [0, 9, 2, 1, 15], [3, 9.5, 2, 1, 14], [0, 9.5, 2, 1, 14], [3, 10, 2, 1, 13], [0, 10, 2, 1, 13], [3, 10.5, 2, 1, 12], [0, 10.5, 2, 1, 12], [3, 11, 2, 1, 11], [0, 11, 2, 1, 11], [3, 12, 2, 1, 10], [0, 12, 2, 1, 10], [3, 13, 2, 1, 9], [0, 13, 2, 1, 9], [3, 13, 2, 1, 9], [0, 13, 2, 1, 9]] },
  5: { fr: 15, tt: -10, list: [[3, 10, 2, 1, 0], [1, 5, 1, 1, 1], [1, 5, 2, 1, 20], [3, 10, 0, 0, 0], [1, 5, 1, 0, 1], [1, 5, 2, 0, 20], [3, 10, 3, 1, 0], [1, 5, 1, 1, 1], [1, 5, 2, 1, 20], [3, 10, 2, 0, 0]] },
  6: { fr: 10, tt: -10, list: [[0, 11, 1, 1, 0], [0, 11, 0, 0, 0], [0, 11, 2, 1, 0], [0, 11, 0, 0, 0], [0, 11, 3, 1, 0], [0, 11, 0, 0, 0], [0, 11, 2, 1, 0], [0, 11, 0, 0, 0], [0, 11, 1, 1, 0], [0, 11, 0, 0, 0], [0, 11, 2, 1, 0], [0, 11, 0, 0, 0]] },
  7: { fr: 14, tt: 40, list: [[1, 6, 1, 1, 1], [1, 6, 3, 1, 1], [1, 6, 1, 0, 1], [1, 6, 3, 0, 20], [0, 12, 1, 1, 0], [0, 12, 1, 0, 8], [0, 12, 3, 1, 0], [0, 12, 3, 0, 8], [0, 12, 2, 1, 0], [0, 12, 2, 0, 20], [2, 13, 2, 0, 0]] },
  8: { fr: 20, tt: 10, list: [[2, 13, 1, 0, 1], [2, 13, 3, 0, 30], [2, 13, 2, 0, 0], [2, 13, 1, 1, 1], [2, 13, 3, 1, 30], [2, 13, 2, 1, 30]] },
  9: { fr: 14, tt: 0, list: [[0, 9, 3, 1, 10], [3, 9, 1, 1, 15], [0, 9.5, 1, 1, 10], [3, 9.5, 3, 1, 14], [0, 10, 3, 1, 9], [3, 10, 1, 1, 13], [0, 11, 1, 1, 9], [3, 11, 3, 1, 12], [0, 12, 3, 1, 8], [3, 12, 1, 1, 11], [0, 13, 1, 1, 8], [3, 13, 3, 1, 18], [0, 13, 2, 1, 8], [3, 13, 2, 1, 9], [0, 13, 2, 1, 8], [3, 13, 2, 1, 9]] },
  10: { fr: 9, tt: 0, list: [[0, 12, 3, 1, 0], [0, 12, 0, 0, 0], [0, 12, 1, 1, 0], [0, 12, 0, 0, 0], [0, 12, 2, 1, 0], [0, 12, 0, 0, 0], [0, 12, 3, 1, 0], [0, 12, 0, 0, 0], [0, 12, 1, 1, 0], [0, 12, 0, 0, 0], [0, 12, 2, 1, 0], [0, 12, 0, 0, 18], [3, 12, 2, 1, 1], [3, 12, 2, 0, 0]] },
  11: { fr: 20, tt: 0, list: [[1, 8, 1, 0, 1], [1, 8, 2, 0, 0], [1, 8, 1, 1, 1], [1, 8, 2, 1, 0], [1, 8, 3, 0, 1], [1, 8, 2, 0, 0], [1, 8, 3, 1, 1], [1, 8, 2, 1, 30], [1, 8, 1, 0, 1], [1, 8, 3, 0, 0], [1, 8, 3, 1, 1], [1, 8, 1, 1, 0]] },
  12: { fr: 18, tt: 90, list: [[2, 13, 1, 0, 0], [2, 13, 3, 0, 0], [2, 13, 2, 0, 0], [2, 13, 1, 1, 0], [2, 13, 3, 1, 0], [2, 13, 2, 1, 0], [2, 13, 1, 0, 0], [2, 13, 3, 0, 0], [2, 13, 2, 0, 0]] },
  13: { fr: 14, tt: 30, list: [[3, 5, 2, 1, 0], [0, 8, 2, 0, 10], [3, 5, 2, 1, 0], [0, 8, 2, 0, 10], [3, 5, 2, 1, 0], [0, 8, 2, 0, 10], [3, 5, 2, 1, 0], [0, 8, 2, 0, 10], [3, 5, 2, 1, 0], [0, 8, 2, 0, 10]] },
  14: { fr: 14, tt: 50, list: [[1, 6, 1, 0, 1], [1, 6, 2, 0, 1], [1, 6, 3, 1, 1], [1, 6, 2, 1, 38], [3, 9, 2, 1, 1], [3, 9, 2, 0, 8], [3, 9, 2, 1, 40], [2, 13, 1, 0, 4], [2, 13, 3, 1, 4], [2, 13, 3, 0, 4], [2, 13, 1, 1, 25], [0, 8, 2, 1, 1], [0, 8, 2, 0, 15]] },
  15: { fr: 9, tt: 0, list: [[3, 10, 1, 1, 0], [3, 10, 2, 1, 0], [3, 10, 3, 1, 0], [3, 10, 2, 1, 0], [3, 10.5, 1, 1, 0], [3, 10.5, 2, 1, 0], [3, 10.5, 3, 1, 0], [3, 10.5, 2, 1, 0], [3, 11, 1, 1, 0], [3, 11, 2, 1, 0], [3, 11, 3, 1, 0], [3, 11, 2, 1, 0], [3, 11.5, 1, 1, 0], [3, 11.5, 2, 1, 0], [3, 12, 3, 1, 0], [3, 12, 2, 1, 0], [3, 12, 1, 1, 0], [3, 12, 2, 1, 0], [3, 12, 3, 1, 0]] },
};
const PET_TURNS = { 4: 620, 9: 660, 15: 700 };            // turnos con la mascota (turntimer)

// Ataques de Muffet para practicar sueltos (el juego no les pone nombre: nombres inventados)
export const MUFFET_ATTACKS = [
  'Spider Parade', 'Rush Hour', 'Double Trouble', 'Donut Delivery', 'Breakfast Time', 'Bouncing Donuts',
  'Web Scramble', 'Bakery Mix', 'Croissant Boomerang', 'Lunch Time', 'Tea Party', 'Donut Storm',
  'Croissant Rain', 'Middle Lane', 'Full Menu', 'Dinner Time',
].map((name, type) => ({ name, type }));

// Textos (textdata_en, obj_spiderb)
const T = {
  intro: '* Muffet traps you!/^',
  flavors: ['* Muffet pours you a cup of&  spiders.', '* All the spiders clap along to&  the music.', '* Muffet does a synchronized&  dance with the other spiders.', '* Muffet tidies up the web&  around you.', '* Smells like freshly baked&  cobwebs.'],
  check: '* MUFFET - ATK 38.8 DEF 18.8&* If she invites you to her&  parlor^1, excuse yourself./',
  talk: [["Why so pale?&You should be proud~/%%"], ["Proud that you're&going to make a&delicious cake~&Ahuhuhu~/%%"], ["Let you go^1?&Don't be silly~/%%"],
         ["Your SOUL is going&to make every spider&very happy~~~/%%"], ["Oh, how rude of me!&I almost forgot&to introduce you&to my pet~/", "It's breakfast time,&isn't it?&Have fun, you two~ /%%"],
         ["The person who warned&us about you.../%%"], ["Offered us a LOT of&money for your SOUL./%%"], ["They had such a sweet&smile~ and... ahuhu~/%%"],
         ["It's strange, but&I swore I saw them&in the shadows...&Changing shape...?/%%"], ["Oh, it's lunch time,&isn't it?&And I forgot to&feed my pet~/%%"],
         ["With that money,&the spider clans&can finally be&reunited~/%%"], ["You haven't heard?&Spiders have been&trapped in the RUINS&for generations!/%%"],
         ["Even if they go&under the door,&Snowdin's fatal cold&is impassable alone./%%"], ["But with the money&from your SOUL, we'll&be able to rent&them a heated limo~/%%"],
         ["And with all of&the leftovers...^1?&We could have a&nice vacation~/", "Or even build a&spider baseball&field~/%%"], ["But enough of that...&It's time for&dinner, isn't it?&Ahuhuhu~/%%"]],
  talkAfter: ["Ahuhuhu~&What are you&doing~/%%", "It's time to go~/%%", "Feeling comfortable&trapped in that&web?/%%", "Ahuhuhuhu~&Well, I don't&mind keeping&you here~/%%",
              "If you don't mind&being gobbled up~&Ahuhuhu~/%%", "Just kidding,&of course~/%%", "...&well... maybe&ONE little&nibble~~/%%", "No, no, it's&time to go~/%%", ".../%%"],
  blue: "Don't look so&blue^1, my deary~/%%",
  purple: "... I think purple is&a better look on&you! Ahuhuhu~/%%",
  trapped: "* You're trapped in a strange&  purple web!/^",
  dessert: ["You're still alive^1?&Ahuhuhu~/", "Oh, my pet~&Looks like it's&time for dessert~/%%"],
  telegram: ["Huh?&A telegram from&the spiders in&the RUINS?/", "What?&They're saying&that they saw&you, and.../", "... even if you&hurt others, you&never hurt a&single spider!/",
             "Oh my, this has&all been a big&misunderstanding~/", "I thought you&were someone that&hated spiders~/", "The person who&asked for that SOUL.../",
             "They must have&meant a DIFFERENT&human in a&striped shirt~/", "Sorry for all the&trouble~&Ahuhuhu~/", "I'll make it up&to you~/",
             "You can come back&here any time...&And, for no charge&at all.../", "I'll wrap you&up and let you&play with my pet&again!/", "Ahuhuhuhuhuhu~&Just kidding~/", "I'll SPARE you&now~/%%"],
  sparing: '* Muffet is sparing you./^',
  won: (xp, g) => `* YOU WON!&* You earned ${xp} EXP and ${g} gold./`,
};
const TYPER33 = { font: 'fnt_plain', color: '#000', ox: 0, oy: 0, hspace: 9, vspace: 20, speed: 1, shake: 0, sound: 'txtmuffet' };
const PURPLE = 'rgb(128,0,128)';
const choose = (...a) => a[Math.floor(Math.random() * a.length)];

// ---------------------------------------------------------------- alma morada en los hilos (obj_purpleheart)
class PurpleHeart {
  constructor(b) {
    const [l, r, t] = b.ideal();
    this.b = b; this.ttype = 0;
    this.xmid = (l + r) / 2; this.xlen = 100; this.yamt = 3; this.yspace = 40; this.yno = 2; this.yzero = t + 30;
    this.moving = 0; this.space = 0; this.yadd = 0; this.yadd2 = 3; this.yoff = 0; this.yz2 = 0;
    this.x = this.xmid; this.y = this.yzero + (this.yno - 1) * this.yspace; this.frame = 0;
  }
  update(inp) {
    const b = this.b;
    this.frame = b.invc > 0 ? this.frame + 0.5 : 0;
    const H = inp.held;
    if (H.left && this.x > this.xmid - this.xlen) this.x -= 4;
    if (H.right && this.x < this.xmid + this.xlen) this.x += 4;
    if (inp.up && this.moving === 0 && this.yno > 1) this.moving = 1;
    if (this.moving === 1) {
      this.space += this.yspace / 3;
      this.y = this.yzero + (this.yno - 1) * this.yspace - this.space + this.yoff;
      if (this.space >= this.yspace) { this.yno--; this.space = 0; this.moving = 0; }
    }
    if (inp.down && this.moving === 0 && this.yno < this.yamt) this.moving = 2;
    if (this.moving === 2) {
      this.space += this.yspace / 3;
      this.y = this.yzero + (this.yno - 1) * this.yspace + this.space + this.yoff;
      if (this.space >= this.yspace) { this.yno++; this.space = 0; this.moving = 0; }
    }
    if (this.ttype === 1) {                    // los hilos bajan hacia la boca de la mascota
      this.yoff += this.yadd; this.y += this.yadd;
      if (this.yoff > this.yspace) {
        this.yno++;
        if (this.yno > this.yamt) { this.yno = this.yamt; b.hurtPlayer(6); }   // te muerde
        this.yoff = 0;
        if (this.moving === 0) this.y = this.yzero + (this.yno - 1) * this.yspace + this.space + this.yoff;
      }
    }
    if (this.ttype === 3) {                    // la caja crece hacia arriba y aparecen más hilos
      const att = b.attack;
      if (!att.cupcake) att.cupcake = new HideousCupcake(this.xmid - this.xlen, 460);
      if (att.cupcake.y > 320) att.cupcake.y -= 4;
      if (this.yzero > 100) { this.yzero -= 4; this.y -= 4; this.yz2 += 4; if (this.yz2 > this.yspace) { this.yz2 -= this.yspace; this.yamt++; } }
      if (this.yzero <= 100) { this.yzero = 100; this.ttype = 1; this.yadd = this.yadd2; }
    }
  }
  bbox() { return spriteBBox('spr_heartpurple_center', this.x, this.y); }
  draw(ctx) {
    ctx.strokeStyle = PURPLE; ctx.lineWidth = 1;
    for (let i = 0; i < this.yamt; i++) {
      const y = Math.round(this.yzero + this.yspace * i + this.yoff) + 0.5;
      ctx.beginPath(); ctx.moveTo(this.xmid - this.xlen, y); ctx.lineTo(this.xmid + this.xlen, y); ctx.stroke();
    }
    drawSprite(ctx, 'spr_heartpurple_center', Math.floor(this.frame), this.x, this.y);
  }
}

// ---------------------------------------------------------------- balas (obj_spiderbullet y sus hijos)
class Bullet {
  constructor(kind, choice, side, sf, dmg) {
    this.kind = kind; this.choice = choice; this.side = side; this.sf = sf; this.dmg = dmg;
    this.hs = 0; this.vs = 0; this.alarm = 1; this.visible = false; this.angle = 0; this.ys = 1;
  }
  place(op) {                                  // Alarm_0
    this.y = op.yzero + (this.choice - 1) * op.yspace;
    if (this.kind === 'donut') {
      this.x = this.side === 0 ? op.xmid - op.xlen * 2 : op.xmid + op.xlen * 2;
      this.hs = this.side === 0 ? this.sf : -this.sf;
      if (this.choice === 1) this.vs = Math.abs(this.hs) / 2;
      if (this.choice === 3) this.vs = -Math.abs(this.hs) / 2;
    } else {
      this.x = this.side === 0 ? op.xmid - op.xlen * 2 - 40 : op.xmid + op.xlen * 2 + 40;
      this.hs = this.side === 0 ? this.sf : -this.sf;
    }
    this.visible = true;
  }
  update(op) {
    if (this.alarm > 0 && --this.alarm === 0) this.place(op);
    if (!this.visible) return;
    const lim = this.kind === 'croissant' ? op.xlen * 5 : op.xlen * 2;
    if (this.kind === 'croissant') {           // bumerán: frena, gira y vuelve
      if (this.side === 0) { this.hs -= 0.25; this.angle += 8; } else { this.hs += 0.25; this.angle -= 8; }
    }
    if ((this.hs > 0 && this.x > op.xmid + lim) || (this.hs < 0 && this.x < op.xmid - lim)) this.dead = true;
    if (this.kind === 'donut') {               // rebota entre el hilo de arriba y el de abajo
      if (this.ys < 1) this.ys += 0.1;
      if (this.vs > 0 && this.y > op.yzero + (op.yamt - 1) * op.yspace + 10) { this.y -= this.vs; this.vs = -this.vs; this.ys = 0.6; }
      if (this.vs < 0 && this.y < op.yzero - 10) { this.y -= this.vs; this.vs = -this.vs; this.ys = 0.6; }
    }
    this.x += this.hs; this.y += this.vs;
  }
  sprite() { return this.kind === 'donut' ? 'spr_donutbullet' : this.kind === 'croissant' ? 'spr_croissantr' : 'spr_spiderbullet1'; }
  bbox() { return spriteBBox(this.sprite(), this.x, this.y); }
  draw(ctx) { if (this.visible) drawSprite(ctx, this.sprite(), 0, this.x, this.y, { rot: this.angle, ys: this.ys }); }
}

class VertSpider {                             // obj_vertspider: bajan con los hilos durante la mascota
  constructor(op, dmg, fast) {
    this.y = op.yzero - op.yspace * 2 + op.yoff; this.fakey = this.y;
    this.x = op.xmid - op.xlen + Math.floor(Math.random() * (op.xlen / 10)) * 22;
    this.fakeyamt = 0; this.fakeyoff = 0; this.hs = 0; this.alarm = 2; this.dmg = dmg; this.fast = fast; this.visible = true;
  }
  update(op, b) {
    if (this.alarm > 0 && --this.alarm === 0) this.hs = this.fast ? choose(-1.5, 1.5) : choose(-1, 1);
    this.fakeyoff += op.yadd;
    if (this.fakeyoff > op.yspace) { this.fakeyoff = 0; this.fakeyamt++; }
    this.y = this.fakey + this.fakeyoff + this.fakeyamt * op.yspace;
    if (this.y > 400) this.dead = true;
    const [l, r] = b.ideal();
    if (this.hs > 0 && this.x > r - 6) { this.x -= this.hs; this.hs = -this.hs; }
    if (this.hs < 0 && this.x < l + 6) { this.x -= this.hs; this.hs = -this.hs; }
    this.x += this.hs;
  }
  bbox() { return spriteBBox('spr_spiderbullet1', this.x, this.y); }
  draw(ctx) { drawSprite(ctx, 'spr_spiderbullet1', 0, this.x, this.y); }
}

class HideousCupcake {                         // obj_hideouscupcake: la boca de la mascota abajo de la caja
  constructor(x, y) { this.x = x; this.y = y; this.siner = 0; this.siner2 = 0; this.alpha = 0; this.frame = 0; this.vs = 0; }
  update() {
    this.siner++; this.siner2++;
    if (this.alpha < 1) this.alpha += 0.05;
    this.x += Math.sin(this.siner2 / 6); this.y += Math.sin(this.siner / 8) * 3 + this.vs;
    this.frame += 0.125;
  }
  draw(ctx) { drawSprite(ctx, 'spr_hideouscupcake', Math.floor(this.frame), this.x, this.y, { alpha: this.alpha }); }
}

class CupcakeMonster {                         // obj_grosscupcake2: la mascota asoma por la derecha
  constructor(x, y) { this.x = x; this.y = y; this.t = 0; this.frame = 0; }
  update() { this.t++; if (this.t === 30) this.frame = 1; if (this.t >= 200) this.dead = true; this.x += Math.random() * 2 - 1; this.y += Math.random() * 2 - 1; }
  draw(ctx) { drawSprite(ctx, 'spr_cupcakemonster', this.frame, this.x, this.y); }
}

// ---------------------------------------------------------------- un turno de Muffet (obj_spiderbulletgen + obj_fakeborderdraw)
class MuffetAttack {
  constructor(b, type, pet) {
    this.b = b; this.type = type; this.heart = b.pheart;
    this.bullets = []; this.cupcake = null; this.monster = null;
    const P = PATTERNS[type];
    this.list = P.list; this.bno = 0; this.alarm2 = pet ? 30 : 10; this.genAlive = true;
    this.dmg = b.enemy.atk - b.atkdown;
    this.pet = pet ? { con: 0, xx: 0, yy: 0, siner: 0, factor: 0, rot: 0, rotfactor: 0, moved: false, gen2: null } : null;
  }

  spawn(btype, sf, choice, side) {             // obj_spiderbulletgen Alarm_2
    const dmg = this.dmg - (this.b.turnamtNow >= 15 ? 1 : 0);
    const kind = ['spider', 'donut', 'croissant'][btype];
    if (btype < 3) {
      this.bullets.push(new Bullet(kind, choice === 0 ? choose(1, 2, 3) : choice, side === 2 ? choose(0, 1) : side, sf, dmg));
    } else {
      const pair = { 1: [1, 2], 2: [1, 3], 3: [2, 3] }[choice] || [1, 2];
      const sd = side === 2 ? choose(0, 1) : side;
      for (const c of pair) this.bullets.push(new Bullet('spider', c, sd, sf, dmg));
    }
  }

  update(inp) {
    const b = this.b, op = this.heart;
    if (op) op.update(inp);
    if (this.genAlive && this.alarm2 > 0 && --this.alarm2 === 0 && this.bno < this.list.length) {
      const [bt, sf, ch, sd, tm] = this.list[this.bno];
      this.spawn(bt, sf, ch, sd);
      this.alarm2 = tm === 0 ? b.firingrate : tm;
      if (++this.bno >= this.list.length) this.alarm2 = -1;
    }
    if (this.pet) this.updatePet();
    if (op) for (const s of this.bullets) s.update(op, b);
    this.bullets = this.bullets.filter(s => !s.dead);
    if (this.cupcake) this.cupcake.update();
    if (this.monster) { this.monster.update(); if (this.monster.dead) this.monster = null; }
    if (op) {                                  // obj_spiderbulletparent Collision con el alma morada
      const hb = op.bbox();
      for (const s of this.bullets) {
        if (!s.visible) continue;
        const bb = s.bbox();
        if (bb.x1 <= hb.x2 && bb.x2 >= hb.x1 && bb.y1 <= hb.y2 && bb.y2 >= hb.y1) b.hurtPlayer(s.dmg);
      }
    }
  }

  // obj_fakeborderdraw (pattern 1): la caja sale por la izquierda, vuelve tambaleándose, aparece la mascota,
  // la caja crece hacia arriba y los hilos bajan hacia su boca.
  updatePet() {
    const P = this.pet, b = this.b, [l, , t] = b.ideal();
    if (!P.moved) { P.xx = l - 60; P.moved = true; }
    P.yy = b.box.t;
    if (P.con === 0) { P.siner = 0; P.factor = 20; if (P.xx >= -60) P.xx -= 10; if (P.xx <= -60) P.con = 1; }
    else if (P.con === 1) {
      P.xx += 1;
      if (P.xx >= 140) this.genAlive = false;
      P.siner++;
      if (P.xx >= 160) { P.xx = 160; P.factor -= 2; if (P.factor <= 1) { P.factor = 0; P.con = 2; } }
    } else if (P.con === 2) {
      b.setBorder(23);
      this.monster = new CupcakeMonster(b.box.r + 10, b.box.b - 122);
      P.con = 3; b.later(60, () => { P.con = 4; });
    } else if (P.con === 4) {
      b.setBorder(22); this.heart.ttype = 3; P.con = 5;
      const tn = b.turnamtNow + 1;                // obj_spiderb.turnamt ya se incrementó
      P.gen2 = { alarm: 60, rate: tn === 5 ? 22 : tn === 10 ? 18 : 16, fast: tn !== 5, dmg: this.dmg - (tn === 16 ? 1 : 0) };
      if (tn === 10) this.heart.yadd2 = 4;
      if (tn === 16) this.heart.yadd2 = 5;
      P.siner = 0; P.rotfactor = 5;
    } else if (P.con === 5) {
      if (this.heart.yadd < 5 && this.heart.ttype === 1) this.heart.yadd += 0.01;
      P.siner++;
      if (b.turntimer < 80 && P.rotfactor > 0) P.rotfactor = Math.max(0, P.rotfactor - 0.1);
      if (P.rotfactor < 1e-5 && b.turntimer < 80 && b.turnamtNow + 1 === 16 && !b.single) {   // la cena: termina la escena
        b.turntimer = 370; P.con = 6; P.gen2 = null;
      }
    } else if (P.con === 6) {
      b.setBorder(21);
      b.heartFree = { x: this.heart.x - 8, y: this.heart.y - 8 };
      this.heart = null; b.pheart = null;
      if (this.cupcake) this.cupcake.vs = 4;
      this.bullets = this.bullets.filter(s => !(s instanceof VertSpider));
      P.con = 7; b.later(40, () => { P.con = 8; });
    } else if (P.con === 8) {
      this.cupcake = null; this.pet = null;
      b.startStory(50);
      return;
    }
    if (P.gen2 && this.heart && --P.gen2.alarm <= 0) {                    // tres arañas cayendo cada pocos frames
      for (let i = 0; i < 3; i++) this.bullets.push(new VertSpider(this.heart, P.gen2.dmg, P.gen2.fast));
      P.gen2.alarm = P.gen2.rate;
    }
    if ((P.con === 7 || P.con === 8) && b.heartFree && b.heartFree.y < b.box.t + 20) b.heartFree.y = b.box.t + 20;
  }

  // desplazamiento/giro con que se ve la caja durante la mascota (la imagen capturada de obj_fakeborderdraw)
  transform() {
    const P = this.pet; if (!P || P.con > 5) return null;
    const l = this.b.box.l, dx = P.xx + 60 - l;
    let dy = 0, rot = 0;
    if (P.con === 1) dy = Math.sin(P.siner / 6) * P.factor;
    if (P.con === 5) rot = Math.sin(P.siner / 10) * P.rotfactor;
    return { dx, dy, rot };
  }

  drawPlayfield(ctx) {
    const b = this.b, { l, r, t, b: bot } = b.box;
    b.drawBoxRaw(ctx);
    ctx.save(); ctx.beginPath(); ctx.rect(l + 5, t + 5, r - l - 5, bot - t - 5); ctx.clip();
    if (this.cupcake) this.cupcake.draw(ctx);
    if (this.monster) this.monster.draw(ctx);
    ctx.restore();
    if (this.heart) this.heart.draw(ctx);
    for (const s of this.bullets) s.draw(ctx);
    if (b.heartFree) drawSprite(ctx, 'spr_heartpurple', 0, b.heartFree.x, b.heartFree.y);
  }

  draw(ctx) {
    const tr = this.transform();
    if (!tr) { this.drawPlayfield(ctx); return; }
    // se dibuja la caja en una capa aparte y se pega desplazada/girada (sprite_create_from_screen del juego)
    const layer = this.b.layer();
    const g = layer.getContext('2d'); g.clearRect(0, 0, 640, 480);
    this.drawPlayfield(g);
    const { l, r, t, b: bot } = this.b.box, px = (l + r) / 2 + 40, py = (t + bot) / 2 + 4;
    ctx.save();
    ctx.translate(px + tr.dx, py + tr.dy); ctx.rotate(-tr.rot * Math.PI / 180); ctx.translate(-px, -py);
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- arañitas con carteles
class SignSpider {                             // obj_signspider: "Up Next" con el siguiente ataque
  constructor(signno) { this.x = 650; this.y = 230; this.hs = -10; this.con = 0; this.signimg = 0; this.buffer = 15; this.signno = signno; this.frame = 0; this.ispd = 0.5; }
  update(b) {
    if (this.x < 580 && this.con === 0) this.hs += 1;
    if (this.x < 580 && this.hs === 0 && this.con === 0) { this.con = 1; this.ispd = 0; this.frame = 1; }
    if (this.con === 1 && this.signimg < 4) this.signimg += 0.5;
    this.buffer--;
    if ((b.state !== 'menu') && this.con < 2 && this.buffer < 1) this.con = 2;
    if (this.con === 2) { this.signimg -= 0.5; if (this.signimg < 1) this.con = 3; }
    if (this.con === 3) { this.ispd = 0.5; if (this.hs < 10) this.hs += 1; if (this.x > 650) this.dead = true; }
    this.x += this.hs; this.frame += this.ispd;
  }
  draw(ctx) {
    drawSprite(ctx, 'spr_tinyspider', this.frame, this.x, this.y, { xs: 2, ys: 2 });
    if (this.con === 1 || this.con === 2) {
      drawSprite(ctx, 'spr_tinyspider_sign', this.signimg, this.x, this.y, { xs: 2, ys: 2 });
      if (this.signimg >= 4 && this.con === 1) {
        const w = drawText(ctx, 'fnt_small', 'Up Next', -999, -999);
        drawText(ctx, 'fnt_small', 'Up Next', Math.round(this.x - w / 2), this.y - 106);
        const n = this.signno, x = this.x, y = this.y - 70, spr = (s, dx) => drawSprite(ctx, s, 0, x + dx, y);
        if ([0, 1, 6, 10].includes(n)) spr('spr_spiderbullet1', 0);
        if (n === 8) spr('spr_croissantl', 0);
        if (n === 12) { spr('spr_croissantl', -15); spr('spr_croissantl', 5); }
        if ([2, 13].includes(n)) { spr('spr_spiderbullet1', -15); spr('spr_spiderbullet1', 15); }
        if (n === 11) { spr('spr_donutbullet', -15); spr('spr_donutbullet', 15); }
        if ([3, 5, 7].includes(n)) { spr('spr_spiderbullet1', -15); spr('spr_donutbullet', 5); }
        if ([4, 9, 15].includes(n)) spr('spr_cupcakebullet', 0);
        if (n === 14) { spr('spr_spiderbullet1', -25); spr('spr_donutbullet', 0); spr('spr_croissantl', 25); }
      }
    }
  }
}

class TelegramSpider {                         // obj_telegramspider
  constructor() { this.x = 670; this.y = 230; this.hs = -6; this.con = 0; this.siner = 0; this.frame = 0; }
  update() {
    this.siner++; this.frame += 0.25;
    if (this.con === 0 && this.x < 570) { this.hs += 0.2; if (this.hs >= 0) { this.hs = 0; this.con = 1; } }
    if (this.con === 2) { this.hs += 1; if (this.x > 700) this.dead = true; }
    this.x += this.hs;
  }
  draw(ctx) {
    drawSprite(ctx, 'spr_tinyspider', this.frame, this.x, this.y, { xs: 2, ys: 2 });
    drawSprite(ctx, 'spr_spidertelegram', 0, this.x - 4, this.y - 2, { xs: 2, ys: 2, rot: Math.sin(this.siner / 10) * 10 });
  }
}

class PourDrop {  // cae hasta el fondo de la caja y suma 4 al "purple" del cuerpo                               // obj_spiderpour: té de arañas que llena la caja
  constructor(x, y, dir) {
    this.x = x; this.y = y; this.hs = -1 * dir; this.vs = 3; this.sc = 0.2;
    this.gdir = dir > 0 ? 320 : 220; this.visible = true;
  }
  update(b) {
    if (this.sc < 1) this.sc += 0.05;
    const g = 0.2, gr = this.gdir * Math.PI / 180;
    this.hs += Math.cos(gr) * g; this.vs += -Math.sin(gr) * g;
    this.x += this.hs; this.y += this.vs;
    if (this.y > b.box.b - 15) { this.dead = true; if (!b.purpleDone) b.purple += 4; }
  }
  draw(ctx) {
    if (!this.visible) return;
    const dir = Math.atan2(-this.vs, this.hs) * 180 / Math.PI;
    drawSprite(ctx, 'spr_spiderpour', 0, this.x, this.y, { xs: this.sc, ys: this.sc, rot: dir + 90 });
  }
}

// ============================================================================
export class MuffetBattle extends Battle {
  constructor(single = null) { super(single); }

  reset() {
    super.reset();
    this.enemy = { hp: 1250, maxHp: 1250, atk: 8, def: 0, x: 214, y: 37, wd: 216 };   // scr_monstersetup tipo 39
    this.enemyName = 'Muffet';
    this.body = new MuffetBody(214 + 62, 37 - 2);
    this.body.onPourDrop = (x, y, dir) => { const d = new PourDrop(x, y, dir); if (this.purple > 80) d.visible = false; this.drops.push(d); };
    this.flavor = T.intro;
    this.turnamt = this.single ? this.single.type : 0; this.turnamtNow = this.turnamt;
    this.con = this.single ? 4 : 0; this.purpletime = this.single ? 1 : 0; this.talktime = 0;
    this.struggle = 0; this.bribes = 0; this.price = 10; this.gold = 100; this.atkdown = 0; this.spareable = false;
    this.soul = this.single ? 'spr_heartpurple' : 'spr_heart';
    this.pheart = null; this.heartFree = null; this.drops = []; this.purple = 0; this.sign = null; this.telegram = null;
    this.actPos = 0;
  }

  // ---------------------------------------------------------------- ganchos de la base
  startIntro() { playMusic('spider'); if (this.single) this.startEnemyTurn(); else this.startMenu(); }
  enemyTake(d) { return d; }
  missPos() { return [this.enemy.x + 216 / 2 - 48, this.enemy.y - 24]; }
  dmgPos() { return [this.enemy.x, this.enemy.y + 208 - 60]; }
  onEnemyHit() { playSound('damage'); this.body.hurt = 1; this.body.shake = 8; this.body.shakeRate = 2; this.later(11, () => playSound('hurtgirl')); }
  afterEnemyDamage() {
    this.body.hurt = 0;
    if (this.enemy.hp <= 0) this.startDeath(); else this.startEnemyTurn();
  }
  bubblePos() { return [214 + 110 + 60, 37 - 10]; }
  newBubbleWriter() { const bl = this.bubble, [bx, by] = this.bubblePos(); bl.writer = new Writer(bl.msgs[bl.i], bx + 25, by + 10, TYPER33); }
  layer() { if (!this._layer) { this._layer = document.createElement('canvas'); this._layer.width = 640; this._layer.height = 480; } return this._layer; }

  ideal() {
    const n = this.border;
    const off = this.pheart ? Math.min(this.pheart.yzero, 250) : 0;
    if (n === 21) return [197, 437, 250, 385];
    if (n === 22) return [197, 437, off ? off - 10 : 250, 385];
    if (n === 23) return [197, 537, off ? off - 10 : 250, 385];
    return BORDER[n];
  }

  drawBoxRaw(ctx) { Battle.prototype.drawBox.call(this, ctx); }
  drawBox(ctx) {
    if (this.attack) return;                   // durante el turno la caja la dibuja el ataque (puede moverse)
    this.drawBoxRaw(ctx);
    if (this.purple > 0) {                     // el té morado llenando la caja
      const { l, r, t, b } = this.box, p2 = Math.min(this.purple, b - t);
      ctx.save(); ctx.globalAlpha = this.purple > 160 ? Math.max(0, 1 - (this.purple - 160) / 40) : 1;
      ctx.fillStyle = PURPLE; ctx.fillRect(l + 2, b - p2, r - l, p2 + 2); ctx.restore();
    }
    if (this.pheart) this.pheart.draw(ctx);
    if (this.heartFree) drawSprite(ctx, 'spr_heartpurple', 0, this.heartFree.x, this.heartFree.y);
  }

  drawEnemy(ctx) {
    this.body.boxTop = this.box.t;
    this.body.draw(ctx);
    if (this.dust) this.dust.draw(ctx);
  }
  drawExtra(ctx) {
    for (const d of this.drops) d.draw(ctx);
    if (this.sign) this.sign.draw(ctx);
    if (this.telegram) this.telegram.draw(ctx);
    if (this.pheart && !this.attack && (this.state === 'mTalk' || this.state === 'mPour' || this.state === 'mStory')) {}   // ya dibujado en la caja
  }
  drawHeart(ctx) {
    if (['mTalk', 'mPour', 'mAttack', 'mStory', 'mEnd'].includes(this.state)) {
      const h = this.pheart;
      if (h) { this.hx = h.x - 8; this.hy = h.y - 8; }
      else if (!this.heartFree && this.state !== 'mAttack') {   // alma normal en el centro de la caja
        const [l, r, t, b] = this.ideal(); this.hx = Math.round((l + r) / 2) - 8; this.hy = Math.round((t + b) / 2) - 8;
        drawSprite(ctx, this.soul, 0, this.hx, this.hy);
      }
      return;
    }
    if (this.state === 'actList') {            // cuadrícula: Check | Struggle / Pay
      this.hx = 72 + (this.actPos === 1 ? 256 : 0); this.hy = 278 + (this.actPos === 2 ? 32 : 0);
      drawSprite(ctx, this.soul, 0, this.hx, this.hy); return;
    }
    super.drawHeart(ctx);
  }

  // ---------------------------------------------------------------- menús propios (ACT y MERCY)
  drawSubmenu(ctx) {
    const x = BORDER[0][0] + 20, y = BORDER[0][2] + 20, line = (s, dx = 0, dy = 0, color = '#fff') => drawText(ctx, 'fnt_main', s, x + dx, y + dy, { mono: 16, color });
    if (this.state === 'fightTarget' || this.state === 'actTarget') {
      line('   * Muffet');
      if (this.state === 'fightTarget') {
        const bx = x + 16 * 14, w = 101, hp = Math.ceil(this.enemy.hp / this.enemy.maxHp * w);
        ctx.fillStyle = '#f00'; ctx.fillRect(bx, y + 5, w, 17); ctx.fillStyle = '#0f0'; ctx.fillRect(bx, y + 5, hp, 17);
      }
    }
    if (this.state === 'actList') {            // SCR_TEXT_6374
      line('   * Check'); line('   * Struggle', 16 * 16); line(`   * Pay ${this.price}G`, 0, 32);
      line(`Your Money: ${this.gold}G`, 16 * 9, 64, '#ff0');
    }
    if (this.state === 'mercyList') line('   * Spare', 0, 0, this.spareable ? '#ff0' : '#fff');
    if (this.state === 'itemList') super.drawSubmenu(ctx);
  }
  updateSub(inp) {
    if (this.state === 'actList') {
      if (inp.cancel) { this.go('actTarget'); return; }
      if (inp.right && this.actPos === 0) { this.actPos = 1; playSound('squeak'); }
      if (inp.left && this.actPos === 1) { this.actPos = 0; playSound('squeak'); }
      if (inp.down && this.actPos === 0) { this.actPos = 2; playSound('squeak'); }
      if (inp.up && this.actPos === 2) { this.actPos = 0; playSound('squeak'); }
      if (inp.confirm) { playSound('select'); this.doAct(this.actPos); }
      return;
    }
    if (this.state === 'mercyList' && inp.confirm) {
      playSound('select');
      if (this.spareable) { this.win(0, 100 + Math.round(this.price / 2)); return; }
      this.startEnemyTurn(); return;
    }
    if (this.state === 'actTarget' && inp.confirm) { playSound('select'); this.actPos = 0; this.go('actList'); return; }
    super.updateSub(inp);
  }

  doAct(pos) {
    let msgs;
    if (pos === 0) msgs = [T.check];
    if (pos === 1) {                           // Struggle
      const s = this.struggle;
      if (this.con > 50) msgs = ['* You struggle to escape the web^1.&* Nothing happened./'];
      else if (s === 0) msgs = ['* You struggle to escape the web^1.&* Muffet covers her mouth&  and giggles at you./'];
      else if (s === 1) msgs = ['* You struggle to escape the web^1.&* Muffet laughs and claps&  her hands./'];
      else if (s === 2) {
        msgs = ['* You struggle to escape the web./', '* Muffet is so amused by your&  antics that she gives you a&  discount!/'];
        this.price = this.price <= this.gold ? Math.max(1, Math.ceil(this.price / 2)) : Math.max(1, this.gold);
      } else msgs = ['* You struggle to escape the web^1.&* Nothing happened./'];
      this.struggle++;
    }
    if (pos === 2) {                           // Pay
      if (this.con >= 50) msgs = ['* Muffet refuses your money./'];
      else if (this.gold >= this.price) {
        msgs = [`* You pay ${this.price}G^1.&* Muffet reduces her ATTACK&  for this turn!/`];
        this.gold -= this.price; this.bribes++;
        this.price += [0, 30, 40, 70, 50][this.bribes] ?? 300;
        this.atkdown = 2;
      } else if (this.gold === 0 && this.bribes === 0) {
        msgs = ['* You empty your pockets..^1.&* But you don\'t have any&  money at all!/', '* Muffet takes pity on you&  and reduces her ATTACK for&  this turn./'];
        this.price = 10; this.bribes = 1; this.atkdown = 2;
      } else if (this.gold === 0) msgs = ['* You\'re out of money^1.&* Muffet shakes her head./'];
      else { msgs = ['* You empty your pockets^1, but you&  don\'t have enough money.&* Muffet lowers the price./']; this.price = Math.max(1, Math.ceil((this.price - 5) / 10)); }
    }
    this.boxMsgs(msgs, () => this.startEnemyTurn());
  }

  // varios mensajes seguidos en la caja (Z para pasar)
  boxMsgs(msgs, onEnd) {
    this.msgQueue = { msgs, i: 0, onEnd };
    this.writer = new Writer(msgs[0], BORDER[0][0], BORDER[0][2]);
    this.go('mBoxText');
  }

  // ---------------------------------------------------------------- turno de Muffet
  talkMsgs() {                                 // obj_spiderb Alarm_6
    if (this.single) return null;
    if (this.talktime > 0) { const m = T.talkAfter[Math.min(this.talktime, 9) - 1]; this.talktime++; return [m]; }
    if (this.con === 0) return [T.blue];
    return T.talk[this.turnamt] || ['What is it,&deary?/%%'];
  }

  startEnemyTurn() {                           // mnfight = 1
    this.writer = null; this.setBorder(21); this.heartFree = null;
    if (this.purpletime === 1) { this.pheart = new PurpleHeart(this); this.pheart.frame = 0; }
    this.flavor = choose(...T.flavors) + '/^';
    const msgs = this.talkMsgs();
    this.go('mTalk');
    if (msgs) this.dialogue(msgs, 33, () => this.beginAttack());
    else this.later(12, () => this.beginAttack());
  }

  beginAttack() {                              // mnfight = 2
    if (this.con === 0) {                      // primer turno: Muffet sirve té morado
      this.body.startPour(); this.con = 1; this.go('mPour'); return;
    }
    if (this.turnamt >= 20) { this.endTurn(); return; }   // después del telegrama ya no ataca
    const type = this.turnamt; this.turnamtNow = type;
    const pet = PET_TURNS[type] !== undefined;
    this.firingrate = PATTERNS[type].fr;
    this.turntimer = pet ? PET_TURNS[type] : 180 + PATTERNS[type].tt;
    this.attack = new MuffetAttack(this, type, pet);
    this.atkdown = 0; this.hitno = 0;
    if (!this.single) this.turnamt++;
    this.go('mAttack');
  }

  endTurn() {                                  // mnfight = 3
    this.attack = null; this.pheart = null; this.heartFree = null; this.drops = [];
    if (this.purpletime === 1 && !this.sign && this.turnamt < 16) this.sign = new SignSpider(this.turnamt);
    this.startMenu();
  }

  update(inp) {
    super.update(inp);
    for (const d of this.drops) d.update(this);
    this.drops = this.drops.filter(d => !d.dead);
    if (this.sign) { this.sign.update(this); if (this.sign.dead) this.sign = null; }
    if (this.telegram) { this.telegram.update(); if (this.telegram.dead) this.telegram = null; }
    const S = this.state;
    if (S === 'mTalk' || S === 'mStory') { if (this.pheart) this.pheart.update({ held: {} }); this.updateBubble(inp); }
    if (S === 'mBoxText') {
      const q = this.msgQueue;
      if (inp.cancel) this.writer.skip();
      else if (inp.confirm && this.writer.done) {
        if (++q.i < q.msgs.length) this.writer = new Writer(q.msgs[q.i], BORDER[0][0], BORDER[0][2]);
        else { this.writer = null; q.onEnd(); }
      }
    }
    if (S === 'mPour') this.updatePour(inp);
    if (S === 'mAttack') {
      this.turntimer--;
      if (this.attack) this.attack.update(inp);
      if (this.state === 'mAttack' && this.turntimer < 1 && this.attack) this.endTurn();
    }
    if (S === 'dying' || S === 'won') {
      if (this.dust) this.dust.update();
      if (S === 'won' && inp.confirm && this.writer && this.writer.done) this.fadeOut = 0.001;
      if (this.fadeOut > 0) { this.fadeOut += 0.03; if (this.fadeOut >= 1.3 && this.onExit) this.onExit(); }
    }
  }

  updatePour(inp) {                            // té morado -> el alma se vuelve morada
    const h = this.box.b - this.box.t;
    if (this.purple > 125 && this.body.mode === 1) this.body.mode = 0;
    if (this.purpletime === 0 && this.purple > h) {
      this.purpletime = 1; this.soul = 'spr_heartpurple';
      this.pheart = new PurpleHeart(this);
      this.later(60, () => {                   // con 2
        this.dialogue([T.purple], 33, () => { this.con = 4; this.flavor = T.trapped; this.endTurn(); });
      });
    }
    if (this.purpletime === 1 && !this.purpleDone) {            // el té se desvanece
      this.purple += 2;
      if (this.purple >= 210) { this.purple = 0; this.purpleDone = true; }
    }
    if (this.pheart) this.pheart.update({ held: {} });
    this.updateBubble(inp);
  }

  // ---------------------------------------------------------------- después de la cena (con 50...55)
  startStory(con) {
    this.attack = null; this.go('mStory');
    this.dialogue(T.dessert, 33, () => {       // con 51 -> llega el telegrama
      this.telegram = new TelegramSpider();
      this.later(60, () => {                   // con 53
        this.dialogue(T.telegram, 33, () => {  // con 54
          this.telegram.con = 2; this.talktime = 1; this.turnamt = 20; this.spareable = true;
          this.flavor = T.sparing; this.heartFree = null; this.endTurn();
        });
      });
    });
  }

  // ---------------------------------------------------------------- victoria / derrota de Muffet
  win(xp, gold) {
    this.go('won'); this.bubble = null;
    this.writer = new Writer(T.won(xp, gold), BORDER[0][0], BORDER[0][2]);
  }
  startDeath() {                               // obj_spiderb Other_14: se convierte en polvo
    const c = document.createElement('canvas'); c.width = 260; c.height = 260;
    const g = c.getContext('2d'); const bx = this.body.x, by = this.body.y;
    this.body.x = 30; this.body.y = 20; this.body.ystart = 20; this.body.pauser = 1; this.body.draw(g);
    this.body.visible = false;
    this.dust = new Vapor({ x: bx - 30, y: by - 20 }, c);
    playSound('vaporized');
    this.win(300, 0);
  }
}
