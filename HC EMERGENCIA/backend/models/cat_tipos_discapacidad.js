const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatTiposDiscapacidad = sequelize.define('CatTiposDiscapacidad', {
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
  tableName: 'CAT_TIPOS_DISCAPACIDAD',
  timestamps: false
});

module.exports = CatTiposDiscapacidad;