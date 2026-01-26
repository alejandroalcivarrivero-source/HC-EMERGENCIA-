const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatTriaje = sequelize.define('CatTriaje', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  descripcion: { // Nuevo campo para la descripción de los criterios
    type: DataTypes.TEXT,
    allowNull: true // Puede ser nulo si no hay descripción detallada
  }
}, {
  tableName: 'CAT_TRIAJE',
  timestamps: false
});

module.exports = CatTriaje;