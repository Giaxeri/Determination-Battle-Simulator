import { drawSprite, drawText, playSound, playMusic, stopMusic, registerMusic, registerSounds, spriteBBox, SPR } from './assets.js';
import { Battle, BORDER, BUTTONS, ITEMS, playerAt, Slice, DmgWriter, Vapor } from './battle.js';
import { Writer } from './text.js';
import { texts, tr, sprL, isES } from './i18n.js';
import { rnd, choose, gmMove, rotBBox, hit, ldx, ldy } from './gm.js';
import { AsgoreAttack } from './asgore_attacks.js';
import { AsgBody, AsgSpear, buildAsgoreES } from './asgore_body.js';

// ============================================================================
//  Asgore (obj_asgoreb), el combate final de las rutas neutral y pacifista. Música: "ASGORE" (music/vsasgore.ogg).
//  Intro (obj_asgore_finalintro): textos, "Goodbye.", blande el tridente, todo se vuelve blanco y el
//  tridente cae sobre el botón MERCY y lo rompe (global.mercy = 2: ya no se puede elegir).
//  Turnos fijos 1..23 (obj_asgoreb Step, mnfight == 2) con fuegos, manos y el barrido del tridente
//  (los ojos avisan: azul = no te muevas, naranja = muévete). ACT: Check / Talk (a la 3.ª baja su ATQ y DEF).
//  Con 500 PV o menos se arrodilla (obj_asgore_lastcutscene): habla y te deja elegir LUCHAR o PIEDAD.
// ============================================================================
registerMusic({ asgore: 'mus_vsasgore.ogg', asgchoke: 'mus_chokedup.ogg', asgbergen: 'mus_bergentruckung.ogg', asgmusicbox: 'mus_musicbox.ogg' });
registerSounds({ txtasg: 'snd_txtasg.wav', asg_credit: 'snd_credit_s.wav', asg_cut: 'mus_sfx_cinematiccut.wav',
                 asg_swipe: 'mus_sfx_swipe.wav', asg_flash: 'mus_sfx_eyeflash.wav', spearappear: 'snd_spearappear.wav', impact: 'snd_impact.wav' });

// Face Steak (item_name_61 / item_names_61 / item_use_61; scr_itemuseb: cura 60)
ITEMS.asgore_steak = { name: 'Face Steak', short: 'Steak', heal: 60, use: '* You ate the Face Steak.' };

// Ataques sueltos (el juego no les pone nombre: son inventados). tt = global.turntimer de ese turno.
const A = (name, gen, tt, extra = {}) => ({ name, gen, tt, ...extra });
const HANDS = A('Hands of Fire', 'hands', 110), HELIX1 = A('Helix Rain', 'helix', 160, { t: 1 }), SINE2 = A('Wavy Flames', 'sine', 180, { lv: 2 }),
      SW0 = A('Trident Swipe', 'swipe', 9999, { diff: 0 }), RH40 = A('Wandering Hands', 'rhand', 175, { factor: 40 }), CF0 = A('Ring of Fire', 'cfire', 190, { diff: 0 }),
      ST1 = A('Firestorm', 'storm', 160, { lv: 1 }), SW1 = A('Double Swipe', 'swipe', 9999, { diff: 1 }), HELIX2 = A('Helix Downpour', 'helix', 145, { t: 2 }),
      RH35 = A('Wandering Hands', 'rhand', 190, { factor: 35 }), CF1 = A('Spinning Rings', 'cfire', 180, { diff: 1 }), ST2 = A('Firestorm II', 'storm', 140, { lv: 2 }),
      SINE3 = A('Wild Flames', 'sine', 190, { lv: 3 }), CF2 = A('Whirling Rings', 'cfire', 175, { diff: 2 }), SW2 = A('Quick Swipe', 'swipe', 9999, { diff: 2 }),
      RH30 = A('Hand Barrage', 'rhand', 173, { factor: 30 }), CF3 = A('Ring Frenzy', 'cfire', 188, { diff: 3 }), ST3 = A('Blazing Storm', 'storm', 130, { lv: 3 }),
      SW3 = A('Triple Swipe', 'swipe', 9999, { diff: 3 });
// Orden de la pelea (obj_asgoreb Step): turnos 1..20; 21 y 22 al azar entre 5; el 23 es el barrido difícil y vuelve al 20
const TURNS = [null, HANDS, HELIX1, SINE2, SW0, RH40, CF0, ST1, SW1, HELIX2, RH35, CF1, SW1, ST2, SINE3, CF2, SW2, RH30, CF3, ST3, SW3];
const RANDOM = [CF3, ST3, RH30, SINE3, HELIX2];
export const ASGORE_ATTACKS = [HANDS, HELIX1, SINE2, SW0, RH40, CF0, ST1, SW1, HELIX2, CF1, ST2, SINE3, CF2, SW2, RH30, CF3, ST3, SW3];

