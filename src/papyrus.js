import { drawSprite, drawText, playSound, playMusic, stopMusic, setMusicVolume, registerMusic, registerSounds, SPR } from './assets.js';
import { Battle, BORDER, ITEMS, playerAt, Target, DmgWriter, Vapor } from './battle.js';
import { Writer } from './text.js';
import { texts, tr, sprL, isES } from './i18n.js';
import { PWriter, pressEs, coolDudeEs } from './papyrus_gfx.js';
import { L, R, T as TOP, B, TURNS, Bone, TobyDog, clipBox, makeBullet, setSpeed } from './papyrus_bullets.js';

// ============================================================================
//  Papyrus (obj_papyrusboss + obj_papyrusbody), en Snowdin. Música: "Nyeh Heh Heh!" (mus_papyrus.ogg) y,
//  desde que te vuelve azul, "Bonetrousle" (mus_papyrusboss.ogg).
//  Primero ataca con el alma roja; el primer turno en que no actúas ni usas un objeto te vuelve AZUL
//  (obj_blueattackgen): el alma cae y "arriba" salta. Luego vienen sus turnos en orden (fighto -1..13),
//  4 turnos de "ataque especial" que llega por fin... y un perro se lo lleva. Tras el "ataque absolutamente
//  normal" se rinde y te perdona. Papyrus no mata: si tu PV llega a 0 te CAPTURA (blt_sizebone Other_11).
// ============================================================================
registerMusic({ papyrus: 'mus_papyrus.ogg', bonetrousle: 'mus_papyrusboss.ogg' });
registerSounds({ txtpap: 'snd_txtpap.wav', punchweak: 'snd_punchweak.wav', punchstrong: 'snd_punchstrong.wav' });

// Nice Cream (el puesto de helados de Snowdin): cura 15 (scr_itemuseb 17) y el envoltorio dice algo bonito
ITEMS.papyrus_nicecream = { name: 'Nice Cream', short: 'NiceCream', heal: 15, use: "* You're just great!" };

// Lo que dura toda la sesión (como global.flag[67] y global.flag[66] del juego): veces que te capturó y si hubo cita
const SESSION = { captures: 0, dated: 0 };

// Ataques para practicar sueltos. El juego no les pone nombre salvo el "ataque azul", el "ataque especial" y el
// "ataque absolutamente normal"; los demás llevan el nombre de lo que dice Papyrus antes de cada uno.
export const PAPYRUS_ATTACKS = [
  { name: 'Nyeh Heh Heh!', kind: 'red' },                        // primeros turnos (alma roja)
  { name: 'Fabled Blue Attack', kind: 'blueIntro' },             // obj_blueattackgen
  ...[['Behold!', -1], ['How High Can You Jump?', 0], ["Don't Make Me", 1], ['Future Popularity', 2], ['Head of the Royal Guard', 3],
      ['Unparalleled Spaghettore', 4], ['Undyne Will Be Proud', 5], ['A Hedge Like My Smile', 6], ['My Brother', 7], ['Lots of Admirers', 8],
      ['Sincerely Liked', 9], ['Someone Really Rare', 10], ["They Won't Let You Go", 11], ['Captured and Sent Away', 12], ['Give Up!', 13]]
    .map(([name, f]) => ({ name, kind: 'f', f })),
  { name: 'Bone Waves', kind: 'waveA' },                         // fighto 14, mycommand < 20
  { name: 'Blue and White', kind: 'blueB' },                     // fighto 14, mycommand 20-39
  { name: 'Special Attack', kind: 'dog' },                       // el perro se come el ataque especial
  { name: 'Absolutely Normal Attack', kind: 'final' },           // fighto 15
];

