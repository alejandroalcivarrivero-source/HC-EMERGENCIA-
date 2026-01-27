const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Parentesco = require('./cat_parentescos');

const ContactosEmergencia = sequelize.define('ContactosEmergencia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_contacto: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parentescoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'parentesco_contacto_id',
    references: {
      model: Parentesco,
      key: 'id'
    }
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'telefono_contacto'
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'direccion_contacto'
  },
  pacienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'paciente_id'
  }
}, {
  tableName: 'CONTACTOS_EMERGENCIA',
  timestamps: false
});

ContactosEmergencia.belongsTo(Parentesco, { foreignKey: 'parentescoId' });

module.exports = ContactosEmergencia;