const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/registro', authController.registrar);
router.post('/recuperar', authController.recuperar);
router.post('/restablecer/:token', authController.restablecer);

module.exports = router;
