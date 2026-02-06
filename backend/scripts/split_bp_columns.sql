-- Add integer fields for Blood Pressure segmentation
ALTER TABLE `SIGNOS_VITALES`
ADD COLUMN `presion_sistolica` INT NULL AFTER `presion_arterial`,
ADD COLUMN `presion_diastolica` INT NULL AFTER `presion_sistolica`;

-- Add indexes for high-performance reporting
CREATE INDEX `idx_presion_sistolica` ON `SIGNOS_VITALES` (`presion_sistolica`);
CREATE INDEX `idx_presion_diastolica` ON `SIGNOS_VITALES` (`presion_diastolica`);
