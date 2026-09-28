import { drawSprite, drawText, playSound, playMusic, stopMusic, setMusicVolume, registerMusic, registerSounds, SPR, FNT, VOLUME, RENDER } from './assets.js';
import { Battle, BORDER, BUTTONS, ITEMS, playerAt } from './battle.js';
import { texts, tr, sprL, playerName, isES } from './i18n.js';
import { rnd } from './gm.js';
import { GodBody, FinalBody } from './asriel_body.js';
import { hsv, Afterimage, HandLightning, FireHelixGen, AvoidFireGen } from './asriel_attacks.js';

// ============================================================================
//  Asriel Dreemurr (ruta pacifista). Música: "Hopes and Dreams" (music/xpart.ogg, a 0.95 de tono).
//  1) Forma "God of Hyperdeath" (obj_asrielb + obj_asriel_body): los primeros ~22 s son el "It's the end."
//     (obj_roundedge, specialnormal) y luego 14 ataques en orden hasta el HYPER GONER.
//     ACT: Check / Hope / Dream. En este combate no se puede morir: "But it refused." (obj_heartdefeated).
//  2) Forma final (obj_asrielfinal + obj_afinal_body): Struggle, el botón SAVE, las almas perdidas
//     (resumidas) y la despedida con el último rayo. Solo fondo negro (sin el arcoíris).
// ============================================================================
registerMusic({ asriel: 'mus_xpart.ogg', asriel_a2: 'mus_a2.ogg', asriel_save: 'mus_xpart_2.ogg' });
registerSounds({
  txtasr: 'snd_txtasr2.wav', healc: 'snd_heal_c.wav', spellcast: 'mus_sfx_spellcast.wav', star: 'mus_sfx_star.wav', create: 'mus_create.wav',
  lithit: 'mus_sfx_a_lithit.wav', lithit2: 'mus_sfx_a_lithit2.wav', abullet: 'mus_sfx_a_bullet.wav', atarget: 'mus_sfx_a_target.wav',
  rainbowbeam: 'mus_sfx_rainbowbeam_1.wav', segapower: 'mus_sfx_segapower.wav', segapower2: 'mus_sfx_segapower2.wav',
  pullback: 'mus_sfx_a_pullback.wav', cinematiccut: 'mus_sfx_cinematiccut.wav', sparkles: 'mus_sfx_sparkles.wav',
  swordappear: 'mus_sfx_a_swordappear.wav', jafe: 'mus_sfx_voice_jafe.wav',
  grab: 'mus_sfx_a_grab.ogg', beamhold: 'mus_sfx_rainbowbeam_hold.ogg', hglaugh: 'mus_sfx_hypergoner_laugh.ogg', hgcharge: 'mus_sfx_hypergoner_charge.ogg',
  xparta: 'assets/audio/mus_xpart_a.ogg', xpartb: 'assets/audio/mus_xpart_b.ogg',   // "His Theme" (obj_asrielpanels): va por WebAudio para encadenar a -> b
});

// Objetos: Face Steak (item 61) y el Last Dream (item 55) que llena el inventario con el ACT "Dream" (scr_itemuseb)
ITEMS.asriel_steak = { name: 'Face Steak', short: 'FaceSteak', heal: 60, use: '* You ate the Face Steak.' };
ITEMS.asriel_dream = { name: 'Last Dream', short: 'LastDream', heal: 17, use: '* The dream came true!' };

// Ataques sueltos: los de la primera forma tienen nombre en el juego; "It's the End" y los de la forma final son inventados.
export const ASRIEL_ATTACKS = [
  { name: "It's the End", kind: 'fire' },
  { name: 'Star Blazing', kind: 'star', h: 0 },
  { name: 'Shocker Breaker', kind: 'shock', h: 0 },
  { name: 'Chaos Saber', kind: 'saber', h: 0 },
  { name: 'Chaos Buster', kind: 'buster', h: 0 },
  { name: 'Shocker Breaker II', kind: 'shock', h: 1 },
  { name: 'Galacta Blazing', kind: 'star', h: 1 },
  { name: 'Chaos Slicer', kind: 'saber', h: 1 },
  { name: 'Chaos Blaster', kind: 'buster', h: 1 },
  { name: 'Hyper Goner', kind: 'goner' },
  { name: 'Rainbow Ultima', kind: 'ultima', u: 0, final: true },
  { name: 'Ultima Storm', kind: 'ultima', u: 2, final: true },
  { name: 'Ultima Rain', kind: 'ultima', u: 3, final: true },
  { name: 'Gentle Fire', kind: 'avoid', final: true },
  { name: 'Last Beam', kind: 'beam', final: true },
];

