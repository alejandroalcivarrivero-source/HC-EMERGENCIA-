const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Token = sequelize.define('TokenRecuperacion', {
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expiracion: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'TOKENS_RECUPERACION',
  timestamps: false
});

module.exports = Token;
