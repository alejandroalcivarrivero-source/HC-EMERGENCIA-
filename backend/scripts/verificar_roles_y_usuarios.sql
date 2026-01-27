-- Script para verificar los roles y usuarios en la base de datos
-- Ejecutar este script en tu cliente de MariaDB/MySQL

-- 1. Ver todos los roles disponibles
SELECT id, nombre FROM ROLES ORDER BY id;

-- 2. Ver todos los usuarios con sus roles
SELECT 
    u.id,
    u.nombres,
    u.apellidos,
    u.cedula,
    u.rol_id,
    r.nombre as nombre_rol
FROM USUARIOS_SISTEMA u
LEFT JOIN ROLES r ON u.rol_id = r.id
ORDER BY u.rol_id, u.id;

-- 3. Contar usuarios por rol
SELECT 
    r.id as rol_id,
    r.nombre as nombre_rol,
    COUNT(u.id) as cantidad_usuarios
FROM ROLES r
LEFT JOIN USUARIOS_SISTEMA u ON r.id = u.rol_id
GROUP BY r.id, r.nombre
ORDER BY r.id;

-- 4. Ver usuarios que podrían ser médicos (buscar por nombre del rol)
SELECT 
    u.id,
    u.nombres,
    u.apellidos,
    u.cedula,
    u.rol_id,
    r.nombre as nombre_rol
FROM USUARIOS_SISTEMA u
LEFT JOIN ROLES r ON u.rol_id = r.id
WHERE r.nombre LIKE '%Medico%' 
   OR r.nombre LIKE '%Médico%'
   OR r.nombre LIKE '%MEDICO%'
   OR r.nombre LIKE '%MEDICO%'
ORDER BY u.id;
