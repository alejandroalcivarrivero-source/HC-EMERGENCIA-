const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Paciente = require('./pacientes');
const Usuario = require('./usuario');
const CatProcedimientosEmergencia = require('./cat_procedimientos_emergencia'); // Importar el modelo de categoría
const Admision = require('./admisiones'); // Importar el modelo de Admision

const ProcedimientoEmergencia = sequelize.define('ProcedimientoEmergencia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pacienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Paciente,
      key: 'id'
    }
  },
  admisionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'admisiones', // Referencia a la tabla de Admisiones
      key: 'id'
    }
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuario,
      key: 'id'
    }
  },
  nombreProcedimiento: {
    type: DataTypes.STRING,
    allowNull: false
  },
  horaRealizacion: {
    type: DataTypes.DATE,
    allowNull: false
  },
  observacion: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'PROCEDIMIENTOS_EMERGENCIA'
});

// Definir asociaciones
ProcedimientoEmergencia.belongsTo(Paciente, { foreignKey: 'pacienteId', as: 'ProcedimientoPaciente' });
ProcedimientoEmergencia.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'UsuarioProcedimiento' });
ProcedimientoEmergencia.belongsTo(CatProcedimientosEmergencia, { foreignKey: 'nombreProcedimiento', targetKey: 'nombre', as: 'cat_procedimiento_emergencium' });
ProcedimientoEmergencia.belongsTo(Admision, { foreignKey: 'admisionId', as: 'AdmisionParaProcedimiento' });

module.exports = ProcedimientoEmergencia;