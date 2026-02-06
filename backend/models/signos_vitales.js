const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SignosVitales = sequelize.define('SignosVitales', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sin_constantes_vitales: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  temperatura: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true, // Puede ser nulo si sin_constantes_vitales es true
  },
  presion_arterial: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  presion_sistolica: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  presion_diastolica: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  frecuencia_cardiaca: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  frecuencia_respiratoria: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  saturacion_oxigeno: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  perimetro_cefalico: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  peso: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  talla: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  glicemia_capilar: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  glasgow_ocular: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  glasgow_verbal: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  glasgow_motora: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fecha_hora_registro: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  admisionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'admisiones', // Nombre de la tabla
      key: 'id',
    },
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Puede ser nulo si no es obligatorio, pero se recomienda que no lo sea
    references: {
      model: 'USUARIOS_SISTEMA', // Nombre de la tabla de usuarios
      key: 'id',
    },
  },
}, {
  tableName: 'SIGNOS_VITALES',
  timestamps: true,
});

module.exports = SignosVitales;