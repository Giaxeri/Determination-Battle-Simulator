import { FNT, SPR, drawText, setVolume, isMuted, VOLUME } from './assets.js';
import { SETTINGS, saveSettings, resolution } from './settings.js';

// ============================================================================
//  Todo lo que va FUERA del área de combate (640x480): título, aviso de fan-game,
//  créditos, barra de volumen y "ESC". Se dibuja con las fuentes del juego y
//  escala con la resolución elegida en Options.
// ============================================================================
const GUTTER = 130, TOP = 46, BOTTOM = 102;          // márgenes alrededor del combate (en píxeles del juego)

// Texto con fuente bitmap del juego en su propio <canvas> (nítido al escalar)
function textCanvas(lines, font, { color = '#fff', lh = 15, extra } = {}) {
  const f = FNT[font], widths = lines.map(l => [...l].reduce((w, c) => w + ((f.glyphs[c] || f.glyphs['?'])[4]), 0));
  const c = document.createElement('canvas');
  c.width = Math.max(1, ...widths) + 2; c.height = lh * lines.length;
  const g = c.getContext('2d');
  lines.forEach((l, i) => drawText(g, font, l, 0, i * lh, { color: typeof color === 'function' ? color(i) : color }));
  if (extra) extra(g);
  c.className = 'px';
  return c;
}
function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; (parent || document.body).appendChild(e); return e; }
function place(e, x, y, w, h) { Object.assign(e.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }); }

let parts = null, K = 1, drag = false;

export function buildUI() {
  const title = textCanvas(['DETERMINATION BATTLE SIMULATOR'], 'fnt_main', { lh: 30 });
  const tribute = el('a', 'ui'); tribute.href = 'https://undertale.com'; tribute.target = '_blank'; tribute.rel = 'noopener';
  tribute.title = 'Buy UNDERTALE at undertale.com';
  const grey = '#909090';
  const tribCanvas = textCanvas([
    'This is a non-profit, fan-made tribute to UNDERTALE.',
    'UNDERTALE    is owned by Toby Fox.',
    'Please support the official release:',
    '     Buy UNDERTALE at undertale.com',
  ], 'fnt_maintext', { color: i => i === 3 ? '#fff' : grey, extra: g => {
    const f = FNT.fnt_maintext, w = [...'UNDERTALE'].reduce((s, c) => s + f.glyphs[c][4], 0);
    registered(g, w + 2, 16, grey);                              // ® dibujado a mano (la fuente no lo trae)
    const w2 = [...'     Buy UNDERTALE at '].reduce((s, c) => s + f.glyphs[c][4], 0);
    drawText(g, 'fnt_maintext', 'undertale.com', w2, 45, { color: '#ff0' });
    const heart = SPR.spr_heart.frames[0]; g.drawImage(heart, 0, 46, 12, 12);
  } });
  tribute.appendChild(tribCanvas);

  const credits = el('a', 'ui credits'); credits.href = 'https://github.com/Giaxeri'; credits.target = '_blank'; credits.rel = 'noopener';
  credits.title = 'Gianfry (Giaxeri) on GitHub';
  const frame = el('div', 'avatar', credits);
  const img = el('img', '', frame); img.src = 'https://avatars.githubusercontent.com/u/149126315?s=100&v=4'; img.alt = 'Giaxeri';
  const credText = textCanvas(['Made by:', 'Gianfry (Giaxeri)', 'on Github!', 'github.com/Giaxeri'], 'fnt_maintext',
    { color: i => i === 1 ? '#fff' : i === 3 ? '#ff0' : grey });
  credits.appendChild(credText);

  const esc = textCanvas(['Press ESC to return to the menu'], 'fnt_maintext', { color: '#808080' });
  document.body.appendChild(esc); esc.classList.add('ui');

  // Barra de volumen vertical (arrastrable) con el alma como tirador y el número debajo
  const vol = el('div', 'ui vol');
  const volLabel = textCanvas(['VOLUME'], 'fnt_maintext'); vol.appendChild(volLabel);
  const track = el('div', 'track', vol), fill = el('div', 'fill', track);
  const knob = el('img', 'knob', track); knob.src = SPR.spr_heart.frames[0].src; knob.draggable = false;
  const num = el('canvas', 'px num', vol);
  const setFromY = y => {
    const r = track.getBoundingClientRect(), v = 1 - (y - r.top) / r.height;
    setVolume(Math.round(Math.max(0, Math.min(1, v)) * 100) / 100); SETTINGS.volume = VOLUME.master; saveSettings(); refreshVolume();
  };
  track.addEventListener('pointerdown', e => { drag = true; track.setPointerCapture(e.pointerId); setFromY(e.clientY); e.preventDefault(); });
  track.addEventListener('pointermove', e => { if (drag) setFromY(e.clientY); });
  track.addEventListener('pointerup', () => { drag = false; });
  track.addEventListener('pointercancel', () => { drag = false; });
  parts = { title, tribute, tribCanvas, credits, frame, credText, esc, vol, volLabel, track, fill, knob, num };
  document.body.appendChild(title); title.classList.add('ui');
  setVolume(SETTINGS.volume);
  refreshVolume();
  addEventListener('resize', layout);
  layout();
}

