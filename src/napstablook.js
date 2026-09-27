import { drawSprite, drawText, playSound, playMusic, stopMusic, spriteBBox, SPR } from './assets.js';
import { Battle, BORDER } from './battle.js';
import { Writer } from './text.js';

// ============================================================================
//  Napstablook (obj_napstablook). Música: "Ghost Fight" (mus_ghostbattle.ogg).
//  Alma roja normal. Si le das ánimos (Cheer) tres veces te enseña su sombrero
//  "dapper blook"; si después vuelves a animarlo (o a coquetear) se va contento.
// ============================================================================

// Ataques sueltos. "Dapper Blook" es el nombre que le da el propio juego; los demás son inventados.
export const NAPSTA_ATTACKS = [
  { name: 'Not Feelin Up To It', kind: 'sad' },     // obj_sadmsggen (primer turno)
  { name: 'Tear Shower', kind: 'cry1' },            // obj_crygen1: lágrimas que caen y rebotan
  { name: 'Crawling Tears', kind: 'cry2' },         // obj_crygen2: lágrimas que trepan por la caja
  { name: 'Dapper Blook', kind: 'dapper' },         // obj_crygen3 + blt_blookhat
];

// Textos (textdata_en, obj_napstablook / obj_crygen3)
const T = {
  intro: '* Here comes Napstablook.',
  check: "* NAPSTABLOOK - ATK 10 DEF 10&* This monster doesn't seem to&  have a sense of humor.../^",
  threat: '* You give Napstablook a&  cruel look./^',
  console: '* You try to console&  Napstablook.../^',
  cheer: { '-400': '* You gave Napstablook a&  patient smile./^', '-300': '* You told Napstablook a&  little joke./^', '-200': '* Napstablook wants to&  show you something./^' },
  random: ["i'm&fine,&thanks.", 'just&pluggin&along...', 'nnnnnn&ggghhh.'],
  flavors: ['* Napstablook is staring into&  the distance.', "* Napstablook is wishing they&  weren't here.", '* Napstablook is pretending to&  sleep.', '* The faint odor of ectoplasm&  permeates the vicinity.'],
  better: '* Napstablook looks just a&  little bit better.',
  better2: "* Cheering seems to have&  improved Napstablook's&  mood again.",
  awaits: '* Napstablook eagerly awaits&  your response.',
  dapper1: 'i call&it&"dapper&blook"', dapper2: 'do&you&like&it...',
  kill: ['umm... you do&know you cant&kill ghosts, right?/', "we're sorta&incorporeal and&all/", 'i was just&lowering my hp&because i didnt&want to be rude/',
         'sorry..^1.&i just made this&more awkward.../', 'pretend you beat&  me.../', 'ooooooooo^1o%%'],
  won: '* YOU WON!&* You lost 1 experience point./%',
};
// global.typer = 2: fnt_plain negro, 9x20, una letra cada 2 frames, SND_TXT1
const TYPER2 = { font: 'fnt_plain', color: '#000', ox: 0, oy: 0, hspace: 9, vspace: 20, speed: 2, shake: 0, sound: 'txtmuffet' };
const NX = 266, NY = 106, NW = 116;                // posición (scr_battlegroup) y ancho del sprite a escala 2

// ---------------------------------------------------------------- física de GameMaker
function gmMove(o) {                               // fricción, gravedad y luego posición (como el runner de GM)
  if (o.friction) {
    const s = Math.hypot(o.hs, o.vs);
    if (s <= o.friction) { o.hs = 0; o.vs = 0; } else { const k = (s - o.friction) / s; o.hs *= k; o.vs *= k; }
  }
  if (o.grav) { const r = o.gdir * Math.PI / 180; o.hs += Math.cos(r) * o.grav; o.vs -= Math.sin(r) * o.grav; }
  o.x += o.hs; o.y += o.vs;
}
const dirOf = o => (Math.atan2(-o.vs, o.hs) * 180 / Math.PI + 360) % 360;
// Caja de colisión con image_angle / escala (la bbox girada alrededor del origen del sprite)
function rotBBox(name, x, y, ang = 0, sc = 1) {
  const s = SPR[name], [l, t, r, b] = s.bbox, a = ang * Math.PI / 180, c = Math.cos(a), si = Math.sin(a);
  const xs = [], ys = [];
  for (const [px, py] of [[l, t], [r + 1, t], [l, b + 1], [r + 1, b + 1]]) {
    const lx = (px - s.ox) * sc, ly = (py - s.oy) * sc;
    xs.push(x + lx * c + ly * si); ys.push(y - lx * si + ly * c);
  }
  return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
}
const hit = (a, b) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
function borders(box) {                            // obj_lborder / rborder / uborder / dborder (5 px de grosor)
  const { l, r, t, b } = box;
  return { L: { x1: l, y1: t, x2: l + 5, y2: b + 5 }, R: { x1: r, y1: t, x2: r + 5, y2: b + 5 },
           U: { x1: l, y1: t, x2: r + 5, y2: t + 5 }, D: { x1: l, y1: b, x2: r + 5, y2: b + 5 } };
}

