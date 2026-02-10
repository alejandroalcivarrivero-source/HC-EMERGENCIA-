const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '../debug.log');

function log(level, message) {
    const timestamp = new Date().toISOString();
    // Prevenir que objetos anidados grandes (como el error de Sequelize) se serialicen a '[Object]'
    if (typeof message === 'object' && message !== null) {
        message = JSON.stringify(message, null, 2);
    }
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    try {
        fs.appendFileSync(logPath, logMessage);
    } catch (err) {
        // Fallback a consola si falla la escritura
        console.error(`Fallo al escribir en ${logPath}:`, err);
    }
    
    // Usar console.error para errores y console.log para el resto
    if (level.toLowerCase() === 'error') {
        console.error(logMessage.trim());
    } else {
        console.log(logMessage.trim());
    }
}

// Exportar funciones semánticas
const info = (message) => log('info', message);
const warn = (message) => log('warn', message);
const error = (message) => log('error', message);

module.exports = {
    info,
    warn,
    error
};