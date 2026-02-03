const sequelizeProxy = require('../config/database');

async function fixColumns() {
  try {
    const db = await sequelizeProxy.connectWithFallback();
    
    console.log('Attempting to add descripcion column...');
    try {
        await db.query("ALTER TABLE DETALLE_DIAGNOSTICOS ADD COLUMN descripcion TEXT DEFAULT NULL");
        console.log('✅ descripcion added.');
    } catch (e) {
        if (e.original && e.original.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ descripcion column already exists.');
        } else {
            console.error('❌ Error adding descripcion:', e.message);
        }
    }

    console.log('Attempting to add orden column...');
    try {
        await db.query("ALTER TABLE DETALLE_DIAGNOSTICOS ADD COLUMN orden INT DEFAULT 1");
        console.log('✅ orden added.');
    } catch (e) {
        if (e.original && e.original.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ orden column already exists.');
        } else {
            console.error('❌ Error adding orden:', e.message);
        }
    }

  } catch (error) {
    console.error('❌ General Error:', error);
  }
}

fixColumns();
