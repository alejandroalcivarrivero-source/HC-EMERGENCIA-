const CatCIE10 = require('../models/catCie10');
const { Op } = require('sequelize');

exports.getAllCIE10 = async (req, res) => {
  try {
    const cie10 = await CatCIE10.findAll();
    res.status(200).json(cie10);
  } catch (error) {
    console.error('Error al obtener el catálogo CIE10:', error);
    res.status(500).json({ message: 'Error al obtener el catálogo CIE10.' });
  }
};

exports.searchCIE10 = async (req, res) => {
  const { query } = req.query;
  try {
    const cie10 = await CatCIE10.findAll({
      where: {
        [Op.or]: [
          { codigo: { [Op.iLike]: `%${query}%` } },
          { descripcion: { [Op.iLike]: `%${query}%` } }
        ]
      },
      limit: 20 // Limitar resultados para búsquedas
    });
    res.status(200).json(cie10);
  } catch (error) {
    console.error('Error al buscar en el catálogo CIE10:', error);
    res.status(500).json({ message: 'Error al buscar en el catálogo CIE10.' });
  }
};

exports.getCIE10ById = async (req, res) => {
  const { id } = req.params;
  try {
    const cie10 = await CatCIE10.findByPk(id);
    if (!cie10) {
      return res.status(404).json({ message: 'Código CIE10 no encontrado.' });
    }
    res.status(200).json(cie10);
  } catch (error) {
    console.error('Error al obtener CIE10 por ID:', error);
    res.status(500).json({ message: 'Error al obtener CIE10 por ID.' });
  }
};