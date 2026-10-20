// Variables globales del motor 3D y control de mouse
let scene, camara, renderer, particleSystem;
let mouseX = 0, mouseY = 0; 
let targetX = 0, targetY = 0;
let espacioActual = 'core'; 

// VARIABLES DE LA RED NEURONAL
let lineMesh; 
let maxConnections = 150; // Límite de líneas simultáneas para mantenerlo ligero
let minDistance = 2.2;    // Distancia máxima para enlazar dos neuronas

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

function init() {
    // 1. Crear la escena (El universo 3D)
    scene = new THREE.Scene();

    // 2. Configurar la cámara en español
    camara = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camara.position.z = 5; 

    // 3. Configurar el renderizador con fondo oscuro tecnológico profundo
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x06060c, 1); 

    // Estilizamos el lienzo de Three.js para fijarlo en el fondo absoluto de la pantalla
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100vw';
    renderer.domElement.style.height = '100vh';
    renderer.domElement.style.zIndex = '1'; 

    // Inyectamos el canvas directamente al inicio del cuerpo de la página HTML
    document.body.prepend(renderer.domElement);

    // 4. Crear los puntos y las líneas de la red
    createBrainParticles();

    // 5. Escuchadores de eventos interactivos
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onDocumentMouseMove);

    // 6. Encender el bucle de animación continua
    animate();
}

function createBrainParticles() {
    const particlesCount = 350; // Cantidad equilibrada de neuronas para que luzca estético
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3); 
        
    for (let i = 0; i < particlesCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 10; 
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x00f3ff,
        size: 0.04, 
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending 
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // --- CONFIGURACIÓN DE LOS ENLACES DE LUZ ---
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00f3ff,     // Azul cian neón brillante original
        transparent: true,
        opacity: 0.6,        // Subimos la opacidad para que sean muy visibles de fondo
        linewidth: 2,        
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

    // Efecto de inercia y suavizado para el movimiento del mouse
    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    if (particleSystem && lineMesh) {
        const esFallo = particleSystem.material.color.getHex() === 0xff3333;
        const multiplicadorVelocidad = esFallo ? 6 : 1;

        // Comportamiento de rotación y física según la carpeta abierta
        if (espacioActual === 'core') {
            particleSystem.rotation.y += 0.0008 * multiplicadorVelocidad;
            particleSystem.rotation.x += 0.0003 * multiplicadorVelocidad;
            particleSystem.rotation.y += targetX * 0.02;
            particleSystem.rotation.x += targetY * 0.02;
        } else if (espacioActual === 'sobre-mi') {
            particleSystem.rotation.y += 0.002;
            particleSystem.position.z = Math.sin(Date.now() * 0.001) * 0.5;
        } else if (espacioActual === 'proyectos') {
            particleSystem.rotation.z += 0.005;
            particleSystem.rotation.y += 0.001;
            particleSystem.position.x = targetX * 0.5;
            particleSystem.position.y = -targetY * 0.5;
        } else if (espacioActual === 'stack') {
            particleSystem.position.y -= 0.015; // Caída continua estilo matriz digital
            if (particleSystem.position.y < -3) particleSystem.position.y = 3; // Bucle infinito
        }

        // Las líneas imitan la posición exacta de las partículas
       // lineMesh.rotation.copy(particleSystem.rotation);
       // lineMesh.position.copy(particleSystem.position);

        // ALGORITMO DE INTERCONEXIÓN DINÁMICA (MATRIZ DE PROXIMIDAD)
       // const vertexPositions = particleSystem.geometry.attributes.position.array;
        //const linePositions = new Float32Array(maxConnections * 2 * 3); 
       // let numConnections = 0;

       // for (let i = 0; i < vertexPositions.length / 3; i++) {
       //
    }
    renderer.render(scene, camara); 
}

