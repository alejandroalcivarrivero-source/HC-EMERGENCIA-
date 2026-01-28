-- =============================================================================
-- Migración: DROP y recrear DETALLE_DIAGNOSTICOS y LOG_REASIGNACIONES_MEDICAS
-- Datos de prueba únicamente. Ejecutar luego:
--   1. backend/scripts/create_tables_formulario008.sql
--   2. scripts/diagnosticos_form008_seccion_lm.sql
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS DETALLE_DIAGNOSTICOS;
DROP TABLE IF EXISTS LOG_REASIGNACIONES_MEDICAS;

SET FOREIGN_KEY_CHECKS = 1;
