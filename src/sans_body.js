// obj_sansb_body: el cuerpo de Sans. En el juego casi todo el combate vive en su Draw: los ataques (User Event 0 con a_type),
// el primer ataque (fac), los golpes contra las paredes (smasher), el ataque final (lac), el sueño (sleep_c),
// el golpe final (death_c), el esquive de tus ataques (dodge) y el KARMA. Aquí update() hace esa lógica y draw() el dibujo.
import { drawSprite, playSound } from './assets.js';
import { choose, rnd, ldx, ldy } from './gm.js';
import { T } from './sans_text.js';
import { BoneBul, BonePlat, BoneStab, BoneLoop, WallNormal, Blaster, GasterGen, PlatGen3, ShadowGen, StrikeTemp, SleepZ, scrBwall } from './sans_bullets.js';

export class SansBody {
  constructor(W) {                                   // Create_0
    this.W = W; this.x = 320; this.y = 120; this.hs = 0; this.a = Array(9).fill(0);
    this.face = 4; this.torso = 0; this.sweat = 0; this.bounce = 0; this.siner = 0; this.yoff = 0; this.xoff = 0; this.legx = 0; this.legy = 0;
    this.deadtest = 0; this.repeater = 0; this.movearm = 0; this.arm_i = 0; this.heady = 0; this.headx = 0; this.aspeed = 1; this.facetype = 0; this.f_i = 0;
    this.fac = 0; this.lac = 0; this.mk_c = 0; this.intensity = 15; this.smasher = 0; this.smashcon = 0; this.smashlv = 2; this.smashamt = 0; this.smashmax = 8;
    this.prevsmash = -1; this.dodge = 0; this.death_c = 0; this.asleep = 0; this.asleep_timer = 0; this.sleep_c = 0; this.sleep_t = 0; this.km_t = 0;
    this.prevhp = W.player.hp; this.damageturn = 0; this.inv_timer = 0; this.bof = null; this.xtimer = 0;
  }
  // Alarmas (principio del step): 5 lac, 6 death_c, 7 fac, 8 smashcon
  tick() {
    for (const [i, k] of [[5, 'lac'], [6, 'death_c'], [7, 'fac'], [8, 'smashcon']]) if (this.a[i] > 0 && --this.a[i] === 0) this[k] += 1;
  }
  setArm(n) { this.movearm = n; this.arm_i = 0; this.heady = 0; this.headx = 0; }
  // User Events 10..13: lanza el alma azul contra una pared (0 abajo, 1 derecha, 2 arriba, 3 izquierda)
  slam(d) {
    const H = this.W.H, v = this.intensity;
    H.js = 0; H.hs = 0; H.vs = 0;
    if (d === 0) { H.mv = 2; H.spr = 'spr_heartblue'; H.vs = v; }
    if (d === 1) { H.mv = 11; H.spr = 'spr_heartblue_r'; H.hs = v; }
    if (d === 2) { H.mv = 12; H.spr = 'spr_heartblue_u'; H.vs = -v; }
    if (d === 3) { H.mv = 13; H.spr = 'spr_heartblue_l'; H.hs = -v; }
  }
  red(spr = 'spr_heart_battle_pl') { const H = this.W.H; H.mv = 1; H.spr = spr; H.hs = 0; H.vs = 0; }
  smash(lv) { this.smasher = 1; this.smashlv = lv; this.smashcon = 0; }
  blaster(x, y, rot, ix, iy, sc = 2, o = {}) { return this.W.add(new Blaster(this.W, x, y)).set({ idealrot: rot, idealx: ix, idealy: iy, xs: sc, ys: sc, ...o }); }

