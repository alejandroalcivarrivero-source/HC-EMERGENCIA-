const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const AtencionEmergencia = require('./atencionEmergencia');

const TemporalGuardado = sequelize.define('TemporalGuardado', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  idAtencion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'idAtencion',
    references: {
      model: AtencionEmergencia,
      key: 'id'
    }
  },
  datos: {
    type: DataTypes.TEXT('long'), // Mapea a LONGTEXT para almacenar el JSON del formulario
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'temporal_guardado'
});

module.exports = TemporalGuardado;
