// Sprites con texto en inglés rehechos en español (se generan al cargar, a partir de los del juego):
//   botones FIGHT / ACT / ITEM / MERCY -> LUCHAR / ACTUAR / OBJETO / PIEDAD
//   "HP" -> "PV", "MISS" -> "FALLO" y el cartel de Napstablook "not feeling up to it right now. sorry."
import { SPR, FNT, drawText } from '../assets.js';

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function register(name, frames, like) { SPR[name] = { ...SPR[like], frames, w: frames[0].width, h: frames[0].height }; }

export function buildSpanishSprites() {
  buttons();
  hpName();
  miss();
  napstaSad();
}

// Botones: se borra el texto y se escribe la palabra con las mayúsculas de fnt_main estiradas a la altura
// del original (cada "píxel" de 2x2 pasa a 2x3: 18 -> 27 px), en naranja (normal) o amarillo (elegido).
function buttons() {
  const words = { spr_fightbt: 'LUCHAR', spr_talkbt: 'ACTUAR', spr_itembt: 'OBJETO', spr_sparebt: 'PIEDAD' };
  const colors = ['rgb(255,127,39)', 'rgb(255,255,64)'];
  const f = FNT.fnt_main;
  for (const [name, word] of Object.entries(words)) {
    const frames = SPR[name].frames.map((im, fr) => {
      const c = canvas(im.width, im.height), g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(im, 0, 0);
      g.fillStyle = '#000'; g.fillRect(26, 5, 81, 32);
      const t = canvas(80, 27), tg = t.getContext('2d'); tg.imageSmoothingEnabled = false;
      const LW = 12, GAP = 1, total = word.length * LW + (word.length - 1) * GAP;
      [...word].forEach((ch, i) => {
        const [gx, gy] = f.glyphs[ch];
        tg.drawImage(f.img, gx, gy + 8, LW, 18, i * (LW + GAP), 0, LW, 27);
      });
      tg.globalCompositeOperation = 'source-in'; tg.fillStyle = colors[fr] || colors[0]; tg.fillRect(0, 0, 80, 27);
      g.drawImage(t, 26 + Math.round((81 - total) / 2), 8);
      return c;
    });
    register(name + '_es', frames, name);
  }
}

// "HP" -> "PV": la P del sprite se mueve a la izquierda y se dibuja una V con el mismo trazo
function hpName() {
  const im = SPR.spr_hpname.frames[0], c = canvas(im.width, im.height), g = c.getContext('2d');
  g.drawImage(im, 17, 0, 10, 20, 4, 0, 10, 20);          // la P (columnas 17-26) pasa a 4-13
  g.fillStyle = '#fff';
  const V = ['####..####', '####..####', '####..####', '####..####', '####..####', '.###..###.', '.###..###.', '..######..', '..######..', '...####...'];
  V.forEach((row, y) => [...row].forEach((v, x) => { if (v === '#') g.fillRect(17 + x, 5 + y, 1, 1); }));
  register('spr_hpname_es', [c], 'spr_hpname');
}

// "MISS" -> "FALLO" con la fuente de los números de daño (fnt_dmg), rellena de blanco y con borde negro como el original
function miss() {
  const f = FNT.fnt_dmg, word = 'FALLO', parts = [];
  for (const ch of word) {
    const [gx, gy, gw, gh] = f.glyphs[ch];
    const c = canvas(gw + 2, gh + 2), g = c.getContext('2d');
    g.drawImage(f.img, gx, gy, gw, gh, 1, 1, gw, gh);
    const d = g.getImageData(0, 0, c.width, c.height), W = c.width, H = c.height, px = d.data;
    const ink = i => px[i * 4 + 3] > 0, out = new Uint8Array(W * H), stack = [0];
    out[0] = 1;
    while (stack.length) {                              // lo transparente conectado con el borde es "fuera"
      const i = stack.pop(), x = i % W, y = (i / W) | 0;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx; if (!out[j] && !ink(j)) { out[j] = 1; stack.push(j); }
      }
    }
    const res = g.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      const x = i % W, y = (i / W) | 0;
      if (ink(i)) res.data.set([255, 255, 255, 255], i * 4);
      else if (!out[i]) res.data.set([0, 0, 0, 255], i * 4);                     // huecos de dentro: negro
      else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < W && ny < H && ink(ny * W + nx); }))
        res.data.set([0, 0, 0, 255], i * 4);                                      // borde negro
    }
    g.putImageData(res, 0, 0);
    parts.push(c);
  }
  const full = parts.reduce((w, p) => w + p.width, 0) + (parts.length - 1) * 2;
  const im = SPR.spr_dmgmiss_o.frames[0], c = canvas(im.width, im.height), g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const sx = Math.min(1, (im.width - 6) / full);
  let x = 3;
  for (const p of parts) { g.drawImage(p, Math.round(x), 3, Math.round(p.width * sx), p.height); x += (p.width + 2) * sx; }
  register('spr_dmgmiss_o_es', [c], 'spr_dmgmiss_o');
}

// Cartel del primer turno de Napstablook ("REALLY NOT / FEELIN UP / TO IT RIGHT / NOW. SORRY."):
// es una fuente monoespaciada en cursiva (casillas de 16x12), así que se recortan sus letras y se recolocan.
function napstaSad() {
  const im = SPR.spr_bulletNapstaSad.frames[0];
  const SRC = ['REALLY NOT', 'FEELIN UP', 'TO IT RIGHT', 'NOW. SORRY.'], X0 = 11, Y0 = [11, 27, 43, 59];
  const where = {};
  SRC.forEach((l, i) => [...l].forEach((ch, k) => { if (ch !== ' ' && !where[ch]) where[ch] = [i, k]; }));
  const lines = ['HOY', 'NO TENGO', 'GANAS.', 'LO SIENTO.'];      // solo letras que tiene el cartel original
  const c = canvas(im.width, im.height), g = c.getContext('2d');
  lines.forEach((l, i) => [...l].forEach((ch, k) => {
    const w = where[ch]; if (!w) return;
    g.drawImage(im, X0 + w[1] * 16, Y0[w[0]], 16, 12, X0 + k * 16, Y0[i], 16, 12);
  }));
  register('spr_bulletNapstaSad_es', [c], 'spr_bulletNapstaSad');
}
