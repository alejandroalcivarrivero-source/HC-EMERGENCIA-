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
  const { codigo, descripcion, query } = req.query;
  let whereClause = {};

  // Si no se envía ningún parámetro de búsqueda, devolver array vacío
  if (!codigo && !descripcion && !query) {
    return res.status(200).json([]);
  }

  const conditions = [];

  // Búsqueda genérica (input único para código O descripción)
  if (query) {
    const searchTerm = String(query).trim();
    conditions.push({ codigo: { [Op.like]: `%${searchTerm}%` } });
    conditions.push({ descripcion: { [Op.like]: `%${searchTerm}%` } });
  } else {
    // Búsqueda específica por campos (retrocompatibilidad)
    if (codigo) {
      conditions.push({ codigo: { [Op.like]: `%${String(codigo).trim()}%` } });
    }
    if (descripcion) {
      conditions.push({ descripcion: { [Op.like]: `%${String(descripcion).trim()}%` } });
    }
  }

  if (conditions.length === 0) {
    return res.status(200).json([]);
  }

  try {
    const cie10 = await CatCIE10.findAll({
      where: { [Op.or]: conditions },
      limit: 30
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