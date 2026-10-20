// Variables globales del motor 3D y control de mouse
let scene, camara, renderer, particleSystem;
let mouseX = 0, mouseY = 0; 
let targetX = 0, targetY = 0;
let espacioActual = 'core'; 

// VARIABLES DE LA RED NEURONAL
let lineMesh; 
let maxConnections = 120; // Cantidad óptima de hilos para no colapsar la GPU
let minDistance = 2.5;    // Expandimos la distancia para forzar conexiones masivas visibles
let maxConnectionsPerParticle = 3; // 👈 NUEVO: Límite estricto de cables que puede emitir cada neurona

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

function init() {
    // 1. Crear la escena (El universo 3D)
    scene = new THREE.Scene();

    // 2. Configurar la cámara en español
    camara = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // 👈 CALIBRACIÓN DE CAMARA: Alejada a 7 para que toda la red quede frente a tus ojos sin puntos ciegos
    camara.position.z = 7; 

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
    renderer.domElement.style.pointerEvents = 'none';

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
    const particlesCount = 200; // 200 puntos es la densidad perfecta para que las líneas luzcan sofisticadas
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3); 
        
    for (let i = 0; i < particlesCount * 3; i++) {
        // Dispersión calibrada en un rango contenido de 8x8x8 frente a la cámara
        positions[i] = (Math.random() - 0.5) * 8; 
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x00f3ff,
        size: 0.05, // Puntos más grandes para que destaquen sobre la oscuridad
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending 
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // --- CONFIGURACIÓN DE LOS ENLACES DE LUZ ---
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00f3ff,     
        transparent: true,
        opacity: 0.4, // Hilos de luz intensos y futuristas
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

        // Comportamiento orbital clásico por sección
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
        }

        lineMesh.rotation.copy(particleSystem.rotation);
        lineMesh.position.copy(particleSystem.position);

        // ALGORITMO AVANZADO DE RED NEURONAL GEOMÉTRICA UNIFORME
        const vertexPositions = particleSystem.geometry.attributes.position.array;
        const totalParticles = vertexPositions.length / 3;
        const linePositions = new Float32Array(maxConnections * 2 * 3); 
        let numConnections = 0;

        // Estructura temporal para contar los cables activos por cada punto
        const connectionCounters = new Array(totalParticles).fill(0);

        for (let i = 0; i < totalParticles; i++) {
            // Si esta neurona ya alcanzó su límite uniforme de cables, saltamos a la siguiente
            if (connectionCounters[i] >= maxConnectionsPerParticle) continue;

            for (let j = i + 1; j < totalParticles; j++) {
                if (numConnections >= maxConnections) break;
                
                // Si la neurona destino también está saturada, ignoramos este enlace
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

                // Enlace uniforme detectado bajo los parámetros simétricos
                if (dist < minDistance) {
                    const index = numConnections * 6;
                    linePositions[index] = ax;
                    linePositions[index + 1] = ay;
                    linePositions[index + 2] = az;
                    linePositions[index + 3] = bx;
                    linePositions[index + 4] = by;
                    linePositions[index + 5] = bz;

                    // Registramos el uso del cable en ambas puntas para mantener la simetría
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
}

// LÓGICA DE NAVEGACIÓN INTERACTIVA CON SECUENCIA DE ERROR
function activarNodo(nombreNodo) {
    console.log("CRITICAL ALERT: Alterando secuencia de núcleo para: " + nombreNodo.toUpperCase());

    const bodyElement = document.body;
    const coreMenu = document.querySelector('.hud-container');

    bodyElement.classList.add('sistema-fallo');

    if (particleSystem && lineMesh) {
        particleSystem.material.color.setHex(0xff3333); 
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
                particleSystem.material.color.setHex(0xff00ff); // Magenta
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
        // 👈 LIBERADO: La inicialización global ahora vive de forma independiente al final de todo el archivo
        window.onload = () => {
        init();
        };
