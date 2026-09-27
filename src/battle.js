import { drawSprite, drawText, playSound, playMusic, stopMusic, SPR } from './assets.js';
import { SETTINGS } from './settings.js';
import { UndyneBody } from './undyne.js';
import { Writer, TYPER_UNDYNE } from './text.js';
import { GreenAttack } from './green.js';
import { SpearSummon, RisingSpears, SpearCircle, SpinAmbush } from './red.js';

// Textos tal cual los guarda el juego (textdata_en)
const TXT = {
  intro: '* The heroine appears./^',                                               // scr_battlegroup_1410
  check: '* UNDYNE THE UNDYING 99ATK 99DEF&* Heroine reformed by her own&  DETERMINATION to save Earth./', // obj_undyne_ex_808
  flavor: '* The wind is howling.../^',                                            // obj_undyne_ex_781 (resto de turnos)
  name: 'Undyne the Undying',                                                      // monstername_65
  // Final (obj_undyne_ex, con 52 / 53 / 54): obj_undyne_ex_863 ... 893
  death1: ['Damn it.../', "So even THAT&power..^1.&It wasn't enough...?/", '.../', '\\E1Heh.../', 'Heheheh.../',
           '\\E2If you..^1./', "If you think I'm&gonna give up hope^1,&you're wrong./", "Cause I've..^1.&Got my friends&behind me./",
           '\\E3Alphys told me that&she would watch me&fight you.../', '\\E4And if anything went&wrong^1, she would..^1.&evacuate everyone./',
           "\\E5By now she's called&ASGORE and told him&to absorb the 6&human SOULs./%%"],
  death2: ['And with that&power.../%%'],
  death3: ['This world will&live on...!/%%'],
};

// Objetos (item_name / item_name_short / item_use de textdata_en; curación de scr_itemuseb).
// Cada jefe lleva los objetos más usados en esa parte del juego: 4 del que menos cura (página 1) y 2 del que más (página 2).
export const ITEMS = {
  astro: { name: 'Astronaut Food', short: 'Astr.Food', heal: 21, use: '* You eat the Astronaut Food.' },
  seatea: { name: 'Sea Tea', short: 'Sea Tea', heal: 10, use: '* You drink the Sea Tea.', speed: true },
  candy: { name: 'Monster Candy', short: 'MnstrCndy', heal: 10, use: '* You ate the Monster Candy.', candy: true },
  donut: { name: 'Spider Donut', short: 'SpdrDonut', heal: 12, use: '* You ate the Spider Donut.', donut: true },
  hotdog: { name: 'Hot Dog...?', short: 'Hot Dog', heal: 20, use: '* You eat the Hot Dog...?', sound2: 'dogsalad' },
  bunny: { name: 'Cinnamon Bunny', short: 'C. Bun', heal: 22, use: '* You eat the Cinnamon Bunny.' },
  glam: { name: 'Glamburger', short: 'G. Burger', heal: 27, use: '* You eat the Glamburger.' },
  hero: { name: 'Legendary Hero', short: 'L. Hero', heal: 40, use: '* You eat the Legendary Hero.', atk: 4 },
};
// Estadísticas del jugador (LV: maxhp = 16+lv*4, at = 8+lv*2, df = 9+ceil(lv/4)) con su arma y armadura
export function playerAt(lv, weapon, armor, extra = {}) {
  return { name: SETTINGS.name || 'Player', lv, hp: 16 + lv * 4, maxHp: 16 + lv * 4, at: 8 + lv * 2, df: 9 + Math.ceil(lv / 4), weapon, armor, ...extra };
}

// Cajas de batalla (SCR_BORDERSETUP): [izq, der, arriba, abajo]
const BORDER = { 0: [32, 602, 250, 385], 7: [227, 407, 200, 385], 12: [280, 360, 200, 280], 13: [280, 360, 250, 385],
                 14: [285, 355, 300, 385], 31: [32, 602, 100, 385] };
const BUTTONS = [['spr_fightbt', 32], ['spr_talkbt', 185], ['spr_itembt', 345], ['spr_sparebt', 500]];
const GREEN = 'spr_heartgreen', RED = 'spr_heart';

export { BORDER, BUTTONS, TXT, DmgWriter, Slice, Target, Vapor };

export class Battle {
  // single = un ataque de ATTACKS para practicarlo solo (se repite cada turno); null = la pelea completa
  constructor(single = null) { this.single = single; this.reset(); }

