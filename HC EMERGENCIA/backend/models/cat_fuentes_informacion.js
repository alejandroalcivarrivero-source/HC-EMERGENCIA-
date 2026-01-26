const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatFuentesInformacion = sequelize.define('CatFuentesInformacion', {
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
  tableName: 'CAT_FUENTES_INFORMACION',
  timestamps: false
});

module.exports = CatFuentesInformacion;