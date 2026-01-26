const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FormasLlegada = sequelize.define('FormasLlegada', {
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
  tableName: 'FORMAS_LLEGADA',
  timestamps: false
});

module.exports = FormasLlegada;