// ---------------------------------------------------------------- balas
class Flash {                                      // blt_gen: destello de 3 frames donde nace cada lágrima
  constructor(x, y) { this.x = x; this.y = y; this.f = 0; }
  update() { if (++this.f >= 3) this.dead = true; }
  draw(ctx) { drawSprite(ctx, 'spr_bulletgenmd', this.f, this.x, this.y); }
}

class CryBullet {                                  // blt_crybullet: cae, rebota en los lados, se deshace abajo
  constructor(a, x, y, dmg) {
    this.x = x; this.y = y; this.dmg = dmg;
    this.grav = 0.4; this.gdir = 270; this.hs = Math.random() * 10 - 6.1; this.vs = 4; this.friction = 0.4;
    this.sc = Math.random() * 0.4 + 0.8; this.angle = 0;
    a.fx.push(new Flash(x + (12 * this.sc / 2 - 8), y + (12 * this.sc / 2 - 8)));
  }
  update(a) {
    this.angle = dirOf(this) + 90;
    if (this.y > a.b.ideal()[3]) { this.dead = true; return; }
    gmMove(this);
    const bb = this.bbox(), B = borders(a.b.box);
    if (hit(bb, B.L) || hit(bb, B.R)) this.hs = -this.hs;
    if ((hit(bb, B.D) && this.vs > 0) || (hit(bb, B.U) && this.vs < 0)) this.dead = true;
  }
  bbox() { return rotBBox('spr_teardrop', this.x, this.y, this.angle, this.sc); }
  draw(ctx) { drawSprite(ctx, 'spr_teardrop', 0, this.x, this.y, { xs: this.sc, ys: this.sc, rot: this.angle }); }
}

class CryBullet2 {                                 // blt_crybullet2: lágrimas que suben a llenar el sombrero (no hacen daño)
  constructor(a, x, y) {
    this.x = x; this.y = y; this.dmg = 0; this.harmless = true;
    this.grav = 0.5; this.gdir = 90; this.hs = Math.random() * 6 - 2; this.vs = 2; this.friction = 0.2;
    this.sc = Math.random() * 0.4 + 0.8; this.angle = 0; this.alpha = 1; this.disappear = 0; this.outside = 0;
    a.fx.push(new Flash(x + (12 * this.sc / 2 - 8), y + (12 * this.sc / 2 - 8)));
  }
  update(a) {
    this.angle = dirOf(this) + 90;
    if (this.disappear) { this.alpha -= 0.08; if (this.alpha < 0.1) { this.dead = true; return; } }
    gmMove(this);
    if (this.y < -20 && ++this.outside > 450) this.dead = true;
    if (a.hat && hit(this.bbox(), a.hat.bbox())) { this.disappear = 1; a.hat.dongle--; }
  }
  bbox() { return rotBBox('spr_teardrop', this.x, this.y, this.angle, this.sc); }
  draw(ctx) { drawSprite(ctx, 'spr_teardrop', 0, this.x, this.y, { xs: this.sc, ys: this.sc, rot: this.angle, alpha: this.alpha }); }
}

