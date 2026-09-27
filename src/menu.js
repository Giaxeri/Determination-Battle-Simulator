import { drawSprite, drawText, playSound } from './assets.js';
import { ATTACKS } from './attacks.js';
import { MUFFET_ATTACKS } from './muffet.js';
import { NAPSTA_ATTACKS } from './napstablook.js';
import { METT_ATTACKS } from './mettaton.js';
import { SETTINGS, saveSettings, RESOLUTIONS, LANGS } from './settings.js';
import { layout, refreshTexts } from './ui.js';
import { tr, playerName } from './i18n.js';

// Menús de inicio al estilo "Select your bad time": texto blanco sobre negro y el alma roja como cursor.
//   Página 0: Bosses List (+ Options)
//   Página 1: la pelea completa de un jefe y debajo cada ataque por separado
//   Página 2: Options (resolución, idioma y nombre)    Página 3: nombrar al humano (como al empezar el juego)
export const BOSSES = [
  { name: 'Undyne the Undying', id: 'undyne', full: 'Battle Against a True Hero', attacks: ATTACKS },
  { name: 'Muffet', id: 'muffet', full: 'Spider Dance', attacks: MUFFET_ATTACKS },
  { name: 'Mettaton EX', id: 'mettaton', full: 'Death by Glamour', attacks: METT_ATTACKS },
  { name: 'Napstablook', id: 'napstablook', full: 'Ghost Fight', attacks: NAPSTA_ATTACKS },
];

const VISIBLE = 11;          // filas visibles antes de desplazar la lista
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', LOWER = 'abcdefghijklmnopqrstuvwxyz';

export class BossMenu {
  constructor(onPick, page = 0, boss = 0) {
    this.onPick = onPick; this.page = page; this.boss = boss; this.sel = page === 1 ? 0 : 0; this.scroll = 0; this.t = 0; this.chosen = null;
    this.face = 0; this.dogX = -80;
  }

  items() {
    if (this.page === 0) return [...BOSSES.map(b => ({ label: tr(b.name) })), { label: tr('Options'), options: true }];
    const B = BOSSES[this.boss];
    return [{ label: tr(B.full), mode: 'battle', boss: B.id },
            ...B.attacks.map(a => ({ label: tr(a.name), mode: 'single', attack: a, boss: B.id }))];
  }

  update(inp) {
    this.t++;
    if (this.chosen) {                           // pausa corta tras elegir
      if (this.t > 8) this.onPick(this.chosen);
      return;
    }
    if (this.page === 2) return this.updateOptions(inp);
    if (this.page === 3) return this.updateNaming(inp);
    const list = this.items(), n = list.length;
    if (inp.up)   { this.sel = (this.sel + n - 1) % n; playSound('squeak'); }
    if (inp.down) { this.sel = (this.sel + 1) % n; playSound('squeak'); }
    if (this.sel < this.scroll) this.scroll = this.sel;
    if (this.sel >= this.scroll + VISIBLE) this.scroll = this.sel - VISIBLE + 1;
    if (inp.cancel && this.page === 1) { this.page = 0; this.sel = this.boss; this.scroll = 0; playSound('squeak'); return; }
    if (inp.confirm) {
      playSound('select');
      if (this.page === 0 && list[this.sel].options) { this.page = 2; this.opt = 0; return; }
      if (this.page === 0) { this.boss = this.sel; this.page = 1; this.sel = 0; this.scroll = 0; return; }
      this.chosen = list[this.sel]; this.t = 0;
    }
  }

