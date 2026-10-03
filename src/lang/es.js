// ============================================================================
//  Textos en español (latinoamericano neutro). Traducción propia a partir de los textos en inglés del juego.
//  Mismos códigos que el juego: & salto de línea, / fin de mensaje, % fin, ^N pausa, \EN cara.
//  Límites de cada tipo de texto (los comprueba tools/check_es.mjs):
//    caja de batalla: 33 letras por línea, 3 líneas por mensaje
//    globos anchos: ~20 letras, 4 líneas   ·   globos pequeños: 8 letras
// ============================================================================
export const ES = {};

// ---------------------------------------------------------------- interfaz (clave = texto en inglés)
ES.ui = {
  // página principal y créditos
  'Bosses List': 'Lista de Jefes', 'Loading...': 'Cargando...', 'Options': 'Opciones', 'Player': 'Jugador',
  'Resolution': 'Resolución', 'Language': 'Idioma', 'Name': 'Nombre', 'Back': 'Volver',
  'Small': 'Pequeña', 'Default': 'Normal', 'Large': 'Grande',
  'Left / Right: change the size of the game.': 'Izquierda / Derecha: cambia el tamaño del juego.',
  'Left / Right on Language: English / Español.': 'Izquierda / Derecha en Idioma: English / Español.',
  'Z on Name: choose the name used in battle.': 'Z en Nombre: elige el nombre que usas en combate.',
  'X: go back.': 'X: volver.',
  'Press Z to proceed · Press X to go back': 'Presiona Z para avanzar · Presiona X para regresar',
  'Name the fallen human.': 'Nombra al humano caído.', 'Quit': 'Salir', 'Backspace': 'Borrar', 'Done': 'Listo',
  'Up to 6 letters.': 'Hasta 6 letras.',
  'Press ESC to return to the menu': 'Pulsa ESC para volver al menú',
  'VOLUME': 'VOLUMEN', 'MUTE': 'MUDO',
  'Made by:': 'Hecho por:', 'on Github!': '¡en GitHub!',
  'Buy UNDERTALE at undertale.com': 'Compra UNDERTALE en undertale.com',
  // aviso de fan-game (4 líneas; la 2 lleva el ® detrás de UNDERTALE y la 4 el enlace en amarillo)
  'tribute1': 'Tributo a UNDERTALE hecho por fans, sin fines de lucro.',
  'tribute2': 'UNDERTALE    pertenece a Toby Fox.',
  'tribute3': 'Apoya el lanzamiento oficial:',
  'tribute4a': '     Compra UNDERTALE en ', 'tribute4b': 'undertale.com',
  // jefes y peleas completas (nombres de las canciones)
  'Undyne the Undying': 'Undyne la Inmortal',
  'Battle Against a True Hero': 'Lucha contra un Verdadero Héroe', 'Spider Dance': 'Danza de Araña',
  'Death by Glamour': 'Muerte por Glamour', 'Ghost Fight': 'Pelea Fantasmal',
  // ataques sueltos (los nombres son inventados)
  "Heroine's Welcome": 'Bienvenida Heroica', 'Left and Right': 'Izquierda y Derecha', 'Spear Drizzle': 'Llovizna de Lanzas',
  'Spear Summon': 'Invocar Lanzas', 'Rising Spears': 'Lanzas Ascendentes', 'Crossfire': 'Fuego Cruzado', 'Skyfall': 'Caída del Cielo',
  'Twisting Tide': 'Marea Retorcida', 'Circle of Spears': 'Círculo de Lanzas', 'Reverse Rush': 'Embestida Inversa',
  'Double Feint': 'Doble Finta', 'Mirror Dance': 'Danza del Espejo', 'Spear Downpour': 'Aguacero de Lanzas',
  'Spinning Ambush': 'Emboscada Giratoria', 'Chaotic Circle': 'Círculo Caótico',
  'Spider Parade': 'Desfile de Arañas', 'Rush Hour': 'Hora Pico', 'Double Trouble': 'Doble Problema',
  'Donut Delivery': 'Entrega de Donas', 'Breakfast Time': 'Hora del Desayuno', 'Bouncing Donuts': 'Donas Saltarinas',
  'Web Scramble': 'Enredo de Telaraña', 'Bakery Mix': 'Mezcla de Panadería', 'Croissant Boomerang': 'Cruasán Bumerán',
  'Lunch Time': 'Hora del Almuerzo', 'Tea Party': 'Fiesta de Té', 'Donut Storm': 'Tormenta de Donas',
  'Croissant Rain': 'Lluvia de Cruasanes', 'Middle Lane': 'Carril Central', 'Full Menu': 'Menú Completo', 'Dinner Time': 'Hora de la Cena',
  'Leg Sweep': 'Barrido de Piernas', 'Umbrella Bombs': 'Bombas Paraguas', 'Leg Traffic': 'Tráfico de Piernas',
  'Arm Barrier': 'Barrera de Brazos', 'Essay Question': 'Pregunta de Ensayo', 'Heart-to-Heart': 'De Corazón a Corazón',
  'Parasol Rain': 'Lluvia de Sombrillas', 'Disco Ball': 'Bola de Discoteca', 'Bomb Squad': 'Escuadrón Bomba',
  'Happy Breaktime': 'Feliz Descanso', 'Heart Shield': 'Escudo Corazón', 'Rewind': 'Rebobinar', 'Box Rush': 'Avalancha de Cajas',
  'Heart Bombs': 'Bombas Corazón', 'Final Heart': 'Corazón Final', 'Bomb Alley': 'Callejón de Bombas',
  'Lightning Parasols': 'Sombrillas Eléctricas',
  'Not Feelin Up To It': 'Sin Ganas', 'Tear Shower': 'Lluvia de Lágrimas', 'Crawling Tears': 'Lágrimas Trepadoras',
  'Dapper Blook': 'Blook Chic',
  // menús de batalla
  'Check': 'Revisar', 'Spare': 'Perdonar', 'PAGE': 'PÁG', 'LV': 'NV',
  'Struggle': 'Forcejear', 'Pay': 'Pagar', 'Your Money': 'Tu dinero',
  'Boast': 'Presumir', 'Pose': 'Posar', 'Heel Turn': 'Ser villano',
  'Flirt': 'Coquetear', 'Threat': 'Amenazar', 'Cheer': 'Animar',
  'Up Next': 'Siguiente',
  // objetos: textos que se añaden al usarlos
  '&* Your SPEED boosts!': '&* ¡Tu VELOCIDAD aumenta!',
  '&* ATTACK increased by 4!': '&* ¡El ATAQUE aumentó en 4!',
  '&* Your HP was maxed out./': '&* Tus PV están al máximo./',
  'recovered': '&* ¡Recuperaste {n} PV!/',
  ' &* Very un-licorice-like.': ' &* No sabe nada a regaliz.',
  ' &* ... tastes like licorice.': ' &* ... sabe a regaliz.',
  "* Don't worry^1, Spider didn't.": '* Tranquilo^1, la araña no&  te comió a ti.',
  // ensayo de Mettaton
  'ESSAY PROMPT:': 'ENSAYO:', 'What do you': '¿Qué es lo que', 'love most about': 'más te gusta', 'Mettaton?': 'de Mettaton?',
  '(No X or Z)': '(Sin X ni Z)', 'TIME UP!!!': '¡TIEMPO!!!', '[START TYPING]': '[ESCRIBE ALGO]',
  'RATINGS': 'AUDIENCIA',
  'Violence': 'Violencia', 'Disappoint': 'Decepción', 'Justice': 'Justicia', 'Action': 'Acción',
  'OnBrandFood': 'ComidaMarca', 'Dramatic': 'Dramático', 'Writing': 'Escritura',
};

