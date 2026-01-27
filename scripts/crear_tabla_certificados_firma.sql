-- Certificados de firma electrónica por usuario (.p12 cifrado AES-256)
-- La contraseña del certificado NUNCA se almacena (cumplimiento normativo).
-- Uso: Ajustes > Firma Electrónica (carga) y flujo de firma (descifrado en memoria solo al firmar).
--
-- Ejecutar una sola vez. Si sello_digital ya existe en ATENCION_EMERGENCIA, omitir el ALTER final
-- o ejecutar solo la parte de CREATE TABLE.

-- Tabla de certificados por usuario (uno activo por usuario)
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

-- Columna para almacenar el sello digital en la atención (Form 008 / evolución)
-- El PDF lee este JSON para insertar la firma en formato legal MSP
-- Ejecutar solo si la columna aún no existe (evitar error "Duplicate column").
ALTER TABLE `ATENCION_EMERGENCIA`
  ADD COLUMN `sello_digital` TEXT NULL
  COMMENT 'JSON del sello: {nombre, ci, entidadEmisora, fechaFirma, digestBase64, algoritmo}'
  AFTER `estado_firma`;
