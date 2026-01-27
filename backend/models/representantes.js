const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Parentesco = require('./cat_parentescos');

const Representantes = sequelize.define('Representantes', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cedula_representante: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellidos_nombres_representante: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parentesco_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Parentesco,
      key: 'id'
    }
  },
  paciente_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  parentesco_representante_id: { // Añadido según la estructura de la DB
    type: DataTypes.INTEGER,
    allowNull: false // Asumiendo NOT NULL de la imagen
  }
}, {
  tableName: 'REPRESENTANTES',
  timestamps: false
});

Representantes.belongsTo(Parentesco, { foreignKey: 'parentesco_representante_id', as: 'Parentesco' });

module.exports = Representantes;