// Textos (textdata_en: obj_papyrusboss, obj_blueattackgen, blt_sizebone, scr_battlegroup, scr_itemuseb)
const T = texts('papyrus', {
  intro: '* Papyrus blocks the way!',
  check: '* PAPYRUS - ATK 20 DEF 20&* He likes to say:&  "Nyeh heh heh!"/^',
  flirtNo: "* You FLIRT^1, but to no avail^1.&* Seems ACTing won't escalate&  this battle.../^",
  flirtBusy: '* Papyrus is too busy FIGHTing&  to flirt back./^',
  insultNo: "* You INSULT^1, but to no avail^1.&* Seems ACTing won't escalate&  this battle.../^",
  insultBusy: '* Papyrus is too busy FIGHTing&  to accept your insult./^',
  flirt1: [' WHAT!^1?& FL-FLIRTING!?/', '\\X SO YOU FINALLY& REVEAL YOUR\\R & ULTIMATE FEELINGS\\X!/', " W-WELL^1!& I'M A SKELETON& WITH VERY HIGH& STANDARDS!!!/%%"],
  flirt2: [' OH NO!!!/%%'],
  insult: [[' HOW SELFLESS.../', ' YOU WANT ME TO& FEEL BETTER& ABOUT FIGHTING& YOU.../%%'], [" THERE'S NO NEED& TO LIE TO& YOURSELF!!!/%%"], [" DON'T...!/%%"]],
  choiceL: 'I can&make&spaghetti', choiceR: 'I have zero&redeeming&qualities',
  spaghetti: [" OH NO!!^1! YOU'RE& MEETING ALL MY& STANDARDS!!!/", ' I GUESS THIS MEANS& I HAVE TO GO ON A& DATE WITH YOU...?/%%'],
  humility: [' OH NO!!^1!& THAT HUMILITY..^1.& IT REMINDS ME OF,/', ' MYSELF!!!/', " YOU'RE MEETING ALL&  MY STANDARDS!!!/%%"],
  // lo que dice antes de cada ataque (Alarm_6)
  dots: '  ...',
  item: ' OH^1, I SHOULD& HAVE BROUGHT ONE&  OF THOSE.',
  serious: " SO YOU'RE& SERIOUS.../", wontFight: " SO YOU WON'T& FIGHT.../",
  blueAtk: " THEN^1, LET'S SEE& IF YOU CAN HANDLE& MY FABLED& 'BLUE ATTACK!'/%%",
  f: { '-1': ' BEHOLD!', 0: ' HOW HIGH CAN YOU& JUMP?', 1: "\\X YEAH!& DON'T MAKE ME& USE MY \\RSPECIAL& ATTACK\\X!", 2: ' I CAN ALMOST& TASTE MY FUTURE& POPULARITY!!!',
       3: ' PAPYRUS:& HEAD OF THE& ROYAL GUARD!', 4: ' PAPYRUS:& UNPARALLELED& SPAGHETTORE!', 5: ' UNDYNE WILL BE& REALLY PROUD& OF ME!!',
       6: ' THE KING WILL& TRIM A HEDGE& IN THE SHAPE& OF MY SMILE!!!', 7: " MY BROTHER WILL& ... WELL, HE& WON'T CHANGE& VERY MUCH.",
       8: " I'LL HAVE LOTS& OF ADMIRERS!!& BUT...", 9: ' HOW WILL I& KNOW IF PEOPLE& SINCERELY LIKE& ME???', 10: ' SOMEONE LIKE& YOU IS REALLY& RARE...',
       11: " I DON'T THINK& THEY'LL LET YOU& GO...", 12: " AFTER YOU'RE& CAPTURED AND& SENT AWAY.", 13: ' URGH...& WHO CARES!& GIVE UP!!',
       15: " *SIGH* HERE'S AN& ABSOLUTELY& NORMAL ATTACK." },
  date: { '-1': ' HMMM... I WONDER& WHAT I SHOULD& WEAR...', 0: " WHAT!? I'M NOT& THINKING ABOUT& THAT DATE THING!!",
          9: ' WILL ANYONE LIKE& ME AS SINCERELY& AS YOU?', 11: ' AND DATING MIGHT& BE KIND OF& HARD...' },
  hint0: " TRY HOLDING THE& 'UP' BUTTON TO& JUMP!!!", hint1: " HOLD 'UP' LONGER& TO JUMP HIGHER!& JEEZ!!!",
  special: ['\\X GIVE UP OR& FACE MY...& \\RSPECIAL ATTACK\\X!!!', '\\X YEAH!!!& VERY SOON I WILL& USE MY& \\RSPECIAL ATTACK\\X! ',
            '\\X NOT TOO LONG& AND I WILL& USE THAT& \\RSPECIAL ATTACK\\X!!!', '\\X THIS IS YOUR& LAST CHANCE...& BEFORE MY& \\RSPECIAL ATTACK\\X!!',
            '\\X BEHOLD...!& MY \\RSPECIAL& ATTACK\\X!'],
  act: { check: ' NYEH HEH HEH!', insult1: " I DON'T DESERVE& SUCH HOSPITALITY& FROM YOU ...", insult2: ' YOUR BARBS HIDE A& HIDDEN AFFECTION^1!& YOU EMOTIONAL& CACTUS!',
         insult3: " DON'T WASTE YOUR& WORDS ON ME!", date: " LET'S DATE& L-LATER!^1!& AFTER I CAPTURE& YOU!" },
  // textos del menú (lo que prepara Papyrus); el número es el mycommand mínimo
  flavors: [[0, '* Papyrus is preparing a bone&  attack.'], [16, '* Papyrus prepares a non-bone&  attack then spends a minute&  fixing his mistake.'],
            [20, '* Papyrus is cackling.'], [30, '* Papyrus whispers "Nyeh heh&  heh!"'], [40, '* Papyrus is rattling his bones.'],
            [60, '* Papyrus is trying hard to play&  it cool.'], [80, '* Papyrus is considering his&  options.'], [90, '* Smells like bones.'],
            [97, '* Papyrus remembered a bad joke&  Sans told and is frowning.']],
  dateFlavors: ['* Papyrus is thinking about&  what to wear for his date.', '* Papyrus is thinking about&  what to cook for his date.',
                '* Papyrus dabs some Bone&  Cologne behind his ear.', '* Papyrus dabs marinara sauce&  behind his ear.',
                '* Papyrus dabs MTT-Brand Bishie&  Cream behind his ear.', '* Papyrus dabs MTT-Brand Anime&  Powder behind his ear.',
                '* Papyrus dabs MTT-Brand Cute&  Juice behind his ear.', '* Papyrus dabs MTT-Brand&  Attraction Slime behind his&  ear.',
                '* Papyrus dabs MTT-Brand&  Beauty Yogurt behind his&  ear.', "* Papyrus realizes he doesn't&  have ears."],
  edge: '* Papyrus is at the edge of&  defeat.',
  sparing: '* Papyrus is sparing you.',
  blueNow: "* You're blue now.",
  regular: '* Papyrus is getting ready&  for a regular attack.',
  blueSpeech: [" YOU'RE BLUE NOW./", " THAT'S MY ATTACK!/", ' NYEH HEH HEH& HEH HEH HEH& HEH HEH HEH!!!/%%'],
  // el ataque especial (Alarm_7)
  dog: [[' WHAT THE HECK!/', " THAT'S MY& SPECIAL ATTACK!/%%"], [' HEY^1!& YOU STUPID DOG!/%%'], [' DO YOU HEAR& ME!?/', ' STOP MUNCHING ON& THAT BONE!!!/%%'],
        [' HEY!!!& WHAT ARE YOU& DOING!!!/', ' COME BACK HERE& WITH MY SPECIAL& ATTACK!!!/%%'], [' .../', ' OH WELL./', " I'LL JUST USE& A REALLY COOL& REGULAR ATTACK./%%"]],
  // se rinde (Alarm_8)
  spare: [" WELL...! *HUFF^1*& IT'S CLEAR...& YOU CAN'T^1! *HUFF^1*& DEFEAT ME!!!/", ' YEAH!!!& I CAN SEE YOU& SHAKING IN YOUR& BOOTS!!!/',
          ' THEREFORE I^1, THE& GREAT PAPYRUS^1,& ELECT TO GRANT& YOU PITY!!/', '\\X I WILL \\RSPARE\\X YOU,& HUMAN!!!/', " \\XNOW'S YOUR CHANCE& TO ACCEPT MY& \\RMERCY\\X./%%"],
  // te captura (blt_sizebone Alarm_4), según las veces que ya te capturó
  capture: [[" YOU'RE TOO WEAK!!& I WAS EASILY ABLE& TO CAPTURE YOU!!!/", ' I WILL NOW SEND& YOU TO THE& CAPTURE ZONE!!/', ' OR^1, AS SANS& CALLS IT^1.../',
             ' OUR GARAGE???/', " YOU'RE IN THE& DOGHOUSE NOW!/", ' NYEH HEH HEH HEH& HEH HEH HEH!!!/%%'],
            [' WELL!!^1! YOU MAY& HAVE CLEVERLY& ESCAPED FROM& JAIL BEFORE.../', " BUT THIS TIME^1,& I'VE UPGRADED& THE FACILITIES./", ' NOT ONLY WILL& YOU BE& TRAPPED.../',
             " BUT YOU WON'T& EVEN WANT& TO LEAVE!!!/", ' NYEH HEH HEH HEH& HEH HEH HEH!!!/%%'],
            [' YOU ARE...& PERSISTENT!/', " BUT^1!& IT JUST WON'T& WORK ON ME!/", ' I AM THE& PERSISTENTEST!/', ' AND IF YOU& THINK YOU ARE& PERSISTENESTER.../',
             ' THAT IS WRONG^1!& GRAMATICALLY& WRONG!/', ' BECAUSE THE& CORRECT FORM& WOULD BE.../', ' NOT AS& PERSISTENTEST AS& PAPYRUS^1, THE& PERSISTENTESTEST!/',
             ' I HOPE YOU& ENJOYED THIS& LESSON./', ' NYEH HEH HEH HEH& HEH HEH HEH!!!/%%']],
  // si lo matas (Alarm_10): la cabeza sigue hablando
  alas: [' ALAS^1, POOR& PAPYRUS!/%%'],
  head: [' WELL^1, AT LEAST I& STILL HAVE MY& HEAD!/%%'],
  nice: ["* You're just great!", '* You look nice today!', '* Are those claws natural?', "* You're super spiffy!", '* Have a wonderful day!',
         '* Is this as sweet as you?', '* (An illustration of a hug.)', '* Love yourself! I love you!'],
});

