const express = require('express');
const router = express.Router();
const multimediaTvController = require('../controllers/multimediaTvController');
const validarToken = require('../middlewares/validarToken');
const verifyRole = require('../middlewares/verifyRole');

// Ruta pública: Obtener videos activos (para la pantalla de TV)
router.get('/activos', multimediaTvController.obtenerVideosActivos);

// Rutas protegidas para Soporte TI (Rol 6)
router.use(validarToken);
router.use(verifyRole(6));

// Obtener todos los videos
router.get('/', multimediaTvController.obtenerTodosLosVideos);

// Crear video - puede incluir subida de archivo
router.post('/', multimediaTvController.uploadVideo, multimediaTvController.crearVideo);

// Actualizar video - puede incluir subida de archivo
router.put('/:id', multimediaTvController.uploadVideo, multimediaTvController.actualizarVideo);

// Eliminar video
router.delete('/:id', multimediaTvController.eliminarVideo);

// Actualizar orden de videos
router.put('/orden/actualizar', multimediaTvController.actualizarOrden);

module.exports = router;
