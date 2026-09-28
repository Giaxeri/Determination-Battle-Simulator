// Papyrus: fuente fnt_papyrus (con sus letras del español), su escritor de globos (typer 22)
// y los sprites con texto en inglés rehechos en español ("PRESS" del guante y las letras de hueso "Cool Dude").
import { SPR, FNT, drawText, playSound, fresh } from './assets.js';

// ---------------------------------------------------------------- fuente fnt_papyrus (la carga este módulo: extract.py no la saca)
const img = src => new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = src; });
export const fontReady = Promise.all([fetch('assets/fonts/fnt_papyrus.json').then(r => r.json()), img('assets/fonts/fnt_papyrus.png')])
  .then(([data, image]) => { FNT.fnt_papyrus = { img: image, ...data }; addAccents(); })
  .catch(e => console.warn('fnt_papyrus', e));

// Tildes dibujadas con el trazo de 2 px de la fuente; ¿ y ¡ son ? y ! girados
const MARKS = { acute: ['...##', '..##.'], tilde: ['.###.#', '#.###.'], dier: ['##.##', '##.##'] };
const ACC = { 'Á': 'Aacute', 'É': 'Eacute', 'Í': 'Iacute', 'Ó': 'Oacute', 'Ú': 'Uacute', 'Ñ': 'Ntilde', 'Ü': 'Udier',
              'á': 'aacute', 'é': 'eacute', 'í': 'iacute', 'ó': 'oacute', 'ú': 'uacute', 'ñ': 'ntilde', 'ü': 'udier', '¿': '?flip', '¡': '!flip' };
function addAccents() {
  const f = FNT.fnt_papyrus, G = f.glyphs, todo = Object.keys(ACC).filter(c => !G[c]);
  const cellW = 18, cellH = 20, c = document.createElement('canvas');
  c.width = Math.max(f.img.width, todo.length * cellW); c.height = f.img.height + cellH + 2;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(f.img, 0, 0);
  todo.forEach((ch, k) => {
    const base = ACC[ch][0], mark = ACC[ch].slice(1);
    let [gx, gy, gw, gh, shift, off] = G[base];
    const d = g.getImageData(gx, gy, gw, gh).data;
    let rows = [...Array(gh)].map((_, r) => [...Array(gw)].map((_, q) => d[(r * gw + q) * 4 + 3] > 0));
    const inkRows = rows.map((row, r) => row.some(Boolean) ? r : -1).filter(r => r >= 0);
    const top = inkRows[0], bot = inkRows[inkRows.length - 1];
    if (mark === 'flip') {                          // ¿ ¡: la letra girada 180° dentro de su caja de tinta
      const cols = rows.flatMap(row => row.map((v, q) => v ? q : -1)).filter(q => q >= 0), l = Math.min(...cols), r = Math.max(...cols);
      rows = rows.map((row, y) => row.map((_, x) => y >= top && y <= bot && x >= l && x <= r ? rows[top + bot - y][l + r - x] : false));
    } else {
      if (base === 'i') for (let r = 0; r < top + 2 && r < gh; r++) rows[r] = rows[r].map(() => false);
      const pat = MARKS[mark], pw = pat[0].length;
      const cols = rows.flatMap(row => row.map((v, q) => v ? q : -1)).filter(q => q >= 0);
      let x0 = Math.round((Math.min(...cols) + Math.max(...cols) + 1) / 2 - pw / 2);
      const padL = Math.max(0, -x0), padR = Math.max(0, x0 + pw - gw);
      if (padL || padR) { rows = rows.map(row => [...Array(padL).fill(false), ...row, ...Array(padR).fill(false)]); gw += padL + padR; off -= padL; x0 += padL; }
      const y0 = Math.max(0, top - 3);                // dos filas de tilde y una de hueco sobre la letra
      pat.forEach((line, i) => [...line].forEach((v, j) => { if (v === '#') rows[y0 + i][x0 + j] = true; }));
    }
    const out = g.createImageData(gw, gh), nx = k * cellW, ny = f.img.height + 2;
    rows.forEach((row, r) => row.forEach((v, q) => { if (v) out.data.set([255, 255, 255, 255], (r * gw + q) * 4); }));
    g.putImageData(out, nx, ny);
    G[ch] = [nx, ny, gw, gh, shift, off];
  });
  f.img = fresh(c, 'assets/fonts/fnt_papyrus.png#es');   // copia en GPU (src = clave para la caché de colores de drawText)
}

