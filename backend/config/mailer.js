const nodemailer = require('nodemailer');

// Transporter para correos institucionales (Zimbra)
const institutionalTransporter = nodemailer.createTransport({
    host: '172.16.1.248',
    port: 25,
    secure: false,
    tls: {
        rejectUnauthorized: false
    }
});

// Transporter para correos externos (Gmail con App Password)
const externalTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "centrodesaludchonetipoc@gmail.com",
        pass: "xcsb xnyi gvlc qcwd"
    }
});

const enviarCorreo = async (destinatario, asunto, mensaje) => {
    // Determinar si el correo es institucional
    const isInstitutional = destinatario.endsWith('@13d07.mspz4.gob.ec') || destinatario.endsWith('@msp.gob.ec');

    let transporter;
    let fromAddress;

    if (isInstitutional) {
        transporter = institutionalTransporter;
        fromAddress = 'sistema@emergencia.local';
    } else {
        transporter = externalTransporter;
        fromAddress = '"CS TC Chone" <centrodesaludchonetipoc@gmail.com>';
    }

    await transporter.sendMail({
        from: fromAddress,
        to: destinatario,
        subject: asunto,
        html: mensaje,
    });
};

module.exports = {
    enviarCorreo
};

