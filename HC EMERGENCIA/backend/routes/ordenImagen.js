const express = require('express');
const router = express.Router();
const ordenImagenController = require('../controllers/ordenImagenController');
const validarToken = require('../middlewares/validarToken');

// Ruta para crear una nueva orden de imagen
router.post('/', validarToken, ordenImagenController.createOrdenImagen);

// Ruta para obtener todas las órdenes de imagen de una admisión
router.get('/:admisionId', validarToken, ordenImagenController.getOrdenesImagenByAdmision);

// Ruta para actualizar una orden de imagen por ID
router.put('/:id', validarToken, ordenImagenController.updateOrdenImagen);

// Ruta para eliminar una orden de imagen por ID
router.delete('/:id', validarToken, ordenImagenController.deleteOrdenImagen);

module.exports = router;