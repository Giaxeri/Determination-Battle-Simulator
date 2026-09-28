// Huesos de Papyrus: blt_sizebone (hueso desde el suelo), blt_topbone (desde el techo) y sus hijos
// blt_superbone, blt_coolbus y blt_scootdog, el perro de su ataque especial (blt_tobydogbone),
// obj_blueattackgen (el "ataque azul") y la lista de huesos de cada turno (obj_papyrusboss Step_0, mnfight = 2).
import { drawSprite, spriteBBox, SPR } from './assets.js';
import { sprL } from './i18n.js';
import { R as rect, hit } from './gm.js';

export const L = 192, R = 442, T = 250, B = 385;      // global.border = 5 (SCR_BORDERSETUP)
const BLUE = 'rgb(20,168,255)';                        // draw_set_color(16754964)

// Recorte de draw_self_border / draw_sprite_part: solo se ve lo que está dentro de la caja
export function clipBox(ctx, b) {
  const { l, r, t, b: bt } = b.box;
  ctx.save(); ctx.beginPath(); ctx.rect(l + 5, t + 5, r - l - 5, bt - t - 5); ctx.clip();
}
const heartBox = b => spriteBBox(b.soul, b.heart.x, b.heart.y);

// ---------------------------------------------------------------- blt_sizebone / blt_topbone
export class Bone {
  constructor(top, x, y, hs, o = {}) {
    this.top = top; this.x = x; this.y = y; this.ystart = y; this.hs = hs;
    this.osc = o.osc || 0; this.oscmin = o.oscmin ?? 20; this.oscmax = o.oscmax ?? 20;
    this.blue = o.blue || 0; this.dmg = o.dmg ?? 6; this.drawn = 0; this.active = 1; this.visible = true;
  }
  step() {                                             // Step_0: los que suben y bajan (osc)
    if (this.drawn === 1 && this.active === 1) {
      if (this.y <= this.ystart - this.oscmax || this.y >= this.ystart - this.oscmin) this.osc = -this.osc;
      this.y += this.osc;
    }
  }
  post(b) {                                            // Draw_0: colisión con el alma y fuera de la caja
    const [l, r, t, bt] = b.ideal();
    if (this.x > l - 5 && this.x < r - 4) this.drawn = 1;
    if (Math.abs(b.heart.x - this.x) < 15 && b.invc < 1) {
      const zone = this.top ? rect(this.x + 3, this.y, this.x + 9, t + 10) : rect(this.x + 3, this.y + 2, this.x + 9, bt - 2);
      if (hit(zone, heartBox(b))) b.boneHit(this);
    }
    if ((this.x < l - 10 && this.hs < 0) || (this.x > r + 10 && this.hs > 0)) this.dead = true;
  }
  draw(ctx, b) {
    if (!this.visible) return;
    const [, , t, bt] = b.ideal(), f = this.blue ? 1 : 0, x = Math.round(this.x), y = Math.round(this.y);
    ctx.fillStyle = this.blue ? BLUE : '#fff';
    if (this.top) {                                    // cuelga del techo: la punta de abajo en y
      drawSprite(ctx, 'spr_bonebottom', f, x, y); drawSprite(ctx, 'spr_bonetop', f, x, t + 6);
      ctx.fillRect(x + 3, t + 10, 7, y - t - 9);
    } else {                                           // sale del suelo: la punta de arriba en y
      drawSprite(ctx, 'spr_bonetop', f, x, y); drawSprite(ctx, 'spr_bonebottom', f, x, bt - 10);
      ctx.fillRect(x + 3, y + 4, 7, bt - 6 - (y + 4) + 1);
    }
  }
}

