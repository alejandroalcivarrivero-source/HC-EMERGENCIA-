const express = require('express');
const router = express.Router();
const { getAdmisionesConAlertaTriaje } = require('../controllers/alertasController');
const { validarToken } = require('../middlewares/validarToken'); // Asumiendo que necesitas autenticación

router.get('/alertas-triaje', getAdmisionesConAlertaTriaje);

module.exports = router;