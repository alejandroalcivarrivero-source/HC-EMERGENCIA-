-- ========================================================
-- CMS DE VIDEOS PARA SIGEMECH - PANTALLA DE TV
-- ========================================================
-- Fecha: 2026-01-25
-- Descripción: Crear tabla para gestión de videos educativos
-- Base de Datos: MariaDB
-- ========================================================

-- PASO 1: CREAR TABLA multimedia_tv
-- ========================================================
CREATE TABLE IF NOT EXISTS multimedia_tv (
    id INT(11) NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL COMMENT 'Título del video',
    url_video VARCHAR(500) NOT NULL COMMENT 'URL de YouTube o ruta del archivo local',
    tipo ENUM('youtube', 'local') NOT NULL DEFAULT 'youtube' COMMENT 'Tipo de video: YouTube o archivo local',
    orden INT(11) NOT NULL DEFAULT 0 COMMENT 'Orden de reproducción',
    activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Si el video está activo en la rotación',
    usuario_id INT(11) NOT NULL COMMENT 'ID del usuario que subió el video',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
    PRIMARY KEY (id),
    KEY idx_orden (orden),
    KEY idx_activo (activo),
    KEY idx_usuario_id (usuario_id),
    CONSTRAINT fk_multimedia_usuario FOREIGN KEY (usuario_id) REFERENCES USUARIOS_SISTEMA(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Videos educativos para la pantalla de TV de SIGEMECH';

-- PASO 2: VERIFICAR TABLA CREADA (OPCIONAL)
-- ========================================================
-- SELECT 
--     'Tabla multimedia_tv creada correctamente' as mensaje,
--     COUNT(*) as total_videos
-- FROM multimedia_tv;

-- PASO 3: INSERTAR VIDEO DE EJEMPLO (OPCIONAL)
-- ========================================================
-- INSERT INTO multimedia_tv (titulo, url_video, tipo, orden, activo, usuario_id)
-- VALUES (
--     'Video Educativo de Ejemplo',
--     'https://www.youtube.com/embed/dQw4w9WgXcQ',
--     'youtube',
--     1,
--     1,
--     1  -- Reemplazar con el ID de un usuario administrador existente
-- );

-- NOTAS:
-- ========================================================
-- 1. El campo 'tipo' puede ser 'youtube' o 'local'
-- 2. Para videos de YouTube, usar formato: https://www.youtube.com/embed/VIDEO_ID
-- 3. Para videos locales, usar ruta relativa: /uploads/videos/nombre-archivo.mp4
-- 4. El campo 'orden' determina el orden de reproducción (menor número = primero)
-- 5. Solo videos con 'activo = 1' se mostrarán en la pantalla de TV
-- 6. El usuario_id debe existir en la tabla USUARIOS_SISTEMA
