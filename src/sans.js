import { drawSprite, drawText, playSound, playMusic, stopMusic, setMusicVolume, registerSounds, registerMusic } from './assets.js';
import { Smoother } from './smooth.js';
import { Battle, BORDER, BUTTONS, ITEMS, playerAt, DmgWriter, Slice } from './battle.js';
import { Writer } from './text.js';
import { tr, sprL } from './i18n.js';
import { rotBBox, hit, choose } from './gm.js';
import { T } from './sans_text.js';
import { SWriter, ambient, stopAmbient, stopAllAmbient } from './sans_gfx.js';
import { ShadowGen, MenuBoneMaker, SleepZ } from './sans_bullets.js';
import { SansBody } from './sans_body.js';

// ============================================================================
//  Sans (ruta genocida). Música: "MEGALOVANIA" (mus_zz_megalovania.ogg).
//  Traducido de obj_sansb (flujo del combate, diálogos, turnos), obj_sansb_body (ataques, final, KARMA),
//  obj_heart (alma roja / azul con gravedad hacia los 4 lados), obj_sansbullet_parent y sus balas.
//  Sans esquiva todos tus golpes (MISS); tras 23 intentos usa su "ataque especial" y se duerme.
//  No hay invencibilidad tras un golpe: cada frame tocando una bala quita 1 PV y suma KARMA (KR).
// ============================================================================
registerSounds({ txtsans: 'snd_txtsans.wav', sans_b: 'snd_b.wav', sans_noise: 'snd_noise.wav', sans_beam: 'mus_sfx_rainbowbeam_1.wav',
                 sans_beam_a: 'mus_sfx_a_gigatalk.wav', sans_power: 'mus_sfx_segapower.wav', sans_cut: 'mus_sfx_cinematiccut.wav' });
registerMusic({ sans: 'mus_zz_megalovania.ogg' });
// Face Steak (scr_itemuseb: cura 60; item_name_61 / item_names_61 / item_use_61)
ITEMS.sans_steak = { name: 'Face Steak', short: 'Steak', heal: 60, use: '* You ate the Face Steak.' };

// Ataques sueltos (el juego no les da nombre: son inventados). En el orden del juego.
export const SANS_ATTACKS = [
  { name: 'Bad Time', kind: 'intro' },                               // fac (primer ataque)
  { name: 'Bone Rows', kind: 'a', a: 0 },                            // part 0..12: a_type 0, 3, 23, 6, 7, 8, 17, 15, 18, 1, 5, 21, 16
  { name: 'Blue Bones', kind: 'a', a: 3 },
  { name: 'Bone Hurdles', kind: 'a', a: 23 },
  { name: 'Platform Bridge', kind: 'a', a: 6 },
  { name: 'Platform Climb', kind: 'a', a: 7 },
  { name: 'Two-Level Platforms', kind: 'a', a: 8 },
  { name: 'Bone Loops', kind: 'a', a: 17 },
  { name: 'Platform Blasters', kind: 'a', a: 15 },
  { name: 'Bone Loops II', kind: 'a', a: 18 },
  { name: 'Fast Bone Rows', kind: 'a', a: 1 },
  { name: 'Low Bones', kind: 'a', a: 5 },
  { name: 'Bone Hurdles II', kind: 'a', a: 21 },
  { name: 'Platform Blasters II', kind: 'a', a: 16 },
  { name: 'Flicker', kind: 'shadow', level: 0, max: 5 },           // hit_try 14 (obj_sansshadowgen nivel 0)
  { name: 'Blaster Barrage', kind: 'b', a: 12 },                   // part 0..7 de la segunda mitad
  { name: 'Flicker II', kind: 'shadow', level: 1, max: 5 },
  { name: 'Slam', kind: 'smash', lv: 0 },
  { name: 'Slam II', kind: 'smash', lv: 1 },
  { name: 'Big Blaster Barrage', kind: 'b', a: 13 },
  { name: 'Bone Walls', kind: 'b', a: 22 },
  { name: 'Flicker III', kind: 'shadow', level: 2, max: 6, a0: 4 },
  { name: 'Slam III', kind: 'smash', lv: 2 },
  { name: 'Special Attack', kind: 'final' },                       // lac 4 ... 60
];

// SCR_BORDERSETUP: las cajas que usa Sans ([izq, der, arriba, abajo])
const BORDERS = { 0: [32, 602, 250, 385], 35: [132, 502, 250, 385], 36: [240, 400, 225, 385], 37: [120, 520, 185, 385], 38: [270, 370, 285, 385] };
const PHASE1 = [0, 3, 23, 6, 7, 8, 17, 15, 18, 1, 5, 21, 16];
const stop = s => { if (s) try { s.stop(); } catch (e) {} };

