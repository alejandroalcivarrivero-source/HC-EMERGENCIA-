const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatAutoidentificacionEtnica = sequelize.define('CatAutoidentificacionEtnica', {
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
  tableName: 'CAT_AUTOIDENTIFICACION_ETNICA',
  timestamps: false
});

module.exports = CatAutoidentificacionEtnica;