const Usuario = require('./models/usuario');
const Rol = require('./models/rol');
const sequelize = require('./config/database');

sequelize.sync().then(async () => {
  try {
    // Crear un nuevo rol si no existe
    const [rol, created] = await Rol.findOrCreate({
      where: { nombre: 'Administrador' },
      defaults: { descripcion: 'Rol para administradores' }
    });

    const nuevoUsuario = await Usuario.create({
      cedula: '1234567890',
      nombres: 'Admin',
      apellidos: 'User',
      fecha_nacimiento: '1990-01-01',
      sexo: 'Masculino',
      correo: 'admin@example.com',
      contrasena: 'password',
      rol_id: rol.id,
      activo: true
    });

    console.log('Usuario administrador creado correctamente:', nuevoUsuario.toJSON());

  } catch (error) {
    console.error('Error al crear usuario administrador:', error);
  } finally {
    sequelize.close();
  }
});