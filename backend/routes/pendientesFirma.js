const express = require('express');
const router = express.Router();
const pendientesFirmaController = require('../controllers/pendientesFirmaController');
const validarToken = require('../middlewares/validarToken');

// Obtener atenciones pendientes de firma
router.get('/', validarToken, pendientesFirmaController.getPendientesFirma);

// Obtener atenciones en curso para el dashboard
router.get('/en-curso', validarToken, pendientesFirmaController.getAtencionesEnCurso);

// Obtener datos para pre-llenar formulario 008
router.get('/prellenado/:admisionId', validarToken, pendientesFirmaController.getDatosPrellenado);

module.exports = router;
