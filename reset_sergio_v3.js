const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config({ path: './backend/.env' });

// Configuración directa para LOCALHOST/TUNEL
// Si estás en casa y usas el túnel (npm run tunnel), usa port 3308
// Si tienes la BD local instalada, usa port 3306
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: '127.0.0.1',
    dialect: 'mariadb',
    port: 3308, // Intentamos primero el puerto del túnel SSH común en este proyecto
    logging: false,
    retry: {
      match: [/SequelizeConnectionError/, /SequelizeConnectionRefusedError/, /SequelizeHostNotFoundError/, /SequelizeHostNotReachableError/, /SequelizeInvalidConnectionError/, /SequelizeConnectionTimedOutError/],
      max: 3
    }
  }
);

async function resetUser() {
  try {
    console.log('Intentando conectar a la BD...');
    await sequelize.authenticate();
    console.log('Conexión establecida exitosamente.');

    const Usuario = sequelize.define('usuario', {
      nombres: DataTypes.STRING,
      apellidos: DataTypes.STRING,
      cedula: DataTypes.STRING,
      intentos_fallidos: DataTypes.INTEGER,
      estado_cuenta: DataTypes.STRING,
      ultimo_bloqueo: DataTypes.DATE
    }, {
      tableName: 'usuarios',
      timestamps: false
    });

    // Buscar usuarios que coincidan con 'Sergio'
    console.log('Buscando usuario Sergio...');
    const usuarios = await Usuario.findAll({
      where: {
        nombres: { [Sequelize.Op.like]: '%Sergio%' }
      }
    });

    if (usuarios.length > 0) {
      for (const usuario of usuarios) {
        console.log(`Encontrado: ${usuario.nombres} ${usuario.apellidos} (${usuario.cedula})`);
        
        usuario.intentos_fallidos = 0;
        usuario.estado_cuenta = 'ACTIVO';
        usuario.ultimo_bloqueo = null;
        
        await usuario.save();
        console.log(`✅ Cuenta desbloqueada para ${usuario.nombres}`);
      }
    } else {
      console.log('❌ No se encontró ningún usuario con nombre "Sergio"');
    }

  } catch (error) {
    console.error('Error:', error);
    console.log('\n--- AYUDA DE CONEXIÓN ---');
    console.log('Si obtienes error de conexión, asegúrate de:');
    console.log('1. Si estás en casa: Ejecuta "npm run tunnel" en otra terminal.');
    console.log('2. Si estás en oficina: Cambia el puerto en este script a 3306 y host a 172.16.1.248');
  } finally {
    await sequelize.close();
  }
}

resetUser();
