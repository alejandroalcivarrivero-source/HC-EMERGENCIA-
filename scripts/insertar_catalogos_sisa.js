const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

// Configuración de base de datos basada en backend/config/database.js
// Intentamos usar las variables de entorno, o fallbacks si no están disponibles
const DB_HOST = process.env.DB_HOST_TRABAJO || '172.16.1.248';
const DB_PORT = process.env.DB_PORT || '3306';
const DB_USER = process.env.DB_USER || 'TICS';
const DB_PASSWORD = process.env.DB_PASSWORD || 'TICS20141';
const DB_NAME = 'SISA_EC'; // Especificado por el usuario: insertar en SISA_EC
const DB_DIALECT = 'mariadb';

console.log(`Configurando conexión a BD: ${DB_HOST}:${DB_PORT} usuario=${DB_USER} bd=${DB_NAME}`);

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  logging: false, // Silenciar logs de SQL para no saturar la consola
  dialectOptions: {
    connectTimeout: 60000
  }
});

async function crearTablas() {
  console.log('🛠️ Verificando/Creando tablas...');
  
  const createProvincias = `
    CREATE TABLE IF NOT EXISTS CAT_PROVINCIAS (
      id INT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      fecha_creacion DATETIME,
      fecha_actualizacion DATETIME
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `;

  const createCantones = `
    CREATE TABLE IF NOT EXISTS CAT_CANTONES (
      id INT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      provincia_id INT NOT NULL,
      fecha_creacion DATETIME,
      fecha_actualizacion DATETIME,
      KEY idx_provincia (provincia_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `;

  const createCie10 = `
    CREATE TABLE IF NOT EXISTS CAT_CIE10 (
      id INT AUTO_INCREMENT PRIMARY KEY,
      codigo VARCHAR(10) NOT NULL,
      descripcion TEXT NOT NULL,
      clave VARCHAR(10),
      UNIQUE KEY idx_codigo (codigo)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `;

  const createMedicamentos = `
    CREATE TABLE IF NOT EXISTS CAT_MEDICAMENTOS (
      id INT AUTO_INCREMENT PRIMARY KEY,
      codigo_cum VARCHAR(50),
      nombre_generico TEXT NOT NULL,
      forma_farmaceutica VARCHAR(100),
      concentracion VARCHAR(100),
      stock_minimo INT DEFAULT 0,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `;

  try {
    await sequelize.query(createProvincias);
    console.log('✅ Tabla CAT_PROVINCIAS verificada.');
    await sequelize.query(createCantones);
    console.log('✅ Tabla CAT_CANTONES verificada.');
    await sequelize.query(createCie10);
    console.log('✅ Tabla CAT_CIE10 verificada.');
    await sequelize.query(createMedicamentos);
    console.log('✅ Tabla CAT_MEDICAMENTOS verificada.');
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    throw error;
  }
}

async function procesarArchivo(archivo) {
  const rutaArchivo = path.resolve(__dirname, archivo);
  if (!fs.existsSync(rutaArchivo)) {
    console.error(`❌ Archivo no encontrado: ${rutaArchivo}`);
    return;
  }

  console.log(`📂 Procesando archivo: ${archivo}...`);
  
  const fileStream = fs.createReadStream(rutaArchivo);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let totalLineas = 0;
  let insertados = 0;
  let erroresIgnorados = 0;
  let erroresCriticos = 0;

  let insertHeader = '';

  for await (const line of rl) {
    const lineaTrim = line.trim();
    if (!lineaTrim || lineaTrim.startsWith('--') || lineaTrim.startsWith('/*')) {
      continue;
    }

    // Detectar cabecera INSERT
    if (lineaTrim.toUpperCase().startsWith('INSERT INTO')) {
      insertHeader = lineaTrim;
      // Si la línea termina en VALUES, o VALUES (, es probable que sigan los valores en las siguientes líneas
      // Pero si la línea termina en ); entonces es un insert completo de una línea.
      if (lineaTrim.endsWith(');')) {
         // Es un insert completo, ejecutarlo tal cual
      } else {
         // Es solo la cabecera, guardarla y continuar a la siguiente línea para los valores
         continue;
      }
    }

    let queryToExecute = lineaTrim;

    // Si la línea empieza con ( y tenemos un header, asumimos que es una tupla de valores
    if (insertHeader && lineaTrim.startsWith('(')) {
      // Reemplazar la coma final por punto y coma si existe, para hacer la query válida
      let valuesPart = lineaTrim;
      if (valuesPart.endsWith(',')) {
        valuesPart = valuesPart.slice(0, -1) + ';';
      }
      queryToExecute = `${insertHeader} ${valuesPart}`;
    }

    totalLineas++;
    
    try {
      await sequelize.query(queryToExecute);
      insertados++;
    } catch (error) {
      // Verificar si es error de duplicado
      // MariaDB/MySQL error code 1062 es Duplicate entry
      if (error.original && error.original.code === 'ER_DUP_ENTRY') {
        erroresIgnorados++;
      } else if (error.message.includes('Duplicate entry')) { 
        // Fallback check por mensaje
        erroresIgnorados++;
      } else {
        console.error(`❌ Error en línea ${totalLineas}: ${error.message}`);
        erroresCriticos++;
      }
    }
    
    if (totalLineas % 100 === 0) {
      process.stdout.write(`\rProcesando... ${totalLineas} líneas leídas.`);
    }
  }

  console.log(`\n✅ Finalizado ${archivo}:`);
  console.log(`   - Total líneas procesadas: ${totalLineas}`);
  console.log(`   - Insertados/Ejecutados: ${insertados}`);
  console.log(`   - Duplicados ignorados: ${erroresIgnorados}`);
  console.log(`   - Errores críticos: ${erroresCriticos}`);
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida exitosamente.');

    // Crear tablas si no existen
    await crearTablas();

    // Procesar provincias
    await procesarArchivo('temp_provincias.sql');
    
    // Procesar cantones
    await procesarArchivo('temp_cantones.sql');

    // Procesar CIE10
    await procesarArchivo('temp_cie10.sql');

    // Procesar Medicamentos
    await procesarArchivo('temp_medicamentos_seed.sql');

    console.log('\n🏁 Migración completada.');
  } catch (error) {
    console.error('❌ Error fatal:', error);
  } finally {
    await sequelize.close();
  }
}

main();
