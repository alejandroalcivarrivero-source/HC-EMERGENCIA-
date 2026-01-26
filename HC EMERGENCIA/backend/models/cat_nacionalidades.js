const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatNacionalidades = sequelize.define('CatNacionalidades', {
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
  tableName: 'CAT_NACIONALIDADES',
  timestamps: false
});

module.exports = CatNacionalidades;