  // ---------------------------------------------------------------- Options
  updateOptions(inp) {
    const back = () => { this.page = 0; this.sel = BOSSES.length; playSound('squeak'); };
    if (inp.cancel) return back();
    if (inp.up) { this.opt = (this.opt + 3) % 4; playSound('squeak'); }
    if (inp.down) { this.opt = (this.opt + 1) % 4; playSound('squeak'); }
    if (this.opt === 0 && (inp.left || inp.right || inp.confirm)) {       // resolución: Small / Default / Large
      const i = RESOLUTIONS.findIndex(r => r.id === SETTINGS.res), d = inp.left ? -1 : 1;
      SETTINGS.res = RESOLUTIONS[(i + d + RESOLUTIONS.length) % RESOLUTIONS.length].id;
      saveSettings(); layout(); playSound(inp.confirm ? 'select' : 'squeak');
    }
    if (this.opt === 1 && (inp.left || inp.right || inp.confirm)) {       // idioma: English / Español
      const i = LANGS.findIndex(l => l.id === SETTINGS.lang), d = inp.left ? -1 : 1;
      SETTINGS.lang = LANGS[(i + d + LANGS.length) % LANGS.length].id;
      saveSettings(); refreshTexts(); playSound(inp.confirm ? 'select' : 'squeak');
    }
    if (this.opt === 2 && inp.confirm) { playSound('select'); this.page = 3; this.draft = SETTINGS.name === 'Player' ? '' : SETTINGS.name; this.cur = 0; }
    if (this.opt === 3 && inp.confirm) { playSound('select'); back(); }
  }

  // ---------------------------------------------------------------- nombre (obj_naming): letras + Quit / Backspace / Done
  namingCells() {
    const cells = [];
    [UPPER, LOWER].forEach((set, s) => [...set].forEach((ch, i) =>
      cells.push({ ch, x: 120 + (i % 7) * 64, y: 150 + s * 124 + Math.floor(i / 7) * 28 })));
    cells.push({ act: 'quit', label: tr('Quit'), x: 120, y: 410 }, { act: 'back', label: tr('Backspace'), x: 240, y: 410 }, { act: 'done', label: tr('Done'), x: 440, y: 410 });
    return cells;
  }
  updateNaming(inp) {
    const cells = this.namingCells(), c = cells[this.cur];
    const move = (dx, dy) => {                      // la letra más cercana en esa dirección
      let best = null, bd = 1e9;
      for (let i = 0; i < cells.length; i++) {
        const o = cells[i], ddx = o.x - c.x, ddy = o.y - c.y;
        if (dx && Math.sign(ddx) !== dx) continue; if (dy && Math.sign(ddy) !== dy) continue;
        if (dx && Math.abs(ddy) > 14) continue;
        const d = dy ? Math.abs(ddy) * 4 + Math.abs(ddx) : Math.abs(ddx);
        if (i !== this.cur && d < bd) { bd = d; best = i; }
      }
      if (best !== null) { this.cur = best; }
    };
    if (inp.left) move(-1, 0); if (inp.right) move(1, 0); if (inp.up) move(0, -1); if (inp.down) move(0, 1);
    if (inp.cancel) { this.draft = this.draft.slice(0, -1); return; }
    if (!inp.confirm) return;
    if (c.ch) { if (this.draft.length < 6) this.draft += c.ch; return; }
    if (c.act === 'back') this.draft = this.draft.slice(0, -1);
    if (c.act === 'quit') { playSound('squeak'); this.page = 2; }
    if (c.act === 'done') { SETTINGS.name = this.draft || 'Player'; saveSettings(); playSound('select'); this.page = 2; }
  }

