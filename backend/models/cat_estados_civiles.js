const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatEstadosCiviles = sequelize.define('CatEstadosCiviles', {
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
  tableName: 'CAT_ESTADOS_CIVILES',
  timestamps: false
});

module.exports = CatEstadosCiviles;