const PX = 250, PY = 42, PW = 148;                     // scr_battlegroup: instance_create(250, 42, obj_papyrusboss)
const BUB = [PX + 145, PY + 52];                        // obj_blconwdflowey (spr_blconwdshrt)

// ---------------------------------------------------------------- Tough Glove: barra rápida y luego pulsa Z hasta 4 veces (obj_targetchoicefist)
class FistTarget extends Target {
  constructor(b) { super(b); this.hs *= 1.2; this.punching = false; this.punchtime = 0; this.punches = 0; }
  update(b, inp) {
    if (this.fade) { this.alpha -= 0.08; this.xs -= 0.06; this.x += 15.8; if (this.xs < 0.08) b.target = null; return; }
    if (this.punching) {                               // 30 frames para pulsar Z: 3 puñetazos flojos y el 4.º fuerte
      this.flicker += 0.4; this.punchtime++;
      if (inp.confirm && this.punches < 4) {
        this.punches++; b.pressZ.hide = 10;
        if (this.punches < 4) b.fx.push(new Punch(false, PX + Math.random() * PW, PY + Math.random() * 208));
        else b.fx.push(new Punch(true, PX + PW / 2, PY + 104));
      }
      if (this.punchtime >= 30 || this.punches === 4) {   // daño * golpes / 4; sin golpes: MISS
        this.punching = false; b.pressZ = null; this.fade = true;
        b.onStrike(this.punches === 0 ? null : Math.ceil(this.dmg * this.punches / 4));
      }
      return;
    }
    this.cx += this.hs;
    if ((this.hs > 0 && this.cx > this.x + 562) || (this.hs < 0 && this.cx < this.x)) { this.fade = true; b.onStrike(null); return; }
    if (this.guard > 0) { this.guard--; return; }
    if (inp.confirm) {                                 // Z: se calcula el daño (x2.1 si es perfecto) y empiezan los puñetazos
      const p = b.player, dmg = p.at + p.weapon.atk - b.enemy.def + Math.random() * 2;
      const bonus = Math.abs((this.cx + 7) - (this.x + 281)) || 1, stretch = (562 - bonus) / 562;
      this.dmg = bonus <= 12 ? Math.round(dmg * 2.1) : Math.round(dmg * stretch * 2);
      this.punching = true; b.pressZ = { t: 0, hide: 0 };
    }
  }
}
class Punch {                                          // obj_lightpunch / obj_strongpunch
  constructor(strong, x, y) {
    this.strong = strong; this.x = x; this.y = y; this.frame = 0;
    this.spr = strong ? 'spr_hyperfist' : 'spr_regfist';
    playSound(strong ? 'punchstrong' : 'punchweak');
  }
  update(b) {
    const j = this.strong ? 2 : 1;
    this.x += Math.random() * 2 * j - j; this.y += Math.random() * 2 * j - j;
    if (this.strong && this.frame === 0) b.shake = 3;  // scr_shake(3, 3, 2)
    this.frame += 0.5; if (this.frame >= SPR[this.spr].frames.length) this.dead = true;
  }
  draw(ctx) { drawSprite(ctx, this.spr, this.frame, this.x, this.y); }
}

// ============================================================================
export class PapyrusBattle extends Battle {
  constructor(single = null) { super(single); }

  // Papyrus: Snowdin, NV 1 y 20 PV con el Tough Glove y la Manly Bandanna (tienda de Snowdin).
  // Objetos: 4 Nice Cream (cura 15) y 2 Cinnamon Bunny (cura 22).
  playerSetup() { return playerAt(1, { name: 'Tough Glove', atk: 5, fist: true }, { name: 'Manly Bandanna', def: 7 }); }
  itemSetup() { return ['papyrus_nicecream', 'papyrus_nicecream', 'papyrus_nicecream', 'papyrus_nicecream', 'bunny', 'bunny']; }