// ---------------------------------------------------------------- objetos
ES.items = {
  astro: { name: 'Comida de Astronauta', short: 'Com.Astro', use: '* Comes la Comida de Astronauta.' },
  seatea: { name: 'Té Marino', short: 'Té Marino', use: '* Bebes el Té Marino.' },
  candy: { name: 'Caramelo de Monstruo', short: 'Caramelo', use: '* Comes el Caramelo de Monstruo.' },
  donut: { name: 'Dona de Araña', short: 'DonaAraña', use: '* Comes la Dona de Araña.' },
  hotdog: { name: 'Hot Dog...?', short: 'Hot Dog', use: '* Comes el Hot Dog...?' },
  bunny: { name: 'Conejo de Canela', short: 'C. Canela', use: '* Comes el Conejo de Canela.' },
  glam: { name: 'Glamburguesa', short: 'Glamburg.', use: '* Comes la Glamburguesa.' },
  hero: { name: 'Héroe Legendario', short: 'H.Legend.', use: '* Comes el Héroe Legendario.' },
};

// ---------------------------------------------------------------- Undyne the Undying
ES.undyne = {
  intro: '* Aparece la heroína./^',
  check: '* UNDYNE LA INMORTAL 99ATQ 99DEF&* Heroína que renació con su&  DETERMINACIÓN por la Tierra./',
  flavor: '* El viento aúlla.../^',
  name: 'Undyne la Inmortal',
  death1: ['Maldición.../', '¿Así que ni siquiera&ESE poder..^1.&fue suficiente...?/', '.../', '\\E1Je.../', 'Jejejeje.../',
           '\\E2Si tú..^1./', 'Si crees que voy a&rendirme^1,&te equivocas./', 'Porque tengo..^1.&a mis amigos&detrás de mí./',
           '\\E3Alphys me dijo que&me vería pelear&contigo.../', '\\E4Y si algo salía&mal^1, ella iba a..^1.&evacuar a todos./',
           '\\E5Ya debió llamar a&ASGORE para que&absorba las 6&ALMAS humanas./%%'],
  death2: ['Y con ese&poder.../%%'],
  death3: ['¡Este mundo&seguirá vivo...!/%%'],
};

