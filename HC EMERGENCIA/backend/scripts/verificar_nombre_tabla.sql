-- Script para verificar el nombre real de la tabla y su estructura
-- Ejecutar estos comandos uno por uno

-- 1. Primero, verificar qué base de datos estás usando
SELECT DATABASE();

-- 2. Listar todas las tablas que contengan "atencion" o "emergencia" en el nombre
SHOW TABLES LIKE '%atencion%';
SHOW TABLES LIKE '%emergencia%';
SHOW TABLES LIKE '%ATENCION%';
SHOW TABLES LIKE '%EMERGENCIA%';

-- 3. Una vez que identifiques el nombre correcto de la tabla, ejecuta:
-- DESCRIBE [nombre_real_de_la_tabla];

-- Por ejemplo, si la tabla se llama "atencion_emergencia" (minúsculas):
-- DESCRIBE atencion_emergencia;

-- O si se llama "ATENCION_EMERGENCIA":
-- DESCRIBE ATENCION_EMERGENCIA;

-- 4. Alternativamente, usar esta query que funciona con cualquier nombre:
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND (TABLE_NAME LIKE '%atencion%' OR TABLE_NAME LIKE '%emergencia%' OR TABLE_NAME LIKE '%ATENCION%' OR TABLE_NAME LIKE '%EMERGENCIA%');
