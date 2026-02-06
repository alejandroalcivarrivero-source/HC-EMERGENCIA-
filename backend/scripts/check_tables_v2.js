const sequelize = require('../config/database');
const { Sequelize } = require('sequelize');

async function checkTables() {
  try {
    if (sequelize.connectWithFallback) {
      await sequelize.connectWithFallback();
    } else {
      await sequelize.authenticate();
    }

    console.log('Connected DB:', sequelize.config.database);

    // Raw query to avoid Sequelize parsing issues seen earlier
    const [results, metadata] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()");
    console.log('Tables in ' + sequelize.config.database + ':', results.map(r => r.table_name || r.TABLE_NAME));

    // Check if PACIENTES or patients exists
    const hasPacientesUpper = results.some(r => (r.table_name || r.TABLE_NAME) === 'PACIENTES');
    const hasPacientesLower = results.some(r => (r.table_name || r.TABLE_NAME) === 'pacientes');
    
    console.log('Has PACIENTES:', hasPacientesUpper);
    console.log('Has pacientes:', hasPacientesLower);

  } catch (error) {
    console.error('Error:', error);
  } finally {
      process.exit();
  }
}

checkTables();