  reset() {
    super.reset();
    this.enemy = { hp: 680, maxHp: 680, atk: 8, def: 2, x: PX, y: PY, wd: PW };   // scr_monstersetup tipo 25
    this.body = { shake: 0 };
    this.flavor = T.intro; this.soul = 'spr_heart';
    this.rematch = !this.single && SESSION.captures > 0;          // global.flag[67] < 0: la revancha empieza ya en azul
    this.truefight = this.rematch ? 1 : 0; this.conversation = this.rematch ? 1 : 0;
    this.fighto = -1; this.xfight = 0; this.mycommand = 0; this.whatiheard = -1;
    this.insult = 0; this.hotcha = 0; this.flirt2 = 0; this.mercymod = 0; this.dontcancel = 0; this.xxtalk = 0;
    this.hearthp = this.player.hp; this.hearthp2 = this.player.hp; this.prevhp = 680; this.usedItem = false;
    this.bullets = []; this.gen = null; this.dog = null; this.fx = []; this.pb = null; this.pressZ = null;
    this.hurt = null; this.pxoff = 0; this.hidden = false; this.corpse = null; this.fade = 0; this.fadeSpeed = 0;
    this.top51 = TOP; this.actPos = 0; this.choice = 0; this.vol = undefined;
    this.heart = { x: 309, y: 310, vs: 0, prevX: 309, prevY: 310, movement: 0, jumpstage: 0 };
  }

  // ---------------------------------------------------------------- utilidades
  ideal() {                                            // SCR_BORDERSETUP 5, 50 y 51 (51: el techo sigue al alma)
    if (this.border === 5) return [L, R, TOP, B];
    if (this.border === 50) return [L, 512, TOP, B];
    if (this.border === 51) return [L, 512, this.top51, B];
    return BORDER[this.border];
  }
  music(name, vol) { playMusic(name); setMusicVolume(vol); this.vol = vol; }   // caster_loop(música, volumen)
  spareable() { return this.mercymod >= 8000; }
  // Globo de Papyrus (typer 22). Con onEnd, Z pasa de mensaje y al acabar llama a onEnd; sin él lo cierra el turno.
  // (en español los textos no llevan el espacio inicial de cada línea: se sangran aquí 11 px)
  say(msgs, onEnd, [x, y] = BUB) {
    this.pb = { msgs, i: 0, x, y, onEnd, writer: null }; this.pb.writer = this.pw(msgs[0]);
  }
  pw(msg) { const pb = this.pb, es = isES() && !/^ /.test(msg); return new PWriter(msg, pb.x + 25 + (es ? 11 : 0), pb.y + 10); }
  updatePB(inp) {
    const pb = this.pb; if (!pb) return;
    pb.writer.update();
    if (!pb.onEnd) return;
    if (inp.cancel) pb.writer.skip();
    else if (inp.confirm && pb.writer.done) {
      if (++pb.i < pb.msgs.length) pb.writer = this.pw(pb.msgs[pb.i]);
      else { this.pb = null; pb.onEnd(); }
    }
  }
  boxText(msg) { this.writer = new Writer(msg, BORDER[0][0], BORDER[0][2]); this.go('actText'); }
  isRed(k) { return k === 'red' || k === 'blueIntro'; }

  // ---------------------------------------------------------------- inicio
  startIntro() {
    const k = this.single && this.single.kind;
    if (this.single) this.music(this.isRed(k) ? 'papyrus' : 'bonetrousle', this.isRed(k) ? 0.5 : 0.8);
    else if (this.rematch) this.music('bonetrousle', 0.9);
    else this.music('papyrus', 0.5);
    if (this.single) this.startEnemyTurn(); else this.startMenu();
  }

  // ---------------------------------------------------------------- menús
  drawSubmenu(ctx) {
    const x = BORDER[0][0] + 20, y = BORDER[0][2] + 20, col = this.spareable() ? '#ff0' : '#fff';
    const line = (s, dx = 0, dy = 0, c = '#fff') => drawText(ctx, 'fnt_main', s, x + dx, y + dy, { mono: 16, color: c });
    const S = this.state;
    if (S === 'fightTarget' || S === 'actTarget') {
      line('   * ' + tr('Papyrus'), 0, 0, col);
      if (S === 'fightTarget') {                       // obj_battlecontroller Draw: barra en x = 190 + 16 * letras del nombre
        ctx.fillStyle = '#f00'; ctx.fillRect(302, 280, 101, 17);
        ctx.fillStyle = '#0f0'; ctx.fillRect(302, 280, Math.round(this.enemy.hp / this.enemy.maxHp * 100) + 1, 17);
      }
    }
    if (S === 'actList') { line('   * ' + tr('Check')); line('   * ' + tr('Flirt'), 256); line('   * ' + tr('Insult'), 0, 32); }   // SCR_TEXT 1025
    if (S === 'mercyList') line('   * ' + tr('Spare'), 0, 0, col);
    if (S === 'itemList') super.drawSubmenu(ctx);
    if (S === 'pChoice') {                             // "I can make spaghetti" / "I have zero redeeming qualities"
      T.choiceL.split('&').forEach((s, i) => line('   ' + s, 0, i * 32));
      T.choiceR.split('&').forEach((s, i) => line(s, 16 * 18, i * 32));
    }
  }
  updateSub(inp) {
    const S = this.state;
    if (S === 'fightTarget' && inp.confirm) { playSound('select'); this.target = new FistTarget(this); this.go('attack'); return; }
    if (S === 'actTarget' && inp.confirm) { playSound('select'); this.actPos = 0; this.go('actList'); return; }
    if (S === 'actList') {                             // Check (0) · Flirt (3) / Insult (1)
      if (inp.cancel) { this.go('actTarget'); return; }
      const p = this.actPos;
      if (inp.right && p === 0) { this.actPos = 3; playSound('squeak'); }
      else if (inp.left && p === 3) { this.actPos = 0; playSound('squeak'); }
      else if (inp.down && p === 0) { this.actPos = 1; playSound('squeak'); }
      else if (inp.up && p === 1) { this.actPos = 0; playSound('squeak'); }
      if (inp.confirm) { playSound('select'); this.doAct(this.actPos); }
      return;
    }
    if (S === 'mercyList' && inp.confirm) {           // scr_mercystandard: solo sirve cuando él ya te perdonó
      playSound('select'); this.whatiheard = -1;
      return this.spareable() ? this.startSpare() : this.startEnemyTurn();
    }
    super.updateSub(inp);
  }
  useItem(i) { this.usedItem = true; this.whatiheard = -1; super.useItem(i); }   // global.talked = 91
  itemText(key, msg) { return key === 'papyrus_nicecream' ? T.nice[Math.floor(Math.random() * 8)] : msg; }