  reset() {
    this.player = this.playerSetup();
    this.inventory = this.itemSetup();
    this.invc = 0;
    // Undyne the Undying (scr_monstersetup, tipo 65) y su estado de combate (obj_undyne_ex Create)
    this.enemy = { hp: 23000, maxHp: 23000, atk: 12, def: 5, x: 210, y: 20, wd: 200 };
    this.body = new UndyneBody(210, 20);
    this.order = 1; this.orderb = 0; this.lesson = -5; this.rating = 9; this.ratingb = 0; this.hitno = 0;
    this.firingrate = 15;
    this.sp = 4;                                 // velocidad del alma roja (global.sp); el Sea Tea la sube
    this.itemPage = 0; this.itemPos = 0;
    this.con = 0; this.melter = null; this.dust = null; this.fadeOut = 0;

    this.box = { l: 32, r: 602, t: 250, b: 385 }; this.border = 0;
    this.dark = 0; this.darkify = 0;             // capa negra del turno de Undyne
    this.state = 'intro'; this.timer = 0;
    this.menu = 0; this.sub = 0;
    this.writer = null; this.flavor = TXT.intro;
    this.attack = null; this.target = null; this.slice = null; this.dmgw = null;
    this.turntimer = 0; this.shake = 0; this.heartFrame = 0;
    this.heart = { x: 312, y: 284 };
    this.soul = RED;                             // empieza roja; Undyne la vuelve verde al comenzar
    this.jobs = [];
  }

  // Jugador e inventario de cada jefe (Undyne the Undying: LV 10, Toy Knife + Faded Ribbon)
  playerSetup() { return playerAt(10, { name: 'Toy Knife', atk: 3, knife: true }, { name: 'Faded Ribbon', def: 3 }); }
  itemSetup() { return ['astro', 'astro', 'astro', 'astro', 'seatea', 'seatea']; }   // página 1: 4 Astronaut Food, página 2: 2 Sea Tea

  // ---------------------------------------------------------------- helpers
  setBorder(n) { this.border = n; }
  ideal() { return BORDER[this.border]; }
  go(state) { this.state = state; this.timer = 0; }
  startMenu() {
    this.setBorder(0); this.go('menu');
    this.writer = new Writer(this.flavor, BORDER[0][0], BORDER[0][2]);
  }

  // Qué ataca Undyne este turno
  plan() {
    if (this.single) return this.single;
    return this.soul === GREEN ? { kind: 'green', lesson: this.lesson } : { kind: 'red', orderb: this.orderb };
  }

  // Undyne cambia el color del alma: tajo con el brazo y, 10 frames después, verde <-> roja (Other_11 + Alarm_10)
  switchColor() {
    this.body.startSlash();
    this.later(10, () => { this.soul = this.soul === GREEN ? RED : GREEN; });
  }

  startEnemyTurn() {                             // mnfight = 1 -> Alarm_6 (frame 1)
    this.writer = null; this.go('enemyPre');
    const p = this.turnPlan = this.plan();
    if (this.single) this.soul = p.kind === 'green' ? GREEN : RED;
    if (p.kind === 'green') this.setBorder(13);
    else this.setBorder([0, 6].includes(p.orderb) ? 7 : [1, 7].includes(p.orderb) ? 14 : 31);
    this.heart = { x: 312, y: this.box.t + 34 };
  }

  beginAttack() {                                // Alarm_5 + Step (mnfight = 2)
    const p = this.turnPlan;
    this.hitno = 0; this.switchPending = false; this.ending = false;
    if (p.kind === 'green') {
      this.setBorder(12); this.darkify = 1; this.turntimer = 300;
      this.attack = new GreenAttack(this, p.lesson, this.rating, this.enemy.atk);
    } else {
      const o = p.orderb;
      this.ratingb = Math.min(10, Math.max(8, this.ratingb + 1));
      if (o === 0 || o === 6) { this.darkify = 1; this.turntimer = 240; this.firingrate = 18 - this.ratingb; this.attack = new SpearSummon(this); }
      else if (o === 1 || o === 7) { this.turntimer = 220; this.firingrate = 23 - this.ratingb; this.attack = new RisingSpears(this); }
      else if (o === 2 || o === 3) { this.turntimer = 215; this.attack = new SpearCircle(this, 0); }
      else if (o === 4) { this.turntimer = 400; this.attack = new SpinAmbush(this); }
      else { this.turntimer = 215; this.attack = new SpearCircle(this, 1); }
      this.attack.orderb = o;
    }
    if (!this.single) {                          // contadores de obj_undyne_ex
      if (p.kind === 'red') { this.lesson++; this.orderb++; if (this.orderb >= 8) this.orderb = 4; }
      this.order++; this.lesson--;
    }
    this.go('enemyAttack');
  }

  endTurn() {                                    // mnfight = 4
    if (this.ending) return; this.ending = true;
    if (this.hitno > 0) { if (this.rating < 10) this.rating++; if (this.hitno >= 3) this.rating = 10; }
    else if (this.rating > 8) this.rating--;
    this.attack = null;
    if (this.border === 12) this.setBorder(13);
    this.go('enemyEnd');
  }

