document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. CONFIGURACIÓN (Mapa de 12x12 celdas de 36px)
    // ==========================================
    const TILE_SIZE = 36;
    const MAP_COLS = 12;
    const MAP_ROWS = 12;

    const mapLayer = document.getElementById('map-layer');
    const entitiesLayer = document.getElementById('entities-layer');
    
    mapLayer.style.display = 'grid';
    mapLayer.style.gridTemplateColumns = `repeat(${MAP_COLS}, 1fr)`;
    mapLayer.style.gridTemplateRows = `repeat(${MAP_ROWS}, 1fr)`;
    mapLayer.style.position = 'absolute';
    mapLayer.style.inset = '0';

    // ==========================================
    // 2. DATOS DEL MAPA (12x12)
    // ==========================================
    const MAP_DATA = [
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,0,0,0,0,1,1],
        [1,1,0,0,0,0,0,0,0,0,1,1],
        [1,1,0,0,0,0,0,0,0,0,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,0,0,0,0,0,0,0,0,1,1],
        [1,1,0,0,0,0,0,0,0,0,1,1],
        [1,1,0,0,0,0,0,0,0,0,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1],
    ];

    const TILE_CLASSES = { 0: 'grass', 1: 'tree', 2: 'rock', 3: 'water', 4: 'path' };
    const BLOCKED_TILES = [1, 2, 3];

    function isBlocked(x, y) {
        if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return true;
        return BLOCKED_TILES.includes(MAP_DATA[y][x]);
    }

    // ==========================================
    // 3. RENDERIZAR MAPA
    // ==========================================
    function renderMap() {
        mapLayer.innerHTML = '';
        for (let y = 0; y < MAP_ROWS; y++) {
            for (let x = 0; x < MAP_COLS; x++) {
                const cell = document.createElement('div');
                cell.className = `map-cell ${TILE_CLASSES[MAP_DATA[y][x]]}`;
                mapLayer.appendChild(cell);
            }
        }
    }

    // ==========================================
    // 4. JUGADOR
    // ==========================================
    const player = { x: 5, y: 8 }; // Empezamos cerca del centro-abajo
    let playerEl = null;

    function createPlayerElement() {
        playerEl = document.createElement('div');
        playerEl.id = 'player';
        playerEl.className = 'player-sprite';
        playerEl.textContent = '🧢'; 
        playerEl.style.left = (player.x * TILE_SIZE) + 'px';
        playerEl.style.top = (player.y * TILE_SIZE) + 'px';
        entitiesLayer.appendChild(playerEl);
    }

    function updatePlayerPosition() {
        if (!playerEl) return;
        playerEl.style.left = (player.x * TILE_SIZE) + 'px';
        playerEl.style.top = (player.y * TILE_SIZE) + 'px';
    }

    // ==========================================
    // 5. AURALIS (Alineados en la parte superior)
    // ==========================================
    // Los colocamos en fila en Y=2, desde X=3 hasta X=8
    const AURALIS_DATA = [
        { id: 'brakos',  name: 'Brakos',  icon: '🪨', color: '#c08c3f', x: 3, y: 2 },
        { id: 'zappik',  name: 'Zappik',  icon: '⚡', color: '#f7d02c', x: 4, y: 2 },
        { id: 'leafu',   name: 'Leafu',   icon: '🌿', color: '#4dc04d', x: 5, y: 2 },
        { id: 'flamiki', name: 'Flamiki', icon: '🔥', color: '#ee8130', x: 6, y: 2 },
        { id: 'bublo',   name: 'Bublo',   icon: '💧', color: '#4a90e2', x: 7, y: 2 },
        { id: 'veylo',   name: 'Veylo',   icon: '🌪️', color: '#9ec8e8', x: 8, y: 2 }
    ];

    const auralisElements = [];

    function renderAuralis() {
        AURALIS_DATA.forEach(a => {
            const el = document.createElement('div');
            el.className = 'auralis-sprite';
            el.id = 'auralis-' + a.id;
            el.textContent = a.icon;
            el.style.color = a.color;
            el.style.left = (a.x * TILE_SIZE) + 'px';
            el.style.top = (a.y * TILE_SIZE) + 'px';
            el.dataset.x = a.x;
            el.dataset.y = a.y;
            el.dataset.id = a.id;
            el.dataset.name = a.name;
            el.dataset.icon = a.icon;
            entitiesLayer.appendChild(el);
            auralisElements.push(el);
        });
    }

    // ==========================================
    // 6. CONTROLES Y BLOQUEO
    // ==========================================
    let moving = false;
    let isLocked = false; // NUEVO: Bloquea el movimiento durante la batalla

    document.addEventListener('keydown', (e) => {
        // Si está bloqueado, no procesar movimiento
        if (isLocked || moving) return;

        let newX = player.x;
        let newY = player.y;
        
        if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') newY--;
        else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') newY++;
        else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') newX--;
        else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') newX++;
        else return;

        e.preventDefault();
        
        if (isBlocked(newX, newY)) return;

        // Comprobar si hay un Auralis
        const auralisHere = auralisElements.find(a => 
            parseInt(a.dataset.x) === newX && 
            parseInt(a.dataset.y) === newY &&
            a.style.display !== 'none'
        );

        moving = true;
        player.x = newX;
        player.y = newY;
        updatePlayerPosition();

        setTimeout(() => { moving = false; }, 120);

        // Si hay Auralis, iniciar batalla y BLOQUEAR movimiento
        if (auralisHere) {
            isLocked = true; // Bloqueamos
            setTimeout(() => startBattle(auralisHere), 150);
        }
    });

    // ==========================================
    // 7. COMBATE
    // ==========================================
    let activeBattle = null;
    const battleOverlay = document.getElementById('battle-overlay');
    const victoryOverlay = document.getElementById('victory-overlay');

    function startBattle(auralisEl) {
        activeBattle = auralisEl;
        document.getElementById('battle-title').textContent = `¡Has encontrado a ${auralisEl.dataset.name}!`;
        document.getElementById('battle-sprite').textContent = auralisEl.dataset.icon;
        document.getElementById('battle-sprite').style.color = auralisEl.style.color;
        document.getElementById('battle-text').textContent = `¿Quieres escoger a ${auralisEl.dataset.name} como tu compañero?`;
        battleOverlay.classList.remove('hidden');
    }

    // Botón HUIR (Cancelar)
    document.getElementById('btn-run').addEventListener('click', () => {
        if (activeBattle) {
            // Desbloquear movimiento y retroceder un paso
            isLocked = false; 
            player.y += 1; // Empujar hacia atrás (podría ser cualquier dirección)
            updatePlayerPosition();
            activeBattle = null;
            battleOverlay.classList.add('hidden');
        }
    });

    // Botón LUCHAR (Confirmar y elegir)
    document.getElementById('btn-fight').addEventListener('click', () => {
        if (activeBattle) {
            // Ocultar el Auralis elegido
            activeBattle.style.display = 'none'; 
            activeBattle = null;
            
            // Mostrar pantalla de victoria (fin del juego)
            battleOverlay.classList.add('hidden');
            victoryOverlay.classList.remove('hidden');
            // El juego se queda bloqueado aquí, porque la pantalla de victoria tiene su propio botón
        }
    });

    // Botón VOLVER AL MENÚ
    document.getElementById('btn-return-menu').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // ==========================================
    // 8. INICIALIZAR
    // ==========================================
    renderMap();
    createPlayerElement();
    renderAuralis();
});