  // ---------------------------------------------------------------- User Event 0: los ataques (a_type)
  aType(n) {
    const W = this.W, H = W.H, b = () => W.ib[3];
    const sbo = (...a) => W.add(new BoneBul(W, ...a)), plat = (...a) => W.add(new BonePlat(W, ...a)), bwall = (...a) => scrBwall(W, ...a);
    W.timerOn = 1;
    if (n === 0) { W.turntimer = 200; for (let i = 0; i < 8; i++) { sbo(20, 6, 40 + i * 20, 0); sbo(20, -6, 40 + i * 20, 0); sbo(40, 6, 40 + i * 20, 2); sbo(40, -6, 40 + i * 20, 2); } }
    if (n === 1) { W.turntimer = 190; for (let i = 0; i < 8; i++) { sbo(20, 7, 40 + i * 19, 0); sbo(20, -7, 40 + i * 19, 0); sbo(40, 7, 40 + i * 19, 2); sbo(40, -7, 40 + i * 19, 2); } }
    if (n === 3) {
      W.turntimer = 190;
      for (const [h, s, d, t] of [[100, -10, 25, 1], [20, -10, 32, 0], [100, -10, 47, 1], [20, -10, 54, 0], [100, -10, 69, 1], [20, -10, 76, 0],
                                  [20, 10, 105, 0], [100, 10, 117, 1], [20, 10, 127, 0], [100, 10, 139, 1], [20, 10, 149, 0], [100, 10, 161, 1]]) sbo(h, s, d, t);
    }
    if (n === 5) { W.turntimer = 230; for (let i = 0; i < 8; i++) { sbo(20, 4, 65 + i * 19, 0); sbo(28, -4, 65 + i * 19, 2); } }
    if (n === 6) {
      W.turntimer = 250;
      bwall(30, 4, 60, 41); plat(40, 4, 70, 30); plat(40, 5, 120, 30); plat(40, 6, 160, 30);
      sbo(90, 7, 160, 2); sbo(90, 7, 162, 2); sbo(90, 7, 164, 2); sbo(40, 9, 222, 2);
    }
    if (n === 7) {
      W.turntimer = 290;
      bwall(30, -4, 60, 58); plat(40, -5, 70, 25); sbo(70, -5, 90, 0); plat(90, -5, 95, 25); plat(40, -5, 110, 25); plat(60, -5, 150, 25);
      sbo(90, -5, 148, 2); plat(50, -5, 170, 25); sbo(80, -5, 168, 2); plat(70, -5, 190, 25); sbo(100, -5, 188, 2); plat(90, -2, 230, 15);
      sbo(110, -8, 240, 0); sbo(40, 3, 260, 2);
    }
    if (n === 8) { W.turntimer = 240; W.add(new PlatGen3(1)); }
    if (n === 12 || n === 13) {
      W.turntimer = 240; H.hs = H.vs = 0; H.mv = 1;
      W.ib = [120, 520, b() - 200, b()];
      W.add(new GasterGen(n === 12 ? 1 : 2));
    }
    if (n === 15) { W.turntimer = 250; W.add(new PlatGen3(2)); }
    if (n === 16) { W.turntimer = 240; W.add(new PlatGen3(3)); }
    if (n === 17 || n === 18) {
      W.turntimer = 220;
      bwall(20, 2, 3, 50); bwall(20, 2, -5, 20);
      H.y = b() - 70; H.vs = 1;
      const p = plat(50, 0, 0, n === 17 ? 20 : 15); p.jud = 1; p.x -= 150; H.x -= 150;
      const [, r, t] = W.ib;
      const L = n === 17 ? [[260, 40, -4], [260, 125, -4], [180, 0, 5], [180, 95, 5], [100, 20, -3], [100, 105, -3]]
                         : [[260, 40, -3], [260, 105, -3], [260, 170, -3], [180, 0, 4], [180, 90, 4], [100, 40, -3], [100, 105, -3], [100, 170, -3]];
      for (const [dx, dy, vs] of L) W.add(new BoneLoop(r - dx, t + dy, vs));
    }
    if (n === 20) {                                  // la trampa de perdonarlo
      H.hs = H.vs = 0; W.timerOn = 0;
      W.ib = [270, 370, b() - 100, b()];
      H.x = W.ib[0] + 42; H.y = W.ib[2] + 42; this.red();
      this.mk_c_timer = 0; this.mk_c = 1;
    }
    if (n === 21 || n === 23) {
      W.turntimer = 210;
      const A = n === 21 ? { 20: 7, 30: 9, 40: 16, 60: 22 } : { 20: 9, 30: 11, 40: 19, 60: 25 };
      const B = n === 21 ? { 20: 12, 30: 13, 40: 16, 60: 22 } : { 20: 15, 30: 17, 40: 19, 60: 25 };
      let vtotal = 0;
      while (vtotal < 150) {
        const ht = choose(20, 30, 40, 60); let xx = choose(-2, 0, 2), down = 0;
        if (ht === 60) { xx = 0; down = 1; } if (ht === 40) xx = 0;
        vtotal += A[ht];
        const d = 32 + vtotal;
        sbo(ht, 8 + (down ? -1 : xx), d, 0); sbo(ht, -8 + (down ? 1 : xx), d, 0);
        sbo(ht + 24, 8 + (down ? -1 : xx), d, 2); sbo(ht + 24, -8 + (down ? 1 : xx), d, 2);
        vtotal += B[ht];
      }
    }
    if (n === 22) {
      W.turntimer = 180; H.hs = H.vs = 0; H.mv = 1;
      W.ib = [240, 400, b() - 160, b()];
      const [l, r, t, bb] = W.ib;
      H.x = l + 76; H.y = t + 76;
      for (let i = 0; i < 7; i++) {
        W.add(new WallNormal(l - 110, t - 300 - i * (216 - i * 3), 'spr_s_bonewall_wide', 0, 10));
        W.add(new WallNormal(r - 70, bb + 300 + i * (216 - i * 3), 'spr_s_bonewall_wide', 0, -10));
      }
    }
  }

