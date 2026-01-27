const ConfiguracionAudioTv = require('../models/configuracion_audio_tv');

/**
 * Obtener todas las configuraciones de audio
 */
const obtenerConfiguracion = async (req, res) => {
  try {
    const configuraciones = await ConfiguracionAudioTv.findAll();
    
    // Convertir a objeto clave-valor
    const config = {};
    configuraciones.forEach(item => {
      config[item.clave] = parseFloat(item.valor);
    });

    // Valores por defecto si no existen
    const configuracionCompleta = {
      volumen_videos: config.volumen_videos || 15,
      volumen_llamado: config.volumen_llamado || 100,
      volumen_atenuacion: config.volumen_atenuacion || 5
    };

    res.json({
      success: true,
      configuracion: configuracionCompleta
    });
  } catch (error) {
    // Si la tabla no existe o hay error de conexión, devolver valores por defecto
    const esTablaNoExiste = error.name === 'SequelizeDatabaseError' && 
                            (error.parent?.code === 'ER_NO_SUCH_TABLE' || 
                             error.original?.code === 'ER_NO_SUCH_TABLE');
    
    const esTimeoutConexion = error.name === 'SequelizeConnectionError' || 
                               error.parent?.code === 'ER_CONNECTION_TIMEOUT' ||
                               error.original?.code === 'ER_CONNECTION_TIMEOUT';
    
    if (esTablaNoExiste) {
      console.warn('⚠️ Tabla configuracion_audio_tv no existe. Usando valores por defecto.');
      console.warn('💡 Ejecuta el script: scripts/crear_tabla_configuracion_audio.sql');
    } else if (esTimeoutConexion) {
      console.warn('⚠️ Timeout de conexión a la base de datos. Usando valores por defecto.');
      console.warn('💡 Verifica el túnel SSH y la conexión a la base de datos.');
    } else {
      console.error('Error al obtener configuración de audio:', error);
    }
    
    // Devolver valores por defecto con success: true para que el frontend funcione
    res.json({
      success: true,
      configuracion: {
        volumen_videos: 15,
        volumen_llamado: 100,
        volumen_atenuacion: 5
      },
      mensaje: esTablaNoExiste ? 'Usando valores por defecto. Ejecuta el script SQL para crear la tabla.' : 
               esTimeoutConexion ? 'Timeout de conexión. Usando valores por defecto.' : undefined
    });
  }
};

/**
 * Actualizar configuración de audio
 */
const actualizarConfiguracion = async (req, res) => {
  try {
    const { volumen_videos, volumen_llamado, volumen_atenuacion } = req.body;

    // Validar valores
    if (volumen_videos !== undefined && (volumen_videos < 0 || volumen_videos > 100)) {
      return res.status(400).json({
        success: false,
        mensaje: 'volumen_videos debe estar entre 0 y 100'
      });
    }

    if (volumen_llamado !== undefined && (volumen_llamado < 0 || volumen_llamado > 100)) {
      return res.status(400).json({
        success: false,
        mensaje: 'volumen_llamado debe estar entre 0 y 100'
      });
    }

    if (volumen_atenuacion !== undefined && (volumen_atenuacion < 0 || volumen_atenuacion > 100)) {
      return res.status(400).json({
        success: false,
        mensaje: 'volumen_atenuacion debe estar entre 0 y 100'
      });
    }

    // Actualizar o crear cada configuración
    const updates = [];

    if (volumen_videos !== undefined) {
      updates.push(
        ConfiguracionAudioTv.upsert({
          clave: 'volumen_videos',
          valor: volumen_videos.toString(),
          descripcion: 'Volumen general de videos educativos (0-100%)'
        })
      );
    }

    if (volumen_llamado !== undefined) {
      updates.push(
        ConfiguracionAudioTv.upsert({
          clave: 'volumen_llamado',
          valor: volumen_llamado.toString(),
          descripcion: 'Volumen de llamado (Ding-Dong y voz sintética) (0-100%)'
        })
      );
    }

    if (volumen_atenuacion !== undefined) {
      updates.push(
        ConfiguracionAudioTv.upsert({
          clave: 'volumen_atenuacion',
          valor: volumen_atenuacion.toString(),
          descripcion: 'Volumen de atenuación durante anuncios (0-100%)'
        })
      );
    }

    await Promise.all(updates);

    // Obtener configuración actualizada
    const configuraciones = await ConfiguracionAudioTv.findAll();
    const config = {};
    configuraciones.forEach(item => {
      config[item.clave] = parseFloat(item.valor);
    });

    res.json({
      success: true,
      mensaje: 'Configuración actualizada exitosamente',
      configuracion: {
        volumen_videos: config.volumen_videos || 15,
        volumen_llamado: config.volumen_llamado || 100,
        volumen_atenuacion: config.volumen_atenuacion || 5
      }
    });
  } catch (error) {
    // Si la tabla no existe, informar al usuario
    const esTablaNoExiste = error.name === 'SequelizeDatabaseError' && 
                            (error.parent?.code === 'ER_NO_SUCH_TABLE' || 
                             error.original?.code === 'ER_NO_SUCH_TABLE');
    
    if (esTablaNoExiste) {
      console.error('❌ Error: La tabla configuracion_audio_tv no existe.');
      console.error('💡 Ejecuta el script: scripts/crear_tabla_configuracion_audio.sql');
      return res.status(500).json({
        success: false,
        mensaje: 'La tabla de configuración no existe. Ejecuta el script SQL: scripts/crear_tabla_configuracion_audio.sql',
        error: 'ER_NO_SUCH_TABLE'
      });
    }
    
    console.error('Error al actualizar configuración de audio:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar configuración',
      error: error.message
    });
  }
};

module.exports = {
  obtenerConfiguracion,
  actualizarConfiguracion
};
