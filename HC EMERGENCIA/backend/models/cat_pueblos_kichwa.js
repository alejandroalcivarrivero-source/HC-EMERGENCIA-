const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatPueblosKichwa = sequelize.define('CatPueblosKichwa', {
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
  tableName: 'CAT_PUEBLOS_KICHWA',
  timestamps: false
});

module.exports = CatPueblosKichwa;