// ---------------------------------------------------------------- Muffet
ES.muffet = {
  intro: '* ¡Muffet te atrapa!/^',
  flavors: ['* Muffet te sirve una taza de&  arañas.', '* Todas las arañas aplauden al&  ritmo de la música.', '* Muffet baila sincronizada&  con las demás arañas.',
            '* Muffet arregla la telaraña&  a tu alrededor.', '* Huele a telarañas recién&  horneadas.'],
  check: '* MUFFET - ATQ 38.8 DEF 18.8&* Si te invita a su salón^1,&  discúlpate y vete./',
  talk: [['¿Por qué esa palidez?&Deberías estar feliz~/%%'], ['Feliz porque vas a&convertirte en un&pastel delicioso~&Ahuhuhu~/%%'],
         ['¿Dejarte ir^1?&No digas tonterías~/%%'], ['Tu ALMA va a hacer&muy felices a todas&las arañas~~~/%%'],
         ['¡Oh, qué descortés!&Casi olvido&presentarte a&mi mascota~/', 'Es la hora del&desayuno, ¿verdad?&Diviértanse los dos~/%%'],
         ['La persona que nos&advirtió sobre ti.../%%'], ['Nos ofreció MUCHO&dinero por tu ALMA./%%'], ['Tenía una sonrisa&tan dulce~ y...&ahuhu~/%%'],
         ['Es extraño, pero&juraría que la vi&en las sombras...&¿Cambiando de forma?/%%'],
         ['Oh, es la hora del&almuerzo, ¿no?&¡Y olvidé darle de&comer a mi mascota~/%%'],
         ['Con ese dinero, los&clanes de arañas por&fin podrán estar&reunidos~/%%'],
         ['¿No te enteraste?&¡Hay arañas&atrapadas en las&RUINAS hace siglos!/%%'],
         ['Aunque pasen bajo la&puerta, solas nunca&cruzarían el frío&mortal de Snowdin./%%'],
         ['Pero con el dinero&de tu ALMA podremos&rentarles una&limusina climatizada~/%%'],
         ['Y con todo lo que&sobre...^1?&Podríamos irnos de&vacaciones~/', 'O construir un&campo de béisbol&para arañas~/%%'],
         ['Pero basta de eso...&Es la hora de la&cena, ¿verdad?&Ahuhuhu~/%%']],
  talkAfter: ['Ahuhuhu~&¿Qué estás&haciendo~?/%%', 'Ya es hora de irte~/%%', '¿Qué se siente estar&en esa telaraña?/%%', 'Ahuhuhuhu~&Bueno, no me&molesta tenerte&aquí~/%%',
              'Si no te molesta&que te devoren~&Ahuhuhu~/%%', 'Es broma,&claro~/%%', '...&bueno... quizás&UN mordisquito&nada más~~/%%', 'No, no, ya&es hora de irte~/%%', '.../%%'],
  talkDefault: ['¿Qué pasa,&cariño?/%%'],
  blue: 'No te pongas tan&azul^1, cariño~/%%',
  purple: '... Creo que el&morado te queda&mucho mejor~&Ahuhuhu~/%%',
  trapped: '* ¡Te atrapa una extraña&  telaraña morada!/^',
  dessert: ['¿Sigues con vida^1?&Ahuhuhu~/', 'Oh, mi mascota~&Parece que es la&hora del postre~/%%'],
  telegram: ['¿Eh?&¿Un telegrama de&las arañas de las&RUINAS?/', '¿Qué?&Dicen que te&vieron, y.../', '... que aunque dañes&a otros^1, ¡jamás&dañaste a una sola&araña!/',
             'Ay, todo esto ha&sido un gran&malentendido~/', 'Creí que eras de los&que odian a las&arañas~/', 'La persona que&pidió esa ALMA.../',
             'Seguro se refería a&OTRO humano con&camisa a rayas~/', 'Perdón por todas&las molestias~&Ahuhuhu~/', 'Te lo compensaré~/',
             'Puedes volver aquí&cuando quieras...&Y sin pagar&nada.../', '¡Te envolveré en&telaraña y podrás&jugar otra vez con&mi mascota!/', 'Ahuhuhuhuhuhu~&Es broma~/',
             'Ahora te PERDONARÉ~/%%'],
  sparing: '* Muffet te está perdonando./^',
  won: (xp, g) => `* ¡GANASTE!&* Obtuviste ${xp} EXP y ${g} de oro./`,
  struggleNothing: '* Intentas zafarte de la red^1.&* No pasó nada./',
  struggle0: '* Intentas zafarte de la red^1.&* Muffet se tapa la boca y&  se ríe de ti./',
  struggle1: '* Intentas zafarte de la red^1.&* Muffet se ríe y aplaude./',
  struggle2: ['* Intentas zafarte de la red./', '* ¡A Muffet le hacen tanta&  gracia tus payasadas que te&  hace un descuento!/'],
  refuse: '* Muffet rechaza tu dinero./',
  pay: p => `* Pagas ${p}G^1.&* ¡Muffet reduce su ATAQUE&  en este turno!/`,
  broke: ['* Vacías tus bolsillos..^1.&* ¡Pero no tienes nada de&  dinero!/', '* Muffet se apiada de ti y&  reduce su ATAQUE en este&  turno./'],
  outOfMoney: '* Te quedaste sin dinero^1.&* Muffet niega con la cabeza./',
  notEnough: '* Vacías tus bolsillos^1, pero&  no te alcanza el dinero.&* Muffet baja el precio./',
};

