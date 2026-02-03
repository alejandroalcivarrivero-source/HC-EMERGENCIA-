const sequelizeProxy = require('../config/database');

async function checkAndAddColumn() {
  try {
    // Force connection establishment with fallback
    const db = await sequelizeProxy.connectWithFallback();
    
    // Check if column exists
    const [results, metadata] = await db.query("SHOW COLUMNS FROM DETALLE_DIAGNOSTICOS LIKE 'descripcion'");
    
    if (results.length > 0) {
      console.log('✅ Column descripcion ALREADY EXISTS');
    } else {
      console.log('⚠️ Column descripcion MISSING. Attempting to add...');
      await db.query("ALTER TABLE DETALLE_DIAGNOSTICOS ADD COLUMN descripcion TEXT DEFAULT NULL");
      console.log('✅ Column descripcion ADDED SUCCESSFULLY');
    }

    // Check orden column
    const [resultsOrden] = await db.query("SHOW COLUMNS FROM DETALLE_DIAGNOSTICOS LIKE 'orden'");
    if (resultsOrden.length > 0) {
        console.log('✅ Column orden ALREADY EXISTS');
    } else {
        console.log('⚠️ Column orden MISSING. Attempting to add...');
        await db.query("ALTER TABLE DETALLE_DIAGNOSTICOS ADD COLUMN orden INT DEFAULT 1");
        console.log('✅ Column orden ADDED SUCCESSFULLY');
    }

  } catch (error) {
    console.error('❌ Error checking/adding column:', error);
  }
}

checkAndAddColumn();
