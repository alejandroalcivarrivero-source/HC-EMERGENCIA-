const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const CatEstadoPaciente = require('../models/cat_estado_paciente');
const CatTriaje = require('../models/cat_triaje');

async function checkConstants() {
  try {
    const estados = await CatEstadoPaciente.findAll({ attributes: ['id', 'nombre'] });
    console.log('Estados encontrados:', estados.map(e => e.nombre));

    const triajes = await CatTriaje.findAll({ attributes: ['id', 'nombre', 'color'] });
    console.log('Triajes encontrados:', triajes.map(t => `${t.nombre} (${t.color})`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkConstants();
