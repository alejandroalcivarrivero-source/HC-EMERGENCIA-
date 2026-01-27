-- ========================================================
-- CONFIGURACIÓN DE AUDIO PARA SIGEMECH - PANTALLA DE TV
-- ========================================================
-- Fecha: 2026-01-25
-- Descripción: Crear tabla para configuración de audio de la pantalla de TV
-- Base de Datos: MariaDB
-- ========================================================

-- PASO 1: CREAR TABLA configuracion_audio_tv
-- ========================================================
CREATE TABLE IF NOT EXISTS configuracion_audio_tv (
    id INT(11) NOT NULL AUTO_INCREMENT,
    clave VARCHAR(50) NOT NULL UNIQUE COMMENT 'Clave única de configuración',
    valor VARCHAR(255) NOT NULL COMMENT 'Valor de la configuración',
    descripcion VARCHAR(500) NULL COMMENT 'Descripción de la configuración',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_clave (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuración de audio para la pantalla de TV de SIGEMECH';

-- PASO 2: INSERTAR VALORES POR DEFECTO
-- ========================================================
INSERT INTO configuracion_audio_tv (clave, valor, descripcion) VALUES
('volumen_videos', '15', 'Volumen general de videos educativos (0-100%)'),
('volumen_llamado', '100', 'Volumen de llamado (Ding-Dong y voz sintética) (0-100%)'),
('volumen_atenuacion', '5', 'Volumen de atenuación durante anuncios (0-100%)')
ON DUPLICATE KEY UPDATE valor = valor;

-- NOTAS:
-- ========================================================
-- 1. volumen_videos: Volumen normal de reproducción de videos (sugerido: 15%)
-- 2. volumen_llamado: Volumen de sonidos de llamado (sugerido: 100%)
-- 3. volumen_atenuacion: Volumen al que baja el video durante anuncios (sugerido: 5%)
