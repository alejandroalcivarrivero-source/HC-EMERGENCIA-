const dbConfig = require('./config/database');
const { AtencionEmergencia } = require('./models/atencionEmergencia'); 

// La instancia de Sequelize es el objeto exportado por config/database.js, según app.js (línea 4)
const sequelize = dbConfig; 

async function testStats() {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida con éxito.');

        const count = await AtencionEmergencia.count();
        console.log(`Total de registros en AtencionEmergencia: ${count}`);
        
    } catch (error) {
        console.error('No se pudo conectar o contar registros:', error);
    } finally {
        await sequelize.close();
    }
}

testStats();