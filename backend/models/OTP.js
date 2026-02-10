const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OTP = sequelize.define('OTP', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  codigo: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  proposito: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  expira_en: {
    type: DataTypes.DATE,
    allowNull: false
  },
  utilizado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  creado_en: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'OTP_VERIFICACION',
  timestamps: false
});

module.exports = OTP;
