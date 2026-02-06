const { sequelize } = require('../config/database');
const { Paciente } = require('../models/pacientes');
const { Admision } = require('../models/admisiones');
const { Op } = require('sequelize');

async function findPatientAndAdmission() {
  try {
    const patientName = 'Pablo Andrés Alcivar Alcivar';
    // Split name for flexible search if needed, but let's try exact first or like
    // Assuming database stores names in parts or full. Let's try to match.
    // Based on typical schemas, we might have primer_nombre, segundo_nombre, etc.
    // Or a full name field? The user provided a full string.
    
    // Let's check the Paciente model definition first? 
    // No, I can't check it easily without reading the file. 
    // I will try to read the file backend/models/pacientes.js first to know the columns.
    // But for now, I'll assume standard columns and if this fails I'll check.
    // Actually, reading the model file is safer.
    
    // I'll just write a script that lists patients matching parts of the name.
    
    console.log(`Searching for patient: ${patientName}`);
    
    // Let's rely on a raw query for flexibility if I don't know the exact columns yet,
    // or I can read the model file in the next step.
    // However, to save turns, I'll read the model file first.
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Wait, better to read the model file first.
