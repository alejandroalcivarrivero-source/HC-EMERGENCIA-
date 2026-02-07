const sequelize = require('../config/database');

async function debugView() {
    try {
        console.log("Testing View V_ATENCIONES_PENDIENTES...");
        const [pendientes] = await sequelize.query("SELECT * FROM V_ATENCIONES_PENDIENTES LIMIT 1");
        console.log("Pendientes:", pendientes);

        console.log("Testing View V_ATENCIONES_FIRMADAS...");
        const [firmadas] = await sequelize.query("SELECT * FROM V_ATENCIONES_FIRMADAS LIMIT 1");
        console.log("Firmadas:", firmadas);
    } catch (error) {
        console.error("View failed:", error);
    } finally {
        process.exit();
    }
}

debugView();