// Textos (textdata_en: obj_asgore_finalintro, obj_asgoreb, obj_asgore_lastcutscene)
const T = texts('asgore', {
  name: 'Asgore',
  intro: ['* (A strange light fills the&  room.^5)   %', '* (Twilight is shining through&  the barrier.^3)   %',
          '* (It seems your journey is&  finally over.^4)%', "     * (You're filled with&          DETERMINATION.^5) %%"],
  goodbye: ['Human.../', '\\E1It was&nice to&meet&you./', '\\E0Goodbye./%%'],
  attacks: '* ASGORE attacks!',
  flavor: '* ...',
  lowhp: '* Asgore has low HP.',
  check: '* ASGORE 80 ATK 80 DEF /^',
  nothing: '* But there was nothing to&  say./^',
  talk0: ["* You quietly tell ASGORE&  you don't want to fight&  him./", '* His hands tremble for a&  moment./^'],
  talk1: ["* You tell ASGORE that you&  don't want to fight him./", '* His breathing gets funny&  for a moment./^'],
  talk2: ['* You firmly tell ASGORE to&  STOP fighting./', '* Recollection flashes in his&  eyes.../', "* ASGORE's ATTACK dropped^1!&* ASGORE's DEFENSE dropped!/^"],
  talkMore: "* Seems talking won't do any&  more good./^",
  talkFight: '* All you can do is FIGHT./^',
  killed: "* You tell ASGORE that he's&  killed you {n}./",
  times: ['once before', 'twice before', 'three times', 'four times', 'five times', 'six times', 'seven times', 'eight times', 'nine times', 'too many times&  to count'],
  nods: ['* He nods sadly./^', '* He nods grievously./^', '* He nods pitifully./^'],
  // De rodillas (obj_asgore_lastcutscene)
  kneel: ['Ah.../', '.../', 'So that&is how&it is./', '.../%%'],
  story: ['I remember the day&after my son&died./', 'The entire underground&was devoid of hope./',
          'The future had once&again been taken&from us by the&humans./', 'In a fit of anger,&I declared war./',
          'I said that I would&destroy any human&that came here./', 'I would use their&souls to become&godlike.../',
          '... and free us from&this terrible prison./', 'Then, I would destroy&humanity.../',
          'And let monsters rule&the surface, in peace./', "Soon, the people's&hopes returned./",
          'My wife, however,&became disgusted with&my actions./', 'She left this place,&never to be seen&again./%%'],
  plea: ['Truthfully.../', 'I do not want power./', 'I do not want to&hurt anyone./', 'I just wanted everyone&to have hope.../',
         'But.../', 'I cannot take this&any longer./', 'I just want to&see my wife./', 'I just want to&see my child./',
         'Please..^1.&Young one.../', 'This war has gone&on long enough./', 'You have the power.../',
         'Take my soul, and&leave this cursed&place./%%'],
  spared: ['.../', '\\E0After everything I&have done to&hurt you.../', '\\E7You would rather&stay down here&and suffer.../',
           '\\E9Than live happily&on the surface?/', '\\E6.../%%'],
  family: ['\\E1Human.../', '\\E7I promise you.../', '\\E7For as long as&you remain here.../',
           '\\E1My wife and I will&take care of you&as best we can./', '\\E2We can sit in&the living room^1,&telling stories.../',
           '\\E1Eating butterscotch&pie.../', '\\E2We could be&like.../', '\\E8Like a family.../%%'],
});

// Tipos de texto (SCR_TEXTTYPE): 61 = texto de la caja sin sonido y a velocidad 2;
// 62 / 63 = globos de Asgore (fnt_plain negro, 9x20, snd_txtasg, velocidad 3 / 2)
const TY61 = { speed: 2, sound: null };
const TY = speed => ({ font: 'fnt_plain', color: '#000', ox: 0, oy: 0, hspace: 9, vspace: 20, speed, shake: 0, sound: 'txtasg' });
const B29 = [207, 427, 250, 385], B30 = [207, 427, 200, 385];      // SCR_BORDERSETUP 29 / 30
const EX = 168, EY = 8;                                              // obj_asgoreb (208, 8) con x -= 40
const KX = 128, KY = 46;                                             // obj_asgore_lastcutscene (128, 46)

// Veces que Asgore te ha matado (undertale.ini [Asgore] KillYou): cambia el primer Talk
const killYou = () => { try { return +localStorage.getItem('dbs-asgore-ky') || 0; } catch (e) { return 0; } };

// Secuencia de mensajes de OBJ_WRITER: "/" espera a Z, "%" pasa solo al siguiente, "%%" termina
class Seq {
  constructor(msgs, x, y, opts, onFace) { this.msgs = msgs; this.i = 0; this.x = x; this.y = y; this.opts = opts; this.onFace = onFace; this.done = false; this.make(); }
  make() { this.w = new Writer(this.msgs[this.i], this.x, this.y, { ...this.opts, onFace: this.onFace }); }
  update(inp) {
    if (this.done) return;
    this.w.update();
    if (inp.cancel) this.w.skip();
    else if (this.w.done && (!this.msgs[this.i].includes('/') || inp.confirm)) {
      if (++this.i < this.msgs.length) this.make(); else this.done = true;
    }
  }
  draw(ctx) { if (!this.done) this.w.draw(ctx); }
}

// ============================================================================
export class AsgoreBattle extends Battle {
  constructor(single = null) { super(single); }

  // Final de la ruta neutral/pacifista: NV 1 con la Burnt Pan (cura 4 más) y el Stained Apron (cura 1 PV cada dos turnos)
  playerSetup() { return playerAt(1, { name: 'Burnt Pan', atk: 10, healBonus: 4 }, { name: 'Stained Apron', def: 11 }); }
  itemSetup() { return ['hero', 'hero', 'hero', 'hero', 'asgore_steak', 'asgore_steak']; }

