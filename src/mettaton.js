import { drawSprite, drawText, playSound, playMusic, stopMusic, setMusicVolume } from './assets.js';
import { Battle, BORDER } from './battle.js';
import { Writer } from './text.js';
import { rotBBox } from './gm.js';
import { MettBody, Ratings } from './mettbody.js';
import { MettGen, Shot, Essay } from './mettbullets.js';

// ============================================================================
//  Mettaton EX (obj_mettatonex). Música: "Death by Glamour" (mus_mettaton_ex.ogg, tono 0.97).
//  Alma amarilla: Z dispara hacia arriba durante su turno. Sube los RATINGS para que
//  el público llame al programa (final pacífico) o bájale la vida a 0.
// ============================================================================

// Ataques sueltos (global.attacktype). "Happy Breaktime" y "Heart-to-Heart" salen en el juego; el resto son inventados.
export const METT_ATTACKS = [
  ['Leg Sweep', 30], ['Umbrella Bombs', 31], ['Leg Traffic', 32], ['Arm Barrier', 33], ['Essay Question', 34],
  ['Heart-to-Heart', 35], ['Parasol Rain', 36], ['Disco Ball', 37], ['Bomb Squad', 39], ['Happy Breaktime', 41],
  ['Heart Shield', 42], ['Rewind', 43], ['Box Rush', 45], ['Heart Bombs', 48], ['Final Heart', 49], ['Bomb Alley', 53],
  ['Lightning Parasols', 54],
].map(([name, type]) => ({ name, type }));
const SINGLE_BORDER = { 34: 0, 43: 27, 44: 27, 56: 27, 39: 26, 40: 26, 47: 26, 53: 26 };
const HEART_TYPES = [35, 42, 48, 49];

const MTT = ['mtt1', 'mtt2', 'mtt3', 'mtt4', 'mtt5', 'mtt6', 'mtt7', 'mtt8', 'mtt9'];
const TYPER = {                                    // SCR_TEXTTYPE
  51: { font: 'fnt_plain', color: '#000', ox: 20, oy: 16, hspace: 8, vspace: 18, speed: 3, shake: 0, sound: MTT },
  53: { font: 'fnt_plain', color: '#000', ox: 20, oy: 10, hspace: 8, vspace: 18, speed: 4, shake: 1.5, sound: MTT },
  54: { font: 'fnt_plain', color: '#000', ox: 20, oy: 10, hspace: 8, vspace: 18, speed: 7, shake: 0, sound: MTT },
  92: { font: 'fnt_plain', color: '#fff', ox: 0, oy: 0, hspace: 9, vspace: 20, speed: 1, shake: 0, sound: 'txtmuffet' },
};

