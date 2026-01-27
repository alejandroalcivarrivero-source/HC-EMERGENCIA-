const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./usuario');

const MultimediaTv = sequelize.define('MultimediaTv', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Título del video'
  },
  url_video: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'URL de YouTube o ruta del archivo local'
  },
  tipo: {
    type: DataTypes.ENUM('youtube', 'local'),
    allowNull: false,
    defaultValue: 'youtube',
    comment: 'Tipo de video: YouTube o archivo local'
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Orden de reproducción'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Si el video está activo en la rotación'
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID del usuario que subió el video',
    references: {
      model: Usuario,
      key: 'id'
    }
  }
}, {
  tableName: 'multimedia_tv',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion'
});

// Asociación con Usuario
MultimediaTv.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

module.exports = MultimediaTv;
