const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatGradosNivelesEducacion = sequelize.define('CatGradosNivelesEducacion', {
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
  tableName: 'CAT_GRADOS_NIVELES_EDUCACION',
  timestamps: false
});

module.exports = CatGradosNivelesEducacion;