// LÓGICA DE NAVEGACIÓN INTERACTIVA CON SECUENCIA DE ERROR
function activarNodo(nombreNodo) {
    console.log("CRITICAL ALERT: Alterando secuencia de núcleo para: " + nombreNodo.toUpperCase());

    const bodyElement = document.body;
    const coreMenu = document.querySelector('.hud-container');

    bodyElement.classList.add('sistema-fallo');

    if (particleSystem && lineMesh) {
        particleSystem.material.color.setHex(0xff3333); // Enlaces rojos por fallo momentáneo
        lineMesh.material.color.setHex(0xff3333); 
        particleSystem.material.size = 0.08;           
    }

    if (coreMenu) {
        coreMenu.style.transform = 'translateZ(100px)'; 
        coreMenu.style.opacity = '0';
        coreMenu.style.pointerEvents = 'none';
    }

    espacioActual = nombreNodo;

    const panelObjetivo = document.getElementById(
        nombreNodo === 'sobre-mi' ? 'nodo-sobre-mi' : 
        nombreNodo === 'proyectos' ? 'nodo-proyectos' : 'nodo-stack'
    );
    
    setTimeout(() => {
        bodyElement.classList.remove('sistema-fallo');
        
        if (particleSystem && lineMesh) {
            if (espacioActual === 'sobre-mi') {
                particleSystem.material.color.setHex(0x00ff99); // Verde orgánico
                lineMesh.material.color.setHex(0x00ff99);
                particleSystem.material.size = 0.05;
            } else if (espacioActual === 'proyectos') {
                particleSystem.material.color.setHex(0xff00ff); // Magenta/Púrpura eléctrico
                lineMesh.material.color.setHex(0xff00ff);
                particleSystem.material.size = 0.06;
            } else if (espacioActual === 'stack') {
                particleSystem.material.color.setHex(0x33ff33); // Verde matriz de comandos
                lineMesh.material.color.setHex(0x33ff33);
                particleSystem.material.size = 0.03;
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

    const coreMenu = document.querySelector('.hud-container');
    espacioActual = 'core';

    setTimeout(() => {
        bodyElement.classList.remove('sistema-fallo');

        if (particleSystem && lineMesh) {
            particleSystem.material.color.setHex(0x00f3ff); // Regresa al cian base original
            lineMesh.material.color.setHex(0x00f3ff);
            particleSystem.material.size = 0.04;           
            particleSystem.position.set(0, 0, 0);
            particleSystem.rotation.set(0, 0, 0);
        }

        if (coreMenu) {
            coreMenu.style.transform = 'scale(1) translateZ(0)';
            coreMenu.style.opacity = '1';
            coreMenu.style.pointerEvents = 'auto';
        }
    }, 300);
}

                



function iniciarEfectoEscritura(panel) {
    // Buscamos todos los elementos con la clase .typing-text DENTRO del panel que se acaba de abrir
    const elementosTexto = panel.querySelectorAll('.typing-text');
    
    elementosTexto.forEach(elemento => {
        // Recuperamos el texto original guardado en el atributo data-text
        const textoCompleto = elemento.getAttribute('data-text');
        
        // Vaciamos el contenedor para empezar la simulación desde cero
        elemento.textContent = '';
        
        let indiceLetra = 0;
        elemento.style.borderRight = '2px solid #00f3ff'; // Agrega un cursor parpadeante de terminal
        
        // Creamos un bucle de tiempo (Intervalo) para escribir letra por letra
        const intervaloEscritura = setInterval(() => {
            if (indiceLetra < textoCompleto.length) {
                // Añadimos el siguiente carácter al texto visible
                elemento.textContent += textoCompleto.charAt(indiceLetra);
                indiceLetra++;
            } else {
                // Cuando termina de escribir todo el texto, limpia el bucle y remueve el cursor
                clearInterval(intervaloEscritura);
                elemento.style.borderRight = 'none';
            }
        }, 25); // Velocidad: Escribe una letra cada 25 milisegundos (ultra rápido y futurista)
    });
            // Inicializar todo el sistema al cargar la ventana
        window.onload = () => {
        init();
        };
}