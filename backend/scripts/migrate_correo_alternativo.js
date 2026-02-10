const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('Iniciando migración: Añadiendo correo_alternativo...');
    const results = await sequelize.query("SHOW COLUMNS FROM USUARIOS_SISTEMA LIKE 'correo_alternativo'", { type: sequelize.QueryTypes.SELECT });
    
    if (results.length === 0) {
      // Verificar cómo se llama la columna de correo actual
      const columns = await sequelize.query("SHOW COLUMNS FROM USUARIOS_SISTEMA", { type: sequelize.QueryTypes.SELECT });
      console.log('Columnas encontradas:', columns.map(c => c.Field || c.field).join(', '));
      
      const emailColumn = columns.find(c => (c.Field || c.field).toLowerCase() === 'correo' || (c.Field || c.field).toLowerCase() === 'email');
      const emailColName = emailColumn ? (emailColumn.Field || emailColumn.field) : null;

      if (emailColName) {
        await sequelize.query(`ALTER TABLE USUARIOS_SISTEMA ADD COLUMN correo_alternativo VARCHAR(255) NULL AFTER ${emailColName}`, { type: sequelize.QueryTypes.RAW });
        console.log(`✅ Columna correo_alternativo añadida con éxito después de ${emailColName}.`);
      } else {
        await sequelize.query("ALTER TABLE USUARIOS_SISTEMA ADD COLUMN correo_alternativo VARCHAR(255) NULL", { type: sequelize.QueryTypes.RAW });
        console.log('✅ Columna correo_alternativo añadida con éxito (al final).');
      }
    } else {
      console.log('ℹ️ La columna correo_alternativo ya existe.');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

migrate();