export class SansBattle extends Battle {
  constructor(single = null) { super(single); }

  // NV 19, 92 PV, Real Knife + The Locket (ruta genocida). 4 Legendary Hero + 2 Face Steak.
  playerSetup() { return playerAt(19, { name: 'Real Knife', atk: 99, knife: true }, { name: 'The Locket', def: 99 }); }
  itemSetup() { return ['hero', 'hero', 'hero', 'hero', 'sans_steak', 'sans_steak']; }

  reset() {
    super.reset();
    this.enemy = { hp: 1, maxHp: 1, atk: 1, def: 1, x: 270, y: 110, wd: 120 };   // scr_monstersetup tipo 68 (obj_sansb en 270,110)
    this.sansx = 270; this.flavor = ''; this.soul = 'spr_heart';
    this.ib = [...BORDERS[0]]; this.border = 0; this.insta = 0; this.showBox = true;
    this.H = { x: 312, y: 300, hs: 0, vs: 0, mv: 0, js: 0, spr: 'spr_heart', ignore: 0, slamPain: 0, xp: 0, yp: 0 };
    this.objs = []; this.mobjs = []; this.km = 0; this.krOn = false; this.sp = 5;
    this.body = new SansBody(this);
    this.hitTry = 0; this.hitReached = 0; this.part = 0; this.turns = 0; this.mercymod = -99999; this.mercyDeath = 0; this.nx = 0; this.drama = 0;
    this.cChoose = 0; this.timerOn = 0; this.turntimer = 0; this.attacked = 0; this.normalfight = 0; this.damagetimer = -1;
    this.con = 0; this.a4 = 0; this.a5 = 0; this.a6 = 0; this.bubble = null; this.blk = false; this.heartOn = true;
    this.shakeV = null; this.musVol = 0.9; this.musPaused = false; this.empty = null; this.fake = null; this.boxQueue = [];
  }

  // ---------------------------------------------------------------- utilidades para las balas
  add(o) { this.objs.push(o); return o; }
  heartBox() { const H = this.H; return { x1: H.x, y1: H.y, x2: H.x + 15, y2: H.y + 15 }; }   // caja completa (plataformas, botón FIGHT)
  // Zona que recibe daño: 4x4 en el centro del alma, como en Bad Time Simulator (el juego usa los 16x16 del sprite)
  hurtBox() { const H = this.H; return { x1: H.x + 6, y1: H.y + 6, x2: H.x + 9, y2: H.y + 9 }; }
  heartMoved() { const H = this.H; return Math.abs(H.xp - H.x) > 0.01 || Math.abs(H.yp - H.y) > 0.01; }
  menuHeartBox() {
    const S = this.state; let p = null;
    if (S === 'menu') p = [BUTTONS[this.menu][1] + 8, 445];
    if (['fightTarget', 'actTarget', 'actList', 'mercyList'].includes(S)) p = [72, 278];
    if (S === 'itemList') p = [72 + (this.itemPos % 2) * 240, 278 + Math.floor(this.itemPos / 2) * 32];
    return p && { x1: p[0], y1: p[1], x2: p[0] + 15, y2: p[1] + 15 };
  }
  shaker(n) { this.shakeV = { n, x: 0, y: 0 }; }     // obj_sans_shaker: la vista tiembla
  musicPause() { this.musPaused = true; setMusicVolume(0); }
  musicResume() { this.musPaused = false; setMusicVolume(this.musVol); }
  setMusVol(v) { this.musVol = v; if (!this.musPaused) setMusicVolume(v); }
  setBorder(n) { this.border = n; if (BORDERS[n]) this.ib = [...BORDERS[n]]; }
  ideal() { return this.ib; }
  moveBox() {
    if (this.insta) { const [l, r, t, b] = this.ib; Object.assign(this.box, { l, r, t, b }); return; }
    super.moveBox();
  }
  stopAllSounds() { stopAllAmbient(); stop(this.hurtSnd); }

  // obj_sansbullet_parent User Event 7: KARMA y daño (1 PV por frame como mucho)
  hit(o) {
    const b = this.body, hp = this.player.hp;
    if (b.lac < 4) { if (b.damageturn === 0) { this.km += o.karma; if (o.karma >= 3) o.karma = 2; this.bodyHurt(); } return; }
    if (hp >= 60) { this.km += o.karma; if (o.karma >= 3) o.karma = 2; } else if (hp >= 30) this.km += 1;
    this.bodyHurt();
  }
  bodyHurt() {                                       // obj_sansb_body User Event 2
    const b = this.body; if (b.damageturn !== 0 || this.state === 'gameover') return;
    stop(this.hurtSnd); this.hurtSnd = playSound('hurt');
    this.player.hp -= 1; b.damageturn = 1;
    if (this.player.hp <= 0) { this.player.hp = 0; this.gameOver(); }
  }
  heartImpact() {                                    // obj_heart User Event 7: choque contra la pared
    const H = this.H, speed = Math.hypot(H.hs, H.vs);
    if (speed <= 10) return;
    if (H.slamPain && this.player.hp > 1) this.player.hp -= 1;
    stop(this.impSnd); stop(this.hurtSnd);
    this.hurtSnd = playSound('hurt'); this.impSnd = playSound('impact');
    this.shaker(Math.floor(speed / 3));
  }

