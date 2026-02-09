const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/login', authController.login);
router.post('/registro', authController.registrar);
router.post('/recuperar', authController.recuperar);
router.post('/restablecer/:token', authController.restablecer);

// Rutas de recuperación avanzada
router.post('/validar-firma-recuperacion', upload.single('archivo_p12'), authController.validarFirmaRecuperacion);
router.post('/solicitar-otp', authController.solicitarOtpRecuperacion);
router.post('/validar-otp-recuperacion', authController.validarOtpRecuperacion);
router.post('/reset-password-final', authController.resetPasswordFinal);

module.exports = router;