// ---------------------------------------------------------------- Mettaton EX
ES.mettaton = {
  intro: '* ¡Mettaton EX hace su estreno!',
  check: '* METTATON EX - ATQ 47 DEF 47&* Su punto débil es su núcleo&  en forma de corazón./^',
  boast: ['* Dices que no te van a dar&  NI UN golpe./', '* La audiencia sube poco a&  poco en el turno de Mettaton./^'],
  heel: ['* Le das la espalda al público&  con desprecio./', '* ¡Todos quieren verte caer&  en este turno!/^'],
  pose: ['* Posaste dramáticamente^1.&* El público asiente./^', '* Aun con tus heridas^1,&  posaste dramáticamente^1.&* El público aplaude./^',
         '* Aun con graves heridas^1,&  posaste dramáticamente^1.&* El público se asombra./^', '* Con tus últimas fuerzas^1,&  posas dramáticamente^1.&* El público grita./^'],
  flav: ['* Mettaton.', '* Mettaton.', '* Mettaton.', '* Mettaton.', '* Huele a Mettaton.'], lowhp: '* Mettaton tiene pocos PV.',
  essaySaved: '* Mettaton guarda tu ensayo&  para usarlo en el futuro.',
  glam: '* Comes la Glamburguesa.&* ¡El público ama la marca!',
  talk: {
    1: [0, ['¡Luces!&¡Cámara!&¡Acción!/%%']], 2: [0, ['¡Drama!&¡Amor!&¡Sangre!/%%']], 3: [0, ['¡Soy el&ídolo&que&todos&adoran!/%%']],
    4: [0, ['¡Sonríe&a la&cámara!/%%']],
    5: [1, ['¡Oooh, es hora de&una prueba sorpresa!/', 'Espero que hayas&traído un teclado.../', '¡Esta es una pregunta&de ensayo!/%%']],
    6: [1, ['Tu ensayo le mostró&a todos tu corazón./', '¿Por qué no te&muestro el mío?/%%']], 7: [0, ['¡Oooh,&esto&apenas&empieza!/%%']],
    8: [1, ['¿¡Pero qué tal te va&en la pista de baile!?/%%']], 9: [0, ['¿¡Puedes&seguir&el&ritmo!?/%%']], 10: [0, ['¡Luces!&¡Cámara!&¡Bombas!/%%']],
    11: [0, ['¡Todo&vuela&por los&aires!/%%']], 12: [1, ['¡Hora de nuestro&descanso sindical!/%%']],
    13: [1, ['Nos hemos alejado&tanto, cariño.../', '¿Qué tal otra charla&de corazón a corazón?/%%']],
    14: [1, ['¿B.. brazos?&¿Qu... quién necesita&brazos con estas&piernas?/', '¡Aún voy a&ganar!/%%']], 15: [0, ['¡Vamos&...!/%%']],
    16: [0, ['¡El show&...&debe&seguir!/%%']], 17: [0, ['Dr...&¡Drama!&A...&¡Acción!/%%']],
    18: [1, ['\\E5L... luces...&C... cámara.../', '¡Ya basta!&¿¡De verdad quieres que&la humanidad perezca!?/', '\\E7... ¿o de verdad&confías tanto en ti?/%%']],
    19: [1, ['¡Jaja, qué inspirador!/', '¡Bueno, cariño!&¡Eres tú o&soy yo!/', '\\E4Pero creo que ambos&ya sabemos quién&va a ganar./', '\\E8¡Contempla el verdadero&poder de la estrella&de la humanidad!/%%']],
    20: [1, ['... entonces.../', '\\E8¿Eres TÚ la estrella?/', '¿¡De verdad puedes&proteger a la&humanidad!?/%%']],
  },
  kill: ['J.. ja.../', 'Así que me equivoqué./', 'Cariño.../', '\\E1De verdad eres lo&bastante fuerte para&vencer a ASGORE./', '\\E0Bueno.../', 'Es hora de que&te vayas./',
         '\\E0No te preocupes&por mí./', 'Puede que parezca&que me muero^1,&pero.../', '\\E1La Dra. Alphys&siempre podrá&repararme./', '\\E0Y... además.../',
         'Aunque no tenga lo&necesario para ser&una estrella.../', '\\E1Pude actuar para&un humano, ¿no?/', 'Así que gracias,&cariño.../%%'],
  kill2: ['\\E1¡Fuiste un público&maravilloso!/%%'],
  call1: ['OOH^1, ¡MIRA ESTA&AUDIENCIA!!!/', '\\E6¡ES LA MAYOR&AUDIENCIA QUE HE&TENIDO JAMÁS!!!/', '¡HEMOS ALCANZADO LA&META DE LLAMADAS&DEL PÚBLICO!/',
          '\\E8UN ESPECTADOR CON&SUERTE PODRÁ&HABLAR CONMIGO.../', '\\E7... ¡ANTES DE QUE&DEJE EL SUBSUELO&PARA SIEMPRE!!/', '\\E9¡VEAMOS QUIÉN&LLAMA PRIMERO!/%%'],
  call2: ['\\E0HOLA^1, ¡ESTÁS&EN LA TV!/', '¿QUÉ TIENES PARA&DECIR EN ESTE^1,&NUESTRO ÚLTIMO&PROGRAMA???/%%'],
  blook: ['...../', 'oh......../', '\\E1hola..^1.&mettaton.../', 'me gustaba mucho&ver tu programa.../', 'mi vida es bastante&aburrida..^1. pero.../',
          'verte en la&pantalla..^1. traía&emoción a mi vida..^1.&indirectamente/', 'no estoy seguro^1,&pero..^1. ¿este es el&último episodio...?/',
          '\\E3te voy a extrañar..^1.&mettaton....../', '... oh...^1. no quería&hablar tanto.../', '\\E2oh........../%%'],
  call3: ['NO^1, ¡ESPERA^1!&¡ESPERA^1, BL.../', '\\E1Y..^1.&YA COLGÓ./', '\\E3.../', '\\E0¡¡¡VOY CON OTRA&LLAMADA!!!/%%'],
  fans: [[530, 200, 420, '\\E1Mettaton^1, ¡tu&show nos hizo tan&felices!/%%'], [560, 200, 450, 'Mettaton^1, no sé qué&voy a ver sin ti./%%'],
         [520, 200, 410, 'Mettaton^1, hay un&hueco con forma de&Mettaton en mi&corazón mettatónico./%%']],
  farewell: ['\\E3AH..^1. YO.../', 'YA VEO.../', '\\E4.../', 'TODOS..^1.&MUCHAS GRACIAS./', '.../', '\\E0CARIÑO./',
             '\\E1QUIZÁS..^1. SEA MEJOR&QUE ME QUEDE AQUÍ&UN TIEMPO./', '\\E2LOS HUMANOS YA TIENEN&ESTRELLAS E ÍDOLOS^1,&PERO LOS MONSTRUOS.../',
             '\\E0SOLO ME TIENEN A MÍ./', '\\E1SI ME FUERA..^1.&EL SUBSUELO PERDERÍA&SU CHISPA./', '\\E3DEJARÍA UN VACÍO&DOLOROSO QUE NUNCA&PODRÍA LLENARSE./',
             '\\E0ASÍ QUE..^1. CREO QUE&TENDRÉ QUE POSPONER&MI GRAN DEBUT./', '\\E2ADEMÁS./', '\\E1HAS DEMOSTRADO SER&MUY FUERTE./',
             '\\E0QUIZÁS..^1. INCLUSO LO&BASTANTE PARA VENCER&A ASGORE./', '\\E0SEGURO QUE PODRÁS&PROTEGER A LA&HUMANIDAD./', '\\E4JA^1, JA.../',
             'DE TODAS FORMAS^1, ES&LO MEJOR./', '\\E3LA VERDAD ES QUE EL&CONSUMO DE ENERGÍA&DE ESTA FORMA ES.../', 'INEFICIENTE./',
             'EN UNOS MOMENTOS^1,&ME QUEDARÉ SIN&BATERÍA^1, Y.../', '\\E4BUENO./', '\\E0ESTARÉ BIEN./', '\\E5¡A ROMPERLA^1,&CARIÑO!/',
             '\\E0Y A TODOS..^1.&GRACIAS./', '¡FUERON UN PÚBLICO&MARAVILLOSO!/%%'],
};