// Textos (textdata_en, obj_mettatonex / obj_essaystuff)
const T = {
  intro: '* Mettaton EX makes his premiere!',
  check: '* METTATON EX - ATK 47 DEF 47&* His weak point is his&  heart-shaped core./^',
  boast: ["* You say you aren't going&  to get hit at ALL./", "* Ratings gradually increase&  during Mettaton's turn./^"],
  heel: ['* You turn and scoff at the&  audience./', "* They're rooting for your&  destruction this turn!/^"],
  pose: ['* You posed dramatically^1.&* The audience nods./^', '* Despite being hurt^1, you&  posed dramatically^1.&* The audience applauds./^',
         '* Despite being wounded^1, you&  posed dramatically^1.&* The audience gasps./^', '* With the last of your power^1,&  you pose dramatically^1.&* The audience screams./^'],
  flav: ['* Mettaton.', '* Mettaton.', '* Mettaton.', '* Mettaton.', '* Smells like Mettaton.'], lowhp: '* Mettaton has low HP.',
  essaySaved: '* Mettaton is saving your&  essay for future use.',
  // [textsize, mensajes] por turno (Alarm_6)
  talk: {
    1: [0, ['Lights!&Camera!&Action!/%%']], 2: [0, ['Drama!&Romance!&Blood-&shed!/%%']], 3: [0, ["I'm the&idol&everyone&craves!/%%"]],
    4: [0, ['Smile&for the&camera!/%%']],
    5: [1, ["Oooh, it's time&for a pop quiz!/", 'I hope you brought&a keyboard.../', "This one's an&essay question!/%%"]],
    6: [1, ['Your essay really&showed everyone&your heart./', "Why don't I show&you mine?/%%"]], 7: [0, ["Ooooh,&I'm just&warming&up!/%%"]],
    8: [1, ['But how are you&on the dance floor!?/%%']], 9: [0, ['Can you&keep up&the&pace!?/%%']], 10: [0, ['Lights!&Camera&Bombs!/%%']],
    11: [0, ['Things&are&blowing&up!/%%']], 12: [1, ['Time for our union-&regulated break!/%%']],
    13: [1, ["We've grown so&distant, darling.../", 'How about another&heart-to-heart?/%%']],
    14: [1, ['A.. arms?&Wh... who needs arms&with legs like&these?/', "I'm still going&to win!/%%"]], 15: [0, ['Come on&...!/%%']],
    16: [0, ['The show&...&must go&on!/%%']], 17: [0, ['Dr...&Drama!&A...&Action!/%%']],
    18: [1, ['\\E5L... lights...&C... camera.../', 'Enough of this!&Do you really want&humanity to perish!?/', '\\E7... or do you just&believe in yourself&that much?/%%']],
    19: [1, ['Haha, how inspiring!/', "Well, darling!&It's either me&or you!/", "\\E4But I think we both&already know who's&going to win./", "\\E8Witness the true&power of humanity's&star!/%%"]],
    20: [1, ['... then.../', '\\E8Are YOU the star?/', 'Can you really&protect humanity!?/%%']],
  },
  kill: ['H.. ha.../', 'So I was wrong./', 'Darling.../', '\\E1You really are&strong enough to&get past ASGORE./', '\\E0Well then.../', "It's time for&you to go./",
         "\\E0Don't worry about&me./", "I might seem like&I'm dying now^1,&but.../", '\\E1Dr. Alphys can&always repair me./', '\\E0And... besides.../',
         "Even if I'm not&cut out to be&a star.../", "\\E1I still got to&perform for a&human, didn't I?/", 'So, thank you,&darling.../%%'],
  kill2: ["\\E1You've been a&great audience!/%%"],
  call1: ['OOH^1, LOOK AT&THESE RATINGS!!!/', "\\E6THIS IS THE MOST&VIEWERS I'VE EVER&HAD!!!/", "WE'VE REACHED THE&VIEWER CALL-IN&MILESTONE!/",
          '\\E8ONE LUCKY VIEWER&WILL HAVE THE CHANCE&TO TALK TO ME.../', '\\E7... BEFORE I LEAVE&THE UNDERGROUND&FOREVER!!/', "\\E9LET'S SEE WHO&CALLS IN FIRST!/%%"],
  call2: ["\\E0HI^1, YOU'RE ON TV!/", 'WHAT DO YOU HAVE&TO SAY ON THIS^1,&OUR LAST SHOW???/%%'],
  blook: ['...../', 'oh......../', '\\E1hi..^1.&mettaton.../', 'i really liked&watching your show.../', 'my life is pretty&boring..^1. but.../',
          'seeing you on the&screen..^1. brought&excitement to my&life..^1. vicariously/', "i can't tell^1, but..^1.&i guess this is&the last episode...?/",
          "\\E3i'll miss you..^1.&mettaton....../", "... oh...^1. i didn't&mean to talk so&long.../", '\\E2oh........../%%'],
  call3: ['NO^1, WAIT^1!&WAIT^1, BL.../', '\\E1H..^1.&THEY ALREADY HUNG&UP./', '\\E3.../', "\\E0I'LL TAKE ANOTHER&CALLER!!!/%%"],
  fans: [[530, 200, 420, '\\E1Mettaton^1, your show&made us so happy!/%%'], [560, 200, 450, "Mettaton^1, I don't&know what I'll&watch without you./%%"],
         [520, 200, 410, "Mettaton^1, there's&a Mettaton-shaped&hole in my Mettaton-&shaped heart./%%"]],
  farewell: ['\\E3AH..^1. I.../', 'I SEE.../', '\\E4.../', 'EVERYONE..^1.&THANK YOU SO MUCH./', '.../', '\\E0DARLING./',
             '\\E1PERHAPS..^1. IT MIGHT BE&BETTER IF I STAY&HERE FOR A WHILE./', '\\E2HUMANS ALREADY HAVE&STARS AND IDOLS^1,&BUT MONSTERS.../',
             '\\E0THEY ONLY HAVE ME./', '\\E1IF I LEFT..^1.&THE UNDERGROUND WOULD&LOSE ITS SPARK./', "\\E3I'D LEAVE AN ACHING&VOID THAT CAN NEVER&BE FILLED./",
             "\\E0SO..^1. I THINK I'LL&HAVE TO DELAY MY&BIG DEBUT./", '\\E2BESIDES./', "\\E1YOU'VE PROVEN TO&BE VERY STRONG./",
             '\\E0PERHAPS..^1. EVEN STRONG&ENOUGH TO GET PAST&ASGORE./', "\\E0I'M SURE YOU'LL BE&ABLE TO PROTECT&HUMANITY./", '\\E4HA^1, HA.../',
             "IT'S ALL FOR THE&BEST^1, ANYWAY./", "\\E3THE TRUTH IS^1, THIS&FORM'S ENERGY&CONSUMPTION IS.../", 'INEFFICIENT./',
             "IN A FEW MOMENTS^1,&I'LL RUN OUT OF&BATTERY POWER^1, AND.../", '\\E4WELL./', "\\E0I'LL BE ALRIGHT./", "\\E5KNOCK 'EM DEAD^1,&DARLING./",
             '\\E0AND EVERYONE..^1.&THANK YOU./', "YOU'VE BEEN A&GREAT AUDIENCE!/%%"],
};
const MX = 210, MY = 60;                           // obj_mettatonex (scr_battlegroup)
const BORDERS = { 0: [32, 602, 250, 385], 24: [235, 405, 250, 385], 26: [295, 345, 250, 385], 27: [270, 370, 250, 385] };