  hurtPlayer(dmg, { minHp = 0 } = {}) {          // scr_damagestandard(0,0,0,0,0)
    if (this.invc >= 1 || this.state === 'gameover') return;
    const p = this.player;
    this.hitno++;
    for (const lim of [21, 30, 40, 50, 60, 70, 80, 90]) if (p.hp >= lim) dmg++;
    const amt = Math.max(1, Math.round(dmg - (p.df + p.armor.def) / 5));
    p.hp = Math.max(minHp, p.hp - amt);
    playSound('hurt'); this.shake = 2; this.invc = 20;
    if (p.hp <= 0) this.gameOver();
  }

  // ---------------------------------------------------------------- update
  update(inp) {
    this.timer++;
    this.tickJobs();
    if (this.invc > 0) this.invc--;
    this.heartFrame = this.invc > 0 ? this.heartFrame + 0.5 : 0;
    this.moveBox();
    if (this.darkify === 1) { this.dark = Math.min(0.5, this.dark + 0.04); }
    if (this.darkify === 3) { this.dark -= 0.04; if (this.dark <= 0) { this.dark = 0; this.darkify = 0; } }
    if (this.writer) this.writer.update();
    if (this.dmgw) this.dmgw.update(this);
    if (this.slice) this.slice.update(this);
    if (this.target) this.target.update(this, inp);

    const S = this.state;
    if (S === 'intro') { this.startIntro(); return; }
    if (S === 'introUndyne') {                   // arranca solo al elegir en el menú
      playMusic();
      if (this.single && this.single.kind === 'red') { this.startEnemyTurn(); return; }
      // La caja se encoge con el alma roja en el centro, Undyne blande la lanza y el alma se vuelve verde
      this.go('greenIntro'); this.setBorder(12); this.introPhase = 0;
      return;
    }
    if (S === 'greenIntro') {
      const [l, r, t, b] = BORDER[12], bx = this.box;
      if (this.introPhase === 0 && bx.l === l && bx.r === r && bx.t === t && bx.b === b && this.timer > 12) {
        this.introPhase = 1; this.switchColor();
      }
      if (this.introPhase === 1 && this.body.movetype === 0 && this.soul === GREEN) { this.introPhase = 2; this.timer = 0; }
      if (this.introPhase === 2 && this.timer >= 12) {
        if (this.single) { this.startEnemyTurn(); return; }        // práctica: directo al ataque
        this.introPhase = 3; this.setBorder(0);                    // la caja vuelve a crecer
      }
      if (this.introPhase === 3 && this.box.l === 32 && this.box.r === 602) this.startMenu();   // ya puedes actuar
      return;
    }
    if (S === 'menu') this.updateMenu(inp);
    else if (S === 'fightTarget' || S === 'actTarget' || S === 'actList' || S === 'mercyList') this.updateSub(inp);
    else if (S === 'itemList') this.updateItems(inp);
    else if (S === 'dying') this.updateDeath(inp);
    else if (S === 'actText') {
      if (inp.cancel) this.writer.skip();
      else if (inp.confirm && this.writer.done) this.startEnemyTurn();
    }
    else if (S === 'enemyPre') {
      if (this.soul === GREEN) this.heart = { x: 312, y: this.box.t + 34 };
      if (this.timer >= 15) this.beginAttack();
    }
    else if (S === 'enemyAttack') this.updateEnemyAttack(inp);
    else if (S === 'enemyEnd') {
      if (this.soul === GREEN) this.heart = { x: 312, y: this.box.t + 34 };
      if (this.timer >= 10) { if (this.dark > 0) this.darkify = 3; this.flavor = TXT.flavor; this.startMenu(); }
    }
    else if (S === 'gameover') this.updateGameOver();
    this.shake = Math.max(0, this.shake - 0.34);
  }

  updateEnemyAttack(inp) {
    this.turntimer--;
    const h = this.heart;
    if (this.soul === GREEN) { h.x = 312; h.y = this.box.t + 34; }           // greenlock
    else {                                       // alma roja: se mueve 4 px por frame dentro de la caja
      const [l, r, t, b] = this.ideal(), H = inp.held;
      const sp = this.sp;
      if (H.up) h.y -= sp; if (H.down) h.y += sp; if (H.left) h.x -= sp; if (H.right) h.x += sp;
      h.x = Math.min(Math.max(h.x, l + 4), r - 16); h.y = Math.min(Math.max(h.y, t + 4), b - 16);
    }
    const a = this.attack;
    if (a) {
      a.update(inp.held);
      if (this.state !== 'enemyAttack') return;
      if (a instanceof GreenAttack && a.finished) {
        if (a.refuse && !this.single) {          // pasa a roja: tajo, cambio de color y fin del turno (Alarm_10 + Alarm_11)
          this.darkify = 3; this.switchColor(); this.attack = null;
          this.switchPending = true; this.later(25, () => this.endTurn());
        }
        else return this.endTurn();
      } else if (!(a instanceof GreenAttack) && a.done && !this.switchPending && !this.single) {
        // Momentos en que el juego vuelve a poner el alma verde (Step de los generadores rojos)
        const toGreen = ((a instanceof RisingSpears || a instanceof SpearSummon) && this.order === 6) ||
                        (a instanceof SpearCircle && a.type === 0 && this.orderb === 4);
        if (toGreen) {
          this.switchPending = true; this.turntimer = 30;
          if (a instanceof RisingSpears || a instanceof SpearSummon) this.lesson = -8;
          if (a instanceof SpearCircle && this.order === 11) this.lesson = -11;
          this.darkify = 3; this.switchColor();
          this.later(40, () => this.endTurn());                          // Alarm_11
        }
      }
    }
    if (this.soul === RED && this.turntimer < 1 && !this.switchPending) this.endTurn();
  }

