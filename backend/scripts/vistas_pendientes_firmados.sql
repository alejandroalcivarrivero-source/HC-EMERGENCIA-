-- Vista de Atenciones Pendientes de Firma
CREATE OR REPLACE VIEW `V_ATENCIONES_PENDIENTES` AS
SELECT
    ae.`id` AS `atencion_id`,
    ae.`pacienteId`,
    ae.`admisionId`,
    ae.`usuarioId`,
    ae.`fechaAtencion`,
    ae.`horaAtencion`,
    f008.`diagnosticosDefinitivos`,
    f008.`diagnosticosPresuntivos`,
    ae.`estado_firma`
FROM `ATENCION_EMERGENCIA` ae
LEFT JOIN `FORM_008_EMERGENCIA` f008 ON ae.`id` = f008.`atencionId`
WHERE
    (
        (f008.`diagnosticosDefinitivos` IS NOT NULL AND f008.`diagnosticosDefinitivos` != '[]' AND f008.`diagnosticosDefinitivos` != '')
        OR
        (f008.`diagnosticosPresuntivos` IS NOT NULL AND f008.`diagnosticosPresuntivos` != '[]' AND f008.`diagnosticosPresuntivos` != '')
    )
    AND (ae.`firma_digital_hash` IS NULL OR ae.`firma_digital_hash` = '');

-- Vista de Atenciones Firmadas
CREATE OR REPLACE VIEW `V_ATENCIONES_FIRMADAS` AS
SELECT
    ae.`id` AS `atencion_id`,
    ae.`pacienteId`,
    ae.`admisionId`,
    ae.`usuarioId`,
    ae.`fechaAtencion`,
    ae.`horaAtencion`,
    ae.`firma_digital_hash`,
    ae.`sello_digital`,
    ae.`estado_firma`,
    ae.`usuario_responsable_id`
FROM `ATENCION_EMERGENCIA` ae
WHERE
    ae.`firma_digital_hash` IS NOT NULL AND ae.`firma_digital_hash` != '';