  // ---------------------------------------------------------------- Draw_0 (la lógica)
  update() {
    const W = this.W, H = W.H;
    this.x += this.hs;
    // Invencibilidad: por defecto el alma puede recibir 1 de daño cada frame
    let inv_check = 0; this.inv_timer++;
    if (this.lac >= 4 && W.player.hp <= 10 && this.inv_timer >= 2) { inv_check = 1; this.inv_timer = 0; }
    if (inv_check === 0) this.damageturn = 0;
    this.y = W.ib[2] - 130;
    if (this.bounce === 3) { this.siner++; this.yoff = Math.sin(this.siner / 18) * 2; }
    if (this.bounce === 2) { this.siner++; this.yoff = Math.sin(this.siner / 15) * 4; }
    if (this.bounce === 1) { this.siner++; this.yoff = Math.sin(this.siner / 3); this.xoff = Math.cos(this.siner / 6); }
    if (this.bounce === 0) { this.siner = 0; this.yoff = 0; this.xoff = 0; }
    this.arms();
    if (this.facetype === 1) this.f_i++;
    this.facLogic(); this.smashLogic(); this.lacLogic();
    if (this.mk_c === 1 && ++this.mk_c_timer >= 15) {
      this.torso = 1; this.face = 3; this.mk_c = 2;
      W.add(new BoneStab({ retain: 300, height: 100, dir: 0, warning: 0 }));
    }
    this.dodgeLogic(); this.deathLogic(); this.sleepLogic(); this.karma();
  }

  arms() {                                           // los brazos avanzan un paso por frame y mueven la cabeza
    const m = this.movearm;
    const cap = { 1: 11, 2: 11, 3: 9, 4: 10 }[m]; if (!cap) return;
    if (this.arm_i >= cap) this.arm_i = cap;
    this.armSpr = { 1: 'spr_sansb_rightstrike', 2: 'spr_sansb_handup', 3: 'spr_sansb_handdown', 4: 'spr_sansb_rightstrike' }[m];
    this.armFrame = m === 4 ? Math.floor(5 - this.arm_i / 2) : Math.floor(this.arm_i / 2);
    const k = this.arm_i;
    if (m === 1) { if (k === 2) this.headx = -4; if (k === 4) this.headx = -8; if (k === 6) this.headx = 10; if (k === 8) this.headx = 4; }
    if (m === 2) { if (k === 0) this.heady = 4; if (k === 2) this.heady = 10; if (k === 4) this.heady = 4; if (k === 6) this.heady = -4; if (k === 8) this.heady = 0; }
    if (m === 3) { if (k === 0) this.heady = 0; if (k === 2) this.heady = 0; if (k === 4) this.heady = 6; if (k === 6) this.heady = 10; }
    if (m === 4) { if (k >= 10) this.headx = 0; if (k === 8) this.headx = -4; if (k === 6) this.headx = -8; if (k === 4) this.headx = 10; if (k === 2) this.headx = 4; }
    if (this.arm_i < cap) this.arm_i += this.aspeed; else this.arm_i = cap;
  }