  reset() {
    super.reset();
    this.enemy = { hp: 3500, maxHp: 3500, atk: 10, def: -30, x: EX, y: EY, wd: 300 };    // scr_monstersetup tipo 52
    this.body = { shake: 0, shakeRate: 2, shakeX: 0 };
    this.soul = 'spr_heart'; this.flavor = T.attacks;
    this.turns = 0; this.talkX = 0; this.turn = 0; this.actPos = 0;
    this.abody = null; this.spear = null; this.bodyHidden = false;
    this.hollowBt = false; this.white = false; this.mercyBt = false; this.mparts = []; this.afters = [];
    this.btAlpha = 1; this.boxAlpha = 1; this.boxHidden = false; this.statsHidden = false; this.heartHidden = true;
    this.seq = null; this.bubble = null; this.bubbleWide = false; this.fin = null; this.fake = null; this.asg = null;
    this.slow = 0; this.slowTick = 0; this.fadeOut = 0; this.heartPrevX = 0;
  }

  // ---------------------------------------------------------------- ganchos de la base
  ideal() { return this.border === 29 ? B29 : this.border === 30 ? B30 : BORDER[this.border]; }
  startIntro() {
    if (this.single) { this.startBattle(); playMusic('asgore'); this.startEnemyTurn(); }
    else this.startCinematic();
  }
  missPos() { return [EX + 150 - 48, EY + 126]; }
  dmgPos() { return [EX, EY + 150]; }            // obj_dmgwriter en (x, y + 150)
  gameOver() {
    if (this.state !== 'gameover' && !this.single) { try { localStorage.setItem('dbs-asgore-ky', String(killYou() + 1)); } catch (e) {} }
    super.gameOver(); this.seq = null; this.fin = null; this.slow = 0;
  }
  updateMenu(inp) {                              // global.mercy = 2: el cursor solo recorre FIGHT / ACT / ITEM
    if (inp.left) { this.menu = (this.menu + 2) % 3; playSound('squeak'); }
    if (inp.right) { this.menu = (this.menu + 1) % 3; playSound('squeak'); }
    super.updateMenu({ ...inp, left: false, right: false });
  }
  startMenu() {                                   // obj_battlecontroller: el Stained Apron cura 1 PV cada dos turnos
    super.startMenu();
    const p = this.player;
    if (this.turn > 0 && (this.turn + 1) % 2 === 0 && p.hp < p.maxHp) { p.hp++; playSound('power'); }
  }

  // Daño de las balas (obj_asgorebulparent Other_10): dmg = ATQ actual; si tenías más de 1 PV te deja en 1
  bulletHit() {
    if (this.invc >= 1 || this.state === 'gameover') return;
    const p = this.player, before = p.hp;
    let dmg = this.enemy.atk;
    for (const lim of [21, 30, 40, 50, 60, 70, 80, 90]) if (p.hp >= lim) dmg++;       // scr_damagestandard
    const amt = Math.max(1, Math.round(dmg - (p.df + p.armor.def) / 5));
    p.hp = Math.max(0, p.hp - amt);
    if (before > 1 && p.hp <= 0) p.hp = 1;
    playSound('hurt'); this.shake = 2; this.invc = 30;                                 // global.inv = 30
    if (p.hp <= 0) this.gameOver();
  }

  // Golpe del jugador (obj_asgoreb Alarm_3). Asgore no tiembla: solo se ven el número y la barra.
  onStrike(damage) {
    if (damage === null) return super.onStrike(null);
    const take = damage;
    this.slice = new Slice(this);
    this.later(this.slice.damagetimer, () => {
      if (this.enemy.hp - take <= 500) return this.startFinal();
      const [dx, dy] = this.dmgPos();
      this.dmgw = new DmgWriter(this, take, dx, dy, 0);
      playSound('damage');
      this.later(32, () => {                       // shudder 8 -> 0 cada 2 frames, luego hurtanim = 2
        this.enemy.hp = Math.max(0, this.enemy.hp - take);
        this.dmgw.life = 15;
        this.startEnemyTurn();
      });
    });
  }

