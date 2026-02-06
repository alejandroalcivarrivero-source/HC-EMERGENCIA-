// check_connection.js
// Script simple para verificar la conexión a la base de datos SISA_EC
const path = require('path');
// Cargar dotenv desde el archivo .env real del backend
require('dotenv').config({ path: path.resolve(__dirname, 'backend', '.env') });

const { Sequelize } = require('sequelize');

// Usamos las credenciales cargadas desde .env (o .env.example si el usuario lo usa como .env)
const DB_NAME = process.env.DB_NAME || 'SISA_EC';
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DIALECT = process.env.DB_DIALECT || 'mariadb';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_HOST = process.env.DB_HOST_TRABAJO || 'localhost'; // Usamos DB_HOST_TRABAJO como host principal para la prueba

if (!DB_USER || !DB_PASSWORD) {
    console.error('FALLO: Credenciales de base de datos faltantes en el archivo .env.');
    console.log('Asegúrese de que el archivo .env exista en backend/ y contenga DB_USER y DB_PASSWORD.');
    return;
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    dialect: DB_DIALECT,
    port: DB_PORT,
    logging: false
});

async function checkConnection() {
    try {
        await sequelize.authenticate();
        console.log('CONECTADO A SISA_EC');
        await sequelize.close();
    } catch (error) {
        console.error('FALLO AL CONECTAR A SISA_EC');
        console.error(`Detalles del error (intentando conectar a ${DB_HOST}:${DB_PORT} con DB_NAME=${DB_NAME}):`);
        console.error(error.message);
    }
}

// Advertencia importante para el usuario
console.log(`\n--- ADVERTENCIA ---`);
console.log(`El archivo backend/.env.example ha sido modificado con DB_NAME=${DB_NAME}.`);
console.log(`Para que esta prueba funcione, DEBE haber copiado backend/.env.example a backend/.env y tener las credenciales de BD válidas.`);
console.log(`Este script intentará conectarse usando el host: ${DB_HOST}`);
console.log(`-------------------\n`);

checkConnection();