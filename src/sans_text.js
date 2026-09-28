// Textos del combate contra Sans tal cual los guarda el juego (textdata_en: obj_sansb, obj_sansb_body)
import { texts } from './i18n.js';

export const T = texts('sans', {
  name: 'Sans',
  // obj_sansb Step (con 2 / con 10) y obj_sansb_body Draw (fac 19 / fac 20)
  intro: ["it's a beautiful&day outside./", 'birds are singing^1,&flowers are&blooming.../', 'on days like these^1,&kids like you.../%%'],
  hell: 'Should&be&burning&in hell./%%',
  huh: ['\\E1huh./', '\\M1always wondered why&people never use&their strongest&attack first./%%'],
  badtime: "* You feel like you're going to&  have a bad time.",
  // obj_sansb Alarm_6: lo que dice cada vez que esquiva un golpe (hit_try)
  hit: {
    1: ["what^1?&you think i'm just&gonna stand there&and take it?/%%"],
    2: ['our reports showed&a massive anomaly&in the timespace&continuum./', 'timelines jumping&left and right,&stopping and&starting.../%%'],
    3: ['\\E4until suddenly^1,&everything ends./%%'],
    4: ['\\E4heh heh heh.../', "\\E5that's your fault^1,&isn't it?/%%"],
    5: ["\\E1you can't understand&how this feels./%%"],
    6: ['\\E4knowing that one&day^1, without any&warning.../', "\\E9it's all going to&be reset./%%"],
    7: ['\\E9look^1.&i gave up trying&to go back a long&time ago./%%'],
    8: ["\\E4and getting to the&surface doesn't&really appeal&anymore^1, either./%%"],
    9: ['\\E4cause even if we&do.../', "\\E5we'll just end up&right back here^1,&without any memory&of it^1, right?/%%"],
    10: ['\\E1to be blunt.../', '\\E4it makes it kind&of hard to give&it my all./%%'],
    11: ['\\E1... or is that just&a poor excuse for&being lazy...?/', '\\E3hell if i know./%%'],
    12: ['\\E4all i know is..^1.&seeing what comes&next.../', "\\E9i can't afford not&to care anymore./%%"],
    13: ['\\E9ugh..^1.&that being said.../', '\\E1you^1, uh^1, really&like swinging that&thing around^1,&huh?/', '\\E0.../', '\\E4listen./',
         "i know you didn't&answer me before^1,&but.../", '\\E4somewhere in&there^1.&i can feel it./', "\\E0there's a glimmer&of a good person&inside of you./",
         '\\E4the memory of&someone who once&wanted to do the&right thing./', '\\E1someone who^1, in&another time^1,&might have even&been.../',
         '\\E4a friend?/', "\\E3c'mon^1, buddy./", '\\E0do you remember&me?/', "\\E4please^1, if you're&listening.../", "\\E9let's forget all&this^1, ok?/",
         '\\E3just lay down&your weapon^1, and.../', '\\E4well^1, my job&will be a lot&easier./%%'],
    14: ['\\E3welp^1, it was&worth a shot./', '\\E5guess you like&doing things the&hard way^1, huh?/%%'],
    15: ['\\E4sounds strange^1, but&before all this i&was secretly hoping&we could be friends./', '\\E1i always thought the&anomaly was doing&this cause they&were unhappy./',
         'and when they got&what they wanted^1,&they would stop&all this./%%'],
    16: ['\\E3and maybe all they&needed was..^1.&i dunno./', '\\M1some good food^1,&some bad laughs^1,&some nice friends./%%'],
    17: ["\\E4but that's&ridiculous^1,&right?/", "\\E5yeah^1, you're the&type of person&who won't EVER&be happy./%%"],
    18: ["\\E5you'll keep&consuming timelines&over and over^1,&until.../", '\\E4well./', '\\M1hey./', '\\E3take it from me^1,&kid./', 'someday.../', 'you gotta learn&when to QUIT./%%'],
    19: ["\\E3and that day's&TODAY./%%"],
    20: ['\\E4cause..^1.&y\'see../', '\\E1all this fighting&is really tiring&me out./%%'],
    21: ['\\E4and if you keep&pushing me.../', "\\Xt\\E3hen i'll be&forced to use my\\R &special attack\\X./%%"],
    22: ['\\Xy\\E3eah^1, my \\Rspecial&attack\\X.&sound familiar?/', "\\Xw\\E1ell^1, get ready^1.&cause after the&next move^1, i'm&going to \\Ruse it\\X./",
         "\\E3so^1, if you don't&wanna see it^1, now&would be a good&time to die./%%"],
    23: ['\\E4well^1, here goes&nothing.../', '\\E3are you ready?/', "\\Xs\\E5urvive THIS^1, and&i'll show you my\\R &special attack\\X!/%%"],
  },
  // MERCY cuando te perdona (mercy_death)
  spared: ['.../', "you're sparing me?/", '\\E1finally./', '\\E3buddy^1.&pal./', '\\E4i know how hard&it must be.../', 'to make that&choice./',
           "to go back on&everything you've&worked up to./", "\\E0i want you to&know..^1.&i won't let it&go to waste./", '\\M1.../', "\\E3c'mere^1, pal./%%"],
  // ACT: Check
  check0: "* SANS 1 ATK 1 DEF&* The easiest enemy^1.&* Can only deal 1 damage./^",
  check1: "* SANS 1 ATK 1 DEF&* The easiest enemy^1.&* Can only deal 1 damage./",
  check2: "* Can't keep dodging forever^1.&* Keep attacking./^",
  // Texto de la caja en cada turno (obj_sansb Step)
  flavor: {
    keep: '* Just keep attacking.', wearier: "* Sans's movements grow a&  little wearier.", slower: "* Sans's movements seem to be&  slower.",
    turning: '* Felt like a turning point.', sins1: '* You felt your sins crawling&  on your back.', sins2: '* You felt your sins weighing&  on your neck.',
    karma: '* KARMA coursing through your&  veins.', doomed: '* Doomed to death of KARMA!', real: '* The REAL battle finally begins.',
    reading: "* Reading this doesn't seem&  like the best use of time.", tired: '* Sans is starting to look&  really tired.',
    preparing: '* Sans is preparing something.', special: '* Sans is getting ready to&  use his special attack.', sparing: '* Sans is sparing you.',
  },
  // El "ataque especial" (obj_sansb_body lac 62 ... 74)
  special: [
    ['huff..^1. puff.../', "all right^1.&that's it./", "\\Xi\\M1t's time for my\\R &special attack\\X./", '\\E3are you ready?/', '\\E4here goes nothing./%%'],
    ['\\E1yep./', "\\E1that's right./", "\\E3it's literally&nothing./", "\\E1and it's not gonna&be anything^1,&either./", '\\E4heh heh heh..^1.&ya get it?/',
     "\\E1i know i can't&beat you./", '\\E4one of your turns.../', "\\E9you're just gonna&kill me./", '\\E1so^1, uh./', "\\E4i've decided.../",
     "it's not gonna BE&your turn^1.&ever./", "\\E3i'm just gonna&keep having MY&turn until you&give up./", '\\E5even if it means&we have to stand&here until the&end of time./',
     '\\E1capiche?/%%'],
    ["\\E9you'll get bored&here./", "\\E1if you haven't&gotten bored&already^1, i mean./", "\\E5and then^1, you'll&finally quit./%%"],
    ['\\E5i know your type./', "\\E1you're^1, uh^1, very&determined^1, aren't&you?/", "\\E4you'll never give&up^1, even if&there's^1, uh.../",
     '\\E3absolutely NO&benefit to&persevering&whatsoever./', '\\E1if i can make&that clear./', "\\E4no matter what^1,&you'll just keep&going./",
     '\\E9not out of any&desire for good&or evil.../', '\\E3but just because&you think you&can./', '\\E1and because you&"can".../', '\\E9... you "have to."/%%'],
    ["\\E9but now^1, you've&reached the end./", '\\E4there is nothing&left for you now./', '\\E1so^1, uh^1, in my&personal opinion.../',
     '\\E3the most&"determined"&thing you can&do here?/', '\\E1is to^1, uh^1,&completely give&up./', '\\E3and..^1. (yawn)&do literally&anything else./%%'],
  ],
  // El golpe final (obj_sansb_body death_c)
  didja: 'heh^1, didja&really think you&would be able to',
  dying: ['.../', '.../', '.../', 'so.../', "guess that's it^1,&huh?/", '.../', 'just.../', "don't say i&didn't warn you./%%"],
  welp: ['welp./', "i'm going to&grillby's./%%"],
  papyrus: 'papyrus^1, do you&want anything?/%%',
});
