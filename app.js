// Variables globales del motor 3D y control de mouse
let scene, camara, renderer, particleSystem;
let mouseX = 0, mouseY = 0; 
let targetX = 0, targetY = 0;
let espacioActual = 'core'; 

// VARIABLES DE LA RED NEURONAL UNIFORME
let lineMesh; 
let maxConnections = 90;  
let minDistance = 2.0;    
let maxConnectionsPerParticle = 3; 

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

// --- 🎙️ ⚡ VARIABLES NUEVAS: AUDIO, MÚSICA Y SÍNTESIS DE VOZ ---
let audioCtx;
let oscillatorAmbient;
let synthVoice = window.speechSynthesis;

function init() {
    // 1. Crear la escena
    scene = new THREE.Scene();

    // 2. Configurar la cámara en español
    camara = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camara.position.z = 7; 

    // 3. Configurar el renderizador automático inyectado por Node/DOM
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x06060c, 1); 

    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100vw';
    renderer.domElement.style.height = '100vh';
    renderer.domElement.style.zIndex = '1'; 
    renderer.domElement.style.pointerEvents = 'none';

    document.body.prepend(renderer.domElement);

    // 4. Crear los puntos y las líneas de la red
    createBrainParticles();

    // 5. Escuchadores de eventos interactivos
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onDocumentMouseMove);

    // 👈 NUEVO: Capturar el primer clic del usuario para activar el audio de fondo por seguridad del navegador
    document.addEventListener('click', iniciarAudioDeFondo, { once: true });

    // 6. 🖥️ NUEVO: Escanear el hardware real del visitante para el widget de biometría
    escanearHardwareVisitante();

    // 7. Encender bucle continuo de animación
    animate();

    // 🚀 Mensaje de bienvenida de la IA por voz
    setTimeout(() => {
        hablarIA("Sistema en línea. Conectando con el núcleo de David Marca. Bienvenido, operador.");
    }, 1000);
}

// 🖥️ NUEVA FUNCIÓN: Captura las Web APIs reales del navegador del visitante
function escanearHardwareVisitante() {
    const userAgent = navigator.userAgent;
    let osDetected = "UNKNOWN_OS";
    let hostNode = "LOCAL_VISITOR";

    // Mapeo simple del Sistema Operativo
    if (userAgent.indexOf("Win") !== -1) osDetected = "WINDOWS_NT";
    if (userAgent.indexOf("Mac") !== -1) osDetected = "MACOS_KERNEL";
    if (userAgent.indexOf("Linux") !== -1) osDetected = "LINUX_CORE";

    // Captura cuántos núcleos físicos reales de procesamiento tiene el PC del usuario
    const cpuCores = navigator.hardwareConcurrency || 4;

    // Inyectamos los datos reales capturados en las etiquetas de tu HTML
    document.getElementById("bio-host").textContent = hostNode;
    document.getElementById("bio-os").textContent = osDetected;
    document.getElementById("bio-cores").textContent = cpuCores;
}

// 🎙️ NUEVA FUNCIÓN: Sintetizador de voz inteligente que activa la onda visual
function hablarIA(textoAEnviar) {
    // Si la IA ya está hablando, cancelamos el audio anterior para que no se amontone
    if (synthVoice.speaking) synthVoice.cancel();

    const elMensaje = new SpeechSynthesisUtterance(textoAEnviar);
    
    // Configuramos una tonalidad robótica y futurista (Bajo tono y velocidad calculada)
    elMensaje.pitch = 0.6; // Tono grave/industrial
    elMensaje.rate = 1.0;  // Velocidad de lectura normal

    // Buscamos una voz en español disponible en el sistema operativo del usuario
    const lasVoces = synthVoice.getVoices();
    const vozEspañol = lasVoces.find(voz => voz.lang.includes('es'));
    if (vozEspañol) elMensaje.voice = vozEspañol;

    const waveformWidget = document.querySelector('.hud-audio-waveform');
    const audioStatusText = document.querySelector('.audio-status-text');

    // Al arrancar la voz, encendemos la vibración de las barritas CSS
    elMensaje.onstart = () => {
        if (waveformWidget) waveformWidget.classList.add('speaking');
        if (audioStatusText) audioStatusText.textContent = "AI_VOICE_CORE: TRANSMITTING...";
    };

    // Al terminar de hablar, apagamos la onda visual y la dejamos en reposo (IDLE)
    elMensaje.onend = () => {
        if (waveformWidget) waveformWidget.classList.remove('speaking');
        if (audioStatusText) audioStatusText.textContent = "AI_VOICE_CORE: IDLE";
    };

    synthVoice.speak(elMensaje);
}

