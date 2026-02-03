const sequelize = require('../config/database');

async function checkColumn() {
  try {
    const [results, metadata] = await sequelize.query("SHOW COLUMNS FROM DETALLE_DIAGNOSTICOS LIKE 'descripcion'");
    if (results.length > 0) {
      console.log('Column descripcion EXISTS');
    } else {
      console.log('Column descripcion DOES NOT EXIST');
    }
  } catch (error) {
    console.error('Error checking column:', error);
  } finally {
    await sequelize.close();
  }
}

checkColumn();
