const express = require('express');
const router = express.Router();
const reasignacionController = require('../controllers/reasignacionController');
const validarToken = require('../middlewares/validarToken');

// Reasignar atención a otro médico
router.post('/atencion/:atencionId', validarToken, reasignacionController.reasignarAtencion);

// Obtener historial de reasignaciones
router.get('/historial/:atencionId', validarToken, reasignacionController.getHistorialReasignaciones);

// Obtener médicos disponibles para reasignación
router.get('/medicos', validarToken, reasignacionController.getMedicosDisponibles);

module.exports = router;
