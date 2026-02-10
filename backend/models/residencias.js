const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Provincias = require('./provincia');
const Cantones = require('./canton');
const Parroquias = require('./parroquia');
const Residencias = sequelize.define('Residencias', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  paciente_id: { // Añadir paciente_id aquí y hacerlo nullable
    type: DataTypes.INTEGER,
    allowNull: false, // Coincide con la base de datos (No nulo)
    references: {
      model: 'PACIENTES', // Referencia al nombre de la tabla de Pacientes
      key: 'id'
    }
  },
  pais_residencia: {
    type: DataTypes.STRING,
    allowNull: true // Permitir nulos si no siempre se requiere
  },
  calle_principal: {
    type: DataTypes.STRING,
    allowNull: false
  },
  calle_secundaria: {
    type: DataTypes.STRING,
    allowNull: true
  },
  barrio_residencia: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'barrio_residencia'
  },
  referencia_residencia: {
    type: DataTypes.STRING,
    allowNull: true
  },
  provincia_residencia_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'PROVINCIAS',
      key: 'id'
    }
  },
  canton_residencia_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'CANTONES',
      key: 'id'
    }
  },
  parroquia_residencia_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'PARROQUIAS',
      key: 'id'
    }
  }
}, {
  tableName: 'RESIDENCIAS',
  timestamps: false
});

Residencias.belongsTo(Provincias, { foreignKey: 'provincia_residencia_id', as: 'ResidenciaProvinciaOrigen' });
Residencias.belongsTo(Cantones, { foreignKey: 'canton_residencia_id', as: 'CantonResidenciaOrigen' });
Residencias.belongsTo(Parroquias, { foreignKey: 'parroquia_residencia_id', as: 'ParroquiaResidencia' });

module.exports = Residencias;