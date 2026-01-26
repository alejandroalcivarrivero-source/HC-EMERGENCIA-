const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatPaisesResidencia = sequelize.define('CatPaisesResidencia', {
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
  tableName: 'CAT_PAISES_RESIDENCIA',
  timestamps: true
});

module.exports = CatPaisesResidencia;