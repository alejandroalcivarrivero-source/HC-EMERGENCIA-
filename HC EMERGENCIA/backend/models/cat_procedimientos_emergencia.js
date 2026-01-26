const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatProcedimientosEmergencia = sequelize.define('CatProcedimientosEmergencia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'CAT_PROCEDIMIENTOS_EMERGENCIA',
  timestamps: false
});

module.exports = CatProcedimientosEmergencia;