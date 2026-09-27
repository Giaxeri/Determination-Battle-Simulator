// Idiomas: inglés (textos originales del juego) y español (traducción propia, latinoamericano neutro).
// Los textos en español están en src/lang/es.js, con la misma forma que los textos en inglés de cada módulo.
import { SETTINGS } from './settings.js';
import { ES } from './lang/es.js';

export const isES = () => SETTINGS.lang === 'es';

// Objeto de textos de un módulo: devuelve la versión en español si existe (y el idioma es español)
export function texts(ns, EN) {
  return new Proxy(EN, {
    get(t, k) {
      if (isES()) { const v = ES[ns] && ES[ns][k]; if (v !== undefined) return v; }
      return t[k];
    },
  });
}

// Texto suelto de la interfaz (clave = el texto en inglés)
export function tr(s) {
  if (!isES()) return s;
  const v = ES.ui[s];
  return v === undefined ? s : v;
}

// Nombre del jugador ("Player" por defecto -> "Jugador")
export const playerName = () => (!SETTINGS.name || SETTINGS.name === 'Player') ? tr('Player') : SETTINGS.name;

// Sprite con texto: versión en español si existe (spr_fightbt -> spr_fightbt_es)
import { SPR } from './assets.js';
export const sprL = n => (isES() && SPR[n + '_es']) ? n + '_es' : n;

// Datos de un objeto (nombre, nombre corto y texto al usarlo) en el idioma actual
export const itemL = (key, it) => (isES() && ES.items[key]) ? { ...it, ...ES.items[key] } : it;

// Texto con un número: tr('recovered') -> '&* ¡Recuperaste {n} PV!/'
export const trn = (key, n, en) => isES() && ES.ui[key] ? ES.ui[key].replace('{n}', n) : en;
