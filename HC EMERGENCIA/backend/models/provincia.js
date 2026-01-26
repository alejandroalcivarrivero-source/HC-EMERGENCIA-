const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Provincia = sequelize.define('Provincia', {
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
  tableName: 'CAT_PROVINCIAS',
  timestamps: false
});

module.exports = Provincia;