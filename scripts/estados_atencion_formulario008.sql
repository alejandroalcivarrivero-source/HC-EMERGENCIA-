-- Ciclo de vida del Formulario 008: BORRADOR → PENDIENTE_FIRMA → FINALIZADO_FIRMADO
-- Ejecutar después de crear_tabla_certificados_firma.sql si aplica.
-- Migra estado_firma de (PENDIENTE|FIRMADO) a (BORRADOR|PENDIENTE_FIRMA|FINALIZADO_FIRMADO).

-- 1) Cambiar tipo de columna y migrar datos
-- En MySQL/MariaDB hay que usar un proceso en dos pasos si ya hay datos.

-- Paso A: agregar columna temporal con nuevos valores
ALTER TABLE `ATENCION_EMERGENCIA`
  ADD COLUMN `estado_firma_nuevo` ENUM('BORRADOR','PENDIENTE_FIRMA','FINALIZADO_FIRMADO') NULL
  AFTER `estado_firma`;

-- Paso B: migrar valores (PENDIENTE → BORRADOR, FIRMADO → FINALIZADO_FIRMADO)
UPDATE `ATENCION_EMERGENCIA`
  SET `estado_firma_nuevo` = CASE
    WHEN `estado_firma` = 'FIRMADO' THEN 'FINALIZADO_FIRMADO'
    ELSE 'BORRADOR'
  END;

-- Paso C: eliminar columna antigua y renombrar la nueva
ALTER TABLE `ATENCION_EMERGENCIA`
  DROP COLUMN `estado_firma`,
  CHANGE COLUMN `estado_firma_nuevo` `estado_firma` ENUM('BORRADOR','PENDIENTE_FIRMA','FINALIZADO_FIRMADO') NOT NULL DEFAULT 'BORRADOR';

-- Si prefieres no usar columna temporal (tabla vacía o sin datos críticos):
-- ALTER TABLE `ATENCION_EMERGENCIA`
--   MODIFY COLUMN `estado_firma` ENUM('BORRADOR','PENDIENTE_FIRMA','FINALIZADO_FIRMADO') NOT NULL DEFAULT 'BORRADOR';
-- UPDATE `ATENCION_EMERGENCIA` SET `estado_firma` = 'FINALIZADO_FIRMADO' WHERE `estado_firma` = 'FIRMADO';
-- (lo anterior falla si la columna sigue siendo ENUM('PENDIENTE','FIRMADO'), por eso se usa el proceso en 3 pasos)