  // Globo de Sans (obj_blconwdflowey / scr_blcon_x): Z pasa al siguiente mensaje, X lo muestra entero
  say(msgs, typer, x, y, { small = false, stay = false } = {}) {
    this.bubble = { msgs, i: 0, typer, x, y, small, stay };
    this.bubbleWriter();
  }
  bubbleWriter() {
    const bl = this.bubble, b = this.body;
    bl.writer = new SWriter(bl.msgs[bl.i], bl.x + 30, bl.y + 10, bl.typer, { onFace: n => { b.face = n; }, onTorso: n => { b.torso = n; } });
  }
  updateBubble(inp) {
    const bl = this.bubble; if (!bl) return;
    bl.writer.update();
    if (inp.cancel) bl.writer.skip();
    else if (inp.confirm && bl.writer.done && !bl.stay) {
      if (++bl.i < bl.msgs.length) this.bubbleWriter(); else this.bubble = null;
    }
  }

  // ---------------------------------------------------------------- inicio (obj_sansb Create / Step con 1 ... 12)
  startIntro() {
    this.state = 'sIntro';
    if (this.single) {                               // práctica: directo al ataque
      this.krOn = true; playMusic('sans'); setMusicVolume(this.musVol); this.normalfight = 1; this.body.bounce = 1; this.startEnemyTurn();
      return;
    }
    this.con = 1; this.a4 = 30; this.heartOn = false; this.showBox = false;
    ambient('birds', 'assets/audio/mus_birdnoise.ogg', this);
  }
  introDone() {                                      // fac 22: empieza MEGALOVANIA y te toca
    if (this.single) return this.endTurn(false);
    this.normalfight = 1; playMusic('sans'); this.musVol = 0.9; this.musPaused = false; setMusicVolume(0.9);
    this.toMenu();
  }
  stepIntro() {
    if (this.a4 > 0 && --this.a4 === 0) this.con++;
    const c = this.con;
    if (c === 2) { this.say(T.intro, 107, this.sansx + 120, 110); this.con = 3; }
    if (c === 3 && !this.bubble) { this.con = 5; this.a4 = 10; }
    if (c === 6) {                                   // corte a negro: se callan los pájaros
      stopAmbient('birds'); playSound('sans_noise'); this.blk = true;
      this.insta = 1; this.ib = [240, 400, 225, 385]; this.H.x = 315; this.H.y = 300;
      this.con = 7; this.a4 = 8;
    }
    if (c === 8) {
      this.body.face = 5; this.krOn = true; this.heartOn = true; this.blk = false; playSound('sans_noise');
      this.go('sAttack'); this.H.mv = 1; this.H.spr = 'spr_heart'; this.showBox = true; this.con = 9; this.a4 = 20;
    }
    if (c === 10) { this.say([T.hell], 108, this.sansx + 120, 110 - 30, { small: true }); this.con = 11; }
    if (c === 11 && !this.bubble) { this.body.fac = 1; this.con = 12; }
  }

