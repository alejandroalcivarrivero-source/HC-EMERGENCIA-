-- ========================================================
-- SISTEMA DE ANULACIÓN DE PROCEDIMIENTOS
-- Sistema de Emergencias - Centro de Salud Chone Tipo C
-- Estándar Médico-Legal: Los registros NO se eliminan, se anulan
-- ========================================================

START TRANSACTION;

-- ====================================
-- PASO 1: AGREGAR CAMPOS DE ANULACIÓN
-- ====================================

-- Campo estado (ACTIVO o ANULADO)
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD COLUMN estado ENUM('ACTIVO', 'ANULADO') NOT NULL DEFAULT 'ACTIVO'
  COMMENT 'Estado del registro: ACTIVO o ANULADO'
  AFTER observacion_escalamiento;

-- Campo: Usuario que anuló
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD COLUMN anulado_por_usuario_id INT(11) NULL
  COMMENT 'ID del usuario que anuló el registro'
  AFTER estado;

-- Campo: Fecha de anulación
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD COLUMN fecha_anulacion DATETIME NULL
  COMMENT 'Fecha y hora en que se anuló el registro'
  AFTER anulado_por_usuario_id;

-- Campo: Razón de la anulación
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD COLUMN razon_anulacion TEXT NULL
  COMMENT 'Motivo por el cual se anuló el registro'
  AFTER fecha_anulacion;

-- ====================================
-- PASO 2: AGREGAR FOREIGN KEY
-- ====================================

-- FK para usuario que anuló
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD CONSTRAINT fk_cumplimiento_anulado_por
  FOREIGN KEY (anulado_por_usuario_id) REFERENCES USUARIOS_SISTEMA(id)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ====================================
-- PASO 3: AGREGAR ÍNDICES
-- ====================================

-- Índice en estado para filtrar rápidamente activos/anulados
CREATE INDEX idx_estado ON CUMPLIMIENTO_PROCEDIMIENTOS(estado);

-- Índice compuesto: admision + estado (para consultas frecuentes)
CREATE INDEX idx_admision_estado ON CUMPLIMIENTO_PROCEDIMIENTOS(admision_id, estado);

-- ====================================
-- PASO 4: VERIFICACIÓN
-- ====================================

-- Ver estructura actualizada
DESCRIBE CUMPLIMIENTO_PROCEDIMIENTOS;

-- Ver campos agregados específicamente
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'CUMPLIMIENTO_PROCEDIMIENTOS'
  AND COLUMN_NAME IN ('estado', 'anulado_por_usuario_id', 'fecha_anulacion', 'razon_anulacion');

-- Ver índices creados
SHOW INDEX FROM CUMPLIMIENTO_PROCEDIMIENTOS;

-- ====================================
-- PASO 5: ACTUALIZAR REGISTROS EXISTENTES (SI HAY)
-- ====================================

-- Marcar todos los registros existentes como ACTIVO
UPDATE CUMPLIMIENTO_PROCEDIMIENTOS
SET estado = 'ACTIVO'
WHERE estado IS NULL OR estado = '';

-- Verificar
SELECT 
    estado,
    COUNT(*) as total
FROM CUMPLIMIENTO_PROCEDIMIENTOS
GROUP BY estado;

-- ====================================
-- FINALIZACIÓN
-- ====================================

-- Si todo está correcto:
COMMIT;

-- Si algo salió mal:
-- ROLLBACK;

-- ====================================
-- RESULTADO ESPERADO:
-- ====================================
-- ✅ Campo `estado` agregado (ENUM: ACTIVO, ANULADO)
-- ✅ Campo `anulado_por_usuario_id` agregado
-- ✅ Campo `fecha_anulacion` agregado
-- ✅ Campo `razon_anulacion` agregado
-- ✅ Foreign key para auditoría del usuario
-- ✅ Índices para performance
-- ✅ Todos los registros existentes marcados como ACTIVO

-- ====================================
-- EJEMPLO DE USO:
-- ====================================
-- Para ANULAR un procedimiento (nunca DELETE):
/*
UPDATE CUMPLIMIENTO_PROCEDIMIENTOS
SET estado = 'ANULADO',
    anulado_por_usuario_id = [ID_USUARIO],
    fecha_anulacion = NOW(),
    razon_anulacion = 'Error en la selección del procedimiento'
WHERE id = [ID_PROCEDIMIENTO];
*/
