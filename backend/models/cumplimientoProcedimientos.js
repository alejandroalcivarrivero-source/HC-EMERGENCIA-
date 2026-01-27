const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Admision = require('./admisiones');
const CatProcedimientosEmergencia = require('./cat_procedimientos_emergencia');
const Usuario = require('./usuario');

const CumplimientoProcedimientos = sequelize.define('CumplimientoProcedimientos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  admision_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'admision_id',
    references: {
      model: 'ADMISIONES',
      key: 'id'
    }
  },
  procedimiento_cat_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'procedimiento_cat_id',
    references: {
      model: 'CAT_PROCEDIMIENTOS_EMERGENCIA',
      key: 'id'
    }
  },
  usuario_enfermeria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usuario_enfermeria_id',
    references: {
      model: 'USUARIOS_SISTEMA',
      key: 'id'
    }
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'fecha_hora'
  },
  observacion_hallazgo: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'observacion_hallazgo'
  },
  alerta_medica: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    field: 'alerta_medica',
    comment: '0 = Normal, 1 = Requiere valoración médica inmediata'
  },
  observacion_escalamiento: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'observacion_escalamiento',
    comment: 'Observación detallada cuando alerta_medica = 1'
  },
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'ANULADO'),
    allowNull: false,
    defaultValue: 'ACTIVO',
    field: 'estado',
    comment: 'Estado del registro: ACTIVO o ANULADO'
  },
  anulado_por_usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'anulado_por_usuario_id',
    references: {
      model: 'USUARIOS_SISTEMA',
      key: 'id'
    },
    comment: 'ID del usuario que anuló el registro'
  },
  fecha_anulacion: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fecha_anulacion',
    comment: 'Fecha y hora en que se anuló el registro'
  },
  razon_anulacion: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'razon_anulacion',
    comment: 'Motivo por el cual se anuló el registro'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'createdAt'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updatedAt'
  }
}, {
  tableName: 'CUMPLIMIENTO_PROCEDIMIENTOS',
  timestamps: true,
  freezeTableName: true
});

// Las asociaciones están definidas en init-associations.js
// No definir aquí para evitar duplicación

module.exports = CumplimientoProcedimientos;
