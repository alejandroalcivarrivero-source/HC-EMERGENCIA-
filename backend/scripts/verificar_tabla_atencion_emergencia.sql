-- Script para verificar la estructura de la tabla ATENCION_EMERGENCIA
-- Ejecutar este script en tu cliente de MariaDB/MySQL para ver las columnas reales

-- Ver estructura completa de la tabla
DESCRIBE ATENCION_EMERGENCIA;

-- O usar esta query alternativa:
-- SHOW COLUMNS FROM ATENCION_EMERGENCIA;

-- Verificar si existe la columna usuario_responsable_id
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'ATENCION_EMERGENCIA'
ORDER BY ORDINAL_POSITION;
