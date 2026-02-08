const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: '190.214.55.52',
  port: 587,
  secure: false, // Zimbra suele usar STARTTLS en el puerto 587
  auth: {
    user: process.env.CORREO_APP,
    pass: process.env.CORREO_PASS
  },
  tls: {
    rejectUnauthorized: false // Permite certificados auto-firmados si es necesario para la IP interna
  }
});

module.exports = transporter;

