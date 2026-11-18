// ============================================================
// MOTOR DE RENDER (canvas)
// ============================================================
const canvas = document.getElementById("canvas-mapa");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

function dibujarPersonaje(ctx, cx, cy, colorCuerpo, colorPiel, direccion) {
  const px = cx * TILE;
  const py = cy * TILE;

  // Sombra
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(px + 3, py + TILE - 4, TILE - 6, 4);

  // Cuerpo
  ctx.fillStyle = colorCuerpo;
  ctx.fillRect(px + 3, py + 4, TILE - 6, TILE - 6);

  // Cabeza
  ctx.fillStyle = colorPiel;
  ctx.fillRect(px + 5, py + 2, TILE - 10, TILE - 10);

  // Ojos
  ctx.fillStyle = "#0f380f";
  if (direccion === "abajo") {
    ctx.fillRect(px + 6, py + 6, 1, 2);
    ctx.fillRect(px + 9, py + 6, 1, 2);
  } else if (direccion === "izquierda") {
    ctx.fillRect(px + 5, py + 6, 2, 1);
  } else if (direccion === "derecha") {
    ctx.fillRect(px + 9, py + 6, 2, 1);
  }
}

function dibujarMapa() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Suelo
  for (let y = 0; y < MAPA_ALTO; y++) {
    for (let x = 0; x < MAPA_ANCHO; x++) {
      if (SUELO[y][x] === 0) {
        ctx.fillStyle = "#9bbc0f";
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        ctx.fillStyle = "#8bac0f";
        ctx.fillRect(x * TILE + 4, y * TILE + 4, 2, 2);
        ctx.fillRect(x * TILE + 10, y * TILE + 9, 2, 2);
      } else {
        ctx.fillStyle = "#c6a664";
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        ctx.fillStyle = "#b8955a";
        ctx.fillRect(x * TILE + 3, y * TILE + 3, 3, 2);
        ctx.fillRect(x * TILE + 9, y * TILE + 10, 2, 2);
      }
    }
  }

  // Edificios
  EDIFICIOS.forEach(ed => {
    const px = ed.x * TILE;
    const py = ed.y * TILE;
    const w  = ed.ancho * TILE;
    const h  = ed.alto * TILE;

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(px + 2, py + h - 2, w, 4);

    ctx.fillStyle = ed.pared;
    ctx.fillRect(px, py, w, h);

    ctx.fillStyle = ed.tejado;
    ctx.fillRect(px, py, w, Math.floor(h / 3));

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(px, py + Math.floor(h / 3) - 2, w, 2);

    const puertaW = TILE;
    const puertaH = TILE - 4;
    const puertaX = px + (w - puertaW) / 2;
    const puertaY = py + h - puertaH;
    ctx.fillStyle = ed.puerta;
    ctx.fillRect(puertaX, puertaY, puertaW, puertaH);

    ctx.fillStyle = "#fff8dc";
    ctx.fillRect(px + 4, py + Math.floor(h / 3) + 4, 6, 6);
    ctx.fillRect(px + w - 10, py + Math.floor(h / 3) + 4, 6, 6);

    // Etiqueta
    ctx.fillStyle = "rgba(15,56,15,0.9)";
    const txtW = ctx.measureText(ed.nombre).width + 8;
    ctx.fillRect(px + (w - txtW) / 2, py - 12, txtW, 12);
    ctx.fillStyle = "#c6de8c";
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText(ed.nombre, px + w / 2, py - 4);
  });

  // NPCs
  NPCS.forEach(npc => {
    dibujarPersonaje(ctx, npc.cx, npc.cy, npc.colorCuerpo, npc.colorPiel, npc.direccion);
    ctx.fillStyle = "rgba(15,56,15,0.9)";
    const txtW = ctx.measureText(npc.nombre).width + 6;
    ctx.fillRect(npc.cx * TILE + (TILE - txtW) / 2, npc.cy * TILE - 11, txtW, 10);
    ctx.fillStyle = "#c6de8c";
    ctx.font = "7px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText(npc.nombre, npc.cx * TILE + TILE / 2, npc.cy * TILE - 3);
  });

  // Jugador
  dibujarJugador(ctx);
}