-- ========================================================
-- FASE 2: RENOMBRAR ESTADO "PREPARADO" A "SIGNOS_VITALES"
-- Sistema de Emergencias - Centro de Salud Chone Tipo C
-- SCRIPT SEGURO: Usa WHERE nombre = 'PREPARADO' (no depende de IDs)
-- ========================================================

-- INICIO DE TRANSACCIÓN (para poder hacer rollback si es necesario)
START TRANSACTION;

-- ========================================================
-- PASO 1: VERIFICACIÓN PREVIA
-- ========================================================

-- Verificar que el estado PREPARADO existe
SELECT 
    'VERIFICACIÓN: Estado PREPARADO existe' as paso,
    id, 
    nombre, 
    createdAt, 
    updatedAt 
FROM CAT_ESTADO_PACIENTE 
WHERE nombre = 'PREPARADO';

-- Verificar que SIGNOS_VITALES NO existe ya (evitar duplicados)
SELECT 
    'VERIFICACIÓN: Estado SIGNOS_VITALES no debe existir' as paso,
    COUNT(*) as existe 
FROM CAT_ESTADO_PACIENTE 
WHERE nombre = 'SIGNOS_VITALES';
-- Si existe > 0, NO continuar con el script

-- ========================================================
-- PASO 2: IMPACTO DEL CAMBIO
-- ========================================================

-- Contar admisiones afectadas
SELECT 
    'IMPACTO: Admisiones con estado PREPARADO' as paso,
    COUNT(*) as total_admisiones,
    MIN(fecha_hora_admision) as admision_mas_antigua,
    MAX(fecha_hora_admision) as admision_mas_reciente
FROM ADMISIONES a
JOIN CAT_ESTADO_PACIENTE e ON a.estado_paciente_id = e.id
WHERE e.nombre = 'PREPARADO';

-- Contar registros de atención afectados
SELECT 
    'IMPACTO: Registros de atención con estado PREPARADO' as paso,
    COUNT(*) as total_registros,
    MIN(createdAt) as registro_mas_antiguo,
    MAX(createdAt) as registro_mas_reciente
FROM ATENCION_PACIENTE_ESTADO
WHERE estado_id = (SELECT id FROM CAT_ESTADO_PACIENTE WHERE nombre = 'PREPARADO');

-- ========================================================
-- PASO 3: BACKUP DE SEGURIDAD
-- ========================================================

-- Crear tabla temporal de respaldo (solo si no existe)
CREATE TABLE IF NOT EXISTS BACKUP_CAT_ESTADO_PACIENTE_20260124 AS
SELECT * FROM CAT_ESTADO_PACIENTE WHERE nombre = 'PREPARADO';

SELECT 
    'BACKUP: Respaldo creado en BACKUP_CAT_ESTADO_PACIENTE_20260124' as paso,
    COUNT(*) as registros_respaldados 
FROM BACKUP_CAT_ESTADO_PACIENTE_20260124;

-- ========================================================
-- PASO 4: EJECUCIÓN DEL CAMBIO
-- ========================================================

-- Actualizar el nombre del estado (usando WHERE nombre, NO WHERE id)
UPDATE CAT_ESTADO_PACIENTE 
SET 
    nombre = 'SIGNOS_VITALES',
    updatedAt = CURRENT_TIMESTAMP
WHERE nombre = 'PREPARADO'
  AND nombre != 'SIGNOS_VITALES'; -- Doble verificación de seguridad

-- Verificar cuántos registros se actualizaron
SELECT 
    'RESULTADO: Registros actualizados' as paso,
    ROW_COUNT() as filas_afectadas;

-- ========================================================
-- PASO 5: VERIFICACIÓN POST-CAMBIO
-- ========================================================

-- Verificar que PREPARADO ya no existe
SELECT 
    'VERIFICACIÓN POST: Estado PREPARADO no debe existir' as paso,
    COUNT(*) as debe_ser_cero 
FROM CAT_ESTADO_PACIENTE 
WHERE nombre = 'PREPARADO';

-- Verificar que SIGNOS_VITALES existe con el ID correcto
SELECT 
    'VERIFICACIÓN POST: Estado SIGNOS_VITALES creado correctamente' as paso,
    id, 
    nombre, 
    createdAt, 
    updatedAt 
FROM CAT_ESTADO_PACIENTE 
WHERE nombre = 'SIGNOS_VITALES';

-- Verificar integridad de relaciones
SELECT 
    'VERIFICACIÓN POST: Admisiones con SIGNOS_VITALES' as paso,
    COUNT(*) as total_admisiones
FROM ADMISIONES a
JOIN CAT_ESTADO_PACIENTE e ON a.estado_paciente_id = e.id
WHERE e.nombre = 'SIGNOS_VITALES';

SELECT 
    'VERIFICACIÓN POST: Atenciones con SIGNOS_VITALES' as paso,
    COUNT(*) as total_atenciones
FROM ATENCION_PACIENTE_ESTADO ape
JOIN CAT_ESTADO_PACIENTE e ON ape.estado_id = e.id
WHERE e.nombre = 'SIGNOS_VITALES';

-- ========================================================
-- PASO 6: MUESTRA DE REGISTROS AFECTADOS
-- ========================================================

-- Mostrar las primeras 5 admisiones con el nuevo estado
SELECT 
    'MUESTRA: Primeras admisiones con SIGNOS_VITALES' as info,
    a.id as admision_id,
    p.primer_nombre,
    p.primer_apellido,
    e.nombre as estado,
    a.fecha_hora_admision
FROM ADMISIONES a
JOIN PACIENTES p ON a.paciente_id = p.id
JOIN CAT_ESTADO_PACIENTE e ON a.estado_paciente_id = e.id
WHERE e.nombre = 'SIGNOS_VITALES'
ORDER BY a.fecha_hora_admision DESC
LIMIT 5;

-- ========================================================
-- FINALIZACIÓN
-- ========================================================

-- Si todo está correcto, confirmar la transacción
-- COMMIT;

-- Si algo salió mal, revertir cambios
-- ROLLBACK;

-- ========================================================
-- INSTRUCCIONES DE USO:
-- ========================================================
-- 1. Ejecutar este script COMPLETO en tu gestor de BD
-- 2. Revisar TODAS las verificaciones en los resultados
-- 3. Si todo está correcto: ejecutar COMMIT;
-- 4. Si algo salió mal: ejecutar ROLLBACK;
-- 5. Para restaurar desde backup (solo en emergencia):
--    UPDATE CAT_ESTADO_PACIENTE 
--    SET nombre = (SELECT nombre FROM BACKUP_CAT_ESTADO_PACIENTE_20260124 LIMIT 1)
--    WHERE nombre = 'SIGNOS_VITALES';

-- ========================================================
-- LIMPIEZA DE BACKUP (ejecutar solo cuando estés 100% seguro)
-- ========================================================
-- DROP TABLE IF EXISTS BACKUP_CAT_ESTADO_PACIENTE_20260124;
