// ============================================================================
//  Cuerpos de Asriel: GodBody = obj_asriel_body (forma "God of Hyperdeath")
//                     FinalBody = obj_afinal_body (forma final, sin el fondo arcoíris)
//  La lógica de ataque de GameMaker vive en el Draw del cuerpo (starcon, bladecon, guncon, gonercon...);
//  aquí va en update() y el dibujo en draw().
// ============================================================================
import { drawSprite } from './assets.js';
import { rnd, ldx, ldy } from './gm.js';
import { Afterimage, HandLightning, StormStarGen, RainbowGen, SwordMaster, GunArm, HgWholeScreen, HgBody, UltimaGen, UltimaTarget, LastBeam } from './asriel_attacks.js';

export class GodBody {
  constructor(b) {
    this.b = b; this.x = 315; this.y = 50; this.depth = -1000;
    this.siner = 0; this.rely = 0; this.relx = 0; this.headrot = 0; this.armrot_l = 0; this.armrot_r = 0; this.torsorot = 0;
    this.aimage = 0; this.normal = 1; this.starcon = 0; this.type = 0; this.bladecon = 0; this.specialarm = 0; this.armAlpha = 1;
    this.heady = 0; this.headx = 0; this.guncon = 0; this.gonercon = 0; this.s_s = 0; this.shrug = 0; this.shrugX = 0;
    this.aligncon = 1; this.specialnormal = 1; this.sn = 0; this.hMode = 0; this.transform = 0; this.stetch = 0; this.alpha = 1;
    this.al = {}; this.xxoff = 0; this.yyoff = 0; this.altimer = 0;
    if (b.deaths > 0 || b.single) { this.specialnormal = 0; this.aligncon = 0; this.aimage = 1; }   // obj_asriel_body Create (flag 502)
  }
  tickAlarms() {
    for (const k of Object.keys(this.al)) if (this.al[k] > 0 && --this.al[k] === 0) {
      delete this.al[k];
      if (k === '5') this.starcon++; if (k === '6') this.bladecon++; if (k === '7') this.guncon++; if (k === '8') this.gonercon++;
    }
  }
  update() {
    const b = this.b;
    this.tickAlarms();
    if (this.aimage === 1) b.add(new Afterimage(this.x + this.relx, this.y + this.rely, this.depth + 1));   // Alarm_0
    if (this.transform === 1) this.stetch += 0.2;
    if (this.normal === 1) {                         // flota de un lado a otro
      this.siner++;
      this.rely += Math.sin(this.siner / 12); this.x += Math.cos(this.siner / 24) * 6; this.y += Math.sin(this.siner / 6) * 0.25;
    }
    this.shrug = b.flag20 ? 1 : 0;
    this.align();
    this.starMachine(); this.bladeMachine(); this.gunMachine(); this.gonerMachine();
    if (this.specialnormal === 1) { this.sn++; this.y = 50 + Math.sin(this.sn / 8) * 4; }
  }
  align() {                                          // aligncon: vuelve al centro antes de atacar
    if (this.aligncon === 1) {
      this.normal = 0; const xxx = 320, yyy = this.s_s === 1 ? 100 : 45;
      this.tx = xxx; this.ty = yyy; this.xxoff = this.x - xxx; this.yyoff = this.y - yyy; this.aligncon = 2; this.altimer = 0;
    }
    if (this.aligncon === 2) {
      this.alpha = 1;
      const d = v => Math.abs(v) > 1 ? v * 0.7 : 0;
      this.relx = d(this.relx); this.rely = d(this.rely); this.yyoff = d(this.yyoff); this.xxoff = d(this.xxoff);
      this.armrot_l = d(this.armrot_l); this.armrot_r = d(this.armrot_r); this.torsorot = d(this.torsorot); this.headrot = d(this.headrot);
      this.altimer++; this.x = this.tx + this.xxoff; this.y = this.ty + this.yyoff;
      if (this.altimer > 15) { this.alpha = 1; this.aligncon = 3; this.aimage = 0; }
    }
    if (this.aligncon === 4) {
      Object.assign(this, { heady: 0, headx: 0, specialarm: 0, armAlpha: 0, relx: 0, rely: 0, xxoff: 0, yyoff: 0, armrot_l: 0, armrot_r: 0,
        torsorot: 0, headrot: 0, aligncon: 0, siner: 0, aimage: 1, normal: 1, altimer: 0 });
    }
  }
  starMachine() {                                    // STAR BLAZING / SHOCKER BREAKER
    const b = this.b;
    if (this.starcon <= 0) return;
    if (this.starcon === 1) { b.face = 2; b.snd('spellcast', 0.8, 1); this.armraise = 20; this.starcon = 2; this.al[5] = 1; }
    if (this.starcon === 3) { this.starcon = 4; this.al[5] = 1; }
    if (this.starcon === 5) {                        // levanta los brazos
      this.armrot_l -= this.armraise; this.armrot_r += this.armraise; this.armraise -= 2;
      if (this.armraise <= 0) { this.starcon = 6; this.al[5] = 20; }
    }
    if (this.starcon >= 5 && this.starcon <= 9) {    // chispas en las manos
      const y1 = this.y + 38 + this.rely * 1.2;
      for (let i = 0; i < 2; i++) b.add(new HandLightning(this.x - 28 + ldx(90, this.armrot_l - 105), y1 + ldy(90, this.armrot_l - 105), this.type, this.depth + 1));
      for (let i = 0; i < 2; i++) b.add(new HandLightning(this.x + 30 + ldx(90, this.armrot_r - 75), y1 + ldy(90, this.armrot_r - 75), this.type, this.depth + 1));
    }
    if (this.starcon === 7) { this.starcon = 8; this.al[5] = 15; }
    if (this.starcon === 9) this.starcon = 12;
    if (this.starcon === 12) {
      this.gen = this.type === 0 ? new StormStarGen(b, this.hMode) : new RainbowGen(b, this.hMode);
      b.add(this.gen); this.starcon = 13; this.al[5] = this.type === 1 ? 180 : 300;
    }
    if (this.starcon === 13 && this.alpha > 0) this.alpha -= 0.05;   // Asriel desaparece mientras ataca
    if (this.starcon === 14) {
      b.face = 0; if (this.gen) { this.gen.destroy(); this.gen = null; }
      this.armrot_l = 0; this.armrot_r = 0; this.alpha += 0.05;
      if (this.alpha >= 1) { this.alpha = 1; b.endAttack(); this.aligncon = 4; this.starcon = 0; }
    }
  }
  bladeMachine() {                                   // CHAOS SABER / CHAOS SLICER
    const b = this.b;
    if (this.bladecon <= 0) return;
    if (this.bladecon === 1) { this.armraise = 20; this.bladecon = 2; this.specialarm = 1; this.al[6] = 30; }
    if (this.bladecon === 2 && this.armAlpha > 0) this.armAlpha -= 0.05;
    if (this.bladecon === 3) { b.add(new SwordMaster(b, this.x, this.y, this.hMode)); this.bladecon = 4; this.al[6] = 30; }
    if (this.bladecon === 10) { this.heady = 0; this.headrot = 0; this.specialarm = 1; this.armAlpha = 0; this.bladecon = 11; }
    if (this.bladecon === 11) {
      Object.assign(this, { alpha: 0, heady: 0, headx: 0, specialarm: 0, armAlpha: 1, x: 320, y: 50, relx: 0, rely: 0, xxoff: 0, yyoff: 0,
        armrot_l: 0, armrot_r: 0, torsorot: 0, headrot: 0, siner: 0, altimer: 0, bladecon: 12 });
    }
    if (this.bladecon === 12) {
      this.siner = 0; this.alpha += 0.05;
      if (this.alpha >= 1) { this.alpha = 1; b.endAttack(); this.specialarm = 0; this.aligncon = 4; this.bladecon = 0; }
    }
  }
  gunMachine() {                                     // CHAOS BUSTER / CHAOS BLASTER
    const b = this.b;
    if (this.guncon <= 0) return;
    if (this.guncon === 1) { this.armAlpha = 1; this.guncon = 2; this.specialarm = 2; this.al[7] = 20; }
    if (this.guncon === 2 && this.armAlpha > 0) this.armAlpha -= 0.05;
    if (this.guncon === 3) { b.add(new GunArm(b, this.x + 70, this.y + 15, this.hMode)); this.guncon = 4; this.al[7] = 30; }
    if (this.guncon === 7) { this.armAlpha += 0.1; if (this.armAlpha >= 1) this.guncon = 8; }
    if (this.guncon === 8) { this.aligncon = 1; this.guncon = 9; this.al[7] = 10; }
    if (this.guncon === 10) { b.endAttack(); this.aligncon = 4; this.guncon = 0; }
  }
  gonerMachine() {                                   // HYPER GONER
    const b = this.b;
    if (this.gonercon <= 0) return;
    if (this.gonercon === 1) { b.flag20 = 1; this.gonercon = 2; this.al[8] = 1; }
    if (this.gonercon === 3) { this.gonercon = 4; this.al[8] = 30; }
    if (this.gonercon === 5) { b.ignoreBorder = true; this.ws = new HgWholeScreen(b); b.add(this.ws); this.gonercon = 6; this.al[8] = 40; }
    if (this.gonercon === 7) { b.add(new HgBody(b)); this.gonercon = 8; }
    if (this.gonercon === 10) {
      if (this.ws) this.ws.con = 2;
      this.shrug = 0; this.specialnormal = 1; b.face = 0; b.flag20 = 0;
      b.objs = b.objs.filter(o => o.constructor.name !== 'HgDebris');
      b.snd('create', 0.9, 0.8);
      b.heartAlpha = 1; this.alpha = 0; b.ignoreBorder = false;
      const [, , t, bt] = b.ideal(); b.heart.x = 312; b.heart.y = (t + bt) / 2;
      this.gonercon = 11;
    }
    if (this.gonercon === 11) { b.heartDepth = 0; this.alpha += 0.1; if (this.alpha >= 1) { this.alpha = 1; this.gonercon = 12; this.al[8] = 30; } }
    if (this.gonercon === 13) { this.gonercon = 0; b.afterGoner(); }
  }
  draw(ctx) {
    const b = this.b, x = this.x, y = this.y, st = this.stetch, rely = this.rely;
    const yoff = Math.sin(this.siner / 6), A = this.alpha;
    if (A <= 0) return;
    const o = (xs, rot = 0, alpha = A) => ({ xs, ys: 2, rot, alpha });
    ctx.globalAlpha = A; ctx.fillStyle = '#000'; ctx.fillRect(x - 40, y + 20 + rely, 82, 26); ctx.globalAlpha = 1;
    drawSprite(ctx, 'spr_asrielfeet', 0, x + yoff * 2, y + 56 + rely * 0.9, o(2 + st, this.torsorot));
    drawSprite(ctx, 'spr_torsoball', 0, x + yoff, y + 48 + rely, o(2 + st));
    drawSprite(ctx, 'spr_asrieltorso', 0, x + yoff, y + 48 + rely, o(2 + st, this.torsorot));
    drawSprite(ctx, 'spr_asriellocket', 0, x + 2, y + 34 + rely * 1.2, o(2 + st));
    const ay = y + 38 + rely * 1.2;
    if (this.specialarm === 0) {
      if (this.shrug === 0) {
        drawSprite(ctx, 'spr_asrielarm_r', 0, x - 28, ay, o(-2 - st, this.armrot_l));
        drawSprite(ctx, 'spr_asrielarm_r', 0, x + 30, ay, o(2 + st, this.armrot_r));
      } else {
        drawSprite(ctx, 'spr_asrielarm_r_shrug', 0, x - 28, ay, o(-2, this.armrot_l));
        drawSprite(ctx, 'spr_asrielarm_r_shrug', 0, x + 30, ay, o(2, this.armrot_r));
      }
    } else {
      drawSprite(ctx, 'spr_asrielarm_r', 0, x - 28, ay, o(-2, this.armrot_l, this.specialarm === 1 ? this.armAlpha : A));
      drawSprite(ctx, 'spr_asrielarm_r', 0, x + 30, ay, o(2, this.armrot_r, this.armAlpha));
    }
    drawSprite(ctx, 'spr_asrielshoulder_r', 0, x - 28, y + 26 + rely * 1.2, o(-2 - st));
    drawSprite(ctx, 'spr_asrielshoulder_r', 0, x + 30, y + 26 + rely * 1.2, o(2 + st));
    drawSprite(ctx, 'spr_asrielcollar', 0, x, y + 22 + rely, o(2 + st));
    if (this.shrug === 0) drawSprite(ctx, 'spr_asrielhead', b.face, x + this.headx, y + rely * 1.2 + this.heady, o(2 + st, this.headrot));
    else { this.shrugX++; drawSprite(ctx, 'spr_asriel_headshake_sassy', Math.floor(this.shrugX / 6), x + this.headx, y + rely * 1.2 + this.heady, o(2 + st, this.headrot)); }
  }
}