// ⚡ NUEVA FUNCIÓN: Crea una música de fondo leve sintetizada por código (Frecuencia Binaural)
function iniciarAudioDeFondo() {
    // Los navegadores modernos prohíben reproducir audio sin que el usuario dé un clic previo en la pantalla
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Creamos un oscilador de audio de onda senoidal muy bajo y relajante (estilo nave espacial de fondo)
    oscillatorAmbient = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillatorAmbient.type = 'sine';
    oscillatorAmbient.frequency.setValueAtTime(60, audioCtx.currentTime); // 60Hz: Un zumbido cibernético muy sutil
    
    // Calibramos el volumen para que sea sumamente LEVE y ambiental
    gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime); // 3% de volumen total para no aturdir

    oscillatorAmbient.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillatorAmbient.start();
    console.log("Música ambiental inyectada de fondo con éxito.");
}

function createBrainParticles() {
    const particlesCount = 200; 
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3); 
        
    for (let i = 0; i < particlesCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 8; 
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x00f3ff,
        size: 0.05, 
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending 
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00f3ff,     
        transparent: true,
        opacity: 0.4, 
        blending: THREE.AdditiveBlending 
    });

    lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineMesh);
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) / 100;
    mouseY = (event.clientY - windowHalfY) / 100;
}

function onWindowResize() {
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    if (particleSystem && lineMesh) {
        const esFallo = particleSystem.material.color.getHex() === 0xff3333;
        const multiplicadorVelocidad = esFallo ? 6 : 1;

        if (espacioActual === 'core') {
            particleSystem.rotation.y += 0.0006 * multiplicadorVelocidad;
            particleSystem.rotation.x += 0.0002 * multiplicadorVelocidad;
            particleSystem.rotation.y += targetX * 0.01;
            particleSystem.rotation.x += targetY * 0.01;
        } else if (espacioActual === 'sobre-mi') {
            particleSystem.rotation.y += 0.002;
            particleSystem.position.z = Math.sin(Date.now() * 0.001) * 0.5;
        } else if (espacioActual === 'proyectos') {
            particleSystem.rotation.z += 0.005;
            particleSystem.rotation.y += 0.001;
            particleSystem.position.x = targetX * 0.5;
            particleSystem.position.y = -targetY * 0.5;
        } else if (espacioActual === 'stack') {
            particleSystem.position.y -= 0.015; 
            if (particleSystem.position.y < -3) particleSystem.position.y = 3; 
        }} else if (espacioActual === 'contacto') {
            // DISEÑO 4: Nebulosa Elíptica Lenta (Las partículas se detienen y respiran de forma armónica)
            particleSystem.rotation.y += 0.0002;
            particleSystem.rotation.x += 0.0001;
            // Genera una oscilación magnética sutil en el tamaño de los puntos
            particleSystem.material.size = 0.04 + Math.sin(Date.now() * 0.002) * 0.01;
        }

        lineMesh.rotation.copy(particleSystem.rotation);
        lineMesh.position.copy(particleSystem.position);

        const vertexPositions = particleSystem.geometry.attributes.position.array;
        const totalParticles = vertexPositions.length / 3;
        const linePositions = new Float32Array(maxConnections * 2 * 3); 
        let numConnections = 0;

        const connectionCounters = new Array(totalParticles).fill(0);

        for (let i = 0; i < totalParticles; i++) {
            if (connectionCounters[i] >= maxConnectionsPerParticle) continue;

            for (let j = i + 1; j < totalParticles; j++) {
                if (numConnections >= maxConnections) break;
                if (connectionCounters[j] >= maxConnectionsPerParticle) continue;

                const ax = vertexPositions[i * 3];
                const ay = vertexPositions[i * 3 + 1];
                const az = vertexPositions[i * 3 + 2];

                const bx = vertexPositions[j * 3];
                const by = vertexPositions[j * 3 + 1];
                const bz = vertexPositions[j * 3 + 2];

                const dx = ax - bx;
                const dy = ay - by;
                const dz = az - bz;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < minDistance) {
                    const index = numConnections * 6;
                    linePositions[index] = ax;
                    linePositions[index + 1] = ay;
                    linePositions[index + 2] = az;
                    linePositions[index + 3] = bx;
                    linePositions[index + 4] = by;
                    linePositions[index + 5] = bz;
                    connectionCounters[i]++;
                    connectionCounters[j]++;
                    numConnections++;
                }
            }
        }
        lineMesh.geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        lineMesh.geometry.setDrawRange(0, numConnections * 2);
        lineMesh.geometry.attributes.position.needsUpdate = true;
        }
        renderer.render(scene, camara);
        
        // LÓGICA DE NAVEGACIÓN INTERACTIVA
        // LÓGICA DE NAVEGACIÓN INTERACTIVA CORREGIDA POR CONTROL DE CAPA SUPERIOR
