const express = require('express');
const router = express.Router();
const catTriajeController = require('../controllers/catTriajeController');
const validarToken = require('../middlewares/validarToken'); // Asumiendo que se requiere autenticación

router.get('/', validarToken, catTriajeController.getAllCatTriaje);

module.exports = router;