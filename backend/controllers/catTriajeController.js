const CatTriaje = require('../models/cat_triaje');

exports.getAllCatTriaje = async (req, res) => {
  try {
    const categorias = await CatTriaje.findAll();
    res.status(200).json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías de triaje:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener categorías de triaje.' });
  }
};