const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const FuenteInformacion = require('./cat_fuentes_informacion'); // Importar modelo FuenteInformacion
const CatFormasLlegada = require('./cat_formas_llegada'); // Importar CatFormasLlegada
const Usuario = require('./usuario'); // Importar el modelo Usuario
const CatEstadoPaciente = require('./cat_estado_paciente'); // Importar el modelo CatEstadoPaciente
const CatTriaje = require('./cat_triaje'); // Importar el modelo CatTriaje
const CatMotivoConsultaSintomas = require('./cat_motivo_consulta_sintomas'); // Importar el modelo CatMotivoConsultaSintomas
// const ProcedimientoEmergencia = require('./procedimientoEmergencia'); // DEPRECADO - Ya no se usa, se reemplazó por CumplimientoProcedimientos

const Admision = sequelize.define('Admision', { // Cambiar el nombre del modelo a singular
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha_hora_admision: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'fecha_hora_admision'
  },
  forma_llegada_id: { // Añadir esta columna
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'forma_llegada_id',
    references: {
      model: CatFormasLlegada, // Referencia directa al modelo importado
      key: 'id'
    }
  },
  usuarioAdmisionId: {
    type: DataTypes.INTEGER,
    allowNull: true, // El ID del usuario que ingresa la admisión es obligatorio
    field: 'usuario_admision_id'
  },
  fuenteInformacionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'fuente_informacion_id',
    references: {
      model: FuenteInformacion,
      key: 'id'
    }
  },
  institucion_persona_entrega: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'institucion_persona_entrega'
  },
  telefono_entrega: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'telefono_entrega'
  },
  pacienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'paciente_id'
  },
  estado_paciente_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Se permite nulo para la migración, luego se puede cambiar a false
    field: 'estado_paciente_id',
    references: {
      model: CatEstadoPaciente,
      key: 'id'
    }
  },
  // estadoAtencion column does not exist in the database, removed from model
  fecha_hora_retiro: {
    type: DataTypes.DATE,
    allowNull: true, // Puede ser nulo si el paciente no se ha retirado
    field: 'fecha_hora_retiro'
  },
  fecha_hora_fallecimiento: {
    type: DataTypes.DATE,
    allowNull: true, // Puede ser nulo si el paciente no ha fallecido
    field: 'fecha_hora_fallecimiento'
  },
  triajePreliminarId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'triaje_preliminar_id',
    references: {
      model: CatTriaje,
      key: 'id'
    }
  },
  triajeDefinitivoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'triaje_definitivo_id',
    references: {
      model: CatTriaje,
      key: 'id'
    }
  },
  alerta_triaje_activa: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'alerta_triaje_activa'
  },
  fecha_hora_ultima_alerta_triaje: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fecha_hora_ultima_alerta_triaje'
  },
  motivo_consulta_sintoma_id: { // Nuevo campo
    type: DataTypes.INTEGER,
    allowNull: true, // Permitir nulo si no siempre se requiere un motivo de consulta
    field: 'motivo_consulta_sintoma_id',
    references: {
      model: CatMotivoConsultaSintomas,
      key: 'Codigo'
    }
  },
  // motivo_consulta column does not exist in the database, removed from model. Use motivo_consulta_sintoma_id relation.
  fecha_ultima_actividad: {
    type: DataTypes.DATE,
    allowNull: true, // Se actualizará cuando haya actividad
    field: 'fecha_ultima_actividad'
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'fecha_creacion'
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'fecha_actualizacion'
  },
  prioridad_enfermeria: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    field: 'prioridad_enfermeria',
    comment: '0 = Normal, 1 = Requiere valoración médica inmediata'
  },
  observacion_escalamiento: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'observacion_escalamiento',
    comment: 'Observación de enfermería cuando se escala al médico'
  },
  intentos_llamado: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'intentos_llamado',
    comment: 'Número de intentos de llamado al paciente'
  },
  observacion_cierre: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'observacion_cierre',
    comment: 'Observación al cerrar la admisión (alta voluntaria, inactividad, etc.)'
  },
  firmaDigitalHash: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'firma_digital_hash',
    comment: 'Hash de la firma digital de la atención'
  }
}, {
  tableName: 'ADMISIONES', // Mantener el nombre de la tabla en plural
  timestamps: false,
  freezeTableName: true // Evitar que Sequelize pluralice el nombre del modelo
});

Admision.belongsTo(FuenteInformacion, { foreignKey: 'fuenteInformacionId' });
Admision.belongsTo(Usuario, { foreignKey: 'usuarioAdmisionId', as: 'UsuarioAdmision' });
Admision.belongsTo(CatEstadoPaciente, { foreignKey: 'estado_paciente_id', as: 'EstadoPaciente' });
Admision.belongsTo(CatMotivoConsultaSintomas, { foreignKey: 'motivo_consulta_sintoma_id', as: 'MotivoConsultaSintoma', targetKey: 'Codigo' });

module.exports = Admision; // Exportar el modelo con el nuevo nombre
