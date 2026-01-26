const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Medicamento = sequelize.define('Medicamento', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  unidad_medida: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  fecha_caducidad: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  lote: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  proveedor: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'MEDICAMENTOS',
  timestamps: true // Esto agregará createdAt y updatedAt automáticamente
});

module.exports = Medicamento;