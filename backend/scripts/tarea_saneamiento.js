const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'SISA_EC',
  process.env.DB_USER || 'TICS',
  process.env.DB_PASSWORD || 'TICS20141',
  {
    host: process.env.DB_HOST || '172.16.1.248',
    port: process.env.DB_PORT || '3306',
    dialect: 'mariadb',
    logging: console.log
  }
);

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión establecida.');

    // 1. Rename MEDICAMENTOS -> CAT_MEDICAMENTOS
    console.log('\n--- 1. Renombrando MEDICAMENTOS ---');
    try {
      const tableExists = await sequelize.query(`
        SELECT TABLE_NAME FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'MEDICAMENTOS'
      `, { type: sequelize.QueryTypes.SELECT });
      
      if (tableExists.length > 0) {
        await sequelize.query('RENAME TABLE MEDICAMENTOS TO CAT_MEDICAMENTOS');
        console.log('✅ Tabla renombrada a CAT_MEDICAMENTOS');
      } else {
        const newTableExists = await sequelize.query(`
            SELECT TABLE_NAME FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CAT_MEDICAMENTOS'
        `, { type: sequelize.QueryTypes.SELECT });
        if (newTableExists.length > 0) {
            console.log('ℹ️ La tabla ya se llama CAT_MEDICAMENTOS');
        } else {
            console.error('❌ No se encontró la tabla MEDICAMENTOS ni CAT_MEDICAMENTOS');
        }
      }
    } catch (e) {
      console.error('Error renombrando:', e.message);
    }

    // 2. Constraints ADMISIONES
    console.log('\n--- 2. Constraints ADMISIONES ---');
    try {
      await sequelize.query(`
        ALTER TABLE ADMISIONES 
        ADD CONSTRAINT fk_adm_forma_llegada 
        FOREIGN KEY (forma_llegada_id) REFERENCES CAT_FORMAS_LLEGADA(id)
      `);
      console.log('✅ FK fk_adm_forma_llegada creada');
    } catch (e) {
      if (e.message.includes('Duplicate') || e.message.includes('already exists')) {
        console.log('ℹ️ FK fk_adm_forma_llegada ya existe');
      } else {
        console.error('❌ Error creando fk_adm_forma_llegada:', e.message);
      }
    }

    try {
      await sequelize.query(`
        ALTER TABLE ADMISIONES 
        ADD CONSTRAINT fk_adm_fuente_info 
        FOREIGN KEY (fuente_informacion_id) REFERENCES CAT_FUENTES_INFORMACION(id)
      `);
      console.log('✅ FK fk_adm_fuente_info creada');
    } catch (e) {
      if (e.message.includes('Duplicate') || e.message.includes('already exists')) {
        console.log('ℹ️ FK fk_adm_fuente_info ya existe');
      } else {
        console.error('❌ Error creando fk_adm_fuente_info:', e.message);
      }
    }

    // 3. RECETA_DETALLE linking
    console.log('\n--- 3. Detalle Recetas y Vinculación ---');
    // Check if RECETA_MEDICA_DETALLES exists, if not create it
    try {
       await sequelize.query(`
        CREATE TABLE IF NOT EXISTS RECETA_MEDICA_DETALLES (
          id INTEGER PRIMARY KEY AUTO_INCREMENT,
          receta_id INTEGER NOT NULL,
          medicamento_id INTEGER NOT NULL,
          cantidad INTEGER,
          dosis VARCHAR(100),
          frecuencia VARCHAR(100),
          duracion VARCHAR(100),
          via_administracion VARCHAR(100),
          observaciones TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_receta_detalle_receta FOREIGN KEY (receta_id) REFERENCES RECETAS_MEDICAS(id) ON DELETE CASCADE,
          CONSTRAINT fk_receta_detalle_medicamento FOREIGN KEY (medicamento_id) REFERENCES CAT_MEDICAMENTOS(id)
        )
      `);
      console.log('✅ Tabla RECETA_MEDICA_DETALLES verificada/creada con FKs');
    } catch (e) {
      console.error('❌ Error gestionando RECETA_MEDICA_DETALLES:', e.message);
    }

  } catch (error) {
    console.error('Error General:', error);
  } finally {
    await sequelize.close();
  }
}

run();
