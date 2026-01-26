const express = require('express');
const router = express.Router();
const ordenExamenController = require('../controllers/ordenExamenController');
const validarToken = require('../middlewares/validarToken');

// Ruta para crear una nueva orden de examen
router.post('/', validarToken, ordenExamenController.createOrdenExamen);

// Ruta para obtener todas las órdenes de examen de una admisión
router.get('/:admisionId', validarToken, ordenExamenController.getOrdenesExamenByAdmision);

// Ruta para actualizar una orden de examen por ID
router.put('/:id', validarToken, ordenExamenController.updateOrdenExamen);

// Ruta para eliminar una orden de examen por ID
router.delete('/:id', validarToken, ordenExamenController.deleteOrdenExamen);

module.exports = router;