  startIntro() { this.state = 'introUndyne'; }

  moveBox() {                                    // obj_uborder & co: 15 px por frame
    const [l, r, t, b] = this.ideal();
    const step = (v, to) => Math.abs(v - to) <= 15 ? to : v + Math.sign(to - v) * 15;
    this.box.l = step(this.box.l, l); this.box.r = step(this.box.r, r);
    this.box.t = step(this.box.t, t); this.box.b = step(this.box.b, b);
  }

  updateMenu(inp) {
    if (inp.left)  { this.menu = (this.menu + 3) % 4; playSound('squeak'); }
    if (inp.right) { this.menu = (this.menu + 1) % 4; playSound('squeak'); }
    if (inp.confirm) {
      if (this.menu === 2 && this.inventory.length === 0) return;   // ITEM sin objetos: no pasa nada
      playSound('select'); this.sub = 0; this.writer = null;
      if (this.menu === 2) { this.itemPage = 0; this.itemPos = 0; }
      this.go(['fightTarget', 'actTarget', 'itemList', 'mercyList'][this.menu]);
    }
  }

  updateSub(inp) {
    if (inp.cancel) {
      if (this.state === 'actList') this.go('actTarget');
      else this.startMenu();
      return;
    }
    if (!inp.confirm) return;
    playSound('select');
    if (this.state === 'fightTarget') { this.target = new Target(this); this.go('attack'); }
    else if (this.state === 'actTarget') this.go('actList');
    else if (this.state === 'actList') { this.writer = new Writer(TXT.check, BORDER[0][0], BORDER[0][2]); this.go('actText'); }
    else if (this.state === 'mercyList') this.startEnemyTurn();
  }

  // Resultado del ataque del jugador (obj_targetchoice / obj_undyne_ex Alarm_3)
  // Ganchos que cada jefe puede cambiar
  enemyTake(damage) { let t = damage * 21; if (t < 600) t = 600 + Math.floor(Math.random() * 67); return t; }   // obj_undyne_ex Alarm_3
  missPos() { return [this.enemy.x + 174 / 2 - 48, this.enemy.y - 24]; }
  dmgPos() { return [this.enemy.x, this.enemy.y + 150]; }
  onEnemyHit(take, lethal) {
    playSound('damage');
    this.body.shake = 14; this.body.shakeRate = 2;
    if (lethal) {                                            // golpe final: se corta la música y se congela
      stopMusic(); this.body.faceemotion = 0; this.body.facetype = 2; this.body.pause = 1; this.body.shakeRate = 5;
    }
  }
  afterEnemyDamage() { if (this.enemy.hp <= 0) this.startDeath(); else this.startEnemyTurn(); }

  onStrike(damage) {
    if (damage === null) {                                   // MISS
      const [mx, my] = this.missPos();
      this.dmgw = new DmgWriter(this, 0, mx, my, 30);
      this.later(1, () => this.startEnemyTurn());
      return;
    }
    const take = this.enemyTake(damage);
    this.slice = new Slice(this);
    this.later(this.slice.damagetimer, () => {
      const [dx, dy] = this.dmgPos();
      this.dmgw = new DmgWriter(this, take, dx, dy, 0);
      this.onEnemyHit(take, this.enemy.hp - take <= 0);
      this.later(34, () => {                                 // fin del temblor: se aplica el daño
        this.enemy.hp = Math.max(0, this.enemy.hp - take);
        this.dmgw.life = 15;
        this.afterEnemyDamage();
      });
    });
  }

  // ---------------------------------------------------------------- objetos (menú ITEM)
  updateItems(inp) {
    const inv = this.inventory, pages = Math.ceil(inv.length / 4);
    const idx = () => this.itemPage * 4 + this.itemPos;
    const col = this.itemPos % 2, row = Math.floor(this.itemPos / 2);
    const move = (page, pos) => { if (page * 4 + pos < inv.length) { this.itemPage = page; this.itemPos = pos; playSound('squeak'); } };
    if (inp.cancel) { this.startMenu(); return; }
    if (inp.right) { if (col === 0) move(this.itemPage, this.itemPos + 1); else if (this.itemPage + 1 < pages) move(this.itemPage + 1, row * 2); }
    if (inp.left)  { if (col === 1) move(this.itemPage, this.itemPos - 1); else if (this.itemPage > 0) move(this.itemPage - 1, row * 2 + 1); }
    if (inp.down && row === 0) move(this.itemPage, this.itemPos + 2);
    if (inp.up && row === 1) move(this.itemPage, this.itemPos - 2);
    if (inp.confirm) this.useItem(idx());
  }

