// Ajustes del jugador (se guardan en este navegador): nombre, resolución, idioma y volumen
const KEY = 'dbs-settings';
export const RESOLUTIONS = [                       // como en Sans Battle Simulator: 3 tamaños
  { id: 'small', label: 'Small', scale: 0.5 },
  { id: 'default', label: 'Default', scale: 0.75 },
  { id: 'large', label: 'Large', scale: 1 },
];
export const LANGS = [{ id: 'en', label: 'English' }, { id: 'es', label: 'Español' }];
const browserLang = (() => { try { return /^es\b/i.test(navigator.language || '') ? 'es' : 'en'; } catch (e) { return 'en'; } })();
export const SETTINGS = { name: 'Player', res: 'default', volume: 0.4, lang: browserLang };
try { Object.assign(SETTINGS, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* sin almacenamiento: valores por defecto */ }
if (typeof SETTINGS.name !== 'string' || !SETTINGS.name) SETTINGS.name = 'Player';
SETTINGS.name = SETTINGS.name.slice(0, 6);
if (!RESOLUTIONS.some(r => r.id === SETTINGS.res)) SETTINGS.res = 'default';
if (!LANGS.some(l => l.id === SETTINGS.lang)) SETTINGS.lang = 'en';
export function saveSettings() { try { localStorage.setItem(KEY, JSON.stringify(SETTINGS)); } catch (e) { /* ignorar */ } }
export const resolution = () => RESOLUTIONS.find(r => r.id === SETTINGS.res);