class StreamBullet {                               // blt_streambullet: cae, recorre el borde, trepa y se deja caer sobre ti
  constructor(a, x, y, dmg) {
    this.x = x; this.y = y; this.dmg = dmg;
    this.grav = 0.2; this.gdir = 270; this.vs = 2; this.hs = 0.4;
    this.frame = 0; this.dropdown = 0; this.rbord = 0; this.angle = 0; this.alpha = 1;
    a.fx.push(new Flash(x + (18 / 2 - 8), y + (18 / 2 - 8)));
  }
  update(a) {
    const h = a.b.heart;
    if (this.dropdown === 1 && this.x > h.x - 4 && this.x < h.x + 10) {          // Begin Step: justo encima del alma, cae
      this.grav = 0.1; this.gdir = 270; this.hs = 0; this.vs = 1.5; this.dropdown = 0; this.angle = 0;
    }
    gmMove(this);
    this.frame += 0.25;
    const B = borders(a.b.box);
    if (hit(this.bbox(), B.D)) {                   // Collision obj_dborder: se pega al suelo y corre a un lado
      this.angle = 270; this.dropdown = 0; this.alpha = 1; this.y -= 4;
      if (Math.random() * 2 >= 1) { this.gdir = 0; this.hs = 2; this.vs = 0; } else { this.gdir = 180; this.hs = -2; this.vs = 0; }
    }
    if (hit(this.bbox(), B.R)) {                   // obj_rborder: trepa por la derecha
      this.angle = 180; this.x -= 5;
      if (this.hs > 0) { this.rbord = 1; this.gdir = 90; this.hs = 0; this.vs = -2; }
    }
    if (hit(this.bbox(), B.U) && this.vs < 0) {    // obj_uborder: corre por el techo hacia el alma
      this.angle = 270;
      if (this.rbord === 0) { this.y += 6; this.x += 6; } else { this.y += 2; this.x -= 2; }
      if (h.x > this.x) { this.hs = -this.vs; this.vs = 0; this.gdir = 0; }
      if (h.x < this.x) { this.hs = this.vs; this.vs = 0; this.gdir = 180; }
      this.dropdown = 1;
    }
    if (hit(this.bbox(), B.L)) {                   // obj_lborder: trepa por la izquierda
      this.angle = 0;
      if (this.hs < 0) { this.rbord = 0; this.x -= 3; this.gdir = 90; this.hs = 0; this.vs = -2; }
    }
  }
  bbox() { return rotBBox('spr_streambullet', this.x, this.y, this.angle); }
  draw(ctx) { drawSprite(ctx, 'spr_streambullet', Math.floor(this.frame), this.x, this.y, { rot: this.angle, alpha: this.alpha }); }
}

class BlookHat {                                   // blt_blookhat: se llena con las lágrimas (6 frames)
  constructor(x, y) { this.x = x; this.y = y; this.frame = 0; this.dongle = 10; this.finished = 0; }
  update() {
    if (this.dongle < 1) { this.dongle = 22; if (this.frame < 5) this.frame++; if (this.frame === 5) this.finished = 1; }
  }
  bbox() { return rotBBox('spr_blookhat', this.x, this.y, 0, 2); }
  draw(ctx) { drawSprite(ctx, 'spr_blookhat', this.frame, this.x, this.y, { xs: 2, ys: 2 }); }
}

// ---------------------------------------------------------------- generadores (obj_crygen1/2/3, obj_sadmsggen)
class NapstaAttack {
  constructor(b, kind) {
    this.b = b; this.kind = kind; this.bullets = []; this.fx = []; this.alarm = 10;
    this.dmg = b.enemy.atk;
    if (kind === 'sad') { const [l, , t] = b.ideal(); this.sx = l + 30; this.sy = t + 30; this.x = this.sx; this.y = this.sy; }
    if (kind === 'dapper') { this.hat = new BlookHat(NX + 34, NY - 30); b.hat = this.hat; this.a1 = 60; }
  }
  update(held) {
    const b = this.b;
    if (this.kind === 'sad') { this.x = this.sx + Math.random() * 2 - 1; this.y = this.sy + Math.random() * 2 - 1; }
    else if (--this.alarm <= 0) {                  // Alarm_0: dos lágrimas, una de cada ojo
      this.alarm = b.firingrate;
      if (this.kind === 'cry1') this.bullets.push(new CryBullet(this, NX + 52, NY + 48, this.dmg), new CryBullet(this, NX + 82, NY + 58, this.dmg));
      if (this.kind === 'cry2') this.bullets.push(new StreamBullet(this, NX + 52, NY + 48, this.dmg), new StreamBullet(this, NX + 82, NY + 56, this.dmg));
      if (this.kind === 'dapper') this.bullets.push(new CryBullet2(this, NX + 52, NY + 48), new CryBullet2(this, NX + 82, NY + 58));
    }
    if (this.kind === 'dapper') this.updateDapper();
    for (const f of this.fx) f.update(); this.fx = this.fx.filter(f => !f.dead);
    const hb = spriteBBox('spr_heart', b.heart.x, b.heart.y);
    for (const s of this.bullets) {
      s.update(this);
      if (!s.dead && !s.harmless && hit(s.bbox(), hb)) { b.bulletHit(s.dmg); s.dead = true; }   // blt_parent Collision obj_heart
    }
    this.bullets = this.bullets.filter(s => !s.dead);
    if (this.hat) this.hat.update();
  }
  updateDapper() {                                 // obj_crygen3 Alarm_1/2/3: "i call it dapper blook" ... "do you like it..."
    const b = this.b;
    if (this.a1 && --this.a1 === 0) { b.say(T.dapper1, 9999, NX + 150, NY + 24); this.a2 = 100; }
    if (this.a2 && --this.a2 === 0) { b.say(T.dapper2, 9999, NX + 150, NY + 24); this.a3 = 100; }
    if (this.a3 && --this.a3 === 0) { b.nbubble = null; if (!b.single) b.mercymod = -50; b.flavor = T.awaits; }
  }
  draw(ctx) {
    if (this.kind === 'sad') drawSprite(ctx, 'spr_bulletNapstaSad', 0, this.x, this.y);
    for (const s of this.bullets) s.draw(ctx);
    for (const f of this.fx) f.draw(ctx);
  }
}

