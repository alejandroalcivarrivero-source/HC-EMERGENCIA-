-- ========================================================
-- FASE 3: MEJORAS EN LÓGICA DE ESTADOS Y GESTIÓN DE PACIENTES
-- ========================================================
-- Fecha: 2026-01-25
-- Descripción: Agregar columnas para gestión de pacientes ausentes e inactivos
-- Base de Datos: MariaDB
-- ========================================================
-- INSTRUCCIONES:
-- Ejecutar cada comando ALTER TABLE por separado
-- Si aparece error "Duplicate column name" (1060), la columna ya existe (continuar)
-- Si aparece error "Unknown column 'fecha_actualizacion'" (1054), usar la alternativa comentada
-- ========================================================

-- PASO 1: AGREGAR COLUMNA intentos_llamado
-- ========================================================
-- Ejecutar este comando primero:

ALTER TABLE ADMISIONES 
ADD COLUMN intentos_llamado INT DEFAULT 0 
COMMENT 'Número de intentos de llamado al paciente' 
AFTER fecha_actualizacion;

-- Si el comando anterior falló con error 1054 (Unknown column 'fecha_actualizacion'),
-- ejecutar este comando en su lugar (quitar los --):

-- ALTER TABLE ADMISIONES 
-- ADD COLUMN intentos_llamado INT DEFAULT 0 
-- COMMENT 'Número de intentos de llamado al paciente';

-- Si el comando anterior falló con error 1060 (Duplicate column name),
-- significa que la columna ya existe, continuar con el siguiente paso.

-- PASO 2: AGREGAR COLUMNA observacion_cierre
-- ========================================================
-- Ejecutar este comando después del paso 1:

ALTER TABLE ADMISIONES 
ADD COLUMN observacion_cierre TEXT NULL 
COMMENT 'Observación al cerrar la admisión (alta voluntaria, inactividad, etc.)' 
AFTER intentos_llamado;

-- Si el comando anterior falló porque intentos_llamado no existe,
-- ejecutar este comando en su lugar (quitar los --):

-- ALTER TABLE ADMISIONES 
-- ADD COLUMN observacion_cierre TEXT NULL 
-- COMMENT 'Observación al cerrar la admisión (alta voluntaria, inactividad, etc.)';

-- Si el comando anterior falló con error 1060 (Duplicate column name),
-- significa que la columna ya existe, el script está completo.

-- PASO 3: VERIFICACIÓN MANUAL (OPCIONAL)
-- ========================================================
-- Para verificar que las columnas se agregaron correctamente, ejecutar:
-- DESCRIBE ADMISIONES;
-- O:
-- SHOW COLUMNS FROM ADMISIONES LIKE 'intentos_llamado';
-- SHOW COLUMNS FROM ADMISIONES LIKE 'observacion_cierre';
