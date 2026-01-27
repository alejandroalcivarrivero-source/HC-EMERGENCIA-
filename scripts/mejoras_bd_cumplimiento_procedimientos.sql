-- ========================================================
-- MEJORAS ESTRUCTURALES: CUMPLIMIENTO_PROCEDIMIENTOS
-- Sistema de Emergencias - Centro de Salud Chone Tipo C
-- ========================================================
-- IMPORTANTE: Revisar y autorizar antes de ejecutar
-- ========================================================

START TRANSACTION;

-- ====================================
-- MEJORA 1: Agregar campos faltantes en CUMPLIMIENTO_PROCEDIMIENTOS
-- ====================================

-- Verificar que la tabla existe
SELECT 
    'VERIFICACIÓN: Tabla existe' as paso,
    COUNT(*) as existe
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'CUMPLIMIENTO_PROCEDIMIENTOS';

-- Agregar observacion_escalamiento (si no existe)
SELECT 
    'VERIFICACIÓN: Campo observacion_escalamiento' as paso,
    COUNT(*) as existe
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'CUMPLIMIENTO_PROCEDIMIENTOS'
  AND COLUMN_NAME = 'observacion_escalamiento';

-- Si no existe (retorna 0), ejecutar:
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD COLUMN IF NOT EXISTS observacion_escalamiento TEXT NULL 
  COMMENT 'Observación detallada cuando alerta_medica = 1'
  AFTER observacion_hallazgo;

-- Agregar timestamps para auditoría
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD COLUMN IF NOT EXISTS createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ====================================
-- MEJORA 2: Agregar campo en ADMISIONES
-- ====================================

-- Verificar si observacion_escalamiento existe en ADMISIONES
SELECT 
    'VERIFICACIÓN: Campo observacion_escalamiento en ADMISIONES' as paso,
    COUNT(*) as existe
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'ADMISIONES'
  AND COLUMN_NAME = 'observacion_escalamiento';

-- Si no existe (retorna 0), ejecutar:
ALTER TABLE ADMISIONES
ADD COLUMN IF NOT EXISTS observacion_escalamiento TEXT NULL
  COMMENT 'Observación de enfermería al escalar al médico'
  AFTER prioridad_enfermeria;

-- ====================================
-- MEJORA 3: Hacer usuario_enfermeria_id obligatorio
-- ====================================

-- Cambiar de NULL a NOT NULL (auditoría)
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
MODIFY COLUMN usuario_enfermeria_id INT(11) NOT NULL
  COMMENT 'Usuario de enfermería que registra el procedimiento';

-- ====================================
-- MEJORA 4: Agregar índices para performance
-- ====================================

-- Índices en CUMPLIMIENTO_PROCEDIMIENTOS
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD INDEX IF NOT EXISTS idx_admision_id (admision_id),
ADD INDEX IF NOT EXISTS idx_alerta_medica (alerta_medica),
ADD INDEX IF NOT EXISTS idx_fecha_hora (fecha_hora),
ADD INDEX IF NOT EXISTS idx_usuario_enfermeria (usuario_enfermeria_id);

-- Índice en ADMISIONES
ALTER TABLE ADMISIONES
ADD INDEX IF NOT EXISTS idx_prioridad_enfermeria (prioridad_enfermeria);

-- ====================================
-- MEJORA 5: Agregar Foreign Keys (Integridad Referencial)
-- ====================================

-- Verificar que no existan ya
SELECT 
    'VERIFICACIÓN: Foreign Keys existentes' as paso,
    COUNT(*) as total_fks
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'CUMPLIMIENTO_PROCEDIMIENTOS'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Agregar FK solo si no existen
SET @fk_count = (SELECT COUNT(*) 
                 FROM information_schema.KEY_COLUMN_USAGE
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'CUMPLIMIENTO_PROCEDIMIENTOS'
                   AND REFERENCED_TABLE_NAME IS NOT NULL);

-- Si no hay FKs, agregarlas
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD CONSTRAINT fk_cumplimiento_admision 
  FOREIGN KEY (admision_id) REFERENCES ADMISIONES(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD CONSTRAINT fk_cumplimiento_procedimiento 
  FOREIGN KEY (procedimiento_cat_id) REFERENCES CAT_PROCEDIMIENTOS_EMERGENCIA(id)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD CONSTRAINT fk_cumplimiento_usuario 
  FOREIGN KEY (usuario_enfermeria_id) REFERENCES USUARIOS_SISTEMA(id)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ====================================
-- VERIFICACIÓN POST-CAMBIOS
-- ====================================

-- Ver estructura final de CUMPLIMIENTO_PROCEDIMIENTOS
DESCRIBE CUMPLIMIENTO_PROCEDIMIENTOS;

-- Ver campos agregados en ADMISIONES
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'ADMISIONES'
  AND COLUMN_NAME IN ('prioridad_enfermeria', 'observacion_escalamiento');

-- Ver índices creados
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('CUMPLIMIENTO_PROCEDIMIENTOS', 'ADMISIONES')
  AND INDEX_NAME LIKE 'idx_%'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- Ver foreign keys creadas
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
-- FINALIZACIÓN
-- ====================================

-- Si todo está correcto, confirmar cambios:
-- COMMIT;

-- Si algo salió mal, revertir:
-- ROLLBACK;

-- ====================================
-- RESUMEN DE MEJORAS APLICADAS:
-- ====================================
-- ✅ Campo observacion_escalamiento en CUMPLIMIENTO_PROCEDIMIENTOS
-- ✅ Campos createdAt y updatedAt para auditoría
-- ✅ Campo observacion_escalamiento en ADMISIONES
-- ✅ usuario_enfermeria_id como NOT NULL
-- ✅ Índices para mejorar performance
-- ✅ Foreign Keys para integridad referencial
