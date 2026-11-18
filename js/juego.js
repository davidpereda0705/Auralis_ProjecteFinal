// ============================================================
// AURALIS — PUEBLO VELORIA EN 3D (Three.js, cámara isométrica)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 0. CONFIGURACIÓN
    // ==========================================
    const canvas = document.getElementById('three-canvas');
    const ANCHO = window.innerWidth;
    const ALTO = window.innerHeight;

    // Escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);   // cielo azul
    scene.fog = new THREE.Fog(0x87ceeb, 40, 90);   // niebla para dar profundidad

    // Cámara isométrica: posición fija mirando al centro del pueblo
    const aspect = ANCHO / ALTO;
    const frustum = 18;   // zoom (más pequeño = más cerca)
    // Cámara en perspectiva
    const camara = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camara.position.set(12, 32, 28);
    camara.lookAt(12, 0, 10);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(ANCHO, ALTO);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // ==========================================
    // 1. LUCES
    // ==========================================
    const amb = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(amb);

    const sol = new THREE.DirectionalLight(0xffffff, 0.9);
    sol.position.set(15, 30, 10);
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    sol.shadow.camera.left = -30;
    sol.shadow.camera.right = 30;
    sol.shadow.camera.top = 30;
    sol.shadow.camera.bottom = -30;
    sol.shadow.camera.near = 1;
    sol.shadow.camera.far = 80;
    scene.add(sol);

    const relleno = new THREE.DirectionalLight(0x88aaff, 0.3);
    relleno.position.set(-10, 15, -10);
    scene.add(relleno);

    // ==========================================
    // 2. SUELO (20x15 celdas de 1x1)
    // ==========================================
    const MAPA_ANCHO = 24;
    const MAPA_ALTO = 20;

    // Plano de hierba
    const geoHierba = new THREE.PlaneGeometry(MAPA_ANCHO, MAPA_ALTO);
    const matHierba = new THREE.MeshLambertMaterial({ color: 0x6bbf4a });
    const suelo = new THREE.Mesh(geoHierba, matHierba);
    suelo.rotation.x = -Math.PI / 2;
    suelo.position.set(MAPA_ANCHO / 2, 0, MAPA_ALTO / 2);
    suelo.receiveShadow = true;
    scene.add(suelo);

     // CAMINOS (Alineados con las puertas)
    function crearCamino(cx, cz, ancho, alto) {
        const geo = new THREE.PlaneGeometry(ancho, alto);
        const mat = new THREE.MeshLambertMaterial({ color: 0xc9a66b });
        const m = new THREE.Mesh(geo, mat);
        m.rotation.x = -Math.PI / 2;
        m.position.set(cx, 0.01, cz);
        m.receiveShadow = true;
        scene.add(m);
    }

    // El camino de abajo pasa justo por delante de la puerta (Z = 13.5)
    crearCamino(12, 13.5, 18, 2); 
    
    // El camino de arriba pasa justo por delante de las puertas del lab y tienda (Z = 5.5)
    crearCamino(11, 5.5, 14, 2);  
    
    // El camino vertical los conecta a la altura de la X = 11.5
    crearCamino(11.5, 9.5, 2, 10); 

    // ==========================================
    // 3. EDIFICIOS (Alineados con el camino)
    // ==========================================
    const EDIFICIOS_DATA = [
        // Arriba a la izquierda (Puerta mira al camino de Z=5.5)
        { id:'laboratorio', nombre:'Laboratorio', x:6,  y:2.5, ancho:3, alto:3,
          tejado:0xc0392b, pared:0xf5deb3 },
          
        // Arriba en medio (Puerta mira al camino de Z=5.5)
        { id:'tienda',      nombre:'Tienda',      x:11, y:2.5, ancho:3, alto:2,
          tejado:0x2980b9, pared:0xecf0f1 },
          
        // Arriba a la derecha (Puerta mira al camino de Z=5.5)
        { id:'domo',        nombre:'Domo',        x:16, y:3.5, ancho:4, alto:3,
          tejado:0x8e44ad, pared:0xd5d8dc },
          
        // Abajo a la izquierda (Puerta mira al camino de Z=13.5)
        { id:'casa',        nombre:'Tu Casa',     x:6,  y:14.5, ancho:3, alto:3,
          tejado:0xd35400, pared:0xfad7a0 },
          
        // Abajo en medio (Puerta mira al camino de Z=13.5)
        { id:'centro',      nombre:'Auracenter',  x:11, y:14.5, ancho:3, alto:3,
          tejado:0xe74c3c, pared:0xffffff }
    ];

    // Guardamos los "colliders" (cajas de colisión)
    const colliders = [];

    EDIFICIOS_DATA.forEach(ed => {
        const anchoX = ed.ancho;
        const altoZ = ed.alto;
        const altoY = 1.6;   // altura del cuerpo del edificio
        const altoTejado = 1.0;

        // Centro del edificio
        const cx = ed.x + anchoX / 2;
        const cz = ed.y + altoZ / 2;

        // Cuerpo (caja)
        const geoCuerpo = new THREE.BoxGeometry(anchoX, altoY, altoZ);
        const matCuerpo = new THREE.MeshLambertMaterial({ color: ed.pared });
        const cuerpo = new THREE.Mesh(geoCuerpo, matCuerpo);
        cuerpo.position.set(cx, altoY / 2, cz); // <-- AQUÍ SE ELEVA PARA TOCAR EL SUELO
        cuerpo.castShadow = true;
        cuerpo.receiveShadow = true;
        scene.add(cuerpo);

        // Tejado (pirámide)
        const radioTejado = Math.max(anchoX, altoZ) * 0.72;
        const geoTejado = new THREE.ConeGeometry(radioTejado, altoTejado, 4);
        const matTejado = new THREE.MeshLambertMaterial({ color: ed.tejado });
        const tejado = new THREE.Mesh(geoTejado, matTejado);
        tejado.position.set(cx, altoY + altoTejado / 2, cz);
        tejado.rotation.y = Math.PI / 4;
        tejado.castShadow = true;
        scene.add(tejado);

        // Puerta (caja marrón fina)
        const geoPuerta = new THREE.BoxGeometry(0.7, 1.0, 0.08);
        const matPuerta = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
        const puerta = new THREE.Mesh(geoPuerta, matPuerta);
        puerta.position.set(cx, 0.5, cz + altoZ / 2 + 0.04);
        scene.add(puerta);

        // Collider
        colliders.push({
            minX: ed.x - 0.2,
            maxX: ed.x + anchoX + 0.2,
            minZ: ed.y - 0.2,
            maxZ: ed.y + altoZ + 0.2
        });
    });

    // ==========================================
    // 4. JUGADOR (cápsula + cabeza)
    // ==========================================
    const jugador = new THREE.Group();

    // Cuerpo (cápsula roja)
    const geoCuerpoJ = new THREE.CylinderGeometry(0.28, 0.28, 0.5, 8); const matCuerpoJ = new THREE.MeshLambertMaterial({ color: 0xe63946 });
    const cuerpoJ = new THREE.Mesh(geoCuerpoJ, matCuerpoJ);
    cuerpoJ.position.y = 0.53;
    cuerpoJ.castShadow = true;
    jugador.add(cuerpoJ);

    // Cabeza (esfera)
    const geoCabezaJ = new THREE.SphereGeometry(0.22, 12, 12);
    const matCabezaJ = new THREE.MeshLambertMaterial({ color: 0xf5cba7 });
    const cabezaJ = new THREE.Mesh(geoCabezaJ, matCabezaJ);
    cabezaJ.position.y = 1.12;
    cabezaJ.castShadow = true;
    jugador.add(cabezaJ);

    // Nariz (indicador de dirección)
    const geoNariz = new THREE.BoxGeometry(0.08, 0.08, 0.12);
    const matNariz = new THREE.MeshLambertMaterial({ color: 0x0f380f });
    const nariz = new THREE.Mesh(geoNariz, matNariz);
    nariz.position.set(0, 1.12, 0.2);
    jugador.add(nariz);

    // Posición inicial: delante de la casa (casa está en x=4..7, y=12..15)
    jugador.position.set(7.5, 0, 12.5);
    scene.add(jugador);

    // Radio del jugador para colisiones
    const JUGADOR_RADIO = 0.35;

    // ==========================================
    // 5. MAESTRO DEL DOMO (NPC)
    // ==========================================
    const maestro = new THREE.Group();

    const geoCuerpoM = new THREE.CylinderGeometry(0.3, 0.3, 0.55, 8); const matCuerpoM = new THREE.MeshLambertMaterial({ color: 0x8e44ad });
    const cuerpoM = new THREE.Mesh(geoCuerpoM, matCuerpoM);
    cuerpoM.position.y = 0.57;
    cuerpoM.castShadow = true;
    maestro.add(cuerpoM);

    const geoCabezaM = new THREE.SphereGeometry(0.24, 12, 12);
    const matCabezaM = new THREE.MeshLambertMaterial({ color: 0xf5cba7 });
    const cabezaM = new THREE.Mesh(geoCabezaM, matCabezaM);
    cabezaM.position.y = 1.22;
    cabezaM.castShadow = true;
    maestro.add(cabezaM);

    // Sombrero (cono)
    const geoSombrero = new THREE.ConeGeometry(0.35, 0.3, 8);
    const matSombrero = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const sombrero = new THREE.Mesh(geoSombrero, matSombrero);
    sombrero.position.y = 1.55;
    sombrero.castShadow = true;
    maestro.add(sombrero);

    // Posición: delante del Domo (Domo está en x=14..18, y=6..9)
    maestro.position.set(17.5, 0, 7.5);
    scene.add(maestro);

    // Collider del Maestro
    const colliderMaestro = {
        minX: 17.2, maxX: 17.8,
        minZ: 12.2, maxZ: 12.8
    };

    const MAESTRO_DIALOGO = [
        "Maestro del Domo: ¡Así que tú eres el nuevo Viajero!",
        "Maestro: La fiesta de esta noche decidirá tu primer Auralis.",
        "Maestro: Pero antes, pasa por el Laboratorio. Allí te esperan.",
        "Maestro: Cuando estés listo, sube al Domo y demuéstrame tu valía."
    ];

    // ==========================================
    // 6. COLISIONES
    // ==========================================
    function colisiona(nx, nz) {
        // Fuera del mapa
        if (nx < JUGADOR_RADIO || nx > MAPA_ANCHO - JUGADOR_RADIO) return true;
        if (nz < JUGADOR_RADIO || nz > MAPA_ALTO - JUGADOR_RADIO) return true;

        // Edificios
        for (const c of colliders) {
            if (nx + JUGADOR_RADIO > c.minX && nx - JUGADOR_RADIO < c.maxX &&
                nz + JUGADOR_RADIO > c.minZ && nz - JUGADOR_RADIO < c.maxZ) {
                return true;
            }
        }
        // Maestro
        const m = colliderMaestro;
        if (nx + JUGADOR_RADIO > m.minX && nx - JUGADOR_RADIO < m.maxX &&
            nz + JUGADOR_RADIO > m.minZ && nz - JUGADOR_RADIO < m.maxZ) {
            return true;
        }
        return false;
    }

    // ==========================================
    // 7. CONTROLES (WASD / flechas, movimiento continuo)
    // ==========================================
    const teclas = {
        w: false, a: false, s: false, d: false,
        arrowup: false, arrowdown: false, arrowleft: false, arrowright: false
    };
    const VELOCIDAD = 4.5;   // unidades por segundo

    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (k in teclas) { teclas[k] = true; e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (k in teclas) { teclas[k] = false; e.preventDefault(); }
    });

    // ==========================================
    // 8. DIÁLOGO CON EL MAESTRO
    // ==========================================
    let indiceDialogo = 0;
    let dialogoAbierto = false;

    function estaCercaDelMaestro() {
        const dx = jugador.position.x - maestro.position.x;
        const dz = jugador.position.z - maestro.position.z;
        return Math.sqrt(dx * dx + dz * dz) < 1.8;
    }

    function abrirDialogo() {
        dialogoAbierto = true;
        indiceDialogo = 0;
        mostrarLinea();
        if (window.playSelectSound) window.playSelectSound();
    }

    function mostrarLinea() {
        const caja = document.getElementById('caja-dialogo');
        caja.classList.remove('hidden');
        caja.querySelector('.texto-dialogo').innerText = MAESTRO_DIALOGO[indiceDialogo];
    }

    function avanzarDialogo() {
        indiceDialogo++;
        if (indiceDialogo >= MAESTRO_DIALOGO.length) {
            document.getElementById('caja-dialogo').classList.add('hidden');
            dialogoAbierto = false;
            indiceDialogo = 0;
            if (window.playClickSound) window.playClickSound();
        } else {
            mostrarLinea();
            if (window.playBeep) window.playBeep(520, 0.05, 'square', 0.04);
        }
    }

    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() !== 'e') return;
        if (dialogoAbierto) {
            avanzarDialogo();
        } else if (estaCercaDelMaestro()) {
            abrirDialogo();
        }
    });

    // ==========================================
    // 9. BUCLE DE RENDER
    // ==========================================
    const clock = new THREE.Clock();

    function animar() {
        requestAnimationFrame(animar);
        const dt = Math.min(clock.getDelta(), 0.1);   // limitar dt para evitar saltos

        // Si hay diálogo abierto, no mover al jugador
        if (!dialogoAbierto) {
            let dx = 0, dz = 0;
            if (teclas.w || teclas.arrowup) dz -= 1;
            if (teclas.s || teclas.arrowdown) dz += 1;
            if (teclas.a || teclas.arrowleft) dx -= 1;
            if (teclas.d || teclas.arrowright) dx += 1;

            if (dx !== 0 || dz !== 0) {
                // Normalizar para no ir más rápido en diagonal
                const len = Math.sqrt(dx * dx + dz * dz);
                dx /= len;
                dz /= len;

                const nx = jugador.position.x + dx * VELOCIDAD * dt;
                const nz = jugador.position.z + dz * VELOCIDAD * dt;

                // Intentar mover en X y Z por separado (para deslizarse por las paredes)
                if (!colisiona(nx, jugador.position.z)) {
                    jugador.position.x = nx;
                }
                if (!colisiona(jugador.position.x, nz)) {
                    jugador.position.z = nz;
                }

                // Rotar al jugador hacia la dirección de movimiento
                const angulo = Math.atan2(dx, dz);
                jugador.rotation.y = angulo;
            }
        }

        // Animación del Maestro (flotar un poco)
        maestro.position.y = Math.sin(clock.elapsedTime * 1.5) * 0.05;

        renderer.render(scene, camara);
    }

    animar();

    // ==========================================
    // 10. RESIZE
    // ==========================================
    window.addEventListener('resize', () => {
        const a = window.innerWidth / window.innerHeight;
        camara.left = -frustum * a;
        camara.right = frustum * a;
        camara.top = frustum;
        camara.bottom = -frustum;
        camara.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ==========================================
    // 11. OVERLAYS (combate / victoria, se mantienen)
    // ==========================================
    const btnFight = document.getElementById('btn-fight');
    const btnRun = document.getElementById('btn-run');
    const btnReturnMenu = document.getElementById('btn-return-menu');

    if (btnFight) {
        btnFight.addEventListener('click', () => {
            document.getElementById('battle-overlay').classList.add('hidden');
            document.getElementById('victory-overlay').classList.remove('hidden');
        });
    }
    if (btnRun) {
        btnRun.addEventListener('click', () => {
            document.getElementById('battle-overlay').classList.add('hidden');
        });
    }
    if (btnReturnMenu) {
        btnReturnMenu.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
});