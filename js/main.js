document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================================
    // AUDIO GLOBAL (Web Audio API)
    // ============================================================
    function getAudioCtx() {
        if (!window._audioCtx) {
            try {
                window._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) { return null; }
        }
        return window._audioCtx;
    }
    
    function playBeep(freq = 440, duration = 0.05, type = 'square', volume = 0.05) {
        const ctx = getAudioCtx();
        if (!ctx) return;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {}
    }
    
    function playNavigateSound() { playBeep(440, 0.04, 'square', 0.05); }
    function playSelectSound()   { 
        playBeep(880, 0.08, 'square', 0.05); 
        setTimeout(() => playBeep(1320, 0.1, 'square', 0.05), 60); 
    }
    function playFlipSound() {
        const ctx = getAudioCtx();
        if (!ctx) return;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {}
    }
    function playClickSound() { playBeep(660, 0.08, 'square', 0.05); }
    
    // ============================================================
    // LÓGICA DE LA PANTALLA DE TÍTULO (index.html)
    // ============================================================
    const menuItems = document.querySelectorAll('.menu-item');
    const flashOverlay = document.querySelector('.flash-overlay');
    
    if (menuItems.length > 0) {
        let selectedIndex = 0;
        
        function updateSelection() {
            menuItems.forEach((item, i) => {
                item.classList.toggle('selected', i === selectedIndex);
            });
        }
        
        function triggerFlash() {
            if (!flashOverlay) return;
            flashOverlay.classList.add('active');
            setTimeout(() => flashOverlay.classList.remove('active'), 30);
        }
        
        function activateItem(item) {
            playSelectSound();
            triggerFlash();
            item.classList.add('pressed');
            
            const target = item.dataset.target;
            
            setTimeout(() => {
                item.classList.remove('pressed');
                if (target && target !== '#') {
                    window.location.href = target;
                } else {
                    console.log('Opción no implementada aún:', item.querySelector('.label').textContent);
                }
            }, 200);
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % menuItems.length;
                updateSelection();
                playNavigateSound();
            } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + menuItems.length) % menuItems.length;
                updateSelection();
                playNavigateSound();
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activateItem(menuItems[selectedIndex]);
            }
        });
        
        menuItems.forEach((item, i) => {
            item.addEventListener('mouseenter', () => {
                if (selectedIndex !== i) {
                    selectedIndex = i;
                    updateSelection();
                    playNavigateSound();
                }
            });
            item.addEventListener('click', () => activateItem(item));
        });
        
        updateSelection();
    }
    
    // ============================================================
    // LÓGICA DE LA PÁGINA AURALIS (auralis.html)
    // ============================================================
    const card = document.getElementById('pokemon-card');
    
    if (card) {
        
        const AURALIS_DATA = {
            brakos: {
                name: 'Brakos',
                type: 'Tierra / Lucha',
                typeKey: 'tierra',
                icon: '🪨',
                role: 'Físico',
                power: '★★★★☆',
                description: 'Fuerte y resistente. Especialista en golpes físicos.',
                habilidades: [
                    { name: 'Pisotón', desc: 'Daña y puede aturdir' },
                    { name: 'Terremoto', desc: 'Daño en área' },
                    { name: 'Coraza', desc: 'Barrera protectora' },
                    { name: 'Núcleo Terrestre', desc: 'Potencia Tierra' }
                ]
            },
            zappik: {
                name: 'Zappik',
                type: 'Eléctrico',
                typeKey: 'electrico',
                icon: '⚡',
                role: 'Ofensivo',
                power: '★★★★★',
                description: 'Rápido y ofensivo. Experto en descargas eléctricas.',
                habilidades: [
                    { name: 'Sobrecarga', desc: 'Daño grave, baja defensa' },
                    { name: 'Alta Tensión', desc: 'Paraliza al enemigo' },
                    { name: 'Chispa', desc: 'Puede cegar al rival' },
                    { name: 'Flash', desc: 'Rápido y eficaz' }
                ]
            },
            leafu: {
                name: 'Leafu',
                type: 'Planta',
                typeKey: 'planta',
                icon: '🌿',
                role: 'Equilibrado',
                power: '★★★☆☆',
                description: 'Equilibrado y regenerativo. Se apoya en las esporas.',
                habilidades: [
                    { name: 'Fotosíntesis', desc: 'Daña y regenera HP' },
                    { name: 'Esporas', desc: 'Duerme al enemigo' },
                    { name: 'Pétalo Vital', desc: 'Ataque con pétalos' },
                    { name: 'Renacer', desc: 'Revive con parte del HP' }
                ]
            },
            flamiki: {
                name: 'Flamiki',
                type: 'Fuego',
                typeKey: 'fuego',
                icon: '🔥',
                role: 'Agresivo',
                power: '★★★★★',
                description: 'Agresivo e implacable. Renace de sus cenizas.',
                habilidades: [
                    { name: 'Combustión', desc: 'Quema 5 turnos' },
                    { name: 'Llamarada', desc: 'Potente, puede quemar' },
                    { name: 'Fénix', desc: 'Revive con HP completo' },
                    { name: 'Ignífugo', desc: 'Resiste Fuego, no quema' }
                ]
            },
            bublo: {
                name: 'Bublo',
                type: 'Agua',
                typeKey: 'agua',
                icon: '💧',
                role: 'Defensivo',
                power: '★★★☆☆',
                description: 'Defensivo y tranquilo. Cura y protege a los suyos.',
                habilidades: [
                    { name: 'Salpicadura', desc: 'Ataque básico rápido' },
                    { name: 'Burbuja', desc: 'Protege del siguiente ataque' },
                    { name: 'Hidratación', desc: 'Cura estados y HP' },
                    { name: 'Ráfaga Agua', desc: 'Potente chorro a presión' }
                ]
            },
            veylo: {
                name: 'Veylo',
                type: 'Aire',
                typeKey: 'aire',
                icon: '🌪️',
                role: 'Evasivo',
                power: '★★★★☆',
                description: 'Ágil y evasivo. Domina las corrientes de aire.',
                habilidades: [
                    { name: 'Vendaval', desc: 'Daña y hace retroceder' },
                    { name: 'Tormenta', desc: 'Daña y aturde' },
                    { name: 'Ráfaga', desc: 'Alta probabilidad de crítico' },
                    { name: 'Vuelo', desc: 'Evita ataques terrestres' }
                ]
            }
        };
        
        const pokemonItems = document.querySelectorAll('.pokemon-item');
        const frontName = document.getElementById('front-name');
        const frontSprite = document.getElementById('front-sprite');
        const frontPlaceholder = document.getElementById('front-placeholder');
        const frontType = document.getElementById('front-type');
        const frontImageBox = frontSprite.parentNode;
        const backSprite = document.getElementById('back-sprite');
        const backName = document.getElementById('back-name');
        const backType = document.getElementById('back-type');
        const backStatType = document.getElementById('back-stat-type');
        const backStatRole = document.getElementById('back-stat-role');
        const backStatPower = document.getElementById('back-stat-power');
        const backDescription = document.getElementById('back-description');
        const backHabilitiesList = document.getElementById('back-habilities-list');
        const backHeader = backSprite.parentNode;
        
        function loadAuralis(key) {
            const data = AURALIS_DATA[key];
            if (!data) return;
            
            card.classList.remove('flipped');
            card.setAttribute('data-type', data.typeKey);
            
            frontName.textContent = data.name;
            frontType.textContent = data.type;
            frontPlaceholder.textContent = data.icon;
            frontSprite.src = `assets/img/${key}.png`;
            frontSprite.alt = data.name;
            frontImageBox.classList.remove('no-sprite');
            
            backSprite.src = `assets/img/${key}.png`;
            backSprite.alt = data.name;
            backHeader.classList.remove('no-sprite');
            backName.textContent = data.name;
            backType.textContent = data.type;
            backStatType.textContent = data.type;
            backStatRole.textContent = data.role;
            backStatPower.textContent = data.power;
            backDescription.textContent = data.description;
            
            backHabilitiesList.innerHTML = '';
            data.habilidades.forEach(h => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${h.name}</strong> ${h.desc}`;
                backHabilitiesList.appendChild(li);
            });
        }
        
        pokemonItems.forEach(item => {
            item.addEventListener('click', () => {
                pokemonItems.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                playClickSound();
                loadAuralis(item.dataset.pokemon);
            });
        });
        
        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
            playFlipSound();
        });
        
        const initial = document.querySelector('.pokemon-item.selected');
        if (initial) loadAuralis(initial.dataset.pokemon);
    }
    
    // ============================================================
    // DESBLOQUEAR AUDIO AL PRIMER CLICK
    // ============================================================
    document.addEventListener('click', () => getAudioCtx(), { once: true });
    document.addEventListener('keydown', () => getAudioCtx(), { once: true });
});