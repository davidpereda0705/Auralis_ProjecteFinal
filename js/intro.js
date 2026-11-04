document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // TEXTOS DE LA INTRODUCCIÓN
    // ==========================================
    const TEXTS = [
        "El mundo de Auralis vivía en perfecta armonía...",
        "Seis elementos fluían a través de criaturas mágicas: los Auralis.",
        "Pero un día, el equilibrio se rompió y el caos se desató.",
        "Tú, un Viajero Novato, llegas a Pueblo Veloria.",
        "El Maestro del Domo te espera para poner a prueba tu valía...",
        "Debes escoger a tu primer Auralis y comenzar tu aventura."
    ];

    // ==========================================
    // VARIABLES
    // ==========================================
    let currentTextIndex = 0;
    let charIndex = 0;
    let isTyping = false;
    let typingInterval = null;
    let isDone = false;

    // ==========================================
    // ELEMENTOS DOM
    // ==========================================
    const textElement = document.getElementById('intro-text');
    const btnSkip = document.getElementById('btn-skip');
    const btnContinue = document.getElementById('btn-continue');
    const introBox = document.getElementById('intro-text-box');
    const cursor = document.getElementById('intro-cursor');

    // ==========================================
    // LÓGICA DEL TEXTO
    // ==========================================
    
    // Velocidad de escritura (ms por letra)
    const TYPING_SPEED = 40; 

    function typeText() {
        if (charIndex < TEXTS[currentTextIndex].length) {
            textElement.textContent += TEXTS[currentTextIndex].charAt(charIndex);
            charIndex++;
            typingInterval = setTimeout(typeText, TYPING_SPEED);
        } else {
            // Terminó de escribir esta línea
            isTyping = false;
            cursor.classList.remove('hidden');
            
            // Si es la última línea, mostrar botón de continuar
            if (currentTextIndex === TEXTS.length - 1) {
                btnSkip.classList.add('hidden');
                btnContinue.classList.remove('hidden');
                isDone = true;
            }
        }
    }

    function startTyping() {
        isTyping = true;
        charIndex = 0;
        textElement.textContent = ""; // Limpiar caja
        cursor.classList.add('hidden');
        clearTimeout(typingInterval);
        typeText();
    }

    function nextLine() {
        if (currentTextIndex < TEXTS.length - 1) {
            currentTextIndex++;
            startTyping();
        }
    }

    // ==========================================
    // EVENTOS
    // ==========================================

    // Clic en la caja de texto para avanzar
    introBox.addEventListener('click', () => {
        if (isDone) return;
        
        if (isTyping) {
            // Si está escribiendo, mostramos todo el texto de golpe
            clearTimeout(typingInterval);
            textElement.textContent = TEXTS[currentTextIndex];
            charIndex = TEXTS[currentTextIndex].length;
            isTyping = false;
            cursor.classList.remove('hidden');
            
            if (currentTextIndex === TEXTS.length - 1) {
                btnSkip.classList.add('hidden');
                btnContinue.classList.remove('hidden');
                isDone = true;
            }
        } else {
            // Si ya terminó de escribir, pasamos a la siguiente
            nextLine();
        }
    });

    // Enter o Espacio también avanzan
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            introBox.click();
        }
    });

    // Botón de saltar
    btnSkip.addEventListener('click', (e) => {
        e.stopPropagation(); // Evitar que el clic afecte a la caja de texto
        window.location.href = 'juego.html';
    });

    // Botón de continuar (al final)
    btnContinue.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'juego.html';
    });

    // Iniciar la primera línea
    startTyping();
});