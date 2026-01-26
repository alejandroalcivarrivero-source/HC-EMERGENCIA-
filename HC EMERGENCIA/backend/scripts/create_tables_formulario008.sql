-- Script SQL para crear las tablas necesarias para el Formulario 008
-- Ejecutar este script en la base de datos EMERGENCIA

-- Tabla DETALLE_DIAGNOSTICOS
CREATE TABLE IF NOT EXISTS `DETALLE_DIAGNOSTICOS` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `atencion_emergencia_id` int(11) NOT NULL,
  `codigo_cie10` varchar(10) NOT NULL,
  `tipo_diagnostico` enum('PRESUNTIVO','DEFINITIVO','NO APLICA') NOT NULL,
  `descripcion` text DEFAULT NULL,
  `orden` int(11) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_detalle_diagnostico_atencion` (`atencion_emergencia_id`),
  KEY `fk_detalle_diagnostico_cie10` (`codigo_cie10`),
  CONSTRAINT `fk_detalle_diagnostico_atencion` FOREIGN KEY (`atencion_emergencia_id`) REFERENCES `ATENCION_EMERGENCIA` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_detalle_diagnostico_cie10` FOREIGN KEY (`codigo_cie10`) REFERENCES `CAT_CIE10` (`codigo`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla LOG_REASIGNACIONES_MEDICAS
CREATE TABLE IF NOT EXISTS `LOG_REASIGNACIONES_MEDICAS` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `atencion_emergencia_id` int(11) NOT NULL,
  `medico_anterior_id` int(11) NOT NULL,
  `medico_nuevo_id` int(11) NOT NULL,
  `motivo_reasignacion` text DEFAULT NULL,
  `usuario_reasignador_id` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_reasignacion_atencion` (`atencion_emergencia_id`),
  KEY `fk_reasignacion_medico_anterior` (`medico_anterior_id`),
  KEY `fk_reasignacion_medico_nuevo` (`medico_nuevo_id`),
  KEY `fk_reasignacion_usuario` (`usuario_reasignador_id`),
  CONSTRAINT `fk_reasignacion_atencion` FOREIGN KEY (`atencion_emergencia_id`) REFERENCES `ATENCION_EMERGENCIA` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reasignacion_medico_anterior` FOREIGN KEY (`medico_anterior_id`) REFERENCES `USUARIOS_SISTEMA` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_reasignacion_medico_nuevo` FOREIGN KEY (`medico_nuevo_id`) REFERENCES `USUARIOS_SISTEMA` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_reasignacion_usuario` FOREIGN KEY (`usuario_reasignador_id`) REFERENCES `USUARIOS_SISTEMA` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Agregar campos faltantes a ATENCION_EMERGENCIA si no existen
ALTER TABLE `ATENCION_EMERGENCIA` 
  ADD COLUMN IF NOT EXISTS `estado_firma` enum('PENDIENTE','FIRMADO') DEFAULT 'PENDIENTE' AFTER `es_valida`,
  ADD COLUMN IF NOT EXISTS `usuario_responsable_id` int(11) DEFAULT NULL AFTER `usuarioId`,
  ADD KEY IF NOT EXISTS `fk_atencion_usuario_responsable` (`usuario_responsable_id`),
  ADD CONSTRAINT IF NOT EXISTS `fk_atencion_usuario_responsable` FOREIGN KEY (`usuario_responsable_id`) REFERENCES `USUARIOS_SISTEMA` (`id`) ON UPDATE CASCADE;