// Textos (textdata_en: obj_asrielb, obj_asrielfinal, obj_roundedge, obj_heartdefeated, obj_ripoff_*)
const T = texts('asriel', {
  intro: "* It's the end.",                                                        // scr_battlegroup_1762
  trueBattle: '* "The true final battle" was&  finally beginning.',                // obj_roundedge
  flavor: { star: '* Asriel readies "STAR BLAZING."', shock: '* Asriel charges "SHOCKER&  BREAKER."', saber: '* Asriel calls on "CHAOS SABER."',
            buster: '* Asriel readies "CHAOS BUSTER."', galacta: '* Asriel readies "GALACTA&  BLAZING."', slicer: '* Asriel calls on "CHAOS SLICER."',
            shock2: '* Asriel readies "SHOCKER&  BREAKER II."', blaster: '* Asriel readies "CHAOS&  BLASTER."', goner: '* Asriel readies "HYPER GONER."',
            glow: '* Asriel is glowing with a&  strange power.' },
  checkSpecial: '* ASRIEL DREEMURR ∞   ATK ∞   DEF&* Legendary being made of every&  SOUL in the underground./^',
  checkGod: '* ASRIEL DREEMURR ∞   ATK ∞   DEF&* The Absolute GOD of Hyperdeath!/^',
  hope1: "* You held on to your hopes..^1.&* You reduced how much DAMAGE&  you'll take this turn!/^",
  hope2: '* You kept holding on^1.&* DAMAGE reduced!/^',
  dream1: ["* You think about why you're&  here now.../", '* You can feel the empty&  space in your inventory&  get smaller and smaller!/^'],
  dream2: '* Your items fill up with&  dreams./^',
  dreamFirst: '* Through DETERMINATION^1, the&  dream became true.',                          // item_use_55
  talk: {                                                                                   // obj_asrielb Alarm_6
    1: ['\\E1You know.../', "\\M1I \\E0don't care about&destroying this&world anymore./%%"],
    2: ['\\E1After I defeat you&and gain total&control over the&timeline.../', '\\E2I just want to reset&everything./%%'],
    3: ["\\E3All your progress..^1.&Everyone's memories./", "\\E2I'll bring them all&back to zero!/%%"],
    4: ['\\E2Then we can do&everything ALL over&again./%%'],
    5: ['\\E3And you know what&the best part of&all this is?/', "\\E2You'll DO it./%%"],
    6: ["\\E1And then you'll&lose to me again./%%"],
    7: ['\\E3And again./%%'],
    8: ['\\E3And again!!!/%%'],
    9: ['\\E1Because you want a&"happy ending."/%%'],
    10: ['Because you "love&your friends."/%%'],
    11: ['Because you "never&give up."/%%'],
    12: ["\\M1I\\E1sn't that&delicious?/", '\\M0Your "determination.^1"&The power that let&you get this far.../', "\\E2It's gonna be your&downfall!/%%"],
    13: ['\\E2Now^1, ENOUGH messing&around!/', "It's time to purge&this timeline once&and for all!/%%"],
  },
  trans: ["\\E0... even after that&attack^1, you're still&standing in my way...?/", '\\M1W\\E0ow..^1.&You really ARE&something special./', "\\M0B\\E3ut don't get&cocky./",
          "\\E0Up until now^1, I've&only been using&a fraction of my&REAL power!/", "\\E2Let's see what good&your DETERMINATION&is against THIS!!/%%"],
  refused: '* But it refused^5.%%',                                                           // obj_heartdefeated_343
  // ---- forma final
  blocks: '* ASRIEL blocks the way!', awakened: "* ASRIEL's SOUL was awakened&  by the power of your&  friends!", goodbye: "* It's time to say goodbye.",
  ending: '* The whole world is ending.', dots: '* ...', bangs: '* !?!?',
  resonate: ['* You feel something faintly&  resonating within ASRIEL.', '* You feel something&  resonating within ASRIEL.',
             '* You feel something strongly&  resonating within ASRIEL.', "* You feel your friends' SOULs&  resonating within ASRIEL!"],
  cantMove: "* Can't move your body./^",
  saveMsgs: ["* Can't move your body^1.&* Nothing happened./", '* You struggle..^1.&* Nothing happened./', '* You tried to reach your&  SAVE file^1.&* Nothing happened./',
             '* You tried again to reach&  your SAVE file^1.&* Nothing happened./', '* Seems SAVING the game really&  is impossible./', '* .../', '* But.../',
             '* Maybe^1, with what little&  power you have.../', '* You can SAVE something else./%%'],
  reach: ["* You reached out to ASRIEL's&  SOUL and called out to your&  friends./", "* They're in there somewhere^1,&  aren't they?/", '* .../',
          "* Within the depths of ASRIEL's&  SOUL^1, something's resonating..!/%%"],
  called: ['* You called out to your&  friends with all your&  heart./', '* From somewhere^1, you felt&  their support.../^'],
  someone: ['* Strangely^1, as your friends&  remembered you.../', '* Something else began resonating&  within the SOUL^1, stronger&  and stronger./',
            "* It seems that there's still&  one last person that needs&  to be saved./", '* But who...?/', '* .../', '* Suddenly^1, you realize./', '* You reach out and call&  their name./%%'],
  huh: 'Huh^1? What are you&doing...!?/%%',
  struggleTalk: { 1: ['Urah ha ha...&Behold my TRUE power!/%%'],                                  // obj_asrielfinal Other_13 (tempvalue[12])
    2: ['I can feel it.../', 'Every time you die^1,&your grip on this&world slips away./', 'Every time you die^1,&your friends forget&you a little more./',
        'Your life will end&here^1, in a world&where no one&remembers you.../%%'],
    3: ["Still^1, you're&hanging on...?/", "That's fine./", "In a few moments^1,&you'll forget&everything^1, too./", 'That attitude will&serve you well in&your next life!/%%'],
    4: ['Ura ha ha.../', 'Still!?/', 'Come on.../', 'Show me what good&your DETERMINATION&is now!/%%'], 5: ['Ultimate bepis/%%'] },
  byeTalk: [
    ['\\E1Wh..^1.&what did you do...?/', "\\E3What's this&feeling...^1?&What's happening&to me?/", "\\E2No^1! NO^1!&I don't need&ANYONE!/%%"],
    ['\\E6STOP IT^1!&Get away from me!/', 'Do you hear me!?/', "\\E2I'll tear you&apart!/%%"],
    ['\\E3.../', '\\E3.../', "\\[C]..^1.&Do you know why&I'm doing this...?/", 'Why I keep fighting&to keep you&around...?/%%'],
    ["\\E4I'm doing this.../", "\\E6Because you're&special^1, \\[C]./", "You're the only one&that understands&me./", "You're the only one&who's any fun to&play with anymore./%%"],
    ['\\E4.../', 'No.../', "\\E1That's not JUST&it./", 'I..^1. I.../', "\\E4I'm doing this&because I care&about you^1, \\[C]!/", '\\E4I care about you&more than anybody&else!/%%'],
    ["\\E4I'm not ready for&this to end./", "I'm not ready for&you to leave./", "I'm not ready to&say goodbye to&someone like&you again.../%%"],
    ['\\E7So, please..^1.&STOP doing this.../', 'AND JUST LET ME&WIN!!!/%%'],
    ['\\E5.../', '\\[C].../%%'], ["\\E5I'm so alone^1,&\\[C].../%%"], ["\\E5I'm so afraid^1,&\\[C].../%%"], ['\\[C]^1, I.../%%'], ['I...'],
  ],
  stopIt: 'STOP IT!!', stopItNow: 'STOP IT NOW!!!',
  // ---- almas perdidas (resumidas): scr_battlegroup y obj_ripoff_*
  lost: {
    undyne: { appear: '* The Lost Soul appeared.', msgs: ['* You tapped the Lost Soul&  lightly./', "* Something about the way you&  fight..^1.&* It's all flooding back!/%%"],
              lines: [['Well^1, some humans&are OK^1, I guess!/%%']] },
    alphys: { appear: '* The Lost Soul appeared.', msgs: ["* You tell the Lost Soul that&  you'll continue to&  support her./", "* Suddenly^1, she remembers..^1.&* It's all flooding back!/%%"],
              lines: [["No^1, that's not true^1!&My friends like me^1!&And I like you^1,&too!/%%"]] },
    papyrus: { appear: '* The Lost Souls appeared.', msgs: ['* You told the Lost Soul a bad&  pun about skeletons./', "* Something about that bad&  joke..^1.&* It's all flooding back!/",
               '* Seeing how nicely you treated&  its brother^1, the other Lost&  Soul remembers^1, too!/%%'],
               lines: [["NO! WAIT!^1!&YOU'RE MY FRIEND^1!&I COULD NEVER&CAPTURE YOU!!/%%"], ["nah^1, i'm rootin for&ya^1, kid./%%"]] },
    toriel: { appear: '* The Lost Souls appeared.', msgs: ["* You tell the Lost Soul that&  you have to go if you're&  going to free everyone./", '* Suddenly^1, her memories are&  flooding back!/',
              '* Seeing her remember you^1, the&  male Lost Soul tried hard&  to remember you^1, too!/%%'],
              lines: [['Your fate is up to&you now!/%%'], ['You are our future!/%%']] },
  },
});
const LOST_NAMES = { undyne: ['Undyne'], alphys: ['Alphys'], papyrus: ['Papyrus', 'Sans'], toriel: ['Toriel', 'Asgore'] };