  // ---------------------------------------------------------------- turno de Sans: habla (mnfight = 1)
  startEnemyTurn() {
    if (this.state === 'gameover') return;
    if (this.boxQueue.length) { this.writer = new Writer(this.boxQueue.shift(), BORDER[0][0], BORDER[0][2]); return; }   // Check: 2 mensajes
    this.writer = null; this.go('sTalk'); this.a5 = 15; this.a6 = 1; this.H.mv = 0;
  }
  talk() {                                           // obj_sansb Alarm_6
    const b = this.body, H = this.H, ht = this.hitTry;
    let msgs = null;
    if (!this.single && ht > this.hitReached) {
      if (ht === 1) { b.face = 3; b.torso = 1; }
      if (ht >= 7 && ht <= 12) b.torso = 1;
      if (ht === 13) { b.torso = 0; b.sweat = 2; this.musicPause(); this.drama = 1; H.hs = H.vs = 0; this.mercymod = 999999; }
      if (ht === 14) { if (this.drama === 2) stopAmbient('chokedup'); b.torso = 1; }
      if (ht === 20 || ht === 21) b.sweat = 1; if (ht === 22) b.sweat = 2; if (ht === 23) b.sweat = 0;
      msgs = T.hit[ht]; this.hitReached = ht;
    }
    if (!this.single && this.mercyDeath === 1) {    // lo perdonaste
      b.torso = 0; b.face = 4; stopAllAmbient(); stopMusic(); msgs = T.spared;
    }
    // caja y alma
    let border = 35, blue = false;
    const s = this.single;
    if (s) {
      if (s.kind === 'a') { blue = true; border = s.a === 17 || s.a === 18 ? 39 : 35; }
      else border = s.kind === 'b' ? (s.a === 22 ? 36 : 37) : s.kind === 'shadow' ? 0 : 36;
    } else {
      if (ht < 13) { const ac = this.part >= 13 ? 10 : this.part; if (ac === 6 || ac === 8) border = 39; blue = true; }
      if (ht >= 14 && ht < 23 && this.nx === 1) {
        this.cChoose = 0; const p = this.part;
        border = p < 8 ? [37, 0, 36, 36, 37, 36, 0, 36][p] : 36;
        if (p >= 8) { this.cChoose = choose(3, 1, 2); border = this.cChoose === 3 ? 37 : 36; }
      }
      if (ht === 23) border = 36;
      if (this.mercyDeath === 1) border = 38;
    }
    if (border === 39) { this.setBorder(35); this.ib[0] -= 20; this.ib[1] += 40; this.ib[2] -= 20; this.border = 39; }   // borde 39
    else this.setBorder(border);
    H.spr = blue ? 'spr_heartblue' : 'spr_heart'; H.hs = H.vs = 0; H.js = 0;
    const [l, r, t, bb] = this.ib;
    H.x = Math.round((l + r) / 2); H.y = Math.round((t + bb) / 2) - 8;
    if (blue) { H.y = bb - 15; H.js = 1; }
    if (border === 39) H.y = bb - 70;
    if (this.mercyDeath === 1) H.x = Math.round((l + r) / 2) - 8;
    for (const o of this.mobjs) { o.terminate = 1; if (o.kind === 'menumaker') o.dead = true; }
    const yoff = Math.max(0, 250 - t);
    if (msgs) this.say(msgs, 109, this.sansx + 120, 110 - yoff);
  }
  stepTalk() {
    if (this.a6 > 0 && --this.a6 === 0) this.talk();
    if (this.bubble && this.a5 <= 3) this.a5 = 3;
    if (this.drama === 1 && this.bubble && this.bubble.i >= 2) { this.drama = 2; ambient('chokedup', 'assets/audio/mus_chokedup.ogg', this, 0.8); }
    if (!this.a6 && this.a5 > 0 && --this.a5 === 0) {   // Alarm_5: a atacar
      this.bubble = null; this.body.face = 0; this.body.torso = 0;
      this.go('sAttack'); if (this.H.mv === 0) this.H.mv = 1; this.attacked = 0;
    }
  }

