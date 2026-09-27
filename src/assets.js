// Carga de sprites (PNG por frame + sprites.json), fuentes bitmap y sonidos extraídos del juego
export const SPR = {};   // nombre -> { frames: [Image], ox, oy, w, h, bbox }
export const FNT = {};   // nombre -> { img, glyphs }

const img = src => new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = src; });

// ---------- Audio (WebAudio para poder solapar efectos) ----------
let actx = null;
const SFX = {};          // nombre -> AudioBuffer
const rawAudio = {};     // nombre -> ArrayBuffer (se decodifica al primer gesto del usuario)
const SOUND_FILES = {
  bell: 'assets/sfx/snd_bell.wav', hurt: 'assets/sfx/snd_hurt1.wav', damage: 'assets/sfx/snd_damage.wav',
  laz: 'assets/sfx/snd_laz.wav', select: 'assets/sfx/snd_select.wav', squeak: 'assets/sfx/snd_squeak.wav',
  txt: 'assets/sfx/snd_txt2.wav', arrow: 'assets/sfx/snd_arrow.wav', impact: 'assets/sfx/snd_impact.wav',
  spearappear: 'assets/sfx/snd_spearappear.wav', spearrise: 'assets/sfx/snd_spearrise.wav',
  txtund: 'assets/sfx/snd_txtund_hyper.wav', vaporized: 'assets/sfx/snd_vaporized.wav', swallow: 'assets/sfx/snd_swallow.wav',
  power: 'assets/sfx/snd_power.wav', speedup: 'assets/sfx/snd_speedup.wav',
  txtmuffet: 'assets/sfx/snd_txt1.wav', hurtgirl: 'assets/sfx/snd_hurtgirl.wav',
  // Mettaton EX
  mtt1: 'assets/sfx/snd_mtt1.wav', mtt2: 'assets/sfx/snd_mtt2.wav', mtt3: 'assets/sfx/snd_mtt3.wav', mtt4: 'assets/sfx/snd_mtt4.wav',
  mtt5: 'assets/sfx/snd_mtt5.wav', mtt6: 'assets/sfx/snd_mtt6.wav', mtt7: 'assets/sfx/snd_mtt7.wav', mtt8: 'assets/sfx/snd_mtt8.wav',
  mtt9: 'assets/sfx/snd_mtt9.wav', heartshot: 'assets/sfx/snd_heartshot.wav', mtthit: 'assets/sfx/snd_mtt_hit.wav',
  prebomb: 'assets/sfx/snd_mtt_prebomb.wav', burst: 'assets/sfx/snd_mtt_burst.wav', bomb: 'assets/sfx/snd_bomb.wav',
  noise: 'assets/sfx/snd_noise.wav', block2: 'assets/sfx/snd_block2.wav', phone: 'assets/sfx/snd_phone.wav',
  yeah: 'assets/sfx/snd_yeah.wav', explosion: 'assets/sfx/mus_explosion.wav',   // "Battle Against a True Hero" (la misma que carga scr_battlegroup)
};

// Música de cada jefe (la que carga scr_battlegroup)
const MUSIC = { undyne: 'assets/audio/mus_x_undyne.ogg',   // "Battle Against a True Hero"
                spider: 'assets/audio/mus_spider.ogg',     // "Spider Dance"
                ghost: 'assets/audio/mus_ghostbattle.ogg',     // "Ghost Fight"
                mettaton: 'assets/audio/mus_mettaton_ex.ogg',  // "Death by Glamour"
                mettsad: 'assets/audio/mus_mettsad.ogg' };
const MUSIC_FILE = MUSIC.undyne;
let unlocking = null, musicWanted = false;
export function unlockAudio() {
  if (unlocking) { if (actx.state === 'suspended') actx.resume(); return unlocking; }
  actx = new (window.AudioContext || window.webkitAudioContext)();
  unlocking = Promise.all(Object.entries(rawAudio).map(async ([k, buf]) => {
    try { SFX[k] = await actx.decodeAudioData(buf.slice(0)); } catch (e) { console.warn('audio', k, e); }
  }));
  return unlocking;
}

// Volumen: cámbialo aquí (0 = silencio, 1 = máximo). M silencia / reactiva todo.
export const VOLUME = { master: 0.4, music: 0.8, sfx: 0.7 };
let master = null, muted = false;
export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : VOLUME.master;
  musicEl.volume = muted ? 0 : Math.min(1, VOLUME.master * VOLUME.music * 2);
}

