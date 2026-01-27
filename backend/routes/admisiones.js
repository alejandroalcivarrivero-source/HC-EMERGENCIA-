const express = require('express');
const router = express.Router();
const admisionesController = require('../controllers/admisionesController');
const validarToken = require('../middlewares/validarToken');

// Ruta para obtener una admisión por ID
// Nueva ruta para obtener todos los estados de paciente (debe ir antes de rutas con parámetros dinámicos)
router.get('/estados-paciente', validarToken, admisionesController.getAllEstadosPaciente);

// Nueva ruta para obtener todas las admisiones
router.get('/', validarToken, admisionesController.getAllAdmisiones);

// Rutas para obtener una admisión por ID y otras operaciones específicas
router.get('/:id', validarToken, admisionesController.getAdmisionById);
router.get('/historial/:pacienteId', validarToken, admisionesController.getHistorialAdmisionesByPaciente);
router.put('/:id/triaje', validarToken, admisionesController.updateTriajeDefinitivoAdmision);
router.put('/:id/incrementar-llamado', validarToken, admisionesController.incrementarIntentosLlamado);
// router.post('/', validarToken, admisionesController.createAdmision); // Comentado para evitar duplicidad con usuariosController

module.exports = router;