// ---------------------------------------------------------------- escritor de los globos de Papyrus
// global.typer = 22: fnt_papyrus negro, 11 px por letra (con los ajustes por letra de obj_base_writer), 20 px por línea,
// una letra por frame y snd_txtpap. Códigos: & salto, / fin de mensaje, % fin, ^N pausa, \R rojo, \X negro, \W blanco, \Y amarillo.
const KERN = { D: 1, Q: 3, M: 1, L: -1, K: -1, C: 1, '.': -3, '!': -3, O: 2, W: 2, I: -6, T: -1, P: -2, R: -2, A: 1, H: 1, B: 1, G: 1, F: -1, '?': -3, "'": -6, J: -1, '¡': -3, '¿': -3 };
const COLORS = { R: '#f00', X: '#000', W: '#fff', Y: '#ff0', B: '#00f', G: '#0f0' };
const plain = ch => ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
export const PAP_STYLE = { font: 'fnt_papyrus', color: '#000', hspace: 11, vspace: 20, speed: 1, sound: 'txtpap', kern: true };

export class PWriter {
  constructor(text, x, y, opts = {}) {
    this.o = { ...PAP_STYLE, ...opts };
    this.x = x; this.y = y; this.cells = []; this.queue = [];
    let cx = 0, row = 0, color = this.o.color;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '&') { cx = 0; row++; continue; }
      if (c === '/' || c === '%') break;
      if (c === '^') { this.queue.push({ pause: (+text[i + 1] || 0) * 10 }); i++; continue; }
      if (c === '\\') { const k = text[i + 1]; if (COLORS[k]) color = COLORS[k]; i += k === 'E' ? 2 : 1; continue; }
      this.queue.push({ ch: c, x: cx, row, color });
      cx += this.o.hspace + (this.o.kern ? KERN[c] || KERN[plain(c)] || 0 : 0);
    }
    this.pos = 0; this.wait = 0; this.tick = 0; this.done = this.queue.length === 0;
  }
  update() {
    if (this.done) return;
    if (this.wait > 0) { this.wait--; return; }
    if (++this.tick < this.o.speed) return;
    this.tick = 0;
    const a = this.queue[this.pos++];
    if (a.pause) this.wait = a.pause;
    else { this.cells.push(a); if (a.ch !== ' ' && this.o.sound) playSound(this.o.sound); }
    if (this.pos >= this.queue.length) this.done = true;
  }
  skip() { while (!this.done) { const a = this.queue[this.pos++]; if (!a.pause) this.cells.push(a); if (this.pos >= this.queue.length) this.done = true; } }
  draw(ctx) {
    if (!FNT[this.o.font]) return;
    for (const c of this.cells) drawText(ctx, this.o.font, c.ch, this.x + c.x, this.y + c.row * this.o.vspace, { color: c.color });
  }
}

// ---------------------------------------------------------------- sprites en español (se crean la primera vez que se dibujan)
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function register(name, frames, like) { SPR[name] = { ...SPR[like], frames, w: frames[0].width, h: frames[0].height }; }

// "PRESS" (obj_pressZ) -> "PULSA": la P y la S se copian del original y la U, la L y la A se dibujan con el mismo trazo
// verde de 2 px y el borde negro de 1 px.
export function pressEs() {
  if (SPR.spr_pressz_press_es || !SPR.spr_pressz_press) return;
  const im = SPR.spr_pressz_press.frames[0], W = im.width, H = im.height, c = canvas(W, H), g = c.getContext('2d');
  const src = canvas(W, H).getContext('2d'); src.drawImage(im, 0, 0);
  const d = src.getImageData(0, 0, W, H).data, green = (x, y) => d[(y * W + x) * 4 + 3] > 0 && d[(y * W + x) * 4 + 1] > 200;
  const M = [...Array(H)].map(() => Array(W).fill(false));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((x >= 5 && x <= 10) || (x >= 26 && x <= 31)) M[y][x] = green(x, y);   // P y S
  const PAT = {
    U: ['##..##', '##..##', '##..##', '##..##', '##..##', '##..##', '##..##', '##..##', '.####.'],
    L: ['##....', '##....', '##....', '##....', '##....', '##....', '##....', '##....', '######'],
    A: ['.####.', '##..##', '##..##', '##..##', '######', '##..##', '##..##', '##..##', '##..##'],
  };
  for (const [ch, x0] of [['U', 12], ['L', 19], ['A', 33]]) PAT[ch].forEach((row, r) => [...row].forEach((v, q) => { if (v === '#') M[6 + r][x0 + q] = true; }));
  const out = g.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = null;
    if (M[y][x]) v = [64, 255, 64, 255];
    else for (let dy = -1; dy <= 1 && !v; dy++) for (let dx = -1; dx <= 1; dx++) if (M[y + dy] && M[y + dy][x + dx]) { v = [0, 0, 0, 255]; break; }
    if (v) out.data.set(v, (y * W + x) * 4);
  }
  g.putImageData(out, 0, 0);
  register('spr_pressz_press_es', [c], 'spr_pressz_press');
}