  useItem(i) {                                   // scr_itemuseb + scr_recoitem
    const key = this.inventory[i], it = ITEMS[key], p = this.player;
    this.inventory.splice(i, 1);                 // los demás objetos suben un puesto (scr_itemshift)
    let msg = it.use;
    if (it.candy) { const r = Math.round(Math.random() * 15); if (r <= 2) msg += ' &* Very un-licorice-like.'; if (r === 15) msg += ' &* ... tastes like licorice.'; }
    if (it.donut && Math.ceil(Math.random() * 10) > 9) msg = "* Don't worry^1, Spider didn't.";
    msg = this.itemText(key, msg);
    playSound('swallow');
    if (it.speed) {
      if (this.sp < 8) { this.sp++; msg += '&* Your SPEED boosts!'; }
      this.later(10, () => playSound('speedup'));
    } else this.later(10, () => playSound(it.sound2 || 'power'));
    if (it.atk && p.at < 150) { p.at += it.atk; msg += '&* ATTACK increased by 4!'; }
    const heal = it.heal + (p.weapon.healBonus || 0);          // la Burnt Pan cura 4 más
    p.hp = Math.min(p.maxHp, p.hp + heal);
    msg += p.hp >= p.maxHp ? '&* Your HP was maxed out./' : `&* You recovered ${heal} HP!/`;
    this.writer = new Writer(msg, BORDER[0][0], BORDER[0][2]);
    this.go('actText');
  }
  itemText(key, msg) { return msg; }             // cada jefe puede cambiar el texto (p. ej. Mettaton y el público)

