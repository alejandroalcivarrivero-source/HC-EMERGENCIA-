const express = require('express');
const router = express.Router();
const recetaMedicaController = require('../controllers/recetaMedicaController');
const validarToken = require('../middlewares/validarToken');

// Ruta para crear una nueva receta médica
router.post('/', validarToken, recetaMedicaController.createRecetaMedica);

// Ruta para obtener todas las recetas médicas de una admisión
router.get('/:admisionId', validarToken, recetaMedicaController.getRecetasMedicasByAdmision);

// Ruta para actualizar una receta médica por ID
router.put('/:id', validarToken, recetaMedicaController.updateRecetaMedica);

// Ruta para eliminar una receta médica por ID
router.delete('/:id', validarToken, recetaMedicaController.deleteRecetaMedica);

module.exports = router;