const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: {
    // No necesitamos SSL/TLS para conexión local a Postfix
    rejectUnauthorized: false
  }
});

module.exports = transporter;

