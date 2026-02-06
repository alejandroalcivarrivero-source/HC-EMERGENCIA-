const sequelize = require('../config/database');
// const Paciente = require('../models/pacientes'); // Use redefined model below
const Admision = require('../models/admisiones');
const { Op, DataTypes } = require('sequelize');

// Redefine Paciente model to try lowercase table name
const Paciente = sequelize.define('Pacientes', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    primer_nombre: { type: DataTypes.STRING, allowNull: false },
    segundo_nombre: { type: DataTypes.STRING, allowNull: true },
    primer_apellido: { type: DataTypes.STRING, allowNull: false },
    segundo_apellido: { type: DataTypes.STRING, allowNull: true },
    nombres: {
        type: DataTypes.VIRTUAL,
        get() { return `${this.getDataValue('primer_nombre')} ${this.getDataValue('segundo_nombre') || ''}`.trim(); }
    },
    apellidos: {
        type: DataTypes.VIRTUAL,
        get() { return `${this.getDataValue('primer_apellido')} ${this.getDataValue('segundo_apellido') || ''}`.trim(); }
    },
}, {
    tableName: 'pacientes', // TRY LOWERCASE
    timestamps: false
});

async function findPatientAndAdmission() {
  try {
    // Attempt connection
    if (sequelize.connectWithFallback) {
      await sequelize.connectWithFallback();
    } else {
      await sequelize.authenticate();
    }
    console.log('Database connected.');

    const targetName = {
      primer_nombre: 'Pablo',
      segundo_nombre: 'Andrés',
      primer_apellido: 'Alcivar',
      segundo_apellido: 'Alcivar'
    };

    console.log('Searching for patient:', targetName);

    // Find Patient
    const patient = await Paciente.findOne({
      where: {
        primer_nombre: targetName.primer_nombre,
        // Use like or exact match depending on confidence. Exact match for now based on user input.
        [Op.and]: [
          { primer_nombre: targetName.primer_nombre },
          { segundo_nombre: targetName.segundo_nombre },
          { primer_apellido: targetName.primer_apellido },
          { segundo_apellido: targetName.segundo_apellido }
        ]
      }
    });

    if (!patient) {
      console.log('Patient not found with exact match. Trying looser search...');
      const loosePatient = await Paciente.findOne({
        where: {
          primer_nombre: targetName.primer_nombre,
          primer_apellido: targetName.primer_apellido
        }
      });
      
      if (!loosePatient) {
        console.error('Patient not found.');
        return;
      }
      console.log('Patient found (loose match):', loosePatient.id, loosePatient.nombres, loosePatient.apellidos);
      process.exit(1); // Stop if exact match fails to avoid wrong patient, or maybe proceed? User was specific.
      // But let's assume if exact match fails, we shouldn't proceed.
    }

    console.log(`Patient Found: ID ${patient.id} - ${patient.nombres} ${patient.apellidos}`);

    // Find latest Admission
    const admission = await Admision.findOne({
      where: {
        paciente_id: patient.id
      },
      order: [['fecha_creacion', 'DESC']]
    });

    if (!admission) {
      console.log('No admission found for this patient.');
    } else {
      console.log(`Latest Admission Found: ID ${admission.id}`);
      console.log(`Date: ${admission.fecha_creacion}`);
      console.log(`Status (Estado Paciente ID): ${admission.estado_paciente_id}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // await sequelize.close(); // connectionManager close might be tricky with the proxy setup, but let's try
    // process.exit(0);
  }
}

findPatientAndAdmission();
