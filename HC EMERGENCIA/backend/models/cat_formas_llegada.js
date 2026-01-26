const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatFormasLlegada = sequelize.define('CatFormasLlegada', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'CAT_FORMAS_LLEGADA',
  timestamps: false,
  freezeTableName: true
});

module.exports = CatFormasLlegada;