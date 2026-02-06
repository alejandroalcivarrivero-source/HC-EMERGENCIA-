const fs = require('fs');
const readline = require('readline');
const path = require('path');

const inputFile = path.join(__dirname, '../backups/EMERGENCIA_RESPALDO.sql');
const outputDir = __dirname;

const tablesToExtract = [
    { name: 'CAT_PROVINCIAS', fileName: 'temp_provincias.sql' },
    { name: 'CAT_CANTONES', fileName: 'temp_cantones.sql' },
    { name: 'CAT_CIE10', fileName: 'temp_cie10.sql' },
    { name: 'MEDICAMENTOS', fileName: 'temp_medicamentos.sql' }
];

async function extract() {
    for (const table of tablesToExtract) {
        console.log(`Buscando datos para ${table.name}...`);
        const fileStream = fs.createReadStream(inputFile);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let capturing = false;
        const outputStream = fs.createWriteStream(path.join(outputDir, table.fileName));

        for await (const line of rl) {
            if (line.includes(`INSERT INTO \`${table.name}\``)) {
                capturing = true;
                outputStream.write(line + '\n');
                continue;
            }

            if (capturing) {
                if (line.trim() === '' || line.startsWith('--') || line.startsWith('UNLOCK TABLES') || line.startsWith('CREATE TABLE')) {
                    // Fin del bloque de INSERTs para esta tabla
                    // Nota: mysqldump suele terminar con un punto y coma al final de la última línea de valores
                    // o una nueva sentencia. Si la línea actual empieza con algo que no es un valor, paramos.
                    if (!line.trim().startsWith('(')) {
                         capturing = false;
                         break;
                    }
                }
                outputStream.write(line + '\n');
                if (line.trim().endsWith(';')) {
                    capturing = false;
                    break;
                }
            }
        }
        outputStream.end();
        console.log(`Finalizada extracción de ${table.name} a ${table.fileName}`);
    }
}

extract().catch(err => console.error(err));