// ---------------------------------------------------------------- escritor (OBJ_WRITER) con los códigos que usa Asriel
//   \E cara, \M "encogerse de hombros" (flag 20), ∞ (el \z4 del juego) símbolo de infinito, \[C] nombre del humano caído, ^N pausa
const BOX = { font: 'fnt_main', color: '#fff', ox: 20, oy: 20, hspace: 16, vspace: 32, speed: 1, shake: 0, sound: 'txt' };
const TYPER = {
  86: { font: 'fnt_plain', color: '#000', ox: 0, oy: 0, hspace: 9, vspace: 20, speed: 1, shake: 0, sound: 'txtasr' },   // SCR_TEXTTYPE 86/87/88
  87: { font: 'fnt_plain', color: '#000', ox: 0, oy: 0, hspace: 9, vspace: 20, speed: 3, shake: 0, sound: 'txtasr' },
  88: { font: 'fnt_plain', color: '#000', ox: 0, oy: 0, hspace: 9, vspace: 20, speed: 3, shake: 2, sound: 'txtasr' },
  61: { font: 'fnt_main', color: '#fff', ox: 20, oy: 20, hspace: 16, vspace: 32, speed: 2, shake: 0, sound: null },     // "But it refused."
};
class AWriter {
  constructor(text, x, y, opts = {}) {
    this.o = { ...BOX, ...opts }; this.x = x + this.o.ox; this.y = y + this.o.oy;
    this.cells = []; this.queue = []; let col = 0, row = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '&') { col = 0; row++; continue; }
      if (c === '/' || c === '%') break;
      if (c === '^') { this.queue.push({ pause: (+text[i + 1] || 0) * 10 }); i++; continue; }
      if (c === '\\') {
        const d = text[i + 1];
        if (d === '[') { const j = text.indexOf(']', i); if (text.slice(i + 2, j) === 'C') for (const ch of playerName()) this.queue.push({ ch, col: col++, row }); i = j; continue; }
        if (d === 'E') this.queue.push({ face: +text[i + 2] });
        if (d === 'M') this.queue.push({ m: +text[i + 2] });
        i += 2; continue;
      }
      if (c === '∞') { this.queue.push({ ch: c, sym: true, col: col++, row }); continue; }   // el \z4 del juego: spr_infinitysign
      this.queue.push({ ch: c, col: col++, row });
    }
    this.pos = 0; this.wait = 0; this.tick = 0; this.done = this.queue.length === 0; this.onFace = opts.onFace; this.onM = opts.onM;
  }
  ev(a) { if (a.face !== undefined) { if (this.onFace) this.onFace(a.face); return true; } if (a.m !== undefined) { if (this.onM) this.onM(a.m); return true; } return false; }
  next() {
    const a = this.queue[this.pos++];
    if (a.pause) this.wait = a.pause;
    else if (!this.ev(a)) { this.cells.push(a); if (a.ch !== ' ' && this.o.sound) playSound(this.o.sound); }
    if (this.pos >= this.queue.length) this.done = true;
  }
  update() {
    if (this.done) return;
    if (this.wait > 0) { this.wait--; return; }
    if (++this.tick < this.o.speed) return;
    this.tick = 0; this.next();
    while (!this.done && (this.queue[this.pos].face !== undefined || this.queue[this.pos].m !== undefined)) this.next();
  }
  skip() { while (!this.done) { const a = this.queue[this.pos++]; if (!this.ev(a) && !a.pause) this.cells.push(a); if (this.pos >= this.queue.length) this.done = true; } }
  draw(ctx) {
    const { font, color, hspace, vspace, shake } = this.o;
    for (const c of this.cells) {
      const jx = shake ? Math.round((Math.random() - 0.5) * shake) : 0, jy = shake ? Math.round((Math.random() - 0.5) * shake) : 0;
      const x = this.x + c.col * hspace + jx, y = this.y + c.row * vspace + jy;
      if (c.sym) drawSprite(ctx, 'spr_infinitysign', 0, x, y + 10, { xs: 2, ys: 2 });
      else drawText(ctx, font, c.ch, x, y, { color });
    }
  }
}

const EXTRA_BORDER = { 17: [162, 472, 250, 385], 4: [267, 367, 295, 385], 6: [227, 407, 250, 385] };   // SCR_BORDERSETUP
const ATTACK_STATES = ['aTalk', 'aAttack', 'aTrans'];

// ============================================================================
export class AsrielBattle extends Battle {
  constructor(single = null) { super(single); }

  // Pacifista: NV 1 y 20 PV. Worn Dagger + Heart Locket: lo último que se encuentra en la casa de Asgore (New Home)
  // antes de los combates finales. En este combate sí se pueden usar objetos.
  playerSetup() { return playerAt(1, { name: 'Worn Dagger', atk: 15 }, { name: 'Heart Locket', def: 7 }); }
  itemSetup() { return ['hero', 'hero', 'hero', 'hero', 'asriel_steak', 'asriel_steak']; }

  reset() {
    super.reset();
    this.enemy = { hp: 9999, maxHp: 9999, atk: 8, def: 9999, x: 255, y: 50, wd: 100 };      // scr_monstersetup tipo 99
    this.deaths = 0; this.maxTurn = 0; this.time = 0; this.phase = -1;                   // phase: -1 = primera forma; 0..3 = global.flag[501]
    this.saved = { undyne: 0, alphys: 0, papyrus: 0, toriel: 0 }; this.tv12 = 0; this.dreamUsed = false;
    this.inv = 20; this.view = { x: 0, y: 0 }; this.fshake = null; this.whiter = null; this.fadeOut = 0; this.flash = 0; this.falpha = 0;
    if (this.single && this.single.final) this.newFinal(this.single.kind === 'ultima' && this.single.u === 0 ? 1 : 3);
    else this.newFight();
  }
  // Empieza (o vuelve a empezar tras morir) la primera forma (obj_asrielb Create)
  newFight() {
    this.phase = -1;
    this.turns = Math.max(0, this.maxTurn - 3);
    this.objs = []; this.face = 0; this.flag20 = 0; this.hope = 0; this.hoped = 0; this.dreamed = 0;
    this.body = new GodBody(this);
    this.ftimer = (this.deaths > 0 || this.single) ? 9999 : 0; this.falpha = 0;          // obj_roundedge
    this.enterCommon(); this.flavor = T.intro; this.monsteratk = 8;
  }
  enterCommon() {
    this.tb = null; this.ignoreBorder = false; this.heartAlpha = 1; this.heartDepth = 0; this.heartShown = false; this.lost = null;
    this.view = { x: 0, y: 0 }; this.fshake = null; this.turntimer = 0; this.onlyAct = false; this.buttonShake = 0; this.btnFall = null; this.hpGlitch = 0;
    this.setBorder(0); const [l, r, t, b] = BORDER[0]; this.box = { l, r, t, b };
    this.state = 'intro'; this.timer = 0; this.menu = 0; this.writer = null; this.attack = null; this.target = null; this.slice = null; this.dmgw = null; this.jobs = [];
    this.heart = { x: 312, y: 300 }; this.invc = 0; this.endcon = 0;
  }

  // ---------------------------------------------------------------- utilidades
  ideal() { return BORDER[this.border] || EXTRA_BORDER[this.border]; }
  add(o) { this.objs.push(o); return o; }
  sfxVol() { return VOLUME.sfx; }
  snd(name, vol = 1, pitch = 1, loop = false) {
    const s = playSound(name, { volume: VOLUME.sfx * vol, loop });
    if (s) { s.playbackRate.value = pitch; s.vol0 = vol; }
    return s;
  }
  stopSnd(s) { if (s && !RENDER.ghost) try { s.onended = null; s.stop(); } catch (e) {} }
  setSndVol() { /* playSound no expone su ganancia: el volumen de los bucles se queda fijo */ }
  shakeView(x, y) { this.fshake = { x, y, first: true }; }          // obj_vsflowey_shaker
  playHurt() { playSound('hurt'); }
  tbWriter(text, x, y, typer = 86) { return new AWriter(text, x, y, { ...TYPER[typer], onFace: n => { this.face = n; }, onM: n => { this.flag20 = n; } }); }
  // Globo de Asriel (obj_blconwdflowey + OBJ_NOMSCWRITER, typer 86): el texto va en (x + 25 + 10, y + 10)
  say(msgs, x, y, typer, onEnd, onNext) { this.tb = { msgs, i: 0, x, y, typer, onEnd, onNext }; this.tb.w = this.tbWriter(msgs[0], x + 35, y + 10, typer); }
  updateTb(inp) {
    const tb = this.tb; if (!tb) return;
    tb.w.update();
    if (tb.noInput) return;
    if (inp.cancel) tb.w.skip();
    else if (inp.confirm && tb.w.done) {
      if (++tb.i < tb.msgs.length) { tb.w = this.tbWriter(tb.msgs[tb.i], tb.x + 35, tb.y + 10, tb.typer); if (tb.onNext) tb.onNext(tb.i); }
      else { this.tb = null; if (tb.onEnd) tb.onEnd(); }
    }
  }
  box1(text) { this.writer = new AWriter(text, BORDER[0][0], BORDER[0][2]); }
  boxSeq(msgs, onEnd, state = 'aBox') { this.boxMsgs = { msgs, i: 0, onEnd }; this.box1(msgs[0]); this.go(state); }
  total() { return Object.values(this.saved).reduce((a, v) => a + v, 0); }

