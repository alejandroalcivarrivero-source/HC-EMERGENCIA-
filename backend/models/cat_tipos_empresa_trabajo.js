const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatTiposEmpresaTrabajo = sequelize.define('CatTiposEmpresaTrabajo', {
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
  tableName: 'CAT_TIPOS_EMPRESA_TRABAJO',
  timestamps: false
});

module.exports = CatTiposEmpresaTrabajo;