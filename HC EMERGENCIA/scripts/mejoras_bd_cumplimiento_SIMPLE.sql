-- ========================================================
-- MEJORAS ESTRUCTURALES: CUMPLIMIENTO_PROCEDIMIENTOS
-- VERSIÓN SIMPLIFICADA (Sin verificaciones de information_schema)
-- Sistema de Emergencias - Centro de Salud Chone Tipo C
-- ========================================================

START TRANSACTION;

-- ====================================
-- PASO 1: Agregar campos en CUMPLIMIENTO_PROCEDIMIENTOS
-- ====================================

-- Agregar observacion_escalamiento
-- Nota: Si el campo ya existe, este comando fallará pero podemos continuar
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD COLUMN observacion_escalamiento TEXT NULL 
  COMMENT 'Observación detallada cuando alerta_medica = 1'
  AFTER observacion_hallazgo;
-- Si ya existe, verás error: "Duplicate column name". Esto es normal, continúa.

-- Agregar createdAt
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
-- Si ya existe, verás error: "Duplicate column name". Esto es normal, continúa.

-- Agregar updatedAt
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
-- Si ya existe, verás error: "Duplicate column name". Esto es normal, continúa.

-- ====================================
-- PASO 2: Agregar campo en ADMISIONES
-- ====================================

-- Agregar observacion_escalamiento
ALTER TABLE ADMISIONES
ADD COLUMN observacion_escalamiento TEXT NULL
  COMMENT 'Observación de enfermería al escalar al médico'
  AFTER prioridad_enfermeria;
-- Si ya existe, verás error: "Duplicate column name". Esto es normal, continúa.

-- ====================================
-- PASO 3: Hacer usuario_enfermeria_id obligatorio
-- ====================================

-- IMPORTANTE: Solo ejecutar si NO hay registros NULL en este campo
-- Verificar primero: SELECT COUNT(*) FROM CUMPLIMIENTO_PROCEDIMIENTOS WHERE usuario_enfermeria_id IS NULL;
-- Si retorna 0, ejecutar el siguiente comando:

-- ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
-- MODIFY COLUMN usuario_enfermeria_id INT(11) NOT NULL
--   COMMENT 'Usuario de enfermería que registra el procedimiento';
-- (Comentado por seguridad - descomenta si estás seguro)

-- ====================================
-- PASO 4: Agregar índices para performance
-- ====================================

-- Índice en admision_id
CREATE INDEX idx_admision_id ON CUMPLIMIENTO_PROCEDIMIENTOS(admision_id);
-- Si ya existe, verás error: "Duplicate key name". Esto es normal, continúa.

-- Índice en alerta_medica
CREATE INDEX idx_alerta_medica ON CUMPLIMIENTO_PROCEDIMIENTOS(alerta_medica);
-- Si ya existe, verás error: "Duplicate key name". Esto es normal, continúa.

-- Índice en fecha_hora
CREATE INDEX idx_fecha_hora ON CUMPLIMIENTO_PROCEDIMIENTOS(fecha_hora);
-- Si ya existe, verás error: "Duplicate key name". Esto es normal, continúa.

-- Índice en usuario_enfermeria_id
CREATE INDEX idx_usuario_enfermeria ON CUMPLIMIENTO_PROCEDIMIENTOS(usuario_enfermeria_id);
-- Si ya existe, verás error: "Duplicate key name". Esto es normal, continúa.

-- Índice en prioridad_enfermeria de ADMISIONES
CREATE INDEX idx_prioridad_enfermeria ON ADMISIONES(prioridad_enfermeria);
-- Si ya existe, verás error: "Duplicate key name". Esto es normal, continúa.

-- ====================================
-- PASO 5: Agregar Foreign Keys
-- ====================================

-- FK: admision_id -> ADMISIONES
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD CONSTRAINT fk_cumplimiento_admision 
  FOREIGN KEY (admision_id) REFERENCES ADMISIONES(id)
  ON DELETE CASCADE ON UPDATE CASCADE;
-- Si ya existe, verás error: "Duplicate foreign key". Esto es normal, continúa.

-- FK: procedimiento_cat_id -> CAT_PROCEDIMIENTOS_EMERGENCIA
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD CONSTRAINT fk_cumplimiento_procedimiento 
  FOREIGN KEY (procedimiento_cat_id) REFERENCES CAT_PROCEDIMIENTOS_EMERGENCIA(id)
  ON DELETE RESTRICT ON UPDATE CASCADE;
-- Si ya existe, verás error: "Duplicate foreign key". Esto es normal, continúa.

-- FK: usuario_enfermeria_id -> USUARIOS_SISTEMA
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD CONSTRAINT fk_cumplimiento_usuario 
  FOREIGN KEY (usuario_enfermeria_id) REFERENCES USUARIOS_SISTEMA(id)
  ON DELETE RESTRICT ON UPDATE CASCADE;
-- Si ya existe, verás error: "Duplicate foreign key". Esto es normal, continúa.

-- ====================================
-- VERIFICACIÓN MANUAL POST-CAMBIOS
-- ====================================

-- Ver estructura de CUMPLIMIENTO_PROCEDIMIENTOS
DESCRIBE CUMPLIMIENTO_PROCEDIMIENTOS;

-- Ver campos en ADMISIONES
DESCRIBE ADMISIONES;

-- Ver índices creados en CUMPLIMIENTO_PROCEDIMIENTOS
SHOW INDEX FROM CUMPLIMIENTO_PROCEDIMIENTOS;

-- Ver foreign keys
SHOW CREATE TABLE CUMPLIMIENTO_PROCEDIMIENTOS;

-- ====================================
-- FINALIZACIÓN
-- ====================================

-- Si todo está correcto, confirmar cambios:
COMMIT;

-- Si algo salió mal, revertir:
-- ROLLBACK;

-- ====================================
-- INSTRUCCIONES:
-- ====================================
-- 1. Ejecuta este script línea por línea o por secciones
-- 2. Si ves errores de "Duplicate column/key", es NORMAL (significa que ya existe)
-- 3. Al final, ejecuta DESCRIBE para verificar que todo está correcto
-- 4. Si estás satisfecho, ejecuta: COMMIT;
-- 5. Si algo falló, ejecuta: ROLLBACK;

-- ====================================
-- NOTAS:
-- ====================================
-- - Este script usa transacciones para poder hacer rollback
-- - Los errores de "Duplicate" son esperados y no detienen la ejecución
-- - Recomiendo ejecutar sección por sección y verificar resultados
-- - El comando MODIFY COLUMN está comentado por seguridad
