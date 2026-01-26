-- ========================================================
-- MEJORAS MÍNIMAS: CUMPLIMIENTO_PROCEDIMIENTOS Y ADMISIONES
-- Script ULTRA SIMPLE para ejecutar sin verificaciones previas
-- ========================================================

-- IMPORTANTE: Si un campo ya existe, verás error "Duplicate column name"
-- Eso es NORMAL y puedes ignorarlo. Solo ejecuta los siguientes comandos.

-- ====================================
-- 1. Agregar campos esenciales
-- ====================================

-- En CUMPLIMIENTO_PROCEDIMIENTOS
ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD COLUMN observacion_escalamiento TEXT NULL;

ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE CUMPLIMIENTO_PROCEDIMIENTOS
ADD COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- En ADMISIONES
ALTER TABLE ADMISIONES
ADD COLUMN observacion_escalamiento TEXT NULL;

-- ====================================
-- 2. Agregar índices básicos
-- ====================================

CREATE INDEX idx_admision_id ON CUMPLIMIENTO_PROCEDIMIENTOS(admision_id);
CREATE INDEX idx_alerta_medica ON CUMPLIMIENTO_PROCEDIMIENTOS(alerta_medica);
CREATE INDEX idx_prioridad_enfermeria ON ADMISIONES(prioridad_enfermeria);

-- ====================================
-- 3. Verificar resultados
-- ====================================

DESCRIBE CUMPLIMIENTO_PROCEDIMIENTOS;
DESCRIBE ADMISIONES;

-- ====================================
-- FIN
-- ====================================
-- Si ves errores de "Duplicate", ignóralos y continúa.
-- Usa DESCRIBE para verificar que los campos existen.
