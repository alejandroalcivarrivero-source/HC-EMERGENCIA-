const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Form008 = sequelize.define('Form008', {
  admisionId: { // Llave foránea a Admision
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Signos Vitales (Persistencia Dual)
  presionSistolica: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  presionDiastolica: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  frecuenciaCardiaca: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  temperatura: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  // Bloque Clínico
  anamnesis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  examenFisico: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  diagnosticoPrincipalCie: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'FORMULARIOS_008',
  timestamps: true,
});

module.exports = Form008;
