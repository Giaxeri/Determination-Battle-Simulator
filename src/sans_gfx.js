// Sans: fuente fnt_comicsans (con sus letras del español), escritor de sus globos (typer 107/108/109),
// dibujo de partes de sprites (draw_sprite_part_ext) y los sonidos largos de ambiente (pájaros y "chokedup").
import { SPR, FNT, drawText, playSound, VOLUME, isMuted, fresh } from './assets.js';

// ---------------------------------------------------------------- fuente fnt_comicsans (extract.py no la saca: la carga este módulo)
const img = src => new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = src; });
export const fontReady = Promise.all([fetch('assets/fonts/fnt_comicsans.json').then(r => r.json()), img('assets/fonts/fnt_comicsans.png')])
  .then(([data, image]) => { FNT.fnt_comicsans = { img: image, ...data }; addAccents(); })
  .catch(e => console.warn('fnt_comicsans', e));

// Tildes con el trazo de 2 px de la fuente; ¿ y ¡ son ? y ! girados
const MARKS = { acute: ['..##', '##..'], tilde: ['.##.#', '#.##.'], dier: ['##.##', '##.##'] };
const ACC = { 'Á': 'Aacute', 'É': 'Eacute', 'Í': 'Iacute', 'Ó': 'Oacute', 'Ú': 'Uacute', 'Ñ': 'Ntilde', 'Ü': 'Udier',
              'á': 'aacute', 'é': 'eacute', 'í': 'iacute', 'ó': 'oacute', 'ú': 'uacute', 'ñ': 'ntilde', 'ü': 'udier', '¿': '?flip', '¡': '!flip' };
function addAccents() {
  const f = FNT.fnt_comicsans, G = f.glyphs, todo = Object.keys(ACC).filter(c => !G[c]);
  const cellW = 14, cellH = 16, c = document.createElement('canvas');
  c.width = Math.max(f.img.width, todo.length * cellW); c.height = f.img.height + cellH + 2;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(f.img, 0, 0);
  todo.forEach((ch, k) => {
    const base = ACC[ch][0], mark = ACC[ch].slice(1);
    let [gx, gy, gw, gh, shift, off] = G[base];
    const d = g.getImageData(gx, gy, gw, gh).data;
    let rows = [...Array(gh)].map((_, r) => [...Array(gw)].map((_, q) => d[(r * gw + q) * 4 + 3] > 0));
    const inkTop = () => rows.findIndex(row => row.some(Boolean));
    let top = inkTop();
    const bot = gh - 1 - [...rows].reverse().findIndex(row => row.some(Boolean));
    if (mark === 'flip') {
      const cols = rows.flatMap(row => row.map((v, q) => v ? q : -1)).filter(q => q >= 0), l = Math.min(...cols), r = Math.max(...cols);
      rows = rows.map((row, y) => row.map((_, x) => y >= top && y <= bot && x >= l && x <= r ? rows[top + bot - y][l + r - x] : false));
    } else {
      if (base === 'i') { for (let r = 0; r < top + 3; r++) rows[r] = rows[r].map(() => false); top = inkTop(); }
      const pat = MARKS[mark], pw = pat[0].length;
      const cols = rows.flatMap(row => row.map((v, q) => v ? q : -1)).filter(q => q >= 0);
      let x0 = Math.round((Math.min(...cols) + Math.max(...cols) + 1) / 2 - pw / 2);
      const padL = Math.max(0, -x0), padR = Math.max(0, x0 + pw - gw);
      if (padL || padR) { rows = rows.map(row => [...Array(padL).fill(false), ...row, ...Array(padR).fill(false)]); gw += padL + padR; off -= padL; x0 += padL; }
      const y0 = Math.max(0, top - 3);
      pat.forEach((line, i) => [...line].forEach((v, j) => { if (v === '#') rows[y0 + i][x0 + j] = true; }));
    }
    const out = g.createImageData(gw, gh), nx = k * cellW, ny = f.img.height + 2;
    rows.forEach((row, r) => row.forEach((v, q) => { if (v) out.data.set([255, 255, 255, 255], (r * gw + q) * 4); }));
    g.putImageData(out, nx, ny);
    G[ch] = [nx, ny, gw, gh, shift, off];
  });
  f.img = fresh(c, 'assets/fonts/fnt_comicsans.png#es');   // copia en GPU (src = clave para la caché de colores de drawText)
}

// ---------------------------------------------------------------- escritor de los globos (OBJ_WRITER + SCR_TEXTTYPE)
//   typer 107: fnt_comicsans negro, 10 px por letra, 20 por línea, 1 letra cada 2 frames, snd_txtsans (intro y final)
//   typer 109: igual pero 1 letra por frame (el resto de la pelea)
//   typer 108: fnt_plain negro, 9 x 20, 1 letra cada 4 frames, sin sonido ("Should be burning in hell.")
// Códigos: & salto, / fin de mensaje, % fin, ^N pausa, \EN cara, \MN torso (global.flag[20]), \R rojo, \X negro.
// fnt_comicsans lleva los ajustes por letra de obj_base_writer: w y m +2, i y l -2, s y j -1.
export const TYPERS = {
  107: { font: 'fnt_comicsans', ox: 5, hspace: 10, vspace: 20, speed: 2, sound: 'txtsans', kern: true },
  108: { font: 'fnt_plain', ox: 0, hspace: 9, vspace: 20, speed: 4, sound: null, kern: false },
  109: { font: 'fnt_comicsans', ox: 5, hspace: 10, vspace: 20, speed: 1, sound: 'txtsans', kern: true },
};
const KERN = { w: 2, m: 2, i: -2, l: -2, s: -1, j: -1, 'í': -2 };
const COLORS = { R: '#f00', X: '#000', W: '#fff', Y: '#ff0' };