function activarNodo(nombreNodo) {
    console.log("CRITICAL ALERT: Alterando secuencia de núcleo para: " + nombreNodo.toUpperCase());

    const bodyElement = document.body;
    const biometricStatus = document.getElementById("bio-status");

    // 1. ACTIVAR EL EFECTO FALLO EN LA PANTALLA
    bodyElement.classList.add('sistema-fallo');

    if (biometricStatus) {
        biometricStatus.textContent = "CRITICAL_OVERLOAD";
        biometricStatus.className = "status-overload";
    }

    if (particleSystem && lineMesh) {
        particleSystem.material.color.setHex(0xff3333); 
        lineMesh.material.color.setHex(0xff3333); 
        particleSystem.material.size = 0.08;           
    }

    // 2. 🛠️ TRUCO MAESTRO INFALIBLE: Buscamos la capa UI principal completa
    const uiWrapper = document.querySelector('.ui-wrapper');
    if (uiWrapper) {
        // En lugar de desvanecer solo los botones, desvanecemos toda la lona central
        uiWrapper.style.opacity = '0';
        uiWrapper.style.transition = 'opacity 0.4s cubic-bezier(0.7, 0, 0.3, 1)';
        uiWrapper.style.pointerEvents = 'none'; // Bloquea los clics para que no estorben
    }

    espacioActual = nombreNodo;

    // Órdenes de voz reactivas de la IA
    if (nombreNodo === 'sobre-mi') hablarIA("Accediendo a bitácora de perfil del desarrollador. Inicializando datos.");
    if (nombreNodo === 'proyectos') hablarIA("Abriendo nodo de proyectos activos. Decodificando archivos binarios.");
    if (nombreNodo === 'stack') hablarIA("Escaneando el núcleo de lenguajes y tecnologías integradas.");
    if (nombreNodo === 'contacto') hablarIA("Abriendo canal seguro de comunicación de datos. Ingrese sus credenciales, operador.");

    // Mapeo exacto de los contenedores HTML
    let idElemento = '';
    if (nombreNodo === 'sobre-mi') idElemento = 'nodo-sobre-mi';
    if (nombreNodo === 'proyectos') idElemento = 'nodo-proyectos';
    if (nombreNodo === 'stack') idElemento = 'nodo-stack';
    if (nombreNodo === 'contacto') idElemento = 'nodo-contacto';

    const panelObjetivo = document.getElementById(idElemento);
    
    setTimeout(() => {
        bodyElement.classList.remove('sistema-fallo');
        
        if (particleSystem && lineMesh) {
            if (espacioActual === 'sobre-mi') {
                particleSystem.material.color.setHex(0x00ff99); 
                lineMesh.material.color.setHex(0x00ff99);
                particleSystem.material.size = 0.05;
            } else if (espacioActual === 'proyectos') {
                particleSystem.material.color.setHex(0xff00ff); 
                lineMesh.material.color.setHex(0xff00ff);
                particleSystem.material.size = 0.06;
            } else if (espacioActual === 'stack') {
                particleSystem.material.color.setHex(0x33ff33); 
                lineMesh.material.color.setHex(0x33ff33);
                particleSystem.material.size = 0.03;
            } else if (espacioActual === 'contacto') {
                particleSystem.material.color.setHex(0xffaa00); // Color Oro
                lineMesh.material.color.setHex(0xffaa00);
                particleSystem.material.size = 0.04;
            }
        }

        particleSystem.position.set(0, 0, 0);
        if(espacioActual !== 'stack') particleSystem.rotation.set(0, 0, 0);

        if (panelObjetivo) {
            panelObjetivo.classList.add('active');
            iniciarEfectoEscritura(panelObjetivo);
        }
    }, 400); 
}