// ============================================================================
export class NapstablookBattle extends Battle {
  constructor(single = null) { super(single); }

  reset() {
    super.reset();
    this.enemy = { hp: 88, maxHp: 88, atk: 5, def: 4, x: NX, y: NY, wd: NW };   // scr_monstersetup tipo 11
    this.enemyName = 'Napstablook';
    this.body = { shake: 0, shakeRate: 2, shakeX: 0 };                          // no tiembla al recibir daño
    this.flavor = T.intro; this.soul = 'spr_heart';
    this.mercymod = -400; this.whatiheard = -1; this.mercer = 0; this.turn = 0; this.mycommand = 0;
    this.frame = 0; this.alpha = 1; this.hat = null; this.nbubble = null; this.actPos = 0;
  }

  // ---------------------------------------------------------------- ganchos de la base
  startIntro() { playMusic('ghost'); if (this.single) this.startEnemyTurn(); else this.startMenu(); }
  enemyTake(d) { return d; }
  missPos() { return [NX + NW / 2 - 48, NY - 24]; }
  dmgPos() { return [NX + NW / 2 - 48, NY - 20]; }
  onEnemyHit() { playSound('damage'); }
  afterEnemyDamage() { this.whatiheard = -1; if (this.enemy.hp <= 0) this.startKill(); else this.startEnemyTurn(); }
  ideal() { return BORDER[this.border] || ({ 3: [237, 397, 250, 385], 5: [192, 442, 250, 385] })[this.border]; }

  // Daño de las balas (blt_parent Collision obj_heart): sin los extras por HP de scr_damagestandard
  bulletHit(dmg) {
    if (this.invc >= 1 || this.state === 'gameover') return;
    const p = this.player, amt = Math.max(1, Math.round(dmg - (p.df + p.armor.def) / 5));
    p.hp = Math.max(0, p.hp - amt);
    playSound('hurt'); this.shake = 2; this.invc = 20;
    if (p.hp <= 0) { this.go('gameover'); this.attack = null; }
  }

  // Globo pequeño (obj_blconsm) con el texto de Napstablook; se cierra solo
  say(text, time, x = NX + NW + 21, y = NY + 24) {
    this.nbubble = { x, y, time, writer: new Writer(text, x + 21, y + 10, TYPER2) };
  }

  // ---------------------------------------------------------------- ACT (cuadrícula de 2 columnas x 3 filas)
  drawSubmenu(ctx) {
    const x = BORDER[0][0] + 20, y = BORDER[0][2] + 20, line = (s, dx = 0, dy = 0) => drawText(ctx, 'fnt_main', s, x + dx, y + dy, { mono: 16 });
    if (this.state === 'fightTarget' || this.state === 'actTarget') {
      line('   * Napstablook');
      if (this.state === 'fightTarget') {
        const bx = x + 16 * 17, w = 101, hp = Math.ceil(this.enemy.hp / this.enemy.maxHp * w);
        ctx.fillStyle = '#f00'; ctx.fillRect(bx, y + 5, w, 17); ctx.fillStyle = '#0f0'; ctx.fillRect(bx, y + 5, hp, 17);
      }
    }
    if (this.state === 'actList') { line('   * Check'); line('   * Flirt', 256); line('   * Threat', 0, 32); line('   * Cheer', 256, 32); }   // SCR_TEXT_6041
    if (this.state === 'mercyList') line('   * Spare');
    if (this.state === 'itemList') super.drawSubmenu(ctx);
  }
  updateSub(inp) {
    if (this.state === 'actList') {
      if (inp.cancel) { this.go('actTarget'); return; }
      const col = Math.floor(this.actPos / 3), row = this.actPos % 3;
      if ((inp.right && col === 0) || (inp.left && col === 1)) { this.actPos = (1 - col) * 3 + row; playSound('squeak'); }
      if ((inp.down && row === 0) || (inp.up && row === 1)) { this.actPos = col * 3 + (1 - row); playSound('squeak'); }
      if (inp.confirm) { playSound('select'); this.doAct(this.actPos); }
      return;
    }
    if (this.state === 'actTarget' && inp.confirm) { playSound('select'); this.actPos = 0; this.go('actList'); return; }
    if (this.state === 'mercyList' && inp.confirm) { playSound('select'); this.whatiheard = -1; this.mercer = 1; this.startEnemyTurn(); return; }
    super.updateSub(inp);
  }
  useItem(i) { this.whatiheard = -1; super.useItem(i); }

