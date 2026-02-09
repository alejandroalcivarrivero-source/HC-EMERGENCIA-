const express = require('express');
const router = express.Router();
const soporteController = require('../controllers/soporteController');
const validarToken = require('../middlewares/validarToken');
const verifyRole = require('../middlewares/verifyRole');

// Todas las rutas de soporte requieren token y ser Soporte TI (Rol 6)
router.use(validarToken);
router.use(verifyRole(6));

router.get('/stats', soporteController.getStats);
router.get('/logs-correos', soporteController.getLogsCorreos);
router.get('/intentos-cedula', soporteController.getIntentosCedula);
router.post('/test-correo', soporteController.testCorreo);
router.get('/health-check', soporteController.getHealthCheck);

module.exports = router;