function regresarAlCore() {
    console.log("Restaurando estabilidad del núcleo central...");
    
    const bodyElement = document.body;
    bodyElement.classList.add('sistema-fallo');

    const paneles = document.querySelectorAll('.sub-space-panel');
    paneles.forEach(panel => {
        panel.classList.remove('active');
    });

    const biometricStatus = document.getElementById("bio-status");
    espacioActual = 'core';

    hablarIA("Restaurando parámetros de estabilidad del procesador central.");

    setTimeout(() => {
        bodyElement.classList.remove('sistema-fallo');

        if (biometricStatus) {
            biometricStatus.textContent = "STABLE";
            biometricStatus.className = "status-stable";
        }

        if (particleSystem && lineMesh) {
            particleSystem.material.color.setHex(0x00f3ff); 
            lineMesh.material.color.setHex(0x00f3ff);
            particleSystem.material.size = 0.04;           
            particleSystem.position.set(0, 0, 0);
            particleSystem.rotation.set(0, 0, 0);
        }

        // 🛠️ RESTAURAMOS LA VISIBILIDAD COMPLETA DE LA INTERFAZ CENTRAL
        const uiWrapper = document.querySelector('.ui-wrapper');
        if (uiWrapper) {
            uiWrapper.style.opacity = '1';
            uiWrapper.style.pointerEvents = 'auto'; // Reactivamos las interacciones normales
        }
    }, 300);
}

        // EFECTO ESCRITURA DIGITAL (TYPING EFFECT)
        function iniciarEfectoEscritura(panel) {
        const elementosTexto = panel.querySelectorAll('.typing-text');
        elementosTexto.forEach(elemento => {
        const textoCompleto = elemento.getAttribute('data-text');
        if (textoCompleto) {
        elemento.textContent = '';
        let indiceLetra = 0;
        elemento.style.borderRight = '2px solid #00f3ff';
        const intervaloEscritura = setInterval(() => {
        if (indiceLetra < textoCompleto.length) {
        elemento.textContent += textoCompleto.charAt(indiceLetra);
        indiceLetra++;
        } else {
        clearInterval(intervaloEscritura);
        elemento.style.borderRight = 'none';
        }
        }, 25);
        }
        });
        }
        // Inicializar todo el motor 3D interactivo al cargar la ventana
        window.onload = () => {
        init();
};
