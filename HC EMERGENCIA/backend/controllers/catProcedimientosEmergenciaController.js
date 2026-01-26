const CatProcedimientosEmergencia = require('../models/cat_procedimientos_emergencia');

exports.getAllProcedimientosEmergencia = async (req, res) => {
  try {
    const procedimientos = await CatProcedimientosEmergencia.findAll();
    res.status(200).json(procedimientos);
  } catch (error) {
    console.error('Error al obtener categorías de procedimientos de emergencia:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener categorías de procedimientos de emergencia.' });
  }
};