export class MettatonBattle extends Battle {
  constructor(single = null) { super(single); }

  reset() {
    super.reset();
    this.enemy = { hp: 1600, maxHp: 1600, atk: 8, def: 1, x: MX, y: MY, wd: 200 };   // scr_monstersetup tipo 51
    this.body = new MettBody(240, 116);
    this.rat = new Ratings(this);
    this.soul = 'spr_heartyellow_flip'; this.flavor = T.intro;
    this.turns = 0; this.specialdam = [0, 0, 0]; this.shots = []; this.charge = 0; this.canShoot = true;
    this.mycommand = 0; this.gen = null; this.essay = null; this.mb = null; this.fans = []; this.narrow = false;
    this.bossHeart = null; this.heartBurst = null; this.prev = { x: 0, y: 0 }; this.actPos = 0; this.typing = false;
  }

  // ---------------------------------------------------------------- ganchos de la base
  startIntro() { playMusic('mettaton', 0.97); if (this.single) this.startEnemyTurn(); else this.startMenu(); }
  ideal() {
    const b = BORDERS[this.border] || BORDER[this.border];
    return this.narrow ? [b[0], b[0] + 50, b[2], b[3]] : b;
  }
  menuTime() { return ['menu', 'fightTarget', 'actTarget', 'actList', 'mercyList', 'itemList'].includes(this.state); }
  missPos() { return [MX + 100 - 48, MY - 24]; }
  dmgPos() { return [MX, MY + 100]; }
  onEnemyHit() {                                   // Alarm_3
    playSound('damage'); this.body.shake = 8; this.body.shakeRate = 2;
    if (this.enemy.hp > this.enemy.maxHp / 2 && this.turns <= 12) { this.body.pause = 1; this.later(11, () => playSound('yeah')); }
    else this.body.pause = 2;
    if (this.rat.active) this.rat.add(4);          // "Action"
  }
  afterEnemyDamage() { this.body.pause = 0; if (this.enemy.hp < 1) this.killEnding(); else this.startEnemyTurn(); }
  heartMoved() { return Math.abs(this.prev.x - this.heart.x) > 0.01 || Math.abs(this.prev.y - this.heart.y) > 0.01; }

