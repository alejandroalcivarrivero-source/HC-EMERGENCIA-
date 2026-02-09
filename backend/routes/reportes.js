const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const validarToken = require('../middlewares/validarToken');
const verifyRole = require('../middlewares/verifyRole');


// Ruta para obtener la producción por estado de paciente (Accesible para Admin 5 y TI 6)
router.get('/produccion-por-estado', validarToken, verifyRole([5, 6]), reportesController.getProduccionPorEstado);

module.exports = router;