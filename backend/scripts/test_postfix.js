const transporter = require('./config/mailer');

async function testMail() {
  try {
    console.log('Intentando enviar correo de prueba a través de Postfix local...');
    const info = await transporter.sendMail({
      from: '"Prueba SIGEMECH" <sistema@sigemech.local>',
      to: 'test-recuperacion@sigemech.local', // O una dirección real si Postfix tiene salida
      subject: 'Prueba de Servidor Interno',
      text: 'Este es un correo de prueba enviado desde el servidor de correo interno ligero.',
      html: '<b>Este es un correo de prueba enviado desde el servidor de correo interno ligero.</b>'
    });

    console.log('Correo enviado con éxito!');
    console.log('ID del mensaje:', info.messageId);
    console.log('Respuesta del servidor:', info.response);
  } catch (error) {
    console.error('Error al enviar el correo de prueba:', error);
  }
}

testMail();
