const sequelize = require('../config/database');

async function debugQuery() {
    try {
        console.log("Testing Query...");
        const [results] = await sequelize.query(`
            SELECT 
                ae.id,
                f008.diagnosticosDefinitivos,
                ae.firma_digital_hash
            FROM ATENCION_EMERGENCIA ae
            LEFT JOIN FORM_008_EMERGENCIA f008 ON ae.id = f008.atencionId
            LIMIT 1
        `);
        console.log("Query success:", results);
    } catch (error) {
        console.error("Query failed:", error);
    } finally {
        process.exit();
    }
}

debugQuery();
