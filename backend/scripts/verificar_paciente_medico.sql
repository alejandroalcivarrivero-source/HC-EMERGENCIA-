-- Script para verificar por qué el médico no ve pacientes en su Dashboard
-- Ejecutar este script en tu cliente de MariaDB/MySQL

-- 1. Verificar el usuario médico (ANDRES ALEJANDRO ALCIVAR RIVERO)
SELECT 
    u.id as usuario_id,
    u.nombres,
    u.apellidos,
    u.cedula,
    u.rol_id,
    r.nombre as nombre_rol
FROM USUARIOS_SISTEMA u
LEFT JOIN ROLES r ON u.rol_id = r.id
WHERE u.nombres LIKE '%ANDRES%' 
   OR u.apellidos LIKE '%ALCIVAR%'
   OR u.cedula = '1314783083';

-- 2. Verificar el paciente en EN_ATENCION (ANDRES ALEJANDRO ALCIVAR RIVERO)
SELECT 
    ape.id,
    ape.admisionId,
    ape.estado_id,
    ape.usuario_responsable_id,
    cep.nombre as estado_nombre,
    ape.createdAt as fecha_estado
FROM ATENCION_PACIENTE_ESTADO ape
INNER JOIN CAT_ESTADO_PACIENTE cep ON ape.estado_id = cep.id
INNER JOIN ADMISIONES a ON ape.admisionId = a.id
INNER JOIN PACIENTES p ON a.paciente_id = p.id
WHERE cep.nombre = 'EN_ATENCION'
  AND (p.numero_identificacion = '1314783083' 
       OR p.primer_nombre LIKE '%ANDRES%')
  AND ape.createdAt = (
    SELECT MAX(createdAt) 
    FROM ATENCION_PACIENTE_ESTADO 
    WHERE admisionId = ape.admisionId
  );

-- 3. Verificar si existe una atención de emergencia pendiente para este paciente
SELECT 
    ae.id,
    ae.admisionId,
    ae.usuarioId,
    ae.usuario_responsable_id,
    ae.estado_firma,
    ae.es_valida,
    ae.createdAt,
    ae.updatedAt
FROM ATENCION_EMERGENCIA ae
INNER JOIN ADMISIONES a ON ae.admisionId = a.id
INNER JOIN PACIENTES p ON a.paciente_id = p.id
WHERE ae.estado_firma = 'PENDIENTE'
  AND ae.es_valida = 1
  AND (p.numero_identificacion = '1314783083' 
       OR p.primer_nombre LIKE '%ANDRES%');

-- 4. Verificar todas las atenciones pendientes del sistema
SELECT 
    ae.id,
    ae.admisionId,
    ae.usuarioId,
    ae.usuario_responsable_id,
    ae.estado_firma,
    u_responsable.nombres as responsable_nombres,
    u_responsable.apellidos as responsable_apellidos,
    p.numero_identificacion,
    p.primer_nombre,
    p.primer_apellido
FROM ATENCION_EMERGENCIA ae
INNER JOIN ADMISIONES a ON ae.admisionId = a.id
INNER JOIN PACIENTES p ON a.paciente_id = p.id
LEFT JOIN USUARIOS_SISTEMA u_responsable ON ae.usuario_responsable_id = u_responsable.id
WHERE ae.estado_firma = 'PENDIENTE'
  AND ae.es_valida = 1
ORDER BY ae.updatedAt DESC;
