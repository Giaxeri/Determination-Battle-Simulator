# Determination Battle Simulator

**▶ Play here / Juega aquí:** https://giaxeri.github.io/Determination-Battle-Simulator/

> This is a non-profit, fan-made tribute to UNDERTALE. UNDERTALE® is owned by Toby Fox.
> Please support the official release: buy UNDERTALE at [undertale.com](https://undertale.com).

**[English](#english)** · **[Español](#español)**

---

## English

A web simulator of **several UNDERTALE boss fights**, written in plain HTML5 Canvas + JavaScript (no frameworks, no
dependencies). Every fight is translated from the game's original GameMaker code: attack patterns, timings, texts and
sounds all come from the game, running at 640×480 and 30 FPS.

You can play each boss's full fight or practice any of its attacks on its own. The whole game can be played in
**English or Spanish**.

Made by Gianfry ([Giaxeri](https://github.com/Giaxeri)).

### Bosses

| Boss | Full fight | Single attacks | Soul | Highlights |
|---|---|---|---|---|
| **Undyne the Undying** | *Battle Against a True Hero* | 15 | Green (shield) and red | Real attack order, color swaps, final dialogue and turning to dust |
| **Muffet** | *Spider Dance* | 16 | Purple (3 threads) | Purple tea intro, "Up Next" sign, the pet, Pay/Struggle and the telegram |
| **Mettaton EX** | *Death by Glamour* | 17 | Yellow (shoots with Z) | RATINGS graph, typed essay, heart-to-hearts and the viewer call-in ending |
| **Napstablook** | *Ghost Fight* | 4 | Red | ACT Cheer / Flirt / Threat, "Dapper Blook" and tears that speed up |
| **Toriel** | *Heartache* | 6 | Red | Fire hands, flames that dodge you at low HP, sparing her 25 times or the kill ending |
| **Papyrus** | *Bonetrousle* | 21 | Red and blue (gravity) | Blue attack, Flirt/Insult, the special attack with the dog, the capture instead of death |
| **Asgore** | *ASGORE* | 18 | Red | He breaks MERCY, blue/orange trident swipes, fire patterns, Talk, the kneeling ending |
| **Asriel Dreemurr** | *Hopes and Dreams* | 15 | Red | Star Blazing, Chaos Saber/Buster, Shocker Breaker, HYPER GONER, "But it refused.", SAVE and the goodbye |
| **Sans** | *MEGALOVANIA* | 24 | Red and blue (4 walls) | Gaster Blasters, KARMA, he dodges every hit, the spare trap and the special attack |

**Undyne the Undying**
- Green mode: lessons −5 to −14 (aim the shield with the arrow keys). Red mode: orderb 0–7.
- Damage to Undyne as in the game: (AT + weapon − DEF + random) × accuracy × 21, minimum 600.
- The "rating" goes up when you get hit (slower spears) and down when you don't.
- Translated from `obj_undyne_ex`, `obj_spearblocker`, `obj_spearbulletfollowgen` and friends.
- The game doesn't name the attacks: the names in the list are made up (`src/attacks.js`).

**Muffet**
- Purple soul: left/right to move, up/down to change thread.
- 16 turns (spiders, donuts, croissants and 3 turns with the pet) and the "Up Next" sign showing the next attack.
- ACT: Check / Struggle / Pay (you start with 100G). The telegram from the spiders in the RUINS and the final spare.
- Translated from `obj_spiderb`, `obj_spiderb_body`, `obj_spiderbulletgen`, `obj_purpleheart` and `obj_fakeborderdraw`.

**Mettaton EX**
- Yellow soul: during his turn **Z shoots** (breaks boxes, sets off bombs, presses buttons and flips the disco ball).
- ACT: Check / Boast / Pose / Heel Turn. RATINGS with their graph and list of points.
- 20 turns with his lines, the turn 5 essay (typed with the keyboard), the 4 heart-to-hearts and losing his arms and legs.
- Endings: the viewer call-in (12000 RATINGS, or 10000 from turn 19 on) or bringing his HP to 0.
- Translated from `obj_mettatonex`, `obj_mettb_body`, `obj_ratingsmaster`, `obj_mettattackgen` and its bullets.

**Napstablook**
- ACT: Check / Flirt / Threat / Cheer. Cheer 3 times to see "Dapper Blook", then they leave happy.
- Answer anything else: "i knew it..." and they cry faster. Lower their HP: "you do know you cant kill ghosts, right?".
- Translated from `obj_napstablook`, `obj_crygen1-3`, `blt_crybullet`, `blt_streambullet` and `blt_blookhat`.

**Toriel**
- All her fire patterns (helixes, side flames, one or two hands that drop chasing fire) with the game's boxes and timings.
- At low HP her fire does less damage, the attack stops at 2 HP and then she only uses the fire that dodges you.
- ACT: Check / Talk. MERCY 25 times goes through all her lines until she lets you go; killing her gives her last words (or the betrayal version) and her soul breaking.
- Translated from `obj_torielboss`, `obj_1sidegen` and `blt_handbullet1/2`.

**Papyrus**
- Starts with the red soul; the blue attack turns your soul blue (gravity, hold UP to jump higher) and the music switches to Bonetrousle.
- His 15 bone turns in order, the "special attack" (the dog steals the bone) and the "absolutely normal attack" (COOL DUDE, the bus, the giant bone).
- ACT: Check / Flirt / Insult. He never kills you: at 0 HP **he captures you**, as in the game, and later fights start with his "you escaped" lines.
- Translated from `obj_papyrusboss`, `blt_superbone`, `blt_sizebone`, `blt_topbone` and `blt_tobydogbone`.

**Asgore**
- The intro where he destroys the MERCY button (it's gone for the whole fight).
- Trident swipes: blue hurts if you move, orange hurts if you stand still. Sine, helix and circle fire patterns; later turns get harder.
- ACT: Check / Talk (lowers his ATK and DEF). At low HP he kneels: FIGHT or MERCY to end the fight.
- Translated from `obj_asgoreb`, `obj_asgore_finalintro`, `obj_asgoreattackgen`, `obj_asgore_spearswipe` and the fire generators.

**Asriel Dreemurr**
- God of Hyperdeath: Star Blazing, Shocker Breaker (I and II), Chaos Saber, Chaos Buster, Galacta Blazing, Chaos Slicer, Chaos Blaster and HYPER GONER, in the game's order.
- ACT: Check / Hope / Dream. You can't die here: at 0 HP you get **"But it refused."**, as in the game.
- Final form: Struggle, SAVE your friends, save Asriel, and the goodbye.
- Translated from `obj_asrielb`, `obj_asriel_body`, `obj_asrielfinal` and their attacks.

**Sans**
- Every attack in the game's order: bones, platforms, Gaster Blasters, the blue soul slammed against any wall.
- KARMA (KR): no invincibility, poison that drains HP. He dodges every FIGHT until the end.
- The spare trap, the special attack where he falls asleep, and the final hit.
- Translated from `obj_sansb`, `obj_sansb_body`, `obj_sans_bonebul`, `obj_gasterblaster` and friends.

### Stats and items per boss

Each fight uses the LV, equipment and items most common at that point of the game.
Items come in 2 pages: 4 of the weaker one and 2 of the stronger one.

| Boss | LV / HP | Weapon / Armor | Items (page 1 / page 2) |
|---|---|---|---|
| Undyne the Undying | 10 / 56 | Toy Knife / Faded Ribbon | 4 Astronaut Food / 2 Sea Tea |
| Muffet | 1 / 20 | Ballet Shoes / Old Tutu | 4 Hot Dog...? / 2 Cinnamon Bunny |
| Mettaton EX | 1 / 20 | Burnt Pan / Old Tutu | 4 Glamburger / 2 Legendary Hero |
| Napstablook | 1 / 20 | Stick / Bandage | 2 Monster Candy + 1 Spider Donut |
| Toriel | 1 / 20 | Toy Knife / Faded Ribbon | 2 Monster Candy + 1 Spider Donut |
| Papyrus | 1 / 20 | Tough Glove / Manly Bandanna | 4 Nice Cream / 2 Cinnamon Bunny |
| Asgore | 1 / 20 | Burnt Pan / Stained Apron | 4 Legendary Hero / 2 Face Steak |
| Asriel Dreemurr | 1 / 20 | Worn Dagger / Heart Locket | 4 Legendary Hero / 2 Face Steak |
| Sans | 19 / 92 | Real Knife / The Locket | 4 Legendary Hero / 2 Face Steak |

- Muffet gets no spider items (in the game they skip straight to her ending).
- Against Mettaton EX, the Glamburger and the Legendary Hero raise the RATINGS ("OnBrandFood").

### Features

- **Main menu** in the game's style, with the soul as cursor and characters decorating it (Sans, Papyrus, Flowey, Napstablook, the dog...).
- **Full fight or single attack** for every boss, for practice.
- **Options** (saved in your browser):
  - Resolution: Small / Default / Large. Everything scales with it.
  - Language: English / Español.
  - Player name: up to 6 letters, with the game's naming screen. "Player" by default.
- **Volume** with a draggable bar to the right of the fight; the M key mutes.
- **Death like in the game**: the music stops, the soul breaks (`snd_break1`), shatters into pieces (`snd_break2`) and you go back to that boss's list. (Papyrus captures you and Asriel refuses to let you die, as in the game.)
- **Black background only** in every fight.
- **Outside the fight area**:
  - On the menu: title, fan-game notice and credits.
  - In battle: only the volume bar and "Press ESC to return to the menu".

### Spanish version

- All texts are translated: menus, battle interface, items, ACT options, dialogue and endings (`src/lang/es.js`).
  It's an original translation into neutral Latin American Spanish, using the usual fan-translation terms
  (PV, NV, ALMA, SUBSUELO...).
- The game's fonts have no accents, so á é í ó ú ñ ü ¿ ¡ are built on load from the base letter plus a mark drawn with the same pixels.
- Sprites with English text are rebuilt in Spanish from the originals (`src/lang/sprites_es.js`):
  LUCHAR / ACTUAR / OBJETO / PIEDAD buttons, "PV", "FALLO" and Napstablook's sign.
- Mettaton's essay also recognizes Spanish words (piernas, brazos, cabello, voz, bailar...).
- `node tools/check_es.mjs` checks that every Spanish text fits in its box or speech bubble.
- On the first visit, the language follows your browser's.

### Controls

| Key | Action |
|---|---|
| Arrow keys | Move through menus and move the soul (or the shield with Undyne in green mode) |
| Z | Confirm · shoot with the yellow soul |
| X | Cancel · go back |
| Esc | Leave the fight and go back to the boss's list |
| M | Mute / unmute |

The mouse is only used for the volume bar and the links; the game itself is played with the keyboard.

### Run locally

The project is static: just serve the folder (ES modules don't work when you open `index.html` directly).

    npx http-server -c-1 -p 8000

Then open http://localhost:8000. `python -m http.server 8000` also works.

### Extracting the assets

The sprites, fonts and sounds in `assets/` are extracted from the `data.win` of your own copy of UNDERTALE:

    python3 tools/extract.py "C:/Program Files (x86)/Steam/steamapps/common/Undertale/data.win" assets

- Requires Python 3 and Pillow.
- The music (`mus_x_undyne*.ogg`, `mus_spider.ogg`, `mus_mettaton_ex.ogg`, `mus_mettsad.ogg`, `mus_ghostbattle.ogg`) is copied from the game folder to `assets/audio/`.
- To add new sprites or sounds, add them to the `SPRITES` / `SOUNDS` lists in `tools/extract.py` and run it again.

### Project structure

    index.html              page, styles, favicon and metadata (SEO / Open Graph)
    src/
      main.js               30 FPS loop, keyboard and scene switching (menu <-> battle)
      menu.js               boss list, attack list, Options and naming screen
      ui.js                 everything outside the fight (title, credits, volume, ESC) and scaling
      settings.js           name, resolution, language and volume saved in localStorage
      i18n.js               language switching: texts(), tr(), Spanish sprites
      lang/es.js            all the Spanish texts
      lang/sprites_es.js    Spanish versions of the sprites with text
      assets.js             sprite, font and audio loading; GameMaker-style drawing, bitmap text and accented letters
      text.js               the game's text writer (OBJ_WRITER)
      gm.js                 helpers that mimic the GameMaker runner (movement, collisions)
      battle.js             base battle: FIGHT/ACT/ITEM/MERCY menu, items, damage, death (+ Undyne)
      attacks.js            Undyne's attack list
      undyne.js             Undyne's body, assembled from pieces
      green.js / red.js     Undyne's attacks with the green and red soul
      muffet.js             Muffet's fight  (+ muffetbody.js)
      mettaton.js           Mettaton EX's fight  (+ mettbody.js, mettbullets.js)
      napstablook.js        Napstablook's fight
      toriel.js             Toriel's fight
      papyrus*.js           Papyrus's fight (+ bones, font and graphics)
      asgore*.js            Asgore's fight (+ body and attacks)
      asriel*.js            Asriel's fight (+ bodies and attacks)
      sans*.js              Sans's fight (+ body, bullets, font and texts)
      lang/es_<boss>.js     Spanish texts of each new boss
    tools/
      datawin.py            data.win reader (GameMaker Studio 1.4)
      extract.py            sprite, font and sound extractor
      check_es.mjs          checks that the Spanish texts fit
      assets/<boss>.txt     sprites and sounds each boss needs (read by extract.py)
    assets/                 sprites, fonts, sound effects, music and icons

### Adding a new boss

1. Create `src/<boss>.js` with a class that extends `Battle` (`battle.js`) and exports its attack list.
2. Register it in `BOSSES` (`src/menu.js`) and in `CLASSES` (`src/main.js`).
3. Define `playerSetup()` with the LV and equipment of that point of the game (`playerAt(lv, weapon, armor)`).
4. Define `itemSetup()` with 2 pages: 4 of the weaker item and 2 of the stronger one, the most common for that fight (fewer if the boss is from the early game).
5. Keep the black background and call `this.gameOver()` when HP reaches 0, so death works like in the other fights.
6. Put its texts in a `texts('<boss>', {...})` object, add the Spanish version to `src/lang/es.js` and run `node tools/check_es.mjs`.
7. List its sprites and sounds in `tools/assets/<boss>.txt` and run `tools/extract.py` again.

### Credits

- **UNDERTALE** © Toby Fox. All sprites, fonts, sounds and music belong to their author.
- Recreation, code, fight translation and Spanish version: Gianfry ([Giaxeri](https://github.com/Giaxeri)).
- Non-profit project. If you like it, buy the game at [undertale.com](https://undertale.com).

---

## Español

Simulador web de **varios jefes de UNDERTALE**, hecho en HTML5 Canvas + JavaScript puro (sin frameworks ni
dependencias). Cada combate está traducido del código original del juego (GameMaker): los patrones de ataque,
los tiempos, los textos y los sonidos son los del juego, a 640×480 y 30 FPS.

Puedes jugar la pelea completa de cada jefe o practicar cualquiera de sus ataques por separado. Todo el juego se
puede jugar en **inglés o en español**.

Hecho por Gianfry ([Giaxeri](https://github.com/Giaxeri)).

### Jefes

| Jefe | Pelea completa | Ataques sueltos | Alma | Lo más característico |
|---|---|---|---|---|
| **Undyne la Inmortal** | *Battle Against a True Hero* | 15 | Verde (escudo) y roja | Orden real de ataques, cambios de color, final con diálogo y la caída en polvo |
| **Muffet** | *Spider Dance* | 16 | Morada (3 hilos) | Té morado inicial, cartel "Siguiente", la mascota, Pagar/Forcejear y el telegrama |
| **Mettaton EX** | *Death by Glamour* | 17 | Amarilla (dispara con Z) | AUDIENCIA con gráfica, ensayo con el teclado, charlas de corazón a corazón y la llamada final |
| **Napstablook** | *Ghost Fight* | 4 | Roja | ACT Animar / Coquetear / Amenazar, "Blook Chic" y las lágrimas que se aceleran |
| **Toriel** | *Heartache* | 6 | Roja | Manos de fuego, llamas que te esquivan con poca vida, perdonarla 25 veces o el final si la matas |
| **Papyrus** | *Bonetrousle* | 21 | Roja y azul (gravedad) | Ataque azul, Coquetear/Insultar, el ataque especial con el perro, te captura en vez de matarte |
| **Asgore** | *ASGORE* | 18 | Roja | Rompe PIEDAD, barridos azules/naranjas del tridente, patrones de fuego, Hablar, el final de rodillas |
| **Asriel Dreemurr** | *Hopes and Dreams* | 15 | Roja | Star Blazing, Chaos Saber/Buster, Shocker Breaker, HYPER GONER, "Pero se negó.", SALVAR y la despedida |
| **Sans** | *MEGALOVANIA* | 24 | Roja y azul (4 paredes) | Gaster Blasters, KARMA, esquiva todos los golpes, la trampa del perdón y el ataque especial |

**Undyne la Inmortal**
- Modo verde: lessons −5 a −14 (el escudo se orienta con las flechas). Modo rojo: orderb 0–7.
- Daño a Undyne según el juego: (AT + arma − DEF + azar) × precisión × 21, mínimo 600.
- El "rating" sube si te golpean (lanzas más lentas) y baja si no.
- Traducido de `obj_undyne_ex`, `obj_spearblocker`, `obj_spearbulletfollowgen` y compañía.
- Los ataques no tienen nombre en el juego: los de la lista son inventados (`src/attacks.js`).

**Muffet**
- Alma morada: izquierda/derecha para moverte, arriba/abajo para cambiar de hilo.
- 16 turnos (arañas, donas, cruasanes y 3 turnos con la mascota) y el cartel "Siguiente" con el próximo ataque.
- ACT: Revisar / Forcejear / Pagar (empiezas con 100G). El telegrama de las arañas de las RUINAS y el perdón final.
- Traducido de `obj_spiderb`, `obj_spiderb_body`, `obj_spiderbulletgen`, `obj_purpleheart` y `obj_fakeborderdraw`.

**Mettaton EX**
- Alma amarilla: durante su turno **Z dispara** (rompe cajas, activa bombas, pulsa botones y gira la bola de discoteca).
- ACT: Revisar / Presumir / Posar / Ser villano. AUDIENCIA con su gráfica y la lista de puntos.
- 20 turnos con sus frases, el ensayo del turno 5 (se escribe con el teclado), las 4 charlas de corazón a corazón y cómo pierde brazos y piernas.
- Finales: la llamada de los espectadores (12000 de AUDIENCIA, o 10000 desde el turno 19) o dejarlo sin vida.
- Traducido de `obj_mettatonex`, `obj_mettb_body`, `obj_ratingsmaster`, `obj_mettattackgen` y sus balas.

**Napstablook**
- ACT: Revisar / Coquetear / Amenazar / Animar. Anímalo 3 veces para ver el "Blook Chic" y después se irá contento.
- Si respondes otra cosa: "lo sabía..." y llora más rápido. Si le bajas la vida: "sabes que no puedes matar fantasmas, ¿no?".
- Traducido de `obj_napstablook`, `obj_crygen1-3`, `blt_crybullet`, `blt_streambullet` y `blt_blookhat`.

**Toriel**
- Todos sus patrones de fuego (hélices, llamas laterales, una o dos manos que sueltan fuego que te persigue) con las cajas y tiempos del juego.
- Con poca vida su fuego hace menos daño, el ataque se corta a 2 PV y después solo usa el fuego que te esquiva.
- ACT: Revisar / Hablar. PIEDAD 25 veces recorre todas sus frases hasta que te deja ir; si la matas, sus últimas palabras (o la versión de la traición) y su alma que se rompe.
- Traducido de `obj_torielboss`, `obj_1sidegen` y `blt_handbullet1/2`.

**Papyrus**
- Empieza con el alma roja; el ataque azul la vuelve azul (gravedad, mantén ARRIBA para saltar más) y la música pasa a Bonetrousle.
- Sus 15 turnos de huesos en orden, el "ataque especial" (el perro se roba el hueso) y el "ataque absolutamente normal" (TIPO GENIAL, el bus, el hueso gigante).
- ACT: Revisar / Coquetear / Insultar. Nunca te mata: a 0 PV **te captura**, como en el juego, y las siguientes peleas empiezan con sus frases de "te escapaste".
- Traducido de `obj_papyrusboss`, `blt_superbone`, `blt_sizebone`, `blt_topbone` y `blt_tobydogbone`.

**Asgore**
- La intro en la que destruye el botón PIEDAD (desaparece toda la pelea).
- Barridos del tridente: azul duele si te mueves, naranja si te quedas quieto. Fuegos en onda, hélice y círculo; los últimos turnos son más difíciles.
- ACT: Revisar / Hablar (baja su ATQ y DEF). Con poca vida se arrodilla: LUCHAR o PIEDAD para terminar.
- Traducido de `obj_asgoreb`, `obj_asgore_finalintro`, `obj_asgoreattackgen`, `obj_asgore_spearswipe` y los generadores de fuego.

**Asriel Dreemurr**
- Dios de la Hipermuerte: Star Blazing, Shocker Breaker (I y II), Chaos Saber, Chaos Buster, Galacta Blazing, Chaos Slicer, Chaos Blaster y HYPER GONER, en el orden del juego.
- ACT: Revisar / Esperanza / Sueño. Aquí no se puede morir: a 0 PV sale **"Pero se negó."**, como en el juego.
- Forma final: Forcejear, SALVAR a tus amigos, salvar a Asriel y la despedida.
- Traducido de `obj_asrielb`, `obj_asriel_body`, `obj_asrielfinal` y sus ataques.

**Sans**
- Todos sus ataques en el orden del juego: huesos, plataformas, Gaster Blasters, el alma azul estrellada contra cualquier pared.
- KARMA (KR): sin invencibilidad, veneno que baja la vida. Esquiva todos tus golpes hasta el final.
- La trampa del perdón, el ataque especial en el que se duerme y el golpe final.
- Traducido de `obj_sansb`, `obj_sansb_body`, `obj_sans_bonebul`, `obj_gasterblaster` y compañía.

### Estadísticas y objetos por jefe

Cada combate usa el NV, el equipo y los objetos más habituales en ese punto del juego.
Los objetos van en 2 páginas: 4 del más flojo y 2 del más fuerte.

| Jefe | NV / PV | Arma / Armadura | Objetos (pág. 1 / pág. 2) |
|---|---|---|---|
| Undyne la Inmortal | 10 / 56 | Toy Knife / Faded Ribbon | 4 Comida de Astronauta / 2 Té Marino |
| Muffet | 1 / 20 | Ballet Shoes / Old Tutu | 4 Hot Dog...? / 2 Conejo de Canela |
| Mettaton EX | 1 / 20 | Burnt Pan / Old Tutu | 4 Glamburguesa / 2 Héroe Legendario |
| Napstablook | 1 / 20 | Stick / Bandage | 2 Caramelo de Monstruo + 1 Dona de Araña |
| Toriel | 1 / 20 | Toy Knife / Faded Ribbon | 2 Caramelo de Monstruo + 1 Dona de Araña |
| Papyrus | 1 / 20 | Tough Glove / Manly Bandanna | 4 Buen Helado / 2 Conejo de Canela |
| Asgore | 1 / 20 | Burnt Pan / Stained Apron | 4 Héroe Legendario / 2 Filete Facial |
| Asriel Dreemurr | 1 / 20 | Worn Dagger / Heart Locket | 4 Héroe Legendario / 2 Filete Facial |
| Sans | 19 / 92 | Real Knife / The Locket | 4 Héroe Legendario / 2 Filete Facial |

- A Muffet no se le dan objetos de araña (en el juego la hacen saltar directamente al final).
- Con Mettaton EX, la Glamburguesa y el Héroe Legendario suben la AUDIENCIA ("ComidaMarca").

### Características

- **Menú principal** al estilo del juego, con el alma como cursor y personajes decorando (Sans, Papyrus, Flowey, Napstablook, el perro...).
- **Pelea completa o ataque suelto** de cada jefe, para practicar.
- **Opciones** (se guardan en el navegador):
  - Resolución: Pequeña / Normal / Grande. Todo escala con ella.
  - Idioma: English / Español.
  - Nombre del jugador: hasta 6 letras, con la pantalla de nombre del juego. Por defecto "Jugador".
- **Volumen** con una barra arrastrable a la derecha del combate; la tecla M silencia.
- **Muerte como en el juego**: la música se corta, el alma se parte (`snd_break1`), estalla en pedazos (`snd_break2`) y vuelves a la lista de ese jefe. (Papyrus te captura y Asriel no te deja morir, como en el juego.)
- **Solo fondo negro** en todos los combates.
- **Fuera del área de combate**:
  - En el menú: título, aviso de fan-game y créditos.
  - En combate: solo el volumen y "Pulsa ESC para volver al menú".

### Versión en español

- Están traducidos todos los textos: menús, interfaz de batalla, objetos, opciones de ACT, diálogos y finales (`src/lang/es.js`).
  Es una traducción propia al español latinoamericano neutro, con los términos habituales de las traducciones de fans
  (PV, NV, ALMA, SUBSUELO...).
- Las fuentes del juego no traen tildes: á é í ó ú ñ ü ¿ ¡ se construyen al cargar a partir de la letra base y una tilde dibujada con los mismos píxeles.
- Los sprites con texto en inglés se rehacen en español a partir de los originales (`src/lang/sprites_es.js`):
  botones LUCHAR / ACTUAR / OBJETO / PIEDAD, "PV", "FALLO" y el cartel de Napstablook.
- El ensayo de Mettaton también reconoce palabras en español (piernas, brazos, cabello, voz, bailar...).
- `node tools/check_es.mjs` comprueba que todos los textos en español caben en su caja o globo de diálogo.
- En la primera visita, el idioma es el de tu navegador.

### Controles

| Tecla | Acción |
|---|---|
| Flechas | Moverse por los menús y mover el alma (o el escudo con Undyne en modo verde) |
| Z | Confirmar · disparar con el alma amarilla |
| X | Cancelar · volver atrás |
| Esc | Salir del combate a la lista del jefe |
| M | Silenciar / reactivar el sonido |

El ratón solo se usa para la barra de volumen y los enlaces; el juego en sí se controla con el teclado.

### Ejecutar en local

El proyecto es estático: basta con servir la carpeta (los módulos ES no funcionan abriendo `index.html` directamente).

    npx http-server -c-1 -p 8000

Después abre http://localhost:8000. También sirve `python -m http.server 8000`.

### Extraer los assets

Los sprites, fuentes y sonidos de `assets/` se extraen del `data.win` de tu propia copia de UNDERTALE:

    python3 tools/extract.py "C:/Program Files (x86)/Steam/steamapps/common/Undertale/data.win" assets

- Necesita Python 3 y Pillow.
- La música (`mus_x_undyne*.ogg`, `mus_spider.ogg`, `mus_mettaton_ex.ogg`, `mus_mettsad.ogg`, `mus_ghostbattle.ogg`) se copia de la carpeta del juego a `assets/audio/`.
- Para añadir sprites o sonidos nuevos, agrégalos a las listas `SPRITES` / `SOUNDS` de `tools/extract.py` y vuelve a ejecutarlo.

### Estructura

    index.html              página, estilos, favicon y metadatos (SEO / Open Graph)
    src/
      main.js               bucle a 30 FPS, teclado y cambio de escenas (menú <-> combate)
      menu.js               lista de jefes, lista de ataques, Opciones y pantalla de nombre
      ui.js                 todo lo que va fuera del combate (título, créditos, volumen, ESC) y el escalado
      settings.js           nombre, resolución, idioma y volumen guardados en localStorage
      i18n.js               cambio de idioma: texts(), tr(), sprites en español
      lang/es.js            todos los textos en español
      lang/sprites_es.js    versiones en español de los sprites con texto
      assets.js             carga de sprites, fuentes y audio; dibujo al estilo GameMaker, texto bitmap y letras con tilde
      text.js               escritor de texto del juego (OBJ_WRITER)
      gm.js                 utilidades que imitan el runner de GameMaker (movimiento, colisiones)
      battle.js             combate base: menú FIGHT/ACT/ITEM/MERCY, objetos, daño, muerte (+ Undyne)
      attacks.js            lista de ataques de Undyne
      undyne.js             cuerpo de Undyne armado por piezas
      green.js / red.js     ataques de Undyne con alma verde y roja
      muffet.js             combate de Muffet  (+ muffetbody.js)
      mettaton.js           combate de Mettaton EX  (+ mettbody.js, mettbullets.js)
      napstablook.js        combate de Napstablook
      toriel.js             combate de Toriel
      papyrus*.js           combate de Papyrus (+ huesos, fuente y gráficos)
      asgore*.js            combate de Asgore (+ cuerpo y ataques)
      asriel*.js            combate de Asriel (+ cuerpos y ataques)
      sans*.js              combate de Sans (+ cuerpo, balas, fuente y textos)
      lang/es_<jefe>.js     textos en español de cada jefe nuevo
    tools/
      datawin.py            lector de data.win (GameMaker Studio 1.4)
      extract.py            extractor de sprites, fuentes y sonidos
      check_es.mjs          comprueba que los textos en español caben
      assets/<jefe>.txt     sprites y sonidos que necesita cada jefe (los lee extract.py)
    assets/                 sprites, fuentes, efectos, música e iconos

### Añadir un jefe nuevo

1. Crea `src/<jefe>.js` con una clase que extienda `Battle` (`battle.js`) y exporte su lista de ataques.
2. Regístralo en `BOSSES` (`src/menu.js`) y en `CLASSES` (`src/main.js`).
3. Define `playerSetup()` con el NV y el equipo propios de ese punto del juego (`playerAt(lv, arma, armadura)`).
4. Define `itemSetup()` con 2 páginas: 4 objetos del más flojo y 2 del más fuerte, los más comunes en esa pelea (menos si el jefe es de la zona inicial).
5. Mantén el fondo negro y usa `this.gameOver()` al llegar a 0 de PV, para que la muerte funcione igual que en el resto.
6. Pon sus textos en un objeto `texts('<jefe>', {...})`, añade la versión en español en `src/lang/es.js` y ejecuta `node tools/check_es.mjs`.
7. Pon sus sprites y sonidos en `tools/assets/<jefe>.txt` y vuelve a ejecutar `tools/extract.py`.

### Créditos

- **UNDERTALE** © Toby Fox. Todos los sprites, fuentes, sonidos y música pertenecen a su autor.
- Recreación, código, traducción de los combates y versión en español: Gianfry ([Giaxeri](https://github.com/Giaxeri)).
- Proyecto sin ánimo de lucro. Si te gusta, compra el juego en [undertale.com](https://undertale.com).