  // ---------------------------------------------------------------- dibujo
  draw(ctx) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 640, 480);
    if (this.page === 2) return this.drawOptions(ctx);
    if (this.page === 3) return this.drawNaming(ctx);
    if (this.page === 0) this.drawDecor(ctx);
    drawText(ctx, 'fnt_main', this.page === 0 ? tr('Bosses List') : tr(BOSSES[this.boss].name), 24, 20, { mono: 16 });
    const list = this.items();
    list.slice(this.scroll, this.scroll + VISIBLE).forEach((it, k) => {
      const i = k + this.scroll;
      // pelea completa arriba y, tras un hueco, los ataques / Options separado de los jefes
      const gap = (this.page === 1 && i > 0 && this.scroll === 0) || (this.page === 0 && it.options) ? 16 : 0;
      const y = 90 + k * 32 + gap;
      drawText(ctx, 'fnt_main', it.label, 124, y, { mono: 16 });
      if (i === this.sel) drawSprite(ctx, 'spr_heart', 0, 84, y + 6);
    });
    if (this.scroll > 0) drawText(ctx, 'fnt_main', '^', 600, 90, { mono: 16, color: '#808080' });
    if (this.scroll + VISIBLE < list.length) drawText(ctx, 'fnt_main', 'v', 600, 90 + (VISIBLE - 1) * 32 + 16, { mono: 16, color: '#808080' });
  }

  // Decoración del menú principal: caras y personajes del juego moviéndose un poco
  drawDecor(ctx) {
    const t = this.t;
    if (t % 90 === 0) this.face = [0, 0, 0, 3, 5, 8, 10][Math.floor(Math.random() * 7)];   // Sans cambia de expresión de vez en cuando
    drawSprite(ctx, 'spr_sansb_face', this.face, 540, 118 + Math.sin(t / 20) * 3, { xs: 2, ys: 2 });
    drawSprite(ctx, 'spr_papyrusboss_head', 0, 452, 200 + Math.sin(t / 17 + 1) * 3);
    drawSprite(ctx, 'spr_napstablook_d', 0, 560, 230 + Math.sin(t / 25) * 6, { xs: 2, ys: 2, alpha: 0.7 + Math.sin(t / 25) * 0.2 });
    drawSprite(ctx, 'spr_floweynice', Math.floor(t / 15) % 2, 30, 360, { xs: 2, ys: 2 });
    drawText(ctx, 'fnt_maintext', tr('Press Z to proceed · Press X to go back'), 150, 390, { color: '#808080' });
    this.dogX += 1.2; if (this.dogX > 700) this.dogX = -140;                              // el perro molesto pasa arrastrándose
    drawSprite(ctx, 'spr_tobydogscoot', Math.floor(t / 8) % 2, this.dogX, 408, { xs: 1.5, ys: 1.5 });
    drawSprite(ctx, 'spr_sleepdog', Math.floor(t / 30) % 2, 560, 440, { xs: 2, ys: 2 });
  }

  drawOptions(ctx) {
    drawText(ctx, 'fnt_main', tr('Options'), 24, 20, { mono: 16 });
    const res = RESOLUTIONS.find(r => r.id === SETTINGS.res), lang = LANGS.find(l => l.id === SETTINGS.lang);
    const rows = [[tr('Resolution'), `< ${tr(res.label)} >`], [tr('Language'), `< ${lang.label} >`], [tr('Name'), playerName()], [tr('Back'), '']];
    rows.forEach(([a, b], i) => {
      const y = 110 + i * 48;
      drawText(ctx, 'fnt_main', a, 124, y, { mono: 16, color: this.opt === i ? '#ff0' : '#fff' });
      if (b) drawText(ctx, 'fnt_main', b, 340, y, { mono: 16, color: this.opt === i ? '#ff0' : '#fff' });
      if (this.opt === i) drawSprite(ctx, 'spr_heart', 0, 84, y + 6);
    });
    const help = ['Left / Right: change the size of the game.', 'Left / Right on Language: English / Español.', 'Z on Name: choose the name used in battle.', 'X: go back.'];
    help.forEach((s, i) => drawText(ctx, 'fnt_maintext', tr(s), 124, 330 + i * 18, { color: '#808080' }));
  }

  drawNaming(ctx) {
    const title = tr('Name the fallen human.');
    drawText(ctx, 'fnt_main', title, 180 - (title.length - 22) * 8, 60, { mono: 16 });
    drawText(ctx, 'fnt_main', this.draft, 280, 108, { mono: 16 });
    this.namingCells().forEach((c, i) => {
      const jx = c.ch ? Math.round(Math.random() * 2 - 1) : 0, jy = c.ch ? Math.round(Math.random() * 2 - 1) : 0;   // las letras tiemblan, como en el juego
      drawText(ctx, 'fnt_main', c.ch || c.label, c.x + jx, c.y + jy, { mono: 16, color: i === this.cur ? '#ff0' : '#fff' });
    });
    drawText(ctx, 'fnt_maintext', tr('Up to 6 letters.'), 24, 456, { color: '#808080' });
  }
}
