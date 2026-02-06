const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Form008Emergencia = sequelize.define('Form008Emergencia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  atencionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'ATENCION_EMERGENCIA',
      key: 'id'
    }
  },
  motivoAtencion: DataTypes.TEXT,
  antecedentesPatologicos: DataTypes.TEXT,
  enfermedadProblemaActual: DataTypes.TEXT,
  examenFisico: DataTypes.TEXT,
  diagnosticosPresuntivos: DataTypes.TEXT,
  diagnosticosDefinitivos: DataTypes.TEXT,
  planTratamiento: DataTypes.TEXT,
  prescripciones: DataTypes.TEXT,
  procedimientos: DataTypes.TEXT,
  firma_digital_hash: DataTypes.STRING,
  sello_digital: DataTypes.TEXT,
  estado_firma: {
    type: DataTypes.ENUM('BORRADOR', 'PENDIENTE_FIRMA', 'FINALIZADO_FIRMADO'),
    defaultValue: 'BORRADOR'
  },
  usuario_responsable_id: DataTypes.INTEGER
}, {
  tableName: 'FORM_008_EMERGENCIA',
  timestamps: true
});

module.exports = Form008Emergencia;
