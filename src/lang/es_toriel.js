// Textos en español de este jefe (mismo formato que src/lang/es.js).
//   ui:    textos sueltos de la interfaz (clave = texto en inglés), p. ej. nombres de ataques y opciones de ACT
//   texts: la versión en español del objeto texts('toriel', {...}) del combate
//   items: nombres en español de objetos nuevos, p. ej. { pie: { name, short, use } }
//   rules: límites de los globos para tools/check_es.mjs, p. ej. { talk: [20, 4] } (letras por línea, líneas)
// Globos de Toriel: pequeño (spr_blconsm, 105 px, texto a +15 con 9 px por letra) ~10 letras;
// ancho (spr_blconwdshrt, 239 px, texto a +36): typer 8/12 (9-10 px) ~20, typer 13 (11 px) ~18, typer 14 (14 px) ~14, typer 15 (18 px) ~11
// (los espacios del final de "Mi cielo." son solo una pausa, como en el juego).
export default {
  ns: 'toriel',
  ui: {
    'Toriel': 'Toriel', 'Heartache': 'Angustia', 'Talk': 'Hablar',
    'Falling Flames': 'Llamas que Caen', 'Fire Dance': 'Danza de Fuego', 'Flame Curtain': 'Cortina de Llamas',
    'Two Hands': 'Dos Manos', 'Hand of Fire': 'Mano de Fuego', 'Gentle Flames': 'Llamas Amables',
  },
  texts: {
    intro: '* ¡Toriel te cierra el paso!',
    check: '* TORIEL - ATQ 80 DEF 80&* Sabe lo que es mejor para ti./^',
    talk: ['* No se te ocurrió ningún&  tema de conversación./^', '* Intentaste pensar en algo&  que decir otra vez^1, pero.../^',
           '* Irónicamente^1, hablar no parece&  ser la solución a esta&  situación./^'],
    talkTK: ['* Pensaste en decirle a Toriel&  que la viste morir./', '* Pero...&* Eso da escalofríos./',
             '* ¿Puedes mostrar piedad sin&  pelear ni huir...?/^'],
    talkTK2: '* ¿Puedes mostrar piedad&  sin huir...?/^',
    flavors: ['* Toriel prepara un ataque&  mágico.', '* Toriel mira a través de ti.', '* Toriel se muestra distante.', '* Toriel respira hondo.', '* ...'],
    small: [' .....', ' .....& .....', ' .....& .....& .....', ' ...?', ' ¿Qué& estás& haciendo?', ' ¡Ataca& o huye!',
            ' ¿Qué& pruebas& así?', ' ¡Pelea& conmigo& o vete!', ' Basta.', ' Deja de& mirarme& así.', ' ¡Vete!', ' ...', ' ...& ...'],
    wide: ['Sé que quieres&ir a casa^1, pero...', 'Pero por favor...&ve arriba ahora.', 'Te prometo que&cuidaré bien de&ti aquí.',
           'Sé que no tenemos&mucho^1, pero...', 'Podemos tener una&buena vida aquí.', '¿Por qué haces&esto tan difícil?', 'Por favor^1, ve arriba.',
           '.....', 'Ja ja...', 'Patético^1, ¿verdad^2?&No puedo salvar ni&a una sola criatura.', '...'],
    spare: ['No^1, lo entiendo./', 'Aquí abajo^1, sin&salida^1, solo serías&infeliz./', 'Las RUINAS son muy&pequeñas cuando te&acostumbras a ellas./',
            'No estaría bien&que crecieras en&un lugar como este./', 'Mis expectativas...&Mi soledad...&Mi miedo.../',
            'Por ti^1, mi cielo...&los dejaré de lado./%%'],
    kill1: ['\\E0Ugh.../', '\\E0Eres más fuerte&de lo que pensé.../', 'Escúchame^1,&pequeña alma.../', 'Si cruzas&esta puerta,/',
            'Sigue caminando&lo más lejos&que puedas./', 'Tarde o temprano&llegarás a una&salida./', '\\E1..^1.&..../',
            '\\RASGORE\\X..^1.&Que \\RASGORE\\X no se&lleve tu alma./', 'Su plan&no puede&salir bien./'],
    kill2: ['\\E2....../', 'Pórtate bien^1,&¿sí?/'],
    kill3: ['\\E3Mi cielo.      %%'],
    betray1: ['\\E4Tú.../', '... en mi momento&más vulnerable.../', 'Y yo que me&preocupaba de que&no encajaras&allá afuera.../',
              '\\E5¡¡¡Jejejeje!!!&¡En verdad no te&diferencias en&nada de ellos!/'],
    betray2: ['\\E3Ja... ja... %%'],
  },
  items: {},
  rules: { small: [10, 4], wide: [21, 4], spare: [21, 4], kill1: [18, 4], kill2: [13, 4], kill3: [15, 1], betray1: [18, 4], betray2: [12, 1] },
};
