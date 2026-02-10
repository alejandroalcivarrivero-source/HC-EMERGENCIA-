const transporter = require('./config/mailer');

async function sendTestToAndres() {
  try {
    console.log('Enviando correo de prueba a Andrés Alcívar...');
    const info = await transporter.sendMail({
      from: '"Soporte SIGEMECH" <notificaciones@sigemech.local>',
      to: 'andres.alcivar@13d07.mspz4.gob.ec',
      subject: 'Validación de Identidad SIGEMECH.LOCAL',
      text: 'Hola Andrés, esta es una prueba de envío real desde el sistema de emergencia con timeouts aumentados y logs activos.',
      html: '<h1>Prueba de Conectividad</h1><p>Hola Andrés, esta es una prueba de envío real desde el sistema de emergencia con timeouts aumentados y logs activos.</p>'
    });

    console.log('✅ Correo enviado con éxito a Andrés!');
    console.log('ID del mensaje:', info.messageId);
    console.log('Respuesta del servidor:', info.response);
  } catch (error) {
    console.error('❌ Error al enviar el correo a Andrés:', error);
  }
}

sendTestToAndres();