  // ---------------------------------------------------------------- daño (obj_asbulletparent Other_17 y blt_parent)
  damageStandard(dmg) {                              // scr_damagestandard(0,0,0,0,0)
    if (this.invc >= 1) return false;
    const p = this.player;
    for (const lim of [21, 30, 40, 50, 60, 70, 80, 90]) if (p.hp >= lim) dmg++;
    const amt = Math.max(1, Math.round(dmg - (p.df + p.armor.def) / 5));
    p.hp = Math.max(0, p.hp - amt); playSound('hurt'); this.shake = 2; this.invc = this.inv;
    return true;
  }
  asHit() {
    if (this.state === 'refused') return;
    const p = this.player;
    if (this.phase < 3) {
      const thishp = p.hp;
      if (this.damageStandard(this.hope === 1 ? 7 : 10)) {
        if (Math.abs(p.hp - thishp) < 3) p.hp = thishp - 3;                       // al menos 3 de daño
        if (this.hope === 1 && thishp > 1 && p.hp <= 1) p.hp = 1;                 // con Hope no bajas de 1 (si tenías más)
        if (p.hp <= 0) p.hp = 0;
      }
      if (this.hope === 2) p.hp = 1;                                              // HYPER GONER: siempre te deja a 1
    } else {                                                                      // despedida: nunca bajas de 1
      let dmg = 10; if (p.hp >= 14) dmg = 9; if (p.hp <= 14) dmg = 7; if (p.hp <= 9) dmg = 6; if (p.hp <= 5) dmg = 1;
      this.damageStandard(dmg); if (p.hp < 1) p.hp = 1;
    }
    if (p.hp <= 0) this.gameOver();
  }
  bltHit(dmg) {
    if (this.invc >= 1 || this.state === 'refused') return false;
    const p = this.player;
    p.hp = Math.max(0, p.hp - Math.max(1, Math.round(dmg - (p.df + p.armor.def) / 5)));
    playSound('hurt'); this.shake = 2; this.invc = this.inv;
    if (p.hp <= 0) this.gameOver();
    return true;
  }

  // ---------------------------------------------------------------- ganchos de la base (FIGHT, ITEM...)
  startIntro() {
    if (this.phase < 0) playMusic('asriel', 0.95);
    else this.finalMusic();
    if (this.single) this.startEnemyTurn(); else this.startMenu();
  }
  enemyTake(d) { return d; }                         // DEF 9999: el daño sale negativo y se ve "MISS"
  missPos() { return this.phase < 0 ? [this.body.x - 60 + 63 - 48, this.body.y - 24] : [270, 128]; }
  dmgPos() { return this.missPos(); }
  onEnemyHit() { playSound('damage'); }
  afterEnemyDamage() { this.enemy.hp = 9999; this.startEnemyTurn(); }
  itemText(key, msg) {
    if (key === 'asriel_dream' && !this.dreamUsed) { this.dreamUsed = true; return T.dreamFirst; }
    return msg;
  }
  startMenu() { super.startMenu(); if (this.onlyAct) this.menu = 1; }
  updateMenu(inp) {
    if (this.onlyAct) { this.menu = 1; if (inp.confirm) { playSound('select'); this.sub = 0; this.writer = null; this.go('actTarget'); } return; }   // global.mercy = 3
    super.updateMenu(inp);
  }
  gameOver() { if (this.state !== 'refused') this.startRefused(); }

