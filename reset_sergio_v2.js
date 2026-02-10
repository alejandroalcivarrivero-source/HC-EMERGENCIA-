const { sequelize } = require('./backend/config/database');
const Usuario = require('./backend/models/usuario');

async function resetUser() {
  try {
    // Access the underlying sequelize instance if it's a proxy, or just use it directly
    // The database.js exports { sequelize, connectDB } where sequelize is a Proxy
    
    console.log('Authenticating...');
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Find user 'Sergio' (case insensitive search just in case)
    const users = await Usuario.findAll();
    const sergio = users.find(u => u.nombres && u.nombres.toLowerCase().includes('sergio'));

    if (sergio) {
      console.log(`User found: ${sergio.nombres} ${sergio.apellidos} (ID: ${sergio.id})`);
      console.log(`Current status - Intentos: ${sergio.intentos_fallidos}, Activo: ${sergio.activo}`);
      
      sergio.intentos_fallidos = 0;
      sergio.activo = true; 
      
      await sergio.save();
      console.log('User reset successfully.');
    } else {
      console.log('User Sergio not found.');
    }

  } catch (error) {
    console.error('Error during operation:', error);
  } finally {
    // Attempt to close safely, checking if close exists
    try {
        if (sequelize && typeof sequelize.close === 'function') {
            await sequelize.close();
            console.log('Connection closed.');
        } else {
            console.log('sequelize.close is not a function or sequelize is undefined. Forcing exit.');
            process.exit(0);
        }
    } catch (e) {
        console.error('Error closing connection:', e);
        process.exit(1);
    }
  }
}

resetUser();
