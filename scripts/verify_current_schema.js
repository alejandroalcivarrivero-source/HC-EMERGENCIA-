const sequelize = require('../backend/config/database');

async function verifySchema() {
  try {
    await sequelize.authenticate();
    console.log('Connection established successfully.');

    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    console.log('Existing tables:', tables);

    // Check specific tables
    const tableNames = tables.map(t => t.tableName);

    const medicamentosExists = tableNames.includes('MEDICAMENTOS');
    const catMedicamentosExists = tableNames.includes('CAT_MEDICAMENTOS');
    
    console.log(`MEDICAMENTOS exists: ${medicamentosExists}`);
    console.log(`CAT_MEDICAMENTOS exists: ${catMedicamentosExists}`);

    if (medicamentosExists) {
      const columns = await queryInterface.describeTable('MEDICAMENTOS');
      console.log('MEDICAMENTOS columns:', Object.keys(columns));
    }
    
    if (catMedicamentosExists) {
        const columns = await queryInterface.describeTable('CAT_MEDICAMENTOS');
        console.log('CAT_MEDICAMENTOS columns:', Object.keys(columns));
    }

    const detalleDiagnosticosExists = tableNames.includes('DETALLE_DIAGNOSTICOS');
    console.log(`DETALLE_DIAGNOSTICOS exists: ${detalleDiagnosticosExists}`);
    if (detalleDiagnosticosExists) {
        const columns = await queryInterface.describeTable('DETALLE_DIAGNOSTICOS');
        console.log('DETALLE_DIAGNOSTICOS columns:', Object.keys(columns));
    }

    const form008Exists = tableNames.includes('FORMULARIOS_008');
    const form008EmergenciaExists = tableNames.includes('FORM_008_EMERGENCIA');
    console.log(`FORMULARIOS_008 exists: ${form008Exists}`);
    console.log(`FORM_008_EMERGENCIA exists: ${form008EmergenciaExists}`);

    const certificadosFirmaExists = tableNames.includes('CERTIFICADOS_FIRMA');
    console.log(`CERTIFICADOS_FIRMA exists: ${certificadosFirmaExists}`);
    
    if (certificadosFirmaExists) {
        const columns = await queryInterface.describeTable('CERTIFICADOS_FIRMA');
        console.log('CERTIFICADOS_FIRMA columns:', Object.keys(columns));
    }

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

verifySchema();