// La música va por un <audio> (empieza al instante, sin esperar a decodificar 1.8 MB)
let music = null;
const musicEl = new Audio(MUSIC_FILE);
musicEl.loop = true; musicEl.preload = 'auto';
export function playSound(name, { loop = false, volume = VOLUME.sfx } = {}) {
  if (!actx || !SFX[name]) return null;
  if (!master) { master = actx.createGain(); master.gain.value = muted ? 0 : VOLUME.master; master.connect(actx.destination); }
  const src = actx.createBufferSource(); src.buffer = SFX[name]; src.loop = loop;
  const g = actx.createGain(); g.gain.value = volume;
  src.connect(g).connect(master); src.start();
  return src;
}
export function playMusic(name = 'undyne', rate = 1) {   // rate = tono de caster_loop (Mettaton EX suena a 0.97)
  musicWanted = true;
  const src = new URL(MUSIC[name], location.href).href;
  if (musicEl.src !== src) { musicEl.pause(); musicEl.src = src; }
  musicEl.preservesPitch = false; musicEl.defaultPlaybackRate = rate; musicEl.playbackRate = rate;
  musicEl.volume = muted ? 0 : Math.min(1, VOLUME.master * VOLUME.music * 2);
  if (musicEl.paused) musicEl.play().then(() => { music = true; }).catch(e => console.warn('música bloqueada:', e));
}
export function setMusicVolume(f) { musicEl.volume = muted ? 0 : Math.max(0, Math.min(1, VOLUME.master * VOLUME.music * 2 * f)); }
export function stopMusic() { musicWanted = false; music = null; musicEl.pause(); musicEl.currentTime = 0; }

export async function loadAssets() {
  const meta = await (await fetch('assets/sprites/sprites.json')).json();
  await Promise.all(Object.entries(meta).map(async ([name, m]) => {
    const frames = await Promise.all([...Array(m.frames)].map((_, i) => img(`assets/sprites/${name}_${i}.png`)));
    SPR[name] = { ...m, frames };
  }));
  for (const name of ['fnt_main', 'fnt_curs', 'fnt_small', 'fnt_dmg', 'fnt_plain', 'fnt_maintext']) {
    const [data, image] = await Promise.all([fetch(`assets/fonts/${name}.json`).then(r => r.json()), img(`assets/fonts/${name}.png`)]);
    FNT[name] = { img: image, ...data };
  }
  await Promise.all(Object.entries(SOUND_FILES).map(async ([k, url]) => {
    try { rawAudio[k] = await (await fetch(url)).arrayBuffer(); } catch (e) { console.warn('no se pudo cargar', url); }
  }));
}

// ---------- Dibujo estilo GameMaker ----------
const tintCache = new Map();
function tinted(image, color) {
  const key = image.src + '|' + color;
  let c = tintCache.get(key);
  if (!c) {
    c = document.createElement('canvas'); c.width = image.width; c.height = image.height;
    const t = c.getContext('2d');
    t.drawImage(image, 0, 0);
    t.globalCompositeOperation = 'multiply'; t.fillStyle = color; t.fillRect(0, 0, c.width, c.height);
    t.globalCompositeOperation = 'destination-in'; t.drawImage(image, 0, 0);
    tintCache.set(key, c);
  }
  return c;
}

// Equivale a draw_sprite_ext: (x,y) es la posición del origen del sprite; rot en grados (antihorario)
export function drawSprite(ctx, name, frame, x, y, { xs = 1, ys = 1, rot = 0, alpha = 1, color = null } = {}) {
  const s = SPR[name]; if (!s || alpha <= 0) return;
  const n = s.frames.length;
  let im = s.frames[((Math.floor(frame) % n) + n) % n];
  if (color) im = tinted(im, color);
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.translate(Math.round(x), Math.round(y));
  if (rot) ctx.rotate(-rot * Math.PI / 180);
  ctx.scale(xs, ys);
  ctx.drawImage(im, -s.ox, -s.oy);
  ctx.restore();
}

// Caja de colisión (bbox) de un sprite colocado en (x,y), como la calcula GameMaker
export function spriteBBox(name, x, y) {
  const s = SPR[name]; const [l, t, r, b] = s.bbox;
  return { x1: x - s.ox + l, y1: y - s.oy + t, x2: x - s.ox + r, y2: y - s.oy + b };
}

// Texto con fuente bitmap del juego. mono = separación fija (como OBJ_WRITER); devuelve el ancho
export function drawText(ctx, font, text, x, y, { color = '#fff', mono = 0 } = {}) {
  const f = FNT[font]; let cx = x;
  const src = color === '#fff' ? f.img : tinted(f.img, color);
  for (const ch of String(text)) {
    const g = f.glyphs[ch] || f.glyphs['?'];
    if (g) {
      const [gx, gy, gw, gh, shift, off] = g;
      if (gw && gh) ctx.drawImage(src, gx, gy, gw, gh, Math.round(cx + off), Math.round(y), gw, gh);
      cx += mono || shift;
    } else cx += mono;
  }
  return cx - x;
}
export function debugAudio() { return { ctx: actx && actx.state, decoded: Object.keys(SFX), musicPlaying: !musicEl.paused, musicWanted }; }
