// Comprueba que los textos en español caben en sus cajas y globos:  node tools/check_es.mjs
import { ES, BOSS_TEXTS } from '../src/lang/es.js';

const vis = s => s.replace(/\^\d/g, '').replace(/\\E\d|\\[A-Z][A-Za-z0-9]?/g, '').replace(/[/%]+$/g, '');
const RULES = {                                     // [letras por línea, líneas] de cada globo
  undyne: { death1: [20, 4], death2: [20, 4], death3: [20, 4] },
  muffet: { talk: [21, 4], talkAfter: [21, 4], talkDefault: [21, 4], blue: [21, 4], purple: [21, 4], dessert: [21, 4], telegram: [21, 4] },
  mettaton: { kill: [21, 4], kill2: [21, 4], call1: [21, 4], call2: [21, 4], call3: [21, 4], farewell: [21, 4], blook: [21, 4], fans: [20, 5] },
  essay: '*23,5', napsta: { random: [8, 4], dapper1: [8, 4], dapper2: [8, 4], lines: [8, 4], kill: [20, 4] },
};
for (const m of BOSS_TEXTS) if (m.rules) RULES[m.ns] = { ...(RULES[m.ns] || {}), ...m.rules };
let bad = 0;
function check(where, text, rule) {
  if (typeof text !== 'string') return;
  for (const msg of text.split('/').filter(m => vis(m).trim())) {
    const lines = vis(msg).split('&');
    const box = lines[0].startsWith('* ') || lines[0].startsWith(' ');
    const [W, H] = box ? [33, 3] : rule || [99, 99];
    const long = lines.filter(l => l.length > W);
    if (long.length || lines.length > H) { bad++; console.log(`✗ ${where}: ${lines.length} líneas (máx ${H}), ${long.map(l => `"${l}" ${l.length}/${W}`).join(' ')}`); }
  }
}
function walk(where, v, rule) {
  if (typeof v === 'string') return check(where, v, rule);
  if (typeof v === 'function') return check(where, v(300, 105), rule);
  if (Array.isArray(v)) return v.forEach((x, i) => walk(`${where}[${i}]`, x, rule));
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(`${where}.${k}`, x, rule);
}
for (const [ns, obj] of Object.entries(ES)) {
  if (ns === 'ui' || ns === 'items') continue;
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'W') continue;
    let rule = RULES[ns] === '*23,5' ? [23, 5] : RULES[ns] && RULES[ns][k];
    if (ns === 'mettaton' && k === 'talk') { for (const [t, [kind, msgs]] of Object.entries(v)) walk(`mettaton.talk.${t}`, msgs, kind ? [23, 5] : [8, 5]); continue; }
    if (ns === 'mettaton' && k === 'fans') { v.forEach((f, i) => walk(`mettaton.fans[${i}]`, f[3], rule)); continue; }
    walk(`${ns}.${k}`, v, rule);
  }
}
for (const [k, it] of Object.entries(ES.items)) { if (it.short.length > 10) { bad++; console.log(`✗ items.${k}.short "${it.short}"`); } check(`items.${k}.use`, it.use + '&* ¡Recuperaste 40 PV!/'); }
if (ES.mettaton.farewell.length !== 26) { bad++; console.log('✗ mettaton.farewell debe tener 26 mensajes (la música baja en los últimos)'); }
console.log(bad ? `${bad} textos no caben` : 'Todos los textos caben ✓');
process.exit(bad ? 1 : 0);
