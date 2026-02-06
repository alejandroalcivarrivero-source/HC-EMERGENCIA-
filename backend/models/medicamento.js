const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Medicamento = sequelize.define('Medicamento', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  codigo_cum: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  nombre_generico: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  forma_farmaceutica: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  concentracion: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  stock_minimo: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'CAT_MEDICAMENTOS',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion'
});

module.exports = Medicamento;
