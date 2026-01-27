-- ========================================================
-- VERIFICACIÓN FASE 2: MÓDULO DE PROCEDIMIENTOS Y ESCALAMIENTO
-- Sistema de Emergencias - Centro de Salud Chone Tipo C
-- ========================================================

-- ====================================
-- PASO 1: Verificar tabla CUMPLIMIENTO_PROCEDIMIENTOS
-- ====================================

SELECT 
    'VERIFICACIÓN: Tabla CUMPLIMIENTO_PROCEDIMIENTOS' as paso,
    COUNT(*) as existe
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'CUMPLIMIENTO_PROCEDIMIENTOS';
-- Debe retornar 1

-- Ver estructura de la tabla
DESCRIBE CUMPLIMIENTO_PROCEDIMIENTOS;

-- Campos esperados:
-- - id (INT, PK, AUTO_INCREMENT)
-- - admision_id (INT)
-- - procedimiento_id (INT)
-- - usuario_id (INT)
-- - fecha_hora_registro (DATETIME)
-- - observaciones (TEXT)
-- - requiere_valoracion_medica (TINYINT)
-- - observacion_escalamiento (TEXT)
-- - createdAt (DATETIME)
-- - updatedAt (DATETIME)

-- ====================================
-- PASO 2: Verificar campos en tabla ADMISIONES
-- ====================================

-- Verificar que exista el campo prioridad_enfermeria
SELECT 
    'VERIFICACIÓN: Campo prioridad_enfermeria en ADMISIONES' as paso,
    COUNT(*) as existe
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'ADMISIONES'
  AND COLUMN_NAME = 'prioridad_enfermeria';
-- Debe retornar 1

-- Verificar que exista el campo observacion_escalamiento
SELECT 
    'VERIFICACIÓN: Campo observacion_escalamiento en ADMISIONES' as paso,
    COUNT(*) as existe
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'ADMISIONES'
  AND COLUMN_NAME = 'observacion_escalamiento';
-- Debe retornar 1

-- Ver estructura actual de ADMISIONES (campos relevantes)
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'ADMISIONES'
  AND COLUMN_NAME IN ('prioridad_enfermeria', 'observacion_escalamiento');

-- ====================================
-- PASO 3: Verificar datos existentes
-- ====================================

-- Contar registros actuales en CUMPLIMIENTO_PROCEDIMIENTOS
SELECT 
    'DATOS: Registros en CUMPLIMIENTO_PROCEDIMIENTOS' as paso,
    COUNT(*) as total_registros
FROM CUMPLIMIENTO_PROCEDIMIENTOS;

-- Contar admisiones con prioridad de enfermería activa
SELECT 
    'DATOS: Admisiones con prioridad de enfermería' as paso,
    COUNT(*) as total_escaladas
FROM ADMISIONES
WHERE prioridad_enfermeria = 1;

-- Mostrar admisiones escaladas (si existen)
SELECT 
    a.id as admision_id,
    p.primer_nombre,
    p.primer_apellido,
    a.prioridad_enfermeria,
    a.observacion_escalamiento,
    a.fecha_hora_admision
FROM ADMISIONES a
JOIN PACIENTES p ON a.paciente_id = p.id
WHERE a.prioridad_enfermeria = 1
ORDER BY a.fecha_hora_admision DESC
LIMIT 10;

-- ====================================
-- PASO 4: Verificar tabla CAT_PROCEDIMIENTOS_EMERGENCIA
-- ====================================

SELECT 
    'VERIFICACIÓN: Tabla CAT_PROCEDIMIENTOS_EMERGENCIA' as paso,
    COUNT(*) as total_procedimientos
FROM CAT_PROCEDIMIENTOS_EMERGENCIA;
-- Debe tener procedimientos registrados

-- Mostrar los procedimientos disponibles
SELECT 
    id,
    nombre,
    activo
FROM CAT_PROCEDIMIENTOS_EMERGENCIA
WHERE activo = 1
ORDER BY nombre;

-- ====================================
-- PASO 5: Verificar relaciones (Foreign Keys)
-- ====================================

SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'CUMPLIMIENTO_PROCEDIMIENTOS'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- ====================================
-- RESULTADO ESPERADO
-- ====================================
-- ✅ Tabla CUMPLIMIENTO_PROCEDIMIENTOS existe
-- ✅ Campo prioridad_enfermeria existe en ADMISIONES
-- ✅ Campo observacion_escalamiento existe en ADMISIONES
-- ✅ CAT_PROCEDIMIENTOS_EMERGENCIA tiene procedimientos activos
-- ✅ Foreign keys están configuradas correctamente

-- ====================================
-- NOTA: Si alguna verificación falla, consulta con el administrador
-- antes de continuar con el reinicio de servicios.
-- ====================================
