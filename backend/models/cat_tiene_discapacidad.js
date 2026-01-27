const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatTieneDiscapacidad = sequelize.define('CatTieneDiscapacidad', {
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
  tableName: 'CAT_TIENE_DISCAPACIDAD',
  timestamps: false
});

module.exports = CatTieneDiscapacidad;