// ---------------------------------------------------------------- ensayo de Mettaton (respuestas y palabras que reconoce)
ES.essay = {
  speechless: ['¿Sin palabras...?&¿Quién podría culparte?/%%'],
  concise: ['Vaya... qué conciso./%%'],
  fewest: ['Hermoso. A veces&las pocas palabras&dicen más que mil./%%'],
  star: ['Bien. Te ganas una&estrella dorada./%%'],
  great: ['Vaya... qué gran&respuesta./%%'],
  passion: ['Oooooh, dijiste&tanto sobre mí.../', 'Me encanta tu&pasión./', '... aunque no&entendí lo que&dijiste.../%%'],
  book: ['Hermoso.&¿Por qué no&escribes un libro?/%%'],
  beaut1: ['Buen detalle...&Tienes razón, me&veo bastante bien./%%'],
  beaut3: ['¡Maravilloso! ¡Genial!&¡10 de 10! SOY&totalmente&deslumbrante./%%'],
  beaut5: ['Ay, me sonrojo...&Tienes toda la razón,&soy hermoso en&todos los sentidos./%%'],
  beaut7: ['Vaya... no tengo&palabras... Captaste&a la perfección lo&hermoso que soy./%%'],
  legs: ['Así es.&¡Piernas era la&respuesta correcta!/%%'],
  arms: ['Qué creativo. Brazos...&la mayoría solo&piensa en mis piernas./%%'],
  hair: ['Mi cabello... sí,&uso gel metálico./%%'],
  personality: ['Sí^1, mi personalidad&es encantadora^1,&¿verdad?/%%'],
  voice: ['Dicen que tengo la&voz de una Sirena..^1./', '... ¡auuuga!/%%'],
  dance: ['¿Bailar...^1?&Gracias^1, soy&autodidacta./%%'],
  mean: ['¿Eh? Este ensayo&debería ser sobre mí,&no sobre ti.../%%'],
  love: ['¡Qué confesión tan&conmovedora! La&añadiré al montón./%%'],
  toby: ['¿Toby? ¿Qué diablos&es eso?&Suena... sexy./%%'],
  swear: ['¡Vaya! Este es un&programa familiar./', 'Ahora no te muevas&mientras te asesino./%%'],
  // palabras (se buscan dentro del texto escrito, sin mayúsculas)
  W: {
    beaut: ['bell', 'hermos', 'guap', 'lind', 'precios', 'sexy', 'atractiv', 'encant', 'elegan', 'radiant', 'bonit', 'adorab', 'deslumbr',
            'fabulos', 'perfect', 'divin', 'seduct', 'cautiv', 'brill', 'espectacular', 'hot', 'belleza'],
    legs: ['piern'], arms: ['brazo'], hair: ['pelo', 'cabello'],
    personality: ['personalidad'], voice: ['voz'], dance: ['bail', 'danza'],
    mean: ['feo', 'fea ', 'horrible', 'repugnante', 'asqueros', 'estupid', 'estúpid', 'idiota', 'tonto', 'imbecil', 'imbécil', 'perdedor', 'ridicul', 'ridícul'],
    love: ['te amo', 'te quiero'], notLove: [],
    toby: ['toby'],
    swear: ['mierda', 'puta', 'puto', 'joder', 'verga', 'culo', 'coño', 'pene', 'vagina', 'pendej', 'caca', 'carajo', 'chingad', 'pinche', 'bepis'],
  },
};

