// Undyne Web — combate contra Undyne the Undying (640x480, 30 FPS como Undertale)
import { loadAssets, unlockAudio, toggleMute, stopMusic } from './assets.js';
import { BossMenu, BOSSES, LINKS } from './menu.js';
import { NapstablookBattle } from './napstablook.js';
import { MettatonBattle } from './mettaton.js';
import { MuffetBattle } from './muffet.js';
import { Battle } from './battle.js';

const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ---------- Entrada: Z confirmar, X cancelar, flechas ----------
const held = new Set(), pressed = new Set();
// Solo teclado: Z confirma, X cancela, flechas (el ratón no hace nada)
const MAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
              z: 'confirm', Z: 'confirm', x: 'cancel', X: 'cancel' };
const typed = [];            // letras escritas (solo las usa el ensayo de Mettaton EX)
addEventListener('keydown', e => {
  if (window.battle && window.battle.typing) {
    if (e.key === 'Backspace') { typed.push('\b'); e.preventDefault(); }
    else if (e.key.length === 1 && !/[zx]/i.test(e.key)) { typed.push(e.key); e.preventDefault(); return; }
  }
  if (e.key === 'm' || e.key === 'M') { toggleMute(); return; }
  const k = MAP[e.key]; if (!k) return;
  e.preventDefault(); unlockAudio();
  if (!held.has(k)) pressed.add(k);
  held.add(k);
});
addEventListener('keyup', e => { const k = MAP[e.key]; if (k) held.delete(k); });

function input() {
  // Flechas: "pressed" para menús y "held" para el escudo (obj_time.up/down/left/right)
  const inp = { confirm: pressed.has('confirm'), cancel: pressed.has('cancel'),
                left: pressed.has('left'), right: pressed.has('right'), up: pressed.has('up'), down: pressed.has('down'),
                held: { up: held.has('up'), down: held.has('down'), left: held.has('left'), right: held.has('right') } };
  inp.typed = typed.splice(0);
  pressed.clear();
  return inp;
}

// Escenas: primero el menú "LIST OF BOSSES"; al elegir, empieza el combate con su animación
let scene;
const CLASSES = { undyne: Battle, muffet: MuffetBattle, napstablook: NapstablookBattle, mettaton: MettatonBattle };
function toMenu(page = 0, boss = 0) {
  stopMusic(); window.battle = null;
  scene = new BossMenu(item => {
    const Cls = CLASSES[item.boss] || Battle;
    const bossIdx = BOSSES.findIndex(b => b.id === item.boss);
    scene = new Cls(item.mode === 'single' ? item.attack : null);     // pelea completa o un solo ataque
    scene.bossIdx = bossIdx;
    scene.onExit = () => toMenu(1, bossIdx);     // al terminar se vuelve a la lista de ese jefe
    window.battle = scene;
  }, page, boss);
}
toMenu();
addEventListener('keydown', e => { if (e.key === 'Escape' && window.battle) toMenu(1, window.battle.bossIdx || 0); });   // Esc: volver a la lista de ataques

// Enlaces de la pantalla "Bosses List" (undertale.com y GitHub): <a> invisibles sobre el lienzo.
// Es lo único que responde al ratón; el juego se sigue manejando solo con el teclado.
const linkEls = LINKS.map(L => {
  const a = document.createElement('a');
  a.href = L.href; a.target = '_blank'; a.rel = 'noopener'; a.title = L.title; a.setAttribute('aria-label', L.title);
  a.style.cssText = 'position:fixed;display:none;cursor:pointer;z-index:2';
  a.addEventListener('mouseenter', () => { if (scene instanceof BossMenu) scene.hover = L.id; });
  a.addEventListener('mouseleave', () => { if (scene instanceof BossMenu) scene.hover = null; });
  a.addEventListener('mousedown', e => e.stopPropagation());
  document.body.appendChild(a);
  return [a, L];
});
function placeLinks() {
  const show = scene instanceof BossMenu && scene.page === 0, r = cv.getBoundingClientRect(), k = r.width / 640;
  for (const [a, L] of linkEls) {
    a.style.display = show ? 'block' : 'none';
    if (show) Object.assign(a.style, { left: r.left + L.x * k + 'px', top: r.top + L.y * k + 'px', width: L.w * k + 'px', height: L.h * k + 'px' });
  }
}

const STEP = 1000 / 30;
let acc = 0, last = 0;
function loop(now) {
  acc += now - last; last = now;
  if (acc > 250) acc = STEP;
  let stepped = false;
  while (acc >= STEP) { scene.update(input()); acc -= STEP; stepped = true; }
  if (stepped) { scene.draw(ctx); placeLinks(); }
  requestAnimationFrame(loop);
}

loadAssets().then(() => { scene.draw(ctx); requestAnimationFrame(t => { last = t; loop(t); }); });
