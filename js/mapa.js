// ============================================================
// MAPA DE PUEBLO VELORIA (celda a celda estilo GBA)
// ============================================================
const TILE = 16;
const MAPA_ANCHO = 20;
const MAPA_ALTO  = 15;

// Suelo: 0=hierba, 1=camino
const SUELO = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const EDIFICIOS = [
  { id:"laboratorio", nombre:"Laboratorio", x:4, y:4, ancho:3, alto:3,
    tejado:"#c0392b", pared:"#f5deb3", puerta:"#5d4037" },
  { id:"tienda", nombre:"Tienda", x:9, y:5, ancho:3, alto:2,
    tejado:"#2980b9", pared:"#ecf0f1", puerta:"#5d4037" },
  { id:"domo", nombre:"Domo", x:14, y:6, ancho:4, alto:3,
    tejado:"#8e44ad", pared:"#d5d8dc", puerta:"#2c3e50" },
  { id:"casa", nombre:"Tu Casa", x:4, y:12, ancho:3, alto:3,
    tejado:"#d35400", pared:"#fad7a0", puerta:"#5d4037" },
  { id:"centro", nombre:"Auracenter", x:9, y:12, ancho:3, alto:3,
    tejado:"#e74c3c", pared:"#ffffff", puerta:"#5d4037" }
];

function celdaOcupada(cx, cy) {
  return EDIFICIOS.some(ed =>
    cx >= ed.x && cx < ed.x + ed.ancho &&
    cy >= ed.y && cy < ed.y + ed.alto
  );
}

// ============================================================
// NPCs
// ============================================================
const NPCS = [
  {
    id: "maestro",
    nombre: "Maestro",
    cx: 15, cy: 9,
    colorCuerpo: "#8e44ad",
    colorPiel:   "#f5cba7",
    direccion:   "abajo",
    dialogo: [
      "Maestro del Domo: ¡Así que tú eres el nuevo Viajero!",
      "Maestro: La fiesta de esta noche decidirá tu primer Auralis.",
      "Maestro: Pero antes, pasa por el Laboratorio. Allí te esperan.",
      "Maestro: Cuando estés listo, sube al Domo y demuéstrame tu valía."
    ]
  }
];

function celdaOcupadaPorNPC(cx, cy) {
  return NPCS.some(n => n.cx === cx && n.cy === cy);
}