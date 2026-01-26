-- Script para agregar la columna usuario_responsable_id a la tabla ATENCION_EMERGENCIA
-- Esta columna es necesaria para el sistema de gestión de atenciones pendientes

ALTER TABLE `ATENCION_EMERGENCIA` 
ADD COLUMN `usuario_responsable_id` INT(11) NULL DEFAULT NULL AFTER `usuarioId`,
ADD INDEX `idx_usuario_responsable` (`usuario_responsable_id`),
ADD CONSTRAINT `fk_atencion_usuario_responsable` 
  FOREIGN KEY (`usuario_responsable_id`) 
  REFERENCES `USUARIOS_SISTEMA` (`id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Verificar que la columna se creó correctamente
DESCRIBE ATENCION_EMERGENCIA;
