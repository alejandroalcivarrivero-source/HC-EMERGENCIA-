-- =============================================================================
-- Diagnósticos Formulario 008 — Secciones L (Presuntivos) y M (Definitivos)
-- Vista CIE-10 completa y ajustes a tabla de diagnósticos por atención.
-- Ejecutar en la base de datos del sistema (ej. EMERGENCIA).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Vista v_cie10_completo (codigo, descripcion, capitulo)
-- Si su esquema usa tablas categoria y descripcion_cie, sustituya el cuerpo
-- por: SELECT d.id, d.codigo, d.descripcion, c.nombre AS capitulo
--      FROM descripcion_cie d
--      JOIN categoria c ON c.id = d.categoria_id;
-- Con CAT_CIE10 actual, capitulo se deduce del primer carácter del código.
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS v_cie10_completo;
CREATE VIEW v_cie10_completo AS
SELECT
  id,
  codigo,
  descripcion,
  UPPER(LEFT(TRIM(codigo), 1)) AS capitulo
FROM CAT_CIE10;

-- -----------------------------------------------------------------------------
-- 2. Tabla de diagnósticos por atención
-- Nombres de tabla/campos alineados a: atencion_id, cie_id, tipo_diagnostico,
-- es_causa_externa. Se reutiliza DETALLE_DIAGNOSTICOS para no romper integridad.
-- atencion_id = atencion_emergencia_id, cie_id = codigo_cie10 (o id de CIE según su diseño).
-- -----------------------------------------------------------------------------

-- 2.1 Columna padre_id (Causa Externa vinculada al trauma S/T)
-- Tabla creada por create_tables_formulario008 tiene 'orden'; tabla antigua tenía 'fecha_registro'.
ALTER TABLE DETALLE_DIAGNOSTICOS
  ADD COLUMN padre_id INT(11) DEFAULT NULL
  COMMENT 'Si es causa externa (V01-Y84), apunta al id del diagnóstico trauma S/T'
  AFTER orden;
ALTER TABLE DETALLE_DIAGNOSTICOS
  ADD KEY fk_detalle_diag_padre (padre_id),
  ADD CONSTRAINT fk_detalle_diag_padre FOREIGN KEY (padre_id) REFERENCES DETALLE_DIAGNOSTICOS (id) ON DELETE SET NULL;

-- 2.2 Columna es_causa_externa (Códigos S/T requieren causa externa V00–Y84)
ALTER TABLE DETALLE_DIAGNOSTICOS
  ADD COLUMN es_causa_externa TINYINT(1) NOT NULL DEFAULT 0
  COMMENT '1 = diagnóstico de causa externa (V00-V99, W00-X59, X60-Y09, Y35-Y84) asociado a trauma S/T';
-- Si ya existen: omitir ADD; usar MODIFY para padre_id y es_causa_externa según corresponda.

-- 2.3 Ampliar ENUM tipo_diagnostico para incluir ESTADISTICO (códigos Z)
-- MySQL: modificar la columna con el nuevo enum.
ALTER TABLE DETALLE_DIAGNOSTICOS
  MODIFY COLUMN tipo_diagnostico ENUM(
    'PRESUNTIVO',
    'DEFINITIVO',
    'NO APLICA',
    'ESTADISTICO'
  ) NOT NULL DEFAULT 'PRESUNTIVO'
  COMMENT 'PRESUNTIVO=L, DEFINITIVO=M, ESTADISTICO=Z (no ocupa slots 008), NO APLICA=legacy Z';

-- Índice para filtrar por tipo (reportes y validaciones). Omitir si ya existe.
-- CREATE INDEX idx_detalle_diag_tipo ON DETALLE_DIAGNOSTICOS (atencion_emergencia_id, tipo_diagnostico);

-- 2.4 usuario_id (auditoría). El modelo lo usa.
ALTER TABLE DETALLE_DIAGNOSTICOS
  ADD COLUMN usuario_id INT(11) DEFAULT NULL
  COMMENT 'Usuario que registró el diagnóstico (auditoría)';

-- -----------------------------------------------------------------------------
-- Referencia rápida para “atencion_diagnosticos” (si en el futuro se crea tabla nueva):
--   atencion_id       INT, FK → ATENCION_EMERGENCIA(id)
--   cie_id            INT, FK → CAT_CIE10(id) o equivalente
--   tipo_diagnostico  ENUM('PRESUNTIVO','DEFINITIVO','ESTADISTICO')
--   es_causa_externa  TINYINT(1) DEFAULT 0
-- Con el diseño actual, DETALLE_DIAGNOSTICOS cumple este rol usando
-- atencion_emergencia_id, codigo_cie10 y tipo_diagnostico.
-- =============================================================================