  // ---------------------------------------------------------------- ACT
  actOptions() {                                     // posición en la rejilla (0-2 columna izq., 3-5 der.) -> texto
    if (this.phase < 0) return { 0: tr('Check'), 3: tr('Hope'), 1: tr('Dream') };            // SCR_TEXT 1099
    if (this.phase === 0) return { 0: tr('Struggle') };
    if (this.phase === 1) {
      const o = {}, s = this.saved;
      const put = (pos, key, name) => { o[pos] = s[key] ? { text: tr('(Saved)'), yellow: true } : tr(name); };
      put(0, 'undyne', 'Undyne'); put(3, 'alphys', 'Alphys'); put(1, 'papyrus', 'Papyrus'); put(4, 'papyrus', 'Sans'); put(2, 'toriel', 'Toriel'); put(5, 'toriel', 'Asgore');
      return o;
    }
    return { 0: this.phase === 2 ? tr('Someone else') : tr('Asriel Dreemurr') };
  }
  updateSub(inp) {
    if (this.state === 'actTarget' && inp.confirm) { playSound('select'); this.actPos = 0; this.go('actList'); return; }
    if (this.state === 'actList') {
      if (inp.cancel) { this.go('actTarget'); return; }
      const opts = this.actOptions(), col = this.actPos >= 3 ? 1 : 0, row = this.actPos % 3;
      const tryMove = p => { if (opts[p] !== undefined && p !== this.actPos) { this.actPos = p; playSound('squeak'); } };
      if (inp.right && col === 0) tryMove(3 + row); if (inp.left && col === 1) tryMove(row);
      if (inp.down && row < 2) tryMove(this.actPos + 1); if (inp.up && row > 0) tryMove(this.actPos - 1);
      if (inp.confirm) { playSound('select'); this.doAct(this.actPos); }
      return;
    }
    super.updateSub(inp);
  }
  doAct(pos) {
    const p = this.player;
    if (this.phase < 0) {                            // obj_asrielb Step (myfight 2)
      if (pos === 0) { this.box1(this.body.specialnormal ? T.checkSpecial : T.checkGod); this.go('actText'); return; }
      if (pos === 3) {                               // Hope: menos daño este turno
        this.hope = 1; this.box1(this.hoped > 0 ? T.hope2 : T.hope1); this.hoped++;
        if (p.hp < p.maxHp) { p.hp++; this.snd('healc'); }
        this.go('actText'); return;
      }
      if (pos === 1) {                               // Dream: el inventario se llena de Last Dream (scr_itemget(55) x8)
        while (this.inventory.length < 8) this.inventory.push('asriel_dream');
        const msgs = this.dreamed > 0 ? [T.dream2] : T.dream1;
        if (p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + 4); this.snd('healc'); }
        this.dreamed++;
        this.boxSeq(msgs, () => this.startEnemyTurn()); return;
      }
    }
    this.finalAct(pos);
  }

  // ---------------------------------------------------------------- turno de Asriel (primera forma)
  startEnemyTurn() {
    if (this.phase >= 0) return this.finalEnemyTurn();
    this.writer = null; this.go('aTalk'); this.heartShown = false;
    const B = this.body;
    if (B.aligncon === 4) B.align();                // (reinicio pendiente de la pose)
    if (B.specialnormal === 0) { playSound('spearappear'); B.s_s = 0; if (B.aligncon === 0) B.aligncon = 1; }   // obj_asrielb Step (mnfight 1)
    const saber = this.single ? this.single.kind === 'saber' : [2, 6, 10].includes(this.turns);
    if (saber && B.specialnormal === 0) B.s_s = 1;
    this.talkDelay = B.specialnormal ? 1 : 16;
  }
  centerHeart() { const [l, r, t, b] = this.ideal(); this.heart = { x: Math.round((l + r) / 2) - 8, y: Math.round((t + b) / 2) - 8 }; this.heartShown = true; }
  doTalk() {                                         // Alarm_6
    const B = this.body, s = this.single;
    const skip = s || B.specialnormal || this.turns === 0 || this.turns < this.maxTurn;
    let border = 17;
    if (B.specialnormal || (s && s.kind === 'fire')) border = 6;
    if (s ? s.kind === 'saber' : [2, 6, 10].includes(this.turns)) border = 4;
    this.setBorder(border); this.centerHeart();
    const msgs = skip ? null : T.talk[this.turns];
    if (!msgs) { this.later(1, () => this.beginAttack()); return; }
    this.say(msgs, B.x + 60, B.y, 86, () => this.beginAttack());
  }
  beginAttack() {                                    // Other_11 + mnfight 2
    if (this.state !== 'aTalk') return;
    const B = this.body, s = this.single;
    this.face = 0; if (this.turns !== 8) this.flag20 = 0;
    this.turntimer = 150; this.firingrate = 10;
    this.go('aAttack');
    if (s ? s.kind === 'fire' : B.specialnormal === 1) {        // "It's the end.": fuego en hélice (obj_1sidegen tipo 7)
      this.turntimer = 140; this.firingrate = 6; this.monsteratk = this.hope === 1 ? 6 : 8;
      this.add(new FireHelixGen(this)); this.flavor = T.intro; return;
    }
    const t = this.turns;
    let kind, h;
    if (s) { kind = s.kind; h = s.h || 0; }
    else {
      h = t >= 8 ? 1 : 0;
      kind = [0, 4, 9].includes(t) ? 'star' : [1, 3, 8, 12].includes(t) ? 'shock' : [2, 6, 10].includes(t) ? 'saber' : [5, 7, 11].includes(t) ? 'buster' : 'goner';
    }
    B.hMode = h;
    if (kind === 'star') { B.starcon = 1; B.type = 0; }
    if (kind === 'shock') { B.starcon = 1; B.type = 1; }
    if (kind === 'saber') { B.bladecon = 1; B.type = 1; }
    if (kind === 'buster') { B.guncon = 1; B.type = 1; }
    if (kind === 'goner') { B.gonercon = 1; B.type = 1; this.hope = 2; }
    if (!s) { this.turns++; this.maxTurn = Math.max(this.maxTurn, this.turns); }
    const n = s ? { star: h ? 9 : 0, shock: h ? 8 : 1, saber: h ? 10 : 2, buster: h ? 11 : 5, goner: 13 }[kind] + 1 : this.turns, F = T.flavor;
    this.flavor = [0, 4].includes(n) ? F.star : [1, 3].includes(n) ? F.shock : [2, 6].includes(n) ? F.saber : [5, 7].includes(n) ? F.buster
      : n === 9 ? F.galacta : n === 10 ? F.slicer : [8, 12].includes(n) ? F.shock2 : n === 11 ? F.blaster : n === 13 ? F.goner : F.glow;
  }
  endAttack() {                                      // mnfight 3
    if (this.state !== 'aAttack') return;
    this.hope = 0; this.turntimer = 0;
    for (const o of this.objs) if (!(o instanceof Afterimage || o instanceof HandLightning)) this.cleanup(o);
    this.objs = this.objs.filter(o => o instanceof Afterimage || o instanceof HandLightning);
    this.view = { x: 0, y: 0 }; this.heartShown = false; this.ignoreBorder = false; this.heartAlpha = 1; this.heartDepth = 0;
    if (this.phase >= 0) return this.finalAfterAttack();
    this.startMenu();
  }
  afterGoner() {                                     // gonercon 13 -> mnfight 5: se transforma
    this.hope = 0;
    if (this.single) { this.state = 'aAttack'; return this.endAttack(); }
    this.objs = this.objs.filter(o => o instanceof Afterimage);
    this.go('aTrans'); this.trcon = 0;
    const vols = [1, 0.75, 0.5, 0.25, 0];
    this.say(T.trans, this.body.x + 60, this.body.y, 86, () => {
      this.body.transform = 1;
      for (const p of [0.2, 0.3, 0.4, 0.5, 0.6, 0.65]) this.snd('spellcast', 0.24, p);
      this.shakeamt = 0; this.trcon = 2;
      this.later(67, () => { this.trcon = 3; this.view = { x: 0, y: 0 }; stopMusic(); this.later(150, () => { setMusicVolume(1); this.newFinal(0); }); });
      this.whiter = { a: 0, t: 0, sp: 0.015 };
    }, i => setMusicVolume(vols[i] ?? 0));
  }

  // ---------------------------------------------------------------- "But it refused." (obj_heartdefeated con flag 500)
  startRefused() {
    stopMusic(); this.stopPanels(); this.deaths++;
    this.go('refused'); this.tb = null; this.writer = null; this.target = null; this.jobs = []; this.fadeOut = 0; this.flash = 0; this.falpha = 0;
    this.stopLoops();
    const x = this.hx ?? this.heart.x, y = this.hy ?? this.heart.y;
    this.dead = { x, y, tx: x, ty: y, spr: 'spr_heart' }; this.whiter = null; this.view = { x: 0, y: 0 }; this.fshake = null;
  }
  cleanup(o) { if (o.destroy && !o.dead) try { o.destroy(); } catch (e) {} if (o.s2) this.stopSnd(o.s2); if (o.sfxT) this.stopSnd(o.sfxT); o.dead = true; }   // bucles de sonido
  stopLoops() { for (const o of this.objs) this.cleanup(o); this.objs = []; }
  updateRefused() {
    const d = this.dead, t = this.timer;
    if (t === 20) { playSound('break1'); d.spr = 'spr_heartbreak'; d.x -= 2; d.tx = d.x; }
    const ht = t - 20, first = this.deaths === 1;
    const [s0, s1, fix, msgT, white, end] = first ? [80, 120, 120, 150, 220, 254] : [20, 40, 40, null, 60, 94];
    if (ht > s0 && ht < s1) { d.x = d.tx + rnd(3) - rnd(3); d.y = d.ty + rnd(3) - rnd(3); }
    if (ht === fix) { d.x = d.tx + 2; d.y = d.ty; playSound('break1'); d.spr = 'spr_heart'; }
    if (ht === msgT) {                               // x = 320 - string_width(mensaje) / 2, y = 100
      const raw = T.refused, f = FNT.fnt_main; let w = 0;
      for (const ch of raw) { const g = f.glyphs[ch] || f.glyphs['?']; w += g ? g[4] : 16; }
      this.refusedW = new AWriter(raw, 320 - Math.round(w / 2), 100, TYPER[61]);
    }
    if (this.refusedW) this.refusedW.update();
    if (ht === white) this.whiter = { a: 0, t: 0, sp: 0.03 };
    if (ht === end) {                                // la batalla vuelve a empezar con el PV al máximo
      this.player.hp = this.player.maxHp; this.refusedW = null; this.whiter = null;
      if (this.phase < 0) this.newFight(); else this.newFinal(this.phase, true);
    }
  }

  // ---------------------------------------------------------------- forma final (obj_asrielfinal)
  newFinal(phase, restart = false) {
    if (this.total() === 4 && phase === 1) phase = 2;
    this.phase = phase; this.objs = []; this.face = phase === 3 ? 3 : 0; this.flag20 = 0; this.hope = 0;
    if (!restart) this.fturns = 0;
    this.body = new FinalBody(this); this.ftimer = 9999; this.falpha = 0; this.whiter = null; this.trcon = 0;
    this.enemy = { hp: 9999, maxHp: 9999, atk: 8, def: 9999, x: 320, y: 48, wd: 10 };
    this.enterCommon();
    this.flavor = phase === 2 ? T.awakened : phase === 3 ? T.goodbye : T.blocks;
    if (phase === 1 && this.total() > 0) this.flavor = T.resonate[this.total() - 1];
    if (phase === 0) this.onlyAct = true;            // global.mercy = 3: solo ACT
    if (this.single) this.fturns = { 0: 0, 2: 0, 3: 1 }[this.single.u] ?? (this.single.kind === 'avoid' ? 2 : 6);
  }
  finalMusic() {
    if (this.phase === 0) playMusic('asriel_a2', 0.95);
    else if (this.phase <= 2) playMusic('asriel_save', 0.95);
    else if (!this.panelsMusic) this.startPanelsMusic();
  }
  startPanelsMusic() {                               // obj_asrielpanels: xpart_a (una vez) y luego xpart_b en bucle, a 0.85
    stopMusic(); this.stopPanels();
    const a = this.snd('xparta', VOLUME.music / VOLUME.sfx, 0.85);
    this.panelsMusic = a;
    if (a) a.onended = () => { if (this.panelsMusic === a) this.panelsMusic = this.snd('xpartb', VOLUME.music / VOLUME.sfx, 0.85, true); };
  }
  stopPanels() { const m = this.panelsMusic; this.panelsMusic = null; this.stopSnd(m); }
  finalEnemyTurn() {                                 // mnfight 1: Other_13
    this.writer = null; this.go('aTalk'); this.heartShown = false; this.talkDelay = 1;
  }
  finalDoTalk() {
    const ph = this.phase, s = this.single;
    let msgs = null, typer = 86;
    if (!s && ph === 0) msgs = T.struggleTalk[Math.min(5, Math.max(1, this.tv12))];
    if (!s && ph === 3) {
      const t = this.fturns;
      msgs = T.byeTalk[Math.min(t, 11)];
      if (t === 6) { typer = 88; this.body.cry = 1; }
      if (t >= 7) { typer = 87; this.body.bodyfader += 0.2; }     // el cuerpo se desvanece
      if (t >= 11) this.endcon = 1;
    }
    this.setBorder((ph === 3 && this.fturns === 6) || (s && s.kind === 'beam') ? 4 : 17); this.centerHeart();
    if (!msgs) { this.later(1, () => this.finalAttack()); return; }
    this.say(msgs, 400, 50, typer, () => this.finalAttack());
    if (this.endcon === 1) {                         // "I..." y todo se vuelve blanco muy despacio (obj_screenwhiter ex 2)
      this.endcon = 3; this.tb.noInput = true;
      this.whiter = { a: 0, t: 0, sp: 0.0075, hold: true }; this.later(136, () => this.finalEnd());
    }
  }
  finalAttack() {                                    // mnfight 2
    if (this.state !== 'aTalk') return;
    const B = this.body, s = this.single, ph = this.phase;
    this.go('aAttack'); this.turntimer = 150; this.firingrate = 10;
    let noAttack = false;
    if (s) {
      if (s.kind === 'ultima') { B.uGen = s.u; B.ucon = 1; }
      if (s.kind === 'avoid') { this.turntimer = 120; this.firingrate = 2; this.add(new AvoidFireGen(this)); }
      if (s.kind === 'beam') {                       // práctica: botones y PV como antes del rayo
        B.bcon = 1; this.btnFall = null; this.buttonShake = 0; this.onlyAct = false; this.hpGlitch = 0; this.player.hp = this.player.maxHp;
      }
    } else if (ph < 3) B.ucon = 1;
    else {
      const t = this.fturns;
      if (t === 0) { B.uGen = 2; B.ucon = 1; }
      if (t === 1) { B.uGen = 3; B.ucon = 1; }
      if (t >= 2 && t <= 5) { this.turntimer = 120; this.firingrate = 2; this.add(new AvoidFireGen(this)); }
      if (t === 6) B.bcon = 1;
      if (t >= 7) noAttack = true;
      this.fturns++;
    }
    const total = this.total();
    this.flavor = T.ending;
    if (total > 0 && ph >= 1) this.flavor = T.resonate[total - 1];
    if (ph === 3 && this.fturns > 0) this.flavor = T.dots;
    if (noAttack && this.endcon !== 3) this.later(1, () => this.endAttack());
  }
  finalAfterAttack() { this.startMenu(); }
  beamSay(n) {                                       // "STOP IT!!" durante el último rayo
    if (n < 0) { this.tb = null; return; }
    this.say([n === 0 ? T.stopIt : T.stopItNow], 400, 50, 88, null); this.tb.noInput = true;
  }
  beamDone() { this.onlyAct = true; this.flavor = T.dots; this.endAttack(); }        // obj_lastbeam: mnfight = 3, "* ..."
  finalAct(pos) {
    const ph = this.phase;
    if (ph === 3) return this.startEnemyTurn();
    if (ph === 2) {                                  // "Someone else": salvar a Asriel
      this.boxSeq(T.someone, () => {
        this.go('fSaveA'); this.songFade = true; this.face = 2; this.savex = 0;
        this.say([T.huh], 400, 50, 86, null); this.tb.noInput = true;
      });
      return;
    }
    if (ph === 1) {
      const key = (pos >= 3 ? ['alphys', 'papyrus', 'toriel'] : ['undyne', 'papyrus', 'toriel'])[pos % 3];
      if (this.saved[key]) {                         // Other_11: tus amigos te apoyan
        this.boxSeq(T.called, () => this.startEnemyTurn());
        if (this.player.hp < this.player.maxHp) { this.player.hp = this.player.maxHp; this.snd('healc'); }
        return;
      }
      this.boxSeq(T.reach, () => { this.go('fGo'); this.whiter = { a: 0, t: 0, sp: 0.03, hold: true }; this.lostKey = key; });   // Other_10 + gocon
      return;
    }
    if (this.tv12 >= 4) {                            // Struggle: ya no puedes moverte... pero puedes SALVAR otra cosa
      this.body.darker = 1; this.songFade = true;
      this.boxSeq(T.saveMsgs, () => this.go('fBang'));
      return;
    }
    this.tv12++; this.box1(T.cantMove); this.go('actText');
  }
  // Alma perdida (resumida): el ACT que la hace recordar y lo que dice al volver en sí
  startLost(key) {
    const L = T.lost[key];
    this.objs = []; this.body = null; this.lost = { key, names: LOST_NAMES[key] };
    this.setBorder(0); this.writer = null; this.heartShown = false;
    this.boxSeq([L.appear + '/', ...L.msgs], () => {
      this.go('fLost'); let i = 0;
      if (this.player.hp < this.player.maxHp) { this.player.hp = this.player.maxHp; this.snd('healc'); }
      playSound('break2'); this.flash = 1;
      const next = () => {
        if (i >= L.lines.length) {                   // se salva y vuelve con Asriel
          this.saved[key] = 1;
          this.later(20, () => { this.go('fGo2'); this.whiter = { a: 0, t: 0, sp: 0.03, hold: true }; });
          return;
        }
        const [bx, by] = L.lines.length === 1 ? [360, 60] : [[250, 40], [390, 90]][i];   // globo junto al nombre de quien habla
        this.say(L.lines[i], bx, by, 86, () => { i++; next(); });
      };
      next();
    }, 'fLostBox');
  }
  finalEnd() { this.go('fEnd'); this.stopPanels(); stopMusic(); }   // endcon: room 331 (fin del combate)

  // ---------------------------------------------------------------- bucle
  update(inp) {
    this.time++;
    super.update(inp);
    const S = this.state;
    if (S === 'refused') { this.updateRefused(); this.updateWhiter(); return; }
    if (this.phase < 0 && this.ftimer < 9999) this.roundedge();
    if (this.body) this.body.update();
    if (this.phase < 0 && this.body) { this.enemy.x = this.body.x - 60; this.enemy.y = this.body.y; }
    if (ATTACK_STATES.includes(S) && this.heartShown) this.moveHeart(inp);
    for (const o of [...this.objs]) if (!o.dead) { o.update(this); if (this.state === 'refused') return; }
    for (const o of [...this.objs]) if (!o.dead && o.endStep) o.endStep(this);
    this.objs = this.objs.filter(o => !o.dead);
    if (this.turntimer > 0 && this.state === 'aAttack') this.turntimer--;
    if (this.fshake) {                               // obj_vsflowey_shaker
      const f = this.fshake;
      if (f.first) { this.view.x = f.x * (Math.random() < 0.5 ? 1 : -1); this.view.y = f.y * (Math.random() < 0.5 ? 1 : -1); f.first = false; }
      else { this.view.x = rnd(f.x) - rnd(f.x); this.view.y = rnd(f.y) - rnd(f.y); }
      f.x--; f.y--; if (f.x <= 0 && f.y <= 0) { this.fshake = null; this.view = { x: 0, y: 0 }; }
    }
    if (this.tb && !['aBox', 'actText', 'fLostBox'].includes(S)) this.updateTb(inp);
    if (S === 'aTalk' && this.timer === this.talkDelay) { if (this.phase >= 0) this.finalDoTalk(); else this.doTalk(); }
    if (S === 'aBox' || S === 'fLostBox') {
      const bm = this.boxMsgs;
      if (inp.cancel) this.writer.skip();
      else if (inp.confirm && this.writer.done) { if (++bm.i < bm.msgs.length) this.box1(bm.msgs[bm.i]); else { this.writer = null; bm.onEnd(); } }
    }
    if (S === 'aTrans' && this.trcon === 2) {        // trcon 2: la pantalla tiembla cada vez más
      if (this.shakeamt < 9) this.shakeamt += 0.25;
      this.view = { x: rnd(this.shakeamt) - rnd(this.shakeamt), y: rnd(this.shakeamt) - rnd(this.shakeamt) };
    }
    if (this.songFade) {                             // songcon 1: la música se apaga
      this.songVol = (this.songVol ?? 1) - 0.04; setMusicVolume(Math.max(0, this.songVol));
      if (this.songVol <= 0.04) { this.songFade = false; this.songVol = 1; stopMusic(); setMusicVolume(1); this.songDone = true; }
    }
    if (this.state === 'fBang' && this.songDone) {   // songcon 2 -> "!?!?": aparece el botón SAVE
      this.songDone = false; this.phase = 1; this.onlyAct = false; this.body.darker = 0;
      this.player.hp = this.player.maxHp; this.flash = 1; playSound('break2');
      playMusic('asriel_save', 0.95); this.flavor = T.bangs; this.startMenu();
    }
    if (this.state === 'fSaveA') {                   // "Huh? What are you doing...!?" y todo se vuelve blanco
      this.savex++;
      if (this.savex === 70) this.whiter = { a: 0, t: 0, sp: 0.015, hold: true };
      if (this.savex === 138) { this.tb = null; this.songDone = false; this.go('fPanels'); this.startPanelsMusic(); this.panel = { img: 0, a: 0, on: 1, mt: 0, wht: 0 }; }
    }
    if (this.state === 'fPanels') this.updatePanels();
    if (this.state === 'fGo' && this.whiter && this.whiter.a >= 1) { this.whiter = null; this.startLost(this.lostKey); }
    if (this.state === 'fGo2' && this.whiter && this.whiter.a >= 1) { this.whiter = null; this.newFinal(1); }
    if (this.state === 'fEnd' && this.whiter && this.whiter.a >= 1 && !this.fadeOut && !this.ending) { this.ending = true; this.later(60, () => { this.fadeOut = 0.001; }); }
    if (this.flash > 0) this.flash -= 0.1;
    this.updateWhiter();
    if (this.fadeOut > 0) { this.fadeOut += 0.02; if (this.fadeOut >= 1.3 && this.onExit) { const f = this.onExit; this.onExit = null; this.stopLoops(); this.stopPanels(); f(); } }
  }
  updateWhiter() {                                   // obj_screenwhiter: sube hasta 1.2 y vuelve a bajar
    const w = this.whiter; if (!w) return;
    if (w.t === 0) { w.a += w.sp; if (w.a >= 1.2) { w.a = 1; if (!w.hold) w.t = 1; } }
    else { w.a -= w.sp; if (w.a <= -0.03) this.whiter = null; }
  }
  roundedge() {                                      // obj_roundedge: a los ~22 s empieza "la verdadera batalla final"
    const f = ++this.ftimer;
    if (f > 630 && f < 671) this.falpha += 0.025;
    if (f >= 671 && f < 685) this.falpha -= 0.1;
    if (f === 671) {
      this.body.aligncon = 4; this.body.specialnormal = 0;
      if (this.state === 'aAttack') { this.flavor = T.trueBattle; this.turntimer = -2; }
    }
  }
  updatePanels() {                                   // obj_asrielpanels: los recuerdos de Asriel y luego blanco
    const P = this.panel;
    if (this.whiter && this.whiter.a > 0) { this.whiter.a -= 0.05; if (this.whiter.a <= 0) this.whiter = null; }
    if (P.on === 1 && P.a < 1) P.a += 0.06;
    if (P.on === 0) { if (P.img < 4) { if (P.a > 0) P.a -= 0.06; } else { P.on = 2; P.mt = 250; P.wht = 0; } }
    P.mt++;
    if (P.mt === 120) P.on = 0;
    if (P.mt === 138) P.img++;
    if (P.mt === 141) { P.on = 1; P.mt = 0; }
    if (P.on === 2) { P.wht += 0.02; if (P.wht > 1.18) { this.newFinal(3); this.panelOut = 1.18; } }
  }
  moveHeart(inp) {
    const h = this.heart, H = inp.held, sp = this.sp;
    if (H.up) h.y -= sp; if (H.down) h.y += sp; if (H.left) h.x -= sp; if (H.right) h.x += sp;
    if (this.ignoreBorder) { h.x = Math.min(Math.max(h.x, 0), 624); h.y = Math.min(Math.max(h.y, 0), 464); return; }
    const [l, r, t, b] = this.ideal();
    h.x = Math.min(Math.max(h.x, l + 4), r - 16); h.y = Math.min(Math.max(h.y, t + 4), b - 16);
  }

  // ---------------------------------------------------------------- dibujo
  draw(ctx) {
    const S = this.state;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 640, 480);
    if (S === 'refused') return this.drawRefused(ctx);
    if (S === 'fPanels') return this.drawPanels(ctx);
    ctx.save();
    const sx = this.shake > 0 ? Math.round((Math.random() * 2 - 1) * this.shake) : 0, sy = this.shake > 0 ? Math.round((Math.random() * 2 - 1) * this.shake) : 0;
    ctx.translate(Math.round(-this.view.x) + sx, Math.round(-this.view.y) + sy);
    if (!(S === 'aTrans' && this.trcon >= 3)) {
      this.drawBox(ctx);
      if (this.writer) this.writer.draw(ctx);
      this.drawSubmenu(ctx);
      if (this.target) this.target.draw(ctx);
      this.drawStats(ctx);
      this.drawButtons(ctx);
      const list = [...this.objs];
      if (this.body) list.push(this.body);
      if (ATTACK_STATES.includes(S) && this.heartShown) list.push({ depth: this.heartDepth, draw: c => this.drawSoul(c) });
      list.sort((a, b) => b.depth - a.depth);
      for (const o of list) o.draw(ctx);
      if (this.body && this.body.darkerX > 0) {      // darker: todo a negro menos el texto
        ctx.globalAlpha = Math.min(1, this.body.darkerX); ctx.fillStyle = '#000'; ctx.fillRect(-10, -10, 1000, 1000); ctx.globalAlpha = 1;
        if (this.writer) this.writer.draw(ctx);
      }
      if (!ATTACK_STATES.includes(S)) this.drawHeart(ctx);
      if (this.slice) this.slice.draw(ctx);
      if (this.dmgw) this.dmgw.draw(ctx);
      if (this.lost) this.drawLost(ctx);
      if (this.tb) { drawSprite(ctx, 'spr_blconwdshrt', 0, this.tb.x, this.tb.y); this.tb.w.draw(ctx); }
    }
    ctx.restore();
    const over = (a, c) => { if (a > 0) { ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = c; ctx.fillRect(0, 0, 640, 480); ctx.globalAlpha = 1; } };
    over(this.falpha, '#fff');
    if (this.panelOut > 0) { over(this.panelOut, '#fff'); this.panelOut -= 0.05; }
    over(this.flash, '#fff');
    if (this.whiter) over(this.whiter.a, '#fff');
    over(this.fadeOut, '#000');
  }
  drawSoul(ctx) { this.hx = this.heart.x; this.hy = this.heart.y; drawSprite(ctx, 'spr_heart', Math.floor(this.heartFrame), this.heart.x, this.heart.y, { alpha: this.heartAlpha }); }
  drawRefused(ctx) {
    const d = this.dead;
    drawSprite(ctx, d.spr, 0, d.x, d.y);
    if (this.refusedW) this.refusedW.draw(ctx);
    if (this.whiter) { ctx.globalAlpha = Math.max(0, Math.min(1, this.whiter.a)); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 640, 480); ctx.globalAlpha = 1; }
  }
  drawPanels(ctx) {
    const P = this.panel;
    if (P.on < 2 && P.img <= 4) drawSprite(ctx, 'spr_asrielpanels', P.img, 120, 56, { xs: 2, ys: 2, alpha: Math.max(0, Math.min(1, P.a)) });
    if (this.whiter) { ctx.globalAlpha = Math.max(0, Math.min(1, this.whiter.a)); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 640, 480); ctx.globalAlpha = 1; }
    if (P.on === 2) { ctx.globalAlpha = Math.min(1, P.wht); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 640, 480); ctx.globalAlpha = 1; }
  }
  drawLost(ctx) {                                    // almas perdidas (sin sus combates): sus nombres temblando sobre negro
    const n = this.lost.names;
    n.forEach((name, i) => {
      const x = (n.length === 1 ? 320 : 200 + i * 240) - name.length * 8;
      drawText(ctx, 'fnt_main', name, x + rnd(2) - rnd(2), 170 + rnd(2) - rnd(2), { color: '#c0c0c0' });
    });
  }
  drawSubmenu(ctx) {
    const x = BORDER[0][0] + 20, y = BORDER[0][2] + 20, line = (s, dx = 0, dy = 0, color) => drawText(ctx, 'fnt_main', s, x + dx, y + dy, { mono: 16, color });
    const S = this.state;
    if (S === 'fightTarget' || S === 'actTarget') {
      if (this.phase < 0 && this.body && this.body.specialnormal === 0) {   // el nombre en arcoíris que ondula (obj_asriel_body Draw)
        line('   *');
        const phrase = ' ' + tr('Asriel Dreemurr') + ' ', sn = this.body.siner;
        let tx = 110;
        [...phrase].forEach((ch, i) => { drawText(ctx, 'fnt_main', ch, tx + Math.sin((sn + i) / 5) * 8, 270 + Math.cos((sn + i) / 5) * 4, { color: hsv(sn * 8 + i * 8, 140, 255) }); tx += 16; });
      } else line('   * ' + (this.phase < 0 ? tr('Asriel Dreemurr') : tr('Asriel')));
      if (S === 'fightTarget') { ctx.fillStyle = '#0f0'; ctx.fillRect(x + 16 * 24, y + 5, 101, 17); }   // 9999 / 9999
    }
    if (S === 'actList') {
      for (const [pos, o] of Object.entries(this.actOptions())) {
        const p = +pos, yellow = typeof o !== 'string';
        line('   * ' + (yellow ? o.text : o), p >= 3 ? 256 : 0, (p % 3) * 32, yellow ? '#ff0' : '#fff');
      }
    }
    if (S === 'mercyList') line('   * ' + tr('Spare'));
    if (S === 'itemList') super.drawSubmenu(ctx);
  }
  drawHeart(ctx) {
    if (this.state === 'actList') {
      this.hx = 72 + (this.actPos >= 3 ? 256 : 0); this.hy = 278 + (this.actPos % 3) * 32;
      drawSprite(ctx, 'spr_heart', 0, this.hx, this.hy); return;
    }
    if (['aBox', 'fLostBox', 'fLost', 'fGo', 'fGo2', 'fBang', 'fSaveA', 'fEnd'].includes(this.state)) return;
    super.drawHeart(ctx);
  }
  drawButtons(ctx) {
    if (isES()) buildSaveEs();
    const S = this.state;
    const active = ['menu', 'intro', 'itemList', 'fightTarget', 'actTarget', 'actList', 'mercyList'].includes(S);
    if (this.buttonShake && !this.btnFall) this.btnFall = BUTTONS.map(() => ({ x: 0, y: 0, r: 0, vs: 0 }));
    BUTTONS.forEach(([spr, x], i) => {
      let o = { x: 0, y: 0, r: 0 };
      if (this.btnFall && i !== 1) {                 // obj_lastbeam: los botones tiemblan y se caen
        const f = this.btnFall[i];
        if (this.buttonShake === 1) { f.x = rnd(4) - rnd(4); f.y = rnd(4) - rnd(4); }
        if (this.buttonShake === 2) { f.vs += 0.5; f.y += f.vs; f.r += rnd(4) - rnd(4); }
        o = f;
        if (f.y > 100) return;
      }
      const sel = active && i === this.menu ? 1 : 0;
      if (i === 1 && this.phase >= 1) {              // el botón ACT se vuelve SAVE (obj_talkbt.spec: color arcoíris)
        this.specX = (this.specX || 0) + 1;
        drawSprite(ctx, sprL('spr_savebt'), sel, x, 432, { color: hsv(this.specX * 12, 160, 255) });
      } else drawSprite(ctx, sprL(spr), sel, x + o.x, 432 + o.y, { rot: o.r });
    });
  }
  drawStats(ctx) {                                   // scr_binfowrite: con decimales y el PV "roto" del último rayo
    const p = this.player, hp = p.hp;
    const w = drawText(ctx, 'fnt_curs', p.name, 30, 400);
    drawText(ctx, 'fnt_curs', `${tr('LV')} ${p.lv}`, 30 + w + 32, 400);
    drawSprite(ctx, sprL('spr_hpname'), 0, 244, 405);
    const bx = 275, barW = Math.round(p.maxHp * 1.2);
    ctx.fillStyle = '#f00'; ctx.fillRect(bx, 400, barW, 21);
    ctx.fillStyle = '#ff0'; ctx.fillRect(bx, 400, Math.round(hp * 1.2), 21);
    let hw = Number.isInteger(hp) ? String(hp) : '0' + hp.toFixed(2);
    if (this.hpGlitch) hw = ['00.001', '00.0001', '00.000001', '00.0000000001'][this.hpGlitch - 1] || hw;
    drawText(ctx, 'fnt_curs', `${hw} / ${p.maxHp}`, bx + barW + 14, 400);
  }
}

// El botón SAVE en español (SALVAR), como los otros botones de src/lang/sprites_es.js; se crea la primera vez que se dibuja
function buildSaveEs() {
  if (!SPR.spr_savebt || SPR.spr_savebt_es || !FNT.fnt_main) return;
  const f = FNT.fnt_main, word = 'SALVAR';
  const frames = SPR.spr_savebt.frames.map(im => {
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0);
    g.fillStyle = '#000'; g.fillRect(26, 5, 81, 32);
    const t = document.createElement('canvas'); t.width = 80; t.height = 27; const tg = t.getContext('2d'); tg.imageSmoothingEnabled = false;
    const LW = 12, GAP = 1, total = word.length * LW + (word.length - 1) * GAP;
    [...word].forEach((ch, i) => { const [gx, gy] = f.glyphs[ch]; tg.drawImage(f.img, gx, gy + 8, LW, 18, i * (LW + GAP), 0, LW, 27); });
    tg.globalCompositeOperation = 'source-in'; tg.fillStyle = '#fff'; tg.fillRect(0, 0, 80, 27);
    g.drawImage(t, 26 + Math.round((81 - total) / 2), 8);
    return c;
  });
  SPR.spr_savebt_es = { ...SPR.spr_savebt, frames };
}
