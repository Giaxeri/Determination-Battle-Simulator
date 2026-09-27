// Ajustes del jugador (se guardan en este navegador): nombre, resolución y volumen
const KEY = 'dbs-settings';
export const RESOLUTIONS = [                       // como en Sans Battle Simulator: 3 tamaños
  { id: 'small', label: 'Small', scale: 0.5 },
  { id: 'default', label: 'Default', scale: 0.75 },
  { id: 'large', label: 'Large', scale: 1 },
];
export const SETTINGS = { name: 'Player', res: 'default', volume: 0.4 };
try { Object.assign(SETTINGS, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* sin almacenamiento: valores por defecto */ }
if (typeof SETTINGS.name !== 'string' || !SETTINGS.name) SETTINGS.name = 'Player';
SETTINGS.name = SETTINGS.name.slice(0, 6);
if (!RESOLUTIONS.some(r => r.id === SETTINGS.res)) SETTINGS.res = 'default';
export function saveSettings() { try { localStorage.setItem(KEY, JSON.stringify(SETTINGS)); } catch (e) { /* ignorar */ } }
export const resolution = () => RESOLUTIONS.find(r => r.id === SETTINGS.res);