  // ---------------------------------------------------------------- ACT (Check / Talk)
  drawSubmenu(ctx) {
    const x = BORDER[0][0] + 20, y = BORDER[0][2] + 20, line = (s, dx = 0) => drawText(ctx, 'fnt_main', s, x + dx, y, { mono: 16 });
    const S = this.state;
    if (S === 'fightTarget' || S === 'actTarget') {
      line('   * ' + T.name);
      if (S === 'fightTarget') {
        const bx = 190 + T.name.length * 16, w = Math.floor(this.enemy.hp / this.enemy.maxHp * 100);
        ctx.fillStyle = '#f00'; ctx.fillRect(bx, 280, 101, 17);
        ctx.fillStyle = '#0f0'; if (this.enemy.hp > 0) ctx.fillRect(bx, 280, w + 1, 17);
      }
    }
    if (S === 'actList') { line('   * ' + tr('Check')); line('   * ' + tr('Talk'), 256); }
    if (S === 'itemList') super.drawSubmenu(ctx);
  }
  updateSub(inp) {
    if (this.state === 'actList') {
      if (inp.cancel) { this.go('actTarget'); return; }
      if (inp.left || inp.right) { this.actPos = 3 - this.actPos; playSound('squeak'); }
      if (inp.confirm) { playSound('select'); this.doAct(this.actPos); }
      return;
    }
    if (this.state === 'actTarget' && inp.confirm) { playSound('select'); this.actPos = 0; this.go('actList'); return; }
    super.updateSub(inp);
  }
  doAct(pos) {                                    // obj_asgoreb Step (myfight == 2): whatiheard 0 = Check, 3 = Talk
    if (pos === 0) return this.boxMsgs([T.check]);
    const t = this.talkX, e = this.enemy;
    let msgs = [T.nothing];
    if (t === 0) msgs = T.talk0;
    if (t === 1) msgs = T.talk1;
    if (t === 2) { msgs = T.talk2; e.atk -= 1; e.def -= 10; }
    if (t >= 3 && t !== 8) msgs = [T.talkMore];
    if (t === 8) msgs = [T.talkFight];
    const ky = killYou();
    if (t === 0 && ky > 0) {                      // ya te mató antes (KillYou)
      const n = T.times[Math.min(ky, 10) - 1];
      msgs = [T.killed.replace('{n}', n), T.nods[ky > 9 ? 2 : ky > 4 ? 1 : 0]];
    }
    this.talkX++;
    this.boxMsgs(msgs);
  }
  boxMsgs(msgs) { this.boxQ = [...msgs]; this.writer = new Writer(this.boxQ.shift(), BORDER[0][0], BORDER[0][2]); this.go('aBox'); }

  // ---------------------------------------------------------------- el combate empieza (con 50 de la intro)
  startBattle() {
    this.abody = new AsgBody(EX + 40, EY);          // mypart1 = obj_asgoreb_body (x + 40, y)
    this.spear = new AsgSpear(EX + 76 + 40, EY + 100);
    this.hollowBt = false; this.white = false; this.mercyBt = false; this.boxHidden = false; this.statsHidden = false;
    this.flavor = T.attacks; this.setBorder(0);
  }

  // ---------------------------------------------------------------- turno de Asgore
  startEnemyTurn() {                              // mnfight = 1: alarm[6] = 1, alarm[5] = 10
    this.writer = null; this.go('aPre'); this.heartHidden = true; this.turn++;
    this.a6 = 1; this.a5 = 10;
  }
  alarm6() {                                      // Alarm_6: siguiente turno, caja 29 y el alma al centro
    this.turns++;
    this.setBorder(29); this.heartHidden = false;
    this.heart = { x: Math.round((B29[0] + B29[1]) / 2) - 8, y: Math.round((B29[2] + B29[3]) / 2) - 8 };
  }
  plan() {
    if (this.single) return this.single;
    const e = this.enemy, t = this.turns;
    if (t === 21 || t === 22) { if (e.def > -90) e.def -= 5; }
    if (t >= 20 && e.def > -120) e.def -= 10;
    if (t === 21 || t === 22) return choose(...RANDOM);
    if (t === 23) { this.turns = 20; return SW3; }
    return TURNS[t];
  }
  beginAttack() {                                  // Alarm_5 + Step (mnfight == 2)
    const spec = this.plan();
    if (spec.gen !== 'swipe') this.setBorder(30);    // en los turnos del tridente la caja se queda en 29
    this.turntimer = spec.tt;
    this.flavor = this.enemy.hp <= this.enemy.maxHp / 4 ? T.lowhp : T.flavor;
    this.attack = new AsgoreAttack(this, spec);
    this.go('aAttack');
  }
  swipeDone() { this.bodyHidden = false; this.turntimer = -1; }   // obj_asgore_spearswipe Destroy
  endTurn() {                                      // mnfight = 3: la caja vuelve a crecer
    this.attack = null; this.bodyHidden = false; this.setBorder(0); this.go('aEnd');
  }