// ---------------------------------------------------------------- Napstablook
ES.napsta = {
  intro: '* Aquí viene Napstablook.',
  check: '* NAPSTABLOOK - ATQ 10 DEF 10&* Este monstruo no parece tener&  sentido del humor.../^',
  threat: '* Miras a Napstablook con&  crueldad./^',
  console: '* Intentas consolar a&  Napstablook.../^',
  cheer: { '-400': '* Le das a Napstablook una&  sonrisa paciente./^', '-300': '* Le cuentas a Napstablook un&  chistecito./^', '-200': '* Napstablook quiere&  mostrarte algo./^' },
  random: ['estoy&bien,&gracias.', 'ahí&vamos&nomás...', 'nnnnnn&ggghhh.'],
  flavors: ['* Napstablook mira hacia la&  nada.', '* Napstablook desearía no&  estar aquí.', '* Napstablook finge que&  duerme.', '* Un leve olor a ectoplasma&  impregna el lugar.'],
  better: '* Napstablook se ve un poco&  mejor.',
  better2: '* Los ánimos parecen haber&  mejorado el humor de&  Napstablook otra vez.',
  awaits: '* Napstablook espera tu&  respuesta con ansias.',
  dapper1: 'lo&llamo&"blook&chic"', dapper2: '¿te&gusta&mi&estilo?',
  kill: ['mmm... sabes que&no puedes matar&fantasmas, ¿no?/', 'somos medio&incorpóreos y&eso/', 'solo estaba bajando&mis pv porque no&quería ser&descortés/',
         'perdón..^1.&solo lo hice&más incómodo.../', 'finge que me&  venciste.../', 'uuuuuuuuu^1u%%'],
  won: '* ¡GANASTE!&* Perdiste 1 punto de EXP./%',
  lines: { check: 'oh, soy&MUY&chistoso', threat: 'anda,&hazlo.', flirt: 'solo te&sería&una&carga.', heh: 'je...', heheh: 'je&je...',
           letme: 'déjame&intentar&algo...', knew: 'lo&sabía...', ohno: 'ay&no...', gee: 'ay&vaya...' },
};

// ---------------------------------------------------------------- jefes con su propio archivo de textos
import toriel from './es_toriel.js';
import papyrus from './es_papyrus.js';
import asgore from './es_asgore.js';
import sans from './es_sans.js';
import asriel from './es_asriel.js';
export const BOSS_TEXTS = [toriel, papyrus, asgore, sans, asriel];
for (const m of BOSS_TEXTS) { Object.assign(ES.ui, m.ui || {}); Object.assign(ES.items, m.items || {}); ES[m.ns] = { ...(ES[m.ns] || {}), ...(m.texts || {}) }; }
