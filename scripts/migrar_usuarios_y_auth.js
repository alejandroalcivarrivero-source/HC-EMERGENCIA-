const sequelize = require('../backend/config/database');
const { QueryTypes } = require('sequelize');

async function migrar() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa.');

    // 1. Migrar ROLES
    console.log('📦 Migrando ROLES...');
    const roles = [
      { id: 1, nombre: 'Medico' },
      { id: 2, nombre: 'Obstetra' },
      { id: 3, nombre: 'Enfermeria' },
      { id: 4, nombre: 'Estadistico' },
      { id: 5, nombre: 'Administrador' },
      { id: 8, nombre: 'Farmacia' }
    ];

    // Desactivar checks de llaves foráneas temporalmente
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { type: QueryTypes.RAW });

    for (const rol of roles) {
      // Usar INSERT IGNORE o ON DUPLICATE KEY UPDATE
      await sequelize.query(
        `INSERT INTO ROLES (id, nombre) VALUES (:id, :nombre)
         ON DUPLICATE KEY UPDATE nombre = :nombre`,
        {
          replacements: rol,
          type: QueryTypes.INSERT
        }
      );
    }
    console.log('✅ ROLES migrados.');

    // 2. Migrar USUARIOS
    console.log('📦 Migrando USUARIOS...');
    const usuarios = [
      {
        id: 6,
        cedula: '1234567890',
        nombres: 'Admin',
        apellidos: 'User',
        fecha_nacimiento: '1990-01-01',
        sexo: 'Hombre',
        correo: 'estadisticachonetipoc@gmail.com',
        contrasena: '$2a$10$kf38gqby0Wmniw2UdLHx2e7X9wvxupeuevhaai1S99OlG7.pnDol.',
        rol_id: 5,
        activo: 1,
        telefono: null
      },
      {
        id: 7,
        cedula: '1311820987',
        nombres: 'ROXANA',
        apellidos: 'ALCIVAR',
        fecha_nacimiento: '1982-10-21',
        sexo: 'Mujer',
        correo: 'andres.alcivar@13d07.mspz4.gob.ec',
        contrasena: '$2a$10$nTvEJlHbmrbElV/vcaeKoe8xZ/uctIeg3W7j.RgCSy9q8DcsInBNi',
        rol_id: 3,
        activo: 1,
        telefono: null
      },
      {
        id: 8,
        cedula: '1314783083',
        nombres: 'ANDRES ALEJANDRO',
        apellidos: 'ALCIVAR RIVERO',
        fecha_nacimiento: '1994-05-06',
        sexo: 'Hombre',
        correo: 'alejandro_alcivar_rivero@outlook.com',
        contrasena: '$2a$10$.9tWmXWey7BJNxQ6kDeZDupbmAY3htLS/19lhu.pUhxU/5Y1..aZ2',
        rol_id: 1,
        activo: 1,
        telefono: '0986382910'
      }
    ];

    for (const usuario of usuarios) {
      // Verificar si existe para no duplicar error
      const exists = await sequelize.query(
        'SELECT id FROM USUARIOS_SISTEMA WHERE id = :id OR cedula = :cedula',
        {
          replacements: { id: usuario.id, cedula: usuario.cedula },
          type: QueryTypes.SELECT
        }
      );

      if (exists.length > 0) {
        console.log(`⚠️ Usuario ${usuario.cedula} ya existe. Actualizando datos básicos...`);
        // Actualizar datos pero mantener contraseña si ya existe (o actualizarla si queremos forzar la del backup)
        // Aquí forzamos la del backup como pidió el usuario "Extrae e inserta"
        await sequelize.query(
          `UPDATE USUARIOS_SISTEMA SET 
            nombres = :nombres,
            apellidos = :apellidos,
            fecha_nacimiento = :fecha_nacimiento,
            sexo = :sexo,
            correo = :correo,
            contrasena = :contrasena,
            rol_id = :rol_id,
            activo = :activo,
            telefono = :telefono
           WHERE id = :id`,
          {
            replacements: usuario,
            type: QueryTypes.UPDATE
          }
        );
      } else {
        console.log(`✨ Creando usuario ${usuario.cedula}...`);
        await sequelize.query(
          `INSERT INTO USUARIOS_SISTEMA 
            (id, cedula, nombres, apellidos, fecha_nacimiento, sexo, correo, contrasena, rol_id, activo, telefono, fecha_creacion, fecha_actualizacion)
           VALUES 
            (:id, :cedula, :nombres, :apellidos, :fecha_nacimiento, :sexo, :correo, :contrasena, :rol_id, :activo, :telefono, NOW(), NOW())`,
          {
            replacements: usuario,
            type: QueryTypes.INSERT
          }
        );
      }
    }

    // Reactivar checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { type: QueryTypes.RAW });

    console.log('✅ Migración completada exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

migrar();