  // ---------------------------------------------------------------- turno de Sans: ataca (mnfight = 2)
  startAttack() {                                    // obj_sansb Step (mnfight 2, attacked 0)
    const H = this.H, b = this.body, ht = this.hitTry, s = this.single;
    this.attacked = 1; this.krOn = true; this.sp = Math.max(this.sp, 5); this.turntimer = 10; this.timerOn = 1;
    if (s) {
      if (s.kind === 'a') { H.mv = 2; H.spr = 'spr_heartblue'; b.aType(s.a); if (this.border === 39) { H.y = this.ib[3] - 70; H.vs = 2; } }
      else { H.mv = 1; H.spr = 'spr_heart'; }
      if (s.kind === 'b') b.aType(s.a);
      if (s.kind === 'shadow') { this.timerOn = 0; this.add(new ShadowGen(this, s.level, s.max, s.a0 || 0)); }
      if (s.kind === 'smash') { this.timerOn = 0; b.smash(s.lv); }
      if (s.kind === 'intro') { this.timerOn = 0; b.fac = 1; }
      if (s.kind === 'final') {
        this.timerOn = 0; this.insta = 1; b.lac = 4; this.setMusVol(0.9);
        const [l, r, t, bb] = this.ib; H.x = Math.round((l + r) / 2); H.y = Math.round((t + bb) / 2) - 8;
      }
      return;
    }
    if (this.mercyDeath === 0) {
      if (ht < 13) {
        H.mv = 2; H.spr = 'spr_heartblue';
        b.aType(this.part < 13 ? PHASE1[this.part] : choose(1, 5, 21, 16));
        if (this.border === 39) { H.y = this.ib[3] - 70; H.vs = 2; }
      }
      if (ht >= 14 && ht < 23 && this.nx === 1) {
        this.turntimer = 20; this.timerOn = 0; H.mv = 1; H.spr = 'spr_heart';
        const p = this.part, c = this.cChoose;
        if (p === 0) b.aType(12);
        if (p === 1) this.add(new ShadowGen(this, 1, 5));
        if (p === 2) b.smash(0);
        if (p === 3) b.smash(1);
        if (p === 4) b.aType(13);
        if (p === 5) b.aType(22);
        if (p === 6) this.add(new ShadowGen(this, 2, 6, 4));
        if (p === 7) b.smash(2);
        if (p >= 8) { if (c === 1) b.smash(2); if (c === 2) this.add(new ShadowGen(this, 2, 6, 4)); if (c === 3) b.aType(13); }
      }
      if (ht === 23) {
        this.border = -1; b.lac = 4; this.insta = 1; this.timerOn = 0;
        const [l, r, t, bb] = this.ib; H.x = Math.round((l + r) / 2); H.y = Math.round((t + bb) / 2) - 8;
      }
      if (ht === 14 && this.nx === 0) {
        this.nx = 1; this.mercymod = -10000; this.musicResume(); this.part = -1;
        this.add(new ShadowGen(this, 0, 5)); this.timerOn = 0;
      }
    } else {
      this.mercymod = -999999; this.timerOn = 0;
      const [l, r, t, bb] = this.ib; H.x = Math.round((l + r) / 2) - 8; H.y = Math.round((t + bb) / 2) - 8; H.spr = 'spr_heart'; H.mv = 1;
      b.aType(20);
    }
    this.turns++; this.part++;
    const F = T.flavor, km = this.km; let f = this.flavor;
    if (ht < 4) f = F.keep; if (ht >= 4) f = F.wearier; if (ht >= 8) f = F.slower; if (ht >= 13) f = F.turning;
    if (km > 0) f = F.sins1; if (km >= 10) f = F.sins2; if (km >= 20) f = F.karma; if (km >= 30) f = F.doomed;
    if (ht === 15) f = F.real; if (ht >= 19) f = F.reading; if (ht >= 20) f = F.tired; if (ht >= 21) f = F.preparing; if (ht >= 22) f = F.special;
    this.flavor = f;
  }
  endTurn(maker) {                                   // mnfight = 3: se borran las balas y vuelve el menú
    if (this.state === 'gameover') return;
    if (maker && !this.single) { const m = new MenuBoneMaker(this); if (!m.dead) this.mobjs.push(m); }
    this.objs = this.objs.filter(o => o.kind === 'fx');
    this.timerOn = 0; this.attacked = 0; this.insta = 0; this.shakeV = null;
    if (this.single) this.flavor = '';
    this.toMenu();
  }
  toMenu() { this.H.mv = 0; this.H.hs = this.H.vs = 0; this.showBox = true; this.startMenu(); }

