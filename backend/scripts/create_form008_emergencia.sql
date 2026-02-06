-- Asegurar que la tabla ATENCION_EMERGENCIA existe
CREATE TABLE IF NOT EXISTS `ATENCION_EMERGENCIA` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pacienteId` int(11) NOT NULL,
  `admisionId` int(11) NOT NULL,
  `usuarioId` int(11) NOT NULL,
  `fechaAtencion` date NOT NULL,
  `horaAtencion` varchar(5) NOT NULL,
  `condicionLlegada` varchar(255) NOT NULL,
  `motivoAtencion` text DEFAULT NULL,
  `fechaEvento` date DEFAULT NULL,
  `horaEvento` varchar(5) DEFAULT NULL,
  `lugarEvento` varchar(255) DEFAULT NULL,
  `direccionEvento` varchar(255) DEFAULT NULL,
  `custodiaPolicial` tinyint(1) DEFAULT NULL,
  `notificacion` tinyint(1) DEFAULT NULL,
  `tipoAccidenteViolenciaIntoxicacion` text DEFAULT NULL,
  `observacionesAccidente` text DEFAULT NULL,
  `sugestivoAlientoAlcoholico` tinyint(1) DEFAULT NULL,
  `antecedentesPatologicos` text DEFAULT NULL,
  `enfermedadProblemaActual` text DEFAULT NULL,
  `examenFisico` text DEFAULT NULL,
  `examenFisicoTraumaCritico` text DEFAULT NULL,
  `embarazoParto` text DEFAULT NULL,
  `examenesComplementarios` text DEFAULT NULL,
  `diagnosticosPresuntivos` text DEFAULT NULL,
  `diagnosticosDefinitivos` text DEFAULT NULL,
  `planTratamiento` text DEFAULT NULL,
  `observacionesPlanTratamiento` text DEFAULT NULL,
  `condicionEgreso` varchar(255) DEFAULT NULL,
  `referenciaEgreso` varchar(255) DEFAULT NULL,
  `establecimientoEgreso` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `es_valida` tinyint(1) NOT NULL DEFAULT 1,
  -- Campos adicionales que podrían faltar
  `estado_firma` ENUM('BORRADOR', 'PENDIENTE_FIRMA', 'FINALIZADO_FIRMADO') DEFAULT 'BORRADOR',
  `sello_digital` TEXT,
  `usuario_responsable_id` INT,
  `firma_digital_hash` VARCHAR(255),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Asegurar columna firma_digital_hash en ATENCION_EMERGENCIA (si ya existía pero le faltaba)
SET @exist := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ATENCION_EMERGENCIA' AND column_name = 'firma_digital_hash');
SET @sql := IF(@exist = 0, 'ALTER TABLE `ATENCION_EMERGENCIA` ADD COLUMN `firma_digital_hash` VARCHAR(255) NULL', 'SELECT "Column firma_digital_hash already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear tabla FORM_008_EMERGENCIA para persistencia separada de datos clínicos
CREATE TABLE IF NOT EXISTS `FORM_008_EMERGENCIA` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `atencionId` int(11) NOT NULL,
  `motivoAtencion` text DEFAULT NULL,
  `antecedentesPatologicos` text DEFAULT NULL,
  `enfermedadProblemaActual` text DEFAULT NULL,
  `examenFisico` text DEFAULT NULL,
  `diagnosticosPresuntivos` text DEFAULT NULL,
  `diagnosticosDefinitivos` text DEFAULT NULL,
  `planTratamiento` text DEFAULT NULL,
  `prescripciones` text DEFAULT NULL,
  `procedimientos` text DEFAULT NULL,
  `firma_digital_hash` varchar(255) DEFAULT NULL,
  `sello_digital` text DEFAULT NULL,
  `estado_firma` enum('BORRADOR','PENDIENTE_FIRMA','FINALIZADO_FIRMADO') DEFAULT 'BORRADOR',
  `usuario_responsable_id` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `atencionId` (`atencionId`),
  CONSTRAINT `fk_form008_atencion` FOREIGN KEY (`atencionId`) REFERENCES `ATENCION_EMERGENCIA` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Migrar datos existentes
INSERT IGNORE INTO `FORM_008_EMERGENCIA` (
  `atencionId`, 
  `motivoAtencion`, 
  `antecedentesPatologicos`,
  `enfermedadProblemaActual`,
  `examenFisico`,
  `diagnosticosPresuntivos`,
  `diagnosticosDefinitivos`,
  `planTratamiento`,
  `estado_firma`,
  `sello_digital`,
  `usuario_responsable_id`
)
SELECT 
  `id`, 
  `motivoAtencion`, 
  `antecedentesPatologicos`,
  `enfermedadProblemaActual`,
  `examenFisico`,
  `diagnosticosPresuntivos`,
  `diagnosticosDefinitivos`,
  `planTratamiento`,
  IFNULL(`estado_firma`, 'BORRADOR'),
  `sello_digital`,
  `usuario_responsable_id`
FROM `ATENCION_EMERGENCIA`;
