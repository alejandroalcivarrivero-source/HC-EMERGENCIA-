const MultimediaTv = require('../models/multimedia_tv');
const Usuario = require('../models/usuario');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar multer para subida de archivos de video
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../frontend/public/uploads/videos');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Nombre único: timestamp + nombre original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

// Filtrar solo archivos de video
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de video (mp4, webm, ogg, mov)'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB máximo
  },
  fileFilter: fileFilter
});

// Middleware para subida de archivo único
const uploadVideo = upload.single('video');

/**
 * Obtener todos los videos activos ordenados por orden
 */
const obtenerVideosActivos = async (req, res) => {
  try {
    const videos = await MultimediaTv.findAll({
      where: { activo: true },
      order: [['orden', 'ASC'], ['fecha_creacion', 'ASC']],
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nombres', 'apellidos']
      }]
    });

    res.json({
      success: true,
      videos: videos
    });
  } catch (error) {
    // Si la tabla no existe o hay error de conexión, devolver array vacío
    const esTablaNoExiste = error.name === 'SequelizeDatabaseError' && 
                            (error.parent?.code === 'ER_NO_SUCH_TABLE' || 
                             error.original?.code === 'ER_NO_SUCH_TABLE');
    
    const esTimeoutConexion = error.name === 'SequelizeConnectionError' || 
                               error.parent?.code === 'ER_CONNECTION_TIMEOUT' ||
                               error.original?.code === 'ER_CONNECTION_TIMEOUT';
    
    if (esTablaNoExiste) {
      console.warn('⚠️ Tabla multimedia_tv no existe. Devolviendo lista vacía.');
      console.warn('💡 Ejecuta el script: scripts/crear_tabla_multimedia_tv.sql');
    } else if (esTimeoutConexion) {
      console.warn('⚠️ Timeout de conexión a la base de datos. Devolviendo lista vacía.');
      console.warn('💡 Verifica el túnel SSH y la conexión a la base de datos.');
    } else {
      console.error('Error al obtener videos activos:', error);
    }
    
    // Devolver array vacío con success: true para que el frontend funcione
    return res.json({
      success: true,
      videos: []
    });
  }
};

/**
 * Obtener todos los videos (admin)
 */
const obtenerTodosLosVideos = async (req, res) => {
  try {
    const videos = await MultimediaTv.findAll({
      order: [['orden', 'ASC'], ['fecha_creacion', 'DESC']],
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nombres', 'apellidos']
      }]
    });

    res.json({
      success: true,
      videos: videos
    });
  } catch (error) {
    // Si la tabla no existe o hay error de conexión, devolver array vacío
    const esTablaNoExiste = error.name === 'SequelizeDatabaseError' && 
                            (error.parent?.code === 'ER_NO_SUCH_TABLE' || 
                             error.original?.code === 'ER_NO_SUCH_TABLE');
    
    const esTimeoutConexion = error.name === 'SequelizeConnectionError' || 
                               error.parent?.code === 'ER_CONNECTION_TIMEOUT' ||
                               error.original?.code === 'ER_CONNECTION_TIMEOUT';
    
    if (esTablaNoExiste) {
      console.warn('⚠️ Tabla multimedia_tv no existe. Devolviendo lista vacía.');
      console.warn('💡 Ejecuta el script: scripts/crear_tabla_multimedia_tv.sql');
    } else if (esTimeoutConexion) {
      console.warn('⚠️ Timeout de conexión a la base de datos. Devolviendo lista vacía.');
      console.warn('💡 Verifica el túnel SSH y la conexión a la base de datos.');
    } else {
      console.error('Error al obtener todos los videos:', error);
    }
    
    // Devolver array vacío con success: true para que el frontend funcione
    return res.json({
      success: true,
      videos: []
    });
  }
};

/**
 * Crear nuevo video (YouTube o local)
 */