  doAct(pos) {                                         // obj_papyrusboss Step (myfight == 2)
    this.whatiheard = pos; this.writer = null;
    const calm = this.truefight === 0 && !this.single;
    if (pos === 0) return this.boxText(T.check);
    if (pos === 1) {                                   // Insult
      if (this.insult <= 2 && calm) {
        const msgs = T.insult[Math.min(this.insult, 2)]; this.insult++;
        this.go('pActTalk'); this.say(msgs, () => this.startEnemyTurn());
        return;
      }
      return this.boxText(calm ? T.insultNo : T.insultBusy);
    }
    if (pos === 3) {                                   // Flirt
      this.hotcha++;
      if (this.hotcha <= 2 && calm) {
        SESSION.dated = 1;                             // global.flag[66] = 1
        this.go('pActTalk');
        if (this.hotcha === 2) this.say(T.flirt2, () => this.startEnemyTurn());
        else this.say(T.flirt1, () => { this.choice = 0; this.go('pChoice'); });
        return;
      }
      return this.boxText(calm ? T.flirtNo : T.flirtBusy);
    }
  }
  updateChoice(inp) {                                  // obj_battlecontroller myfight == 3 (global.talked = 6 + opción)
    if ((inp.left && this.choice === 1) || (inp.right && this.choice === 0)) { this.choice = 1 - this.choice; playSound('squeak'); }
    if (inp.confirm) {
      playSound('select'); this.whatiheard = 6 + this.choice; this.go('pActTalk');
      this.say(this.choice === 0 ? T.spaghetti : T.humility, () => this.startEnemyTurn());
    }
  }

  // ---------------------------------------------------------------- turno de Papyrus: lo que dice (Alarm_6)
  talkLine() {
    const hp = this.enemy.hp, w = this.whatiheard;
    let msg = T.dots, talkify = null;
    if (this.conversation === 0 && this.usedItem) msg = T.item;
    if (this.conversation === 0 && w === -1 && !this.usedItem) {   // el primer turno sin ACT ni objeto: ¡el ataque azul!
      talkify = [hp < this.prevhp ? T.serious : T.wontFight, T.blueAtk];
      this.conversation = 1; this.mycommand = -1;
    }
    if (hp <= 140 && this.fighto <= 14 && this.xfight < 4) { this.fighto = 14; this.xfight = 4; }
    if (hp <= 80 && this.fighto < 15) { this.fighto = 15; this.xfight = 0; }
    if (this.truefight === 1) {
      talkify = null;
      const hurt = this.hearthp2 < this.hearthp;
      if (T.f[this.fighto] !== undefined) msg = T.f[this.fighto];
      if (SESSION.dated && T.date[this.fighto] !== undefined) msg = T.date[this.fighto];
      if (this.fighto === 0 && hurt && this.xxtalk === 0) { msg = T.hint0; this.fighto = -1; this.xxtalk = 1; }   // lo repite
      if (this.fighto === 1 && hurt && this.xxtalk < 2) { msg = T.hint1; this.fighto = 0; this.xxtalk = 2; }
      if (this.fighto === 14) { const x = this.xfight; msg = T.special[x > 3 ? 4 : x > 2 ? 3 : x]; }
    }
    if (w > -1 && this.fighto < 0) {                   // responde a tu ACT (solo antes de empezar en serio)
      talkify = null;
      if (w === 0) msg = T.act.check;
      if (w === 1) msg = this.insult > 2 ? T.act.insult3 : this.insult === 2 ? T.act.insult2 : T.act.insult1;
      if (w === 3 || w === 6 || w === 7) msg = T.act.date;
    }
    return { msg, talkify };
  }

  startEnemyTurn() {                                   // mnfight = 1
    this.writer = null; this.pb = null;
    this.mycommand = Math.round(Math.random() * 100);
    const { msg, talkify } = this.single ? { msg: null, talkify: null } : this.talkLine();
    this.usedItem = false;
    this.setBorder(5);
    const h = this.heart; h.x = 309; h.y = 310; h.vs = 0; h.movement = 0; h.jumpstage = 0;
    this.go('pTalk'); this.talkify = !!talkify; this.talkMsg = talkify || [msg];
    this.alarm5 = this.single ? 12 : talkify ? -1 : 320;
  }

  // ---------------------------------------------------------------- turno de Papyrus: el ataque (Step, mnfight == 2, attacked == 0)
  plan() {
    if (this.single) return this.single.kind === 'f' ? { kind: 'f', f: this.single.f } : { kind: this.single.kind };
    if (this.truefight === 0) return { kind: this.mycommand === -1 ? 'blueIntro' : 'red' };
    if (this.fighto === 15) return { kind: 'final' };
    if (this.fighto === 14 && this.xfight > 3) return { kind: 'dog' };
    if (this.fighto === 14) {                          // 4 turnos esperando el ataque especial
      this.xfight++;
      if (this.mycommand < 20) return { kind: 'waveA' };
      if (this.mycommand < 40) return { kind: 'blueB' };
      return { kind: 'f', f: Math.floor(Math.random() * 11) + 2 };
    }
    if (this.fighto >= -1 && this.fighto <= 13) return { kind: 'f', f: this.fighto };
    return { kind: 'none' };                           // ya te perdonó: turnos vacíos
  }

