import { drawSprite, drawText, playSound } from './assets.js';
import { ATTACKS } from './attacks.js';
import { MUFFET_ATTACKS } from './muffet.js';
import { NAPSTA_ATTACKS } from './napstablook.js';
import { METT_ATTACKS } from './mettaton.js';

// Menús de inicio al estilo "Select your bad time": texto blanco sobre negro y el alma roja como cursor.
//   Página 1: Bosses List
//   Página 2: la pelea completa ("Battle Against a True Hero") y debajo cada ataque por separado
// Cada jefe: su pelea completa (con el nombre de su canción) y sus ataques sueltos
export const BOSSES = [
  { name: 'Undyne the Undying', id: 'undyne', full: 'Battle Against a True Hero', attacks: ATTACKS },
  { name: 'Muffet', id: 'muffet', full: 'Spider Dance', attacks: MUFFET_ATTACKS },
  { name: 'Mettaton EX', id: 'mettaton', full: 'Death by Glamour', attacks: METT_ATTACKS },
  { name: 'Napstablook', id: 'napstablook', full: 'Ghost Fight', attacks: NAPSTA_ATTACKS },
];

const VISIBLE = 11;          // filas visibles antes de desplazar la lista

export class BossMenu {
  constructor(onPick, page = 0, boss = 0) { this.onPick = onPick; this.page = page; this.boss = boss; this.sel = 0; this.scroll = 0; this.t = 0; this.chosen = null; }

  items() {
    if (this.page === 0) return BOSSES.map(b => ({ label: b.name }));
    const B = BOSSES[this.boss];
    return [{ label: B.full, mode: 'battle', boss: B.id },
            ...B.attacks.map(a => ({ label: a.name, mode: 'single', attack: a, boss: B.id }))];
  }

  update(inp) {
    this.t++;
    if (this.chosen) {                           // pausa corta tras elegir
      if (this.t > 8) this.onPick(this.chosen);
      return;
    }
    const list = this.items(), n = list.length;
    if (inp.up)   { this.sel = (this.sel + n - 1) % n; playSound('squeak'); }
    if (inp.down) { this.sel = (this.sel + 1) % n; playSound('squeak'); }
    if (this.sel < this.scroll) this.scroll = this.sel;
    if (this.sel >= this.scroll + VISIBLE) this.scroll = this.sel - VISIBLE + 1;
    if (inp.cancel && this.page === 1) { this.page = 0; this.sel = this.boss; this.scroll = 0; playSound('squeak'); return; }
    if (inp.confirm) {
      playSound('select');
      if (this.page === 0) { this.boss = this.sel; this.page = 1; this.sel = 0; this.scroll = 0; return; }
      this.chosen = list[this.sel]; this.t = 0;
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 640, 480);
    drawText(ctx, 'fnt_main', this.page === 0 ? 'Bosses List' : BOSSES[this.boss].name, 24, 20, { mono: 16 });
    const list = this.items();
    list.slice(this.scroll, this.scroll + VISIBLE).forEach((it, k) => {
      const i = k + this.scroll;
      // la pelea completa arriba y, tras un hueco, los ataques
      const y = 90 + k * 32 + (this.page === 1 && i > 0 && this.scroll === 0 ? 16 : 0);
      drawText(ctx, 'fnt_main', it.label, 124, y, { mono: 16 });
      if (i === this.sel) drawSprite(ctx, 'spr_heart', 0, 84, y + 6);
    });
    if (this.scroll > 0) drawText(ctx, 'fnt_main', '^', 600, 90, { mono: 16, color: '#808080' });
    if (this.scroll + VISIBLE < list.length) drawText(ctx, 'fnt_main', 'v', 600, 90 + (VISIBLE - 1) * 32 + 16, { mono: 16, color: '#808080' });
    if (this.page === 0) { drawText(ctx, 'fnt_maintext', 'DETERMINATION BATTLE SIMULATOR', 392, 28, { color: '#808080' }); this.drawCredits(ctx); }
  }

  // Esquinas de la pantalla "Bosses List": aviso de fan-game (izquierda) y autor (derecha).
  // Los enlaces se pueden pulsar con el ratón (main.js pone <a> invisibles encima de LINKS).
  drawCredits(ctx) {
    const f = 'fnt_maintext', grey = '#808080', yel = this.hover === 'undertale' ? '#fff' : '#ff0';
    const x = 16;
    drawText(ctx, f, 'This is a non-profit, fan-made tribute to UNDERTALE.', x, 400, { color: grey });
    const w = drawText(ctx, f, 'UNDERTALE', x, 415, { color: grey });
    drawRegistered(ctx, x + w + 1, 416, grey);
    drawText(ctx, f, ' is owned by Toby Fox.', x + w + 8, 415, { color: grey });
    drawText(ctx, f, 'Please support the official release:', x, 430, { color: grey });
    drawSprite(ctx, 'spr_heart', 0, x, 447, { xs: 0.75, ys: 0.75 });
    const w2 = drawText(ctx, f, 'Buy UNDERTALE at ', x + 18, 446, { color: '#fff' });
    drawText(ctx, f, 'undertale.com', x + 18 + w2, 446, { color: yel });

    const ax = 430, ay = 404, s = 50;                    // foto de GitHub con marco blanco, como la caja de batalla
    ctx.fillStyle = '#fff'; ctx.fillRect(ax - 3, ay - 3, s + 6, s + 6);
    ctx.fillStyle = '#000'; ctx.fillRect(ax - 1, ay - 1, s + 2, s + 2);
    if (AVATAR.complete && AVATAR.naturalWidth) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(AVATAR, ax, ay, s, s); ctx.restore(); }
    const tx = ax + s + 12, gy = this.hover === 'github' ? '#fff' : '#ff0';
    drawText(ctx, f, 'Made by:', tx, 402, { color: grey });
    drawText(ctx, f, 'Gianfry (Giaxeri)', tx, 417, { color: '#fff' });
    drawText(ctx, f, 'on Github!', tx, 432, { color: grey });
    drawText(ctx, f, 'github.com/Giaxeri', tx, 447, { color: gy });
  }
}

// Zonas clicables (coordenadas del lienzo de 640x480)
export const LINKS = [
  { id: 'undertale', href: 'https://undertale.com', title: 'Buy UNDERTALE at undertale.com', x: 16, y: 443, w: 230, h: 20 },
  { id: 'github', href: 'https://github.com/Giaxeri', title: 'Gianfry (Giaxeri) on GitHub', x: 424, y: 398, w: 204, h: 64 },
];
const AVATAR = new Image();
AVATAR.src = 'https://avatars.githubusercontent.com/u/149126315?s=100&v=4';   // foto de perfil de GitHub (Giaxeri)

function drawRegistered(ctx, x, y, color) {           // la fuente del juego no trae el signo ®: lo dibujamos a mano
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x + 3.5, y + 3.5, 3.2, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, 1, 4); ctx.fillRect(x + 3, y + 2, 2, 1); ctx.fillRect(x + 4, y + 3, 1, 1); ctx.fillRect(x + 3, y + 4, 1, 1); ctx.fillRect(x + 4, y + 5, 1, 1);
  ctx.restore();
}