// ---------------------------------------------------------------- hijos de blt_sizebone con sprite propio (draw_self_border)
class SpriteBullet {
  constructor(spr, x, y, hs, dmg) { this.spr = spr; this.x = x; this.y = y; this.hs = hs; this.dmg = dmg; this.frame = 0; this.speed = 0; this.active = 1; this.visible = true; this.blue = 0; }
  step() { this.frame += this.speed; }
  draw(ctx) { if (this.visible) drawSprite(ctx, sprL(this.spr), this.frame, Math.round(this.x), Math.round(this.y)); }
}
export class ScootDog extends SpriteBullet {           // blt_scootdog: el perro en patineta y las letras de hueso "Cool Dude"
  constructor(x, y, hs, spr = 'spr_tobydogscoot') { super(spr, x, y, hs, 3); this.speed = spr === 'spr_tobydogscoot' ? 0.2 : 0; }
  post(b) {
    if (this.x < 0) { this.dead = true; return; }
    if (hit(spriteBBox(this.spr, this.x, this.y), heartBox(b))) b.boneHit(this);
  }
}
export class CoolBus extends SpriteBullet {            // blt_coolbus: subido a ellos, "arriba" te eleva y la caja crece hacia arriba
  constructor(x, y, hs) { super('spr_coolbus', x, y, hs, 6); }
  post(b, a, inp) {
    const [l, r, , bt] = b.ideal(), h = b.heart, sb = a.find(o => o instanceof SuperBone);
    if ((this.x < l - 100 && this.hs < 0) || (this.x > r + 100 && this.hs > 0)) { this.dead = true; return; }
    if (sb && this.x < r && inp.up && !a.movinged && h.x < sb.x + 20 && h.y > 50) {
      b.setBorder(51); b.top51 = h.y < 270 ? Math.round((h.y - 20) / 5) * 5 : 250;
      a.movinged = true;
      if (h.vs >= -2 && h.prevY > h.y) h.vs = -2;
    }
    if (b.invc < 2 && Math.abs(h.x + 25 - this.x) < 50 && hit(rect(this.x + 5, this.y + 10, this.x + 55, bt - 10), heartBox(b))) b.boneHit(this);
  }
}
export class SuperBone extends SpriteBullet {          // blt_superbone: el hueso gigante; aparece a la altura del alma
  constructor(x, y, hs) { super('spr_superbone', x, y, hs, 3); this.appear = 0; }
  post(b) {
    const [l, r] = b.ideal(), h = b.heart;
    if (this.x < r + 40 && this.x > r + 10 && h.x > r - 60 && this.appear === 0) { this.appear = 1; this.y = h.y; }
    if (this.x < l + 20 && this.hs < 0) b.setBorder(5);
    if (this.x < l - 40 && this.hs < 0) { this.dead = true; return; }
    if (b.invc < 2 && Math.abs(h.x + 30 - this.x) < 80 && hit(spriteBBox('spr_superbone', this.x, this.y), heartBox(b))) b.boneHit(this);
  }
}

// ---------------------------------------------------------------- blt_tobydogbone: el perro que se come el ataque especial (no hace daño)
export class TobyDog {
  constructor(x, y) { this.x = x; this.y = y; this.spr = 'spr_tobydogeat'; this.frame = 0; this.speed = 0.2; this.hs = 0; }
  update() { this.frame += this.speed; this.x += this.hs; }
  // draw_self_border con image_xscale = 2: draw_sprite_part lo dibuja a tamaño normal
  draw(ctx) { drawSprite(ctx, this.spr, this.frame, Math.round(this.x), Math.round(this.y)); }
}

