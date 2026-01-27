const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatNivelesEducacion = sequelize.define('CatNivelesEducacion', {
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
  tableName: 'CAT_NIVELES_EDUCACION',
  timestamps: false
});

module.exports = CatNivelesEducacion;