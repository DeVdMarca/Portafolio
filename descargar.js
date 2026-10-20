const fs = require('fs');
const https = require('https');

// La ruta real de la librería matemática en internet
const url = "https://cloudflare.com";

console.log("Iniciando conexión segura con el repositorio de Three.js...");

https.get(url, (res) => {
    const path = `${__dirname}/three.min.js`;
    const filePath = fs.createWriteStream(path);
    res.pipe(filePath);
    
    filePath.on('finish', () => {
        filePath.close();
        console.log("¡DESCARGA EXITOSA! El cerebro matemático ha sido guardado localmente.");
    });
}).on('error', (err) => {
    console.error("Error en la conexión de red: ", err.message);
});