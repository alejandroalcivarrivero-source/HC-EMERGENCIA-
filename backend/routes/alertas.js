const express = require('express');
const router = express.Router();
const { getAdmisionesConAlertaTriaje } = require('../controllers/alertasController');
const { validarToken } = require('../middlewares/validarToken'); // Asumiendo que necesitas autenticación
const otpService = require('../services/otpService');
const mailer = require('../config/mailer');

router.get('/alertas-triaje', getAdmisionesConAlertaTriaje);

// Ruta temporal de prueba para OTP (Paso 2)
router.post('/test-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'El email es requerido' });
        }

        const otp = otpService.generarOTP();
        console.log(`[OTP Test] Generado OTP ${otp} para ${email}`);

        const mailOptions = {
            from: process.env.MAIL_FROM || '"SIGEMECH OTP" <no-reply@institucion.gob.ec>',
            to: email,
            subject: 'Tu código de verificación OTP (Prueba)',
            text: `Tu código de verificación es: ${otp}`,
            html: `<b>Tu código de verificación es: ${otp}</b>`
        };

        await mailer.sendMail(mailOptions);
        
        res.json({
            success: true,
            message: 'Correo de prueba enviado con éxito',
            otp_preview: otp // Solo para fines de prueba
        });
    } catch (error) {
        console.error('Error en ruta /test-otp:', error);
        res.status(500).json({
            error: 'Error al enviar el correo de prueba',
            details: error.message
        });
    }
});

module.exports = router;