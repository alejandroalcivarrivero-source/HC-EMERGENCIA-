const express = require('express');
const router = express.Router();
const catMotivoConsultaSintomasController = require('../controllers/catMotivoConsultaSintomasController');
const validarToken = require('../middlewares/validarToken');

// Ruta para obtener todos los motivos de consulta
router.get('/', validarToken, catMotivoConsultaSintomasController.getAllMotivosConsulta);

// Ruta para buscar motivos de consulta por query (para autocompletado)
router.get('/search', validarToken, catMotivoConsultaSintomasController.searchMotivosConsulta);

module.exports = router;