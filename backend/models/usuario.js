const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const Rol = require('./rol');

const Usuario = sequelize.define('Usuario', {
  cedula: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      len: [10, 10],
      isNumeric: true
    }
  },
  nombres: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellidos: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  sexo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  telefono: { // Nuevo campo para el número de teléfono
    type: DataTypes.STRING(20),
    allowNull: true // Puede ser nulo si no es obligatorio
  },
  contrasena: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  intentos_fallidos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  estado_cuenta: {
    type: DataTypes.ENUM('ACTIVO', 'BLOQUEADO'),
    defaultValue: 'ACTIVO',
    allowNull: false
  },
  ultimo_bloqueo: {
    type: DataTypes.DATE,
    allowNull: true
  },
  firma_p12: {
    type: DataTypes.BLOB('long'), // LONGBLOB en MySQL
    allowNull: true
  },
  firma_configurada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  firma_vencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  firma_serial: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'USUARIOS_SISTEMA', // Nuevo nombre de la tabla en mayúsculas
  timestamps: false,
  // Añadir un atributo virtual para nombre_completo
  getterMethods: {
    nombre_completo() {
      return `${this.nombres} ${this.apellidos}`;
    }
  }
});

Usuario.addHook('beforeCreate', async (usuario) => {
  if (usuario.contrasena) {
    const salt = await bcrypt.genSalt(10);
    usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
  }
});

Usuario.prototype.validarContrasena = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.contrasena);
};

Usuario.belongsTo(Rol, { foreignKey: 'rol_id' });

module.exports = Usuario;
