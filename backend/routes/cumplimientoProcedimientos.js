const express = require('express');
const router = express.Router();
const cumplimientoProcedimientosController = require('../controllers/cumplimientoProcedimientosController');
const validarToken = require('../middlewares/validarToken');

// Todas las rutas requieren autenticación
router.use(validarToken);

// Crear un nuevo cumplimiento de procedimiento
router.post('/', cumplimientoProcedimientosController.createCumplimientoProcedimiento);

// Obtener cumplimientos por admisión
router.get('/admision/:admisionId', cumplimientoProcedimientosController.getCumplimientosByAdmision);

// Obtener cumplimientos por paciente (historial completo)
router.get('/paciente/:pacienteId', cumplimientoProcedimientosController.getCumplimientosByPaciente);

// Anular un cumplimiento (NO eliminar, marcar como anulado)
router.put('/:id/anular', cumplimientoProcedimientosController.anularCumplimientoProcedimiento);

module.exports = router;
