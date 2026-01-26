const Provincia = require('../models/provincia');
const Canton = require('../models/canton');
const Parroquia = require('../models/parroquia');
const CatPaisesResidencia = require('../models/cat_paises_residencia');

const obtenerProvincias = async (req, res) => {
  try {
    const provincias = await Provincia.findAll();
    res.json(provincias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las provincias' });
  }
};

const obtenerCantones = async (req, res) => {
  const { provinciaId } = req.params;
  try {
    const cantones = await Canton.findAll({
      where: {
        provincia_id: provinciaId
      }
    });
    res.json(cantones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los cantones' });
  }
};

const obtenerParroquias = async (req, res) => {
  const { cantonId } = req.params;
  try {
    const parroquias = await Parroquia.findAll({
      where: {
        canton_id: cantonId
      }
    });
    res.json(parroquias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las parroquias' });
  }
};

const obtenerPaisesResidencia = async (req, res) => {
  try {
    const paises = await CatPaisesResidencia.findAll();
    res.json(paises);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los países de residencia' });
  }
};

module.exports = {
  obtenerProvincias,
  obtenerCantones,
  obtenerParroquias,
  obtenerPaisesResidencia
};