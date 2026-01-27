const Usuario = require('./models/usuario');
const Rol = require('./models/rol');
const sequelize = require('./config/database');

sequelize.sync().then(async () => {
  try {
    // Crear un nuevo rol si no existe
    const [rol, created] = await Rol.findOrCreate({
      where: { nombre: 'Paciente' },
      defaults: { descripcion: 'Rol para pacientes' }
    });

    const nuevoUsuario = await Usuario.create({
      cedula: '1234567890',
      nombres: 'Test',
      apellidos: 'User',
      fecha_nacimiento: '1990-01-01',
      sexo: 'Masculino',
      correo: 'test@example.com',
      contrasena: 'password',
      rol_id: rol.id,
      activo: true
    });

    console.log('Usuario creado correctamente:', nuevoUsuario.toJSON());

    // Asignar rol de administrador al usuario con ID 4
    const usuarioAdmin = await Usuario.findByPk(4);
    if (usuarioAdmin) {
      usuarioAdmin.rol_id = 1; // Rol de administrador
      await usuarioAdmin.save();
      console.log('Rol de administrador asignado correctamente al usuario con ID 4');
    } else {
      console.log('Usuario con ID 4 no encontrado');
    }

  } catch (error) {
    console.error('Error al crear usuario:', error);
  } finally {
    sequelize.close();
  }
});