export class SWriter {
  constructor(text, x, y, typer, { onFace, onTorso } = {}) {
    this.o = TYPERS[typer]; this.onFace = onFace; this.onTorso = onTorso;
    this.x = x + this.o.ox; this.y = y; this.cells = []; this.queue = [];
    let cx = 0, row = 0, color = '#000';
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '&') { cx = 0; row++; continue; }
      if (c === '/' || c === '%') break;
      if (c === '^') { this.queue.push({ pause: (+text[i + 1] || 0) * 10 }); i++; continue; }
      if (c === '\\') {
        const k = text[i + 1];
        if (k === 'E') { this.queue.push({ face: +text[i + 2] }); i += 2; }
        else if (k === 'M') { this.queue.push({ torso: +text[i + 2] }); i += 2; }
        else { if (COLORS[k]) color = COLORS[k]; i += 1; }
        continue;
      }
      this.queue.push({ ch: c, x: cx, row, color });
      cx += this.o.hspace + (this.o.kern ? KERN[c] || 0 : 0);
    }
    this.pos = 0; this.wait = 0; this.tick = 0; this.done = false;
    this.codes();
  }
  codes() {                                        // los códigos de cara/torso no gastan frames
    while (this.pos < this.queue.length && (this.queue[this.pos].face !== undefined || this.queue[this.pos].torso !== undefined)) {
      const a = this.queue[this.pos++];
      if (a.face !== undefined && this.onFace) this.onFace(a.face);
      if (a.torso !== undefined && this.onTorso) this.onTorso(a.torso);
    }
    if (this.pos >= this.queue.length) this.done = true;
  }
  update() {
    if (this.done) return;
    if (this.wait > 0) { this.wait--; return; }
    if (++this.tick < this.o.speed) return;
    this.tick = 0;
    const a = this.queue[this.pos++];
    if (a.pause) this.wait = a.pause;
    else { this.cells.push(a); if (a.ch !== ' ' && this.o.sound) playSound(this.o.sound, { volume: 0.5 }); }
    this.codes();
  }
  skip() {
    while (!this.done) {
      const a = this.queue[this.pos++];
      if (a.ch !== undefined) this.cells.push(a);
      if (this.pos >= this.queue.length) this.done = true; else this.codes();
    }
  }
  draw(ctx) {
    if (!FNT[this.o.font]) return;
    for (const c of this.cells) drawText(ctx, this.o.font, c.ch, this.x + c.x, this.y + c.row * this.o.vspace, { color: c.color });
  }
}

// ---------------------------------------------------------------- draw_sprite_part_ext (con color)
const tints = new Map();
function tinted(im, color) {
  const key = im.src + '|' + color; let c = tints.get(key);
  if (!c) {
    c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const t = c.getContext('2d'); t.drawImage(im, 0, 0);
    t.globalCompositeOperation = 'multiply'; t.fillStyle = color; t.fillRect(0, 0, c.width, c.height);
    t.globalCompositeOperation = 'destination-in'; t.drawImage(im, 0, 0);
    tints.set(key, c);
  }
  return c;
}
export function drawPart(ctx, name, frame, left, top, w, h, x, y, color = null) {
  const s = SPR[name]; if (!s || w <= 0 || h <= 0) return;
  let im = s.frames[Math.floor(frame) % s.frames.length];
  if (color) im = tinted(im, color);
  ctx.drawImage(im, left, top, w, h, Math.round(x), Math.round(y), w, h);
}

// ---------------------------------------------------------------- sonidos largos en bucle (pájaros del principio, "chokedup")
// Van por <audio> propios (no se decodifican enteros); se callan solos si el combate se cierra con ESC.
const AMB = {};
let watcher = null;
export function ambient(name, file, owner, vol = 1) {
  let a = AMB[name];
  if (!a) { a = AMB[name] = new Audio(file); a.loop = true; }
  a.owner = owner; a.vol = vol;
  a.volume = isMuted() ? 0 : Math.min(1, VOLUME.master * VOLUME.music * 2 * vol);
  a.currentTime = 0; a.play().catch(() => {});
  if (!watcher) watcher = setInterval(() => {
    let any = false;
    for (const x of Object.values(AMB)) {
      if (x.paused) continue;
      if (window.battle !== x.owner || (x.owner && x.owner.state === 'gameover')) x.pause();
      else { any = true; x.volume = isMuted() ? 0 : Math.min(1, VOLUME.master * VOLUME.music * 2 * x.vol); }
    }
    if (!any) { clearInterval(watcher); watcher = null; }
  }, 100);
}
export function stopAmbient(name) { if (AMB[name]) AMB[name].pause(); }
export function stopAllAmbient() { for (const a of Object.values(AMB)) a.pause(); }
