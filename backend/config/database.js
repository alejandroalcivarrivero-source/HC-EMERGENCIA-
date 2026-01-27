const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuraciones de conexión
const DB_CONFIG = {
  TRABAJO: {
    host: process.env.DB_HOST_TRABAJO || '172.16.1.248',
    port: process.env.DB_PORT || '3306',
    user: process.env.DB_USER || 'TICS',
    password: process.env.DB_PASSWORD || 'TICS20141',
    database: process.env.DB_NAME || 'EMERGENCIA',
    dialect: process.env.DB_DIALECT || 'mariadb'
  },
  CASA: {
    // Modo CASA/TÚNEL: 127.0.0.1:3308 (extremo local del túnel SSH)
    // El túnel mapea 3308 local → 172.16.1.248:3306 en el puente (26.223.87.142)
    host: process.env.DB_HOST_CASA || '127.0.0.1',
    port: process.env.DB_PORT_CASA || '3308',
    user: process.env.DB_USER || 'TICS',
    password: process.env.DB_PASSWORD_CASA || 'TICS20141',
    database: process.env.DB_NAME || 'EMERGENCIA',
    dialect: process.env.DB_DIALECT || 'mariadb'
  }
};

// Función para crear una instancia de Sequelize con configuración específica
function createSequelizeInstance(config) {
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
      dialectOptions: {
        connectTimeout: 5000 // 5 segundos de timeout
      }
    }
  );
}

// Determinar qué configuración usar según el modo
function getConfig() {
  const mode = process.env.DB_MODE || 'AUTO';
  
  if (mode === 'TRABAJO') {
    return DB_CONFIG.TRABAJO;
  } else if (mode === 'CASA') {
    return DB_CONFIG.CASA;
  } else {
    // Modo AUTO: usar TRABAJO por defecto, pero se intentará fallback en app.js
    return DB_CONFIG.TRABAJO;
  }
}

// Crear instancia con la configuración determinada
const config = getConfig();
const sequelize = createSequelizeInstance(config);

// Variable para mantener la referencia a la instancia activa
let activeSequelize = sequelize;

// Función para intentar conectar con fallback automático
async function connectWithFallback() {
  const mode = process.env.DB_MODE || 'AUTO';
  
  if (mode === 'TRABAJO') {
    // Modo TRABAJO: Solo intenta con la IP de trabajo
    const config = DB_CONFIG.TRABAJO;
    const db = createSequelizeInstance(config);
    console.log(`🔌 Intentando conectar a BD TRABAJO: ${config.host}:${config.port}`);
    
    try {
      await db.authenticate();
      console.log(`✅ Conexión establecida con BD TRABAJO (${config.host})`);
      // Actualizar la referencia activa
      activeSequelize = db;
      // Copiar métodos y propiedades importantes a la instancia exportada
      copySequelizeInstance(db, sequelize);
      return db;
    } catch (error) {
      console.error(`❌ Error conectando a BD TRABAJO: ${error.message}`);
      throw error;
    }
  } else if (mode === 'CASA') {
    // Modo CASA: Usa túnel SSH local (localhost:3308)
    const config = DB_CONFIG.CASA;
    const db = createSequelizeInstance(config);
    console.log(`🔌 Intentando conectar a BD CASA (Túnel SSH): ${config.host}:${config.port}`);
    console.log(`⚠️ Asegúrate de que el túnel SSH esté activo (ejecuta: npm run tunnel)`);
    
    try {
      await db.authenticate();
      console.log(`✅ Conexión establecida con BD CASA vía túnel SSH (${config.host}:${config.port})`);
      // Actualizar la referencia activa
      activeSequelize = db;
      // Copiar métodos y propiedades importantes a la instancia exportada
      copySequelizeInstance(db, sequelize);
      return db;
    } catch (error) {
      console.error(`❌ Error conectando a BD CASA: ${error.message}`);
      console.error(`💡 Asegúrate de que el túnel SSH esté activo. Ejecuta: npm run tunnel`);
      throw error;
    }
  } else {
    // Modo AUTO: Intenta primero TRABAJO, luego CASA
    console.log('🔍 Modo AUTO: Detectando mejor conexión...');
    
    // Intentar primero con TRABAJO
    let config = DB_CONFIG.TRABAJO;
    let db = createSequelizeInstance(config);
    console.log(`🔌 Intentando conectar a BD TRABAJO: ${config.host}:${config.port}`);
    
    try {
      await db.authenticate();
      console.log(`✅ Conexión establecida con BD TRABAJO (${config.host})`);
      // Actualizar la referencia activa
      activeSequelize = db;
      // Copiar métodos y propiedades importantes a la instancia exportada
      copySequelizeInstance(db, sequelize);
      return db;
    } catch (error) {
      console.warn(`⚠️ No se pudo conectar a BD TRABAJO: ${error.message}`);
      console.log(`🔄 Intentando con BD CASA (Radmin)...`);
      
      // Si falla, intentar con CASA (túnel SSH)
      config = DB_CONFIG.CASA;
      db = createSequelizeInstance(config);
      console.log(`🔄 Intentando con BD CASA (Túnel SSH): ${config.host}:${config.port}`);
      console.log(`⚠️ Asegúrate de que el túnel SSH esté activo (ejecuta: npm run tunnel)`);
      
      try {
        await db.authenticate();
        console.log(`✅ Conexión establecida con BD CASA vía túnel SSH (${config.host}:${config.port})`);
        // Actualizar la referencia activa
        activeSequelize = db;
        // Copiar métodos y propiedades importantes a la instancia exportada
        copySequelizeInstance(db, sequelize);
        return db;
      } catch (error2) {
        console.error(`❌ Error conectando a BD CASA: ${error2.message}`);
        console.error(`💡 Asegúrate de que el túnel SSH esté activo. Ejecuta: npm run tunnel`);
        throw new Error(`No se pudo conectar a ninguna base de datos. TRABAJO: ${error.message}, CASA: ${error2.message}`);
      }
    }
  }
}

// Función helper para copiar propiedades importantes de una instancia a otra
// NO copiar source.models: los modelos se definen en target; source (db nueva) viene vacía.
function copySequelizeInstance(source, target) {
  // Copiar métodos importantes
  const methods = ['authenticate', 'sync', 'query', 'transaction', 'close', 'getQueryInterface'];
  methods.forEach(method => {
    if (typeof source[method] === 'function') {
      target[method] = source[method].bind(source);
    }
  });
  // Mantener target.models: no sobrescribir con source.models (source está vacía al conectar por fallback)
  if (source.config) {
    target.config = source.config;
  }
}

// Proxy para redirigir llamadas a la instancia activa
const sequelizeProxy = new Proxy(sequelize, {
  get(target, prop) {
    // Los modelos siempre vienen de target: ahí se definen y tienen las asociaciones
    if (prop === 'models') {
      return target.models;
    }
    if (activeSequelize !== target && activeSequelize[prop] !== undefined) {
      const value = activeSequelize[prop];
      return typeof value === 'function' ? value.bind(activeSequelize) : value;
    }
    return target[prop];
  }
});

// Exportar la instancia proxy y la función de conexión
sequelizeProxy.connectWithFallback = connectWithFallback;
module.exports = sequelizeProxy;
