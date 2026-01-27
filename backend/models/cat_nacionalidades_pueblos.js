const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatNacionalidadesPueblos = sequelize.define('CatNacionalidadesPueblos', {
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
  tableName: 'CAT_NACIONALIDADES_PUEBLOS',
  timestamps: false
});

module.exports = CatNacionalidadesPueblos;