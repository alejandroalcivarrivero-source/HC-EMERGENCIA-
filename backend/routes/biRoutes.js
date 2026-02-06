const express = require('express');
const router = express.Router();
const biController = require('../controllers/biController');
const validarAdmin = require('../middlewares/validarAdmin');

// Todas las rutas requieren ser administrador
router.use(validarAdmin);

// Rutas de Dashboard BI
router.get('/triaje-stats', biController.getTriajeStats);
router.get('/waiting-times', biController.getWaitingTimes);
router.get('/top-diagnosticos', biController.getTopDiagnosticos);

module.exports = router;