  // ---------------------------------------------------------------- intro (obj_asgore_finalintro)
  startCinematic() {
    this.go('aIntro'); this.a4 = 0;
    this.hollowBt = true; this.mercyBt = true; this.boxHidden = true; this.heartHidden = true;
    this.face = 0; this.asg = { x: 116, y: 16, hs: 0, spr: 'spr_asgore_prebrandish', frame: 0 };
    this.seq = new Seq(T.intro, BORDER[0][0], BORDER[0][2], TY61);    // con -10: typer 61
    this.con = -9;
    playMusic('asgbergen');                         // obj_asgore_finalintro Create: "Bergentrückung"
  }
  afterimage(o, spr, frame, extra = {}) { this.afters.push({ spr, frame, x: o.x, y: o.y, alpha: 0.9, ...extra }); }   // scr_afterimage
  updateCinematic(inp) {
    const a = this.asg;
    if (this.a4 > 0 && --this.a4 === 0) this.con = Math.round((this.con + 1) * 10) / 10;   // Alarm_4: con += 1
    if (this.seq) this.seq.update(inp);
    if (this.bubble) this.bubble.update(inp);
    if (this.con === -9 && this.seq.done) { this.seq = null; this.con = -8; this.a4 = 30; }
    if (this.con === -7) {                         // "Human... It was nice to meet you. Goodbye." (obj_blconsm en 500, 120)
      this.con = -6; this.bubbleWide = false; this.bubbleAt = [500, 120];
      this.bubble = new Seq(T.goodbye, 525, 130, TY(3), n => { this.face = n; });
    }
    if (this.con === -6 && this.bubble.done) { this.bubble = null; this.con = 3; }
    if (this.con === 3) {                          // blande el tridente
      playSound('spearappear'); a.spr = 'spr_asgore_brandish'; a.frame = 0; this.con = 6.1; this.a4 = 5; a.hs = -20;
    }
    if (this.con === 6.1) this.afterimage(a, a.spr, a.frame);
    if (this.con === 7.1) { a.hs = 0; this.con = 7; this.a4 = 20; }
    if (this.con === 8) {                          // animación del tajo: destello y temblor
      a.frame += 0.5;
      if (a.frame === 2) playSound('asg_cut');
      if (a.frame === 4) this.shake = 6;
      if (a.frame >= 13) { a.frame = 13; this.con = 9; this.a4 = 20; }
    }
    if (this.con === 10) {                        // todo blanco; Asgore y los botones en negro; el tridente rojo sale volando
      this.white = true; a.frame = 0;
      this.fake = { x: 268, y: 140, hs: 0, vs: 0, angle: 0 };
      this.con = 12; this.a4 = 20; this.vvv = 2.5; playSound('spearappear');
    }
    const f = this.fake;
    if (this.con === 12) {
      f.hs = 14.3; f.vs = -13; f.angle -= 4.5; a.hs = (500 - a.x) / 20;
      this.afterimage(a, a.spr, a.frame, { color: '#000' });
      this.afterimage(f, 'spr_asgorespear', 0, { angle: f.angle, color: '#f00' });
    }
    if (this.con === 13) { this.vvv -= 0.1; f.hs = 0; f.vs = this.vvv; a.hs = 0; this.con = 18; this.a4 = 30; }
    else if (this.con === 18) { if (this.vvv > 0) this.vvv -= 0.1; f.hs = 0; f.vs = -this.vvv; }
    if (this.con === 19) { stopMusic(); playSound('asg_swipe'); f.vs = 100; this.con = 20; }   // caster_free(-3)
    if (this.con === 20) {                         // obj_asgorefakespear Collision con obj_mercybutton_shatter
      this.afterimage(f, 'spr_asgorespear', 0, { angle: f.angle, color: '#f00' });
      const sb = rotBBox('spr_asgorespear', f.x, f.y, f.angle, 2, 2), mb = { x1: BUTTONS[3][1], y1: 432, x2: BUTTONS[3][1] + 109, y2: 473 };
      if (hit(sb, mb)) this.shatterMercy();
    }
    if (this.con === 40) {                         // blanco total y luego negro; suena la música y empieza la pelea
      if (this.wOn === 0) { this.whiteout += 0.08; if (this.whiteout >= 1.8) this.wOn = 1; }
      else {
        this.blackout += 0.05;
        if (Math.abs(this.blackout - 5.5) < 1e-5) playMusic('asgore');
        if (Math.abs(this.blackout - 7) < 1e-5) {
          this.con = 50; this.startBattle(); this.afters = []; this.mparts = []; this.fake = null; this.asg = null;
          this.startMenu(); return;
        }
      }
    }
    // movimiento de lo que hay en pantalla
    if (a) a.x += a.hs;
    if (f) { f.x += f.hs; f.y += f.vs; }
    for (const p of this.mparts) { gmMove(p); p.angle += p.aa; }
    this.mparts = this.mparts.filter(p => p.y <= 520);
    for (const o of this.afters) o.alpha -= 0.2;
    this.afters = this.afters.filter(o => o.alpha >= 0.1);
  }
  shatterMercy() {                                // obj_mercybutton_shatter Other_10: 2 x 11 pedazos (6 a la izquierda, 5 a la derecha)
    this.shake = 6; playSound('impact'); playSound('break2'); this.mercyBt = false;
    const [x, y] = [BUTTONS[3][1] + 55, 432 + 21];
    for (let k = 0; k < 2; k++) for (let i = 0; i < 11; i++) {
      const left = i < 6;
      this.mparts.push({ i, x, y, hs: left ? -14 - rnd(26) : 10 + rnd(30), vs: -10 - rnd(6), grav: 1, gdir: 270, friction: 0.1,
                         angle: 0, aa: left ? 7 + rnd(4) : -8 - rnd(4) });
    }
    this.con = 40; this.wOn = 0; this.whiteout = 0; this.blackout = 0;
  }

