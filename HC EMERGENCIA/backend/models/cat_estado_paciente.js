const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatEstadoPaciente = sequelize.define('CatEstadoPaciente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'CAT_ESTADO_PACIENTE',
  timestamps: true,
  freezeTableName: true
});

module.exports = CatEstadoPaciente;