const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Paciente = require('./pacientes');
const Admision = require('./admisiones');
const Usuario = require('./usuario');
const TemporalGuardado = require('./temporal_guardado');
const DetalleDiagnostico = require('./DetalleDiagnostico');

const AtencionEmergencia = sequelize.define('AtencionEmergencia', {
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
      model: Admision,
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
  // C. INICIO DE ATENCIÓN
  fechaAtencion: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  horaAtencion: {
    type: DataTypes.STRING(5), // HH:mm
    allowNull: false
  },
  condicionLlegada: {
    type: DataTypes.ENUM('ESTABLE', 'INESTABLE', 'FALLECIDO'),
    allowNull: false
  },
  motivoAtencion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // D. ACCIDENTE, VIOLENCIA, INTOXICACIÓN
  fechaEvento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  horaEvento: {
    type: DataTypes.STRING(5), // HH:mm
    allowNull: true
  },
  lugarEvento: {
    type: DataTypes.STRING,
    allowNull: true
  },
  direccionEvento: {
    type: DataTypes.STRING,
    allowNull: true
  },
  custodiaPolicial: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  notificacion: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  tipoAccidenteViolenciaIntoxicacion: {
    type: DataTypes.TEXT, // Almacenar como JSON string de array de strings
    allowNull: true
  },
  observacionesAccidente: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sugestivoAlientoAlcoholico: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  // E. ANTECEDENTES PATOLÓGICOS PERSONALES Y FAMILIARES
  antecedentesPatologicos: {
    type: DataTypes.TEXT, // Almacenar como JSON string de objeto
    allowNull: true
  },
  // F. ENFERMEDAD O PROBLEMA ACTUAL
  enfermedadProblemaActual: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // H. EXAMEN FÍSICO
//
  examenFisico: {
    type: DataTypes.TEXT, // Almacenar como JSON string de objeto (incluye campos de Glasgow)
    allowNull: true
  },
  // I. EXAMEN FÍSICO DE TRAUMA / CRÍTICO
  examenFisicoTraumaCritico: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // J. EMBARAZO - PARTO
  embarazoParto: {
    type: DataTypes.TEXT, // Almacenar como JSON string de objeto
    allowNull: true
  },
  // K. EXÁMENES COMPLEMENTARIOS
  examenesComplementarios: {
    type: DataTypes.TEXT, // Almacenar como JSON string de array de strings
    allowNull: true
  },
  // L. DIAGNÓSTICOS PRESUNTIVOS
  diagnosticosPresuntivos: {
    type: DataTypes.TEXT, // Almacenar como JSON string de array de objetos {cie: string, descripcion: string}
    allowNull: true
  },
  // M. DIAGNÓSTICOS DEFINITIVOS
  diagnosticosDefinitivos: {
    type: DataTypes.TEXT, // Almacenar como JSON string de array de objetos {cie: string, descripcion: string}
    allowNull: true
  },
  // N. PLAN DE TRATAMIENTO
  planTratamiento: {
    type: DataTypes.TEXT, // Almacenar como JSON string de array de objetos {medicamento: string, via: string, dosis: string, posologia: string, dias: number}
    allowNull: true
  },
  observacionesPlanTratamiento: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // O. CONDICIÓN AL EGRESO DE EMERGENCIA
  condicionEgreso: {
    type: DataTypes.ENUM('HOSPITALIZACION', 'ALTA', 'ESTABLE', 'INESTABLE', 'FALLECIDO', 'ALTA_DEFINITIVA', 'CONSULTA_EXTERNA', 'OBSERVACION_EMERGENCIA'),
    allowNull: true
  },
  referenciaEgreso: {
    type: DataTypes.STRING,
    allowNull: true
  },
  establecimientoEgreso: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fecha_fallecimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  hora_fallecimiento: {
    type: DataTypes.STRING(5),
    allowNull: true
  },
  // Campos adicionales para gestión de firma y responsabilidad
  estadoFirma: {
    type: DataTypes.ENUM('BORRADOR', 'PENDIENTE_FIRMA', 'FINALIZADO_FIRMADO'),
    allowNull: false,
    defaultValue: 'BORRADOR',
    field: 'estado_firma'
  },
  selloDigital: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'sello_digital',
    comment: 'JSON del sello: {nombre, ci, entidadEmisora, fechaFirma, digestBase64, algoritmo}'
  },
  usuarioResponsableId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'usuario_responsable_id',
    references: {
      model: Usuario,
      key: 'id'
    }
  },
  esValida: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'es_valida'
  }
}, {
  timestamps: true,
  tableName: 'ATENCION_EMERGENCIA'
});

// Definición de asociaciones:
// Aunque el comentario dice que se definen en init-associations.js, las definimos aquí para garantizar
// que los modelos cargados en el controlador tengan las relaciones listas.
AtencionEmergencia.hasOne(TemporalGuardado, { foreignKey: 'idAtencion', as: 'borrador' });
TemporalGuardado.belongsTo(AtencionEmergencia, { foreignKey: 'idAtencion' });

// AtencionEmergencia.hasMany(DetalleDiagnostico, { foreignKey: 'atencion_emergencia_id', as: 'diagnosticos' });
// DetalleDiagnostico.belongsTo(AtencionEmergencia, { foreignKey: 'atencion_emergencia_id' });

module.exports = AtencionEmergencia;