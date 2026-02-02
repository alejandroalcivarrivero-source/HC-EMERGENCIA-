const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const AtencionEmergencia = require('./atencionEmergencia');

const DetalleDiagnostico = sequelize.define('DetalleDiagnostico', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  atencion_emergencia_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: AtencionEmergencia,
      key: 'id'
    }
  },
  codigo_cie10: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  tipo_diagnostico: {
    type: DataTypes.ENUM('PRESUNTIVO', 'DEFINITIVO', 'NO APLICA', 'ESTADISTICO'),
    allowNull: false,
    defaultValue: 'PRESUNTIVO'
  },
  condicion: {
    type: DataTypes.ENUM('Presuntivo', 'Definitivo Inicial', 'Definitivo Inicial por Laboratorio', 'CAUSA EXTERNA', 'NO APLICA'),
    allowNull: false,
    defaultValue: 'Presuntivo'
  },
  padre_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    // La referencia es al nombre de la tabla para evitar problemas de dependencia circular
    references: {
      model: 'DETALLE_DIAGNOSTICOS',
      key: 'id'
    }
  },
  es_causa_externa: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'DETALLE_DIAGNOSTICOS'
});

// Definición de la relación de auto-referencia para Causa Externa
// Esto se hace explícitamente porque la tabla se auto-referencia
DetalleDiagnostico.belongsTo(DetalleDiagnostico, { as: 'CausaExternaPadre', foreignKey: 'padre_id', onDelete: 'SET NULL' });
DetalleDiagnostico.hasMany(DetalleDiagnostico, { as: 'CausasExternasHijas', foreignKey: 'padre_id', onDelete: 'SET NULL' });

module.exports = DetalleDiagnostico;
