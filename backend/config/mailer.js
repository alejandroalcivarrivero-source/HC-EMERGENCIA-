const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: '190.214.55.52',
  port: 587,
  secure: false,
  auth: {
    user: process.env.CORREO_APP,
    pass: process.env.CORREO_PASS
  }
});

module.exports = transporter;

