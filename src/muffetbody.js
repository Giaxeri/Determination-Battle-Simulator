import { drawSprite } from './assets.js';

// Cuerpo de Muffet: traducción de obj_spiderb_body (evento Draw). Se crea en (x+62, y-2) del objeto obj_spiderb.
export class MuffetBody {
  constructor(x = 276, y = 35) {
    this.xstart = x; this.ystart = y; this.x = x; this.y = y;
    this.siner = 0; this.sinert = 0; this.anim = 0;
    this.eye = [0, 0, 0, 0, 0];
    this.mode = 0;            // 0 normal, 1 sirviendo té con las dos teteras
    this.pour = 0; this.pourAlarm = -1;
    this.hurt = 0; this.pauser = 0;
    this.shakeX = 0; this.visible = true;
    this.onPourDrop = null;   // lo usa la batalla para crear las gotas (obj_spiderpour)
    this.boxTop = 250;        // si la caja sube (turnos de la mascota), Muffet sube con ella
  }
  startPour() { this.mode = 1; this.sinert = 71; }     // Other_10

  draw(ctx) {
    if (!this.visible) return;
    this.y = this.boxTop < 240 ? this.ystart - 4 - (240 - this.boxTop) : this.ystart;
    if (this.hurt === 1 || this.pauser === 1) { this.siner = 0; this.eye = [0, 0, 0, 0, 0]; }
    const x = this.x + this.shakeX, y = this.y, s = this.siner, S = { xs: 2, ys: 2 };
    const heady = y + Math.sin(s / 5) * 4, hairrot = Math.sin(s / 5) * 25, c5 = Math.cos(s / 5), s5 = Math.sin(s / 5);

    drawSprite(ctx, 'spr_spiderb_upperarm', 0, x + 14, y + 86 + 26 + c5, { xs: -2, ys: 2, rot: -s5 * 6 });
    drawSprite(ctx, 'spr_spiderb_shoulder', 0, x + 42, y + 86 + c5, { xs: -2, ys: 2 });
    drawSprite(ctx, 'spr_spiderb_upperarm', 0, x + 78, y + 86 + 26 + c5, { ...S, rot: s5 * 6 });
    drawSprite(ctx, 'spr_spiderb_shoulder', 0, x + 50, y + 86 + c5, S);
    drawSprite(ctx, 'spr_spiderb_hair', 0, x + 80, heady * 1.02 + 18, { ...S, rot: hairrot });
    drawSprite(ctx, 'spr_spiderb_hair', 0, x + 12, heady * 1.02 + 18, { xs: -2, ys: 2, rot: -hairrot });
    drawSprite(ctx, 'spr_spiderb_head', 0, x, heady, S);
    drawSprite(ctx, 'spr_spiderb_legs', 0, x + 30, y + 162, S);
    const arm = s5 < 0 ? 1 : 0;
    drawSprite(ctx, 'spr_spiderb_lowarm', arm, x + 26, y + 130 + s5, { ...S, rot: s5 * 8 - 8 });
    drawSprite(ctx, 'spr_spiderb_lowarm', arm, x + 64, y + 130 + s5, { xs: -2, ys: 2, rot: -(s5 * 8) + 8 });

    if (this.mode === 0) {                     // teteras en reposo
      const c = Math.cos(s / 5) * 2;
      drawSprite(ctx, 'spr_spiderb_teapot', 0, x - 22, y + 104 + c, { ...S, rot: -s5 * 24 });
      drawSprite(ctx, 'spr_spiderb_midarm', 0, x + 12, y + 116 + c, S);
      drawSprite(ctx, 'spr_spiderb_midarm2', 0, x + 12, y + 130 + c, { ...S, rot: s5 * 3 });
      drawSprite(ctx, 'spr_spiderb_teapot', 0, x + 114, y + 104 + c, { xs: -2, ys: 2, rot: -s5 * 24 });
      drawSprite(ctx, 'spr_spiderb_midarm', 0, x + 80, y + 116 + c, { xs: -2, ys: 2 });
      drawSprite(ctx, 'spr_spiderb_midarm2', 0, x + 80, y + 130 + c, { xs: -2, ys: 2, rot: s5 * 3 });
    } else {                                   // sirviendo: inclina las teteras
      if (this.sinert < 55) { if (this.pour === 0) { this.pourAlarm = 1; this.pour = 1; } }
      else this.sinert -= 1;
      const t = this.sinert, st = Math.sin(t / 5), ct = Math.cos(t / 5) * 2;
      drawSprite(ctx, 'spr_spiderb_teapot', 0, x - 22, y + 104 + ct, { ...S, rot: -st * 36 });
      drawSprite(ctx, 'spr_spiderb_midarm', 0, x + 12, y + 116 + ct, S);
      drawSprite(ctx, 'spr_spiderb_midarm2', 0, x + 12, y + 130 + ct, { ...S, rot: st * 3 });
      drawSprite(ctx, 'spr_spiderb_teapot', 0, x + 114, y + 104 + ct, { xs: -2, ys: 2, rot: st * 36 });
      drawSprite(ctx, 'spr_spiderb_midarm', 0, x + 80, y + 116 + ct, { xs: -2, ys: 2 });
      drawSprite(ctx, 'spr_spiderb_midarm2', 0, x + 80, y + 130 + ct, { xs: -2, ys: 2, rot: st * 3 });
    }
    // Alarm_5: mientras sirve, cae una gota de cada tetera cada 4 frames
    if (this.pourAlarm > 0 && --this.pourAlarm === 0 && this.mode === 1) {
      if (this.onPourDrop) {
        this.onPourDrop(this.x - 50, this.y + 130 + Math.cos(this.sinert / 5) * 2, 1);
        this.onPourDrop(this.x + 140, this.y + 130 + Math.cos(this.sinert / 5) * 2, -1);
      }
      this.pourAlarm = 4;
    }
    drawSprite(ctx, 'spr_spiderb_pants', 0, x + 20, y + 114 + s5, S);
    drawSprite(ctx, 'spr_spiderb_shirt', 0, x + 28, y + 92 + s5 * 2, S);

    // Parpadeo de los 5 ojos
    for (let i = 0; i < 5; i++) {
      const a = this.anim;
      if (a > i * 5 && a < 7 + i * 5) this.eye[i] += 0.5;
      if (a > 12 + i * 5 && a < 16 + i * 5) this.eye[i] -= 1;
      if (a > 70 && a < 77) this.eye[i] += 0.5;
      if (a > 88 && a < 95) this.eye[i] -= 0.5;
      this.eye[i] = Math.max(0, Math.min(3, this.eye[i]));
    }
    const h = this.hurt === 1 ? '_hurt' : '', e = this.eye.map(v => (h ? 0 : Math.floor(v)));
    drawSprite(ctx, 'spr_spiderb_eyebig' + h, e[0], x + 24, heady + 42, S);
    drawSprite(ctx, 'spr_spiderb_eyemed' + h, e[1], x + 30, heady + 32, S);
    drawSprite(ctx, 'spr_spiderb_eyecen' + h, e[2], x + 42, heady + 26, S);
    drawSprite(ctx, 'spr_spiderb_eyemed' + h, e[3], x + 62, heady + 32, { xs: -2, ys: 2 });
    drawSprite(ctx, 'spr_spiderb_eyebig' + h, e[4], x + 68, heady + 42, { xs: -2, ys: 2 });
    if (this.hurt === 0 && this.pauser === 0) this.siner++;
    if (++this.anim > 110) this.anim = 0;
  }
}
