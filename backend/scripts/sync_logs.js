const sequelize = require('../config/database');
const LogCorreo = require('../models/LogCorreo');
const LogIntentoCedula = require('../models/LogIntentoCedula');

async function syncEmergencyTables() {
  console.log('🚀 Iniciando sincronización de emergencia para tablas de logs...');
  try {
    // Usar connectWithFallback para asegurar conexión
    if (sequelize.connectWithFallback) {
      await sequelize.connectWithFallback();
    } else {
      await sequelize.authenticate();
    }

    // Sincronizar individualmente las tablas que faltan
    console.log('--- Sincronizando LOG_INTENTOS_CEDULA ---');
    await LogIntentoCedula.sync({ alter: true });
    console.log('✅ Tabla LOG_INTENTOS_CEDULA sincronizada.');

    console.log('--- Sincronizando LOG_CORREOS ---');
    await LogCorreo.sync({ alter: true });
    console.log('✅ Tabla LOG_CORREOS sincronizada.');

    console.log('\n🎉 Sincronización completada exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la sincronización:', error);
    process.exit(1);
  }
}

syncEmergencyTables();
