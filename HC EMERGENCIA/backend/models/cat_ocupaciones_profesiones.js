const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatOcupacionesProfesiones = sequelize.define('CatOcupacionesProfesiones', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'CAT_OCUPACIONES_PROFESIONES',
  timestamps: false
});

module.exports = CatOcupacionesProfesiones;