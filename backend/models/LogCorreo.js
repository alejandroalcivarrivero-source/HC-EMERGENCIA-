const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LogCorreo = sequelize.define('LogCorreo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  correo_destino: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  error_mensaje: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cedula_asociada: {
    type: DataTypes.STRING(10),
    allowNull: true
  }
}, {
  tableName: 'LOG_CORREOS',
  timestamps: false
});

module.exports = LogCorreo;
