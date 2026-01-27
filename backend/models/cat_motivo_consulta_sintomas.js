const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatMotivoConsultaSintomas = sequelize.define('CatMotivoConsultaSintomas', {
  Codigo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  Motivo_Consulta_Sintoma: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  Categoria: {
    type: DataTypes.STRING,
    allowNull: true
  },
  Codigo_Triaje: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'CAT_MOTIVO_CONSULTA_SINTOMAS',
  timestamps: false
});

module.exports = CatMotivoConsultaSintomas;