  // ---------------------------------------------------------------- el alma (obj_heart: teclado, Step, bordes)
  heartStep(K) {
    const H = this.H, sp = K.cancel ? this.sp / 2 : this.sp;     // X mantenida: mitad de velocidad
    if (H.mv === 1) { if (K.left) H.x -= sp; if (K.up) H.y -= sp; if (K.right) H.x += sp; if (K.down) H.y += sp; }
    if (H.mv === 2) { if (K.left) H.x -= sp; if (K.right) H.x += sp; if (K.up && H.js === 1 && H.vs === 0) { H.js = 2; H.vs = -6; } }
    if (H.mv === 11) { H.vs = 0; if (K.up) H.y -= sp; if (K.down) H.y += sp; if (K.left && H.js === 1 && H.hs === 0) { H.js = 2; H.hs = -6; } }
    if (H.mv === 12) { H.hs = 0; if (K.left) H.x -= sp; if (K.right) H.x += sp; if (K.down && H.js === 1 && H.vs === 0) { H.js = 2; H.vs = 6; } }
    if (H.mv === 13) { H.vs = 0; if (K.up) H.y -= sp; if (K.down) H.y += sp; if (K.right && H.js === 1 && H.hs === 0) { H.js = 2; H.hs = 6; } }
    if (H.js === 2) {                                // gravedad del alma azul (hacia el lado de movement)
      const pos = v => { if (v > 0.5 && v < 8) v += 0.6; if (v > -1 && v <= 0.5) v += 0.2; if (v > -4 && v <= -1) v += 0.5; if (v <= -4) v += 0.2; return v; };
      if (H.mv === 2) { if (!K.up && H.vs <= -1) H.vs = -1; H.vs = pos(H.vs); }
      if (H.mv === 11) { if (!K.left && H.hs <= -1) H.hs = -1; H.hs = pos(H.hs); }
      if (H.mv === 12) { if (!K.down && H.vs >= 1) H.vs = 1; H.vs = -pos(-H.vs); }
      if (H.mv === 13) { if (!K.right && H.hs >= 1) H.hs = 1; H.hs = -pos(-H.hs); }
    }
    if (!H.ignore) this.heartClamp();
    H.x += H.hs; H.y += H.vs;
    if (!H.ignore) this.heartClamp();
  }
  heartClamp() {
    const H = this.H, [l, r, t, b] = this.ib;
    if (H.x < l + 4) { H.x = l + 4; this.heartImpact(); if (H.hs < 0) H.hs = 0; if (H.mv === 13) H.js = 1; }
    if (H.y < t + 4) { H.y = t + 4; this.heartImpact(); if (H.vs < 0) H.vs = 0; if (H.mv === 12) H.js = 1; }
    if (H.x > r - 16) { H.x = r - 16; this.heartImpact(); if (H.hs > 0) H.hs = 0; if (H.mv === 11) H.js = 1; }
    if (H.y > b - 16) { H.y = b - 16; this.heartImpact(); if (H.vs > 0) H.vs = 0; if (H.mv === 2) H.js = 1; }
  }
  emptyBorderStep() {                                // obj_emptyborder_s: la caja se puede empujar hasta el botón FIGHT
    const E = this.empty, H = this.H;
    E.x = E.ix; E.y = E.iy;
    const jit = () => { E.x = E.ix + Math.random() - Math.random(); E.y = E.iy + Math.random() - Math.random(); };
    if (H.x < E.x + 4) { if (E.x > E.maxx) { E.ix -= 0.5; E.x -= 0.5; jit(); } else { E.x = E.maxx; E.ix = E.maxx; } H.x = Math.ceil(E.x + 5); }
    if (H.y < E.y + 4) H.y = E.y + 4;
    if (H.x > E.x + 165 - 16) H.x = E.x + 165 - 16;
    if (H.y > E.y + 165 - 16) { if (E.y < E.maxy && E.x === E.maxx) { E.iy += 0.5; E.y += 0.5; jit(); } H.y = Math.floor(E.y + 165 - 17); }
  }

  // ---------------------------------------------------------------- bucle
  // Movimiento fluido: lo que se interpola entre frames al dibujar (src/smooth.js)
  smoothList() { return [this.H, this.box, this.body, this.empty, this.target, this.dmgw, ...this.objs, ...this.mobjs]; }
  update(inp) {
    if (!this._sm) { this._sm = new Smoother(); this.smooth = true; }
    this._sm.capture(this.smoothList());
    if (this.state === 'gameover') return super.update(inp);
    super.update(inp);
    if (this.state === 'gameover') return;
    const H = this.H, b = this.body;
    b.tick();
    H.xp = H.x; H.yp = H.y;
    this.updateBubble(inp);
    if (this.con > 0 && this.con < 12) this.stepIntro();
    if (this.state === 'sTalk') this.stepTalk();
    if (this.state === 'sAttack') {
      if (H.mv > 0) this.heartStep(inp.held);
      if (this.empty) this.emptyBorderStep();
      if (this.fake) {                               // obj_s_fakefightbt: el botón FIGHT falso
        const F = this.fake;
        if (F.on === 1 && inp.confirm && F.con === 0) { F.con = 1; b.death_c = 1; H.mv = -1; }
        F.on = hit(rotBBox('spr_fightbt', 32, 432), this.heartBox()) ? 1 : 0;
      }
      if (this.normalfight === 1 && this.attacked === 0) this.startAttack();
      if (!this.single && this.mercymod === 999999 && this.state === 'sAttack') {
        H.hs = H.vs = 0; this.flavor = T.flavor.sparing; this.turntimer = -1; this.toMenu();
      } else if (this.timerOn && this.turntimer <= 0) this.endTurn(this.hitTry >= 15 && this.hitTry < 23);
      this.turntimer--;
    }
    // balas: primero las plataformas (depth 0) y luego lo demás
    for (const o of [...this.objs]) if (!o.dead) o.update(this);
    if (this.state === 'sAttack') {
      for (const o of this.objs) if (!o.dead && o.kind === 'plat') o.collide(this);
      for (const o of this.objs) if (!o.dead && o.kind !== 'plat' && o.collide) { o.collide(this); if (this.state === 'gameover') return; }
    }
    this.objs = this.objs.filter(o => !o.dead);
    b.update();
    for (const o of [...this.mobjs]) { if (!o.dead) o.update(this); if (this.state === 'gameover') return; }
    this.mobjs = this.mobjs.filter(o => !o.dead);
    const V = this.shakeV;                           // obj_sans_shaker
    if (V) { V.x = choose(-1, 1) * V.n; V.y = choose(1, -1) * V.n; if (--V.n <= 0) this.shakeV = null; }
    // sonidos que pide obj_sansb (uno por frame aunque aparezcan varios blasters)
    if (this.pCut) { this.pCut = 0; stop(this.cutSnd); this.cutSnd = playSound('sans_cut', { volume: 0.56 }); playSound('arrow'); }
    if (this.pPower) { this.pPower = 0; stop(this.powSnd); this.powSnd = playSound('sans_power', { volume: 0.56 }); }
    if (this.pBeam) {
      this.pBeam = 0; stop(this.beamSnd); stop(this.beamSndA);
      this.beamSnd = playSound('sans_beam', { volume: 0.56 }); this.beamSndA = playSound('sans_beam_a', { volume: 0.42 });
    }
    if (this.fadeOut > 0) { this.fadeOut += 0.03; if (this.fadeOut >= 1.3 && this.onExit) { const f = this.onExit; this.onExit = null; stopMusic(); stopAllAmbient(); f(); } }
  }

