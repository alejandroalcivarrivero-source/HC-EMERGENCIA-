const { Sequelize, QueryTypes } = require('sequelize');
require('dotenv').config({ path: './backend/.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_MODE === 'TRABAJO' ? process.env.DB_HOST_TRABAJO : process.env.DB_HOST_CASA,
    port: process.env.DB_MODE === 'TRABAJO' ? process.env.DB_PORT : process.env.DB_PORT_CASA,
    dialect: 'mariadb',
    logging: false
  }
);

async function checkUsers() {
  try {
    await sequelize.authenticate();
    console.log('Conexión exitosa a la base de datos.');
    
    const countResult = await sequelize.query("SELECT COUNT(*) as total FROM USUARIOS_SISTEMA", {
        type: QueryTypes.SELECT
    });
    console.log('Total de usuarios en USUARIOS_SISTEMA:', countResult[0].total);
    
    const users = await sequelize.query("SELECT id, cedula, nombres, apellidos, activo FROM USUARIOS_SISTEMA LIMIT 5", {
        type: QueryTypes.SELECT
    });
    console.log('Primeros 5 usuarios:', JSON.stringify(users, null, 2));
    
  } catch (error) {
    console.error('Error al consultar usuarios:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkUsers();
