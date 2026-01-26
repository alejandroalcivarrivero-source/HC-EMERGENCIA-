const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Importar modelos asociados
const DatosAdicionalesPaciente = require('./datos_adicionales_paciente');
const ContactoEmergencia = require('./contactos_emergencia');
const Representante = require('./representantes');
const Admision = require('./admisiones');
const Parto = require('./partos');
const Residencia = require('./residencias'); // Importar el modelo Residencia
const TipoIdentificacion = require('./cat_tipos_identificacion');
const Nacionalidad = require('./cat_nacionalidades');
const EstadoCivil = require('./cat_estados_civiles');
const Sexo = require('./cat_sexos');
const GradoNivelEducacion = require('./cat_grados_niveles_educacion');
const OcupacionProfesion = require('./cat_ocupaciones_profesiones');
const SeguroSalud = require('./cat_seguros_salud');
const TipoDiscapacidad = require('./cat_tipos_discapacidad');
const AutoidentificacionEtnica = require('./cat_autoidentificacion_etnica');

const Pacientes = sequelize.define('Pacientes', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  primer_apellido: {
    type: DataTypes.STRING,
    allowNull: false
  },
  segundo_apellido: {
    type: DataTypes.STRING,
    allowNull: true
  },
  primer_nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  segundo_nombre: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Campos virtuales para nombres y apellidos completos
  nombres: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.getDataValue('primer_nombre')} ${this.getDataValue('segundo_nombre') || ''}`.trim();
    }
  },
  apellidos: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.getDataValue('primer_apellido')} ${this.getDataValue('segundo_apellido') || ''}`.trim();
    }
  },
  numero_identificacion: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY, // Cambiado a DATEONLY para guardar solo la fecha
    allowNull: false
  },
  provincia_nacimiento_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Puede ser nulo si no es de Ecuador o no se especifica
    references: {
      model: 'Provincias', // Referencia al nombre de la tabla de Provincias
      key: 'id'
    }
  },
  canton_nacimiento_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Puede ser nulo
    references: {
      model: 'Cantones', // Referencia al nombre de la tabla de Cantones
      key: 'id'
    }
  },
  parroquia_nacimiento_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Puede ser nulo
    references: {
      model: 'Parroquias', // Referencia al nombre de la tabla de Parroquias
      key: 'id'
    }
  },
  tipoIdentificacionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'tipo_identificacion_id'
  },
  nacionalidadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'nacionalidad_id'
  },
  estadoCivilId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'estado_civil_id'
  },
  sexoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sexo_id'
  },
  residencia_id: { // Nuevo campo para la relación con Residencias
    type: DataTypes.INTEGER,
    allowNull: true, // Permitir nulo inicialmente, se actualizará después de crear la residencia
    references: {
      model: 'RESIDENCIAS', // Nombre de la tabla de Residencias
      key: 'id'
    }
  }
}, {
  tableName: 'PACIENTES',
  timestamps: false
});

// Definir asociaciones
Pacientes.hasOne(Residencia, { foreignKey: 'paciente_id', as: 'Residencia' }); // Cambiado el alias a 'Residencia'

module.exports = Pacientes;