  facLogic() {                                       // el primer ataque, justo después de "Should be burning in hell."
    const W = this.W, f = this.fac;
    if (f === 1) {
      this.intensity = 25; W.ib = [240, 400, W.ib[3] - 160, W.ib[3]];
      this.bounce = 0; this.facetype = 1; this.setArm(3); W.pCut = 1; this.fac = 2; this.a[7] = 7;
    }
    if (f === 3) { this.slam(0); this.fac = 4; this.a[7] = 14; }
    if (f === 5) {
      this.fac = 6; this.a[7] = 10; this.setArm(2); this.facetype = 0;
      W.add(new BoneStab({ dir: 0, height: 55, warning: 6, retain: 30 }));
      for (let i = 0; i < 20; i++) { W.add(new BoneBul(W, 135 - Math.sin(i / 3) * 28, 12, 40 + i * 2, 2)); W.add(new BoneBul(W, 90 - Math.sin(i / 3) * 28, 12, 40 + i * 2, 0)); }
    }
    if (f === 7) { this.intensity = 15; this.fac = 8; this.a[7] = 10; }
    if (f === 9) { this.setArm(1); this.fac = 9.1; this.a[7] = 8; this.red(); playSound('bell'); }
    if (f === 10.1) { W.pCut = 1; this.fac = 10; this.a[7] = 37; }
    const [l, r, t, b] = W.ib;
    const four = () => {
      this.setArm(0);
      this.blaster(0, 0, 90, l - 50, t + 20); this.blaster(640, 480, -90, r + 50, b - 20);
      this.blaster(0, 0, 0, l + 20, t - 60); this.blaster(640, 480, 180, r - 20, b + 60);
      for (const o of W.objs) if (o.kind === 'blaster') { o.pause = 10; o.terminal = 8; }
    };
    if (f === 11) { four(); this.fac = 12; this.a[7] = 25; }
    if (f === 13) {
      this.setArm(0);
      this.blaster(0, 0, 45, l - 50, t - 50); this.blaster(640, 0, -45, r + 50, t - 50);
      this.blaster(0, 480, 135, l - 50, b + 50); this.blaster(640, 480, -135, r + 50, b + 50);
      for (const o of W.objs) if (o.kind === 'blaster') { o.pause = 10; o.terminal = 8; }
      this.fac = 14; this.a[7] = 25;
    }
    if (f === 15) { four(); this.fac = 16; this.a[7] = 20; }
    if (f === 17) {
      this.blaster(0, 240, 90, l - 100, t + 80, 3, { pause: 20, terminal: 15 });
      this.blaster(640, 240, -90, r + 100, t + 80, 3, { pause: 20, terminal: 15 });
      this.fac = 18; this.a[7] = 90;
    }
    if (f === 19) {
      this.face = 0; this.torso = 0;
      if (W.single) this.fac = 20;
      else { W.say(T.huh, 109, W.sansx + 120, this.y - 10); this.fac = 20; return; }
    }
    if (this.fac === 20 && !W.bubble) {
      this.face = 0; this.torso = 0; this.bounce = 1; W.insta = 0;
      W.flavor = T.badtime; W.setBorder(0); this.fac = 21; this.a[7] = 5;
    }
    if (f === 22) { W.introDone(); this.fac = -1; }
  }

  smashLogic() {                                     // smasher: te lanza contra una pared y salen huesos de ella
    if (this.smasher !== 1) return;
    const W = this.W, H = W.H, lv = this.smashlv, arm = d => this.setArm([3, 1, 2, 4][d]);
    if (this.smashcon === 0) {
      const [l, r, t, b] = W.ib;
      H.x = l + Math.floor(r - l) / 2; H.y = t + Math.floor(b - t) / 2; this.red();
      let d = choose(0, 1, 2, 3);
      for (let k = 0; k < 10; k++) if (this.prevsmash === d) d = choose(0, 1, 2, 3);
      if (d === this.prevsmash) { d++; if (d > 3) d = 0; }
      this.smashdir = this.prevsmash = d; this.smashcon = 1;
      this.aspeed = lv === 2 ? 2 : 1; arm(d); this.a[8] = lv === 2 ? 4 : 8;
    }
    if (this.smashcon === 2) { this.xtimer = 0; this.intensity = 16; this.slam(this.smashdir); this.smashcon = 3; }
    if (this.smashcon === 3) {
      this.xtimer++;
      if (Math.hypot(H.hs, H.vs) < this.intensity && this.xtimer >= 5) {
        this.xtimer = 0;
        const bs = W.add(new BoneStab({ warning: 12, height: 25, retain: 4, dir: this.smashdir }));
        this.smashcon = 4; this.a[8] = 18;
        if (lv === 1) { this.a[8] = 12; bs.warning = 9; bs.retain = -2; }
        if (lv === 2) { this.a[8] = 7; bs.retain = -7; bs.height = 40; }
      }
    }
    if (this.smashcon === 5) {
      if (lv === 2) this.aspeed = 2;
      this.smashdir = choose(0, 1, 2, 3); this.smashcon = 1; arm(this.smashdir);
      this.smashamt++; this.a[8] = lv === 2 ? 7 : 8;
      if (this.smashamt > this.smashmax) {
        this.smashcon = -1; this.smashamt = 0; this.smasher = 0; this.red('spr_heart'); this.setArm(0); this.a[8] = 0;
        W.endTurn(true);
      }
    }
  }

