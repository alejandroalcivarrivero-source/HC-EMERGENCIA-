const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatParentescos = sequelize.define('CatParentescos', {
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
  tableName: 'CAT_PARENTESCOS',
  timestamps: false
});

module.exports = CatParentescos;