  // ---------------------------------------------------------------- de rodillas (obj_asgore_lastcutscene)
  startFinal() {
    const e = this.enemy, [dx, dy] = this.dmgPos();
    this.dmgw = new DmgWriter(this, Math.max(1, e.hp - 30), dx, dy, 0);   // global.fivedamage: la barra se queda en 30
    e.hp = Math.max(1, Math.min(e.hp, 30));
    stopMusic(); playSound('damage');
    this.abody = null; this.spear = null; this.attack = null;
    this.fin = { con: 0, a0: 1, a2: 0, a4: 0, x: KX, xstart: KX, y: KY, shudder: 18, asgore: true, face: 9, hearts: -1, soul: null, shards: [] };
    this.go('aFinal');
  }
  finBubble(msgs, wide) {                          // scr_blcon_x(x + 300, y + 20) pequeño / scr_blcon_ofs(x + 270, y + 20, 0, 6, 0) ancho
    const f = this.fin, face = n => { f.face = n; };
    this.bubbleWide = wide;
    if (wide) { this.bubbleAt = [KX + 270, KY + 20]; this.bubble = new Seq(msgs, KX + 270 + 30 + 6, KY + 20 + 10, TY(2), face); }
    else { this.bubbleAt = [KX + 300, KY + 20]; this.bubble = new Seq(msgs, KX + 300 + 30, KY + 20 + 10, TY(2), face); }
  }
  updateFinal(inp) {
    const f = this.fin;
    if (f.a0 > 0 && --f.a0 === 0) {               // Alarm_0: se sacude cada vez menos
      f.x = f.xstart + f.shudder; f.shudder = -f.shudder;
      if (f.shudder > 0) f.shudder -= 3;
      f.a0 = 8;
      if (Math.abs(f.shudder) < 1) { f.shudder = 0; f.con = 2; f.a0 = 0; }
    }
    if (f.a2 > 0 && --f.a2 === 0) {               // Alarm_2: tiembla con el golpe final
      f.x = f.xstart + f.shudder; f.shudder = -f.shudder;
      if (f.shudder > 0) f.shudder -= 2;
      f.a2 = 2;
      if (Math.abs(f.shudder) < 2) { f.shudder = 0; f.con = 58; f.a2 = 0; }
    }
    if (f.a4 > 0 && --f.a4 === 0) f.con += 1;
    if (this.bubble) this.bubble.update(inp);
    const c = f.con;
    if (c >= 4 && this.btAlpha > 0) this.btAlpha -= 0.02;                  // los botones se desvanecen
    if (c >= 12) { this.statsHidden = true; if (this.boxAlpha > 0) this.boxAlpha -= 0.02; }
    if (c === 2) { this.setBorder(0); this.dmgw = null; f.con = 3; f.a4 = 50; }
    if (c === 4) { this.finBubble(T.kneel, false); f.con = 5; }
    if (c === 5 && this.bubble.done) { this.bubble = null; f.con = 6; f.a4 = 45; }
    if (c === 7) { playMusic('asgchoke'); this.finBubble(T.story, true); f.con = 8; }   // "Choked Up"
    if (c === 8 && this.bubble.done) { this.finBubble(T.plea, true); f.con = 10; }
    if (c === 10 && this.bubble.done) {           // botones LUCHAR / PIEDAD (obj_anybt) y un alma que puedes mover (obj_fakeheart)
      this.bubble = null;
      const [l, r, t] = BORDER[0];
      f.bts = [{ type: 0, spr: 'spr_fightbt', x: l + 50, y: t + 50, on: 0 }, { type: 1, spr: 'spr_sparebt', x: r - 150, y: t + 50, on: 0 }];
      f.heart = { x: 320, y: t + 60 };
      f.con = 11;
    }
    if (c === 11) this.updateChoice(inp);
    // LUCHAR: el último golpe
    if (c === 45) { stopMusic(); f.con = 46; f.a4 = 20; }
    if (c === 47) {
      this.stretch = 1.5;
      const sl = new Slice(this), S = SPR.spr_strike;
      sl.x = f.x + 195 - (sl.scale - 1) * (S.w * sl.scale / 2); sl.y = KY + 150 - (sl.scale - 1) * (S.h * sl.scale / 2);
      this.slice = sl; f.con = 49; f.a4 = sl.damagetimer;
    }
    if (c === 50) { f.a2 = 1; playSound('damage'); f.shudder = 16; f.face = 6; f.con = 51; }
    if (c === 58) {                                // se hace polvo (room_speed = 10)
      this.dust = new Vapor({ x: KX, y: KY }, SPR.spr_asgore_kneeldeath.frames[0]); playSound('vaporized');
      f.asgore = false; f.con = 59; f.a4 = 40; this.slow = 1;
    }
    if (c === 60) {                                // su alma aparece temblando (obj_asgfakeheart)
      this.slow = 0; f.soul = { x: f.x + 180, y: KY + 100, xs: f.x + 180, ys: KY + 100, alpha: 0, shake: 3, broken: false, gone: false };
      f.con = 62; f.a4 = 90;
    }
    if (c === 63) { f.soul.shake = 0; f.con = 64; f.a4 = 68; }         // (aquí llegaría la bala de Flowey)
    if (c === 65) {                                // obj_asgfakeheart Other_10: se parte
      const s = f.soul; s.broken = true; s.x -= 2; s.shake = 0; playSound('break1'); f.con = 66; f.a4 = 40;
    }
    if (c === 67) {                                // Alarm_1: estalla en pedazos (obj_theartshard)
      const s = f.soul; s.gone = true; playSound('break2');
      for (const [dx, dy] of [[-2, 0], [0, 3], [2, 6], [8, 0], [10, 3], [12, 6]]) {
        const d = rnd(360); f.shards.push({ x: s.x + dx, y: s.y + dy, hs: ldx(7, d), vs: ldy(7, d), f: 0 });
      }
      f.con = 68; f.a4 = 90;
    }
    if (c === 69) { f.con = 70; this.fadeOut = 0.001; }
    // PIEDAD: te ofrece quedarte con su familia
    if (c === 15) { stopMusic(); f.con = 16; f.a4 = 30; }
    if (c === 17) { this.finBubble(T.spared, true); f.con = 18; }
    if (c === 18 && this.bubble.done) { playMusic('asgmusicbox'); this.finBubble(T.family, true); f.con = 19; }   // caster_loop(msb)
    if (c === 19 && this.bubble.done) { this.bubble = null; f.con = 18.5; f.a4 = 50; }
    if (c === 19.5) { f.con = 20; this.fadeOut = 0.001; }             // (aquí aparecería Flowey)
    // alma y pedazos
    const s = f.soul;
    if (s && !s.broken) { s.alpha += 0.025; s.x = s.xs + rnd(s.shake) - rnd(s.shake); s.y = s.ys + rnd(s.shake) - rnd(s.shake); }
    for (const p of f.shards) { p.vs += 0.2; p.x += p.hs; p.y += p.vs; p.f += 0.25; }
    if (this.dust) this.dust.update();
  }
  updateChoice(inp) {                             // obj_fakeheart + obj_anybt
    const f = this.fin, h = f.heart, H = inp.held, sp = this.sp, [l, r, t, b] = BORDER[0];
    if (H.left) h.x -= sp; if (H.right) h.x += sp; if (H.up) h.y -= sp; if (H.down) h.y += sp;
    h.x = Math.min(Math.max(h.x, l + 5), r - 16); h.y = Math.min(Math.max(h.y, t + 5), b - 16);
    const hb = spriteBBox('spr_heart', h.x, h.y);
    for (const bt of f.bts) {
      bt.on--;
      if (bt.on > 0 && inp.confirm) {
        playSound('select'); f.bts = null; f.heart = null;
        if (bt.type === 0) { f.con = 45; f.hearts = 0; } else { f.con = 15; f.hearts = 1; }
        return;
      }
      if (hit(hb, spriteBBox(bt.spr, bt.x, bt.y))) { if (bt.on <= 0) playSound('squeak'); bt.on = 2; }
    }
  }

