const { enviarCorreo } = require('./services/emailService');

const testEnvio = async () => {
  console.log('Iniciando prueba de envío de correo...');
  try {
    const resultado = await enviarCorreo({
      to: 'sergio@13d07.mspz4.gob.ec', // Usar correo real si es posible, o simularlo si es ambiente local
      subject: 'Prueba de Sistema - HC Emergencia - Estabilización Completa',
      text: 'Este es un correo de prueba para verificar la configuración de Postfix y el flujo de notificaciones.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h1 style="color: #2563eb;">✅ Sistema de Notificaciones Activo</h1>
          <p>Hola Sergio,</p>
          <p>Se han completado las tareas de estabilización:</p>
          <ul>
            <li>Verificación de Backend y Tareas Cron.</li>
            <li>Flujo de OTP con soporte para correo alternativo.</li>
            <li>Integración de vista de Cambio de Contraseña.</li>
            <li>Validaciones de contraseña visibles.</li>
          </ul>
          <p>El canal oficial de notificaciones de HC Emergencia está funcionando correctamente.</p>
        </div>
      `
    });
    
    if (resultado.success) {
      console.log('✅ Correo enviado con éxito.');
    }
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
};

testEnvio();
