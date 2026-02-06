const sequelize = require('../config/database');
const Usuario = require('../models/usuario');
const Rol = require('../models/rol');
const bcrypt = require('bcryptjs');

async function testAuth() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida.');

    console.log('🧪 Iniciando prueba de autenticación y migración...');

    // 0. Verificar Migración (Roles y Usuarios)
    const rolesCount = await Rol.count();
    console.log(`📊 Roles en BD: ${rolesCount}`);
    if (rolesCount === 0) console.warn('⚠️ ALERTA: No se encontraron roles. ¿Corriste la migración?');

    const adminUser = await Usuario.findOne({ where: { cedula: '1234567890' } });
    if (adminUser) {
        console.log('✅ Usuario Admin migrado encontrado.');
    } else {
        console.warn('⚠️ ALERTA: Usuario Admin (migración) no encontrado.');
    }

    // 1. Crear usuario de prueba
    const testUser = {
      cedula: '9999999999',
      nombres: 'Test',
      apellidos: 'User',
      fecha_nacimiento: '2000-01-01',
      sexo: 'Hombre',
      correo: 'test@example.com',
      contrasena: 'password123', // Contraseña plana
      rol_id: 1, // Médico
      activo: true
    };

    // Asegurar limpieza previa
    await Usuario.destroy({ where: { cedula: testUser.cedula } });

    // Crear usando el modelo (esto disparará el hook de encriptación)
    console.log('👤 Creando usuario de prueba...');
    await Usuario.create(testUser);

    // 2. Intentar Login
    console.log('🔑 Intentando login...');
    // Simulamos la petición POST a /api/auth/login (ajusta la ruta según tus rutas reales)
    // Como no podemos usar supertest fácilmente sin levantar el servidor o si app no está exportada correctamente,
    // usaremos la lógica directa del controlador si es necesario, o axios si el server estuviera corriendo.
    // Pero aquí haremos una prueba "unitaria" de la lógica de validación.

    const usuarioEncontrado = await Usuario.findOne({ where: { cedula: testUser.cedula } });
    
    if (!usuarioEncontrado) {
      throw new Error('Usuario no encontrado en BD');
    }

    console.log('✅ Usuario encontrado en BD.');

    // Verificar contraseña
    const esValida = await usuarioEncontrado.validarContrasena(testUser.contrasena);
    
    if (esValida) {
      console.log('✅ Validación de contraseña exitosa (Bcrypt funciona).');
    } else {
      throw new Error('❌ Falló la validación de contraseña.');
    }

    // Verificar Rol
    if (usuarioEncontrado.rol_id === 1) {
      console.log('✅ Rol de usuario correcto (1 - Médico).');
    } else {
      console.error(`❌ Rol incorrecto. Esperado 1, obtenido ${usuarioEncontrado.rol_id}`);
    }

    // 3. Limpieza
    console.log('🧹 Limpiando usuario de prueba...');
    await Usuario.destroy({ where: { cedula: testUser.cedula } });

    console.log('🎉 Prueba de autenticación completada con éxito.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    process.exit(1);
  }
}

testAuth();