  lacLogic() {                                       // el ataque final (hit_try 23)
    const W = this.W, H = W.H;
    if (this.lac === 4) {
      H.hs = H.vs = 0; W.ib = [240, 400, W.ib[3] - 160, W.ib[3]]; this.red();
      this.smasher = 1; this.smashcon = 0; this.smashamt = 0; this.smashlv = 2; this.xtimer = 0; this.lac = 5;
    }
    if (this.lac === 5) {
      if (this.smashamt === 3 && this.smashcon === 3 && this.xtimer === 3) {
        const [l, r, t, b] = W.ib;
        for (const k of [300, 525, 750]) {
          W.add(new WallNormal(l - 110, t - k, 'spr_s_bonewall_wide', 0, 11));
          W.add(new WallNormal(r - 70, b + k, 'spr_s_bonewall_wide', 0, -11));
        }
      }
      if (this.smashamt === 4 && this.smashcon === 3 && this.xtimer >= 0) {
        this.smashcon = -1; this.smasher = -1; this.lac = 6; this.a[5] = 60; this.red();
      }
    }
    if (this.lac === 7) { this.intensity = 25; this.aspeed = 2; this.setArm(4); this.lac = 8; this.a[5] = 6; }
    if (this.lac === 9) { this.slam(3); this.lac = 10; this.a[5] = 8; }
    if (this.lac === 11) { this.setArm(1); this.lac = 12; this.a[5] = 6; }
    if (this.lac === 13) { this.intensity = 15; this.slam(1); this.lac = 14; this.a[5] = 10; }
    if (this.lac === 14) { H.js = 0; W.ib[1] += 15; }
    if (this.lac === 15) { this.lac = 16; this.a[5] = 40; }
    if (this.lac === 16) {                          // la caja se estira y Sans pasa volando una y otra vez
      W.ib[0] -= 30; W.ib[1] += 10; this.repeater = 1; this.rp_x = 0; H.hs = H.vs = 0;
      if (H.x > 40) H.x -= 10;
      W.ib[2] += 1; W.ib[3] -= 0.5;
    }
    const sbo = (ht, dist, type, dx) => { W.add(new BoneBul(W, ht, -30, dist, type)).x += dx; };
    if (this.lac === 17) {
      for (let i = 0; i < 45; i++) { sbo(70 - Math.sin(i / 2) * 25, 10 + i * 2, 2, 15); sbo(30 - Math.sin(i / 2) * 25, 10 + i * 2, 0, 15); }
      this.lac = 18; this.a[5] = 100;
    }
    if (this.lac === 19) {
      for (const [d, ty] of [[10, 2], [21, 0], [31, 2], [41, 0], [50, 2], [59, 0], [67, 2], [78, 0], [87, 2]]) for (const dx of [15, 30, 45]) sbo(50, d, ty, dx);
      for (let i = 0; i < 24; i++) { sbo(90 - i, 100 + i, 2, 15); sbo(10 + i, 100 + i, 0, 15); }
      this.lac = 20; this.a[5] = 134;
    }
    if (this.lac === 21) { this.lac = 23; W.ib[1] = 640; H.hs = 11; }
    if (this.lac === 23) {
      if (W.ib[1] > 420) W.ib[1] -= 18;
      if (H.hs <= 0) { this.face = 0; this.torso = 0; this.repeater = 0; this.lac = 24; this.a[5] = 5; }
    }
    if (this.lac === 25) {
      W.add(new BoneStab({ retain: 15, warning: 12, height: 50, dir: 1 }));
      this.aspeed = 1; this.setArm(4); this.lac = 26; this.a[5] = 28;
    }
    if (this.lac === 27) { H.hs = H.vs = 0; W.add(new ShadowGen(W, 3, 6)); this.lac = 28; }
    if (this.repeater === 1) {
      this.movearm = 0; this.rp_x += 0.05; this.x -= Math.floor(30 + this.rp_x);
      if (this.x < -100) { this.face = choose(0, 1, 3, 4, 5); this.torso = choose(0, 0, 0, 1); this.x = 740; }
    }
    if (this.lac === 50) { this.red(); this.gt = 0; this.gin = 1; this.lac = 51; this.o_o = 0; }
    if (this.lac === 51) {                          // un círculo de blasters que gira alrededor de la caja
      if (this.o_o === 1) {
        const [l, r, t, b] = W.ib, cx = l + (r - l) / 2, cy = t + (b - t) / 2, disx = ldx(150, this.gt * 10), disy = ldy(150, this.gt * 10);
        W.add(new Blaster(W, disx * 3 + cx, disy * 3 + cy)).set({ idealrot: -90 + this.gt * 10, idealx: disx + cx, idealy: disy + cy, terminal: 0, pause: 15, ys: 2 });
        this.gt += this.gin; if (this.gin < 1.7) this.gin += 0.015;
        this.o_o = 0;
      } else this.o_o = 1;
      if (this.gt >= 190) {
        H.slamPain = 1; this.pdd = -1; this.bounce = 0; this.intensity = 30; this.aspeed = 2;
        this.lc_t = 0; this.lc_c = 0; this.lc_a = 0; this.lac = 52; this.a[5] = 30;
      }
    }
    if (this.lac === 53) this.lastSlams();
    if (this.lac === 60) { this.lac = 61; this.a[5] = 80; }
    if (this.lac === 62) {
      if (W.single) { this.lac = -1; H.slamPain = 0; this.bounce = 1; W.setMusVol(0.9); W.endTurn(false); return; }
      this.sleep_c = 9; this.red('spr_heart'); this.sweat = 3; this.face = 9; this.torso = 0;
      W.say(T.special[0], 109, W.sansx + 120, this.y - 10); this.lac = 63;
    }
    const talk = (k, n) => { if (this.lac === k) { W.say(T.special[n], 109, W.sansx + 120, this.y - 10); this.lac = k + 1; } };
    const wait = (k, face = true) => { if (this.lac === k && !W.bubble) { if (face) this.face = 0; else this.torso = 0; this.lac = k + 1; this.a[5] = 300; } };
    wait(63, false); talk(65, 1); wait(66); talk(68, 2); wait(69); talk(71, 3); wait(72); talk(74, 4);
    if (this.lac === 75 && !W.bubble) { this.face = 0; this.lac = -1; }
  }