  // ---------------------------------------------------------------- bucle
  update(inp) {
    if (this.slow && ++this.slowTick % 3 !== 0) return;              // room_speed = 10 mientras se hace polvo
    super.update(inp);
    if (this.state === 'gameover') return;
    const S = this.state;
    if (this.abody && !this.bodyHidden) { this.abody.step(); this.spear.step(); }
    if (S === 'aIntro') this.updateCinematic(inp);
    if (S === 'aBox') {
      if (inp.cancel) this.writer.skip();
      else if (inp.confirm && this.writer.done) {
        if (this.boxQ.length) this.writer = new Writer(this.boxQ.shift(), BORDER[0][0], BORDER[0][2]); else this.startEnemyTurn();
      }
    }
    if (S === 'aPre') {
      if (this.a6 > 0 && --this.a6 === 0) this.alarm6();
      if (this.a5 > 0 && --this.a5 === 0) this.beginAttack();
    }
    if (S === 'aAttack') {
      const h = this.heart, [l, r, t, b] = this.ideal(), H = inp.held, sp = this.sp;
      this.heartPrevX = h.x;
      if (H.up) h.y -= sp; if (H.down) h.y += sp; if (H.left) h.x -= sp; if (H.right) h.x += sp;
      h.x = Math.min(Math.max(h.x, l + 4), r - 16); h.y = Math.min(Math.max(h.y, t + 4), b - 16);
      this.turntimer--;
      if (this.attack) this.attack.update(inp);
      if (this.state === 'aAttack' && this.turntimer <= 0) this.endTurn();
    }
    if (S === 'aEnd' && this.box.l === BORDER[0][0] && this.box.t === BORDER[0][2]) this.startMenu();
    if (S === 'aFinal') this.updateFinal(inp);
    if (this.fadeOut > 0) {
      this.fadeOut += 0.03;
      if (this.fadeOut >= 1.3 && this.onExit) { const fn = this.onExit; this.onExit = null; stopMusic(); fn(); }
    }
  }

