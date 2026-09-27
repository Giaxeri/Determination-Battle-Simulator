import { drawText, playSound } from './assets.js';

// Escritor de texto (OBJ_WRITER). Por defecto es el de batalla (global.typer = 1):
// fnt_main, blanco, origen (x+20, y+20), 16 px por letra, 32 px por línea, 1 letra por frame, sonido SND_TXT2.
// Códigos del juego: & salto de línea, / fin de mensaje (espera Z), % fin total, ^N pausa, \EN cara, \XX otros.
const BATTLE = { font: 'fnt_main', color: '#fff', ox: 20, oy: 20, hspace: 16, vspace: 32, speed: 1, shake: 0, sound: 'txt' };

// Globos de diálogo del final de Undyne (typer 94/95/96): fnt_plain negro, 9x20, cada vez más lento y tembloroso
export const TYPER_UNDYNE = {
  94: { font: 'fnt_plain', color: '#000', ox: 16, oy: 0, hspace: 9, vspace: 20, speed: 2, shake: 1, sound: 'txtund' },
  95: { font: 'fnt_plain', color: '#000', ox: 16, oy: 0, hspace: 9, vspace: 20, speed: 3, shake: 2, sound: 'txtund' },
  96: { font: 'fnt_plain', color: '#000', ox: 16, oy: 0, hspace: 9, vspace: 20, speed: 4, shake: 3, sound: 'txtund' },
};

export class Writer {
  constructor(text, x, y, opts = {}) {
    this.o = { ...BATTLE, ...opts };
    this.x = x + this.o.ox; this.y = y + this.o.oy;
    this.cells = [];          // {ch, col, row}
    this.queue = [];          // acciones por frame
    let col = 0, row = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '&') { col = 0; row++; continue; }
      if (c === '/' || c === '%') break;
      if (c === '^') { const n = +text[i + 1] || 0; this.queue.push({ pause: n * 10 }); i++; continue; }
      if (c === '\\') { if (text[i + 1] === 'E') this.queue.push({ face: +text[i + 2] }); i += 2; continue; }
      this.queue.push({ ch: c, col, row });
      col++;
    }
    this.pos = 0; this.wait = 0; this.tick = 0; this.done = this.queue.length === 0;
    this.onFace = opts.onFace || null;
  }

  next() {
    const a = this.queue[this.pos++];
    if (a.pause) this.wait = a.pause;
    else if (a.face !== undefined) { if (this.onFace) this.onFace(a.face); }
    else {
      this.cells.push(a);
      const s = this.o.sound;   // una lista = una voz al azar por letra (Mettaton: snd_mtt1..9)
      if (a.ch !== ' ' && s) playSound(Array.isArray(s) ? s[Math.floor(Math.random() * s.length)] : s);
    }
    if (this.pos >= this.queue.length) this.done = true;
  }

  update() {
    if (this.done) return;
    if (this.wait > 0) { this.wait--; return; }
    if (++this.tick < this.o.speed) return;
    this.tick = 0;
    this.next();
    while (!this.done && this.queue[this.pos].face !== undefined) this.next();   // los códigos de cara no gastan frames
  }

  skip() {  // X: muestra todo el texto de golpe
    while (!this.done) {
      const a = this.queue[this.pos++];
      if (a.face !== undefined) { if (this.onFace) this.onFace(a.face); }
      else if (!a.pause) this.cells.push(a);
      if (this.pos >= this.queue.length) this.done = true;
    }
  }

  draw(ctx) {
    const { font, color, hspace, vspace, shake } = this.o;
    for (const c of this.cells) {
      const jx = shake ? Math.round((Math.random() - 0.5) * shake) : 0, jy = shake ? Math.round((Math.random() - 0.5) * shake) : 0;
      drawText(ctx, font, c.ch, this.x + c.col * hspace + jx, this.y + c.row * vspace + jy, { color });
    }
  }
}
