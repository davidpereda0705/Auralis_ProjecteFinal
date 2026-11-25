// ============================================================
// INTERIORES 3D
// ============================================================

// Variables globales para el interior
let escenaInterior = null;
let camaraInterior = null;
let jugadorInterior = null;
let auralisInterior = [];
let enInterior = false;

function crearInteriorLaboratorio() {
    escenaInterior = new THREE.Scene();
    escenaInterior.background = new THREE.Color(0x1a1a1a); // Fondo oscuro

    // Cámara isométrica para el interior
    const aspect = window.innerWidth / window.innerHeight;
    camaraInterior = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    camaraInterior.position.set(0, 8, 8);
    camaraInterior.lookAt(0, 0, 0);

    // Luces
    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    escenaInterior.add(amb);
    const luz = new THREE.PointLight(0xffffff, 1);
    luz.position.set(0, 5, 0);
    escenaInterior.add(luz);

    // Suelo
    const geoSuelo = new THREE.PlaneGeometry(10, 10);
    const matSuelo = new THREE.MeshLambertMaterial({ color: 0xd3d3d3 });
    const suelo = new THREE.Mesh(geoSuelo, matSuelo);
    suelo.rotation.x = -Math.PI / 2;
    escenaInterior.add(suelo);

    // Paredes (Caja sin techo ni suelo)
    const geoParedes = new THREE.BoxGeometry(10, 3, 10);
    const matParedes = new THREE.MeshLambertMaterial({ color: 0xe0e0e0, side: THREE.BackSide });
    const paredes = new THREE.Mesh(geoParedes, matParedes);
    paredes.position.y = 1.5;
    escenaInterior.add(paredes);

    // Mesa (Caja marrón)
    const geoMesa = new THREE.BoxGeometry(3, 1, 1);
    const matMesa = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
    const mesa = new THREE.Mesh(geoMesa, matMesa);
    mesa.position.set(0, 0.5, -2);
    mesa.castShadow = true;
    escenaInterior.add(mesa);


    // 3 Auraballs encima de la mesa (Aleatorias de los 6 Auralis)
    auralisInterior = [];

    // Definimos los 6 Auralis con sus colores
    const AURALIS_DB = [
        { id: 'brakos', nombre: 'Brakos', color: 0xc08c3f }, // Tierra (Marrón)
        { id: 'zappik', nombre: 'Zappik', color: 0xf7d02c }, // Eléctrico (Amarillo)
        { id: 'leafu', nombre: 'Leafu', color: 0x4dc04d }, // Planta (Verde)
        { id: 'flamiki', nombre: 'Flamiki', color: 0xee8130 }, // Fuego (Naranja)
        { id: 'bublo', nombre: 'Bublo', color: 0x4a90e2 }, // Agua (Azul)
        { id: 'veylo', nombre: 'Veylo', color: 0x9ec8e8 }  // Aire (Celeste)
    ];

    // Barajamos el array (Algoritmo Fisher-Yates)
    const barajados = [...AURALIS_DB].sort(() => Math.random() - 0.5);

    // Cogemos los 3 primeros
    const seleccionados = barajados.slice(0, 3);

    // Los pintamos en la mesa
    seleccionados.forEach((auralis, i) => {
        const geoBall = new THREE.SphereGeometry(0.3, 16, 16);
        const matBall = new THREE.MeshLambertMaterial({ color: auralis.color });
        const ball = new THREE.Mesh(geoBall, matBall);
        ball.position.set(-0.8 + (i * 0.8), 1.3, -2);

        // Guardamos los datos del Auralis dentro del propio objeto 3D
        ball.userData = { id: auralis.id, nombre: auralis.nombre };

        escenaInterior.add(ball);
        auralisInterior.push(ball);
    });

    // Jugador interior
    jugadorInterior = new THREE.Group();
    const geoCuerpo = new THREE.CylinderGeometry(0.28, 0.28, 0.5, 8);
    const matCuerpo = new THREE.MeshLambertMaterial({ color: 0xe63946 });
    const cuerpo = new THREE.Mesh(geoCuerpo, matCuerpo);
    cuerpo.position.y = 0.53;
    jugadorInterior.add(cuerpo);

    const geoCabeza = new THREE.SphereGeometry(0.22, 12, 12);
    const matCabeza = new THREE.MeshLambertMaterial({ color: 0xf5cba7 });
    const cabeza = new THREE.Mesh(geoCabeza, matCabeza);
    cabeza.position.y = 1.12;
    jugadorInterior.add(cabeza);

    jugadorInterior.position.set(0, 0, 3); // Aparece en la entrada
    escenaInterior.add(jugadorInterior);

    enInterior = true;

    // Puerta de salida (en la pared de abajo)
    const geoPuerta = new THREE.BoxGeometry(1.5, 2, 0.2);
    const matPuerta = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    const puerta = new THREE.Mesh(geoPuerta, matPuerta);
    puerta.position.set(0, 1, 4.9); // En el borde de la habitación
    escenaInterior.add(puerta);
}

// Función para mover al jugador dentro del interior
function moverJugadorInterior(dx, dz, dt) {
    if (!enInterior || !jugadorInterior) return;

    const vel = 4.5;
    let nx = jugadorInterior.position.x + dx * vel * dt;
    let nz = jugadorInterior.position.z + dz * vel * dt;

    // Colisiones simples con las paredes de la habitación
    if (nx < -4.5) nx = -4.5;
    if (nx > 4.5) nx = 4.5;
    if (nz < -4.5) nz = -4.5;
    if (nz > 4.5) nz = 4.5;

    // Colisión con la mesa
    if (nx > -1.6 && nx < 1.6 && nz > -2.6 && nz < -1.4) {
        return; // Bloqueado por la mesa
    }

    jugadorInterior.position.x = nx;
    jugadorInterior.position.z = nz;

    // Rotar al jugador
    if (dx !== 0 || dz !== 0) {
        jugadorInterior.rotation.y = Math.atan2(dx, dz);
    }
}
// Comprobar si el jugador está en la puerta de salida
function estaEnPuertaSalida() {
    if (!jugadorInterior) return false;
    // La puerta está en Z=4.9
    const dx = jugadorInterior.position.x - 0;
    const dz = jugadorInterior.position.z - 4.5;
    return Math.sqrt(dx * dx + dz * dz) < 1.0;
}
function obtenerAuraballCercana() {
    if (!jugadorInterior || auralisInterior.length === 0) return -1;

    let masCercana = -1;
    let distanciaMinima = 1.2; // Distancia máxima para poder cogerla

    auralisInterior.forEach((ball, index) => {
        const dx = jugadorInterior.position.x - ball.position.x;
        const dz = jugadorInterior.position.z - ball.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < distanciaMinima) {
            distanciaMinima = dist;
            masCercana = index;
        }
    });

    return masCercana;
}