  lastSlams() {                                      // lac 53: te estampa contra las paredes hasta cansarse (cada golpe quita 1 PV)
    const W = this.W, A = 8 / this.aspeed;
    const go = dd => this.slam({ 1: 1, 3: 0, 2: 2, 4: 3 }[dd]);
    if (this.lc_t === 0) {
      this.dd = choose(1, 2, 3, 4);
      for (let k = 0; k < 8; k++) if (this.dd === this.pdd) this.dd = choose(1, 2, 3, 4);
      if (this.lc_c === 0) { this.dd = 1; this.facetype = 1; }
      if (this.lc_c === 18) this.dd = 2;
      this.setArm(this.dd);
    }
    if (this.lc_t === A) { if (this.lc_c === 18) this.lc_a = 21; if (this.lc_c === 17) this.lc_a = 12; go(this.dd); }
    if (this.lc_t === this.lc_a * 2 + A + 4) {
      if (this.lc_c === 18) this.intensity = 2;
      this.dd = { 3: 2, 1: 4, 4: 1, 2: 3 }[this.dd]; this.pdd = this.dd;
      if (this.lc_c === 18) { this.dd = 3; this.sweat = 3; this.face = 9; }
      this.setArm(this.dd);
    }
    if (this.lc_t === this.lc_a * 2 + A * 2 + 4) { go(this.dd); if (this.lc_c === 18) this.lc_a = 21; }
    this.lc_t++;
    if (this.lc_t === this.lc_a * 4 + A * 2 + 7) {
      this.lc_t = 0; this.lc_c++;
      const c = this.lc_c;
      if (c === 11) { this.lc_a = 1; W.setMusVol(0.8); this.intensity = 20; }
      if (c === 12) { this.lc_a = 2; this.intensity = 20; }
      if (c === 13) { this.lc_a = 0; this.aspeed = 1; this.intensity = 16; this.sweat = 1; this.facetype = 0; this.face = 0; }
      if (c === 14) { this.lc_a = 2; W.setMusVol(0.7); this.intensity = 14; }
      if (c === 15) { this.lc_a = 4; W.setMusVol(0.5); this.intensity = 12; }
      if (c === 16) { this.lc_a = 6; W.setMusVol(0.25); this.intensity = 12; }
      if (c === 17) { this.lc_a = 8; W.setMusVol(0.15); this.aspeed = 0.5; this.intensity = 11; this.sweat = 2; this.face = 2; }
      if (c === 18) { this.lc_a = 15; W.setMusVol(0.07); this.intensity = 8; }
      if (c === 19) { this.lac = 60; W.setMusVol(0); this.setArm(0); this.bounce = 2; }
    }
  }

