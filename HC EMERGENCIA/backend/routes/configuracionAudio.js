const express = require('express');
const router = express.Router();
const configuracionAudioController = require('../controllers/configuracionAudioController');
const validarAdmin = require('../middlewares/validarAdmin');

// Ruta pública: Obtener configuración de audio (para la pantalla de TV)
router.get('/', configuracionAudioController.obtenerConfiguracion);

// Ruta protegida: Actualizar configuración de audio (solo administradores)
router.put('/', validarAdmin, configuracionAudioController.actualizarConfiguracion);

module.exports = router;