  // Daño de las balas (obj_metttestbulletparent Other_21)
  mettHurt() {
    if (this.invc > 0 || this.state === 'gameover') return;
    const hp = this.player.hp; let dmg;
    if (!this.bossHeart) {
      const t = this.gen && this.gen.type;
      if (t === 37) this.specialdam[0]++; if (t === 39) this.specialdam[1]++; if (t === 43) this.specialdam[2]++;
      dmg = hp >= 30 ? 10 : hp >= 20 ? 9 : hp >= 5 ? 8 : 6;
    } else if (this.bossHeart.n !== 4) dmg = hp >= 30 ? 9 : hp >= 20 ? 8 : hp >= 12 ? 7 : hp >= 4 ? 6 : 5;
    else dmg = hp >= 24 ? 9 : hp >= 16 ? 8 : hp >= 8 ? 7 : hp >= 3 ? 6 : 5;
    this.hurtPlayer(dmg);
    if (this.state === 'gameover' && this.gen) { this.gen.stopSounds(); this.gen = null; }
  }

  // ---------------------------------------------------------------- ACT: Check / Boast / Pose / Heel Turn (SCR_TEXT_6504)
  drawSubmenu(ctx) {
    const x = BORDER[0][0] + 20, y = BORDER[0][2] + 20, line = (s, dx = 0, dy = 0) => drawText(ctx, 'fnt_main', s, x + dx, y + dy, { mono: 16 });
    if (this.state === 'fightTarget' || this.state === 'actTarget') {
      line('   * Mettaton EX');
      if (this.state === 'fightTarget') {
        const bx = x + 16 * 17, w = 101, hp = Math.ceil(this.enemy.hp / this.enemy.maxHp * w);
        ctx.fillStyle = '#f00'; ctx.fillRect(bx, y + 5, w, 17); ctx.fillStyle = '#0f0'; ctx.fillRect(bx, y + 5, hp, 17);
      }
    }
    if (this.state === 'actList') { line('   * Check'); line('   * Boast', 256); line('   * Pose', 0, 32); line('   * Heel Turn', 256, 32); }
    if (this.state === 'mercyList') line('   * Spare');
    if (this.state === 'itemList') super.drawSubmenu(ctx);
  }
  updateSub(inp) {
    if (this.state === 'actList') {
      if (inp.cancel) { this.go('actTarget'); return; }
      const col = Math.floor(this.actPos / 3), row = this.actPos % 3;
      if ((inp.right && col === 0) || (inp.left && col === 1)) { this.actPos = (1 - col) * 3 + row; playSound('squeak'); }
      if ((inp.down && row === 0) || (inp.up && row === 1)) { this.actPos = col * 3 + (1 - row); playSound('squeak'); }
      if (inp.confirm) { playSound('select'); this.doAct(this.actPos); }
      return;
    }
    if (this.state === 'actTarget' && inp.confirm) { playSound('select'); this.actPos = 0; this.go('actList'); return; }
    if (this.state === 'mercyList' && inp.confirm) { playSound('select'); this.startEnemyTurn(); return; }
    super.updateSub(inp);
  }
  doAct(pos) {
    const p = this.player;
    if (pos === 0) return this.boxMsgs([T.check]);
    if (pos === 3) { this.rat.boastmode = 1; return this.boxMsgs(T.boast); }
    if (pos === 1) {
      let m = T.pose[0];
      if (p.hp <= p.maxHp / 2) m = T.pose[1]; if (p.hp < p.maxHp / 4) m = T.pose[2]; if (p.hp <= 3) m = T.pose[3];
      this.rat.add(11); return this.boxMsgs([m]);
    }
    if (pos === 4) { this.rat.heel = 1; return this.boxMsgs(T.heel); }
  }
  boxMsgs(msgs, onEnd = () => this.startEnemyTurn()) {
    this.msgQueue = { msgs, i: 0, onEnd };
    this.writer = new Writer(msgs[0], BORDER[0][0], BORDER[0][2]);
    this.go('mBoxText');
  }

