const path = require('path');
const sequelize = require('./backend/config/database');
const { QueryTypes } = require('sequelize');

async function test() {
  try {
    await sequelize.authenticate();
    const results = await sequelize.query("SELECT id, nombre FROM SISA_EC.ROLES", { type: QueryTypes.SELECT });
    console.log(JSON.stringify(results, null, 2));
    await sequelize.close();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

test();