// ---------------------------------------------------------------- huesos de cada turno
// s = blt_sizebone, t = blt_topbone: [x, altura sobre el suelo (y = B + dy), hspeed, extras]
const s = (x, dy, hs, o) => ['s', x, dy, hs, o], t = (x, dy, hs, o) => ['t', x, dy, hs, o];
const O = (osc, oscmin, oscmax) => ({ osc, oscmin, oscmax }), BL = { blue: 1 };
const wave = (x0, dx, hs, hts) => hts.map((h, i) => s(x0 + dx * i, -h, hs));
// tt = global.turntimer; speed = blt_sizebone.speed para todos; xspeed = solo si xfight > 0 (repetición del turno); after = creados tras el cambio de velocidad
export const TURNS = {
  '-1': { tt: 200, list: [s(R + 30, -20, -3), s(R + 200, -20, -3), s(R + 370, -40, -3)] },
  0: { tt: 300, list: [s(R + 20, -20, -4), s(R + 150, -40, -4), s(R + 280, -40, -4), s(R + 410, -40, -4), s(R + 390, -60, -3), s(R + 510, -60, -3), s(R + 630, -60, -3)] },
  1: { tt: 220, xspeed: 4.5, list: [s(L - 10, -60, 3), t(L - 80, -40, 3), s(L - 230, -20, 4), s(L - 310, -20, 4), s(L - 390, -20, 4), s(L - 490, -50, 4), t(L - 580, -40, 4)] },
  2: { tt: 240, xspeed: 4, list: [s(L - 30, -60, 3.5), s(L - 160, -60, 3.5), s(L - 290, -60, 3.5), s(L - 390, -80, 3.5, BL)], after: [s(R + 1120, -30, -6)] },
  3: { tt: 150, xspeed: 4.5, list: [s(L - 40, -50, 4), t(L - 40, -90, 4), t(R + 140, -40, -4), ...wave(L - 260, -20, 4, [20, 30, 40, 50, 50, 40, 30, 20])] },
  4: { tt: 240, list: [s(L - 40, -30, 4), t(L - 40, -80, 4), s(L - 60, -30, 4), t(L - 60, -80, 4), s(L - 170, -60, 4), t(L - 170, -110, 4), s(L - 190, -60, 4), t(L - 190, -110, 4),
                        s(L - 320, -90, 4, BL), s(R + 480, -60, -4), s(R + 700, -30, -4), t(R + 700, -80, -4), s(L - 700, -30, 4), t(L - 700, -80, 4)] },
  5: { tt: 330, list: [...wave(R + 40, 30, -3, [30, 45, 60, 45, 30, 15]), ...wave(R + 300, 30, -3, [15, 30, 45, 60]),
                        ...wave(R + 700, 30, -4, [30, 45, 60, 45, 30, 15]), ...wave(R + 970, 30, -4, [15, 30, 45, 60])] },
  6: { tt: 200, list: [s(L - 10, -35, 2), s(L - 110, -35, 2), s(L - 210, -35, 2), s(R + 10, -35, -2), s(R + 110, -35, -2), s(R + 210, -35, -2)] },
  7: { tt: 150, speed: 4, xspeed: 4.4, list: [s(L - 10, -20, 2), s(L - 110, -20, 2), s(L - 210, -20, 2), s(L - 310, -20, 2), s(R + 10, -20, -2), s(R + 110, -20, -2), s(R + 210, -20, -2), s(R + 310, -20, -2)] },
  8: { tt: 230, speed: 4.4, list: [s(R + 40, -20, -4), s(R + 170, -20, -4), t(R + 170, -70, -4), s(R + 310, -30, -4), t(R + 310, -80, -4), s(R + 460, -40, -4), t(R + 460, -90, -4),
                                    s(R + 610, -50, -4), t(R + 610, -100, -4), s(R + 760, -60, -4), t(R + 760, -110, -4)] },
  9: { tt: 355, speed: 4.2, list: [s(R + 60, -60, -4), s(R + 220, -60, -4), t(R + 220, -100, -4), s(R + 360, -50, -4), t(R + 360, -90, -4), s(R + 500, -40, -4), t(R + 500, -80, -4),
                                    s(R + 640, -30, -4), t(R + 640, -70, -4), s(R + 780, -10, -4), t(R + 780, -50, -4), s(R + 990, -30, -4, O(-1, -1, 30)), t(R + 990, -80, -4, O(-1, -1, 30)),
                                    s(R + 1130, -50, -4, O(-2, -20, 30)), t(R + 1130, -100, -4, O(-2, -20, 30))] },
  10: { tt: 230, speed: 4.2, list: [s(L - 40, -30, 4), s(L - 60, -40, 4), t(L - 60, -90, 4), s(L - 80, -50, 4), t(L - 80, -100, 4), s(L - 100, -60, 4), t(L - 100, -110, 4),
                                     s(L - 280, -50, 4), t(L - 280, -100, 4), s(L - 295, -40, 4), t(L - 295, -90, 4), s(L - 310, -30, 4), t(L - 310, -80, 4),
                                     s(R + 600, -30, -4, O(-3, -1, 60)), s(R + 620, -30, -4, O(-3, -1, 60)), s(R + 640, -30, -4, O(-3, -1, 60))] },
  11: { tt: 250, list: [60, 140, 220, 300, 380, 460, 540, 620].map((x, i) => s(R + x, i % 2 ? -20 : -80, -4.5, i % 2 ? undefined : BL)).concat([s(R + 1250, -80, -7, BL), s(R + 1330, -20, -7)]) },
  12: { tt: 200, list: [...wave(L - 60, -27, 4, [30, 40, 50, 60, 50, 40, 30]), ...wave(R + 600, 40, -6.4, [30, 40, 50, 60, 50, 40, 30])] },
  13: { tt: 220, list: [s(R + 20, -30, -4, O(-3, -1, 60)), s(R + 60, -30, -4, O(-3, -1, 60)), s(R + 100, -30, -4, O(-3, -1, 60)),
                         t(R + 240, -10, -4, O(-3, -1, 60)), t(R + 270, -10, -4, O(-3, -1, 60)), t(R + 300, -10, -4, O(-3, -1, 60)),
                         s(R + 460, -30, -4), t(R + 460, -40, -4, O(-3, -1, 40)), s(R + 580, -50, -4), t(R + 580, -60, -4, O(-3, -1, 40))] },
  // fighto = 14 con mycommand < 20 / entre 20 y 40 (con 40 o más repite al azar uno de los turnos 2-12)
  waveA: { tt: 210, list: [...wave(L - 60, -30, 4, [30, 40, 50, 60, 50, 40, 30]), ...wave(R + 680, 40, -6.4, [30, 40, 50, 60, 50, 40, 30])] },
  blueB: { tt: 200, list: [10, 90, 170, 250, 330, 410, 490, 570].map((x, i) => s(R + x, i % 2 ? -20 : -80, -5, i % 2 ? undefined : BL)).concat([s(R + 1150, -80, -8, BL), s(R + 1230, -20, -8)]) },
};
// fighto = 15: "*SIGH* HERE'S AN ABSOLUTELY NORMAL ATTACK." (k = global.idealborder[1] + 1900)
const K = R + 1900;
TURNS.final = { tt: 1300, list: [
  s(L - 10, -20, 4), s(L - 60, -20, 4), s(R + 160, -20, -4), s(R + 210, -20, -4), s(L - 360, -60, 4), s(R + 360, -60, -4),
  s(L - 540, -30, 4, O(-4, -1, 60)), s(R + 540, -30, -4, O(-4, -1, 60)), t(L - 640, -50, 4, O(-4, -1, 60)), t(R + 640, -50, -4, O(-4, -1, 60)),
  s(L - 740, -30, 4, O(-2, -1, 40)), s(R + 740, -30, -4, O(-2, -1, 40)), s(L - 890, -30, 4, O(-2, -1, 40)), s(R + 890, -30, -4, O(-2, -1, 40)),
  s(R + 1090, -30, -4, O(-1, -1, 30)), s(R + 1120, -30, -4, O(-1, -1, 30)), s(R + 1150, -30, -4, O(-1, -1, 30)),
  s(L - 1340, -30, 4, O(-1, -1, 30)), s(L - 1370, -30, 4, O(-1, -1, 30)), s(L - 1400, -30, 4, O(-1, -1, 30)),
  ['dog', R + 2000, -40, -5], ['dog', R + 2240, -60, -5, 'spr_cbone'], ['dog', R + 2280, -60, -5, 'spr_oolbone'], ['dog', R + 2500, -60, -5, 'spr_dbone'],
  ['dog', R + 2540, -60, -5, 'spr_udebone'], ['dog', R + 2220, -60, -4, 'spr_skatebone'],
  ...[10, 70, 130, 190, 250, 310, 370, 430, 490].map(x => ['bus', K + x, -60, -3]),
  ['super', K + 550, -240, -3],
  s(R + 970, -20, -1),                                 // y al final, un hueso diminuto y lentísimo
] };

export function makeBullet([kind, x, dy, hs, o]) {
  if (kind === 's' || kind === 't') return new Bone(kind === 't', x, B + dy, hs, o);
  if (kind === 'dog') return new ScootDog(x, B + dy, hs, o);
  if (kind === 'bus') return new CoolBus(x, B + dy, hs);
  if (kind === 'super') return new SuperBone(x, B + dy, hs);
}
// blt_sizebone.speed = v: cambia la velocidad de todos los huesos sin cambiar su sentido
export function setSpeed(list, v) { for (const o of list) if (o instanceof Bone) o.hs = Math.sign(o.hs) * v; }