  doAct(pos) {                                     // obj_napstablook Step (myfight == 2)
    this.whatiheard = pos;
    const box = msg => { this.writer = new Writer(msg, BORDER[0][0], BORDER[0][2]); this.go('actText'); };
    if (pos === 0) return box(T.check);
    if (pos === 1) return box(T.threat);
    if (pos === 3) {                               // Flirt: sin texto, Napstablook contesta directamente
      if (this.mercymod === -50 && !this.single) { this.mercymod = -49; stopMusic(); }
      return this.startEnemyTurn();
    }
    if (pos === 4) {                               // Cheer
      if (this.mercymod === -50 && !this.single) { this.mercymod = -49; stopMusic(); return this.startEnemyTurn(); }
      const msg = this.mercymod < -400 ? T.console : T.cheer[this.mercymod] || T.console;
      if (!this.single) this.mercymod += 100;
      return box(msg);
    }
  }

  // ---------------------------------------------------------------- turno de Napstablook
  talkLine() {                                     // Alarm_6: qué dice en el globo
    const m = this.mycommand, w = this.whatiheard, mm = this.mercymod;
    let s = m < 40 ? T.random[0] : m < 66 ? T.random[1] : T.random[2];
    if (w === 0) s = "oh, i'm&REAL&funny.";
    if (w === 1) s = 'go&ahead,&do it.';
    if (w === 3) s = "i'd just&weigh&you&down.";
    if (w === 4) s = 'heh...';
    if (w === 4 && mm > -300) s = 'heh&heh...';
    if (w === 4 && mm > -200) s = 'let me&try...';
    if (w !== 4 && w !== 3 && mm === -50 && this.mercer === 0) {   // no le gustó tu respuesta
      s = 'i knew&it...'; this.mercymod = -1200; this.hat = null;
    }
    if (w === 3 && mm === -49) s = 'oh&no...';
    if (w === 4 && mm === -49) s = 'oh&gee...';
    return s;
  }

  startEnemyTurn() {                               // mnfight = 1
    this.writer = null; this.turn++;
    this.mycommand = Math.round(Math.random() * 100);
    if (!this.single && this.mercymod === -49) {   // se va contento: fin de la pelea
      this.say(this.talkLine(), 400); this.go('nLeave'); return;
    }
    this.setBorder((this.single ? this.single.kind === 'sad' : this.turn === 1) ? 5 : 3);
    const [l, r, t, b] = this.ideal();
    this.heart = { x: Math.round((l + r) / 2) - 8, y: Math.round((t + b) / 2) - 8 };
    this.go('nTalk');
    if (this.single) { this.nbubble = null; this.talkTimer = 12; }
    else { this.say(this.talkLine(), 75); this.talkTimer = null; }
    this.mercer = 0;
  }

  beginAttack() {                                  // mnfight = 2
    this.nbubble = null; this.whatiheard = -1;
    let kind;
    if (this.single) kind = this.single.kind;
    else if (this.mercymod === -100) kind = 'dapper';
    else if (this.turn === 1) kind = 'sad';
    else kind = this.mycommand <= 50 ? 'cry1' : 'cry2';
    const mm = this.single ? -400 : this.mercymod;
    if (kind === 'cry1') { this.turntimer = 140; this.firingrate = 4000 / -mm; }
    if (kind === 'cry2') { this.turntimer = 170; this.firingrate = 3600 / -mm; }
    if (kind === 'sad') this.turntimer = 140;
    if (kind === 'dapper') { this.turntimer = 260; this.firingrate = 8; }
    this.firingrate = Math.max(1, Math.round(this.firingrate));
    // Texto del siguiente turno (según mycommand y lo animado que esté)
    const m = this.mycommand;
    this.flavor = m >= 90 ? T.flavors[3] : m >= 70 ? T.flavors[2] : m >= 30 ? T.flavors[1] : T.flavors[0];
    if (this.mercymod > -400) this.flavor = T.better;
    if (this.mercymod > -290) this.flavor = T.better2;
    this.attack = new NapstaAttack(this, kind);
    this.go('nAttack');
  }

