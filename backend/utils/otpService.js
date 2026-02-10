const crypto = require('crypto');
const OTP = require('../models/OTP');
const transporter = require('../config/mailer');
const { Op } = require('sequelize');

/**
 * Genera un código OTP de 6 dígitos
 */
const generarCodigo = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Crea y envía un OTP por correo
 */
const enviarOTP = async (email, proposito, asunto) => {
  const codigo = generarCodigo();
  const expira_en = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  // Guardar en BD
  await OTP.create({
    email,
    codigo,
    proposito,
    expira_en
  });

  // Configurar correo
  const mailOptions = {
    from: '"SIGEMECH" <noreply@hcemergencia.com>',
    to: email,
    subject: asunto,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #2c3e50;">Verificación de Seguridad</h2>
        <p>Has solicitado una acción que requiere validación en el sistema SIGEMECH.</p>
        <p>Tu código de autorización es:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3498db; padding: 10px; background: #f9f9f9; text-align: center; border-radius: 5px;">
          ${codigo}
        </div>
        <p style="margin-top: 20px; font-size: 14px; color: #7f8c8d;">
          Este código expirará en 15 minutos.<br>
          Si no has solicitado esta acción, por favor ignora este correo.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  return true;
};

/**
 * Valida un código OTP
 */
const validarOTP = async (email, codigo, proposito) => {
  const otpRecord = await OTP.findOne({
    where: {
      email,
      codigo,
      proposito,
      utilizado: false,
      expira_en: {
        [Op.gt]: new Date()
      }
    },
    order: [['creado_en', 'DESC']]
  });

  if (!otpRecord) {
    return false;
  }

  // Marcar como utilizado
  otpRecord.utilizado = true;
  await otpRecord.save();
  return true;
};

module.exports = {
  enviarOTP,
  validarOTP
};
