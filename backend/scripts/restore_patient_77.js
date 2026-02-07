const sequelize = require('../config/database');

async function restorePatient() {
  await sequelize.connectWithFallback();
  
  try {
      // 1. Obtener columnas exactas
      const columnsInfo = await sequelize.query('SHOW COLUMNS FROM PACIENTES', { type: sequelize.QueryTypes.SELECT });
      const columnNames = columnsInfo.map(c => c.Field);
      console.log('Columnas en la BD:', columnNames);
      
      // Valores del backup (17 valores)
      const values = [
          77, 
          1, 
          '1314783083', 
          'ALCIVAR', 
          'RIVERO', 
          'ANDRES', 
          'ALEJANDRO', 
          1, 
          1, 
          120, // ?
          1, // ?
          '1994-05-06 00:00:00',
          13, // ?
          137, // ?
          826, // ?
          '2025-07-09 16:30:27', 
          '2026-01-25 19:13:34'
      ];
      
      console.log(`Columnas detectadas: ${columnNames.length}`);
      console.log(`Valores en backup: ${values.length}`);
      
      // Mapeo manual basado en coincidencia de orden hasta la columna 12
      // Columnas BD (12): id, tipo_identificacion_id, numero_identificacion, apellido1, apellido2, nombre1, nombre2, civil, sexo, residencia, nacionalidad, nacimiento
      // Valores (17): 77, 1, 1314.., ALCIVAR, RIVERO, ANDRES, ALEJANDRO, 1, 1, 120, 1, 1994.., (extras...)
      
      const valuesToInsert = values.slice(0, 12); // Tomamos los primeros 12 valores
      
      if (columnNames.length === valuesToInsert.length) {
           const replacementObj = {};
           let queryCols = [];
           let queryVals = [];
           
           columnNames.forEach((col, idx) => {
               queryCols.push(col);
               queryVals.push(`:val${idx}`);
               replacementObj[`val${idx}`] = valuesToInsert[idx];
           });
           
           // Forzar la fecha correcta para SQL (quitar timestamps si existen o asegurar formato)
           // La fecha viene como '1994-05-06 00:00:00', es válida.
           
           const sql = `INSERT INTO PACIENTES (${queryCols.join(', ')}) VALUES (${queryVals.join(', ')})`;
           console.log('Ejecutando SQL:', sql);
           
           await sequelize.query(sql, { replacements: replacementObj });
           console.log('Paciente 77 restaurado exitosamente.');
      } else {
          console.error('Error crítico: Incluso recortando, las columnas no coinciden.');
      }

  } catch (error) {
      console.error('Error al restaurar:', error);
  } finally {
      process.exit();
  }
}

restorePatient();
