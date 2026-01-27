const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./usuario');

const CertificadoFirma = sequelize.define('CertificadoFirma', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'usuario_id',
    references: { model: Usuario, key: 'id' }
  },
  p12Cifrado: {
    type: DataTypes.BLOB('long'),
    allowNull: false,
    field: 'p12_cifrado'
  },
  iv: {
    type: DataTypes.BLOB,
    allowNull: false,
    comment: 'Vector de inicialización AES-256-GCM'
  },
  algoritmoCifrado: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'aes-256-gcm',
    field: 'algoritmo_cifrado'
  },
  nombreTitular: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'nombre_titular'
  },
  ciTitular: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'ci_titular'
  },
  entidadEmisora: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'entidad_emisora'
  },
  fechaExpiracion: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'fecha_expiracion'
  }
}, {
  tableName: 'CERTIFICADOS_FIRMA',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

CertificadoFirma.belongsTo(Usuario, { foreignKey: 'usuarioId' });
Usuario.hasOne(CertificadoFirma, { foreignKey: 'usuarioId' });

module.exports = CertificadoFirma;
