-- ========================================================
-- DEPRECACIÓN DE TABLA PROCEDIMIENTOS_EMERGENCIA
-- Sistema de Emergencias - Centro de Salud Chone Tipo C
-- ========================================================
-- IMPORTANTE: Ejecutar solo en ambiente de PRUEBAS
-- ========================================================

START TRANSACTION;

-- ====================================
-- PASO 1: VERIFICAR DATOS EXISTENTES
-- ====================================

-- Ver cuántos registros hay en la tabla antigua
SELECT 
    'VERIFICACIÓN: Registros en PROCEDIMIENTOS_EMERGENCIA' as paso,
    COUNT(*) as total_registros
FROM PROCEDIMIENTOS_EMERGENCIA;

-- Ver registros de los últimos 7 días (por si acaso)
SELECT * FROM PROCEDIMIENTOS_EMERGENCIA
WHERE horaRealizacion >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY horaRealizacion DESC;

-- ====================================
-- PASO 2: BACKUP DE SEGURIDAD (OPCIONAL)
-- ====================================

-- Crear tabla de respaldo antes de eliminar
CREATE TABLE IF NOT EXISTS PROCEDIMIENTOS_EMERGENCIA_BACKUP_20260125 AS
SELECT * FROM PROCEDIMIENTOS_EMERGENCIA;

SELECT 
    'BACKUP: Registros respaldados' as paso,
    COUNT(*) as total
FROM PROCEDIMIENTOS_EMERGENCIA_BACKUP_20260125;

-- ====================================
-- PASO 3: OPCIÓN A - RENOMBRAR (RECOMENDADO)
-- ====================================
-- Mantener la tabla para consulta histórica pero inactiva

RENAME TABLE PROCEDIMIENTOS_EMERGENCIA TO PROCEDIMIENTOS_EMERGENCIA_HISTORICO;

-- Verificar
SHOW TABLES LIKE 'PROCEDIMIENTOS_EMERGENCIA%';

-- ====================================
-- PASO 3: OPCIÓN B - ELIMINAR COMPLETAMENTE
-- ====================================
-- Solo si estás 100% seguro de que no necesitas los datos

-- DROP TABLE IF EXISTS PROCEDIMIENTOS_EMERGENCIA;

-- ====================================
-- PASO 4: VERIFICAR QUE CUMPLIMIENTO_PROCEDIMIENTOS ESTÁ LISTA
-- ====================================

-- Ver estructura de la tabla que usaremos
DESCRIBE CUMPLIMIENTO_PROCEDIMIENTOS;

-- Ver registros actuales
SELECT COUNT(*) as total FROM CUMPLIMIENTO_PROCEDIMIENTOS;

-- ====================================
-- FINALIZACIÓN
-- ====================================

-- Si todo está correcto:
COMMIT;

-- Si algo salió mal:
-- ROLLBACK;

-- ====================================
-- INSTRUCCIONES:
-- ====================================
-- 1. Revisar cuántos registros hay en PROCEDIMIENTOS_EMERGENCIA
-- 2. Si hay datos importantes, se creó un backup automático
-- 3. OPCIÓN A (Recomendada): RENAME TABLE para mantener historial
-- 4. OPCIÓN B (Solo si estás seguro): DROP TABLE para eliminar
-- 5. Ejecutar COMMIT si todo está bien
-- 6. Verificar con: SHOW TABLES LIKE 'PROCEDIMIENTOS%';

-- ====================================
-- PARA RESTAURAR (solo en emergencia):
-- ====================================
-- RENAME TABLE PROCEDIMIENTOS_EMERGENCIA_HISTORICO TO PROCEDIMIENTOS_EMERGENCIA;
-- O restaurar desde backup:
-- DROP TABLE IF EXISTS PROCEDIMIENTOS_EMERGENCIA;
-- RENAME TABLE PROCEDIMIENTOS_EMERGENCIA_BACKUP_20260125 TO PROCEDIMIENTOS_EMERGENCIA;
