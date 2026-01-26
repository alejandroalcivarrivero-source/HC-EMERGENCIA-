const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatTiposBono = sequelize.define('CatTiposBono', {
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
  tableName: 'CAT_TIPOS_BONO',
  timestamps: false
});

module.exports = CatTiposBono;