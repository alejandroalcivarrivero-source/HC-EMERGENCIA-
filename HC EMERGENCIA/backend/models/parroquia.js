const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Canton = require('./canton');

const Parroquia = sequelize.define('Parroquia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  canton_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Canton,
      key: 'id'
    }
  }
}, {
  tableName: 'CAT_PARROQUIAS',
  timestamps: false
});

Parroquia.belongsTo(Canton, { foreignKey: 'canton_id' });

module.exports = Parroquia;