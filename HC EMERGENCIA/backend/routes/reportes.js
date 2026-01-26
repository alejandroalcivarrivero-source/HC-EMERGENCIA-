const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { validarToken } = require('../middlewares/validarToken');


// Ruta para obtener la producción por estado de paciente
router.get('/produccion-por-estado', reportesController.getProduccionPorEstado);

module.exports = router;