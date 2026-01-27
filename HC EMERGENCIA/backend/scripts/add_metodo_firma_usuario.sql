-- Script para agregar campo metodoFirma a la tabla USUARIOS_SISTEMA
-- Soporta: 'ARCHIVO' (archivo .p12) o 'TOKEN' (token físico USB)

ALTER TABLE `USUARIOS_SISTEMA` 
ADD COLUMN `metodo_firma` ENUM('ARCHIVO', 'TOKEN') DEFAULT 'ARCHIVO' 
AFTER `activo`;

-- Actualizar usuarios existentes para usar método ARCHIVO por defecto
UPDATE `USUARIOS_SISTEMA` 
SET `metodo_firma` = 'ARCHIVO' 
WHERE `metodo_firma` IS NULL;
