const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function checkColumns() {
    try {
        const columns = await sequelize.query("SHOW COLUMNS FROM ATENCION_EMERGENCIA", { type: QueryTypes.SELECT });
        console.log("Columns in ATENCION_EMERGENCIA:", columns.map(c => c.Field));
        
        const form008Columns = await sequelize.query("SHOW COLUMNS FROM FORM_008_EMERGENCIA", { type: QueryTypes.SELECT });
        console.log("Columns in FORM_008_EMERGENCIA:", form008Columns.map(c => c.Field));
    } catch (error) {
        console.error("Error checking columns:", error);
    } finally {
        process.exit();
    }
}

checkColumns();