// Letras de hueso del "ataque absolutamente normal": "C" "ool" "D" "ude" -> "T" "ipo" "G" "enial".
// Cada trazo es un hueso blanco de 2 px con los extremos en horquilla, como los del juego.
// Las letras se definen en una rejilla (mayúsculas: 7 x 12 celdas de 4 px; minúsculas: 3 x 5 celdas).
const BONES = {
  T: [[0, 0, 6, 0], [3, 0, 3, 12]],
  G: [[6, 0, 0, 0], [0, 0, 0, 12], [0, 12, 6, 12], [6, 12, 6, 6], [6, 6, 3, 6]],
  i: [[1.5, 1, 1.5, 5]],
  p: [[0, 1, 0, 6], [0, 1, 3, 1], [3, 1, 3, 4], [3, 4, 0, 4]],
  o: [[0, 1, 3, 1], [3, 1, 3, 5], [3, 5, 0, 5], [0, 5, 0, 1]],
  e: [[3, 3, 0, 3], [3, 3, 3, 1], [3, 1, 0, 1], [0, 1, 0, 5], [0, 5, 3, 5]],
  n: [[0, 1, 0, 5], [0, 1, 3, 1], [3, 1, 3, 5]],
  a: [[0, 1, 3, 1], [3, 1, 3, 5], [3, 5, 0, 5], [0, 5, 0, 3], [0, 3, 3, 3]],
  l: [[1.5, -2, 1.5, 5]],
};
function drawBone(g, x1, y1, x2, y2) {
  const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len, px = -uy, py = ux;
  const dot = (x, y) => g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
  for (let t = 2; t <= len - 2; t += 0.5) dot(x1 + ux * t, y1 + uy * t);
  for (const [ex, ey, s] of [[x1, y1, 1], [x2, y2, -1]])            // horquillas de cada extremo
    for (const side of [-1, 1]) for (let t = 0; t <= 3; t += 0.5) dot(ex + ux * s * (2 - t) + px * side * (1 + t), ey + uy * s * (2 - t) + py * side * (1 + t));
}
function boneWord(word, like, cap, w = SPR[like].w) {
  const c = canvas(w, SPR[like].h), g = c.getContext('2d');
  g.fillStyle = '#fff';
  const u = cap ? 4 : 4.5, top = cap ? 8 : 32;
  let x = 4;
  for (const ch of word) {
    for (const [a, b, e, f] of BONES[ch]) drawBone(g, x + a * u, top + b * u, x + e * u, top + f * u);
    if (ch === 'i') g.fillRect(Math.round(x + 1.5 * u) - 2, top - 5, 4, 4);          // el punto de la i
    x += cap ? 34 : 22;
  }
  return c;
}
export function coolDudeEs() {
  if (SPR.spr_cbone_es || !SPR.spr_cbone) return;
  register('spr_cbone_es', [boneWord('T', 'spr_cbone', true)], 'spr_cbone');
  register('spr_oolbone_es', [boneWord('ipo', 'spr_oolbone', false)], 'spr_oolbone');
  register('spr_dbone_es', [boneWord('G', 'spr_dbone', true)], 'spr_dbone');
  register('spr_udebone_es', [boneWord('enial', 'spr_udebone', false, 122)], 'spr_udebone');   // "enial" es más largo que "ude"
}