  // ---------------------------------------------------------------- ganchos de la base (FIGHT / ACT / ITEM / MERCY)
  enemyTake() { return 0; }
  onStrike(dmg) {
    if (dmg === null) {                              // no le diste a la barra: MISS (hurtanim 5)
      this.dmgw = new DmgWriter(this, 0, this.sansx + 57 - 48, 110 - 24, 30);
      this.later(1, () => this.startEnemyTurn());
      return;
    }
    this.slice = new Slice(this);                    // el tajo cae donde estaba Sans, que ya se apartó (dodge)
    this.damagetimer = this.slice.damagetimer;
    this.later(this.slice.damagetimer, () => {       // obj_sansb Alarm_3: MISS, hit_try++ y, tras temblar, su turno
      this.dmgw = new DmgWriter(this, 0, this.sansx + 57 - 48, 110 - 50, 0);
      this.hitTry++;
      this.later(32, () => { if (this.dmgw) this.dmgw.life = 15; this.startEnemyTurn(); });
    });
  }
  updateSub(inp) {
    if (this.state === 'actList' && inp.confirm) {
      playSound('select');
      const msgs = this.hitTry > 0 ? [T.check1, T.check2] : [T.check0];
      this.writer = new Writer(msgs[0], BORDER[0][0], BORDER[0][2]); this.boxQueue = msgs.slice(1); this.go('actText');
      return;
    }
    if (this.state === 'mercyList' && inp.confirm) { // scr_mercystandard: solo funciona cuando él te perdona
      playSound('select');
      if (this.mercymod === 999999 && !this.single) this.mercyDeath = 1;
      this.startEnemyTurn();
      return;
    }
    super.updateSub(inp);
  }

  // Número gigante del golpe final (obj_dmgwriter con drawbar = 0)
  bigDamage(x, y, dmg) {
    const d = new DmgWriter(this, dmg, x, y, 0);
    d.draw = ctx => {
      const s = String(dmg), place = s.length - 1;
      for (let i = place; i >= 0; i--) drawSprite(ctx, 'spr_dmgnum_o', +s[place - i], d.x + 30 - i * 32 + place * 16, d.y - 28, { color: '#f00' });
    };
    this.dmgw = d;
  }

