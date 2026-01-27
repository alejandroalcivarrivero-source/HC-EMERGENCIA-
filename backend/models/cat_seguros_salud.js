const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatSegurosSalud = sequelize.define('CatSegurosSalud', {
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
  tableName: 'CAT_SEGUROS_SALUD',
  timestamps: false
});

module.exports = CatSegurosSalud;