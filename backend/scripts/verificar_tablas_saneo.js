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
    logging: false
  }
);

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión establecida.');

    const results = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND (TABLE_NAME LIKE '%MEDIC%' OR TABLE_NAME LIKE '%CAT%' OR TABLE_NAME LIKE '%RECETA%')
      ORDER BY TABLE_NAME
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('Tablas encontradas:');
    results.forEach(r => console.log(` - ${r.TABLE_NAME}`));

    // Also check foreign keys for ADMISIONES
    const fks = await sequelize.query(`
      SELECT 
        TABLE_NAME, 
        COLUMN_NAME, 
        CONSTRAINT_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'ADMISIONES'
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('\nForeign Keys en ADMISIONES:');
    fks.forEach(fk => {
        if(fk.REFERENCED_TABLE_NAME)
            console.log(` - ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME} (${fk.CONSTRAINT_NAME})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

run();
