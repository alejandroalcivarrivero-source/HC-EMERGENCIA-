const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Configuración de conexión dual:
 * Arquitectura:
 * - Oficina: Conexión directa al servidor Debian (172.16.1.248:3306)
 * - Casa: Conexión vía túnel SSH (localhost:3307 -> PC Puente -> 172.16.1.248:3306)
 * 
 * Flujo:
 * 1. Intenta conectar primero a la base de datos de la Oficina (DB_WORK_* -> 172.16.1.248:3306)
 * 2. Si falla, intenta conectarse a la de Casa vía túnel SSH (DB_HOME_* -> localhost:3307)
 */

// Función para crear una instancia de Sequelize con configuración específica
function createSequelizeInstance(config, label) {
  return new Sequelize(
    `${config.dialect}://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`,
    {
      dialect: 'mariadb',
      logging: false,
      freezeTableName: true,
      pool: {
        acquire: 30000,
        idle: 10000,
        max: 5,
        min: 0
      },
      retry: {
        max: 2
      }
    }
  );
}

// Configuración para Oficina (prioridad)
const workConfig = {
  dialect: process.env.DB_WORK_DIALECT || process.env.DB_DIALECT || 'mariadb',
  user: process.env.DB_WORK_USER || process.env.DB_USER,
  password: process.env.DB_WORK_PASSWORD || process.env.DB_PASSWORD,
  host: process.env.DB_WORK_HOST || process.env.DB_HOST,
  port: process.env.DB_WORK_PORT || process.env.DB_PORT || 3306,
  database: process.env.DB_WORK_NAME || process.env.DB_NAME
};

// Configuración para Casa (fallback vía SSH)
const homeConfig = {
  dialect: process.env.DB_HOME_DIALECT || process.env.DB_DIALECT || 'mariadb',
  user: process.env.DB_HOME_USER || process.env.DB_USER,
  password: process.env.DB_HOME_PASSWORD || process.env.DB_PASSWORD,
  host: process.env.DB_HOME_HOST || '127.0.0.1',
  port: process.env.DB_HOME_PORT || '3307',
  database: process.env.DB_HOME_NAME || process.env.DB_NAME
};

// Crear instancia inicial (se creará la correcta durante la autenticación)
let sequelize = createSequelizeInstance(workConfig, 'Oficina');
let currentConnection = 'work';
let connectionEstablished = false;
let connectionPromise = null;

/**
 * Intenta conectar a la base de datos con fallback automático
 * Esta función se ejecuta automáticamente cuando se llama a authenticate()
 */
async function connectWithFallback() {
  // Si ya hay una conexión establecida, retornar la instancia actual
  if (connectionEstablished) {
    return sequelize;
  }

  // Si ya hay una promesa de conexión en curso, esperarla
  if (connectionPromise) {
    return connectionPromise;
  }

  // Crear nueva promesa de conexión
  connectionPromise = (async () => {
    // Intentar conexión a Oficina primero
    try {
      console.log('🔄 Intentando conectar a base de datos de Oficina (172.16.1.248:3306)...');
      // Crear instancia temporal para probar la conexión
      const testSequelize = createSequelizeInstance(workConfig, 'Oficina');
      await testSequelize.authenticate();
      // Si funciona, usar esta instancia
      sequelize = testSequelize;
      console.log('✅ Conexión a la base de datos de Oficina establecida correctamente.');
      console.log('   Servidor: 172.16.1.248:3306 (Servidor Debian)');
      currentConnection = 'work';
      connectionEstablished = true;
      return sequelize;
    } catch (workError) {
      console.log('⚠️  No se pudo conectar a la base de datos de Oficina:', workError.message);
      console.log('🔄 Intentando conectar a base de datos de Casa vía túnel SSH...');
      console.log('   Ruta: localhost:3307 -> PC Puente -> 172.16.1.248:3306');
      
      // Si falla, intentar con Casa
      try {
        // Crear instancia temporal para probar la conexión
        const testSequelize = createSequelizeInstance(homeConfig, 'Casa');
        await testSequelize.authenticate();
        // Si funciona, usar esta instancia
        sequelize = testSequelize;
        console.log('✅ Conexión a la base de datos de Casa establecida correctamente (vía túnel SSH).');
        console.log('   Túnel: localhost:3307 -> 172.16.1.248:3306 (Servidor Debian)');
        currentConnection = 'home';
        connectionEstablished = true;
        return sequelize;
      } catch (homeError) {
        console.error('❌ Error: No se pudo conectar a ninguna base de datos.');
        console.error('   Oficina (172.16.1.248:3306):', workError.message);
        console.error('   Casa (localhost:3307):', homeError.message);
        console.error('💡 Verifica:');
        console.error('   - Que el túnel SSH esté activo si estás en casa:');
        console.error('     ssh -N -L 3307:172.16.1.248:3306 TICS@26.223.87.142');
        console.error('   - Que tengas acceso de red al servidor Debian (172.16.1.248) si estás en oficina');
        console.error('   - Que las variables de entorno estén configuradas correctamente');
        connectionEstablished = false;
        connectionPromise = null;
        throw new Error('No se pudo establecer conexión con ninguna base de datos');
      }
    }
  })();

  return connectionPromise;
}

// Sobrescribir el método authenticate() para usar nuestra lógica de fallback
// Esto permite que app.js llame a sequelize.authenticate() normalmente
sequelize.authenticate = async function() {
  return connectWithFallback();
};

// Función helper para obtener información de la conexión actual
sequelize.getCurrentConnection = () => currentConnection;
sequelize.isWorkConnection = () => currentConnection === 'work';
sequelize.isHomeConnection = () => currentConnection === 'home';

module.exports = sequelize;