const crearVideo = async (req, res) => {
  try {
    const { titulo, url_video, tipo, orden } = req.body;
    const usuario_id = req.usuario?.id || req.usuario?.userId || req.userId; // Compatible con ambos middlewares

    // Validar campos requeridos
    if (!titulo || !url_video || !tipo) {
      return res.status(400).json({
        success: false,
        mensaje: 'Faltan campos requeridos: titulo, url_video, tipo'
      });
    }

    // Si es tipo local, esperar que multer haya subido el archivo
    if (tipo === 'local') {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          mensaje: 'Debe subir un archivo de video para tipo local'
        });
      }
      // La URL será la ruta relativa al archivo subido
      const urlVideo = `/uploads/videos/${req.file.filename}`;
      
      // Obtener el siguiente orden si no se especifica
      const maxOrden = await MultimediaTv.max('orden');
      const nuevoOrden = orden !== undefined ? orden : (maxOrden ? maxOrden + 1 : 1);

      const video = await MultimediaTv.create({
        titulo,
        url_video: urlVideo,
        tipo: 'local',
        orden: nuevoOrden,
        activo: true,
        usuario_id
      });

      const videoConUsuario = await MultimediaTv.findByPk(video.id, {
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombres', 'apellidos']
        }]
      });

      return res.status(201).json({
        success: true,
        mensaje: 'Video creado exitosamente',
        video: videoConUsuario
      });
    } else {
      // Tipo YouTube
      // Validar formato de URL de YouTube
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/;
      let videoId = null;
      
      if (youtubeRegex.test(url_video)) {
        // Extraer ID del video
        const match = url_video.match(/([a-zA-Z0-9_-]{11})/);
        videoId = match ? match[1] : null;
      }

      if (!videoId && tipo === 'youtube') {
        return res.status(400).json({
          success: false,
          mensaje: 'URL de YouTube inválida. Use formato: https://www.youtube.com/embed/VIDEO_ID'
        });
      }

      // Formatear URL para embed
      const urlVideoFormateada = videoId ? `https://www.youtube.com/embed/${videoId}` : url_video;

      // Obtener el siguiente orden si no se especifica
      const maxOrden = await MultimediaTv.max('orden');
      const nuevoOrden = orden !== undefined ? orden : (maxOrden ? maxOrden + 1 : 1);

      const video = await MultimediaTv.create({
        titulo,
        url_video: urlVideoFormateada,
        tipo: 'youtube',
        orden: nuevoOrden,
        activo: true,
        usuario_id
      });

      const videoConUsuario = await MultimediaTv.findByPk(video.id, {
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombres', 'apellidos']
        }]
      });

      return res.status(201).json({
        success: true,
        mensaje: 'Video creado exitosamente',
        video: videoConUsuario
      });
    }
  } catch (error) {
    console.error('Error al crear video:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al crear video',
      error: error.message
    });
  }
};

/**
 * Actualizar video
 */
const actualizarVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, url_video, tipo, orden, activo } = req.body;

    const video = await MultimediaTv.findByPk(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        mensaje: 'Video no encontrado'
      });
    }

    // Si se actualiza a tipo local y hay archivo nuevo
    if (tipo === 'local' && req.file) {
      // Eliminar archivo anterior si existe
      if (video.tipo === 'local' && video.url_video) {
        const filePath = path.join(__dirname, '../../frontend/public', video.url_video);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      video.url_video = `/uploads/videos/${req.file.filename}`;
    } else if (tipo === 'youtube' && url_video) {
      // Validar y formatear URL de YouTube
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/;
      const match = url_video.match(/([a-zA-Z0-9_-]{11})/);
      if (match) {
        video.url_video = `https://www.youtube.com/embed/${match[1]}`;
      } else {
        video.url_video = url_video;
      }
    }

    // Actualizar campos
    if (titulo !== undefined) video.titulo = titulo;
    if (tipo !== undefined) video.tipo = tipo;
    if (orden !== undefined) video.orden = orden;
    if (activo !== undefined) video.activo = activo;

    await video.save();

    const videoActualizado = await MultimediaTv.findByPk(id, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nombres', 'apellidos']
      }]
    });

    res.json({
      success: true,
      mensaje: 'Video actualizado exitosamente',
      video: videoActualizado
    });
  } catch (error) {
    console.error('Error al actualizar video:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar video',
      error: error.message
    });
  }
};

/**
 * Eliminar video
 */
const eliminarVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await MultimediaTv.findByPk(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        mensaje: 'Video no encontrado'
      });
    }

    // Si es video local, eliminar archivo físico
    if (video.tipo === 'local' && video.url_video) {
      const filePath = path.join(__dirname, '../../frontend/public', video.url_video);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await video.destroy();

    res.json({
      success: true,
      mensaje: 'Video eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar video:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar video',
      error: error.message
    });
  }
};

/**
 * Actualizar orden de videos (múltiples)
 */
const actualizarOrden = async (req, res) => {
  try {
    const { videos } = req.body; // Array de { id, orden }

    if (!Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'Debe enviar un array de videos con id y orden'
      });
    }

    // Actualizar cada video
    const promises = videos.map(({ id, orden }) => {
      return MultimediaTv.update(
        { orden },
        { where: { id } }
      );
    });

    await Promise.all(promises);

    res.json({
      success: true,
      mensaje: 'Orden actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar orden',
      error: error.message
    });
  }
};

module.exports = {
  obtenerVideosActivos,
  obtenerTodosLosVideos,
  crearVideo,
  actualizarVideo,
  eliminarVideo,
  actualizarOrden,
  uploadVideo
};
