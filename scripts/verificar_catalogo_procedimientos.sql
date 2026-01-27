-- ========================================================
-- VERIFICACIÓN Y COMPLETADO DEL CATÁLOGO DE PROCEDIMIENTOS
-- Sistema de Emergencias - Centro de Salud Chone Tipo C
-- ========================================================

-- ====================================
-- PASO 1: VER PROCEDIMIENTOS ACTUALES EN EL CATÁLOGO
-- ====================================

SELECT 
    id,
    nombre,
    activo,
    createdAt
FROM CAT_PROCEDIMIENTOS_EMERGENCIA
ORDER BY nombre;

-- ====================================
-- PASO 2: AGREGAR PROCEDIMIENTOS FALTANTES (SI ES NECESARIO)
-- ====================================

-- Lista de procedimientos estándar de emergencia
-- Solo ejecutar los INSERT que sean necesarios

-- Verificar si ya existen antes de insertar
SELECT COUNT(*) as total FROM CAT_PROCEDIMIENTOS_EMERGENCIA;

-- Si faltan procedimientos, agregarlos:
INSERT IGNORE INTO CAT_PROCEDIMIENTOS_EMERGENCIA (nombre, activo) VALUES
('Inyección Intravenosa', 1),
('Inyección Dérmica', 1),
('Inyección Subcutánea', 1),
('Inyección Intramuscular', 1),
('Hidratación', 1),
('Curaciones', 1),
('Sutura', 1),
('Retiro de Puntos', 1),
('Nebulización', 1),
('Canalización', 1),
('Glicemia', 1),
('Medicación Vía Oral', 1),
('Medio Físico', 1),
('Medicación Intrarrectal', 1),
('Involución Uterina', 1),
('Drenaje de Acceso', 1),
('Colocación de Sonda', 1),
('Oxígeno', 1),
('Retiro de Cuerpo Extraño', 1),
('Colocación de Sonda Vesical', 1),
('Vacunación', 1),
('Pruebas Rápidas', 1),
('Medicación Inhalatoria', 1),
('Medicina Intravaginal', 1),
('Toma de Signos Vitales', 1);

-- ====================================
-- PASO 3: VERIFICACIÓN POST-INSERCIÓN
-- ====================================

SELECT 
    'RESULTADO: Procedimientos en catálogo' as paso,
    COUNT(*) as total_procedimientos
FROM CAT_PROCEDIMIENTOS_EMERGENCIA
WHERE activo = 1;

-- Mostrar todos los procedimientos activos
SELECT id, nombre 
FROM CAT_PROCEDIMIENTOS_EMERGENCIA
WHERE activo = 1
ORDER BY nombre;

-- ====================================
-- PASO 4: VERIFICAR DATOS EN CUMPLIMIENTO_PROCEDIMIENTOS
-- ====================================

SELECT 
    'DATOS: Registros en CUMPLIMIENTO_PROCEDIMIENTOS' as paso,
    COUNT(*) as total
FROM CUMPLIMIENTO_PROCEDIMIENTOS;

-- Ver los últimos 5 cumplimientos registrados
SELECT 
    c.id,
    c.admision_id,
    p.nombre as procedimiento,
    c.alerta_medica,
    c.fecha_hora,
    u.nombres as usuario
FROM CUMPLIMIENTO_PROCEDIMIENTOS c
LEFT JOIN CAT_PROCEDIMIENTOS_EMERGENCIA p ON c.procedimiento_cat_id = p.id
LEFT JOIN USUARIOS_SISTEMA u ON c.usuario_enfermeria_id = u.id
ORDER BY c.id DESC
LIMIT 5;

-- ====================================
-- FIN
-- ====================================
-- ✅ Catálogo de procedimientos verificado y completado
-- ✅ Sistema listo para usar CUMPLIMIENTO_PROCEDIMIENTOS únicamente
