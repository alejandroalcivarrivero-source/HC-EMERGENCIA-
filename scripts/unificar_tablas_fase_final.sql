-- Script de Unificación Fase Final
-- Asegura la existencia de DETALLE_DIAGNOSTICOS, FORM_008_EMERGENCIA y CERTIFICADOS_FIRMA

-- 1. Tabla DETALLE_DIAGNOSTICOS
CREATE TABLE IF NOT EXISTS `DETALLE_DIAGNOSTICOS` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `atencion_emergencia_id` int(11) NOT NULL,
  `codigo_cie10` varchar(10) NOT NULL,
  `tipo_diagnostico` enum('PRESUNTIVO','DEFINITIVO','NO APLICA') NOT NULL DEFAULT 'PRESUNTIVO',
  `condicion` enum('Presuntivo','Definitivo Inicial','Definitivo Inicial por Laboratorio','CAUSA EXTERNA','NO APLICA','PRINCIPAL') NOT NULL DEFAULT 'Presuntivo',
  `descripcion` text DEFAULT NULL,
  `orden` int(11) DEFAULT 1,
  `es_causa_externa` tinyint(1) NOT NULL DEFAULT 0,
  `padre_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_detalle_diagnostico_atencion` (`atencion_emergencia_id`),
  KEY `fk_detalle_diagnostico_cie10` (`codigo_cie10`),
  KEY `fk_detalle_diagnostico_padre` (`padre_id`),
  CONSTRAINT `fk_detalle_diagnostico_atencion` FOREIGN KEY (`atencion_emergencia_id`) REFERENCES `ATENCION_EMERGENCIA` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_detalle_diagnostico_cie10` FOREIGN KEY (`codigo_cie10`) REFERENCES `CAT_CIE10` (`codigo`) ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_diagnostico_padre` FOREIGN KEY (`padre_id`) REFERENCES `DETALLE_DIAGNOSTICOS` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Tabla FORM_008_EMERGENCIA
-- Basada en Form008.js pero con el nombre esperado
CREATE TABLE IF NOT EXISTS `FORM_008_EMERGENCIA` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `atencion_emergencia_id` int(11) NOT NULL,
  `presionSistolica` int(11) DEFAULT NULL,
  `presionDiastolica` int(11) DEFAULT NULL,
  `frecuenciaCardiaca` int(11) DEFAULT NULL,
  `temperatura` decimal(5,2) DEFAULT NULL,
  `anamnesis` text DEFAULT NULL,
  `examenFisico` text DEFAULT NULL,
  `diagnosticoPrincipalCie` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_form008_atencion` (`atencion_emergencia_id`),
  CONSTRAINT `fk_form008_atencion` FOREIGN KEY (`atencion_emergencia_id`) REFERENCES `ATENCION_EMERGENCIA` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Tabla CERTIFICADOS_FIRMA
CREATE TABLE IF NOT EXISTS `CERTIFICADOS_FIRMA` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `p12_cifrado` LONGBLOB NOT NULL COMMENT 'Archivo .p12 cifrado con AES-256-GCM',
  `iv` VARBINARY(16) NOT NULL COMMENT 'Vector de inicialización para AES',
  `algoritmo_cifrado` varchar(32) NOT NULL DEFAULT 'aes-256-gcm',
  `nombre_titular` varchar(255) DEFAULT NULL COMMENT 'CN del certificado',
  `ci_titular` varchar(20) DEFAULT NULL COMMENT 'Identificación del titular',
  `entidad_emisora` varchar(255) DEFAULT NULL COMMENT 'Emisor del certificado',
  `fecha_expiracion` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuario` (`usuario_id`),
  CONSTRAINT `fk_certificados_firma_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `USUARIOS_SISTEMA` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Certificados .p12 cifrados para firma electrónica (un certificado por usuario)';

-- 4. Modificaciones a ATENCION_EMERGENCIA
ALTER TABLE `ATENCION_EMERGENCIA` 
  ADD COLUMN IF NOT EXISTS `sello_digital` TEXT NULL COMMENT 'JSON del sello',
  ADD COLUMN IF NOT EXISTS `estado_firma` enum('BORRADOR','PENDIENTE_FIRMA','FINALIZADO_FIRMADO','PENDIENTE','FIRMADO') DEFAULT 'PENDIENTE',
  ADD COLUMN IF NOT EXISTS `usuario_responsable_id` int(11) DEFAULT NULL;

-- Normalizar estado_firma si tiene valores antiguos
-- UPDATE `ATENCION_EMERGENCIA` SET `estado_firma` = 'BORRADOR' WHERE `estado_firma` = 'PENDIENTE';
-- UPDATE `ATENCION_EMERGENCIA` SET `estado_firma` = 'FINALIZADO_FIRMADO' WHERE `estado_firma` = 'FIRMADO';
