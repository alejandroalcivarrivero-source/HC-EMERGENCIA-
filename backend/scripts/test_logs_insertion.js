const sequelize = require('../config/database');
const LogCorreo = require('../models/LogCorreo');
const LogIntentoCedula = require('../models/LogIntentoCedula');

async function testInsertion() {
  console.log('🧪 Iniciando prueba de inserción en tablas de logs...');
  try {
    // Usar connectWithFallback para asegurar conexión
    if (sequelize.connectWithFallback) {
      await sequelize.connectWithFallback();
    } else {
      await sequelize.authenticate();
    }

    console.log('--- Probando inserción en LOG_INTENTOS_CEDULA ---');
    const intento = await LogIntentoCedula.create({
      cedula: '9999999999',
      tipo_accion: 'TEST_SYNC',
      exitoso: true,
      ip_address: '127.0.0.1'
    });
    console.log('✅ Registro insertado en LOG_INTENTOS_CEDULA:', intento.id);

    console.log('--- Probando inserción en LOG_CORREOS ---');
    const correo = await LogCorreo.create({
      correo_destino: 'test@example.com',
      tipo: 'TEST_SYNC',
      estado: 'ENVIADO',
      cedula_asociada: '9999999999'
    });
    console.log('✅ Registro insertado en LOG_CORREOS:', correo.id);

    console.log('\n--- Limpiando registros de prueba ---');
    await intento.destroy();
    await correo.destroy();
    console.log('✅ Registros de prueba eliminados.');

    console.log('\n🎉 Pruebas completadas exitosamente. El sistema de auditoría está listo.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la prueba de inserción:', error);
    process.exit(1);
  }
}

testInsertion();
