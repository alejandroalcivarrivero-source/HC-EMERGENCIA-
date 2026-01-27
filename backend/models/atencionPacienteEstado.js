const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Admision = require('./admisiones');
const Usuario = require('./usuario');
const CatEstadoPaciente = require('./cat_estado_paciente'); // Importar el modelo CatEstadoPaciente
const Rol = require('./rol');

const AtencionPacienteEstado = sequelize.define('AtencionPacienteEstado', {
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
    },
    // unique: true, // Se elimina la restricción unique para permitir historial de estados
  },
  estado_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'estado_id',
    references: {
      model: CatEstadoPaciente,
      key: 'id'
    }
  },
  usuarioResponsableId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Puede ser nulo si no hay usuario asignado
    field: 'usuario_responsable_id',
    references: {
      model: Usuario,
      key: 'id'
    }
  },
  fechaAsignacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fechaFinAtencion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usuario_id',
    references: {
      model: Usuario,
      key: 'id'
    }
  },
  rolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'rol_id',
    references: {
      model: Rol,
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'ATENCION_PACIENTE_ESTADO'
});

AtencionPacienteEstado.belongsTo(Admision, { foreignKey: 'admisionId', as: 'Admision' });
AtencionPacienteEstado.belongsTo(Usuario, { foreignKey: 'usuarioResponsableId', as: 'UsuarioResponsableEstado' });
AtencionPacienteEstado.belongsTo(CatEstadoPaciente, { foreignKey: 'estado_id', as: 'Estado' });
AtencionPacienteEstado.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'Usuario' });
AtencionPacienteEstado.belongsTo(Rol, { foreignKey: 'rolId', as: 'Rol' });

module.exports = AtencionPacienteEstado;