  beginAttack() {
    this.pb = null; this.whatiheard = -1;
    this.turntimer = 4; this.bullets = []; this.gen = null; this.dog = null; this.dontcancel = 0;
    const p = this.plan(), k = p.kind, h = this.heart; this.turnKind = k;
    if (this.single) {
      this.soul = this.isRed(k) ? 'spr_heart' : 'spr_heartblue';
      if (k === 'blueIntro') this.music('papyrus', 0.5);
    }
    if (this.truefight === 1 || (this.single && !this.isRed(k))) {   // obj_heart.movement = 2: alma azul que cae
      this.soul = 'spr_heartblue'; h.movement = 2; h.vs = -1; h.jumpstage = 2;
    }
    const spawn = list => { for (const d of list) this.bullets.push(makeBullet(d)); };
    const xf = this.single ? 0 : this.xfight;
    if (k === 'red') {                                 // 3 huesos a alturas al azar (alma roja)
      this.turntimer = 140;
      for (const dx of [10, 90, 170]) spawn([['s', R + dx, -(20 + Math.round(Math.random() * 20)), -3]]);
    } else if (k === 'blueIntro') {
      this.turntimer = 300; this.gen = new BlueGen(this);
    } else if (k === 'dog') {                          // ¡el ataque especial! ... y un perro se lo come
      this.fighto = 15; this.xfight = 0; this.dontcancel = 1; this.setBorder(50);
      this.dog = new TobyDog(R, B - 40); this.later(80, () => this.dogTalk(0));
    } else if (k !== 'none') {
      const turn = TURNS[k === 'f' ? p.f : k];
      this.turntimer = turn.tt; spawn(turn.list);
      if (turn.speed) setSpeed(this.bullets, turn.speed);
      if (turn.xspeed && xf > 0) setSpeed(this.bullets, turn.xspeed);
      if (turn.after) spawn(turn.after);
      if (k === 'final') { this.dontcancel = 4; this.fighto = 16; }
      if (k === 'f' && !this.single) this.fighto = p.f + 1;
    }
    if (!this.single && this.xfight > 0 && this.fighto !== 15) this.fighto = 14;
    this.hearthp = this.player.hp;
    this.flavor = this.nextFlavor();
    h.prevX = h.x; h.prevY = h.y;
    this.go('pAttack');
  }
  nextFlavor() {                                       // global.msg[0] para el siguiente menú
    let s = this.flavor;
    if (this.mycommand >= 0) for (const [n, f] of T.flavors) if (this.mycommand >= n) s = f;
    if (SESSION.dated && !this.single) { this.flirt2++; if (this.flirt2 < 11) s = T.dateFlavors[this.flirt2 - 1]; }
    if (this.enemy.hp < 100) s = T.edge;
    if (this.spareable()) s = T.sparing;
    return s;
  }

  // Alarm_7: el perro se come el hueso especial
  dogTalk(n) {
    const d = this.dog; if (!d || this.state !== 'pAttack') return;
    if (n === 1) { d.spr = 'spr_tobydogsurprise'; d.frame = 0; d.speed = 0; }
    if (n === 2) d.frame = 1;
    if (n === 3) { d.spr = 'spr_tobydogscoot'; d.speed = 0.2; d.hs = 1; }
    if (n === 4) this.setBorder(5);
    if (n === 5) { this.flavor = T.regular; this.dog = null; this.dontcancel = 0; return; }
    this.say(T.dog[n], () => this.dogTalk(n + 1));
  }

  // Alarm_8: "WELL...! *HUFF* IT'S CLEAR... YOU CAN'T DEFEAT ME!!!" mientras la música se apaga poco a poco
  spareTalk() {
    let v = this.vol ?? 0.8;
    const fade = () => { if (this.pb && v > 0.01) { v -= 0.01; setMusicVolume(v); this.later(2, fade); } };
    this.say(T.spare, () => {
      setMusicVolume(0); this.vol = 0;
      this.dontcancel = 0; this.mercymod = 8000; this.flavor = T.sparing;
      this.enemy.def = -this.enemy.hp * 2;             // global.monsterdef = -monsterhp * 2: cualquier golpe lo mata
    });
    this.later(2, fade);
  }

  endTurn() {                                          // mnfight = 3
    this.hearthp2 = this.player.hp;
    const h = this.heart; h.vs = 0; h.jumpstage = 0; h.movement = 0;
    this.bullets = []; this.gen = null; this.dog = null; this.pb = null;
    this.startMenu();
  }

  // ---------------------------------------------------------------- el alma (obj_heart): roja (movement 1) o azul (movement 2)
  moveHeart(inp) {
    const h = this.heart, H = inp.held, sp = this.sp, [l, r, t, b] = this.ideal();
    h.prevX = h.x; h.prevY = h.y;
    if (h.movement !== 2) {                            // roja: 4 px por frame en las 4 direcciones
      if (H.up) h.y -= sp; if (H.down) h.y += sp; if (H.left) h.x -= sp; if (H.right) h.x += sp;
      h.x = Math.min(Math.max(h.x, l + 4), r - 16); h.y = Math.min(Math.max(h.y, t + 4), b - 16);
      return;
    }
    if (H.left) h.x -= sp; if (H.right) h.x += sp;    // Keyboard_37 / 39
    if (H.up && h.jumpstage === 1 && h.vs === 0) { h.jumpstage = 2; h.vs = -6; }   // Keyboard_38: salto
    if (h.jumpstage === 2) {                           // Step: gravedad por tramos; al soltar "arriba" el salto se corta
      if (!H.up && h.vs <= -1) h.vs = -1;
      if (h.vs > 0.5 && h.vs < 8) h.vs += 0.6;
      if (h.vs > -1 && h.vs <= 0.5) h.vs += 0.2;
      if (h.vs > -4 && h.vs <= -1) h.vs += 0.5;
      if (h.vs <= -4) h.vs += 0.2;
    }
    h.y += h.vs;
    if (h.x < l + 4) h.x = l + 4; if (h.x > r - 16) h.x = r - 16;
    if (h.y < t + 4) { h.y = t + 4; if (h.vs < 0) h.vs = 0; }
    if (h.y > b - 16) { h.y = b - 16; if (h.vs > 0) h.vs = 0; h.jumpstage = 1; }
  }

  // ---------------------------------------------------------------- golpes (blt_sizebone Other_11)
  boneHit(o) {
    if (o.active !== 1 || this.state !== 'pAttack') return;
    const h = this.heart, moved = Math.abs(h.prevX - h.x) > 0.01 || Math.abs(h.prevY - h.y) > 0.01;
    if (o.blue && !moved) return;                      // scr_blueat: los azules solo dañan si te mueves
    if (this.invc >= 1) return;
    const p = this.player;
    let amt = Math.max(3, Math.round(o.dmg - (p.df + p.armor.def) / 5));   // nunca menos de 3
    if (!this.single && this.fighto > 13) { if (p.hp < 10) amt--; if (p.hp < 5) amt--; }
    p.hp -= amt; this.invc = 60;                       // global.invc = global.inv * 3
    playSound('hurt'); this.shake = 2;
    if (p.hp > 0) { o.dead = true; return; }
    this.capture(o);
  }
  capture(o) {                                         // PV a 0: Papyrus no mata, te CAPTURA
    this.player.hp = 1; this.invc = 50;
    this.turntimer = 300; this.dontcancel = 1; o.hs = 0;
    for (const b of this.bullets) { b.active = 2; b.visible = false; }
    this.gen = null; this.dog = null; this.heart.vs = 0; this.pb = null; this.jobs = [];
    const idx = Math.min(SESSION.captures, 2);
    if (!this.single) SESSION.captures++;
    let v = this.vol ?? 0.8;
    const fade = () => { if (v > 0.01) { v -= 0.01; setMusicVolume(v); this.later(1, fade); } else stopMusic(); };
    this.later(2, fade);                               // Alarm_2/3: la música se apaga
    this.later(42, () => this.say(T.capture[idx], () => {    // Alarm_4/5: "YOU'RE TOO WEAK!! I WAS EASILY ABLE TO CAPTURE YOU!!!"
      this.go('pCaptured'); stopMusic(); this.fadeSpeed = 1 / 30; this.fade = 0.001;   // obj_unfader
      this.later(50, () => this.exit());               // Alarm_6: te lleva a la sala (aquí, a la lista del jefe)
    }));
  }

