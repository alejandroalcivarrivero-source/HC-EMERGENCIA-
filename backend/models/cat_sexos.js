const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatSexos = sequelize.define('CatSexos', {
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
  tableName: 'CAT_SEXOS',
  timestamps: false
});

module.exports = CatSexos;