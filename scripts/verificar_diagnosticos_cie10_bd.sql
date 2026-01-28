-- =============================================================================
-- Verificación: módulo Diagnósticos CIE-10 — tablas y columnas necesarias
-- Ejecutar EN LA PESTAÑA SQL de la base EMERGENCIA (elegir "EMERGENCIA" en el panel
-- izquierdo antes de ejecutar). En algunos servidores TABLE_SCHEMA viene en
-- minúsculas; por eso se usa comparación insensible a mayúsculas.
-- =============================================================================

-- 0) Base de datos actual (debe coincidir con DB_NAME del backend, ej. EMERGENCIA)
SELECT DATABASE() AS base_de_datos_actual;

-- 0b) Diagnóstico: listar tablas de la base actual (nombres exactos en el servidor)
SELECT TABLE_NAME AS nombre_tabla
FROM information_schema.TABLES
WHERE LOWER(TABLE_SCHEMA) = LOWER(COALESCE(DATABASE(), ''))
ORDER BY TABLE_NAME;

-- 1) Tabla ATENCION_EMERGENCIA
SELECT 'ATENCION_EMERGENCIA' AS tabla,
       IF(COUNT(*) > 0, 'OK', 'FALTA') AS estado
FROM information_schema.TABLES
WHERE LOWER(TABLE_SCHEMA) = LOWER(COALESCE(DATABASE(), ''))
  AND LOWER(TABLE_NAME) IN ('atencion_emergencia');

-- 2) Tabla DETALLE_DIAGNOSTICOS
SELECT 'DETALLE_DIAGNOSTICOS' AS tabla,
       IF(COUNT(*) > 0, 'OK', 'FALTA') AS estado
FROM information_schema.TABLES
WHERE LOWER(TABLE_SCHEMA) = LOWER(COALESCE(DATABASE(), ''))
  AND LOWER(TABLE_NAME) IN ('detalle_diagnosticos');

-- 3) Catálogo CIE-10
SELECT 'CAT_CIE10' AS tabla,
       IF(COUNT(*) > 0, 'OK', 'FALTA') AS estado
FROM information_schema.TABLES
WHERE LOWER(TABLE_SCHEMA) = LOWER(COALESCE(DATABASE(), ''))
  AND LOWER(TABLE_NAME) IN ('cat_cie10');

-- 4) Columnas en DETALLE_DIAGNOSTICOS (solo si la tabla existe)
SELECT c.COLUMN_NAME, c.DATA_TYPE, c.IS_NULLABLE, c.COLUMN_DEFAULT
FROM information_schema.COLUMNS c
WHERE LOWER(c.TABLE_SCHEMA) = LOWER(COALESCE(DATABASE(), ''))
  AND LOWER(c.TABLE_NAME) = 'detalle_diagnosticos'
ORDER BY c.ORDINAL_POSITION;

-- 5) Columnas requeridas por el módulo CIE-10 (padre_id, es_causa_externa, tipo_diagnostico con ESTADISTICO)
SELECT
  (SELECT COUNT(*) FROM information_schema.COLUMNS cc
   WHERE LOWER(cc.TABLE_SCHEMA) = LOWER(COALESCE(DATABASE(),'')) AND LOWER(cc.TABLE_NAME) = 'detalle_diagnosticos' AND cc.COLUMN_NAME = 'padre_id') AS tiene_padre_id,
  (SELECT COUNT(*) FROM information_schema.COLUMNS cc
   WHERE LOWER(cc.TABLE_SCHEMA) = LOWER(COALESCE(DATABASE(),'')) AND LOWER(cc.TABLE_NAME) = 'detalle_diagnosticos' AND cc.COLUMN_NAME = 'es_causa_externa') AS tiene_es_causa_externa,
  (SELECT cc.COLUMN_TYPE FROM information_schema.COLUMNS cc
   WHERE LOWER(cc.TABLE_SCHEMA) = LOWER(COALESCE(DATABASE(),'')) AND LOWER(cc.TABLE_NAME) = 'detalle_diagnosticos' AND cc.COLUMN_NAME = 'tipo_diagnostico' LIMIT 1) AS tipo_diagnostico_enum;

-- 6) Vista v_cie10_completo (opcional)
SELECT 'v_cie10_completo' AS objeto,
       IF(COUNT(*) > 0, 'OK', 'OPCIONAL') AS estado
FROM information_schema.VIEWS
WHERE LOWER(TABLE_SCHEMA) = LOWER(COALESCE(DATABASE(), ''))
  AND LOWER(TABLE_NAME) = 'v_cie10_completo';

-- Resumen: si las tablas marcan FALTA, ver docs/CHECKLIST_BD_DIAGNOSTICOS_CIE10.md y
-- docs/SI_VERIFICACION_MARCA_FALTA.md