  // ---------------------------------------------------------------- muerte: el alma se rompe (obj_heartdefeated)
  gameOver() {
    if (this.state === 'gameover') return;
    stopMusic();                                 // la música se corta en cuanto la vida llega a 0
    if (this.stopAllSounds) this.stopAllSounds();
    this.attack = null; this.bubble = null; this.writer = null; this.jobs = [];
    this.go('gameover');
    this.dead = { x: this.hx ?? 312, y: this.hy ?? 300, spr: 'spr_heart', shards: [], fade: 0 };
  }
  updateGameOver() {
    const d = this.dead, t = this.timer;
    if (t === 20) { playSound('break1'); d.spr = 'spr_heartbreak'; d.x -= 2; }             // Alarm_0: se parte
    if (t === 60) {                                                                         // Alarm_1: estalla en pedacitos
      playSound('break2'); d.spr = null;
      for (const [dx, dy] of [[-2, 0], [0, 3], [2, 6], [8, 0], [10, 3], [12, 6]]) {
        const dir = Math.random() * Math.PI * 2;
        d.shards.push({ x: d.x + dx, y: d.y + dy, hs: Math.cos(dir) * 7, vs: -Math.sin(dir) * 7, f: 0 });
      }
    }
    for (const s of d.shards) { s.vs += 0.2; s.x += s.hs; s.y += s.vs; s.f += 0.25; }
    if (t > 110) d.fade += 0.05;
    if (d.fade >= 1 && !d.left) { d.left = true; if (this.onExit) this.onExit(); else this.reset(); }   // vuelve a la lista del jefe
  }
  drawGameOver(ctx) {
    const d = this.dead;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 640, 480);
    if (d.spr) drawSprite(ctx, d.spr, 0, d.x, d.y);
    for (const s of d.shards) drawSprite(ctx, 'spr_heartshards', Math.floor(s.f) % 4, s.x, s.y);
    if (d.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, d.fade)})`; ctx.fillRect(0, 0, 640, 480); }
  }

  // ---------------------------------------------------------------- final de Undyne (obj_undyne_ex con 50...74)
  startDeath() {
    this.go('dying'); this.con = 50; this.writer = null;
    this.later(90, () => {                       // Alarm_4 -> con 52: habla temblando
      this.con = 52; this.body.shakify = 1; this.setBorder(0);
      this.dialogue(TXT.death1, 94, () => {
        this.con = 53;                           // se derrite: el cuerpo se cambia por spr_undynex_melt
        this.body.visible = false;
        this.melter = { x: this.body.xstart - 20, y: -40, frame: 0 };
        this.dialogue(TXT.death2, 95, () => {
          this.con = 54; this.melter.frame = 1;
          this.dialogue(TXT.death3, 96, () => {
            this.con = 71; this.dust = new Vapor(this.melter); this.melter = null; playSound('vaporized');
            this.player.lv = Math.max(this.player.lv, 12);   // +1500 EXP (scr_levelup)
            this.later(180, () => { this.fadeOut = 0.001; });
          });
        });
      });
    });
  }

  // Globo de diálogo junto a Undyne (scr_blcon_x en x+180, y+10); Z pasa al siguiente mensaje
  dialogue(msgs, typer, onEnd) {
    this.bubble = { msgs, i: 0, typer, onEnd };
    this.newBubbleWriter();
  }
  bubblePos() { return [this.enemy.x + 180, this.enemy.y + 10]; }   // scr_blcon_x
  bubbleStyle(typer) { return TYPER_UNDYNE[typer]; }
  newBubbleWriter() {
    const bl = this.bubble, [bx, by] = this.bubblePos();
    bl.writer = new Writer(bl.msgs[bl.i], bx + 30, by + 10, { ...this.bubbleStyle(bl.typer), onFace: n => { this.body.faceemotion = n; } });
  }
  updateBubble(inp) {
    const bl = this.bubble; if (!bl) return;
    bl.writer.update();
    if (inp.cancel) bl.writer.skip();
    else if (inp.confirm && bl.writer.done) {
      if (++bl.i < bl.msgs.length) this.newBubbleWriter();
      else { this.bubble = null; bl.onEnd(); }
    }
  }
  updateDeath(inp) {
    const bl = this.bubble;
    if (bl) {
      bl.writer.update();
      if (inp.cancel) bl.writer.skip();
      else if (inp.confirm && bl.writer.done) {
        if (++bl.i < bl.msgs.length) this.newBubbleWriter();
        else { this.bubble = null; bl.onEnd(); }
      }
    }
    if (this.dust) this.dust.update();
    if (this.fadeOut > 0) { this.fadeOut += 0.03; if (this.fadeOut >= 1.3 && this.onExit) this.onExit(); }
  }

  later(frames, fn) { this.jobs.push({ t: frames, fn }); }
  tickJobs() {
    if (!this.jobs) return;
    for (const j of [...this.jobs]) if (--j.t <= 0) { this.jobs.splice(this.jobs.indexOf(j), 1); j.fn(); }
  }

  // ---------------------------------------------------------------- draw
  draw(ctx) {
    if (this.state === 'gameover') return this.drawGameOver(ctx);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 640, 480);
    ctx.save();
    if (this.shake > 0) ctx.translate(Math.round((Math.random() * 2 - 1) * this.shake), Math.round((Math.random() * 2 - 1) * this.shake));

    // obj_objshake: el cuerpo tiembla ±shx cada 2 frames al recibir daño
    if (this.body.shake > 0) {
      if (this.timer % (this.body.shakeRate || 2) === 0) { this.body.shakeSide = !this.body.shakeSide; this.body.shake--; }
      this.body.shakeX = this.body.shakeSide ? this.body.shake : -this.body.shake;
    } else this.body.shakeX = 0;
    this.drawEnemy(ctx);
    ctx.restore(); ctx.save();
    if (this.shake > 0) ctx.translate(Math.round((Math.random() * 2 - 1) * this.shake), Math.round((Math.random() * 2 - 1) * this.shake));
    this.drawField(ctx);
    ctx.restore();
    if (this.fadeOut > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, this.fadeOut)})`; ctx.fillRect(0, 0, 640, 480); }
  }

  drawEnemy(ctx) {
    this.body.draw(ctx);
    if (this.melter) drawSprite(ctx, 'spr_undynex_melt', this.melter.frame, this.melter.x + Math.round(Math.random() * 2 - 1), this.melter.y);
    if (this.dust) this.dust.draw(ctx);
  }

  drawField(ctx) {
    this.drawBox(ctx);
    if (this.dark > 0) { ctx.fillStyle = `rgba(0,0,0,${this.dark})`; ctx.fillRect(0, 0, 640, 480); }

    if (this.writer) this.writer.draw(ctx);
    this.drawSubmenu(ctx);
    if (this.target) this.target.draw(ctx);
    this.drawStats(ctx);
    this.drawButtons(ctx);
    this.drawHeart(ctx);
    if (this.attack) this.attack.draw(ctx);
    if (this.slice) this.slice.draw(ctx);
    if (this.dmgw) this.dmgw.draw(ctx);
    this.drawExtra(ctx);
    if (this.bubble) {
      const [bx, by] = this.bubblePos();
      drawSprite(ctx, 'spr_blconwdshrt', 0, bx, by);
      this.bubble.writer.draw(ctx);
    }
  }
  drawExtra(ctx) {}

  drawBox(ctx) {
    const { l, r, t, b } = this.box;
    ctx.globalAlpha = 1 - this.dark;
    ctx.fillStyle = '#fff'; ctx.fillRect(l, t, r + 5 - l, b + 5 - t);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000'; ctx.fillRect(l + 5, t + 5, r - l - 5, b - t - 5);
  }

  drawSubmenu(ctx) {
    const x = BORDER[0][0] + 20, y = BORDER[0][2] + 20, line = s => drawText(ctx, 'fnt_main', s, x, y, { mono: 16 });
    if (this.state === 'fightTarget' || this.state === 'actTarget') {
      line('   * ' + TXT.name);
      if (this.state === 'fightTarget') {        // barra de vida del enemigo junto al nombre
        const bx = x + 16 * 24, w = 101, hp = Math.ceil(this.enemy.hp / this.enemy.maxHp * w);
        ctx.fillStyle = '#f00'; ctx.fillRect(bx, y + 5, w, 17);
        ctx.fillStyle = '#0f0'; ctx.fillRect(bx, y + 5, hp, 17);
      }
    }
    if (this.state === 'actList') line('   * Check');
    if (this.state === 'mercyList') line('   * Spare');
    if (this.state === 'itemList') {             // 2 columnas x 2 filas por página y "PAGE N"
      this.inventory.slice(this.itemPage * 4, this.itemPage * 4 + 4).forEach((k, i) =>
        drawText(ctx, 'fnt_main', '   * ' + ITEMS[k].short, x + (i % 2) * 240, y + Math.floor(i / 2) * 32, { mono: 16 }));
      drawText(ctx, 'fnt_main', '   PAGE ' + (this.itemPage + 1), x + 240, y + 64, { mono: 16 });
    }
  }

  drawStats(ctx) {
    const p = this.player;
    const w = drawText(ctx, 'fnt_curs', p.name, 30, 400);
    drawText(ctx, 'fnt_curs', `LV ${p.lv}`, 30 + w + 32, 400);
    drawSprite(ctx, 'spr_hpname', 0, 244, 405);
    const bx = 275, barW = Math.round(p.maxHp * 1.2);
    ctx.fillStyle = '#f00'; ctx.fillRect(bx, 400, barW, 21);
    ctx.fillStyle = '#ff0'; ctx.fillRect(bx, 400, Math.round(p.hp * 1.2), 21);
    drawText(ctx, 'fnt_curs', `${p.hp} / ${p.maxHp}`, bx + barW + 14, 400);
  }

  drawButtons(ctx) {
    const active = this.state === 'menu' || this.state === 'intro' || this.state === 'itemList' || this.state === 'fightTarget' || this.state === 'actTarget' || this.state === 'actList' || this.state === 'mercyList';
    BUTTONS.forEach(([spr, x], i) => drawSprite(ctx, spr, active && i === this.menu ? 1 : 0, x, 432));
  }

  drawHeart(ctx) {
    const S = this.state; let x = null, y = null;
    if (S === 'menu' || S === 'intro') { x = BUTTONS[this.menu][1] + 8; y = 445; }
    if (S === 'greenIntro') { x = 312; y = this.box.t + 34; }
    if (['fightTarget', 'actTarget', 'actList', 'mercyList'].includes(S)) { x = 72; y = 278; }
    if (S === 'itemList') { x = 72 + (this.itemPos % 2) * 240; y = 278 + Math.floor(this.itemPos / 2) * 32; }
    if (S === 'enemyPre' || S === 'enemyAttack' || S === 'enemyEnd') { x = this.heart.x; y = this.heart.y; }
    if (x === null) return;
    this.hx = x; this.hy = y;
    drawSprite(ctx, this.soul, Math.floor(this.heartFrame), x, y);
  }
}