  // ---------------------------------------------------------------- tus golpes (obj_papyrusboss Alarm_3 y Step, hurtanim)
  enemyTake(d) { return d; }
  missPos() { return [PX + PW / 2 - 48, PY - 24]; }
  onStrike(dmg) {
    if (dmg === null) {
      const [mx, my] = this.missPos();
      this.dmgw = new DmgWriter(this, 0, mx, my, 30);
      this.later(1, () => this.startEnemyTurn());
      return;
    }
    const take = this.enemyTake(dmg);
    this.later(10, () => {                             // global.damagetimer = 10 con el guante
      this.prevhp = this.enemy.hp;
      this.dmgw = new DmgWriter(this, take, PX, PY + 150, 0);
      playSound('damage');
      if (this.enemy.hp - take <= 0) stopMusic();
      this.hurt = { shudder: 16, t: 0 };
      this.hurtDone = () => {                          // hurtanim == 2: se aplica el daño
        this.enemy.hp = Math.max(0, this.enemy.hp - take); this.dmgw.life = 15; this.hurt = null; this.pxoff = 0;
        if (this.enemy.hp >= 1) this.startEnemyTurn(); else this.startKill();
      };
    });
  }
  updateHurt() {                                       // x += shudder cada 2 frames: 16, -16, 14, -14 ... hasta 0
    const u = this.hurt; if (!u || ++u.t % 2) return;
    this.pxoff += u.shudder;
    u.shudder = u.shudder < 0 ? -(u.shudder + 2) : -u.shudder;
    if (u.shudder === 0) this.hurtDone();
  }

  // ---------------------------------------------------------------- final: lo matas (Other_13 + Alarm_10, obj_papyrusdeadhead/body)
  startKill() {
    this.go('pKill'); this.setBorder(0); this.hidden = true; stopMusic();
    const hd = { x: PX + 41, y: PY, ys: PY, hs: 0, vs: 0, g: 0, c: 0 };
    this.corpse = { head: hd, body: true };
    this.later(30, () => {
      hd.c = 1; hd.hs = 1.5; hd.g = 0.2; hd.vs = -1;  // la cabeza se cae del cuerpo
      this.later(60, () => this.say(T.alas, () => {
        this.corpse.body = false; playSound('vaporized');
        this.corpse.bodyVapor = new Vapor({ x: PX, y: PY }, SPR.spr_papyrusboss_body.frames[0]);
        this.later(30, () => {
          hd.c = 5; hd.g = 0.2;                        // y cae un poco más
          this.later(80, () => this.say(T.head, () => {
            this.later(100, () => {                    // +200 EXP y la cabeza también se hace polvo
              hd.gone = true; playSound('vaporized');
              this.corpse.headVapor = new Vapor({ x: hd.x - 2, y: hd.y - 2 }, SPR.spr_papyrusboss_head.frames[0]);
              this.later(150, () => { this.fadeSpeed = 1 / 30; this.fade = 0.001; this.later(45, () => this.exit()); });
            });
          }, [PX + 145, PY + 104]));
        });
      }));
    });
  }
  updateCorpse() {
    const c = this.corpse; if (!c) return;
    const h = c.head;
    if (h.c === 1 || h.c === 5) {
      h.vs += h.g; h.x += h.hs; h.y += h.vs;
      if (h.c === 1 && h.y > h.ys + 70) { h.hs = 0; h.vs = 0; h.g = 0; h.c = 3; }
      if (h.c === 5 && h.y > h.ys + 135) { h.vs = 0; h.g = 0; h.c = 6; }
    }
    if (c.bodyVapor) c.bodyVapor.update();
    if (c.headVapor) c.headVapor.update();
  }

  // ---------------------------------------------------------------- final: lo perdonas (event_user 2: fundido y a la sala)
  startSpare() {
    this.go('pSpare'); this.writer = null; stopMusic();
    this.fadeSpeed = 1 / 30; this.fade = 0.001;
    this.later(45, () => this.exit());
  }
  exit() { if (this.onExit) { const f = this.onExit; this.onExit = null; f(); } }

  // ---------------------------------------------------------------- bucle
  update(inp) {
    super.update(inp);
    const S = this.state;
    if (this.fade > 0) this.fade = Math.min(1, this.fade + this.fadeSpeed);
    this.updateHurt();
    this.updateCorpse();
    for (const f of this.fx) f.update(this); this.fx = this.fx.filter(f => !f.dead);
    if (this.pressZ) { this.pressZ.t++; if (this.pressZ.hide > 0) this.pressZ.hide--; }
    if (S === 'pActTalk' || S === 'pKill') this.updatePB(inp);
    if (S === 'pChoice') this.updateChoice(inp);
    if (S === 'pTalk') this.updateTalk(inp);
    if (S === 'pAttack') this.updateAttack(inp);
  }

  updateTalk(inp) {                                    // Alarm_6 (a los 2 frames) y Alarm_5 (320 frames o Z)
    if (this.timer === 2 && !this.single) this.say(this.talkMsg, this.talkify ? () => this.beginAttack() : null);
    this.updatePB(inp);
    if (this.talkify) return;
    const [l] = this.ideal();
    if (inp.confirm && this.alarm5 > 5 && this.box.l === l && this.pb) this.alarm5 = 2;
    if (--this.alarm5 <= 0) this.beginAttack();
  }

