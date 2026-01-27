const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConfiguracionAudioTv = sequelize.define('ConfiguracionAudioTv', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clave: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Clave única de configuración'
  },
  valor: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Valor de la configuración'
  },
  descripcion: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Descripción de la configuración'
  }
}, {
  tableName: 'configuracion_audio_tv',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion'
});

module.exports = ConfiguracionAudioTv;
