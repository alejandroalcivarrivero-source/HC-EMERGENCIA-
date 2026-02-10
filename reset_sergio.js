const { sequelize } = require('./backend/config/database');
const Usuario = require('./backend/models/usuario');

async function resetUser() {
  try {
    // Force connection explicitly if needed, but usually authenticating is enough
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Find user 'Sergio' (case insensitive search just in case)
    const users = await Usuario.findAll();
    const sergio = users.find(u => u.nombres && u.nombres.toLowerCase().includes('sergio'));

    if (sergio) {
      console.log(`User found: ${sergio.nombres} ${sergio.apellidos} (ID: ${sergio.id})`);
      console.log(`Current status - Intentos: ${sergio.intentos_fallidos}, Activo: ${sergio.activo}`);
      
      sergio.intentos_fallidos = 0;
      sergio.activo = true; // Sequelize might expect boolean or 1 depending on definition
      
      await sergio.save();
      console.log('User reset successfully.');
    } else {
      console.log('User Sergio not found.');
    }

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

resetUser();