function registered(g, x, y, color) {
  g.save(); g.strokeStyle = color; g.lineWidth = 1; g.beginPath(); g.arc(x + 3.5, y + 3.5, 3.2, 0, Math.PI * 2); g.stroke();
  g.fillStyle = color; g.fillRect(x + 2, y + 2, 1, 4); g.fillRect(x + 3, y + 2, 2, 1); g.fillRect(x + 4, y + 3, 1, 1); g.fillRect(x + 3, y + 4, 1, 1); g.fillRect(x + 4, y + 5, 1, 1);
  g.restore();
}

export function refreshVolume() {
  if (!parts) return;
  const v = Math.round(VOLUME.master * 100), muted = isMuted();
  parts.fill.style.height = v + '%';
  parts.knob.style.bottom = `calc(${v}% - ${8 * K * 1.5}px)`;
  const c = parts.num, s = muted ? 'MUTE' : String(v), f = FNT.fnt_main;
  c.width = [...s].reduce((w, ch) => w + f.glyphs[ch][4], 0) + 2; c.height = 30;
  const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
  drawText(g, 'fnt_main', s, 0, 0, { color: muted ? '#f00' : '#ff0' });
  sizeCanvas(c, K * 0.8);
}
function sizeCanvas(c, s) { c.style.width = c.width * s + 'px'; c.style.height = c.height * s + 'px'; }

// Coloca el combate y todo lo de alrededor según el tamaño de la ventana y la resolución elegida
export function layout() {
  const cv = document.getElementById('game');
  const full = Math.min(innerWidth / (640 + GUTTER * 2), innerHeight / (480 + TOP + BOTTOM));
  K = full * resolution().scale;
  const W = 640 * K, H = 480 * K, totalH = (480 + TOP + BOTTOM) * K;
  const x0 = (innerWidth - W) / 2, y0 = Math.max(0, (innerHeight - totalH) / 2) + TOP * K;
  place(cv, x0, y0, W, H);
  if (!parts) return;
  const p = parts;
  sizeCanvas(p.title, K * 1.1); p.title.style.left = (innerWidth - p.title.width * K * 1.1) / 2 + 'px'; p.title.style.top = y0 - 38 * K + 'px';
  sizeCanvas(p.tribCanvas, K * 1.15); p.tribute.style.left = x0 + 'px'; p.tribute.style.top = y0 + H + 14 * K + 'px';
  const av = 58 * K; place(p.frame, 0, 0, av, av); p.frame.style.borderWidth = Math.max(1, 3 * K) + 'px';
  sizeCanvas(p.credText, K * 1.15);
  p.credText.style.left = av + 12 * K + 'px'; p.credText.style.top = 0;
  p.credits.style.width = av + 12 * K + p.credText.width * K * 1.15 + 'px'; p.credits.style.height = av + 'px';
  p.credits.style.left = x0 + W - (av + 12 * K + p.credText.width * K * 1.15) + 'px'; p.credits.style.top = y0 + H + 14 * K + 'px';
  sizeCanvas(p.esc, K); p.esc.style.left = (innerWidth - p.esc.width * K) / 2 + 'px'; p.esc.style.top = y0 + H + 86 * K + 'px';
  // volumen: a la derecha del combate, a media altura
  sizeCanvas(p.volLabel, K * 1.1);
  const tw = 22 * K, th = 200 * K;
  Object.assign(p.track.style, { width: tw + 'px', height: th + 'px', borderWidth: Math.max(1, 3 * K) + 'px' });
  Object.assign(p.knob.style, { width: 16 * K * 1.5 + 'px', height: 16 * K * 1.5 + 'px' });
  p.vol.style.left = x0 + W + (GUTTER * K - Math.max(tw, p.volLabel.width * K * 1.1)) / 2 + 'px';
  p.vol.style.top = y0 + (H - th) / 2 - 24 * K + 'px';
  p.vol.style.gap = 8 * K + 'px';
  refreshVolume();
  updateUI();
}

// Qué se ve en cada momento (el "ESC" solo en combate)
export function updateUI() { if (parts) parts.esc.style.display = window.battle ? 'block' : 'none'; }
