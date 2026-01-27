const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatTiposIdentificacion = sequelize.define('CatTiposIdentificacion', {
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
  tableName: 'CAT_TIPOS_IDENTIFICACION',
  timestamps: false
});

module.exports = CatTiposIdentificacion;