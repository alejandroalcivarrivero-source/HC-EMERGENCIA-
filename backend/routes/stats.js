const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const validarToken = require('../middlewares/validarToken');

// Ruta para obtener los KPIs de inteligencia de negocios
router.get('/kpis', validarToken, statsController.getKpis);

module.exports = router;