  // ---------------------------------------------------------------- globos de diálogo de Mettaton
  // kind 0: obj_blconsm en (x+200, y); kind 1: globo ancho; kind 'x': scr_blcon_x(x+180, y+20)
  talk(msgs, kind, typer, onEnd) {
    let spr, bx, by, wx, wy;
    if (kind === 0) { spr = 'spr_blconsm'; bx = MX + 200; by = MY; wx = bx + 10; wy = by - 10; }
    else if (kind === 1) { spr = 'spr_blconwdshrt'; bx = MX + 200; by = MY; wx = bx + 20; wy = by - 10; }
    else { spr = 'spr_blconwdshrt'; bx = MX + 180; by = MY + 20; wx = bx + 30; wy = by + 10; }
    this.mb = { msgs, i: 0, spr, bx, by, wx, wy, typer, onEnd };
    this.newMb();
  }
  newMb() {
    const m = this.mb;
    m.writer = new Writer(m.msgs[m.i], m.wx, m.wy, { ...TYPER[m.typer], onFace: n => { this.body.faceemotion = n; } });
    m.stringno = m.i;
    if (m.onLine) m.onLine(m.i);
  }
  updateMb(inp) {
    const m = this.mb; if (!m) return;
    m.writer.update();
    if (inp.cancel) m.writer.skip();
    else if (inp.confirm && m.writer.done) {
      if (++m.i < m.msgs.length) this.newMb();
      else { this.mb = null; m.onEnd(); }
    }
  }

  // ---------------------------------------------------------------- turno de Mettaton
  startEnemyTurn() {                               // mnfight = 1
    this.writer = null;
    const r = this.rat.ratings;
    if (!this.single && ((this.turns >= 19 && r >= 10000) || (this.turns < 19 && r >= 12000))) return this.callInEnding();
    const B = this.body;
    let msgs = null, kind = 0;
    if (this.single) {
      this.setBorder(SINGLE_BORDER[this.single.type] ?? 24);
      if (HEART_TYPES.includes(this.single.type)) B.open();
    } else {                                       // Alarm_6
      const t = ++this.turns;
      this.mycommand = Math.round(Math.random() * 100);
      [kind, msgs] = T.talk[t] || [0, ['.../%%']];
      const dw = { 6: 20, 7: 18, 8: 15, 9: 12, 10: 9, 11: 6, 12: 3, 13: 60, 14: 80, 15: 120, 16: 180, 17: 240 }[t];
      if (dw) B.dancewait = dw;
      if (t >= 14 && t <= 17) { B.face_set = 1; B.faceemotion = 8; }
      if (t === 18 || t === 19) { B.face_set = 1; B.faceemotion = 5; B.dance = -1; }
      if (t === 20) { B.face_set = 1; B.faceemotion = 7; B.dance = -1; }
      let border = 24;
      if ([14, 15, 23].includes(t)) border = 27;
      if ([10, 11, 18, 24].includes(t)) border = 26;
      if ([6, 13, 19, 20, 25].includes(t)) B.open();
      if (t === 5) border = 0;
      this.setBorder(border);
    }
    const [l, r2, t2, b2] = this.ideal();
    this.heart = { x: Math.round((l + r2) / 2) - 8, y: Math.round((t2 + b2) / 2) - 8 };
    this.go('mTalk');
    if (msgs) this.talk(msgs, kind, 51, () => this.beginAttack());
    else this.later(12, () => this.beginAttack());
  }