  // ---------------------------------------------------------------- dibujo
  draw(ctx) {
    super.draw(ctx);
    if (this.state === 'aIntro' && this.con === 40) {               // destello blanco y fundido a negro
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, this.whiteout)})`; ctx.fillRect(0, 0, 640, 480);
      if (this.wOn) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, this.blackout)})`; ctx.fillRect(0, 0, 640, 480); }
    }
  }
  drawEnemy(ctx) {
    if (this.white) { ctx.fillStyle = '#fff'; ctx.fillRect(-20, -20, 680, 520); }   // background_color = blanco
    for (const o of this.afters) drawSprite(ctx, o.spr, o.frame, o.x, o.y, { xs: 2, ys: 2, rot: o.angle || 0, alpha: o.alpha, color: o.color || null });
    const a = this.asg;
    if (this.state === 'aIntro' && a) {
      drawSprite(ctx, a.spr, a.frame, a.x, a.y, { xs: 2, ys: 2, color: this.white ? '#000' : null });
      if (this.con < 3) drawSprite(ctx, 'spr_asgore_bface', this.face, a.x + 138, a.y - 12, { xs: 2, ys: 2 });
      if (this.con === 8 && a.frame >= 2 && a.frame < 4) {          // destello del tajo
        ctx.fillStyle = `rgba(255,255,255,${a.frame === 3 ? 1 : 0.5})`; ctx.fillRect(-10, -10, 660, 500);
      }
    }
    if (this.abody && !this.bodyHidden) { this.abody.draw(ctx); this.spear.draw(ctx, this.abody); }
    const f = this.fin;
    if (f) {
      if (f.asgore) {
        drawSprite(ctx, 'spr_asgore_kneel', 0, f.x, f.y, { xs: 2, ys: 2 });
        drawSprite(ctx, 'spr_asgore_lastface', f.face, f.x + 136, f.y - 8, { xs: 2, ys: 2 });
      }
      if (this.dust) this.dust.draw(ctx);
    }
  }
  drawBox(ctx) {
    if (this.boxHidden || this.boxAlpha <= 0) return;
    const { l, r, t, b } = this.box;
    ctx.globalAlpha = Math.max(0, this.boxAlpha);          // al final (con >= 12) la caja se desvanece
    ctx.fillStyle = '#000'; ctx.fillRect(l + 5, t + 5, r - l - 5, b - t - 5);
    ctx.fillStyle = '#fff';
    ctx.fillRect(l, t, r + 5 - l, 5); ctx.fillRect(l, b, r + 5 - l, 5); ctx.fillRect(l, t + 5, 5, b - t - 5); ctx.fillRect(r, t + 5, 5, b - t - 5);
    ctx.globalAlpha = 1;
  }
  drawField(ctx) {
    const A = this.attack;
    if (A) A.drawDark(ctx);                        // obj_firestormgen: capa negra detrás de las balas
    this.drawBox(ctx);
    if (A) A.drawBack(ctx);                        // avisos laterales, silueta y barridos del tridente
    if (this.writer) this.writer.draw(ctx);
    if (this.seq) this.seq.draw(ctx);
    this.drawSubmenu(ctx);
    if (this.target) this.target.draw(ctx);
    if (!this.white && !this.statsHidden) this.drawStats(ctx);
    this.drawButtons(ctx);
    this.drawHeart(ctx);
    if (A) A.draw(ctx);
    if (this.slice) this.slice.draw(ctx);
    if (this.dmgw) this.dmgw.draw(ctx);
    this.drawExtra(ctx);
    if (A) A.drawTop(ctx);
    const g = this.fake;
    if (g) drawSprite(ctx, 'spr_asgorespear', 0, g.x, g.y, { xs: 2, ys: 2, rot: g.angle, color: '#f00' });
  }
  drawButtons(ctx) {
    if (isES()) buildAsgoreES();
    const S = this.state, act = ['menu', 'itemList', 'fightTarget', 'actTarget', 'actList'].includes(S);
    const color = this.white ? '#000' : null, alpha = Math.max(0, this.btAlpha);
    BUTTONS.slice(0, 3).forEach(([spr, x], i) =>
      drawSprite(ctx, sprL(this.hollowBt ? spr + '_hollow' : spr), act && i === this.menu ? 1 : 0, x, 432, { alpha, color }));
    if (this.mercyBt) drawSprite(ctx, sprL('spr_mercybutton_normal'), 0, BUTTONS[3][1], 432, { color });
    for (const p of this.mparts) drawSprite(ctx, sprL('spr_mercybutton_shatter'), p.i, p.x, p.y, { rot: p.angle, color: '#000' });
  }
  drawHeart(ctx) {
    const S = this.state;
    if (S === 'aPre' || S === 'aAttack' || S === 'aEnd') {
      if (this.heartHidden) return;
      this.hx = this.heart.x; this.hy = this.heart.y;
      drawSprite(ctx, this.soul, Math.floor(this.heartFrame), this.hx, this.hy); return;
    }
    if (S === 'actList') {
      this.hx = 72 + (this.actPos === 3 ? 256 : 0); this.hy = 278;
      drawSprite(ctx, this.soul, 0, this.hx, this.hy); return;
    }
    if (S === 'aIntro' || S === 'aFinal' || S === 'aBox') return;
    super.drawHeart(ctx);
  }
  drawExtra(ctx) {
    if (this.bubble) {
      const [bx, by] = this.bubbleAt;
      drawSprite(ctx, this.bubbleWide ? 'spr_blconwdshrt' : 'spr_blconsm', 0, bx, by);
      this.bubble.draw(ctx);
    }
    const f = this.fin;
    if (!f) return;
    if (f.bts) for (const bt of f.bts) drawSprite(ctx, sprL(bt.spr), bt.on > 0 ? 1 : 0, bt.x, bt.y);
    if (f.heart) { this.hx = f.heart.x; this.hy = f.heart.y; drawSprite(ctx, 'spr_heart', 0, f.heart.x, f.heart.y); }
    const s = f.soul;
    if (s && !s.gone) drawSprite(ctx, s.broken ? 'spr_torheartbreak_again' : 'spr_torheart_again', 0, s.x, s.y, { alpha: Math.min(1, s.alpha) });
    for (const p of f.shards) drawSprite(ctx, 'spr_theartshards', Math.floor(p.f), p.x, p.y);
  }
}