// ---------------------------------------------------------------- barra de ataque (obj_target + obj_targetchoice)
class Target {
  constructor(b) {
    this.x = BORDER[0][0] + 6; this.y = BORDER[0][2] + 6;       // scr_attack
    this.alpha = 1; this.xs = 1; this.fade = false;
    const knife = b.player.weapon.knife, right = knife && Math.random() < 0.5;
    this.cx = right ? this.x + 570 : this.x - 16;
    this.hs = (11 + Math.random() * 2) * (knife ? 1.25 : 1) * (right ? -1 : 1);
    this.stopped = false; this.flicker = 0; this.guard = 1;
  }
  update(b, inp) {
    if (this.fade) {
      this.alpha -= 0.08; this.xs -= 0.06; this.x += 15.8;
      if (this.xs < 0.08) b.target = null;
      return;
    }
    if (this.stopped) { this.flicker += 0.4; return; }
    this.cx += this.hs;
    if ((this.hs > 0 && this.cx > this.x + 562) || (this.hs < 0 && this.cx < this.x)) {
      this.fade = true; b.onStrike(null); return;
    }
    if (this.guard > 0) { this.guard--; return; }
    if (inp.confirm) {
      this.stopped = true;
      const p = b.player;
      let dmg = p.at + p.weapon.atk - b.enemy.def + Math.random() * 2;     // scr_attackcalc
      const bonus = Math.abs((this.cx + 7) - (this.x + 281)) || 1;
      const stretch = (562 - bonus) / 562;
      dmg = bonus <= 12 ? Math.round(dmg * 2.2) : Math.round(dmg * stretch * 2);
      b.stretch = stretch;
      b.onStrike(dmg);
      b.later(20, () => { this.fade = true; });
    }
  }
  draw(ctx) {
    drawSprite(ctx, 'spr_target', 0, this.x, this.y, { xs: this.xs, alpha: this.alpha });
    if (!this.fade) drawSprite(ctx, 'spr_targetchoice', Math.floor(this.flicker), this.cx, this.y);
  }
}

