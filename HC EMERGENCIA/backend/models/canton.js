const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Provincia = require('./provincia');

const Canton = sequelize.define('Canton', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  provincia_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Provincia,
      key: 'id'
    }
  }
}, {
  tableName: 'CAT_CANTONES',
  timestamps: false
});

Canton.belongsTo(Provincia, { foreignKey: 'provincia_id' });

module.exports = Canton;