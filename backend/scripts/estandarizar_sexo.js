const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function fixSexColumn() {
  try {
    console.log('--- Iniciando estandarización de columna sexo ---');

    // Intentar conectar con fallback automático
    if (typeof sequelize.connectWithFallback === 'function') {
      await sequelize.connectWithFallback();
    } else {
      await sequelize.authenticate();
    }

    // 1. Verificar columnas de la tabla USUARIOS_SISTEMA
    console.log('Verificando columnas en USUARIOS_SISTEMA...');
    const columns = await sequelize.query('SHOW COLUMNS FROM USUARIOS_SISTEMA', { type: QueryTypes.SELECT });
    const columnNames = columns.map(c => c.Field.toLowerCase());
    console.log('Columnas encontradas:', columnNames.join(', '));

    let columnToUpdate = 'sexo';
    if (!columnNames.includes('sexo')) {
        const found = columnNames.find(c => c.includes('sex') || c.includes('gender'));
        if (found) {
            columnToUpdate = found;
            console.log(`Usando columna encontrada: ${columnToUpdate}`);
        } else {
            console.log('No se encontró columna de sexo. Creándola...');
            await sequelize.query('ALTER TABLE USUARIOS_SISTEMA ADD COLUMN sexo VARCHAR(50) AFTER fecha_nacimiento');
        }
    }

    // 2. Normalizar datos existentes
    console.log(`Normalizando datos en USUARIOS_SISTEMA (columna: ${columnToUpdate})...`);
    await sequelize.query(`
      UPDATE USUARIOS_SISTEMA 
      SET ${columnToUpdate} = CASE 
        WHEN ${columnToUpdate} LIKE 'Masc%' OR ${columnToUpdate} = 'Hombre' OR ${columnToUpdate} = 'M' THEN 'Hombre'
        WHEN ${columnToUpdate} LIKE 'Fem%' OR ${columnToUpdate} = 'Mujer' OR ${columnToUpdate} = 'F' THEN 'Mujer'
        ELSE 'Hombre'
      END
    `);

    // 3. Modificar columna a ENUM
    console.log(`Cambiando tipo de columna ${columnToUpdate} a ENUM...`);
    if (columnToUpdate !== 'sexo') {
        await sequelize.query(`ALTER TABLE USUARIOS_SISTEMA CHANGE COLUMN ${columnToUpdate} sexo ENUM('Hombre', 'Mujer') NOT NULL`);
    } else {
        await sequelize.query(`ALTER TABLE USUARIOS_SISTEMA MODIFY COLUMN sexo ENUM('Hombre', 'Mujer') NOT NULL`);
    }

    // 4. Normalizar tabla CAT_SEXOS
    console.log('Limpiando y poblando tabla CAT_SEXOS...');
    try {
        // Deshabilitar temporalmente las claves foráneas si es necesario
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await sequelize.query('DELETE FROM CAT_SEXOS');
        await sequelize.query("INSERT INTO CAT_SEXOS (id, nombre) VALUES (1, 'Hombre'), (2, 'Mujer')");
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (e) {
        console.log('Aviso: No se pudo actualizar CAT_SEXOS:', e.message);
    }

    console.log('--- Estandarización completada exitosamente ---');
    process.exit(0);
  } catch (error) {
    console.error('Error al estandarizar columna sexo:', error);
    process.exit(1);
  }
}

fixSexColumn();