// ---------------------------------------------------------------- tajo (obj_slice)
class Slice {
  constructor(b) {
    const st = b.stretch;
    this.speed = 0.5 - st / 4; if (this.speed === 0) this.speed = 0.1;
    this.scale = st * 2 - 0.5;
    this.x = b.enemy.x + b.enemy.wd / 2 - 5 - (this.scale - 1) * 13;
    this.y = b.enemy.y - 5 - (this.scale - 1) * 55;
    this.frame = 0;
    this.damagetimer = Math.round((1 / this.speed) * 6 + 3);
    playSound('laz');
  }
  update(b) { this.frame += this.speed; if (this.frame >= 6) b.slice = null; }
  draw(ctx) { drawSprite(ctx, 'spr_strike', this.frame, this.x, this.y, { xs: this.scale, ys: this.scale }); }
}

// ---------------------------------------------------------------- número de daño + barra de vida (obj_dmgwriter)
class DmgWriter {
  constructor(b, dmg, x, y, life) {
    this.dmg = dmg; this.x = x; this.y = y; this.ystart = y;
    this.stretch = b.enemy.wd / b.enemy.maxHp; this.maxHp = b.enemy.maxHp; this.wd = b.enemy.wd;
    this.apparent = b.enemy.hp; this.actual = b.enemy.hp;
    this.vs = dmg ? -4 : 0; this.grav = dmg ? 0.5 : 0;
    this.alarm = 1; this.life = life || -1;
  }
  update(b) {
    if (--this.alarm <= 0) {
      if (this.apparent > this.actual - this.dmg) this.apparent -= this.dmg / 15;
      else this.apparent = this.actual - this.dmg;
      if (this.apparent < 0) this.apparent = 0;
      this.alarm = 2;
    }
    this.vs += this.grav; this.y += this.vs;
    if (this.y > this.ystart) { this.y = this.ystart; this.vs = 0; this.grav = 0; }
    if (this.life > 0 && --this.life === 0) b.dmgw = null;
  }
  draw(ctx) {
    const { x, ystart } = this;
    if (this.dmg > 0) {
      const w = Math.round(this.maxHp * this.stretch);
      ctx.fillStyle = '#000'; ctx.fillRect(x - 1, ystart + 7, w + 3, 15);
      ctx.fillStyle = '#404040'; ctx.fillRect(x, ystart + 8, w + 1, 13);
      if (this.apparent > 0) { ctx.fillStyle = '#0f0'; ctx.fillRect(x, ystart + 8, Math.round(this.apparent * this.stretch) + 1, 13); }
      const digits = String(this.dmg), place = digits.length - 1;
      for (let i = place; i >= 0; i--) {
        const d = +digits[place - i];
        const cx = this.wd <= 120 ? x + 30 : x - 30 + this.wd / 2;
        drawSprite(ctx, 'spr_dmgnum_o', d, cx - i * 32 + place * 16, this.y - 28, { color: '#f00' });
      }
    } else {
      drawSprite(ctx, 'spr_dmgmiss_o', 0, x - 10, this.y - 16, { color: '#c0c0c0' });
    }
  }
}

// ---------------------------------------------------------------- polvo final (obj_vaporized_new): el sprite se deshace de arriba abajo
class Vapor {
  constructor(m, im = SPR['spr_undynex_melt'].frames[1]) {
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    this.data = g.getImageData(0, 0, c.width, c.height); this.canvas = c; this.g = g;
    this.x = m.x; this.y = m.y; this.line = 0; this.parts = [];
  }
  update() {
    const { data, canvas: c } = this;
    for (let k = 0; k < 3 && this.line < c.height; k++, this.line++) {       // 3 filas por frame se vuelven polvo
      const y = this.line;
      for (let x = 0; x < c.width; x += 2) {
        const i = (y * c.width + x) * 4;
        if (data.data[i + 3] > 0 && data.data[i] > 128 && Math.random() < 0.5)
          this.parts.push({ x: this.x + x, y: this.y + y, vx: (Math.random() - 0.5) * 1.5, vy: -1 - Math.random() * 2.5, a: 1 });
      }
      this.g.clearRect(0, y, c.width, 1);
    }
    for (const p of this.parts) { p.x += p.vx; p.y += p.vy; p.a -= 0.025; }
    this.parts = this.parts.filter(p => p.a > 0);
  }
  draw(ctx) {
    ctx.drawImage(this.canvas, Math.round(this.x), Math.round(this.y));
    ctx.fillStyle = '#fff';
    for (const p of this.parts) { ctx.globalAlpha = p.a; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); }
    ctx.globalAlpha = 1;
  }
}