  updateAttack(inp) {
    this.turntimer--;
    if (this.gen) this.gen.update();
    if (this.dog) this.dog.update();
    this.updatePB(inp);
    this.moveHeart(inp);
    for (const o of this.bullets) { if (o.step) o.step(); o.x += o.hs; }
    const list = this.bullets;
    for (const o of list) if (!o.dead && o.active === 1) o.post(this, list, inp.held);
    for (const o of list) if (this.turntimer < 0 && o.active === 1) o.dead = true;       // Step_2
    this.bullets = this.bullets === list ? list.filter(o => !o.dead) : this.bullets;
    if (this.turntimer < 3 && this.dontcancel === 4) {                                   // se acabó el último ataque: se rinde
      this.dontcancel = 5;
      if (this.single) this.dontcancel = 0; else this.spareTalk();
    }
    if (this.turntimer < 3 && this.dontcancel === 0) this.endTurn();
  }

  // ---------------------------------------------------------------- dibujo
  drawEnemy(ctx) {
    const c = this.corpse;
    if (c) {
      if (c.body) drawSprite(ctx, 'spr_papyrusboss_body', 0, PX, PY);
      if (c.bodyVapor) c.bodyVapor.draw(ctx);
      if (!c.head.gone) drawSprite(ctx, 'spr_papyrusboss_head', 0, c.head.x, c.head.y);
      if (c.headVapor) c.headVapor.draw(ctx);
      return;
    }
    if (this.hidden) return;
    if (this.hurt) drawSprite(ctx, 'spr_papyrusboss', 1, PX + this.pxoff, PY);          // image_index = 1 (herido)
    else drawSprite(ctx, 'spr_papyrusboss_anim', 0, PX, PY, { xs: 2, ys: 2 });          // obj_papyrusbody
  }
  drawField(ctx) {
    super.drawField(ctx);
    if (this.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${this.fade})`; ctx.fillRect(0, 0, 640, 480); }
  }
  drawExtra(ctx) {
    if (this.bullets.length || this.dog) {
      if (isES()) coolDudeEs();
      clipBox(ctx, this);
      if (this.dog) this.dog.draw(ctx);
      for (const o of this.bullets) o.draw(ctx, this);
      ctx.restore();
    }
    const pz = this.pressZ;
    if (pz && !pz.hide && (pz.t < 3 || (pz.t - 3) % 9 >= 3)) {                          // obj_pressZ parpadea
      if (isES()) pressEs();
      drawSprite(ctx, sprL('spr_pressz_press'), 0, PX + PW / 2, PY + 104); drawSprite(ctx, 'spr_pressz_z', 0, PX + PW / 2, PY + 104);
    }
    for (const f of this.fx) f.draw(ctx);
    if (this.pb) { drawSprite(ctx, 'spr_blconwdshrt', 0, this.pb.x, this.pb.y); this.pb.writer.draw(ctx); }
  }
  drawHeart(ctx) {
    const S = this.state;
    if (S === 'pTalk' || S === 'pAttack' || S === 'pCaptured') {
      this.hx = Math.round(this.heart.x); this.hy = Math.round(this.heart.y);
      drawSprite(ctx, this.soul, Math.floor(this.heartFrame), this.hx, this.hy); return;
    }
    if (S === 'actList') { drawSprite(ctx, this.soul, 0, 72 + (this.actPos >= 3 ? 256 : 0), 278 + (this.actPos % 3) * 32); return; }
    if (S === 'pChoice') { drawSprite(ctx, this.soul, 0, BORDER[0][0] + 32 + this.choice * 252, BORDER[0][2] + 92); return; }
    if (S === 'pActTalk' || S === 'pKill' || S === 'pSpare') return;
    super.drawHeart(ctx);
  }
}

// ---------------------------------------------------------------- obj_blueattackgen: huesos azules con el alma roja... y luego te vuelve azul
class BlueGen {
  constructor(b) { this.b = b; this.a = [20, -1, -1, -1, -1, -1]; this.vol = 1; this.basevol = b.vol ?? 0.5; }
  update() {
    const a = this.a;
    for (let i = 0; i < a.length; i++) if (a[i] > 0 && --a[i] <= 0) { a[i] = -1; this['alarm' + i](); if (this.b.gen !== this) return; }
  }
  alarm0() {                                           // cada 5-25 frames un hueso azul (arriba o abajo) y el turno se alarga
    const b = this.b;
    if (b.turntimer < 600) {
      const rsize = Math.random() * 70, top = Math.random() < 0.5;
      b.bullets.push(new Bone(top, R + 20, top ? TOP + 40 + rsize : B - (40 + rsize), -3 - Math.random() * 3, { blue: 1, dmg: 1 }));
      this.a[0] = Math.ceil(5 + Math.random() * 20);
    } else this.a[1] = 20;
    b.turntimer += 37;
  }
  alarm1() { this.a[3] = 2; this.a[2] = 100; }
  alarm3() {                                           // la música se apaga
    this.vol -= 0.05; setMusicVolume(this.basevol * this.vol);
    if (this.vol < 0.06) stopMusic(); else this.a[3] = 2;
  }
  alarm2() {                                           // ¡azul! (snd_bell) y cae
    const h = this.b.heart; h.movement = 2; h.jumpstage = 2; h.vs = -2;
    playSound('bell'); this.b.soul = 'spr_heartblue'; this.a[4] = 2;
  }
  alarm4() {                                           // ya en el suelo: un hueso rápido desde tu lado
    const b = this.b, h = b.heart;
    if (h.y > B - 60) {
      if (h.x > (L + R) / 2) b.bullets.push(new Bone(false, R + 10, B - 20, -6)); else b.bullets.push(new Bone(false, L - 10, B - 20, 6));
      this.a[5] = 2;
    } else this.a[4] = 2;
  }
  alarm5() {                                           // cuando lo esquivas: "YOU'RE BLUE NOW."
    const b = this.b;
    if (!b.bullets.some(o => o instanceof Bone) && b.invc < 1) {
      b.dontcancel = 1;
      b.say(T.blueSpeech, () => {                      // Alarm_6: empieza "Bonetrousle"
        if (!b.single) b.truefight = 1;
        b.music('bonetrousle', 0.8);
        b.turntimer = 2; b.flavor = T.blueNow; b.dontcancel = 0; b.gen = null;
      });
    } else this.a[5] = 2;
  }
}