  endTurn() {                                      // mnfight = 3
    this.attack = null;
    if (this.single) this.hat = null;
    this.startMenu();
  }

  startKill() {                                    // HP 0: "umm... you do know you cant kill ghosts, right?"
    this.go('nKill'); this.setBorder(0);
    this.dialogue(T.kill, 2, () => { this.go('nFade'); });
  }
  bubblePos() { return [NX + NW + 11, NY + 24]; }
  newBubbleWriter() { const bl = this.bubble, [bx, by] = this.bubblePos(); bl.writer = new Writer(bl.msgs[bl.i], bx + 36, by + 10, TYPER2); }

  update(inp) {
    super.update(inp);
    this.frame += 0.2;
    const S = this.state;
    const nb = this.nbubble;
    if (nb) { nb.writer.update(); if (nb.time < 9999 && --nb.time <= 0) this.nbubble = null; }
    if (S === 'nTalk') {
      if (this.talkTimer !== null) { if (--this.talkTimer <= 0) this.beginAttack(); }
      else {
        const [l] = this.ideal();
        if (inp.confirm && nb && nb.time > 5 && this.box.l === l) nb.time = 2;   // Z cierra el globo
        if (!this.nbubble) this.beginAttack();
      }
    }
    if (S === 'nAttack') {
      const h = this.heart, [l, r, t, b] = this.ideal(), H = inp.held, sp = this.sp;
      if (H.up) h.y -= sp; if (H.down) h.y += sp; if (H.left) h.x -= sp; if (H.right) h.x += sp;
      h.x = Math.min(Math.max(h.x, l + 4), r - 16); h.y = Math.min(Math.max(h.y, t + 4), b - 16);
      this.turntimer--;
      if (this.attack) this.attack.update(inp.held);
      if (this.state === 'nAttack' && this.turntimer < 0) this.endTurn();
    }
    if (S === 'nLeave' && this.timer === 60) this.fadeOut = 0.001;                // Alarm_7: obj_unfader
    if (S === 'nKill') this.updateBubble(inp);
    if (S === 'nFade') {                           // Alarm_10: se desvanece y se corta la música
      if (this.alpha > 0.1) this.alpha -= 0.05;
      else { stopMusic(); this.go('won'); this.writer = new Writer(T.won, BORDER[0][0], BORDER[0][2]); }
    }
    if (S === 'won' && inp.confirm && this.writer && this.writer.done && !this.fadeOut) this.fadeOut = 0.001;
    if (this.fadeOut > 0) { this.fadeOut += S === 'nLeave' ? 0.1 : 0.03; if (this.fadeOut >= 1.3 && this.onExit) { const f = this.onExit; this.onExit = null; f(); } }
  }

  // ---------------------------------------------------------------- dibujo
  drawEnemy(ctx) {
    drawSprite(ctx, 'spr_battlebg', 1, 0, 0);     // obj_battlebg.image_index = 1: la cuadrícula verde
    drawSprite(ctx, 'spr_napstabattle', Math.floor(this.frame), NX, NY, { xs: 2, ys: 2, alpha: this.alpha });
  }
  drawExtra(ctx) {
    if (this.hat) this.hat.draw(ctx);
    if (this.nbubble) { drawSprite(ctx, 'spr_blconsm', 0, this.nbubble.x, this.nbubble.y); this.nbubble.writer.draw(ctx); }
  }
  drawHeart(ctx) {
    const S = this.state;
    if (S === 'nTalk' || S === 'nAttack' || S === 'nLeave') {
      if (S === 'nLeave') return;
      this.hx = this.heart.x; this.hy = this.heart.y;
      drawSprite(ctx, this.soul, Math.floor(this.heartFrame), this.hx, this.hy); return;
    }
    if (S === 'actList') {
      this.hx = 72 + (this.actPos >= 3 ? 256 : 0); this.hy = 278 + (this.actPos % 3) * 32;
      drawSprite(ctx, this.soul, 0, this.hx, this.hy); return;
    }
    super.drawHeart(ctx);
  }
}
