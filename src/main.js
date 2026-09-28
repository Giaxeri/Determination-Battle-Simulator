// Determination Battle Simulator — combates de jefes de UNDERTALE (640x480, 30 FPS como el juego)
import { loadAssets, unlockAudio, toggleMute, stopMusic } from './assets.js';
import { BossMenu, BOSSES } from './menu.js';
import { NapstablookBattle } from './napstablook.js';
import { MettatonBattle } from './mettaton.js';
import { MuffetBattle } from './muffet.js';
import { Battle } from './battle.js';
import { TorielBattle } from './toriel.js';
import { PapyrusBattle } from './papyrus.js';
import { AsgoreBattle } from './asgore.js';
import { AsrielBattle } from './asriel.js';
import { SansBattle } from './sans.js';
import { buildUI, layout, updateUI, refreshVolume } from './ui.js';
import { buildSpanishSprites } from './lang/sprites_es.js';

const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
layout();

// ---------- Entrada: Z confirmar, X cancelar, flechas (el juego no usa el ratón) ----------
const held = new Set(), pressed = new Set();
const MAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
              z: 'confirm', Z: 'confirm', x: 'cancel', X: 'cancel' };
const typed = [];            // letras escritas (solo las usa el ensayo de Mettaton EX)
addEventListener('keydown', e => {
  if (window.battle && window.battle.typing) {
    if (e.key === 'Backspace') { typed.push('\b'); e.preventDefault(); }
    else if (e.key.length === 1 && !/[zx]/i.test(e.key)) { typed.push(e.key); e.preventDefault(); return; }
  }
  if (e.key === 'm' || e.key === 'M') { toggleMute(); refreshVolume(); return; }
  const k = MAP[e.key]; if (!k) return;
  e.preventDefault(); unlockAudio();
  if (!held.has(k)) pressed.add(k);
  held.add(k);
});
addEventListener('keyup', e => { const k = MAP[e.key]; if (k) held.delete(k); });
addEventListener('blur', () => held.clear());

function input() {
  const inp = { confirm: pressed.has('confirm'), cancel: pressed.has('cancel'),
                left: pressed.has('left'), right: pressed.has('right'), up: pressed.has('up'), down: pressed.has('down'),
                held: { up: held.has('up'), down: held.has('down'), left: held.has('left'), right: held.has('right') } };
  inp.typed = typed.splice(0);
  pressed.clear();
  return inp;
}

// ---------- Escenas: menú principal -> lista del jefe -> combate ----------
let scene;
const CLASSES = { undyne: Battle, muffet: MuffetBattle, napstablook: NapstablookBattle, mettaton: MettatonBattle,
                  toriel: TorielBattle, papyrus: PapyrusBattle, asgore: AsgoreBattle, asriel: AsrielBattle, sans: SansBattle };
function toMenu(page = 0, boss = 0) {
  stopMusic(); window.battle = null;
  scene = new BossMenu(item => {
    const Cls = CLASSES[item.boss] || Battle;
    const bossIdx = BOSSES.findIndex(b => b.id === item.boss);
    scene = new Cls(item.mode === 'single' ? item.attack : null);     // pelea completa o un solo ataque
    scene.bossIdx = bossIdx;
    scene.onExit = () => toMenu(1, bossIdx);     // al terminar (o al morir) se vuelve a la lista de ese jefe
    window.battle = scene;
    updateUI();
  }, page, boss);
  updateUI();
}
toMenu();
addEventListener('keydown', e => { if (e.key === 'Escape' && window.battle) toMenu(1, window.battle.bossIdx || 0); });   // Esc: volver a la lista de ataques

const STEP = 1000 / 30;
let acc = 0, last = 0;
function loop(now) {
  acc += now - last; last = now;
  if (acc > 250) acc = STEP;
  let stepped = false;
  while (acc >= STEP) { scene.update(input()); acc -= STEP; stepped = true; }
  if (stepped) scene.draw(ctx);
  requestAnimationFrame(loop);
}

loadAssets().then(() => { buildSpanishSprites(); buildUI(); scene.draw(ctx); requestAnimationFrame(t => { last = t; loop(t); }); });
