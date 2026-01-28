const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetalleDiagnosticos = sequelize.define('DetalleDiagnosticos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  atencionEmergenciaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'atencion_emergencia_id'
  },
  codigoCIE10: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'codigo_cie10'
  },
  tipoDiagnostico: {
    type: DataTypes.ENUM('PRESUNTIVO', 'DEFINITIVO', 'NO APLICA', 'ESTADISTICO'),
    allowNull: false,
    field: 'tipo_diagnostico'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  padreId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'padre_id'
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

// Las asociaciones se definen en init-associations.js para evitar dependencias circulares

module.exports = DetalleDiagnosticos;
