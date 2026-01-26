const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Partos = sequelize.define('Partos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha_parto: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'fecha_parto'
  },
  atendido_en_centro_salud: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'atendido_en_centro_salud'
  },
  hora_parto: {
    type: DataTypes.TIME,
    allowNull: true,
    field: 'hora_parto'
  },
  edad_en_horas_al_ingreso: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'edad_en_horas_al_ingreso'
  },
  pacienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'paciente_id'
  }
}, {
  tableName: 'PARTOS',
  timestamps: false
});

module.exports = Partos;