  beginAttack() {                                  // mnfight = 2
    this.turntimer = 10;
    let type;
    if (this.single) type = this.single.type;
    else {
      type = 29 + this.turns;
      if (type === 54) { this.turns -= 5; type = 49; }
      if (type >= 50) {
        if (this.enemy.def >= -10) this.enemy.def -= 5;
        type = { 50: 38, 51: 54, 52: 56 }[type] ?? type;
      }
    }
    const m = this.mycommand;
    this.flavor = T.flav[m >= 90 ? 4 : m >= 75 ? 3 : m >= 50 ? 2 : m >= 25 ? 1 : 0];
    if (this.enemy.hp <= this.enemy.maxHp / 4) this.flavor = T.lowhp;
    this.shots = []; this.charge = 0;
    this.gen = new MettGen(this, type); this.attack = this.gen;
    this.prev = { ...this.heart };
    this.go('mAttack');
  }

  endTurn() {                                      // mnfight = 3
    if (this.gen) this.gen.stopSounds();
    this.gen = null; this.attack = null; this.essay = null; this.shots = []; this.narrow = false; this.bossHeart = null; this.typing = false;
    this.startMenu();
  }

  startEssay() { this.essay = new Essay(this); this.attack = null; this.setBorder(0); this.go('mEssay'); }
  essayDone({ msg, pts }) {                        // obj_essaystuff con 1 -> 4
    this.rat.essay = pts; this.rat.add(12);
    this.talk(msg, 1, 51, () => { this.flavor = T.essaySaved; this.endTurn(); });
  }

  // ---------------------------------------------------------------- finales
  killEnding() {                                   // con 50...59: "H.. ha... So I was wrong."
    this.go('mEnd'); this.killedMett = true; stopMusic();
    if (this.gen) this.gen.stopSounds(); this.gen = null; this.attack = null; this.dmgw = null; this.rat.active = 0;
    Object.assign(this.body, { hurt: 2, sineron: 0, pause: 3, dsf: 0.5, faceemotion: 0 });
    this.setBorder(0);
    this.later(30, () => this.talk(T.kill, 'x', 53, () => {
      this.dsfFade = 45;                           // con 54: deja de temblar poco a poco
      this.later(45, () => { this.body.dsf = 0; this.talk(T.kill2, 'x', 54, () => {
        this.body.fadewhite = 1;
        this.later(2, () => { playSound('explosion'); this.player.lv = Math.max(this.player.lv, 12); });   // +800 EXP
      }); });
    }));
  }
  callInEnding() {                                 // con 90...105: llamada de los espectadores
    this.go('mEnd'); this.setBorder(0);
    this.body.faceemotion = 0; this.body.endface = 1; this.dmgw = null;
    this.musicVol = 1;
    this.talk(T.call1, 'x', 51, () => {                // mientras habla, la música baja (con 91)
      this.musicVol = null; stopMusic(); playSound('phone');
      this.later(50, () => this.talk(T.call2, 'x', 51, () => {
        playMusic('mettsad'); setMusicVolume(0.9);
        this.fans = [{ x: 530, y: 200, alpha: 1 }];
        this.fanTalk(T.blook, 420, () => {
          this.fans = [];
          this.talk(T.call3, 'x', 51, () => {
            const next = k => {
              if (k >= T.fans.length) {                 // con 100 -> 101: los globos se desvanecen
                this.later(30, () => { this.fansFade = true; this.later(30, () => { this.fans = []; this.fansFade = false; this.farewell(); }); });
                return;
              }
              const [fx, fy, wx, msg] = T.fans[k];
              playSound('phone'); this.fans.push({ x: fx, y: fy, alpha: 1 });
              this.fanTalk([msg], wx, () => next(k + 1));
            };
            next(0);
          });
        });
      }));
    });
  }
  fanTalk(msgs, wx, onEnd) { this.talk(msgs, 'x', 92, onEnd); Object.assign(this.mb, { spr: null, wx, wy: 60 }); this.newMb(); }
  farewell() {
    this.talk(T.farewell, 'x', 51, () => { playSound('impact'); this.body.fadewhite = 1; });
    this.mb.onLine = i => { const v = { 20: 0.8, 21: 0.6, 22: 0.4, 23: 0.2, 24: 0.1, 25: 0 }[i]; if (v !== undefined) setMusicVolume(v); };
  }
  finish() { stopMusic(); if (this.onExit) { const f = this.onExit; this.onExit = null; f(); } }

