const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LogIntentoCedula = sequelize.define('LogIntentoCedula', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  cedula: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  tipo_accion: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  exitoso: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  tableName: 'LOG_INTENTOS_CEDULA',
  timestamps: false
});

module.exports = LogIntentoCedula;
