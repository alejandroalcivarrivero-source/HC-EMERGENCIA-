const express = require('express');
const router = express.Router();
const multimediaTvController = require('../controllers/multimediaTvController');
const validarAdmin = require('../middlewares/validarAdmin');
const validarToken = require('../middlewares/validarToken');

// Ruta pública: Obtener videos activos (para la pantalla de TV)
router.get('/activos', multimediaTvController.obtenerVideosActivos);

// Rutas protegidas para administradores
// Obtener todos los videos (admin)
router.get('/', validarAdmin, multimediaTvController.obtenerTodosLosVideos);

// Crear video (admin) - puede incluir subida de archivo
router.post('/', validarAdmin, multimediaTvController.uploadVideo, multimediaTvController.crearVideo);

// Actualizar video (admin) - puede incluir subida de archivo
router.put('/:id', validarAdmin, multimediaTvController.uploadVideo, multimediaTvController.actualizarVideo);

// Eliminar video (admin)
router.delete('/:id', validarAdmin, multimediaTvController.eliminarVideo);

// Actualizar orden de videos (admin)
router.put('/orden/actualizar', validarAdmin, multimediaTvController.actualizarOrden);

module.exports = router;
