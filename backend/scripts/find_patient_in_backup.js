const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function searchInBackup() {
    const backupPath = path.join(__dirname, '../../backups/EMERGENCIA_RESPALDO.sql');
    
    if (!fs.existsSync(backupPath)) {
        console.log('No se encontró el archivo de respaldo.');
        return;
    }

    const fileStream = fs.createReadStream(backupPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let foundPacientes = false;

    for await (const line of rl) {
        // Buscar inserciones en la tabla PACIENTES
        if (line.includes('INSERT INTO `PACIENTES`') || line.includes('INSERT INTO PACIENTES')) {
            foundPacientes = true;
        }

        if (foundPacientes) {
            // Buscar el ID 77 (77, ...)
            if (line.includes('(77,') || line.includes('(77 ,')) {
                console.log('Encontrado registro de Paciente 77:');
                console.log(line);
                process.exit(0);
            }
            
            // Si llegamos a otro INSERT o fin de bloque, tal vez debamos seguir buscando si es un INSERT multilinea
            if (line.endsWith(';')) {
                // foundPacientes = false; // No resetear si hay múltiples INSERTS de pacientes
            }
        }
    }
    
    console.log('No se encontró al paciente 77 en el respaldo.');
}

searchInBackup();
