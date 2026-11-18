// ============================================================
// JUGADOR — movimiento celda a celda
// ============================================================
const jugador = {
  cx: 5,
  cy: 11,
  direccion: "abajo"
};

function dibujarJugador(ctx) {
  dibujarPersonaje(ctx, jugador.cx, jugador.cy, "#e74c3c", "#f5cba7", jugador.direccion);
}

function moverJugador(dx, dy, dir) {
  const nx = jugador.cx + dx;
  const ny = jugador.cy + dy;

  if (nx < 0 || nx >= MAPA_ANCHO || ny < 0 || ny >= MAPA_ALTO) return;
  if (celdaOcupada(nx, ny)) return;
  if (celdaOcupadaPorNPC(nx, ny)) return;

  jugador.cx = nx;
  jugador.cy = ny;
  jugador.direccion = dir;
  dibujarMapa();

  if (window.playBeep) window.playBeep(330, 0.03, "square", 0.03);
}

window.addEventListener("keydown", (e) => {
  // No moverse si el diálogo está abierto
  if (typeof npcActual !== "undefined" && npcActual) return;

  switch (e.key) {
    case "ArrowUp":    case "w": case "W": moverJugador(0, -1, "arriba"); break;
    case "ArrowDown":  case "s": case "S": moverJugador(0,  1, "abajo");  break;
    case "ArrowLeft":  case "a": case "A": moverJugador(-1, 0, "izquierda"); break;
    case "ArrowRight": case "d": case "D": moverJugador( 1, 0, "derecha");  break;
  }
});

// ============================================================
// DIÁLOGO CON NPCs
// ============================================================
function npcEnFrente() {
  let fx = jugador.cx;
  let fy = jugador.cy;
  switch (jugador.direccion) {
    case "arriba":    fy--; break;
    case "abajo":     fy++; break;
    case "izquierda": fx--; break;
    case "derecha":   fx++; break;
  }
  return NPCS.find(n => n.cx === fx && n.cy === fy) || null;
}

let indiceDialogo = 0;
let npcActual = null;

function hablarConNPC(npc) {
  npcActual = npc;
  indiceDialogo = 0;
  mostrarLineaDialogo();
  if (window.playSelectSound) window.playSelectSound();
}

function mostrarLineaDialogo() {
  const caja = document.getElementById("caja-dialogo");
  if (!caja || !npcActual) return;
  caja.classList.remove("hidden");
  caja.querySelector(".texto-dialogo").innerText = npcActual.dialogo[indiceDialogo];
}

function avanzarDialogo() {
  if (!npcActual) return;
  indiceDialogo++;
  if (indiceDialogo >= npcActual.dialogo.length) {
    document.getElementById("caja-dialogo").classList.add("hidden");
    npcActual = null;
    indiceDialogo = 0;
    if (window.playClickSound) window.playClickSound();
  } else {
    mostrarLineaDialogo();
    if (window.playBeep) window.playBeep(520, 0.05, "square", 0.04);
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key === "e" || e.key === "E") {
    if (npcActual) avanzarDialogo();
    else {
      const npc = npcEnFrente();
      if (npc) hablarConNPC(npc);
    }
  }
});