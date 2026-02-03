const sequelize = require('../config/database');

async function checkColumns() {
  try {
    const [results, metadata] = await sequelize.query("SHOW COLUMNS FROM ATENCION_EMERGENCIA");
    const columns = results.map(c => c.Field);
    console.log('Columns in ATENCION_EMERGENCIA:', columns);
    
    if (columns.includes('fecha_fallecimiento') && columns.includes('hora_fallecimiento')) {
      console.log('SUCCESS: Fallecimiento columns exist.');
    } else {
      console.log('FAILURE: Fallecimiento columns MISSING.');
    }
  } catch (error) {
    console.error('Error checking columns:', error);
  } finally {
    await sequelize.close();
  }
}

checkColumns();
