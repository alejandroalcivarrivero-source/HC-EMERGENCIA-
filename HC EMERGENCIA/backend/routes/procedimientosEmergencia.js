const express = require('express');
const router = express.Router();
const procedimientosEmergenciaController = require('../controllers/procedimientosEmergenciaController');
const validarToken = require('../middlewares/validarToken');

// Ruta para crear un nuevo procedimiento de emergencia
router.post('/', validarToken, procedimientosEmergenciaController.createProcedimientoEmergencia);

// Ruta para obtener reporte de producción con control de acceso (RBAC)
router.get('/reportes/produccion', validarToken, procedimientosEmergenciaController.getReporteProduccion);

// Ruta para obtener todos los procedimientos de emergencia de un paciente
router.get('/:pacienteId', validarToken, procedimientosEmergenciaController.getProcedimientosByPaciente);

// Ruta para actualizar un procedimiento de emergencia
router.put('/:id', validarToken, procedimientosEmergenciaController.updateProcedimientoEmergencia);

// Ruta para eliminar un procedimiento de emergencia
router.delete('/:id', validarToken, procedimientosEmergenciaController.deleteProcedimientoEmergencia);

module.exports = router;