  // ---------------------------------------------------------------- dibujo (en el orden de depth del juego)
  draw(ctx) {
    const restore = this._sm && this.state !== 'gameover' ? this._sm.apply(this.smoothList(), this.alpha) : null;
    try { this.drawFrame(ctx); } finally { if (restore) restore(); }
  }
  drawFrame(ctx) {
    if (this.state === 'gameover') return this.drawGameOver(ctx);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 640, 480);
    ctx.save();
    if (this.shakeV) ctx.translate(this.shakeV.x, this.shakeV.y);
    const bl = this.bubble;
    if (bl) { drawSprite(ctx, bl.small ? 'spr_blconsm' : 'spr_blconwdshrt', 0, bl.x, bl.y); bl.writer.draw(ctx); }   // depth 10
    for (const o of this.objs) if (o instanceof SleepZ) o.draw(ctx, this);                               // depth 6
    this.drawButtons(ctx);                                                                                 // depth 2
    this.body.draw(ctx);                                                                                   // depth 0
    if (this.empty) drawSprite(ctx, 'spr_emptyborder', 0, Math.round(this.empty.x), Math.round(this.empty.y));
    for (const o of this.objs) if (o.kind === 'plat') o.draw(ctx, this);
    this.drawHeart(ctx);
    for (const o of this.objs) if (!['plat', 'fx', 'shadowgen', 'gen'].includes(o.kind)) o.draw(ctx, this);   // depth -1
    for (const o of this.objs) if (o.kind === 'fx' && !(o instanceof SleepZ)) o.draw(ctx, this);          // depth -10
    for (const o of this.mobjs) o.draw(ctx, this);                                                         // depth -20
    for (const o of this.objs) if (o.kind === 'shadowgen') o.draw(ctx, this);                              // depth -50
    this.drawStats(ctx);                                                                                   // depth -450
    if (this.writer) this.writer.draw(ctx);
    this.drawSubmenu(ctx);
    if (this.target) this.target.draw(ctx);
    if (this.showBox) this.drawBox(ctx);                                                                   // depth -999
    if (this.slice) this.slice.draw(ctx);
    if (this.dmgw) this.dmgw.draw(ctx);
    if (this.blk) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 640, 480); }
    ctx.restore();
    if (this.fadeOut > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, this.fadeOut)})`; ctx.fillRect(0, 0, 640, 480); }
  }
  drawBox(ctx) {                                     // los 4 bordes blancos (obj_lborder, obj_uborder...)
    const { l, r, t, b } = this.box, R = (x1, y1, x2, y2) => ctx.fillRect(Math.round(x1), Math.round(y1), Math.round(x2) - Math.round(x1), Math.round(y2) - Math.round(y1));
    ctx.fillStyle = '#fff';
    R(l, t, l + 5, b + 5); R(r, t, r + 5, b + 5); R(l, t, r + 5, t + 5); R(l, b, r + 5, b + 5);
  }
  drawHeart(ctx) {
    const S = this.state, H = this.H;
    if (S === 'sTalk' || S === 'sAttack' || S === 'sIntro') {
      if (!this.heartOn || S === 'sIntro') return;
      this.hx = H.x; this.hy = H.y;
      drawSprite(ctx, H.spr, 0, Math.round(H.x), Math.round(H.y)); return;
    }
    this.soul = H.spr === 'spr_heart_battle_pl' ? 'spr_heart' : H.spr;
    super.drawHeart(ctx);
  }
  drawButtons(ctx) {
    const active = ['menu', 'itemList', 'fightTarget', 'actTarget', 'actList', 'mercyList'].includes(this.state);
    BUTTONS.forEach(([spr, x], i) => {
      if (i === 0 && this.fake) return drawSprite(ctx, sprL('spr_fightbt'), this.fake.on, 32, 432);   // obj_s_fakefightbt
      drawSprite(ctx, sprL(spr), active && i === this.menu ? 1 : 0, x, 432);
    });
  }
  drawStats(ctx) {                                   // scr_binfowrite con global.flag[271] (barra de KARMA)
    if (!this.krOn) return super.drawStats(ctx);
    const p = this.player, km = Math.max(0, Math.min(this.km, 40, p.hp - 1));
    const w = drawText(ctx, 'fnt_curs', p.name, 30, 400);
    const lvEnd = 30 + w + 32 + drawText(ctx, 'fnt_curs', `${tr('LV')} ${p.lv}`, 30 + w + 32, 400);
    const X = Math.max(0, lvEnd + 4 - 220);         // con un nombre largo (p. ej. "JUGADOR") todo se corre a la derecha
    drawSprite(ctx, sprL('spr_hpname'), 0, 220 + X, 400);
    const W1 = Math.round(p.maxHp * 1.2), hw = Math.round(p.hp * 1.2);
    ctx.fillStyle = '#bf0000'; ctx.fillRect(255 + X, 400, W1 + 1, 21);
    ctx.fillStyle = '#ff0'; ctx.fillRect(255 + X, 400, hw + 1, 21);
    if (km > 0) { ctx.fillStyle = '#f0f'; ctx.fillRect(255 + X + hw - Math.round(km * 1.2), 400, Math.round(km * 1.2) + 1, 21); }
    drawSprite(ctx, 'spr_krmeter', 0, 265 + X + W1, 405);
    const hp = p.hp < 10 ? '0' + Math.max(0, p.hp) : String(p.hp);
    drawText(ctx, 'fnt_curs', `${hp} / ${p.maxHp}`, 305 + X + W1, 400, { color: km > 0 ? '#f0f' : '#fff' });
  }
  drawSubmenu(ctx) {
    const x = BORDER[0][0] + 20, y = BORDER[0][2] + 20, line = s => drawText(ctx, 'fnt_main', s, x, y, { mono: 16 });
    const S = this.state;
    if (S === 'fightTarget' || S === 'actTarget') {
      line('   * ' + T.name);
      if (S === 'fightTarget') { ctx.fillStyle = '#0f0'; ctx.fillRect(x + 16 * 12, y + 5, 101, 17); }
    }
    if (S === 'actList') line('   * ' + tr('Check'));
    if (S === 'mercyList') line('   * ' + tr('Spare'));
    if (S === 'itemList') super.drawSubmenu(ctx);
  }
}
