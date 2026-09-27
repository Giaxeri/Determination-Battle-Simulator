# Determination Battle Simulator

**Juega aquí:** https://giaxeri.github.io/Determination-Battle-Simulator/

> This is a non-profit, fan-made tribute to UNDERTALE. UNDERTALE® is owned by Toby Fox.
> Please support the official release: buy UNDERTALE at [undertale.com](https://undertale.com).

Made by Gianfry ([Giaxeri](https://github.com/Giaxeri)). Jefes: Undyne the Undying, Muffet, Mettaton EX y Napstablook.


Recreación fan (no comercial) del combate contra Undyne the Undying de UNDERTALE, en HTML5 Canvas + JavaScript.
UNDERTALE y sus assets pertenecen a Toby Fox. Los assets de `assets/` se extraen de tu propia copia del juego.

## Extraer assets
    python3 tools/extract.py "C:/Program Files (x86)/Steam/steamapps/common/Undertale/data.win" assets
(necesita Python 3 + Pillow). La música (`mus_x_undyne*.ogg`) se copia de la carpeta del juego a `assets/audio/`.

## Ejecutar
    npx http-server -c-1 -p 8000
y abre http://localhost:8000

## Controles
- Al abrir: "List of Bosses" -> Undyne the Undying -> "Battle Against a True Hero" (pelea completa) o un ataque suelto para practicarlo. Esc vuelve a la lista de ataques
- Z: confirmar · X: cancelar (el ratón no hace nada)
- Flechas: moverse en el menú; en el turno de Undyne, orientar el escudo (mantener pulsada)
- M: silenciar / reactivar el sonido (volumen en `VOLUME` de `src/assets.js`)

## Qué hay implementado (traducido del código del juego)
- Menú de batalla: FIGHT (barra de ataque, tajo, número de daño y barra de vida), ACT > Check, MERCY > Spare. ITEM vacío.
- Daño a Undyne: (AT + arma − DEF + azar(2)) × precisión × 21, mínimo 600 (obj_undyne_ex Alarm_3).
- Turno de Undyne en modo verde: ataques lesson −5 y −6 (obj_spearblocker Other_11), escudo, lanzas y daño (scr_damagestandard).
- "rating" sube si te golpean (lanzas más lentas) y baja si no (obj_undyne_ex Step).
- Pelea completa con el orden real de ataques: verde (lessons -5 a -14) y rojo (orderb 0-7), con los cambios de color del juego.
- Nombres de ataques: el juego no los tiene, son inventados (ver src/attacks.js).
- Final completo: diálogo de Undyne con sus caras, se derrite y se convierte en polvo; después vuelve al menú.
- ITEM: 4 Astronaut Food (curan 21) en la página 1 y 2 Sea Tea (curan 10 y suben la velocidad del alma roja) en la página 2.

## Estructura
- `src/main.js`   bucle a 30 FPS y entrada
- `src/battle.js` máquina de estados del combate, menú, ataque del jugador
- `src/green.js`  ataques del modo verde (escudo + lanzas)
- `src/text.js`   escritor de texto de batalla
- `src/undyne.js` Undyne armada por piezas (spr_undynex_*)
- `src/assets.js` carga de sprites/fuentes, drawSprite (estilo GameMaker) y texto bitmap
- `tools/`        lector de data.win y extractor

## Muffet ("Spider Dance")
- Traducida de obj_spiderb / obj_spiderb_body / obj_spiderbulletgen / obj_purpleheart / obj_fakeborderdraw.
- Alma morada en 3 hilos: izquierda/derecha para moverte, arriba/abajo para cambiar de hilo.
- 16 turnos distintos (arañas, dónuts, cruasanes y 3 turnos con la mascota), el té morado del principio,
  el cartel "Up Next", ACT Check / Struggle / Pay (empiezas con 100G), el telegrama y el perdón final.
- Código en src/muffet.js y src/muffetbody.js.

## Mettaton EX ("Death by Glamour")
- Traducido de obj_mettatonex / obj_mettb_body / obj_ratingsmaster / obj_mettattackgen y sus balas.
- Alma amarilla: durante su turno, **Z dispara** hacia arriba (rompe cajas, activa bombas, pulsa botones amarillos, invierte la bola de discoteca).
- ACT: Check / Boast / Pose / Heel Turn. RATINGS con su gráfica y la lista de puntos.
- 20 turnos con sus frases, el ensayo del turno 5 (escribe con el teclado, sin Z ni X), los 4 heart-to-heart,
  se le caen los brazos y las piernas. Finales: la llamada de los espectadores (12000 de RATINGS, o 10000 desde el turno 19)
  o vida a 0. Música: `mus_mettaton_ex.ogg` y `mus_mettsad.ogg`.
- Código en src/mettaton.js, src/mettbody.js y src/mettbullets.js (src/gm.js imita el movimiento de GameMaker).

## Napstablook ("Ghost Fight")
- Traducido de obj_napstablook / obj_crygen1-3 / blt_crybullet / blt_streambullet / blt_blookhat.
- ACT: Check / Flirt / Threat / Cheer. Anímalo 3 veces para ver "Dapper Blook"; después anímalo o coquetea y se va contento.
  Si respondes otra cosa: "i knew it..." y llora más rápido. Si le bajas la vida: "umm... you do know you cant kill ghosts, right?".
- Música: `mus_ghostbattle.ogg`. Código en src/napstablook.js.
