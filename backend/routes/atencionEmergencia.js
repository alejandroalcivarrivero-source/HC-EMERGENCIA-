const express = require('express');
const router = express.Router();
const atencionEmergenciaController = require('../controllers/atencionEmergenciaController');
const validarToken = require('../middlewares/validarToken');

// Ruta para crear una nueva atención de emergencia
router.post('/', validarToken, atencionEmergenciaController.createAtencionEmergencia);

// Ruta para obtener todas las atenciones de emergencia
router.get('/', validarToken, atencionEmergenciaController.getAllAtencionesEmergencia);

// Ruta para obtener los estados de atención disponibles
router.get('/estados', validarToken, atencionEmergenciaController.getAtencionEstados);

// Ruta para obtener una atención de emergencia por ID de admisión
router.get('/admision/:admisionId', validarToken, atencionEmergenciaController.getAtencionEmergenciaByAdmision);

// Ruta para actualizar una atención de emergencia por ID
router.put('/:id', validarToken, atencionEmergenciaController.updateAtencionEmergencia);

// Ruta para obtener el historial de atenciones de emergencia de un paciente
router.get('/historial/:pacienteId', validarToken, atencionEmergenciaController.getHistorialAtencionesByPaciente);

// Ruta para eliminar una atención de emergencia por ID
router.delete('/:id', validarToken, atencionEmergenciaController.deleteAtencionEmergencia);

module.exports = router;