const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LogReasignacionesMedicas = sequelize.define('LogReasignacionesMedicas', {
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
  medicoAnteriorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'medico_anterior_id'
  },
  medicoNuevoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'medico_nuevo_id'
  },
  motivoReasignacion: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'motivo_reasignacion'
  },
  usuarioReasignadorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usuario_reasignador_id'
  }
}, {
  timestamps: true,
  tableName: 'LOG_REASIGNACIONES_MEDICAS'
});

// Las asociaciones se definen en init-associations.js para evitar dependencias circulares

module.exports = LogReasignacionesMedicas;