  dodgeLogic() {                                     // esquiva tu golpe hacia la izquierda y vuelve
    const W = this.W;
    if (W.damagetimer > 0 && this.dodge === 0) this.dodge = 1;
    if (this.dodge === 1) { this.timerbonus = W.damagetimer; this.dg_t = 0; this.dg_x = this.x; this.hs = -12; this.dodge = 2; }
    if (this.dodge === 2) {
      if (this.x < this.dg_x - 60 && this.dg_t < 20) { if (this.hs < 0) this.hs += 2; else this.hs = 0; }
      this.dg_t++;
      if (this.dg_t >= 20 + this.timerbonus) {
        if (this.hs < 12) this.hs += 2;
        if (this.x >= this.dg_x - 13) { this.hs = 0; this.x = this.dg_x; this.dodge = 0; W.damagetimer = -1; }
      }
    }
  }

  deathLogic() {                                     // el golpe que por fin le da
    const W = this.W, d = this.death_c;
    if (d === 0) return;
    if (d === 1) {
      playSound('laz'); this.face = 0; this.asleep = 0; this.sweat = 0; this.bounce = 0; this.dg_t = 0; this.dg_x = this.x;
      W.add(new StrikeTemp(this.x, this.y - 30, 1.5, 0.334)); this.hs = -12; this.death_c = 2;
    }
    if (this.death_c === 2 && this.x < this.dg_x - 60 && this.dg_t < 50) {
      if (this.hs < 0) this.hs += 2;
      else { this.hs = 0; this.death_c = 3; W.say([T.didja], 109, this.x + 80, this.y - 10, { stay: true }); this.a[6] = 50; }
    }
    if (this.death_c === 3) { this.face = 3; this.torso = 1; this.bof_d = 0; }
    if (this.death_c === 4) {
      W.bubble = null; playSound('laz'); W.add(new StrikeTemp(this.x - 10, this.y - 30, 1.5, 0.25));
      this.death_c = 5; this.a[6] = 50; this.hit_x = this.x; this.face = 6;
    }
    this.bof = null;
    if (this.death_c === 5 && this.bof_d < 4) { this.bof = Math.floor(this.bof_d); this.bof_d++; }
    if (this.death_c === 6) {
      W.sansx = this.x - 60; W.bigDamage(W.sansx + 57 - 48, 110 - 50, 9999999); playSound('damage');
      this.deadtest = 1; this.torso = 3; this.x = this.hit_x + 32; this.death_c = 7; this.a[6] = 4;
    }
    const sh = [[8, -28], [10, 24], [12, -20], [14, 16], [16, -12], [18, 8], [20, -4]];
    for (const [k, dx] of sh) if (this.death_c === k) { if (k % 4 === 2) this.torso = 3; this.x = this.hit_x + dx; this.death_c = k + 1; this.a[6] = 4; }
    if (this.death_c === 22) { this.xoff = this.yoff = this.headx = this.heady = this.legx = this.legy = 0; this.x = this.hit_x; this.death_c = 23; this.a[6] = 110; }
    if (this.death_c >= 8 && this.death_c < 22) {
      this.bounce = -1; this.xoff = choose(0, -2, 2); this.yoff = choose(0, -2, 2); this.legx = choose(0, -1, 1); this.legy = choose(0, -1, 1);
    }
    if (this.death_c === 24) { W.dmgw = null; this.bounce = 3; this.deadtest = 1; this.face = 4; this.torso = 4; this.death_c = 25; this.a[6] = 30; }
    if (this.death_c === 26) { W.say(T.dying, 107, this.x + 80, this.y - 10); this.death_c = 27; }
    if (this.death_c === 27 && W.bubble) this.face = [10, 7, 11, 7, 7, 11, 10, 10][W.bubble.i] ?? this.face;
    else if (this.death_c === 27) { this.death_c = 27.1; this.a[6] = 60; }
    if (this.death_c === 28.1) { this.bounce = 0; this.face = 10; this.torso = 5; this.deadtest = 0; this.death_c = 28; this.a[6] = 80; }
    if (this.death_c === 29) { W.say(T.welp, 107, this.x + 80, this.y - 10); this.death_c = 30; }
    if (this.death_c === 30 && W.bubble) { if (W.bubble.i === 0) this.face = 10; else { this.face = 8; this.torso = 6; } }
    else if (this.death_c === 30) { this.face = 10; this.torso = 5; this.bounce = 2; this.hs = -2; this.d_sin = 0; this.death_c = 31; }
    if (this.death_c === 31) { this.d_sin++; this.hs = -1 - Math.sin(this.d_sin / 10); if (this.x < -180) this.death_c = 32; }
    if (this.death_c === 32) { this.hs = 0; W.say([T.papyrus], 107, 20, this.y - 10); this.death_c = 33; }
    if (this.death_c === 33 && !W.bubble) { this.death_c = 34; this.a[6] = 60; }
    if (this.death_c === 35) { playSound('vaporized'); this.death_c = 36; this.a[6] = 140; }
    if (this.death_c === 37) { W.fadeOut = 0.001; this.death_c = 38; }
  }

