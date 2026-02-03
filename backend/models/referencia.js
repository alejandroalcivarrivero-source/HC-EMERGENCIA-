const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Admision = require('./admisiones');
const Usuario = require('./usuario');

const Referencia = sequelize.define('Referencia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  admisionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Admision,
      key: 'id'
    }
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuario,
      key: 'id',
      tableName: 'USUARIOS_SISTEMA'
    }
  },
  correlativo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  fechaEmision: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  establecimientoDestino: {
    type: DataTypes.STRING,
    allowNull: false
  },
  servicioDestino: {
    type: DataTypes.STRING,
    allowNull: false
  },
  motivoReferencia: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  resumenCuadroClinico: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  hallazgosRelevantes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  diagnosticoCIE10: {
    type: DataTypes.STRING,
    allowNull: false
  },
  planTratamiento: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  firmaElectronica: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'REFERENCIAS_053'
});

module.exports = Referencia;
