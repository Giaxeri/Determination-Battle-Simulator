# Determination Battle Simulator

**▶ Juega aquí:** https://giaxeri.github.io/Determination-Battle-Simulator/

> This is a non-profit, fan-made tribute to UNDERTALE. UNDERTALE® is owned by Toby Fox.
> Please support the official release: buy UNDERTALE at [undertale.com](https://undertale.com).

Simulador web de **varios jefes de UNDERTALE**, hecho en HTML5 Canvas + JavaScript puro (sin frameworks ni
dependencias). Cada combate está traducido del código original del juego (GameMaker): los patrones de ataque,
los tiempos, los textos y los sonidos son los del juego, a 640×480 y 30 FPS.

Puedes jugar la pelea completa de cada jefe o practicar cualquiera de sus ataques por separado.

Hecho por Gianfry ([Giaxeri](https://github.com/Giaxeri)).

---

## Jefes

| Jefe | Pelea completa | Ataques sueltos | Alma | Lo más característico |
|---|---|---|---|---|
| **Undyne the Undying** | *Battle Against a True Hero* | 15 | Verde (escudo) y roja | Orden real de ataques, cambios de color, final con diálogo y la caída en polvo |
| **Muffet** | *Spider Dance* | 16 | Morada (3 hilos) | Té morado inicial, cartel "Up Next", la mascota, Pay/Struggle y el telegrama |
| **Mettaton EX** | *Death by Glamour* | 17 | Amarilla (dispara con Z) | RATINGS con gráfica, ensayo con el teclado, heart-to-hearts y la llamada final |
| **Napstablook** | *Ghost Fight* | 4 | Roja | ACT Cheer / Flirt / Threat, "Dapper Blook" y las lágrimas que se aceleran |

### Undyne the Undying
- Modo verde: lessons −5 a −14 (el escudo se orienta con las flechas). Modo rojo: orderb 0–7.
- Daño a Undyne según el juego: (AT + arma − DEF + azar) × precisión × 21, mínimo 600.
- El "rating" sube si te golpean (lanzas más lentas) y baja si no.
- Traducido de `obj_undyne_ex`, `obj_spearblocker`, `obj_spearbulletfollowgen` y compañía.
- Los ataques no tienen nombre en el juego: los de la lista son inventados (`src/attacks.js`).

### Muffet
- Alma morada: izquierda/derecha para moverte, arriba/abajo para cambiar de hilo.
- 16 turnos (arañas, dónuts, cruasanes y 3 turnos con la mascota) y el cartel "Up Next" con el siguiente ataque.
- ACT: Check / Struggle / Pay (empiezas con 100G). El telegrama de las arañas de las RUINAS y el perdón final.
- Traducido de `obj_spiderb`, `obj_spiderb_body`, `obj_spiderbulletgen`, `obj_purpleheart` y `obj_fakeborderdraw`.

### Mettaton EX
- Alma amarilla: durante su turno **Z dispara** (rompe cajas, activa bombas, pulsa botones y gira la bola de discoteca).
- ACT: Check / Boast / Pose / Heel Turn. RATINGS con su gráfica y la lista de puntos.
- 20 turnos con sus frases, el ensayo del turno 5 (se escribe con el teclado), los 4 heart-to-heart y cómo pierde brazos y piernas.
- Finales: la llamada de los espectadores (12000 de RATINGS, o 10000 desde el turno 19) o dejarlo sin vida.
- Traducido de `obj_mettatonex`, `obj_mettb_body`, `obj_ratingsmaster`, `obj_mettattackgen` y sus balas.

### Napstablook
- ACT: Check / Flirt / Threat / Cheer. Anímalo 3 veces para ver "Dapper Blook" y se irá contento.
- Si respondes otra cosa: "i knew it..." y llora más rápido. Si le bajas la vida: "you do know you cant kill ghosts, right?".
- Traducido de `obj_napstablook`, `obj_crygen1-3`, `blt_crybullet`, `blt_streambullet` y `blt_blookhat`.

---

## Estadísticas y objetos por jefe

Cada combate usa el LV, el equipo y los objetos más habituales en ese punto del juego.
Los objetos van en 2 páginas: 4 del más flojo y 2 del más fuerte.

| Jefe | LV / HP | Arma / Armadura | Objetos (pág. 1 / pág. 2) |
|---|---|---|---|
| Undyne the Undying | 10 / 56 | Toy Knife / Faded Ribbon | 4 Astronaut Food / 2 Sea Tea |
| Muffet | 1 / 20 | Ballet Shoes / Old Tutu | 4 Hot Dog...? / 2 Cinnamon Bunny |
| Mettaton EX | 1 / 20 | Burnt Pan / Old Tutu | 4 Glamburger / 2 Legendary Hero |
| Napstablook | 1 / 20 | Stick / Bandage | 2 Monster Candy + 1 Spider Donut |

- A Muffet no se le dan objetos de araña (en el juego la hacen saltar directamente al final).
- Con Mettaton EX, la Glamburger y el Legendary Hero suben los RATINGS ("OnBrandFood").

---

## Características

- **Menú principal** al estilo del juego, con el alma como cursor y personajes decorando (Sans, Papyrus, Flowey, Napstablook, el perro...).
- **Pelea completa o ataque suelto** de cada jefe, para practicar.
- **Options**:
  - Resolución: Small / Default / Large. Todo escala con ella.
  - Nombre del jugador: hasta 6 letras, con la pantalla de nombre del juego. Por defecto "Player".
  - Se guardan en el navegador.
- **Volumen** con una barra arrastrable a la derecha del combate; la tecla M silencia.
- **Muerte como en el juego**: la música se corta, el alma se parte (`snd_break1`), estalla en pedazos (`snd_break2`) y vuelves a la lista de ese jefe.
- **Fuera del área de combate**:
  - En el menú: título, aviso de fan-game y créditos.
  - En combate: solo el volumen y "Press ESC to return to the menu".

## Controles

| Tecla | Acción |
|---|---|
| Flechas | Moverse por los menús y mover el alma (o el escudo con Undyne en modo verde) |
| Z | Confirmar · disparar con el alma amarilla |
| X | Cancelar · volver atrás |
| Esc | Salir del combate a la lista del jefe |
| M | Silenciar / reactivar el sonido |

El ratón solo se usa para la barra de volumen y los enlaces; el juego en sí se controla con el teclado.

---

## Ejecutar en local

El proyecto es estático: basta con servir la carpeta (los módulos ES no funcionan abriendo `index.html` directamente).

    npx http-server -c-1 -p 8000

Después abre http://localhost:8000. También sirve `python -m http.server 8000`.

## Extraer los assets

Los sprites, fuentes y sonidos de `assets/` se extraen del `data.win` de tu propia copia de UNDERTALE:

    python3 tools/extract.py "C:/Program Files (x86)/Steam/steamapps/common/Undertale/data.win" assets

- Necesita Python 3 y Pillow.
- La música (`mus_x_undyne*.ogg`, `mus_spider.ogg`, `mus_mettaton_ex.ogg`, `mus_mettsad.ogg`, `mus_ghostbattle.ogg`) se copia de la carpeta del juego a `assets/audio/`.
- Para añadir sprites o sonidos nuevos, agrégalos a las listas `SPRITES` / `SOUNDS` de `tools/extract.py` y vuelve a ejecutarlo.

---

## Estructura

    index.html            página, estilos, favicon y metadatos (SEO / Open Graph)
    src/
      main.js             bucle a 30 FPS, teclado y cambio de escenas (menú ↔ combate)
      menu.js             lista de jefes, lista de ataques, Options y pantalla de nombre
      ui.js               todo lo que va fuera del combate (título, créditos, volumen, ESC) y el escalado
      settings.js         nombre, resolución y volumen guardados en localStorage
      assets.js           carga de sprites, fuentes y audio; dibujo al estilo GameMaker y texto bitmap
      text.js             escritor de texto del juego (OBJ_WRITER)
      gm.js               utilidades que imitan el runner de GameMaker (movimiento, colisiones)
      battle.js           combate base: menú FIGHT/ACT/ITEM/MERCY, objetos, daño, muerte (+ Undyne)
      attacks.js          lista de ataques de Undyne
      undyne.js           cuerpo de Undyne armado por piezas
      green.js / red.js   ataques de Undyne con alma verde y roja
      muffet.js           combate de Muffet  (+ muffetbody.js)
      mettaton.js         combate de Mettaton EX  (+ mettbody.js, mettbullets.js)
      napstablook.js      combate de Napstablook
    tools/
      datawin.py          lector de data.win (GameMaker Studio 1.4)
      extract.py          extractor de sprites, fuentes y sonidos
    assets/               sprites, fuentes, efectos, música e iconos

## Añadir un jefe nuevo

1. Crea `src/<jefe>.js` con una clase que extienda `Battle` (`battle.js`) y exporte su lista de ataques.
2. Regístralo en `BOSSES` (`src/menu.js`) y en `CLASSES` (`src/main.js`).
3. Define `playerSetup()` con el LV y el equipo propios de ese punto del juego (`playerAt(lv, arma, armadura)`).
4. Define `itemSetup()` con 2 páginas: 4 objetos del más flojo y 2 del más fuerte, los más comunes en esa pelea (menos si el jefe es de la zona inicial).
5. Mantén el fondo negro y usa `this.gameOver()` al llegar a 0 de HP, para que la muerte funcione igual que en el resto.
6. Añade sus sprites y sonidos a `tools/extract.py`.

---

## Créditos

- **UNDERTALE** © Toby Fox. Todos los sprites, fuentes, sonidos y música pertenecen a su autor.
- Recreación, código y traducción de los combates: Gianfry ([Giaxeri](https://github.com/Giaxeri)).
- Proyecto sin ánimo de lucro. Si te gusta, compra el juego en [undertale.com](https://undertale.com).