  sleepLogic() {                                     // el "ataque especial": se queda dormido y nunca es tu turno
    const W = this.W, H = W.H;
    if (this.asleep === 1) {
      this.asleep_timer++;
      if ([10, 20, 30].includes(this.asleep_timer)) W.add(new SleepZ(this.x + 20, this.y - 10));
      if (this.asleep_timer === 80) this.asleep_timer = 0;
    }
    if (this.sleep_c === 9) {
      this.sleep_c = 1; W.showBox = false; H.ignore = 1;
      W.empty = { x: W.ib[0], y: W.ib[2], ix: W.ib[0], iy: W.ib[2], maxx: 20, maxy: 310 };
      W.fake = { on: 0, con: 0 };
      W.ib[0] = -10; W.ib[3] = 999; this.face = 9; this.sweat = 3; this.bounce = 3; H.mv = 1; H.hs = H.vs = 0;
    }
    if (this.sleep_c === 1) {
      const E = W.empty;
      if (this.lac > 60) { if (this.sleep_t < -10) this.sleep_t++; }
      else if (!W.bubble) this.sleep_t++;
      if (this.sleep_t < 1200 && H.x < E.x + 10) {   // si intentas salir antes de que se duerma: ¡ding!
        playSound('bell'); H.x = E.x + 78; H.y = E.y + 78; this.sleep_t = -95; this.facetype = 1; this.face = 0;
      }
      const s = this.sleep_t;
      if (s === -92) this.facetype = 0;
      if (s === 0) this.face = 9;
      if (s === 300 || s === 600 || s === 900) { this.face = { 300: 12, 600: 13, 900: 14 }[s]; if (this.sweat > 0) this.sweat--; }
      if (s === 1200) { this.face = 4; this.asleep = 1; this.sleep_c = 2; }
    }
  }

  karma() {                                          // KR: el veneno que te va quitando PV (nunca te deja en 0)
    const W = this.W, p = W.player;
    if (W.km > 40) W.km = 40;
    if (W.km >= p.hp) W.km = p.hp - 1;
    if (W.km > 0 && p.hp > 1) {
      this.km_t++;
      if (this.prevhp === p.hp) {
        const drain = () => { this.km_t = 0; p.hp--; W.km--; };
        if (this.km_t >= 1 && W.km >= 40) drain();
        if (this.km_t >= 2 && W.km >= 30) drain();
        if (this.km_t >= 5 && W.km >= 20) drain();
        if (this.km_t >= 15 && W.km >= 10) drain();
        if (this.km_t >= 30) drain();
        if (p.hp <= 0) p.hp = 1;
      }
      this.prevhp = p.hp;
    }
  }

  // ---------------------------------------------------------------- dibujo
  draw(ctx) {
    const x = this.x, y = this.y, S = { xs: 2, ys: 2 };
    if (this.deadtest === 0) {
      drawSprite(ctx, 'spr_sansb_legs', 0, x, y + 90, S);
      if (this.movearm === 0) drawSprite(ctx, 'spr_sansb_torso', this.torso, x + this.xoff, y + 42 + this.yoff / 1.5, S);
      else drawSprite(ctx, this.armSpr, this.armFrame, x, y + 42, S);
      const hx = x + this.xoff + this.headx, hy = y + this.yoff + this.heady;
      if (this.facetype === 0) drawSprite(ctx, 'spr_sansb_face', this.face, hx, hy, S);
      if (this.sweat > 0) drawSprite(ctx, 'spr_sansb_face_sweat', this.sweat - 1, hx, hy, S);
      if (this.facetype === 1) drawSprite(ctx, 'spr_sansb_blueeye', Math.floor(this.f_i / 2), hx, hy, S);
    } else {
      drawSprite(ctx, 'spr_sansb_legs_sit', 0, x + this.legx, y + 100 + this.legy, S);
      drawSprite(ctx, 'spr_sansb_torso', this.torso, x + this.xoff, y + 62 + this.yoff / 1.5, S);
      drawSprite(ctx, 'spr_sansb_face', this.face, x + this.xoff, y + this.yoff + 30, S);
    }
    if (this.bof !== null) drawSprite(ctx, 'spr_bof_what', this.bof, x, y - 50, S);
  }
}
