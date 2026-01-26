const express = require('express');
const router = express.Router();
const catCie10Controller = require('../controllers/catCie10Controller');
const validarToken = require('../middlewares/validarToken');

// Ruta para obtener todo el catálogo CIE10 (puede ser grande, usar con precaución)
router.get('/', validarToken, catCie10Controller.getAllCIE10);

// Ruta para buscar en el catálogo CIE10 por código o descripción
router.get('/search', validarToken, catCie10Controller.searchCIE10);

// Ruta para obtener un código CIE10 específico por ID
router.get('/:id', validarToken, catCie10Controller.getCIE10ById);

module.exports = router;