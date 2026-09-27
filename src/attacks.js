// Todos los ataques distintos de Undyne the Undying, en el orden en que aparecen en la pelea.
// El juego no les pone nombre (internamente son "lesson" -5…-14 del alma verde y "orderb" 0…7 del alma roja),
// así que los nombres son inventados.
export const ATTACKS = [
  { name: "Heroine's Welcome", kind: 'green', lesson: -5 },
  { name: 'Left and Right',    kind: 'green', lesson: -6 },
  { name: 'Spear Drizzle',     kind: 'green', lesson: -7 },
  { name: 'Spear Summon',      kind: 'red',   orderb: 0 },
  { name: 'Rising Spears',     kind: 'red',   orderb: 1 },
  { name: 'Crossfire',         kind: 'green', lesson: -8 },
  { name: 'Skyfall',           kind: 'green', lesson: -9 },
  { name: 'Twisting Tide',     kind: 'green', lesson: -10 },
  { name: 'Circle of Spears',  kind: 'red',   orderb: 2 },
  { name: 'Reverse Rush',      kind: 'green', lesson: -11 },
  { name: 'Double Feint',      kind: 'green', lesson: -12 },
  { name: 'Mirror Dance',      kind: 'green', lesson: -13 },
  { name: 'Spear Downpour',    kind: 'green', lesson: -14 },
  { name: 'Spinning Ambush',   kind: 'red',   orderb: 4 },
  { name: 'Chaotic Circle',    kind: 'red',   orderb: 5 },
];