// ---------------------------------------------------------------- obj_afinal_body
export class FinalBody {
  constructor(b) {
    this.b = b; this.x = 320; this.y = 48; this.depth = -1000;
    this.siner = 0; this.anim = 0; this.armrot = 0; this.ucon = 0; this.bcon = 0; this.arShake = 0; this.cry = 0;
    this.bodyfader = 0; this.darker = 0; this.darkerX = 0; this.uGen = 0; this.al = {}; this.alpha = 1; this.ps = 0;
  }
  tickAlarms() {
    for (const k of Object.keys(this.al)) if (this.al[k] > 0 && --this.al[k] === 0) {
      delete this.al[k];
      if (k === '11') this.bcon = Math.round((this.bcon + 1) * 10) / 10;
      if (k === '10') this.ucon++;
      if (k === '9') {                               // Alarm_9: el hechizo suena cada vez más agudo
        this.b.stopSnd(this.psfx); this.psfx = this.b.snd('spellcast', 0.6 + this.ps / 8, 0.5 + this.ps / 6);
        if (++this.ps < 6) this.al[9] = 5;
      }
    }
  }
  update() {
    const b = this.b;
    this.tickAlarms();
    this.anim++; this.siner++;
    if (this.ucon > 0) {                             // ataque de balas arcoíris (obj_ultimagen)
      if (this.ucon === 1) { this.psfx = b.snd('spellcast', 0.7, 1.2); this.arf = 30; this.ucon = 2; }
      if (this.ucon === 2) { this.armrot += this.arf; this.arf -= 2; if (this.arf <= 0) { this.ucon = 3; this.al[10] = 5; } }
      if (this.ucon === 4) {
        this.gen = new UltimaGen(b, this.x, this.y, this.uGen); b.add(this.gen);
        if (!b.objs.some(o => o instanceof UltimaTarget)) b.add(new UltimaTarget(b));
        this.ucon = 5; this.al[10] = this.uGen === 2 ? 130 : 140; this.arf = -30;
      }
      if (this.ucon === 6) {
        if (this.gen) { this.gen.dead = true; this.gen = null; }
        this.armrot += this.arf; this.arf += 2;
        if (this.arf >= 0) { this.ucon = 0; b.endAttack(); }
      }
    }
    if (this.bcon > 0) {                             // el rayo final (obj_lastbeam)
      const B = this.bcon;
      if (B === 1) { this.ps = 0; this.al[9] = 7; this.rAl = 1; this.radi = 0; this.rSiner = 0; this.arf = 30; this.bcon = 2; }
      if (B === 2) { this.armrot -= this.arf; this.arf -= 5; if (this.arf <= 0) { this.bcon = 3; this.al[11] = 35; } }
      if (B === 4) { this.bcon = 4.1; this.al[11] = 2; }
      if (B === 4.1) this.armrot -= 5;
      if (B === 5.1) { this.bcon = 5; this.al[11] = 5; }
      if (B === 5) { this.arShake = 0; this.armrot += 26; }
      if (B === 6) {
        this.cry = 2; this.arShake = 5;
        const army = ldy(150, -this.armrot - 90);
        b.add(new LastBeam(b, 320, this.y + 56 + army - 20)); this.bcon = 7; this.al[11] = 400;
      }
      if (this.bcon < 7) { this.arShake += 0.2; if (this.radi < 60) this.radi += 1.5; this.rSiner++; }
      if (this.bcon === 8) {
        this.cry = 0; b.face = 5;
        if (this.arShake > 0) this.arShake -= 1;
        if (this.armrot > 0) this.armrot -= 2; else this.armrot = 0;
        if (this.arShake <= 0) { this.arShake = 0; this.bcon = 0; b.endAttack(); }   // (si el rayo no terminó ya el turno)
      }
    }
    if (this.darker === 1 && this.darkerX < 1) this.darkerX += 0.04;
    if (this.darker === 0) this.darkerX = 0;
  }
  draw(ctx) {
    const b = this.b, x = this.x, y = this.y, f = Math.floor(this.anim / 6);
    const yoff = Math.sin(this.siner / 4), yoff2 = Math.sin(this.siner / 16), A = this.alpha;
    drawSprite(ctx, 'spr_afinal_cosmoswing', 0, x + 42, y - 52 + yoff2 * 4, { xs: 2, ys: 2, alpha: A });
    drawSprite(ctx, 'spr_afinal_cosmoswing', 0, x - 44, y - 52 + yoff2 * 4, { xs: -2, ys: 2, alpha: A });
    drawSprite(ctx, 'spr_afinal_orbwing', f, x - 110, y - 52, { xs: 2, ys: 2, alpha: A });
    drawSprite(ctx, 'spr_afinal_orbwing', f, x + 108, y - 52, { xs: -2, ys: 2, alpha: A });
    drawSprite(ctx, 'spr_afinal_stem', f, x - 2, y + 146, { xs: 2, ys: 2, alpha: A });
    drawSprite(ctx, 'spr_afinal_orb', f, x - 2, y + 68, { xs: 2, ys: 2, alpha: A });
    let rx = rnd(this.arShake) - rnd(this.arShake), ry = rnd(this.arShake) - rnd(this.arShake); ry *= 1.5; rx *= 0.7;
    if (this.bodyfader > 0) { ctx.globalAlpha = Math.min(1, this.bodyfader); ctx.fillStyle = '#000'; ctx.fillRect(-10, -10, 1000, 1000); ctx.globalAlpha = 1; }
    if (this.cry === 0) drawSprite(ctx, 'spr_afinal_face', b.face, x, y, { xs: 2, ys: 2, alpha: A });
    if (this.cry === 1) drawSprite(ctx, 'spr_afinal_face_cry', Math.floor(this.siner / 8), x + rx / 3, y + ry / 3, { xs: 2, ys: 2, alpha: A });
    if (this.cry === 2) drawSprite(ctx, 'spr_afinal_face_cry2', Math.floor(this.siner / 2), x + rx / 3, y + ry / 3, { xs: 2, ys: 2, alpha: A });
    const aa = A - this.bodyfader;
    drawSprite(ctx, 'spr_afinal_arm', f, x - 58 + rx, y + 56 + yoff * 2 + ry, { xs: 2, ys: 2, rot: this.armrot, alpha: aa });
    drawSprite(ctx, 'spr_afinal_arm', f, x + 56 + rx, y + 56 + yoff * 2 + ry, { xs: -2, ys: 2, rot: -this.armrot, alpha: aa });
    drawSprite(ctx, 'spr_afinal_shoulder', f, x - 84, y + 32, { xs: 2, ys: 2, alpha: aa });
    drawSprite(ctx, 'spr_afinal_shoulder', f, x + 82, y + 32, { xs: -2, ys: 2, alpha: aa });
    if (this.bcon > 0 && this.bcon < 7 && this.rAl > 0) {   // la energía se concentra en las manos
      const r = this.radi + Math.sin(this.rSiner / 2) * (this.radi / 8);
      const armx = ldx(150, -this.armrot - 90), army = ldy(150, -this.armrot - 90);
      for (const cx of [x + 56 + armx, x - 58 - armx]) {
        const cy = y + 56 + army;
        ctx.globalAlpha = this.rAl; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, Math.max(0, r - 1), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
        drawSprite(ctx, 'spr_beamcircle', 0, cx, cy, { xs: 2 * r / 40, ys: 2 * r / 40, alpha: this.rAl });
      }
    }
  }
}
