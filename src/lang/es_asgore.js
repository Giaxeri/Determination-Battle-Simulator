// Textos en español de este jefe (mismo formato que src/lang/es.js).
//   ui:    textos sueltos de la interfaz (clave = texto en inglés), p. ej. nombres de ataques y opciones de ACT
//   texts: la versión en español del objeto texts('asgore', {...}) del combate
//   items: nombres en español de objetos nuevos, p. ej. { pie: { name, short, use } }
//   rules: límites de los globos para tools/check_es.mjs, p. ej. { talk: [20, 4] } (letras por línea, líneas)
// Globos de Asgore (fnt_plain, 9 px por letra): pequeño (spr_blconsm, 105 px, texto a +25/+30) ~9 letras y 4 líneas;
// ancho (spr_blconwdshrt, 239 px, texto a +36) ~22 letras y 4 líneas.
export default {
  ns: 'asgore',
  ui: {
    'Asgore': 'Asgore', 'ASGORE': 'ASGORE', 'Talk': 'Hablar',
    'Hands of Fire': 'Manos de Fuego', 'Helix Rain': 'Lluvia en Hélice', 'Wavy Flames': 'Llamas Ondulantes',
    'Trident Swipe': 'Tajo del Tridente', 'Wandering Hands': 'Manos Errantes', 'Ring of Fire': 'Anillo de Fuego',
    'Firestorm': 'Tormenta de Fuego', 'Double Swipe': 'Doble Tajo', 'Helix Downpour': 'Diluvio en Hélice',
    'Spinning Rings': 'Anillos Giratorios', 'Firestorm II': 'Tormenta de Fuego II', 'Wild Flames': 'Llamas Salvajes',
    'Whirling Rings': 'Anillos en Remolino', 'Quick Swipe': 'Tajo Rápido', 'Hand Barrage': 'Lluvia de Manos',
    'Ring Frenzy': 'Frenesí de Anillos', 'Blazing Storm': 'Tormenta Abrasadora', 'Triple Swipe': 'Triple Tajo',
  },
  texts: {
    name: 'Asgore',
    intro: ['* (Una luz extraña llena la&  sala.^5)   %', '* (El crepúsculo brilla a&  través de la barrera.^3)   %',
            '* (Parece que tu viaje por fin&  ha terminado.^4)%', '     * (Te llenas de&          DETERMINACIÓN.^5) %%'],
    goodbye: ['Humano.../', '\\E1Fue un&placer&haberte&conocido./', '\\E0Adiós./%%'],
    attacks: '* ¡ASGORE ataca!',
    flavor: '* ...',
    lowhp: '* Asgore tiene pocos PV.',
    check: '* ASGORE 80 ATQ 80 DEF /^',
    nothing: '* Pero no había nada que&  decir./^',
    talk0: ['* Le dices en voz baja a ASGORE&  que no quieres pelear con&  él./', '* Sus manos tiemblan por un&  momento./^'],
    talk1: ['* Le dices a ASGORE que no&  quieres pelear con él./', '* Su respiración se vuelve&  extraña por un momento./^'],
    talk2: ['* Le dices con firmeza a ASGORE&  que DEJE de pelear./', '* Un recuerdo cruza por sus&  ojos.../', '* ¡El ATAQUE de ASGORE bajó^1!&* ¡La DEFENSA de ASGORE bajó!/^'],
    talkMore: '* Parece que hablar ya no&  servirá de nada./^',
    talkFight: '* Lo único que puedes hacer es&  LUCHAR./^',
    killed: '* Le dices a ASGORE que ya te&  ha matado {n}./',
    times: ['una vez', 'dos veces', 'tres veces', 'cuatro veces', 'cinco veces', 'seis veces', 'siete veces', 'ocho veces', 'nueve veces',
            'más veces de las&  que puedes contar'],
    nods: ['* Asiente con tristeza./^', '* Asiente con profundo dolor./^', '* Asiente lastimosamente./^'],
    kneel: ['Ah.../', '.../', 'Así que&así&son las&cosas./', '.../%%'],
    story: ['Recuerdo el día&después de que mi&hijo murió./', 'Todo el subsuelo&había perdido la&esperanza./',
            'Los humanos nos&habían arrebatado el&futuro una vez&más./', 'En un arranque de&ira, declaré la&guerra./',
            'Dije que destruiría&a cualquier humano&que llegara aquí./', 'Usaría sus almas&para volverme&como un dios.../',
            '... y liberarnos de&esta terrible&prisión./', 'Después destruiría&a la humanidad.../',
            'Y dejaría que los&monstruos gobernaran&la superficie en paz./', 'Pronto, el pueblo&recuperó la&esperanza./',
            'Pero mi esposa sintió&repugnancia por&mis actos./', 'Se fue de este lugar&y no se la volvió&a ver nunca más./%%'],
    plea: ['La verdad.../', 'No quiero poder./', 'No quiero hacerle&daño a nadie./', 'Solo quería que todos&tuvieran esperanza.../',
           'Pero.../', 'Ya no puedo&soportarlo más./', 'Solo quiero ver&a mi esposa./', 'Solo quiero ver&a mi hijo./',
           'Por favor..^1.&Joven.../', 'Esta guerra ya ha&durado demasiado./', 'Tú tienes el poder.../',
           'Toma mi alma y&abandona este lugar&maldito./%%'],
    spared: ['.../', '\\E0Después de todo lo&que he hecho para&lastimarte.../', '\\E7¿Prefieres quedarte&aquí abajo y&sufrir.../',
             '\\E9Que vivir feliz en&la superficie?/', '\\E6.../%%'],
    family: ['\\E1Humano.../', '\\E7Te prometo.../', '\\E7Que mientras te&quedes aquí.../',
             '\\E1Mi esposa y yo te&cuidaremos lo mejor&que podamos./', '\\E2Podemos sentarnos&en la sala^1,&contando historias.../',
             '\\E1Comiendo pastel de&caramelo.../', '\\E2Podríamos ser&como.../', '\\E8Como una familia.../%%'],
  },
  items: { asgore_steak: { name: 'Filete Facial', short: 'Filete', use: '* Te comiste el Filete Facial.' } },
  rules: { goodbye: [9, 4], kneel: [9, 4], story: [22, 4], plea: [22, 4], spared: [22, 4], family: [22, 4] },
};
