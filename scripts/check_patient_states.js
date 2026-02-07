const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

const sequelize = require('../backend/config/database');

const CatEstadoPaciente = sequelize.define('CatEstadoPaciente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'CAT_ESTADO_PACIENTE',
  timestamps: true,
  freezeTableName: true
});

async function listarEstados() {
  try {
    await sequelize.authenticate();
    console.log('Conexión establecida.');
    const estados = await CatEstadoPaciente.findAll();
    console.log('Estados encontrados:');
    estados.forEach(e => console.log(`${e.id}: ${e.nombre}`));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

listarEstados();
