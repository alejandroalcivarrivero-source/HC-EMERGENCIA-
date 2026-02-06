-- Asegurar fecha_fallecimiento en ATENCION_EMERGENCIA
SET @exist := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ATENCION_EMERGENCIA' AND column_name = 'fecha_fallecimiento');
SET @sql := IF(@exist = 0, 'ALTER TABLE `ATENCION_EMERGENCIA` ADD COLUMN `fecha_fallecimiento` DATE NULL', 'SELECT "Column fecha_fallecimiento already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vista de Atenciones Pendientes de Firma
CREATE OR REPLACE VIEW V_ATENCIONES_PENDIENTES AS
SELECT 
    ae.id AS atencion_id,
    ae.admisionId,
    p.numero_identificacion,
    CONCAT(p.primer_nombre, ' ', p.primer_apellido) AS paciente_nombre,
    ae.fechaAtencion,
    ae.horaAtencion,
    ae.usuario_responsable_id,
    u.nombres AS medico_nombres,
    u.apellidos AS medico_apellidos,
    ae.estado_firma
FROM ATENCION_EMERGENCIA ae
JOIN PACIENTES p ON ae.pacienteId = p.id
LEFT JOIN USUARIOS_SISTEMA u ON ae.usuario_responsable_id = u.id
WHERE ae.estado_firma IN ('BORRADOR', 'PENDIENTE_FIRMA') AND ae.es_valida = 1;

-- Vista de Atenciones Firmadas
CREATE OR REPLACE VIEW V_ATENCIONES_FIRMADAS AS
SELECT 
    ae.id AS atencion_id,
    ae.admisionId,
    p.numero_identificacion,
    CONCAT(p.primer_nombre, ' ', p.primer_apellido) AS paciente_nombre,
    ae.fechaAtencion,
    ae.horaAtencion,
    ae.fecha_fallecimiento,
    f008.firma_digital_hash,
    ae.usuario_responsable_id,
    u.nombres AS medico_nombres,
    u.apellidos AS medico_apellidos,
    ae.estado_firma
FROM ATENCION_EMERGENCIA ae
JOIN FORM_008_EMERGENCIA f008 ON ae.id = f008.atencionId
JOIN PACIENTES p ON ae.pacienteId = p.id
LEFT JOIN USUARIOS_SISTEMA u ON ae.usuario_responsable_id = u.id
WHERE ae.estado_firma = 'FINALIZADO_FIRMADO' AND ae.es_valida = 1;
