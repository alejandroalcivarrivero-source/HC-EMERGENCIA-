const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const AtencionEmergencia = require('./atencionEmergencia');

const DetalleDiagnostico = sequelize.define('DetalleDiagnostico', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  atencionEmergenciaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'atencion_emergencia_id',
    references: {
      model: AtencionEmergencia,
      key: 'id'
    }
  },
  codigoCIE10: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'codigo_cie10'
  },
  tipoDiagnostico: {
    type: DataTypes.ENUM('PRESUNTIVO', 'DEFINITIVO', 'NO APLICA', 'ESTADISTICO'),
    allowNull: false,
    defaultValue: 'PRESUNTIVO',
    field: 'tipo_diagnostico'
  },
  condicion: {
    type: DataTypes.ENUM('Presuntivo', 'Definitivo Inicial', 'Definitivo Inicial por Laboratorio', 'CAUSA EXTERNA', 'NO APLICA', 'PRINCIPAL'),
    allowNull: false,
    defaultValue: 'Presuntivo'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  padreId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'padre_id',
    references: {
      model: 'DETALLE_DIAGNOSTICOS',
      key: 'id'
    }
  },
  esCausaExterna: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'es_causa_externa'
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'usuario_id'
  }
}, {
  timestamps: true,
  tableName: 'DETALLE_DIAGNOSTICOS'
});

// Definición de la relación de auto-referencia para Causa Externa
DetalleDiagnostico.belongsTo(DetalleDiagnostico, { as: 'CausaExternaPadre', foreignKey: 'padreId', onDelete: 'SET NULL' });
DetalleDiagnostico.hasMany(DetalleDiagnostico, { as: 'CausasExternasHijas', foreignKey: 'padreId', onDelete: 'SET NULL' });

module.exports = DetalleDiagnostico;
