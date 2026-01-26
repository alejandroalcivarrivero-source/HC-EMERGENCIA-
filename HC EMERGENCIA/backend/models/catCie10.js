const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatCIE10 = sequelize.define('CatCIE10', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  timestamps: false, // No necesitamos createdAt y updatedAt para un catálogo
  tableName: 'CAT_CIE10'
});

module.exports = CatCIE10;