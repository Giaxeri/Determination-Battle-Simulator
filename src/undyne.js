import { drawSprite } from './assets.js';

// Cuerpo de Undyne the Undying: traducción de obj_undynex_body (evento Draw) del juego.
// (x, y) = posición del objeto en la sala; el juego la crea en (210, 20).
export class UndyneBody {
  constructor(x = 210, y = 20) {
    this.xstart = x; this.ystart = y;
    this.x = x; this.y = y;
    this.siner = 0; this.eyetimer = 0;
    this.facetype = 0;   // 0 normal, 1 risa, 2 emociones
    this.heady = 0;
    this.pause = 0;      // 1 = congelada con cara de daño (al recibir el golpe final)
    this.shakeX = 0;     // lo usa obj_objshake al recibir daño
    // Animación del tajo con el brazo (movetype 2): es la que vuelve verde el alma
    this.movetype = 0; this.slashno = 0; this.alarm1 = -1; this.arm_v = 0;
    this.larm = { xstart: x + 64, ystart: y + 78, x: x + 64, y: y + 78, angle: 0, depth: 7, visible: false };
    this.slashes = [];
    this.faceemotion = 0;  // cara del final (spr_undynex_face_e), la cambian los códigos \E del texto
    this.shakify = 0;      // temblor aleatorio del cuerpo al final
    this.visible = true;
  }

  // obj_undynex_body Other_11 (event_user(1))
  startSlash() { if (this.movetype === 0) this.movetype = 2; }

  // Lógica del tajo: primera parte del evento Draw de obj_undynex_body
  updateSlash() {
    if (this.alarm1 > 0 && --this.alarm1 === 0) this.slashno += 1;          // Alarm_1
    if (this.movetype !== 2) return;
    const L = this.larm;
    L.visible = true;
    if (this.slashno === 0 && L.angle > -104) {           // levanta el brazo
      this.facetype = 1; L.angle -= 35; L.x -= 4; L.y -= 4; this.heady -= 2;
    }
    if (this.slashno === 0 && L.angle <= -104) { L.angle = -104; this.alarm1 = 5; this.slashno = 0.1; }
    if (this.slashno === 1.1) { this.slashno = 1; this.alarm1 = 2; }
    if (this.slashno === 1) { this.facetype = 0; L.depth = 4; L.angle += 73.33333333333333; }
    if (this.slashno === 2) {                              // el tajo: dos estelas (spr_undyneb_smear)
      L.x = L.xstart; L.y = L.ystart; L.angle = 66;
      this.slashes = [{ x: L.x - 180, y: L.y + 20, a: 1, fall: 0 }, { x: L.x - 180, y: L.y + 20, a: 1, fall: 24 }];
      this.slashno = 3;
    }
    if (this.slashno === 3) {
      if (this.heady < 6) this.heady += 3;
      for (const sl of this.slashes) { sl.a -= 0.1; sl.y += sl.fall; }
      L.angle += 0.5;
      if (L.angle > 70) { this.slashes = []; this.slashno = 4; this.alarm1 = 3; }
    }
    if (this.slashno === 5) {                              // baja el brazo
      if (this.heady > 0) this.heady -= 1;
      L.angle -= 15;
      if (L.angle <= 6) {
        this.heady = 0; L.depth = 7; L.angle = 0; this.slashno = 0; this.movetype = 0; this.arm_v = 0; L.visible = false;
      }
    }
  }

  drawArm(ctx, depth) {
    const L = this.larm;
    if (L.visible && L.depth === depth) drawSprite(ctx, 'spr_undynex_leftarm', 0, L.x + this.shakeX, L.y, { xs: 2, ys: 2, rot: L.angle });
  }

  draw(ctx) {
    if (!this.visible) return;
    if (this.shakify > 0) {
      this.x = this.xstart + Math.random() * this.shakify - Math.random() * this.shakify;
      this.y = this.ystart + Math.random() * this.shakify - Math.random() * this.shakify;
    }
    this.updateSlash();
    this.drawArm(ctx, 7);                                  // brazo detrás del cuerpo (depth 7)
    this.siner += 1.4;
    if (this.pause === 1) this.siner = 0;
    const s_f = Math.sin(this.siner / 6), s_f2 = Math.sin(this.siner / 3), s_f3 = Math.sin(this.siner / 14);
    const x = this.x + this.shakeX, y = this.y, hy = this.heady;
    const S = { xs: 2, ys: 2 };

    drawSprite(ctx, 'spr_undynex_hair', 0, x + 85, y + s_f * 3 + hy + 4, { ...S, rot: 70 - s_f * 15 });
    drawSprite(ctx, 'spr_undynex_legs', 0, x + 100, y + 164, S);
    if (this.arm_v === 0) drawSprite(ctx, 'spr_undynex_leftarm', 0, x + 64 + s_f * 5, y + 78 + s_f * 5, S);
    drawSprite(ctx, 'spr_undynex_rightarm', 0, x + 136 + s_f2 * 3, y + 78 + s_f * 6 + s_f2 * 2, S);
    drawSprite(ctx, 'spr_undynex_torso', 0, x + 100, y + 78 + s_f * 4, { ...S, rot: -(s_f * 4) });
    drawSprite(ctx, 'spr_undynex_pants', 0, x + 100, y + 122 + s_f * 2, { ...S, rot: s_f * 2 });

    const fy = y + 28 + s_f * 2 + hy, ff = Math.floor(this.siner / 3);
    if (this.facetype === 0) drawSprite(ctx, this.pause ? 'spr_undynex_face_damage' : 'spr_undynex_face1', ff, x + 100, fy, S);
    if (this.facetype === 1) drawSprite(ctx, 'spr_undynex_face_laugh', ff, x + 100, fy, S);
    if (this.facetype === 2) drawSprite(ctx, 'spr_undynex_face_e', this.faceemotion, x + 100, fy, S);

    // Destello del ojo: aparece cada 40 frames
    if (this.facetype !== 0) this.eyetimer = 0;
    this.eyetimer++;
    if (this.eyetimer >= 10) {
      const e = this.eyetimer - 10;
      drawSprite(ctx, 'spr_undynex_eyebeam', 0, x + 110, y + 24 + s_f * 2,
        { xs: e / 4, ys: 2.5 - e / 20, rot: -(s_f3 * 32), alpha: 1.5 - e / 20 });
      if (this.eyetimer >= 40) this.eyetimer = 0;
    }
    if (this.movetype === 2) this.arm_v = 1;
    this.drawArm(ctx, 4);                                  // brazo delante (depth 4) durante el tajo
    for (const sl of this.slashes) drawSprite(ctx, 'spr_undyneb_smear', 0, sl.x, sl.y, { alpha: sl.a });
  }
}
