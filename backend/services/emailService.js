const nodemailer = require('nodemailer');
const logger = require('../utils/logger'); // Asumiendo que tienes un logger configurado

const transporter = nodemailer.createTransport({
  host: '172.16.1.248',
  port: 25,
  secure: false, // El puerto 25 no suele usar TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
 tls: {
   rejectUnauthorized: false
 },
  // --- AJUSTE DE LOGS ---
  // Cambiar 'debug' a 'info' para reducir la verbosidad en producción.
  // 'info': solo loguea si el correo fue enviado o falló.
  // 'debug': loguea todo el diálogo SMTP, muy detallado.
  logger: true, // Habilitar el logging
  debug: false // Establecer en 'false' para nivel 'info', 'true' para 'debug'
});

/**
 * Función genérica para envío de correos electrónicos
 * @param {Object} options - Opciones del correo
 * @param {string} options.to - Destinatario
 * @param {string} options.subject - Asunto del correo
 * @param {string} options.text - Cuerpo en texto plano (opcional)
 * @param {string} options.html - Cuerpo en HTML (opcional)
 * @param {string} options.from - Remitente (opcional, por defecto el configurado)
 * @returns {Promise<Object>} Resultado del envío
 */
const enviarCorreo = async ({ to, subject, text, html, from }) => {
  try {
    const mailOptions = {
      from: from || `"SIGEMECH" <no-reply@sigemech.local>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Correo enviado exitosamente a ${to} con Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Error en el servicio de correo al enviar a ${to}: ${error.message}`);
    throw new Error(`Error en el servicio de correo: ${error.message}`);
  }
};

/**
 * Envía un código OTP para cambio de clave con una plantilla profesional
 * @param {string} userEmail - Correo del usuario
 * @param {string} otpCode - Código de 6 dígitos
 * @returns {Promise<Object>} Resultado del envío
 */
const sendOTP = async (userEmail, otpCode) => {
  const subject = 'Código de Validación - Cambio de Clave SIGEMECH';
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin: 0;">SIGEMECH</h2>
        <p style="color: #6b7280; font-size: 14px;">Sistema de Gestión Médica Hospitalaria</p>
      </div>
      <div style="background-color: #f3f4f6; padding: 30px; border-radius: 8px; text-align: center;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Usted ha solicitado un cambio de clave en <strong>SIGEMECH</strong>.</p>
        <p style="font-size: 14px; color: #4b5563;">Su código de validación es:</p>
        <div style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 8px; margin: 20px 0; padding: 10px; background: white; border: 2px dashed #1e40af; display: inline-block; border-radius: 5px;">
          ${otpCode}
        </div>
        <p style="font-size: 12px; color: #ef4444; margin-top: 20px;">Este código expirará en 5 minutos por razones de seguridad.</p>
      </div>
      <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #9ca3af;">
        <p>Si usted no solicitó este cambio, por favor ignore este mensaje o contacte a soporte técnico.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p>&copy; 2026 SIGEMECH - Estándar de Seguridad Institucional</p>
      </div>
    </div>
  `;

  return enviarCorreo({ to: userEmail, subject, html });
};

module.exports = { enviarCorreo, sendOTP };
