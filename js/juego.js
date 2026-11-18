// ============================================================
// AURALIS — PUEBLO VELORIA EN 3D (Three.js)
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
    scene.fog = new THREE.Fog(0x87ceeb, 40, 90);   // niebla

    // Cámara en perspectiva
    const aspect = ANCHO / ALTO;
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
    // GENERADOR DE TEXTURAS PROCEDURALES
    // ==========================================
    function crearTexturaCesped() {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#6bbf4a';
        ctx.fillRect(0, 0, 64, 64);
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 64; i += 16) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 64); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(64, i); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 50; i++) {
            ctx.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
        }
        const t = new THREE.CanvasTexture(c);
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(12, 10);
        return t;
    }

    function crearTexturaTierra() {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#d4b483';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#a67c52';
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 64, Math.random() * 64, Math.random() * 3 + 1, 0, Math.PI * 2);
            ctx.fill();
        }
        const t = new THREE.CanvasTexture(c);
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(4, 4);
        return t;
    }

    const texturaCesped = crearTexturaCesped();
    const texturaTierra = crearTexturaTierra();

    // ==========================================
    // 2. SUELO Y CAMINOS
    // ==========================================
    const MAPA_ANCHO = 24;
    const MAPA_ALTO = 20;

    const geoHierba = new THREE.PlaneGeometry(MAPA_ANCHO, MAPA_ALTO);
    const matHierba = new THREE.MeshLambertMaterial({ map: texturaCesped });
    const suelo = new THREE.Mesh(geoHierba, matHierba);
    suelo.rotation.x = -Math.PI / 2;
    suelo.position.set(MAPA_ANCHO / 2, 0, MAPA_ALTO / 2);
    suelo.receiveShadow = true;
    scene.add(suelo);

    function crearCamino(cx, cz, ancho, alto) {
        const geo = new THREE.PlaneGeometry(ancho, alto);
        const mat = new THREE.MeshLambertMaterial({ map: texturaTierra });
        const m = new THREE.Mesh(geo, mat);
        m.rotation.x = -Math.PI / 2;
        m.position.set(cx, 0.01, cz);
        m.receiveShadow = true;
        scene.add(m);
    }

    crearCamino(12, 13.5, 18, 2);
    crearCamino(11, 5.5, 14, 2);
    crearCamino(11.5, 9.5, 2, 10);

    // ==========================================
    // 3. EDIFICIOS
    // ==========================================
    const EDIFICIOS_DATA = [
        {
            id: 'laboratorio', nombre: 'Laboratorio', x: 6, y: 2.5, ancho: 3, alto: 3,
            tejado: 0xc0392b, pared: 0xf5deb3
        },
        {
            id: 'tienda', nombre: 'Tienda', x: 11, y: 2.5, ancho: 3, alto: 2,
            tejado: 0x2980b9, pared: 0xecf0f1
        },
        {
            id: 'domo', nombre: 'Domo', x: 16, y: 3.5, ancho: 4, alto: 3,
            tejado: 0x8e44ad, pared: 0xd5d8dc
        },
        {
            id: 'casa', nombre: 'Tu Casa', x: 6, y: 14.5, ancho: 3, alto: 3,
            tejado: 0xd35400, pared: 0xfad7a0
        },
        {
            id: 'centro', nombre: 'Auracenter', x: 11, y: 14.5, ancho: 3, alto: 3,
            tejado: 0xe74c3c, pared: 0xffffff
        }
    ];

    const colliders = [];

    EDIFICIOS_DATA.forEach(ed => {
        const anchoX = ed.ancho;
        const altoZ = ed.alto;
        const altoY = 1.6;
        const altoTejado = 1.0;

        const cx = ed.x + anchoX / 2;
        const cz = ed.y + altoZ / 2;

        const geoCuerpo = new THREE.BoxGeometry(anchoX, altoY, altoZ);
        const matCuerpo = new THREE.MeshLambertMaterial({ color: ed.pared });
        const cuerpo = new THREE.Mesh(geoCuerpo, matCuerpo);
        cuerpo.position.set(cx, altoY / 2, cz);
        cuerpo.castShadow = true;
        cuerpo.receiveShadow = true;
        scene.add(cuerpo);

        const radioTejado = Math.max(anchoX, altoZ) * 0.72;
        const geoTejado = new THREE.ConeGeometry(radioTejado, altoTejado, 4);
        const matTejado = new THREE.MeshLambertMaterial({ color: ed.tejado });
        const tejado = new THREE.Mesh(geoTejado, matTejado);
        tejado.position.set(cx, altoY + altoTejado / 2, cz);
        tejado.rotation.y = Math.PI / 4;
        tejado.castShadow = true;
        scene.add(tejado);

        const geoPuerta = new THREE.BoxGeometry(0.7, 1.0, 0.08);
                const colorPuerta = (ed.id === 'laboratorio' && localStorage.getItem('auralis_elegido_nombre')) ? 0x4caf50 : 0x5d4037;
        const matPuerta = new THREE.MeshLambertMaterial({ color: colorPuerta });
        const puerta = new THREE.Mesh(geoPuerta, matPuerta);
        puerta.position.set(cx, 0.5, cz + altoZ / 2 + 0.04);
        scene.add(puerta);

        colliders.push({
            minX: ed.x - 0.2,
            maxX: ed.x + anchoX + 0.2,
            minZ: ed.y - 0.2,
            maxZ: ed.y + altoZ + 0.2
        });
    });

    // ==========================================
    // DECORACIÓN: ÁRBOLES
    // ==========================================
    function crearArbol(x, z) {
        const grupo = new THREE.Group();

        const troncoGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.2, 6);
        const troncoMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
        const tronco = new THREE.Mesh(troncoGeo, troncoMat);
        tronco.position.y = 0.6;
        tronco.castShadow = true;
        grupo.add(tronco);

        const hojasMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });

        const hoja1 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 6, 6), hojasMat);
        hoja1.position.y = 1.5;
        hoja1.castShadow = true;
        grupo.add(hoja1);

        const hoja2 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 6), hojasMat);
        hoja2.position.set(0.3, 1.9, 0.2);
        hoja2.castShadow = true;
        grupo.add(hoja2);

        const hoja3 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 6), hojasMat);
        hoja3.position.set(-0.3, 1.8, -0.2);
        hoja3.castShadow = true;
        grupo.add(hoja3);

        grupo.position.set(x, 0, z);
        scene.add(grupo);

        colliders.push({
            minX: x - 0.3, maxX: x + 0.3,
            minZ: z - 0.3, maxZ: z + 0.3
        });
    }

    crearArbol(2, 2);
    crearArbol(21, 2);
    crearArbol(2, 17);
    crearArbol(21, 17);
    crearArbol(8, 2);
    crearArbol(16, 2);
    crearArbol(2, 9);
    crearArbol(21, 9);

    // ==========================================
    // DECORACIÓN: NUBES
    // ==========================================
    const nubes = [];
    function crearNube(x, y, z) {
        const grupo = new THREE.Group();
        const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });

        const esferas = [
            { r: 1, x: 0, y: 0, z: 0 },
            { r: 1.2, x: 1, y: 0.2, z: 0 },
            { r: 0.8, x: -1, y: 0, z: 0 }
        ];

        esferas.forEach(e => {
            const m = new THREE.Mesh(new THREE.SphereGeometry(e.r, 8, 8), mat);
            m.position.set(e.x, e.y, e.z);
            grupo.add(m);
        });

        grupo.position.set(x, y, z);
        scene.add(grupo);
        nubes.push({ grupo, velocidad: 0.5 + Math.random() * 0.5 });
    }

    crearNube(5, 12, 5);
    crearNube(18, 14, 12);
    crearNube(10, 13, 18);

    // ==========================================
    // 4. JUGADOR
    // ==========================================
    const jugador = new THREE.Group();

    const geoCuerpoJ = new THREE.CylinderGeometry(0.28, 0.28, 0.5, 8);
    const matCuerpoJ = new THREE.MeshLambertMaterial({ color: 0xe63946 });
    const cuerpoJ = new THREE.Mesh(geoCuerpoJ, matCuerpoJ);
    cuerpoJ.position.y = 0.53;
    cuerpoJ.castShadow = true;
    jugador.add(cuerpoJ);

    const geoCabezaJ = new THREE.SphereGeometry(0.22, 12, 12);
    const matCabezaJ = new THREE.MeshLambertMaterial({ color: 0xf5cba7 });
    const cabezaJ = new THREE.Mesh(geoCabezaJ, matCabezaJ);
    cabezaJ.position.y = 1.12;
    cabezaJ.castShadow = true;
    jugador.add(cabezaJ);

    const geoNariz = new THREE.BoxGeometry(0.08, 0.08, 0.12);
    const matNariz = new THREE.MeshLambertMaterial({ color: 0x0f380f });
    const nariz = new THREE.Mesh(geoNariz, matNariz);
    nariz.position.set(0, 1.12, 0.2);
    jugador.add(nariz);

    jugador.position.set(7.5, 0, 12.5);
    scene.add(jugador);

    const JUGADOR_RADIO = 0.35;

    // ==========================================
    // 5. MAESTRO DEL DOMO
    // ==========================================
    const maestro = new THREE.Group();

    const geoCuerpoM = new THREE.CylinderGeometry(0.3, 0.3, 0.55, 8);
    const matCuerpoM = new THREE.MeshLambertMaterial({ color: 0x8e44ad });
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

    const geoSombrero = new THREE.ConeGeometry(0.35, 0.3, 8);
    const matSombrero = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const sombrero = new THREE.Mesh(geoSombrero, matSombrero);
    sombrero.position.y = 1.55;
    sombrero.castShadow = true;
    maestro.add(sombrero);

    maestro.position.set(17.5, 0, 12.5);
    scene.add(maestro);

    maestro.position.set(18, 0, 5.8);
    scene.add(maestro);

    const colliderMaestro = {
        minX: 17.7, maxX: 18.3,
        minZ: 5.5, maxZ: 6.1
    };

    const MAESTRO_DIALOGO = [
        "Maestro del Domo: ¡Así que tú eres el nuevo Viajero!",
        "Maestro: La fiesta de esta noche decidirá tu primer Auralis.",
        "Maestro: Pero antes, pasa por el Laboratorio. Allí te esperan.",
        "Maestro: Cuando estés listo, sube al Domo y demuéstrame tu valía."
    ];

    // ==========================================
    // 5.5. ZONAS DE HIERBA ALTA (Estilo Pokémon)
    // ==========================================
    const zonaHierbajos = [];

    function crearMatojo(x, z) {
        const grupo = new THREE.Group();

        // Color verde brillante para que destaque
        const matHierba = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });

        // Hacemos 4 conos para dar sensación de densidad
        const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 5), matHierba);
        c1.position.y = 0.3;
        c1.castShadow = true;
        grupo.add(c1);

        const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 5), matHierba);
        c2.position.set(0.15, 0.25, 0.15);
        c2.rotation.z = 0.2;
        c2.castShadow = true;
        grupo.add(c2);

        const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 5), matHierba);
        c3.position.set(-0.15, 0.2, -0.1);
        c3.rotation.x = 0.2;
        c3.castShadow = true;
        grupo.add(c3);

        const c4 = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.5, 5), matHierba);
        c4.position.set(0, 0.25, -0.15);
        c4.rotation.x = -0.2;
        c4.castShadow = true;
        grupo.add(c4);

        grupo.position.set(x, 0, z);
        scene.add(grupo);

        zonaHierbajos.push(grupo);
    }

    // Función para generar una zona completa de hierba alta
    function crearZonaHierba(minX, maxX, minZ, maxZ) {
        // 1. El parche de suelo oscuro
        const anchoZona = maxX - minX;
        const altoZona = maxZ - minZ;
        const centroX = minX + anchoZona / 2;
        const centroZ = minZ + altoZona / 2;

        const geoSueloAlto = new THREE.PlaneGeometry(anchoZona, altoZona);
        // Usamos la misma textura del césped normal
        const matSueloAlto = new THREE.MeshLambertMaterial({ map: texturaCesped });
        const sueloAlto = new THREE.Mesh(geoSueloAlto, matSueloAlto);
        sueloAlto.rotation.x = -Math.PI / 2;
        sueloAlto.position.set(centroX, 0.05, centroZ);
        sueloAlto.receiveShadow = true;
        scene.add(sueloAlto);

        // 2. Rellenamos la zona con matorrales aleatorios
        for (let x = minX + 0.4; x < maxX; x += 0.7) {
            for (let z = minZ + 0.4; z < maxZ; z += 0.7) {
                const offsetX = (Math.random() - 0.5) * 0.3;
                const offsetZ = (Math.random() - 0.5) * 0.3;

                // Dejamos algunos huecos aleatorios
                if (Math.random() > 0.15) {
                    crearMatojo(x + offsetX, z + offsetZ);
                }
            }
        }
    }

    // 3. Creamos las DOS zonas (dejando un hueco central para el camino)
    // El camino vertical está en X=11.5 (de 10.5 a 12.5)

    // Zona Izquierda: se expande hacia la izquierda (desde X=4 hasta X=10.3)
    crearZonaHierba(4, 10.3, 7.5, 11.5);

    // Zona Derecha: ES ESPEJO de la izquierda (desde X=12.7 hasta X=19)
    crearZonaHierba(12.7, 19, 7.5, 11.5);

    // ==========================================
    // 6. COLISIONES
    // ==========================================
    function colisiona(nx, nz) {
        if (nx < JUGADOR_RADIO || nx > MAPA_ANCHO - JUGADOR_RADIO) return true;
        if (nz < JUGADOR_RADIO || nz > MAPA_ALTO - JUGADOR_RADIO) return true;

        for (const c of colliders) {
            if (nx + JUGADOR_RADIO > c.minX && nx - JUGADOR_RADIO < c.maxX &&
                nz + JUGADOR_RADIO > c.minZ && nz - JUGADOR_RADIO < c.maxZ) {
                return true;
            }
        }
        const m = colliderMaestro;
        if (nx + JUGADOR_RADIO > m.minX && nx - JUGADOR_RADIO < m.maxX &&
            nz + JUGADOR_RADIO > m.minZ && nz - JUGADOR_RADIO < m.maxZ) {
            return true;
        }
        return false;
    }

    // ==========================================
    // 7. CONTROLES
    // ==========================================
    const teclas = {
        w: false, a: false, s: false, d: false,
        arrowup: false, arrowdown: false, arrowleft: false, arrowright: false
    };
    const VELOCIDAD = 4.5;

    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (k in teclas) { teclas[k] = true; e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (k in teclas) { teclas[k] = false; e.preventDefault(); }
    });

    // ==========================================
    // 8. DIÁLOGO
    // ==========================================
    let indiceDialogo = 0;
    let dialogoAbierto = false;

    function estaCercaDelMaestro() {
        const dx = jugador.position.x - maestro.position.x;
        const dz = jugador.position.z - maestro.position.z;
        return Math.sqrt(dx * dx + dz * dz) < 1.8;
    }
    function estaEnPuertaLaboratorio() {
        // El laboratorio está en X=6, Y=2.5. Su puerta está en el centro de su base.
        const puertaX = 6 + 1.5; // Centro del ancho (3/2)
        const puertaZ = 5.5;     // Base del edificio

        const dx = jugador.position.x - puertaX;
        const dz = jugador.position.z - puertaZ;
        return Math.sqrt(dx * dx + dz * dz) < 1.0; // Si está a menos de 1 metro
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

    let cooldownPuerta = false;

    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() !== 'e') return;
        if (cooldownPuerta) return;

        if (dialogoAbierto) {
            avanzarDialogo();
        }
        else if (enInterior) {
            // 1. ¿Estamos cerca de una Auraball?
            const ballIndex = obtenerAuraballCercana();

            if (ballIndex !== -1) {
                // ¡Hemos elegido una Auraball!
                if (window.playSelectSound) window.playSelectSound();

                // Obtenemos los datos reales de la bola que hemos tocado
                const bolaElegida = auralisInterior[ballIndex].userData;

                // Guardamos la elección en el navegador
                localStorage.setItem('auralis_elegido_id', bolaElegida.id);
                localStorage.setItem('auralis_elegido_nombre', bolaElegida.nombre);

                // Mostramos el diálogo
                const caja = document.getElementById('caja-dialogo');
                caja.classList.remove('hidden');
                caja.querySelector('.texto-dialogo').innerText =
                    `¡Has elegido a ${bolaElegida.nombre}! Vuelve al exterior para comenzar tu aventura.`;

                // Después de 2.5 segundos, volvemos al exterior
                setTimeout(() => {
                    caja.classList.add('hidden');
                    enInterior = false;
                    jugador.position.z = 7.5;
                    if (window.playClickSound) window.playClickSound();
                }, 2500);
            }
            // 2. Si no hay bola cerca, ¿estamos en la puerta de salida?
            else if (typeof estaEnPuertaSalida === 'function' && estaEnPuertaSalida()) {
                if (window.playSelectSound) window.playSelectSound();
                enInterior = false;
                jugador.position.z = 7.5; // Aparecer fuera
                cooldownPuerta = true;
                setTimeout(() => { cooldownPuerta = false; }, 500);
            }
        }
        else {
            // Estamos en el exterior
            if (estaCercaDelMaestro()) {
                abrirDialogo();
            } else if (estaEnPuertaLaboratorio()) {
                // Comprobar si ya tiene un Auralis elegido
                const auralisGuardado = localStorage.getItem('auralis_elegido_nombre');

                if (auralisGuardado) {
                    // Ya tiene uno, mostramos mensaje y no entramos
                    if (window.playBeep) window.playBeep(220, 0.2, 'square', 0.05); // Sonido de error

                    const caja = document.getElementById('caja-dialogo');
                    caja.classList.remove('hidden');
                    caja.querySelector('.texto-dialogo').innerText =
                        `Ya has elegido a ${auralisGuardado}. ¡Solo puedes tener un Auralis inicial!`;

                    // Ocultamos el mensaje a los 3 segundos
                    setTimeout(() => {
                        caja.classList.add('hidden');
                    }, 3000);

                    cooldownPuerta = true;
                    setTimeout(() => { cooldownPuerta = false; }, 500);
                } else {
                    // No tiene Auralis, puede entrar
                    if (window.playSelectSound) window.playSelectSound();
                    crearInteriorLaboratorio();
                    cooldownPuerta = true;
                    setTimeout(() => { cooldownPuerta = false; }, 500);
                }
            }
        }
    });

    // ==========================================
    // 9. BUCLE DE RENDER
    // ==========================================
    const clock = new THREE.Clock();

    function animar() {
        requestAnimationFrame(animar);
        const dt = Math.min(clock.getDelta(), 0.1);

        if (juegoPausado) {
            return;
        }

        if (!dialogoAbierto) {
            let dx = 0, dz = 0;
            if (teclas.w || teclas.arrowup) dz -= 1;
            if (teclas.s || teclas.arrowdown) dz += 1;
            if (teclas.a || teclas.arrowleft) dx -= 1;
            if (teclas.d || teclas.arrowright) dx += 1;

            if (dx !== 0 || dz !== 0) {
                const len = Math.sqrt(dx * dx + dz * dz);
                dx /= len;
                dz /= len;

                const nx = jugador.position.x + dx * VELOCIDAD * dt;
                const nz = jugador.position.z + dz * VELOCIDAD * dt;

                if (!colisiona(nx, jugador.position.z)) {
                    jugador.position.x = nx;
                }
                if (!colisiona(jugador.position.x, nz)) {
                    jugador.position.z = nz;
                }

                const angulo = Math.atan2(dx, dz);
                jugador.rotation.y = angulo;
            }
        }

        // Animación del Maestro
        maestro.position.y = Math.sin(clock.elapsedTime * 1.5) * 0.05;

        // Animación de las nubes
        nubes.forEach(n => {
            n.grupo.position.x += n.velocidad * dt;
            if (n.grupo.position.x > 30) {
                n.grupo.position.x = -10;
            }
        });

        if (enInterior) {
            let idx = 0, idz = 0;
            if (teclas.w || teclas.arrowup) idz -= 1;
            if (teclas.s || teclas.arrowdown) idz += 1;
            if (teclas.a || teclas.arrowleft) idx -= 1;
            if (teclas.d || teclas.arrowright) idx += 1;

            moverJugadorInterior(idx, idz, dt);

            // --- NUEVO: Resaltar la bola cercana ---
            const ballIndex = obtenerAuraballCercana();
            auralisInterior.forEach((b, i) => {
                b.rotation.y += dt * 2;
                // Si es la bola cercana, la hacemos grande temporalmente (efecto imán)
                if (i === ballIndex) {
                    b.scale.set(1.3, 1.3, 1.3);
                } else {
                    b.scale.set(1, 1, 1);
                }
            });
            // ------------------------------------

            renderer.render(escenaInterior, camaraInterior);
        } else {
            // Lógica de movimiento exterior (si no hay diálogo)
            if (!dialogoAbierto) {
                let dx = 0, dz = 0;
                // ... (tu lógica de movimiento del exterior) ...
            }
            // Animaciones del exterior (nubes, etc)
            renderer.render(scene, camara);
        }
    }

    animar();

    // ==========================================
    // 10. RESIZE
    // ==========================================
    window.addEventListener('resize', () => {
        const a = window.innerWidth / window.innerHeight;
        camara.aspect = a;
        camara.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ==========================================
    // 11. OVERLAYS (combate / victoria)
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

        // ==========================================
    // 12. MENÚ DE PAUSA (ESC)
    // ==========================================
    const menuPausa = document.getElementById('menu-pausa');
    const btnPausaContinuar = document.getElementById('btn-pausa-continuar');
    const btnPausaGuardar = document.getElementById('btn-pausa-guardar');
    const btnPausaSalir = document.getElementById('btn-pausa-salir');
    let juegoPausado = false;

    // Abrir/Cerrar menú con ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            juegoPausado = !juegoPausado;
            if (juegoPausado) {
                menuPausa.classList.remove('hidden');
                if (window.playSelectSound) window.playSelectSound();
            } else {
                menuPausa.classList.add('hidden');
                if (window.playClickSound) window.playClickSound();
            }
        }
    });

    // Botón: Continuar
    if (btnPausaContinuar) {
        btnPausaContinuar.addEventListener('click', () => {
            juegoPausado = false;
            menuPausa.classList.add('hidden');
            if (window.playClickSound) window.playClickSound();
        });
    }

    // Botón: Guardar y Salir
    if (btnPausaGuardar) {
        btnPausaGuardar.addEventListener('click', () => {
            // Al estar guardado ya en localStorage cuando coges al Auralis,
            // solo tenemos que irnos al menú.
            if (window.playSelectSound) window.playSelectSound();
            window.location.href = 'index.html';
        });
    }

    // Botón: Salir sin guardar (Borra la partida actual)
    if (btnPausaSalir) {
        btnPausaSalir.addEventListener('click', () => {
            const confirmar = confirm("¿Seguro que quieres salir SIN GUARDAR? Perderás tu progreso.");
            if (confirmar) {
                localStorage.removeItem('auralis_elegido_nombre');
                localStorage.removeItem('auralis_elegido_id');
                if (window.playClickSound) window.playClickSound();
                window.location.href = 'index.html';
            }
        });
    }
});