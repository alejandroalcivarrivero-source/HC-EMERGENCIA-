const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
// const validarToken = require('../middlewares/validarToken'); 

// router.get('/resumen', validarToken, dashboardController.getResumenDiario);
router.get('/resumen', dashboardController.getResumenDiario);

module.exports = router;