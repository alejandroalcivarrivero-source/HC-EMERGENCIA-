const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Admision = require('./admisiones');
const Usuario = require('./usuario');

const OrdenImagen = sequelize.define('OrdenImagen', {
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
    }
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuario,
      key: 'id',
      tableName: 'USUARIOS_SISTEMA'
    }
  },
  fechaEmision: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  tipoImagen: {
    type: DataTypes.STRING,
    allowNull: false
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  firmaElectronica: {
    type: DataTypes.TEXT, // Almacenar la firma electrónica (hash o referencia)
    allowNull: false // Será obligatorio en la lógica de negocio
  }
}, {
  timestamps: true,
  tableName: 'ORDENES_IMAGEN'
});

module.exports = OrdenImagen;