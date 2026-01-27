const express = require('express');
const router = express.Router();
const catProcedimientosEmergenciaController = require('../controllers/catProcedimientosEmergenciaController');
const validarToken = require('../middlewares/validarToken'); // Asumiendo que se requiere autenticación

router.get('/', validarToken, catProcedimientosEmergenciaController.getAllProcedimientosEmergencia);

module.exports = router;