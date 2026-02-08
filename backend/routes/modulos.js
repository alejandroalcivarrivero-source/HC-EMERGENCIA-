const express = require('express');
const router = express.Router();
const modulosController = require('../controllers/modulosController');
const validarToken = require('../middlewares/validarToken');
const validarAdmin = require('../middlewares/validarAdmin');

// Rutas para la gestión de módulos de usuario
router.get('/usuarios/:usuario_id/modulos', validarToken, validarAdmin, modulosController.getModulosPorUsuario);
router.put('/usuarios/:usuario_id/modulos', validarToken, validarAdmin, modulosController.actualizarModulosUsuario);

module.exports = router;