  // ---------------------------------------------------------------- update
  update(inp) {
    super.update(inp);
    const S = this.state;
    this.body.update(this, this.menuTime());
    this.rat.update();
    this.charge--;
    if (S === 'mBoxText') {
      const q = this.msgQueue;
      if (inp.cancel) this.writer.skip();
      else if (inp.confirm && this.writer.done) {
        if (++q.i < q.msgs.length) this.writer = new Writer(q.msgs[q.i], BORDER[0][0], BORDER[0][2]);
        else { this.writer = null; q.onEnd(); }
      }
    }
    if (S === 'mTalk' || S === 'mEnd') this.updateMb(inp);
    if (S === 'mAttack' || S === 'mEssay') {
      this.prev = { ...this.heart };
      const h = this.heart, [l, r, t, b] = this.ideal(), H = inp.held, sp = this.sp;
      if (H.up) h.y -= sp; if (H.down) h.y += sp; if (H.left) h.x -= sp; if (H.right) h.x += sp;
      h.x = Math.min(Math.max(h.x, l + 4), r - 16); h.y = Math.min(Math.max(h.y, t + 4), b - 16);
      if (S === 'mAttack' && inp.confirm && this.canShoot && (this.shots.length === 0 || this.charge < 0)) {   // Z: disparo
        this.charge = 14; this.shots.push(new Shot(h.x + 4, h.y + 2)); playSound('heartshot');
      }
      for (const s of this.shots) s.update(); this.shots = this.shots.filter(s => !s.dead);
    }
    if (S === 'mAttack') {
      this.turntimer--;
      const g = this.gen;
      if (g) g.update(inp);
      if (this.state !== 'mAttack') return;
      this.dark = g ? g.darkamt : 0;
      if (this.turntimer <= 0) {                   // fin del turno (obj_mettattackgen Step)
        this.body.bodyopen = 0;
        if (g && g.type === 48) this.body.dropLegs();
        this.turntimer = -1; if (g) g.update(inp);
        this.dark = 0; this.endTurn();
      }
    }
    if (S === 'mEssay') { this.updateMb(inp); if (this.essay) this.essay.update(inp); this.rat.boastmode = 0; }
    if (this.dsfFade > 0) { this.dsfFade--; this.body.dsf = Math.max(0, this.body.dsf - 0.012); }
    if (this.musicVol) { this.musicVol = Math.max(0.001, this.musicVol - 0.02); setMusicVolume(this.musicVol); }
    if (this.fansFade) for (const f of this.fans) f.alpha -= 0.035;
    if (S !== 'mAttack' && this.dark > 0) this.dark = Math.max(0, this.dark - 0.05);
  }

  // ---------------------------------------------------------------- dibujo
  drawEnemy(ctx) { this.body.draw(ctx, this); }
  drawExtra(ctx) {
    for (const s of this.shots) s.draw(ctx);
    if (this.essay) this.essay.draw(ctx);
    this.rat.draw(ctx);
    for (const f of this.fans) drawSprite(ctx, 'spr_shockblcon2', 0, f.x, f.y, { alpha: Math.max(0, f.alpha) });
    const m = this.mb;
    if (m) { if (m.spr) drawSprite(ctx, m.spr, 0, m.bx, m.by); m.writer.draw(ctx); }
    this.body.drawFade(ctx, this);
  }
  drawHeart(ctx) {
    const S = this.state;
    if (S === 'mTalk' || S === 'mAttack' || S === 'mEssay') {
      this.hx = this.heart.x; this.hy = this.heart.y;
      drawSprite(ctx, this.soul, Math.floor(this.heartFrame), this.hx, this.hy); return;
    }
    if (S === 'mEnd' || S === 'mBoxText') return;
    if (S === 'actList') {
      this.hx = 72 + (this.actPos >= 3 ? 256 : 0); this.hy = 278 + (this.actPos % 3) * 32;
      drawSprite(ctx, this.soul, 0, this.hx, this.hy); return;
    }
    super.drawHeart(ctx);
  }
}
