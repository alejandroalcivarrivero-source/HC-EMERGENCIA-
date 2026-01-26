const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const NacionalidadPueblo = require('./cat_nacionalidades_pueblos');
const PuebloKichwa = require('./cat_pueblos_kichwa');
const NivelEducacion = require('./cat_niveles_educacion'); // Nueva importación
const GradoNivelEducacion = require('./cat_grados_niveles_educacion'); // Cambiado de NivelEducacion
const TipoBono = require('./cat_tipos_bono');
const TipoEmpresaTrabajo = require('./cat_tipos_empresa_trabajo'); // Nuevo import
const TieneDiscapacidad = require('./cat_tiene_discapacidad'); // Nueva importación

const DatosAdicionalesPaciente = sequelize.define('DatosAdicionalesPaciente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'telefono'
  },
  celular: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'celular'
  },
  correo_electronico: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'correo_electronico'
  },
  nacionalidadPuebloId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'nacionalidad_pueblos_id',
    references: {
      model: NacionalidadPueblo,
      key: 'id'
    }
  },
  puebloKichwaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'pueblo_kichwa_id',
    references: {
      model: PuebloKichwa,
      key: 'id'
    }
  },
  nivelEducacionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'nivel_educacion_id',
    references: {
      model: 'cat_niveles_educacion', // Asumiendo que existe una tabla cat_niveles_educacion
      key: 'id'
    }
  },
  gradoNivelEducacionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'grado_nivel_educacion_id',
    references: {
      model: GradoNivelEducacion,
      key: 'id'
    }
  },
  tipoBonoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'tipo_bono_recibe_id',
    references: {
      model: TipoBono,
      key: 'id'
    }
  },
  tipoEmpresaTrabajoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'tipo_empresa_trabajo_id',
    references: {
      model: TipoEmpresaTrabajo,
      key: 'id'
    }
  },
  ocupacionProfesionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'ocupacion_profesion_principal_id',
    references: {
      model: 'cat_ocupaciones_profesiones',
      key: 'id'
    }
  },
  seguroSaludId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'seguro_salud_principal_id',
    references: {
      model: 'cat_seguros_salud',
      key: 'id'
    }
  },
  tieneDiscapacidadId: { // Nuevo campo
    type: DataTypes.INTEGER,
    allowNull: false, // Según la imagen de la DB, es NOT NULL
    field: 'tiene_discapacidad_id',
    references: {
      model: 'cat_tiene_discapacidad', // Nombre de la tabla de catálogo
      key: 'id'
    }
  },
  tipoDiscapacidadId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'tipo_discapacidad_id',
    references: {
      model: 'cat_tipos_discapacidad',
      key: 'id'
    }
  },
  autoidentificacionEtnicaId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Coincide con la base de datos (Sí nulo)
    field: 'autoidentificacion_etnica_id',
    references: {
      model: 'cat_autoidentificacion_etnica',
      key: 'id'
    }
  },
  pacienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'paciente_id'
  }
}, {
  tableName: 'DATOS_ADICIONALES_PACIENTE',
  timestamps: false
});

DatosAdicionalesPaciente.belongsTo(NacionalidadPueblo, { foreignKey: 'nacionalidadPuebloId' });
DatosAdicionalesPaciente.belongsTo(PuebloKichwa, { foreignKey: 'puebloKichwaId' });
DatosAdicionalesPaciente.belongsTo(NivelEducacion, { foreignKey: 'nivelEducacionId', as: 'NivelEducacion' }); // Nueva asociación
DatosAdicionalesPaciente.belongsTo(GradoNivelEducacion, { foreignKey: 'gradoNivelEducacionId' }); // Cambiado
DatosAdicionalesPaciente.belongsTo(TipoBono, { foreignKey: 'tipoBonoId' });
DatosAdicionalesPaciente.belongsTo(TipoEmpresaTrabajo, { foreignKey: 'tipoEmpresaTrabajoId' }); // Nueva asociación
DatosAdicionalesPaciente.belongsTo(TieneDiscapacidad, { foreignKey: 'tieneDiscapacidadId', as: 'TieneDiscapacidad' }); // Nueva asociación

module.exports = DatosAdicionalesPaciente;