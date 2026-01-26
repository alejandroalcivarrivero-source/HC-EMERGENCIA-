-- phpMyAdmin SQL Dump
-- version 5.2.1deb1+deb12u1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 25-01-2026 a las 02:54:35
-- Versión del servidor: 10.11.11-MariaDB-0+deb12u1
-- Versión de PHP: 8.2.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `EMERGENCIA`
--

DELIMITER $$
--
-- Funciones
--
CREATE DEFINER=`administrador`@`localhost` FUNCTION `unaccent` (`input_string` VARCHAR(255)) RETURNS VARCHAR(255) CHARSET utf8mb4 COLLATE utf8mb4_general_ci DETERMINISTIC BEGIN
    DECLARE output_string VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '';
    DECLARE i INT DEFAULT 1;
    DECLARE c CHAR(1);

    SET output_string = input_string;

    -- Replace accented characters
    SET output_string = REPLACE(output_string, 'á', 'a');
    SET output_string = REPLACE(output_string, 'é', 'e');
    SET output_string = REPLACE(output_string, 'í', 'i');
    SET output_string = REPLACE(output_string, 'ó', 'o');
    SET output_string = REPLACE(output_string, 'ú', 'u');
    SET output_string = REPLACE(output_string, 'ñ', 'n');
    SET output_string = REPLACE(output_string, 'Á', 'A');
    SET output_string = REPLACE(output_string, 'É', 'E');
    SET output_string = REPLACE(output_string, 'Í', 'I');
    SET output_string = REPLACE(output_string, 'Ó', 'O');
    SET output_string = REPLACE(output_string, 'Ú', 'U');
    SET output_string = REPLACE(output_string, 'Ñ', 'N');

    RETURN output_string;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ADMISIONES`
--

CREATE TABLE `ADMISIONES` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `fecha_hora_admision` datetime NOT NULL,
  `forma_llegada_id` int(11) NOT NULL,
  `fuente_informacion_id` int(11) NOT NULL,
  `institucion_persona_entrega` varchar(255) NOT NULL,
  `telefono_entrega` varchar(255) NOT NULL,
  `usuario_admision_id` int(11) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `fecha_hora_retiro` datetime DEFAULT NULL,
  `fecha_hora_fallecimiento` datetime DEFAULT NULL,
  `alerta_triaje_activa` tinyint(1) DEFAULT 0,
  `fecha_hora_ultima_alerta_triaje` datetime DEFAULT NULL,
  `fecha_ultima_actividad` datetime DEFAULT NULL,
  `estado_paciente_id` int(11) DEFAULT NULL,
  `triaje_id` int(11) DEFAULT NULL,
  `motivo_consulta_sintoma_id` int(11) NOT NULL,
  `triaje_preliminar_id` int(11) DEFAULT NULL,
  `triaje_definitivo_id` int(11) DEFAULT NULL,
  `prioridad_enfermeria` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ADMISIONES`
--

INSERT INTO `ADMISIONES` (`id`, `paciente_id`, `fecha_hora_admision`, `forma_llegada_id`, `fuente_informacion_id`, `institucion_persona_entrega`, `telefono_entrega`, `usuario_admision_id`, `fecha_creacion`, `fecha_actualizacion`, `fecha_hora_retiro`, `fecha_hora_fallecimiento`, `alerta_triaje_activa`, `fecha_hora_ultima_alerta_triaje`, `fecha_ultima_actividad`, `estado_paciente_id`, `triaje_id`, `motivo_consulta_sintoma_id`, `triaje_preliminar_id`, `triaje_definitivo_id`, `prioridad_enfermeria`) VALUES
(120, 77, '2025-09-27 21:53:00', 1, 1, 'ALCIVAR RIVERO ANDRES ALEJANDRO', '0986382910', 7, '2025-09-27 21:53:33', '2025-09-29 02:05:00', NULL, NULL, 0, NULL, NULL, 9, NULL, 880, 5, 4, 0),
(121, 77, '2025-09-30 02:41:00', 1, 1, 'ALCIVAR RIVERO ANDRES ALEJANDRO', '0986382910', 7, '2025-09-30 02:41:30', '2025-10-01 03:20:00', NULL, NULL, 0, NULL, NULL, 9, NULL, 947, 5, 4, 0),
(122, 77, '2026-01-11 06:11:00', 1, 1, 'ALCIVAR RIVERO ANDRES ALEJANDRO', '0986382910', 7, '2026-01-11 06:11:18', '2026-01-12 06:15:00', '2026-01-12 06:15:00', NULL, 0, NULL, NULL, 4, NULL, 960, 5, NULL, 0),
(123, 77, '2026-01-24 05:55:00', 1, 1, 'ALCIVAR RIVERO ANDRES ALEJANDRO', '0986382910', 7, '2026-01-24 05:56:03', '2026-01-24 05:59:08', NULL, NULL, 0, NULL, NULL, 1, NULL, 926, 5, 4, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ATENCION_EMERGENCIA`
--

CREATE TABLE `ATENCION_EMERGENCIA` (
  `id` int(11) NOT NULL,
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
  `es_valida` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ATENCION_PACIENTE_ESTADO`
--

CREATE TABLE `ATENCION_PACIENTE_ESTADO` (
  `id` int(11) NOT NULL,
  `admisionId` int(11) NOT NULL,
  `usuario_responsable_id` int(11) DEFAULT NULL,
  `fechaAsignacion` datetime DEFAULT NULL,
  `fechaFinAtencion` datetime DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `estado_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) NOT NULL,
  `rol_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ATENCION_PACIENTE_ESTADO`
--

INSERT INTO `ATENCION_PACIENTE_ESTADO` (`id`, `admisionId`, `usuario_responsable_id`, `fechaAsignacion`, `fechaFinAtencion`, `observaciones`, `createdAt`, `updatedAt`, `estado_id`, `usuario_id`, `rol_id`) VALUES
(92, 120, NULL, NULL, NULL, NULL, '2025-09-27 21:53:35', '2025-09-27 23:58:24', 2, 7, 3),
(93, 120, NULL, NULL, NULL, NULL, '2025-09-28 00:00:27', '2025-09-28 00:00:27', 2, 7, 3),
(94, 120, 8, '2025-09-28 02:02:22', NULL, NULL, '2025-09-28 02:02:22', '2025-09-28 02:02:22', 6, 8, 1),
(95, 120, NULL, NULL, NULL, 'Atención incompleta automática por inactividad (estado EN_ATENCION > 24h).', '2025-09-29 02:05:00', '2025-09-29 02:05:00', 9, 6, 5),
(96, 121, NULL, NULL, NULL, NULL, '2025-09-30 02:41:31', '2025-09-30 02:45:26', 2, 7, 3),
(97, 121, 8, '2025-09-30 03:15:15', NULL, NULL, '2025-09-30 03:15:15', '2025-09-30 03:15:15', 6, 8, 1),
(98, 121, NULL, NULL, NULL, 'Atención incompleta automática por inactividad (estado EN_ATENCION > 24h).', '2025-10-01 03:20:00', '2025-10-01 03:20:00', 9, 6, 5),
(99, 122, NULL, NULL, NULL, NULL, '2026-01-11 06:11:19', '2026-01-11 06:11:19', 1, 7, 3),
(100, 122, NULL, NULL, '2026-01-12 06:15:00', 'Alta voluntaria automática por inactividad (sin SV ni procedimientos).', '2026-01-12 06:15:00', '2026-01-12 06:15:00', 4, 6, 5),
(101, 123, NULL, NULL, NULL, NULL, '2026-01-24 05:55:51', '2026-01-24 05:59:08', 2, 7, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `BACKUP_CAT_ESTADO_PACIENTE_20260124`
--

CREATE TABLE `BACKUP_CAT_ESTADO_PACIENTE_20260124` (
  `id` int(11) NOT NULL DEFAULT 0,
  `nombre` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `BACKUP_CAT_ESTADO_PACIENTE_20260124`
--

INSERT INTO `BACKUP_CAT_ESTADO_PACIENTE_20260124` (`id`, `nombre`, `createdAt`, `updatedAt`) VALUES
(2, 'PREPARADO', '2025-07-17 20:00:45', '2025-07-17 20:00:45');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_AUTOIDENTIFICACION_ETNICA`
--

CREATE TABLE `CAT_AUTOIDENTIFICACION_ETNICA` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_AUTOIDENTIFICACION_ETNICA`
--

INSERT INTO `CAT_AUTOIDENTIFICACION_ETNICA` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Indígena', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'Afroecuatoriano/Afrodescendiente', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(3, 'Negro/a', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(4, 'Mulato/a', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(5, 'Montubio/a', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(6, 'Mestizo/a', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(7, 'Blanco/a', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(8, 'No sabe/No responde', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_CANTONES`
--

CREATE TABLE `CAT_CANTONES` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `provincia_id` int(11) NOT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `CAT_CANTONES`
--

INSERT INTO `CAT_CANTONES` (`id`, `nombre`, `provincia_id`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'CUENCA', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(2, 'GIRÓN', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(3, 'GUALACEO', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(4, 'NABÓN', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(5, 'PAUTE', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(6, 'PUCARA', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(7, 'SAN FERNANDO', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(8, 'SANTA ISABEL', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(9, 'SIGSIG', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(10, 'OÑA', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(11, 'CHORDELEG', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(12, 'EL PAN', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(13, 'SEVILLA DE ORO', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(14, 'GUACHAPALA', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(15, 'CAMILO PONCE ENRÍQUEZ', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(16, 'GUARANDA', 2, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(17, 'CHILLANES', 2, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(18, 'CHIMBO', 2, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(19, 'ECHEANDÍA', 2, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(20, 'SAN MIGUEL', 2, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(21, 'CALUMA', 2, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(22, 'LAS NAVES', 2, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(23, 'AZOGUES', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(24, 'BIBLIÁN', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(25, 'CAÑAR', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(26, 'LA TRONCAL', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(27, 'EL TAMBO', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(28, 'DÉLEG', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(29, 'SUSCAL', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(30, 'TULCÁN', 4, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(31, 'BOLÍVAR', 4, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(32, 'ESPEJO', 4, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(33, 'MIRA', 4, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(34, 'MONTÚFAR', 4, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(35, 'SAN PEDRO DE HUACA', 4, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(36, 'LATACUNGA', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(37, 'LA MANÁ', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(38, 'PANGUA', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(39, 'PUJILI', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(40, 'SALCEDO', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(41, 'SAQUISILÍ', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(42, 'SIGCHOS', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(43, 'RIOBAMBA', 6, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(44, 'ALAUSI', 6, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(45, 'COLTA', 6, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(46, 'CHAMBO', 6, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(47, 'CHUNCHI', 6, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(48, 'GUAMOTE', 6, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(49, 'GUANO', 6, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(50, 'PALLATANGA', 6, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(51, 'PENIPE', 6, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(52, 'CUMANDÁ', 6, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(53, 'MACHALA', 7, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(54, 'ARENILLAS', 7, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(55, 'ATAHUALPA', 7, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(56, 'BALSAS', 7, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(57, 'CHILLA', 7, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(58, 'EL GUABO', 7, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(59, 'HUAQUILLAS', 7, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(60, 'MARCABELÍ', 7, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(61, 'PASAJE', 7, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(62, 'PIÑAS', 7, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(63, 'PORTOVELO', 7, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(64, 'SANTA ROSA', 7, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(65, 'ZARUMA', 7, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(66, 'LAS LAJAS', 7, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(67, 'ESMERALDAS', 8, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(68, 'ELOY ALFARO', 8, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(69, 'MUISNE', 8, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(70, 'QUININDÉ', 8, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(71, 'SAN LORENZO', 8, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(72, 'ATACAMES', 8, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(73, 'RIOVERDE', 8, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(74, 'LA CONCORDIA', 8, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(75, 'GUAYAQUIL', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(76, 'REDO BAQUERIZO MORENO (JU', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(77, 'BALAO', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(78, 'BALZAR', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(79, 'COLIMES', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(80, 'DAULE', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(81, 'DURÁN', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(82, 'EL EMPALME', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(83, 'EL TRIUNFO', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(84, 'MILAGRO', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(85, 'NARANJAL', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(86, 'NARANJITO', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(87, 'PALESTINA', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(88, 'PEDRO CARBO', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(89, 'SAMBORONDÓN', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(90, 'SANTA LUCÍA', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(91, 'SALITRE (URBINA JADO)', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(92, 'SAN JACINTO DE YAGUACHI', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(93, 'PLAYAS', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(94, 'SIMÓN BOLÍVAR', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(95, 'ORONEL MARCELINO MARIDUEÑ', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(96, 'LOMAS DE SARGENTILLO', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(97, 'NOBOL', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(98, 'GENERAL ANTONIO ELIZALDE', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(99, 'ISIDRO AYORA', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(100, 'IBARRA', 10, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(101, 'ANTONIO ANTE', 10, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(102, 'COTACACHI', 10, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(103, 'OTAVALO', 10, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(104, 'PIMAMPIRO', 10, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(105, 'SAN MIGUEL DE URCUQUÍ', 10, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(106, 'LOJA', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(107, 'CALVAS', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(108, 'CATAMAYO', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(109, 'CELICA', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(110, 'CHAGUARPAMBA', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(111, 'ESPÍNDOLA', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(112, 'GONZANAMÁ', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(113, 'MACARÁ', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(114, 'PALTAS', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(115, 'PUYANGO', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(116, 'SARAGURO', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(117, 'SOZORANGA', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(118, 'ZAPOTILLO', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(119, 'PINDAL', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(120, 'QUILANGA', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(121, 'OLMEDO', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(122, 'BABAHOYO', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(123, 'BABA', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(124, 'MONTALVO', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(125, 'PUEBLOVIEJO', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(126, 'QUEVEDO', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(127, 'URDANETA', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(128, 'VENTANAS', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(129, 'VÍNCES', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(130, 'PALENQUE', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(131, 'BUENA FÉ', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(132, 'VALENCIA', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(133, 'MOCACHE', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(134, 'QUINSALOMA', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(135, 'PORTOVIEJO', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(136, 'BOLÍVAR', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(137, 'CHONE', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(138, 'EL CARMEN', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(139, 'FLAVIO ALFARO', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(140, 'JIPIJAPA', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(141, 'JUNÍN', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(142, 'MANTA', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(143, 'MONTECRISTI', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(144, 'PAJÁN', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(145, 'PICHINCHA', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(146, 'ROCAFUERTE', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(147, 'SANTA ANA', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(148, 'SUCRE', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(149, 'TOSAGUA', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(150, '24 DE MAYO', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(151, 'PEDERNALES', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(152, 'OLMEDO', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(153, 'PUERTO LÓPEZ', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(154, 'JAMA', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(155, 'JARAMIJÓ', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(156, 'SAN VICENTE', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(157, 'MORONA', 14, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(158, 'GUALAQUIZA', 14, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(159, 'LIMÓN INDANZA', 14, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(160, 'PALORA', 14, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(161, 'SANTIAGO', 14, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(162, 'SUCÚA', 14, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(163, 'HUAMBOYA', 14, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(164, 'SAN JUAN BOSCO', 14, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(165, 'TAISHA', 14, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(166, 'LOGROÑO', 14, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(167, 'PABLO SEXTO', 14, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(168, 'TIWINTZA', 14, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(169, 'TENA', 15, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(170, 'ARCHIDONA', 15, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(171, 'EL CHACO', 15, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(172, 'QUIJOS', 15, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(173, 'C', 15, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(174, 'PASTAZA', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(175, 'MERA', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(176, 'SANTA CLARA', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(177, 'ARAJUNO', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(178, 'QUITO', 17, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(179, 'CAYAMBE', 17, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(180, 'MEJIA', 17, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(181, 'PEDRO MONCAYO', 17, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(182, 'RUMIÑAHUI', 17, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(183, 'SAN MIGUEL DE LOS BANCOS', 17, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(184, 'PEDRO VICENTE MALDONADO', 17, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(185, 'PUERTO QUITO', 17, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(186, 'AMBATO', 18, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(187, 'BAÑOS DE AGUA SANTA', 18, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(188, 'CEVALLOS', 18, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(189, 'MOCHA', 18, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(190, 'PATATE', 18, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(191, 'QUERO', 18, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(192, 'SAN PEDRO DE PELILEO', 18, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(193, 'SANTIAGO DE PÍLLARO', 18, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(194, 'TISALEO', 18, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(195, 'ZAMORA', 19, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(196, 'CHINCHIPE', 19, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(197, 'NANGARITZA', 19, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(198, 'YACUAMBI', 19, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(199, 'YANTZAZA (YANZATZA)', 19, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(200, 'EL PANGUI', 19, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(201, 'CENTINELA DEL CÓNDOR', 19, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(202, 'PALANDA', 19, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(203, 'PAQUISHA', 19, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(204, 'SAN CRISTÓBAL', 20, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(205, 'ISABELA', 20, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(206, 'SANTA CRUZ', 20, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(207, 'LAGO AGRIO', 21, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(208, 'GONZALO PIZARRO', 21, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(209, 'PUTUMAYO', 21, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(210, 'SHUSHUFINDI', 21, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(211, 'SUCUMBÍOS', 21, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(212, 'CASCALES', 21, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(213, 'CUYABENO', 21, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(214, 'ORELLANA', 22, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(215, 'AGUARICO', 22, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(216, 'LA JOYA DE LOS SACHAS', 22, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(217, 'LORETO', 22, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(218, 'SANTO DOMINGO', 23, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(219, 'SANTA ELENA', 24, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(220, 'LA LIBERTAD', 24, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(221, 'SALINAS', 24, '2025-06-23 23:28:44', '2025-06-23 23:28:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_CIE10`
--

CREATE TABLE `CAT_CIE10` (
  `id` int(11) NOT NULL,
  `codigo` varchar(10) NOT NULL,
  `descripcion` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_ESTADOS_CIVILES`
--

CREATE TABLE `CAT_ESTADOS_CIVILES` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_ESTADOS_CIVILES`
--

INSERT INTO `CAT_ESTADOS_CIVILES` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Soltero', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'Casado', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(3, 'Divorciado', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(4, 'Viudo', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(5, 'Unido', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(6, 'En union de hecho', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_ESTADO_PACIENTE`
--

CREATE TABLE `CAT_ESTADO_PACIENTE` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_ESTADO_PACIENTE`
--

INSERT INTO `CAT_ESTADO_PACIENTE` (`id`, `nombre`, `createdAt`, `updatedAt`) VALUES
(1, 'ADMITIDO', '2025-07-17 20:00:45', '2025-07-17 20:00:45'),
(2, 'SIGNOS_VITALES', '2025-07-17 20:00:45', '2026-01-24 00:44:06'),
(3, 'PROCEDIMIENTOS', '2025-07-17 20:00:45', '2025-07-17 20:00:45'),
(4, 'ALTA_VOLUNTARIA', '2025-07-17 20:00:45', '2025-07-17 20:00:45'),
(5, 'ALTA_PETICION', '2025-07-17 20:00:45', '2025-07-17 20:00:45'),
(6, 'EN_ATENCION', '2025-07-17 20:00:45', '2025-07-17 20:00:45'),
(7, 'ATENDIDO', '2025-07-17 20:00:45', '2025-07-17 20:00:45'),
(8, 'FALLECIDO', '2025-07-17 20:00:45', '2025-07-17 20:00:45'),
(9, 'ATENCION_INCOMPLETA', '2025-08-03 23:50:48', '2025-08-03 23:50:48'),
(10, 'HOSPITALIZADO', '2025-09-29 14:58:10', '2025-09-29 14:58:10'),
(11, 'ALTA_MEDICA', '2025-09-29 15:13:04', '2025-09-29 15:13:04');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_FORMAS_LLEGADA`
--

CREATE TABLE `CAT_FORMAS_LLEGADA` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_FORMAS_LLEGADA`
--

INSERT INTO `CAT_FORMAS_LLEGADA` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Ambulatorio', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'Ambulancia', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(3, 'Otro transporte', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_FUENTES_INFORMACION`
--

CREATE TABLE `CAT_FUENTES_INFORMACION` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_FUENTES_INFORMACION`
--

INSERT INTO `CAT_FUENTES_INFORMACION` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Directa', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'Indirecta', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_GRADOS_NIVELES_EDUCACION`
--

CREATE TABLE `CAT_GRADOS_NIVELES_EDUCACION` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_GRADOS_NIVELES_EDUCACION`
--

INSERT INTO `CAT_GRADOS_NIVELES_EDUCACION` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Cursando', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'Completa', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(3, 'Incompleta', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(4, 'Ninguna', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_MOTIVO_CONSULTA_SINTOMAS`
--

CREATE TABLE `CAT_MOTIVO_CONSULTA_SINTOMAS` (
  `Codigo` int(11) NOT NULL,
  `Motivo_Consulta_Sintoma` varchar(255) NOT NULL,
  `Categoria` varchar(100) NOT NULL,
  `Codigo_Triaje` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_MOTIVO_CONSULTA_SINTOMAS`
--

INSERT INTO `CAT_MOTIVO_CONSULTA_SINTOMAS` (`Codigo`, `Motivo_Consulta_Sintoma`, `Categoria`, `Codigo_Triaje`) VALUES
(878, 'Fiebre (aguda)', 'General', 3),
(879, 'Fiebre (persistente)', 'General', 4),
(880, 'Fiebre (intermitente)', 'General', 4),
(881, 'Malestar general', 'General', 4),
(882, 'Astenia (cansancio, fatiga, debilidad)', 'General', 4),
(883, 'Adinamia (falta de energía)', 'General', 4),
(884, 'Pérdida de peso inexplicable', 'General', 3),
(885, 'Aumento de peso inexplicable', 'General', 4),
(886, 'Anorexia (pérdida de apetito)', 'General', 4),
(887, 'Sudoración nocturna', 'General', 4),
(888, 'Escalofríos', 'General', 3),
(889, 'Dolor (generalizado)', 'General', 3),
(890, 'Dolor (localizado)', 'General', 3),
(891, 'Dolor (agudo)', 'General', 2),
(892, 'Dolor (crónico)', 'General', 4),
(893, 'Dolor (inespecífico)', 'General', 4),
(894, 'Edema (hinchazón localizada)', 'General', 4),
(895, 'Edema (hinchazón generalizada)', 'General', 2),
(896, 'Mareo', 'General', 3),
(897, 'Vértigo (sensación de giro)', 'General', 3),
(898, 'Vértigo (sensación de inestabilidad)', 'General', 3),
(899, 'Desmayo', 'General', 2),
(900, 'Síncope (pérdida transitoria de conciencia)', 'General', 2),
(901, 'Palidez', 'General', 3),
(902, 'Ictericia (coloración amarillenta de piel y ojos)', 'General', 2),
(903, 'Cianosis (coloración azulada de piel y mucosas)', 'General', 1),
(904, 'Linfadenopatías (ganglios inflamados)', 'General', 4),
(905, 'Prurito (picazón generalizada)', 'General', 4),
(906, 'Prurito (picazón localizada)', 'General', 4),
(907, 'Reacción alérgica (rash)', 'General', 3),
(908, 'Reacción alérgica (urticaria)', 'General', 3),
(909, 'Reacción alérgica (angioedema)', 'General', 1),
(910, 'Intolerancia al frío', 'General', 4),
(911, 'Intolerancia al calor', 'General', 4),
(912, 'Sensación de hormigueo (parestesias)', 'General', 3),
(913, 'Entumecimiento', 'General', 3),
(914, 'Calambres musculares', 'General', 4),
(915, 'Espasmos musculares', 'General', 4),
(916, 'Temblor (en reposo)', 'General', 4),
(917, 'Temblor (con movimiento)', 'General', 4),
(918, 'Rigidez (matutina)', 'General', 4),
(919, 'Rigidez (articular)', 'General', 4),
(920, 'Sensación de ardor (cutáneo)', 'General', 4),
(921, 'Sensación de ardor (interno)', 'General', 3),
(922, 'Sensación de opresión (en pecho)', 'General', 2),
(923, 'Sensación de opresión (en cabeza)', 'General', 3),
(924, 'Sensación de pesadez', 'General', 4),
(925, 'Fatiga crónica', 'General', 5),
(926, 'Dolor de cabeza (cefalea)', 'General', 3),
(927, 'Dolor de cabeza (migraña)', 'General', 3),
(928, 'Dolor de cabeza (tensional)', 'General', 4),
(929, 'Sensación de \"cabeza ligera\"', 'General', 3),
(930, 'Desequilibrio al caminar', 'General', 3),
(931, 'Inestabilidad postural', 'General', 3),
(932, 'Sensación de despersonalización/desrealización', 'General', 4),
(933, 'Cambios en la voz (sin causa respiratoria aparente)', 'General', 4),
(934, 'Ronquidos (sin apnea del sueño confirmada)', 'General', 5),
(935, 'Bruxismo (rechinar de dientes)', 'General', 5),
(936, 'Sudoración excesiva (hiperhidrosis generalizada)', 'General', 4),
(937, 'Sequedad de boca persistente (xerostomía)', 'General', 5),
(938, 'Sequedad ocular', 'General', 5),
(939, 'Ojos llorosos', 'General', 4),
(940, 'Sensibilidad a la luz (fotofobia)', 'General', 3),
(941, 'Sensibilidad al sonido (hiperacusia)', 'General', 4),
(942, 'Dolor en las articulaciones temporomandibulares (ATM)', 'General', 4),
(943, 'Zumbido en los oídos (tinnitus)', 'General', 4),
(944, 'Visión de \"moscas volantes\" (miodesopsias)', 'General', 3),
(945, 'Destellos de luz (fotopsias)', 'General', 2),
(946, 'Pérdida de visión periférica', 'General', 2),
(947, 'Dolor dental (sin causa aparente)', 'General', 4),
(948, 'Sangrado de encías', 'General', 4),
(949, 'Mal aliento (halitosis)', 'General', 5),
(950, 'Úlceras bucales recurrentes', 'General', 4),
(951, 'Dolor de garganta crónico (sin infección)', 'General', 5),
(952, 'Sensación de nudo en la garganta (globo histérico)', 'General', 4),
(953, 'Dificultad para respirar al hablar', 'General', 3),
(954, 'Dolor al deglutir líquidos', 'General', 3),
(955, 'Dolor al deglutir sólidos', 'General', 3),
(956, 'Sensación de ardor en la lengua', 'General', 4),
(957, 'Cambios en el color de la lengua', 'General', 4),
(958, 'Grietas en las comisuras de la boca (queilitis angular)', 'General', 4),
(959, 'Labios secos y agrietados', 'General', 5),
(960, 'Dolor en el pecho atípico (no cardíaco)', 'General', 3),
(961, 'Dolor en la espalda atípico (no musculoesquelético)', 'General', 3),
(962, 'Dolor en las extremidades (sin causa aparente)', 'General', 4),
(963, 'Sensación de frío en una extremidad', 'General', 3),
(964, 'Sensación de calor en una extremidad', 'General', 3),
(965, 'Cambios en el color de la piel de las extremidades', 'General', 3),
(966, 'Uñas frágiles', 'General', 5),
(967, 'Uñas con estrías', 'General', 5),
(968, 'Uñas con manchas', 'General', 5),
(969, 'Pelo quebradizo', 'General', 5),
(970, 'Pelo graso', 'General', 5),
(971, 'Pelo seco', 'General', 5),
(972, 'Aparición de canas prematuras', 'General', 5),
(973, 'Tos (seca)', 'Respiratorio', 4),
(974, 'Tos (productiva)', 'Respiratorio', 4),
(975, 'Tos (con flema)', 'Respiratorio', 4),
(976, 'Tos (con sangre/hemoptisis)', 'Respiratorio', 1),
(977, 'Dificultad para respirar (disnea)', 'Respiratorio', 2),
(978, 'Dificultad para respirar (de esfuerzo)', 'Respiratorio', 3),
(979, 'Dificultad para respirar (en reposo)', 'Respiratorio', 1),
(980, 'Dificultad para respirar (nocturna)', 'Respiratorio', 2),
(981, 'Sibilancias (silbidos al respirar)', 'Respiratorio', 2),
(982, 'Dolor de garganta (odinofagia)', 'Respiratorio', 4),
(983, 'Ronquera', 'Respiratorio', 4),
(984, 'Disfonía', 'Respiratorio', 4),
(985, 'Congestión nasal', 'Respiratorio', 5),
(986, 'Secreción nasal (rinorrea)', 'Respiratorio', 5),
(987, 'Estornudos', 'Respiratorio', 5),
(988, 'Dolor en el pecho al respirar (pleurítico)', 'Respiratorio', 3),
(989, 'Opresión en el pecho', 'Respiratorio', 2),
(990, 'Respiración ruidosa (estridor)', 'Respiratorio', 1),
(991, 'Respiración ruidosa (roncus)', 'Respiratorio', 3),
(992, 'Apnea del sueño (sospecha)', 'Respiratorio', 4),
(993, 'Pausas respiratorias', 'Respiratorio', 2),
(994, 'Dolor en los senos paranasales', 'Respiratorio', 4),
(995, 'Pérdida del olfato (anosmia)', 'Respiratorio', 5),
(996, 'Voz alterada', 'Respiratorio', 4),
(997, 'Sensación de cuerpo extraño en la garganta', 'Respiratorio', 4),
(998, 'Tiraje intercostal/subcostal (en niños)', 'Respiratorio', 2),
(999, 'Aleteo nasal (en niños)', 'Respiratorio', 2),
(1000, 'Cianosis perioral (alrededor de la boca)', 'Respiratorio', 1),
(1001, 'Dolor abdominal (tipo)', 'Gastrointestinal', 3),
(1002, 'Dolor abdominal (localización)', 'Gastrointestinal', 3),
(1003, 'Dolor abdominal (irradiación)', 'Gastrointestinal', 3),
(1004, 'Dolor abdominal (cólico)', 'Gastrointestinal', 3),
(1005, 'Dolor abdominal (punzante)', 'Gastrointestinal', 3),
(1006, 'Náuseas', 'Gastrointestinal', 4),
(1007, 'Vómitos', 'Gastrointestinal', 3),
(1008, 'Vómitos (en proyectil)', 'Gastrointestinal', 2),
(1009, 'Vómitos (con sangre/hematemesis)', 'Gastrointestinal', 1),
(1010, 'Diarrea (aguda)', 'Gastrointestinal', 3),
(1011, 'Diarrea (crónica)', 'Gastrointestinal', 4),
(1012, 'Diarrea (con sangre/hematoquecia)', 'Gastrointestinal', 2),
(1013, 'Diarrea (con moco)', 'Gastrointestinal', 4),
(1014, 'Diarrea (esteatorrea)', 'Gastrointestinal', 4),
(1015, 'Estreñimiento (crónico)', 'Gastrointestinal', 5),
(1016, 'Estreñimiento (agudo)', 'Gastrointestinal', 4),
(1017, 'Estreñimiento (con esfuerzo)', 'Gastrointestinal', 4),
(1018, 'Acidez estomacal (pirosis)', 'Gastrointestinal', 4),
(1019, 'Reflujo gastroesofágico', 'Gastrointestinal', 4),
(1020, 'Indigestión', 'Gastrointestinal', 4),
(1021, 'Dispepsia', 'Gastrointestinal', 4),
(1022, 'Hinchazón abdominal', 'Gastrointestinal', 4),
(1023, 'Distensión abdominal', 'Gastrointestinal', 3),
(1024, 'Gases (flatulencias)', 'Gastrointestinal', 5),
(1025, 'Gases (eructos frecuentes)', 'Gastrointestinal', 5),
(1026, 'Sangre en las heces (melena - heces negras)', 'Gastrointestinal', 2),
(1027, 'Sangre en las heces (hematoquecia - sangre roja)', 'Gastrointestinal', 2),
(1028, 'Cambios en el hábito intestinal', 'Gastrointestinal', 3),
(1029, 'Dolor al defecar', 'Gastrointestinal', 4),
(1030, 'Hemorroides (sangrado)', 'Gastrointestinal', 4),
(1031, 'Hemorroides (dolor)', 'Gastrointestinal', 4),
(1032, 'Hemorroides (prolapso)', 'Gastrointestinal', 4),
(1033, 'Fisura anal (dolor)', 'Gastrointestinal', 4),
(1034, 'Fisura anal (sangrado)', 'Gastrointestinal', 4),
(1035, 'Dificultad para tragar (disfagia)', 'Gastrointestinal', 2),
(1036, 'Dificultad para tragar (para sólidos)', 'Gastrointestinal', 3),
(1037, 'Dificultad para tragar (para líquidos)', 'Gastrointestinal', 2),
(1038, 'Dolor al tragar (odinofagia)', 'Gastrointestinal', 4),
(1039, 'Masa abdominal palpable', 'Gastrointestinal', 2),
(1040, 'Heces pálidas (acolia)', 'Gastrointestinal', 3),
(1041, 'Orina oscura (coluria)', 'Gastrointestinal', 3),
(1042, 'Ruidos intestinales aumentados', 'Gastrointestinal', 4),
(1043, 'Ruidos intestinales disminuidos', 'Gastrointestinal', 3),
(1044, 'Dolor en el hipocondrio derecho', 'Gastrointestinal', 3),
(1045, 'Dolor en el hipocondrio izquierdo', 'Gastrointestinal', 3),
(1046, 'Dolor en el epigastrio', 'Gastrointestinal', 3),
(1047, 'Regurgitación', 'Gastrointestinal', 4),
(1048, 'Sensación de plenitud postprandial', 'Gastrointestinal', 5),
(1049, 'Dolor perianal', 'Gastrointestinal', 4),
(1050, 'Dolor en el pecho (angina)', 'Cardiovascular', 2),
(1051, 'Dolor en el pecho (opresivo)', 'Cardiovascular', 2),
(1052, 'Dolor en el pecho (punzante)', 'Cardiovascular', 3),
(1053, 'Dolor en el pecho (irradiado)', 'Cardiovascular', 2),
(1054, 'Palpitaciones (sensación de latidos rápidos)', 'Cardiovascular', 2),
(1055, 'Palpitaciones (sensación de latidos fuertes)', 'Cardiovascular', 3),
(1056, 'Palpitaciones (sensación de latidos irregulares)', 'Cardiovascular', 2),
(1057, 'Falta de aire (disnea de esfuerzo)', 'Cardiovascular', 3),
(1058, 'Falta de aire (en reposo)', 'Cardiovascular', 1),
(1059, 'Ortopnea (dificultad para respirar acostado)', 'Cardiovascular', 2),
(1060, 'Disnea paroxística nocturna', 'Cardiovascular', 2),
(1061, 'Hinchazón de piernas (edema)', 'Cardiovascular', 3),
(1062, 'Hinchazón de tobillos (edema)', 'Cardiovascular', 3),
(1063, 'Edema (bilateral)', 'Cardiovascular', 3),
(1064, 'Edema (unilateral)', 'Cardiovascular', 3),
(1065, 'Cansancio fácil (fatiga cardiovascular)', 'Cardiovascular', 4),
(1066, 'Mareos (de origen cardiovascular)', 'Cardiovascular', 2),
(1067, 'Síncope (pérdida de conciencia de origen cardiovascular)', 'Cardiovascular', 1),
(1068, 'Presión arterial alta (síntomas de crisis hipertensiva)', 'Cardiovascular', 2),
(1069, 'Presión arterial baja (síntomas de hipotensión)', 'Cardiovascular', 2),
(1070, 'Dolor en las pantorrillas al caminar (claudicación intermitente)', 'Cardiovascular', 4),
(1071, 'Venas varicosas (dolor)', 'Cardiovascular', 4),
(1072, 'Venas varicosas (pesadez)', 'Cardiovascular', 5),
(1073, 'Venas varicosas (hinchazón)', 'Cardiovascular', 4),
(1074, 'Cianosis (coloración azulada)', 'Cardiovascular', 1),
(1075, 'Dolor en el brazo izquierdo (irradiado)', 'Cardiovascular', 2),
(1076, 'Dolor en la mandíbula (irradiado)', 'Cardiovascular', 2),
(1077, 'Sudoración fría (asociada a dolor torácico)', 'Cardiovascular', 1),
(1078, 'Dolor de espalda con síntomas cardíacos (irradiado)', 'Cardiovascular', 2),
(1079, 'Desmayo al levantarse (hipotensión ortostática)', 'Cardiovascular', 3),
(1080, 'Sensación de opresión en el cuello (de origen cardíaco)', 'Cardiovascular', 2),
(1081, 'Pulso irregular', 'Cardiovascular', 2),
(1082, 'Pulso débil', 'Cardiovascular', 1),
(1083, 'Dedos fríos y pálidos (fenómeno de Raynaud)', 'Cardiovascular', 4),
(1084, 'Dolor al orinar (disuria)', 'Urológico/Renal', 3),
(1085, 'Dolor al orinar (ardor)', 'Urológico/Renal', 3),
(1086, 'Orinar con mucha frecuencia (polaquiuria)', 'Urológico/Renal', 3),
(1087, 'Necesidad urgente de orinar (tenesmo vesical)', 'Urológico/Renal', 3),
(1088, 'Orinar por la noche (nicturia)', 'Urológico/Renal', 4),
(1089, 'Sangre en la orina (hematuria macroscópica)', 'Urológico/Renal', 2),
(1090, 'Sangre en la orina (hematuria microscópica)', 'Urológico/Renal', 3),
(1091, 'Orina turbia', 'Urológico/Renal', 4),
(1092, 'Orina con mal olor', 'Urológico/Renal', 4),
(1093, 'Incontinencia urinaria (de esfuerzo)', 'Urológico/Renal', 5),
(1094, 'Incontinencia urinaria (de urgencia)', 'Urológico/Renal', 4),
(1095, 'Incontinencia urinaria (por rebosamiento)', 'Urológico/Renal', 3),
(1096, 'Dificultad para iniciar la micción (vacilación)', 'Urológico/Renal', 4),
(1097, 'Chorro urinario débil', 'Urológico/Renal', 4),
(1098, 'Chorro urinario intermitente', 'Urológico/Renal', 4),
(1099, 'Dolor en la zona lumbar (flanco unilateral)', 'Urológico/Renal', 2),
(1100, 'Dolor en la zona lumbar (flanco bilateral)', 'Urológico/Renal', 3),
(1101, 'Retención urinaria (incapacidad para vaciar la vejiga)', 'Urológico/Renal', 2),
(1102, 'Dolor testicular', 'Urológico/Renal', 2),
(1103, 'Hinchazón escrotal', 'Urológico/Renal', 2),
(1104, 'Eyaculación dolorosa', 'Urológico/Renal', 4),
(1105, 'Disfunción eréctil', 'Urológico/Renal', 5),
(1106, 'Cambios en el volumen de orina (poliuria)', 'Urológico/Renal', 4),
(1107, 'Cambios en el volumen de orina (oliguria)', 'Urológico/Renal', 2),
(1108, 'Cambios en el volumen de orina (anuria)', 'Urológico/Renal', 1),
(1109, 'Dolor suprapúbico', 'Urológico/Renal', 3),
(1110, 'Dolor en la uretra', 'Urológico/Renal', 4),
(1111, 'Secreción uretral', 'Urológico/Renal', 3),
(1112, 'Prurito genital (masculino)', 'Urológico/Renal', 4),
(1113, 'Masa en los testículos', 'Urológico/Renal', 3),
(1114, 'Dolor en el pene', 'Urológico/Renal', 3),
(1115, 'Priapismo (erección prolongada y dolorosa)', 'Urológico/Renal', 2),
(1116, 'Retraso menstrual', 'Ginecológico/Obstétrico', 4),
(1117, 'Amenorrea (ausencia de menstruación)', 'Ginecológico/Obstétrico', 4),
(1118, 'Sangrado vaginal anormal (metrorragia - sangrado irregular)', 'Ginecológico/Obstétrico', 3),
(1119, 'Sangrado vaginal anormal (menorragia - sangrado abundante)', 'Ginecológico/Obstétrico', 2),
(1120, 'Dolor menstrual intenso (dismenorrea)', 'Ginecológico/Obstétrico', 4),
(1121, 'Dolor pélvico crónico', 'Ginecológico/Obstétrico', 4),
(1122, 'Secreción vaginal anormal (flujo)', 'Ginecológico/Obstétrico', 4),
(1123, 'Secreción vaginal anormal (olor)', 'Ginecológico/Obstétrico', 4),
(1124, 'Secreción vaginal anormal (color)', 'Ginecológico/Obstétrico', 4),
(1125, 'Secreción vaginal anormal (picazón/prurito)', 'Ginecológico/Obstétrico', 4),
(1126, 'Dolor durante las relaciones sexuales (dispareunia)', 'Ginecológico/Obstétrico', 4),
(1127, 'Bulto en el seno', 'Ginecológico/Obstétrico', 3),
(1128, 'Dolor en el seno (mastalgia)', 'Ginecológico/Obstétrico', 4),
(1129, 'Cambios en el pezón (secreción)', 'Ginecológico/Obstétrico', 3),
(1130, 'Cambios en el pezón (retracción)', 'Ginecológico/Obstétrico', 3),
(1131, 'Náuseas en el embarazo', 'Ginecológico/Obstétrico', 4),
(1132, 'Vómitos en el embarazo (hiperemesis gravídica)', 'Ginecológico/Obstétrico', 3),
(1133, 'Sangrado en el embarazo (amenaza de aborto)', 'Ginecológico/Obstétrico', 2),
(1134, 'Sangrado en el embarazo (desprendimiento)', 'Ginecológico/Obstétrico', 1),
(1135, 'Contracciones (prematuras)', 'Ginecológico/Obstétrico', 2),
(1136, 'Contracciones (de parto)', 'Ginecológico/Obstétrico', 2),
(1137, 'Disminución de movimientos fetales', 'Ginecológico/Obstétrico', 1),
(1138, 'Hinchazón en el embarazo (edema manos)', 'Ginecológico/Obstétrico', 3),
(1139, 'Hinchazón en el embarazo (edema cara)', 'Ginecológico/Obstétrico', 3),
(1140, 'Hinchazón en el embarazo (edema piernas)', 'Ginecológico/Obstétrico', 4),
(1141, 'Dolor de cabeza en el embarazo (sospecha de preeclampsia)', 'Ginecológico/Obstétrico', 2),
(1142, 'Pérdida de líquido amniótico', 'Ginecológico/Obstétrico', 1),
(1143, 'Fiebre en el embarazo', 'Ginecológico/Obstétrico', 2),
(1144, 'Síntomas de menopausia (sofocos)', 'Ginecológico/Obstétrico', 5),
(1145, 'Síntomas de menopausia (sequedad vaginal)', 'Ginecológico/Obstétrico', 5),
(1146, 'Síntomas de menopausia (cambios de humor)', 'Ginecológico/Obstétrico', 5),
(1147, 'Sangrado postmenopáusico', 'Ginecológico/Obstétrico', 2),
(1148, 'Dolor en la pelvis', 'Ginecológico/Obstétrico', 3),
(1149, 'Dolor en los ovarios', 'Ginecológico/Obstétrico', 3),
(1150, 'Sensación de peso en la pelvis (prolapso)', 'Ginecológico/Obstétrico', 4),
(1151, 'Dolor en la vulva', 'Ginecológico/Obstétrico', 4),
(1152, 'Úlceras genitales (femeninas)', 'Ginecológico/Obstétrico', 4),
(1153, 'Verrugas genitales (femeninas)', 'Ginecológico/Obstétrico', 5),
(1154, 'Dolor en el bajo vientre (ginecológico)', 'Ginecológico/Obstétrico', 3),
(1155, 'Cambios en el ciclo menstrual (irregularidades)', 'Ginecológico/Obstétrico', 4),
(1156, 'Dolor de espalda (lumbalgia)', 'Musculoesquelético', 4),
(1157, 'Dolor de espalda (cervicalgia)', 'Musculoesquelético', 4),
(1158, 'Dolor de espalda (dorsalgia)', 'Musculoesquelético', 4),
(1159, 'Dolor de espalda (ciática)', 'Musculoesquelético', 3),
(1160, 'Dolor articular (artralgia)', 'Musculoesquelético', 4),
(1161, 'Dolor articular (en una articulación)', 'Musculoesquelético', 4),
(1162, 'Dolor articular (en varias articulaciones)', 'Musculoesquelético', 4),
(1163, 'Hinchazón articular (artritis)', 'Musculoesquelético', 3),
(1164, 'Hinchazón articular (con calor)', 'Musculoesquelético', 3),
(1165, 'Hinchazón articular (con enrojecimiento)', 'Musculoesquelético', 3),
(1166, 'Rigidez articular (matutina)', 'Musculoesquelético', 4),
(1167, 'Rigidez articular (post-reposo)', 'Musculoesquelético', 4),
(1168, 'Dolor muscular (mialgia)', 'Musculoesquelético', 4),
(1169, 'Dolor muscular (localizado)', 'Musculoesquelético', 4),
(1170, 'Dolor muscular (generalizado)', 'Musculoesquelético', 4),
(1171, 'Calambres musculares', 'Musculoesquelético', 4),
(1172, 'Debilidad muscular (generalizada)', 'Musculoesquelético', 2),
(1173, 'Debilidad muscular (localizada)', 'Musculoesquelético', 3),
(1174, 'Limitación del movimiento (articular)', 'Musculoesquelético', 3),
(1175, 'Limitación del movimiento (muscular)', 'Musculoesquelético', 3),
(1176, 'Dolor post-golpe', 'Musculoesquelético', 3),
(1177, 'Dolor post-caída', 'Musculoesquelético', 3),
(1178, 'Dolor post-esguince', 'Musculoesquelético', 3),
(1179, 'Dolor post-fractura', 'Musculoesquelético', 2),
(1180, 'Hinchazón post-traumatismo', 'Musculoesquelético', 3),
(1181, 'Deformidad post-traumatismo', 'Musculoesquelético', 2),
(1182, 'Dolor en el cuello (tortícolis)', 'Musculoesquelético', 4),
(1183, 'Dolor en el hombro (tendinitis)', 'Musculoesquelético', 4),
(1184, 'Dolor en el hombro (bursitis)', 'Musculoesquelético', 4),
(1185, 'Dolor en el codo (epicondilitis)', 'Musculoesquelético', 4),
(1186, 'Dolor en el codo (epitrocleítis)', 'Musculoesquelético', 4),
(1187, 'Dolor en la muñeca (síndrome del túnel carpiano)', 'Musculoesquelético', 4),
(1188, 'Dolor en la mano / dedos (artritis)', 'Musculoesquelético', 4),
(1189, 'Dolor en la mano / dedos (tendinitis)', 'Musculoesquelético', 4),
(1190, 'Dolor en la cadera', 'Musculoesquelético', 3),
(1191, 'Dolor en la rodilla (meniscal)', 'Musculoesquelético', 3),
(1192, 'Dolor en la rodilla (ligamentoso)', 'Musculoesquelético', 3),
(1193, 'Dolor en el tobillo (esguince)', 'Musculoesquelético', 3),
(1194, 'Dolor en el tobillo (tendinitis)', 'Musculoesquelético', 4),
(1195, 'Dolor en el pie / dedos del pie (fascitis plantar)', 'Musculoesquelético', 4),
(1196, 'Dolor en el pie / dedos del pie (juanete)', 'Musculoesquelético', 5),
(1197, 'Deformidad articular', 'Musculoesquelético', 3),
(1198, 'Chasquidos articulares', 'Musculoesquelético', 5),
(1199, 'Sensación de inestabilidad articular', 'Musculoesquelético', 3),
(1200, 'Dolor al cargar peso', 'Musculoesquelético', 4),
(1201, 'Dolor al mover la articulación', 'Musculoesquelético', 4),
(1202, 'Dolor que empeora con la actividad', 'Musculoesquelético', 4),
(1203, 'Dolor que mejora con el reposo', 'Musculoesquelético', 4),
(1204, 'Dolor nocturno (musculoesquelético)', 'Musculoesquelético', 4),
(1205, 'Contracturas musculares', 'Musculoesquelético', 4),
(1206, 'Nódulos musculares', 'Musculoesquelético', 4),
(1207, 'Sensación de quemazón en las articulaciones', 'Musculoesquelético', 4),
(1208, 'Dolor de cabeza (cefalea neurológica)', 'Neurológico', 3),
(1209, 'Dolor de cabeza (migraña neurológica)', 'Neurológico', 3),
(1210, 'Dolor de cabeza (tensional neurológica)', 'Neurológico', 4),
(1211, 'Dolor de cabeza (en trueno)', 'Neurológico', 1),
(1212, 'Mareos (neurológico)', 'Neurológico', 3),
(1213, 'Vértigo (sensación de giro neurológico)', 'Neurológico', 3),
(1214, 'Vértigo (inestabilidad neurológica)', 'Neurológico', 3),
(1215, 'Desmayo (neurológico)', 'Neurológico', 2),
(1216, 'Síncope (pérdida de conciencia neurológica)', 'Neurológico', 1),
(1217, 'Convulsiones (generalizadas)', 'Neurológico', 1),
(1218, 'Convulsiones (focales)', 'Neurológico', 2),
(1219, 'Crisis epilépticas', 'Neurológico', 1),
(1220, 'Pérdida de conciencia (sin convulsiones)', 'Neurológico', 2),
(1221, 'Debilidad en una parte del cuerpo (hemiparesia)', 'Neurológico', 1),
(1222, 'Debilidad en una parte del cuerpo (monoparesia)', 'Neurológico', 2),
(1223, 'Parálisis (hemiplejia)', 'Neurológico', 1),
(1224, 'Parálisis (paraplejia)', 'Neurológico', 1),
(1225, 'Parálisis (cuadriplejia)', 'Neurológico', 1),
(1226, 'Dificultad para hablar (disartria)', 'Neurológico', 2),
(1227, 'Dificultad para hablar (afasia expresiva)', 'Neurológico', 2),
(1228, 'Dificultad para hablar (afasia receptiva)', 'Neurológico', 2),
(1229, 'Problemas de visión (visión borrosa neurológica)', 'Neurológico', 2),
(1230, 'Problemas de visión (visión doble/diplopía neurológica)', 'Neurológico', 2),
(1231, 'Problemas de visión (pérdida súbita de visión)', 'Neurológico', 1),
(1232, 'Problemas de visión (pérdida progresiva de visión)', 'Neurológico', 3),
(1233, 'Entumecimiento (parestesias)', 'Neurológico', 3),
(1234, 'Entumecimiento (en extremidades)', 'Neurológico', 3),
(1235, 'Entumecimiento (en cara)', 'Neurológico', 2),
(1236, 'Hormigueo (parestesias)', 'Neurológico', 3),
(1237, 'Hormigueo (en extremidades)', 'Neurológico', 3),
(1238, 'Hormigueo (en cara)', 'Neurológico', 2),
(1239, 'Temblor (de reposo)', 'Neurológico', 4),
(1240, 'Temblor (de acción)', 'Neurológico', 4),
(1241, 'Temblor (postural)', 'Neurológico', 4),
(1242, 'Problemas de equilibrio (ataxia)', 'Neurológico', 2),
(1243, 'Marcha inestable (ataxia)', 'Neurológico', 2),
(1244, 'Pérdida de memoria (amnesia anterógrada)', 'Neurológico', 3),
(1245, 'Pérdida de memoria (amnesia retrógrada)', 'Neurológico', 3),
(1246, 'Confusión', 'Neurológico', 2),
(1247, 'Desorientación (temporal)', 'Neurológico', 2),
(1248, 'Desorientación (espacial)', 'Neurológico', 2),
(1249, 'Desorientación (personal)', 'Neurológico', 2),
(1250, 'Cambios en la personalidad (neurológico)', 'Neurológico', 3),
(1251, 'Insomnio (de origen neurológico)', 'Neurológico', 4),
(1252, 'Somnolencia excesiva (de origen neurológico)', 'Neurológico', 3),
(1253, 'Dolor neuropático (ardor)', 'Neurológico', 4),
(1254, 'Dolor neuropático (punzante)', 'Neurológico', 4),
(1255, 'Dolor neuropático (eléctrico)', 'Neurológico', 4),
(1256, 'Tics nerviosos (motores)', 'Neurológico', 4),
(1257, 'Tics nerviosos (vocales)', 'Neurológico', 4),
(1258, 'Vértigo posicional (benigno paroxístico)', 'Neurológico', 3),
(1259, 'Parálisis facial (Bell)', 'Neurológico', 2),
(1260, 'Alteración del gusto', 'Neurológico', 4),
(1261, 'Alteración del olfato', 'Neurológico', 4),
(1262, 'Pérdida de audición (hipoacusia)', 'Neurológico', 4),
(1263, 'Zumbido en los oídos (tinnitus neurológico)', 'Neurológico', 4),
(1264, 'Sensación de cabeza hueca', 'Neurológico', 4),
(1265, 'Sensación de presión en la cabeza', 'Neurológico', 3),
(1266, 'Sensación de hormigueo en la cara', 'Neurológico', 2),
(1267, 'Sensación de quemazón en la piel (neurológica)', 'Neurológico', 4),
(1268, 'Dificultad para coordinar movimientos (disdiadococinesia)', 'Neurológico', 3),
(1269, 'Disfagia (de origen neurológico)', 'Neurológico', 2),
(1270, 'Diplopía (visión doble)', 'Neurológico', 2),
(1271, 'Nistagmo (movimientos oculares involuntarios)', 'Neurológico', 2),
(1272, 'Erupción cutánea (rash)', 'Dermatológico', 4),
(1273, 'Erupción cutánea (maculopapular)', 'Dermatológico', 4),
(1274, 'Erupción cutánea (vesicular)', 'Dermatológico', 4),
(1275, 'Erupción cutánea (pustular)', 'Dermatológico', 4),
(1276, 'Picazón (prurito cutáneo)', 'Dermatológico', 4),
(1277, 'Picazón (localizado cutáneo)', 'Dermatológico', 4),
(1278, 'Picazón (generalizado cutáneo)', 'Dermatológico', 4),
(1279, 'Enrojecimiento de la piel (eritema localizado)', 'Dermatológico', 4),
(1280, 'Enrojecimiento de la piel (eritema difuso)', 'Dermatológico', 3),
(1281, 'Lesiones en la piel (ampollas)', 'Dermatológico', 3),
(1282, 'Lesiones en la piel (pústulas)', 'Dermatológico', 3),
(1283, 'Lesiones en la piel (úlceras)', 'Dermatológico', 3),
(1284, 'Lesiones en la piel (nódulos)', 'Dermatológico', 3),
(1285, 'Lesiones en la piel (pápulas)', 'Dermatológico', 4),
(1286, 'Lesiones en la piel (placas)', 'Dermatológico', 4),
(1287, 'Cambios en lunares (tamaño)', 'Dermatológico', 3),
(1288, 'Cambios en lunares (forma)', 'Dermatológico', 3),
(1289, 'Cambios en lunares (color)', 'Dermatológico', 3),
(1290, 'Cambios en lunares (picazón)', 'Dermatológico', 3),
(1291, 'Cambios en lunares (sangrado)', 'Dermatológico', 3),
(1292, 'Cambios en lunares (asimetría)', 'Dermatológico', 3),
(1293, 'Cambios en lunares (bordes irregulares)', 'Dermatológico', 3),
(1294, 'Acné (comedones)', 'Dermatológico', 5),
(1295, 'Acné (pápulas)', 'Dermatológico', 5),
(1296, 'Acné (pústulas)', 'Dermatológico', 5),
(1297, 'Acné (quistes)', 'Dermatológico', 4),
(1298, 'Dermatitis (eczema)', 'Dermatológico', 4),
(1299, 'Dermatitis (atópica)', 'Dermatológico', 4),
(1300, 'Dermatitis (de contacto)', 'Dermatológico', 4),
(1301, 'Dermatitis (seborreica)', 'Dermatológico', 4),
(1302, 'Psoriasis (placas eritematoescamosas)', 'Dermatológico', 4),
(1303, 'Urticaria (habones)', 'Dermatológico', 3),
(1304, 'Urticaria (angioedema)', 'Dermatológico', 1),
(1305, 'Hongos en la piel / uñas (micosis)', 'Dermatológico', 5),
(1306, 'Hongos en las uñas (onicomicosis)', 'Dermatológico', 5),
(1307, 'Infecciones bacterianas de la piel (impétigo)', 'Dermatológico', 4),
(1308, 'Infecciones bacterianas de la piel (celulitis)', 'Dermatológico', 3),
(1309, 'Infecciones bacterianas de la piel (erisipela)', 'Dermatológico', 3),
(1310, 'Infecciones bacterianas de la piel (forúnculos)', 'Dermatológico', 4),
(1311, 'Verrugas (comunes)', 'Dermatológico', 5),
(1312, 'Verrugas (plantares)', 'Dermatológico', 5),
(1313, 'Verrugas (genitales)', 'Dermatológico', 5),
(1314, 'Herpes (labial)', 'Dermatológico', 4),
(1315, 'Herpes (zóster)', 'Dermatológico', 3),
(1316, 'Herpes (genital)', 'Dermatológico', 4),
(1317, 'Quemaduras (dolor)', 'Dermatológico', 3),
(1318, 'Quemaduras (enrojecimiento)', 'Dermatológico', 3),
(1319, 'Quemaduras (ampollas)', 'Dermatológico', 2),
(1320, 'Quemaduras (necrosis)', 'Dermatológico', 1),
(1321, 'Picaduras de insectos (reacción local)', 'Dermatológico', 4),
(1322, 'Picaduras de insectos (reacción sistémica)', 'Dermatológico', 1),
(1323, 'Reacciones alérgicas en la piel (por contacto)', 'Dermatológico', 4),
(1324, 'Reacciones alérgicas en la piel (por fármacos)', 'Dermatológico', 3),
(1325, 'Caída del cabello (alopecia difusa)', 'Dermatológico', 5),
(1326, 'Caída del cabello (alopecia areata)', 'Dermatológico', 5),
(1327, 'Uñas quebradizas / con cambios (color)', 'Dermatológico', 5),
(1328, 'Uñas quebradizas / con cambios (forma)', 'Dermatológico', 5),
(1329, 'Uñas quebradizas / con cambios (engrosamiento)', 'Dermatológico', 5),
(1330, 'Piel seca (xerosis)', 'Dermatológico', 5),
(1331, 'Piel grasa (seborrea)', 'Dermatológico', 5),
(1332, 'Sudoración excesiva (hiperhidrosis localizada)', 'Dermatológico', 5),
(1333, 'Quistes sebáceos', 'Dermatológico', 5),
(1334, 'Lipomas', 'Dermatológico', 5),
(1335, 'Cicatrices anormales (queloides)', 'Dermatológico', 5),
(1336, 'Cicatrices anormales (hipertróficas)', 'Dermatológico', 5),
(1337, 'Decoloración de la piel (hipopigmentación)', 'Dermatológico', 5),
(1338, 'Decoloración de la piel (hiperpigmentación)', 'Dermatológico', 5),
(1339, 'Decoloración de la piel (vitíligo)', 'Dermatológico', 5),
(1340, 'Úlceras por presión', 'Dermatológico', 3),
(1341, 'Piel escamosa', 'Dermatológico', 4),
(1342, 'Piel agrietada', 'Dermatológico', 4),
(1343, 'Piel sensible', 'Dermatológico', 5),
(1344, 'Ampollas por fricción', 'Dermatológico', 4),
(1345, 'Rosácea (enrojecimiento facial)', 'Dermatológico', 4),
(1346, 'Rosácea (pápulas)', 'Dermatológico', 4),
(1347, 'Rosácea (pústulas)', 'Dermatológico', 4),
(1348, 'Nevus (aparición)', 'Dermatológico', 4),
(1349, 'Nevus (cambio)', 'Dermatológico', 3),
(1350, 'Queratosis seborreica', 'Dermatológico', 5),
(1351, 'Queratosis actínica', 'Dermatológico', 4),
(1352, 'Carcinoma basocelular (sospecha)', 'Dermatológico', 3),
(1353, 'Carcinoma espinocelular (sospecha)', 'Dermatológico', 3),
(1354, 'Melanoma (sospecha)', 'Dermatológico', 2),
(1355, 'Erisipela', 'Dermatológico', 3),
(1356, 'Foliculitis', 'Dermatológico', 4),
(1357, 'Abscesos cutáneos', 'Dermatológico', 3),
(1358, 'Fiebre en lactantes', 'Pediátrico', 2),
(1359, 'Fiebre en niños (sin foco aparente)', 'Pediátrico', 3),
(1360, 'Irritabilidad en lactantes', 'Pediátrico', 2),
(1361, 'Llanto inconsolable', 'Pediátrico', 3),
(1362, 'Rechazo del alimento (pediátrico)', 'Pediátrico', 3),
(1363, 'Dificultad para alimentarse (pediátrico)', 'Pediátrico', 3),
(1364, 'Vómitos en proyectil (pediátrico)', 'Pediátrico', 2),
(1365, 'Diarrea en niños (con signos de deshidratación)', 'Pediátrico', 2),
(1366, 'Estreñimiento en niños (crónico)', 'Pediátrico', 4),
(1367, 'Estreñimiento en niños (doloroso)', 'Pediátrico', 4),
(1368, 'Erupciones cutáneas infantiles (exantemas virales)', 'Pediátrico', 4),
(1369, 'Erupción cutánea (varicela)', 'Pediátrico', 4),
(1370, 'Erupción cutánea (sarampión)', 'Pediátrico', 3),
(1371, 'Erupción cutánea (rubéola)', 'Pediátrico', 4),
(1372, 'Erupción cutánea (eritema infeccioso)', 'Pediátrico', 4),
(1373, 'Tos persistente en niños', 'Pediátrico', 3),
(1374, 'Dificultad respiratoria en niños (tiraje)', 'Pediátrico', 1),
(1375, 'Dificultad respiratoria en niños (aleteo nasal)', 'Pediátrico', 1),
(1376, 'Dificultad respiratoria en niños (quejido)', 'Pediátrico', 1),
(1377, 'Convulsiones febriles', 'Pediátrico', 1),
(1378, 'Retraso en el desarrollo (motor grueso)', 'Pediátrico', 5),
(1379, 'Retraso en el desarrollo (motor fino)', 'Pediátrico', 5),
(1380, 'Retraso en el desarrollo (del lenguaje)', 'Pediátrico', 5),
(1381, 'Retraso en el desarrollo (cognitivo)', 'Pediátrico', 5),
(1382, 'Retraso en el desarrollo (social)', 'Pediátrico', 5),
(1383, 'Problemas de aprendizaje (dificultad escolar)', 'Pediátrico', 5),
(1384, 'Problemas de conducta (agresividad infantil)', 'Pediátrico', 5),
(1385, 'Problemas de conducta (hiperactividad infantil)', 'Pediátrico', 5),
(1386, 'Problemas de conducta (retraimiento infantil)', 'Pediátrico', 5),
(1387, 'Enuresis (mojar la cama)', 'Pediátrico', 5),
(1388, 'Enuresis (primaria)', 'Pediátrico', 5),
(1389, 'Enuresis (secundaria)', 'Pediátrico', 5),
(1390, 'Encopresis (defecación involuntaria)', 'Pediátrico', 5),
(1391, 'Dolor abdominal recurrente en niños', 'Pediátrico', 4),
(1392, 'Otitis media aguda (dolor de oído pediátrico)', 'Pediátrico', 3),
(1393, 'Otitis media aguda (fiebre pediátrica)', 'Pediátrico', 3),
(1394, 'Otitis media aguda (irritabilidad pediátrica)', 'Pediátrico', 3),
(1395, 'Faringoamigdalitis (dolor de garganta pediátrico)', 'Pediátrico', 4),
(1396, 'Faringoamigdalitis (fiebre pediátrica)', 'Pediátrico', 3),
(1397, 'Faringoamigdalitis (dificultad para tragar pediátrica)', 'Pediátrico', 3),
(1398, 'Pediculosis (piojos, picazón en el cuero cabelludo)', 'Pediátrico', 5),
(1399, 'Escabiosis (sarna, picazón intensa, lesiones cutáneas)', 'Pediátrico', 4),
(1400, 'Ictericia neonatal (coloración amarilla en recién nacidos)', 'Pediátrico', 2),
(1401, 'Reflujo gastroesofágico en lactantes (regurgitaciones frecuentes)', 'Pediátrico', 4),
(1402, 'Reflujo gastroesofágico en lactantes (irritabilidad)', 'Pediátrico', 4),
(1403, 'Cólico del lactante (llanto excesivo)', 'Pediátrico', 4),
(1404, 'Cólico del lactante (irritabilidad)', 'Pediátrico', 4),
(1405, 'Bronquiolitis (tos, sibilancias, dificultad respiratoria en lactantes)', 'Pediátrico', 2),
(1406, 'Crup (laringotraqueobronquitis, tos perruna, estridor)', 'Pediátrico', 2),
(1407, 'Dolor de crecimiento (dolor en extremidades inferiores)', 'Pediátrico', 5),
(1408, 'Problemas de visión en niños (estrabismo)', 'Pediátrico', 5),
(1409, 'Problemas de visión en niños (ambliopía)', 'Pediátrico', 5),
(1410, 'Problemas de visión en niños (dificultad para ver la pizarra)', 'Pediátrico', 5),
(1411, 'Problemas de audición en niños (no responde a sonidos)', 'Pediátrico', 5),
(1412, 'Problemas de audición en niños (retraso del lenguaje)', 'Pediátrico', 5),
(1413, 'Anemia en niños (palidez)', 'Pediátrico', 4),
(1414, 'Anemia en niños (cansancio)', 'Pediátrico', 4),
(1415, 'Obesidad infantil', 'Pediátrico', 5),
(1416, 'Bajo peso (pediátrico)', 'Pediátrico', 5),
(1417, 'Desnutrición (pediátrico)', 'Pediátrico', 4),
(1418, 'Talla baja (pediátrico)', 'Pediátrico', 5),
(1419, 'Retraso de crecimiento (pediátrico)', 'Pediátrico', 5),
(1420, 'Pubertad precoz', 'Pediátrico', 5),
(1421, 'Pubertad retrasada', 'Pediátrico', 5),
(1422, 'Problemas de sueño en niños (insomnio)', 'Pediátrico', 5),
(1423, 'Problemas de sueño en niños (despertares nocturnos)', 'Pediátrico', 5),
(1424, 'Problemas de sueño en niños (pesadillas)', 'Pediátrico', 5),
(1425, 'Problemas de sueño en niños (terrores nocturnos)', 'Pediátrico', 5),
(1426, 'Miedos y fobias (específicas en niños)', 'Pediátrico', 5),
(1427, 'Miedos y fobias (sociales en niños)', 'Pediátrico', 5),
(1428, 'Ansiedad por separación', 'Pediátrico', 5),
(1429, 'Problemas de socialización (pediátrico)', 'Pediátrico', 5),
(1430, 'Agresividad (pediátrico)', 'Pediátrico', 5),
(1431, 'Rabietas frecuentes', 'Pediátrico', 5),
(1432, 'Problemas dentales (caries en niños)', 'Pediátrico', 5),
(1433, 'Problemas dentales (dolor dental pediátrico)', 'Pediátrico', 4),
(1434, 'Problemas dentales (gingivitis en niños)', 'Pediátrico', 5),
(1435, 'Erupción del pañal', 'Pediátrico', 5),
(1436, 'Impétigo en niños', 'Pediátrico', 4),
(1437, 'Molluscum contagiosum', 'Pediátrico', 5),
(1438, 'Pie plano (pediátrico)', 'Pediátrico', 5),
(1439, 'Displasia de cadera (control pediátrico)', 'Pediátrico', 5),
(1440, 'Escoliosis (sospecha en niños)', 'Pediátrico', 5),
(1441, 'Tics (pediátrico)', 'Pediátrico', 5),
(1442, 'Encopresis (incontinencia fecal pediátrica)', 'Pediátrico', 5),
(1443, 'Dolor de oído con fiebre (pediátrico)', 'Pediátrico', 3),
(1444, 'Conjuntivitis en niños', 'Pediátrico', 4),
(1445, 'Vómitos y diarrea (gastroenteritis pediátrica)', 'Pediátrico', 3),
(1446, 'Erupción por calor (sudamina)', 'Pediátrico', 5),
(1447, 'Urticaria infantil', 'Pediátrico', 3),
(1448, 'Laringitis (pediátrica)', 'Pediátrico', 3),
(1449, 'Faringitis estreptocócica (sospecha pediátrica)', 'Pediátrico', 4),
(1450, 'Escarlatina (sospecha pediátrica)', 'Pediátrico', 3),
(1451, 'Enfermedad mano-pie-boca', 'Pediátrico', 4),
(1452, 'Roséola infantil', 'Pediátrico', 4),
(1453, 'Parotiditis (paperas)', 'Pediátrico', 4),
(1454, 'Extensión de certificado médico para aprehendido (policial)', 'Admin - Certificado Médico', 5),
(1455, 'Extensión de certificado médico para personal policial', 'Admin - Certificado Médico', 5),
(1456, 'Extensión de certificado médico para justificar ausencia laboral', 'Admin - Certificado Médico', 5),
(1457, 'Extensión de certificado médico para justificar ausencia escolar', 'Admin - Certificado Médico', 5),
(1458, 'Extensión de certificado médico para trámites deportivos', 'Admin - Certificado Médico', 5),
(1459, 'Extensión de certificado médico para trámites de viaje', 'Admin - Certificado Médico', 5),
(1460, 'Extensión de certificado médico para trámites de licencia de conducir', 'Admin - Certificado Médico', 5),
(1461, 'Extensión de certificado médico para trámites de seguros', 'Admin - Certificado Médico', 5),
(1462, 'Extensión de certificado médico para trámites de adopción', 'Admin - Certificado Médico', 5),
(1463, 'Extensión de certificado médico para trámites de discapacidad', 'Admin - Certificado Médico', 5),
(1464, 'Extensión de certificado médico para trámites judiciales', 'Admin - Certificado Médico', 5),
(1465, 'Extensión de certificado médico para trámites de residencia/migración', 'Admin - Certificado Médico', 5),
(1466, 'Extensión de certificado médico para justificar cuidado de persona dependiente', 'Admin - Certificado Médico', 5),
(1467, 'Extensión de certificado médico para justificar reposo domiciliario', 'Admin - Certificado Médico', 5),
(1468, 'Extensión de certificado médico por alta médica', 'Admin - Certificado Médico', 5),
(1469, 'Extensión de certificado médico por ingreso hospitalario', 'Admin - Certificado Médico', 5),
(1470, 'Extensión de certificado médico por enfermedad crónica', 'Admin - Certificado Médico', 5),
(1471, 'Extensión de certificado médico para guarderías/jardines de infancia', 'Admin - Certificado Médico', 5),
(1472, 'Extensión de certificado médico para campamentos de verano', 'Admin - Certificado Médico', 5),
(1473, 'Extensión de certificado médico para actividades recreativas', 'Admin - Certificado Médico', 5),
(1474, 'Extensión de certificado médico para permisos de trabajo específicos', 'Admin - Certificado Médico', 5),
(1475, 'Extensión de certificado médico para reincorporación laboral', 'Admin - Certificado Médico', 5),
(1476, 'Detección de Violencia Intrafamiliar (maltrato físico)', 'Admin - Violencia', 3),
(1477, 'Detección de Violencia Intrafamiliar (maltrato psicológico)', 'Admin - Violencia', 4),
(1478, 'Detección de Violencia Intrafamiliar (maltrato económico)', 'Admin - Violencia', 5),
(1479, 'Detección de Violencia Intrafamiliar (maltrato sexual)', 'Admin - Violencia', 2),
(1480, 'Manejo inicial de casos de Violencia Intrafamiliar (contención)', 'Admin - Violencia', 3),
(1481, 'Manejo inicial de casos de Violencia Intrafamiliar (seguridad)', 'Admin - Violencia', 2),
(1482, 'Manejo inicial de casos de Violencia Intrafamiliar (documentación)', 'Admin - Violencia', 4),
(1483, 'Referencia a servicios especializados en Violencia Intrafamiliar', 'Admin - Violencia', 4),
(1484, 'Detección de Violencia de Género (abuso por pareja/expareja)', 'Admin - Violencia', 3),
(1485, 'Manejo inicial de casos de Violencia de Género', 'Admin - Violencia', 3),
(1486, 'Referencia a servicios especializados en Violencia de Género', 'Admin - Violencia', 4),
(1487, 'Detección de Maltrato Infantil (abuso físico)', 'Admin - Violencia', 2),
(1488, 'Detección de Maltrato Infantil (abuso emocional)', 'Admin - Violencia', 3),
(1489, 'Detección de Maltrato Infantil (negligencia)', 'Admin - Violencia', 3),
(1490, 'Detección de Maltrato Infantil (abuso sexual)', 'Admin - Violencia', 1),
(1491, 'Notificación de Maltrato Infantil a autoridades competentes', 'Admin - Violencia', 2),
(1492, 'Referencia a servicios de protección infantil', 'Admin - Violencia', 3),
(1493, 'Detección de Abuso Sexual (en niños)', 'Admin - Violencia', 1),
(1494, 'Detección de Abuso Sexual (en adolescentes)', 'Admin - Violencia', 2),
(1495, 'Detección de Abuso Sexual (en adultos)', 'Admin - Violencia', 2),
(1496, 'Manejo inicial de casos de Abuso Sexual (contención)', 'Admin - Violencia', 2),
(1497, 'Manejo inicial de casos de Abuso Sexual (examen forense)', 'Admin - Violencia', 2),
(1498, 'Manejo inicial de casos de Abuso Sexual (profilaxis)', 'Admin - Violencia', 2),
(1499, 'Referencia a servicios especializados en Abuso Sexual', 'Admin - Violencia', 3),
(1500, 'Detección de Maltrato a Personas Mayores (abuso físico)', 'Admin - Violencia', 2),
(1501, 'Detección de Maltrato a Personas Mayores (abuso emocional)', 'Admin - Violencia', 3),
(1502, 'Detección de Maltrato a Personas Mayores (abuso financiero)', 'Admin - Violencia', 5),
(1503, 'Detección de Maltrato a Personas Mayores (negligencia)', 'Admin - Violencia', 3),
(1504, 'Notificación de Maltrato a Personas Mayores a autoridades competentes', 'Admin - Violencia', 3),
(1505, 'Referencia a servicios de protección a personas mayores', 'Admin - Violencia', 4),
(1506, 'Violencia Comunitaria (impacto en salud física)', 'Admin - Violencia', 3),
(1507, 'Violencia Comunitaria (impacto en salud mental)', 'Admin - Violencia', 3),
(1508, 'Acoso Escolar (Bullying) - detección de víctimas', 'Admin - Violencia', 4),
(1509, 'Acoso Escolar (Bullying) - detección de agresores', 'Admin - Violencia', 5),
(1510, 'Acoso Escolar (Bullying) - asesoramiento a padres', 'Admin - Violencia', 5),
(1511, 'Ciberacoso (Cyberbullying) - detección', 'Admin - Violencia', 4),
(1512, 'Ciberacoso (Cyberbullying) - asesoramiento', 'Admin - Violencia', 5),
(1513, 'Asesoramiento sobre seguridad personal y prevención de violencia', 'Admin - Violencia', 5),
(1514, 'Apoyo a víctimas de delitos violentos (referencia a apoyo psicológico)', 'Admin - Violencia', 3),
(1515, 'Apoyo a víctimas de delitos violentos (referencia a apoyo legal)', 'Admin - Violencia', 5);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_NACIONALIDADES`
--

CREATE TABLE `CAT_NACIONALIDADES` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_NACIONALIDADES`
--

INSERT INTO `CAT_NACIONALIDADES` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Ecuatoriana', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'Colombiana', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(3, 'Peruana', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(4, 'Venezolana', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(5, 'Argentina', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(6, 'Chilena', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(7, 'Española', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(8, 'Estadounidense', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(9, 'Canadiense', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(10, 'Mexicana', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(11, 'Brasileña', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(12, 'Alemana', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(13, 'Francesa', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(14, 'Italiana', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(15, 'Británica', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(16, 'China', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(17, 'Japonesa', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(18, 'India', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(19, 'Rusa', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(20, 'Otra', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_NACIONALIDADES_PUEBLOS`
--

CREATE TABLE `CAT_NACIONALIDADES_PUEBLOS` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_NACIONALIDADES_PUEBLOS`
--

INSERT INTO `CAT_NACIONALIDADES_PUEBLOS` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Achuar', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'Awa', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(3, 'Huancavilca', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(4, 'Cofan', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(5, 'Chachi', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(6, 'Epera', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(7, 'Kichwa', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(8, 'Secoya', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(9, 'Shuar', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(10, 'Shiwiar', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(11, 'Siona', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(12, 'Tsáchila', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(13, 'Waorani', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(14, 'Zápara', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(15, 'No sabemos/No responde', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(16, 'Andoa', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_NIVELES_EDUCACION`
--

CREATE TABLE `CAT_NIVELES_EDUCACION` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_NIVELES_EDUCACION`
--

INSERT INTO `CAT_NIVELES_EDUCACION` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Edu. Básico jóvenes y Adultos', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'Inicial', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(3, 'Edu. Básica (Preparatoria)', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(4, 'Edu. Básica (Elem. y media)', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(5, 'Edu. Básica (Superior)', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(6, 'Superior Técnico Superior', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(7, 'Superior 3er Nivel de Grado', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(8, 'Superior 4to Nivel Postgrado', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(9, 'Ninguno', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_OCUPACIONES_PROFESIONES`
--

CREATE TABLE `CAT_OCUPACIONES_PROFESIONES` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_OCUPACIONES_PROFESIONES`
--

INSERT INTO `CAT_OCUPACIONES_PROFESIONES` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Agricultor', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'Ganadero', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(3, 'Pescador', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(4, 'Obrero', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(5, 'Comerciante', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(6, 'Empleado Público', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(7, 'Empleado Privado', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(8, 'Profesional Independiente', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(9, 'Estudiante', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(10, 'Jubilado', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(11, 'Ama de Casa', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(12, 'Desempleado', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(13, 'Otro', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_PAISES_RESIDENCIA`
--

CREATE TABLE `CAT_PAISES_RESIDENCIA` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_PAISES_RESIDENCIA`
--

INSERT INTO `CAT_PAISES_RESIDENCIA` (`id`, `nombre`, `createdAt`, `updatedAt`) VALUES
(1, 'Ecuador', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(2, 'Colombia', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(3, 'Perú', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(4, 'Argentina', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(5, 'Chile', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(6, 'Brasil', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(7, 'México', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(8, 'España', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(9, 'Estados Unidos', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(10, 'Canadá', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(11, 'Alemania', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(12, 'Francia', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(13, 'Reino Unido', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(14, 'Italia', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(15, 'China', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(16, 'India', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(17, 'Japón', '2025-06-24 13:59:22', '2025-06-24 13:59:22'),
(18, 'Australia', '2025-06-24 13:59:22', '2025-06-24 13:59:22');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_PARENTESCOS`
--

CREATE TABLE `CAT_PARENTESCOS` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_PARENTESCOS`
--

INSERT INTO `CAT_PARENTESCOS` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Padre', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'Madre', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(3, 'Hermano', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(4, 'Conyuge', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(5, 'Hijo', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(6, 'Otro', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_PARROQUIAS`
--

CREATE TABLE `CAT_PARROQUIAS` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `canton_id` int(11) NOT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_PARROQUIAS`
--

INSERT INTO `CAT_PARROQUIAS` (`id`, `nombre`, `canton_id`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'BELLAVISTA', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(2, 'CAÑARIBAMBA', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(3, 'EL BATÁN', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(4, 'EL SAGRARIO', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(5, 'EL VECINO', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(6, 'GIL RAMÍREZ DÁVALOS', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(7, 'HUAYNACÁPAC', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(8, 'MACHÁNGARA', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(9, 'MONAY', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(10, 'SAN BLAS', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(11, 'SAN SEBASTIÁN', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(12, 'SUCRE', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(13, 'TOTORACOCHA', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(14, 'YANUNCAY', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(15, 'HERMANO MIGUEL', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(16, 'CUENCA', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(17, 'BAÑOS', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(18, 'CUMBE', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(19, 'CHAUCHA', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(20, 'CHECA (JIDCAY)', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(21, 'CHIQUINTAD', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(22, 'LLACAO', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(23, 'MOLLETURO', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(24, 'NULTI', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(25, 'OCTAVIO CORDERO PALACIOS (SANTA ROSA)', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(26, 'PACCHA', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(27, 'QUINGEO', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(28, 'RICAURTE', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(29, 'SAN JOAQUÍN', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(30, 'SANTA ANA', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(31, 'SAYAUSÍ', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(32, 'SIDCAY', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(33, 'SININCAY', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(34, 'TARQUI', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(35, 'TURI', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(36, 'VALLE', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(37, 'VICTORIA DEL PORTETE (IRQUIS)', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(38, 'GIRÓN', 2, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(39, 'ASUNCIÓN', 2, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(40, 'SAN GERARDO', 2, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(41, 'GUALACEO', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(42, 'CHORDELEG', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(43, 'DANIEL CÓRDOVA TORAL (EL ORIENTE)', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(44, 'JADÁN', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(45, 'MARIANO MORENO', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(46, 'PRINCIPAL', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(47, 'REMIGIO CRESPO TORAL (GÚLAG)', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(48, 'SAN JUAN', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(49, 'ZHIDMAD', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(50, 'LUIS CORDERO VEGA', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(51, 'SIMÓN BOLÍVAR (CAB. EN GAÑANZOL)', 3, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(52, 'NABÓN', 4, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(53, 'COCHAPATA', 4, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(54, 'EL PROGRESO (CAB.EN ZHOTA)', 4, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(55, 'LAS NIEVES (CHAYA)', 4, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(56, 'OÑA', 4, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(57, 'PAUTE', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(58, 'AMALUZA', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(59, 'BULÁN (JOSÉ VÍCTOR IZQUIERDO)', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(60, 'CHICÁN (GUILLERMO ORTEGA)', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(61, 'EL CABO', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(62, 'GUACHAPALA', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(63, 'GUARAINAG', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(64, 'PALMAS', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(65, 'PAN', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(66, 'SAN CRISTÓBAL (CARLOS ORDÓÑEZ LAZO)', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(67, 'SEVILLA DE ORO', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(68, 'TOMEBAMBA', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(69, 'DUG DUG', 5, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(70, 'PUCARÁ', 6, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(71, 'CAMILO PONCE ENRÍQUEZ (CAB. EN RÍO 7 DE MOLLEPONGO)', 6, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(72, 'SAN RAFAEL DE SHARUG', 6, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(73, 'SAN FERNANDO', 7, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(74, 'CHUMBLÍN', 7, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(75, 'SANTA ISABEL (CHAGUARURCO)', 8, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(76, 'ABDÓN CALDERÓN (LA UNIÓN)', 8, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(77, 'EL CARMEN DE PIJILÍ', 8, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(78, 'ZHAGLLI (SHAGLLI)', 8, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(79, 'SAN SALVADOR DE CAÑARIBAMBA', 8, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(80, 'SIGSIG', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(81, 'CUCHIL (CUTCHIL)', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(82, 'GIMA', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(83, 'GUEL', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(84, 'LUDO', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(85, 'SAN BARTOLOMÉ', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(86, 'SAN JOSÉ DE RARANGA', 9, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(87, 'SAN FELIPE DE OÑA CABECERA CANTONAL', 10, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(88, 'SUSUDEL', 10, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(89, 'CHORDELEG', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(90, 'PRINCIPAL', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(91, 'LA UNIÓN', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(92, 'LUIS GALARZA ORELLANA (CAB.EN DELEGSOL)', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(93, 'SAN MARTÍN DE PUZHIO', 11, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(94, 'EL PAN', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(95, 'AMALUZA', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(96, 'PALMAS', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(97, 'SAN VICENTE', 12, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(98, 'SEVILLA DE ORO', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(99, 'AMALUZA', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(100, 'PALMAS', 13, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(101, 'GUACHAPALA', 14, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(102, 'CAMILO PONCE ENRÍQUEZ', 15, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(103, 'EL CARMEN DE PIJILÍ', 15, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(104, 'ÁNGEL POLIBIO CHÁVES', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(105, 'GABRIEL IGNACIO VEINTIMILLA', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(106, 'GUANUJO', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(107, 'GUARANDA', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(108, 'FACUNDO VELA', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(109, 'JULIO E. MORENO (CATANAHUÁN GRANDE)', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(110, 'LAS NAVES', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(111, 'SALINAS', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(112, 'SAN LORENZO', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(113, 'SAN SIMÓN (YACOTO)', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(114, 'SANTA FÉ (SANTA FÉ)', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(115, 'SIMIÁTUG', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(116, 'SAN LUIS DE PAMBIL', 16, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(117, 'CHILLANES', 17, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(118, 'SAN JOSÉ DEL TAMBO (TAMBOPAMBA)', 17, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(119, 'SAN JOSÉ DE CHIMBO', 18, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(120, 'ASUNCIÓN (ASANCOTO)', 18, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(121, 'CALUMA', 18, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(122, 'MAGDALENA (CHAPACOTO)', 18, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(123, 'SAN SEBASTIÁN', 18, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(124, 'TELIMBELA', 18, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(125, 'ECHEANDÍA', 19, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(126, 'SAN MIGUEL', 20, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(127, 'BALSAPAMBA', 20, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(128, 'BILOVÁN', 20, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(129, 'RÉGULO DE MORA', 20, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(130, 'SAN PABLO (SAN PABLO DE ATENAS)', 20, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(131, 'SANTIAGO', 20, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(132, 'SAN VICENTE', 20, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(133, 'CALUMA', 21, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(134, 'LAS MERCEDES', 22, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(135, 'LAS NAVES', 22, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(136, 'AURELIO BAYAS MARTÍNEZ', 23, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(137, 'AZOGUES', 23, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(138, 'BORRERO', 23, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(139, 'SAN FRANCISCO', 23, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(140, 'COJITAMBO', 23, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(141, 'DÉLEG', 23, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(142, 'GUAPÁN', 23, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(143, 'JAVIER LOYOLA (CHUQUIPATA)', 23, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(144, 'LUIS CORDERO', 23, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(145, 'PINDILIG', 23, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(146, 'RIVERA', 23, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(147, 'SAN MIGUEL', 23, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(148, 'SOLANO', 23, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(149, 'TADAY', 23, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(150, 'BIBLIÁN', 24, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(151, 'NAZÓN (CAB. EN PAMPA DE DOMÍNGUEZ)', 24, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(152, 'SAN FRANCISCO DE SAGEO', 24, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(153, 'TURUPAMBA', 24, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(154, 'JERUSALÉN', 24, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(155, 'CAÑAR', 25, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(156, 'CHONTAMARCA', 25, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(157, 'CHOROCOPTE', 25, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(158, 'GENERAL MORALES (SOCARTE)', 25, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(159, 'GUALLETURO', 25, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(160, 'HONORATO VÁSQUEZ (TAMBO VIEJO)', 25, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(161, 'INGAPIRCA', 25, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(162, 'JUNCAL', 25, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(163, 'SAN ANTONIO', 25, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(164, 'SUSCAL', 25, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(165, 'TAMBO', 25, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(166, 'ZHUD', 25, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(167, 'VENTURA', 25, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(168, 'DUCUR', 25, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(169, 'LA TRONCAL', 26, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(170, 'MANUEL J. CALLE', 26, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(171, 'PANCHO NEGRO', 26, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(172, 'EL TAMBO', 27, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(173, 'DÉLEG', 28, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(174, 'SOLANO', 28, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(175, 'SUSCAL', 29, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(176, 'GONZÁLEZ SUÁREZ', 30, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(177, 'TULCÁN', 30, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(178, 'EL CARMELO (EL PUN)', 30, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(179, 'HUACA', 30, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(180, 'JULIO ANDRADE (OREJUELA)', 30, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(181, 'MALDONADO', 30, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(182, 'PIOTER', 30, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(183, 'TOBAR DONOSO (LA BOCANA DE CAMUMBÍ)', 30, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(184, 'TUFIÑO', 30, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(185, 'URBINA (TAYA)', 30, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(186, 'EL CHICAL', 30, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(187, 'MARISCAL SUCRE', 30, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(188, 'SANTA MARTHA DE CUBA', 30, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(189, 'BOLÍVAR', 31, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(190, 'GARCÍA MORENO', 31, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(191, 'LOS ANDES', 31, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(192, 'MONTE OLIVO', 31, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(193, 'SAN VICENTE DE PUSIR', 31, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(194, 'SAN RAFAEL', 31, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(195, 'EL ÁNGEL', 32, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(196, '27 DE SEPTIEMBRE', 32, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(197, 'EL GOALTAL', 32, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(198, 'LA LIBERTAD (ALIZO)', 32, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(199, 'SAN ISIDRO', 32, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(200, 'MIRA (CHONTAHUASI)', 33, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(201, 'CONCEPCIÓN', 33, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(202, 'JIJÓN Y CAAMAÑO (CAB. EN RÍO BLANCO)', 33, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(203, 'JUAN MONTALVO (SAN IGNACIO DE QUIL)', 33, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(204, 'GONZÁLEZ SUÁREZ', 34, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(205, 'SAN JOSÉ', 34, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(206, 'SAN GABRIEL', 34, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(207, 'CRISTÓBAL COLÓN', 34, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(208, 'CHITÁN DE NAVARRETE', 34, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(209, 'FERNÁNDEZ SALVADOR', 34, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(210, 'LA PAZ', 34, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(211, 'PIARTAL', 34, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(212, 'HUACA', 35, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(213, 'MARISCAL SUCRE', 35, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(214, 'ELOY ALFARO (SAN FELIPE)', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(215, 'IGNACIO FLORES (PARQUE FLORES)', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(216, 'JUAN MONTALVO (SAN SEBASTIÁN)', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(217, 'LA MATRIZ', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(218, 'SAN BUENAVENTURA', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(219, 'LATACUNGA', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(220, 'ALAQUES (ALÁQUEZ)', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(221, 'BELISARIO QUEVEDO (GUANAILÍN)', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(222, 'GUAITACAMA (GUAYTACAMA)', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(223, 'JOSEGUANGO BAJO', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(224, 'LAS PAMPAS', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(225, 'MULALÓ', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(226, '11 DE NOVIEMBRE (ILINCHISI)', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(227, 'POALÓ', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(228, 'SAN JUAN DE PASTOCALLE', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(229, 'SIGCHOS', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(230, 'TANICUCHÍ', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(231, 'TOACASO', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(232, 'PALO QUEMADO', 36, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(233, 'EL CARMEN', 37, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(234, 'LA MANÁ', 37, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(235, 'EL TRIUNFO', 37, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(236, 'GUASAGANDA (CAB.EN GUASAGANDA', 37, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(237, 'PUCAYACU', 37, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(238, 'EL CORAZÓN', 38, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(239, 'MORASPUNGO', 38, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(240, 'PINLLOPATA', 38, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(241, 'RAMÓN CAMPAÑA', 38, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(242, 'PUJILÍ', 39, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(243, 'ANGAMARCA', 39, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(244, 'CHUCCHILÁN (CHUGCHILÁN)', 39, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(245, 'GUANGAJE', 39, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(246, 'ISINLIBÍ (ISINLIVÍ)', 39, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(247, 'LA VICTORIA', 39, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(248, 'PILALÓ', 39, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(249, 'TINGO', 39, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(250, 'ZUMBAHUA', 39, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(251, 'SAN MIGUEL', 40, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(252, 'ANTONIO JOSÉ HOLGUÍN (SANTA LUCÍA)', 40, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(253, 'CUSUBAMBA', 40, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(254, 'MULALILLO', 40, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(255, 'MULLIQUINDIL (SANTA ANA)', 40, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(256, 'PANSALEO', 40, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(257, 'SAQUISILÍ', 41, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(258, 'CANCHAGUA', 41, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(259, 'CHANTILÍN', 41, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(260, 'COCHAPAMBA', 41, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(261, 'SIGCHOS', 42, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(262, 'CHUGCHILLÁN', 42, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(263, 'ISINLIVÍ', 42, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(264, 'LAS PAMPAS', 42, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(265, 'PALO QUEMADO', 42, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(266, 'LIZARZABURU', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(267, 'MALDONADO', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(268, 'VELASCO', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(269, 'VELOZ', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(270, 'YARUQUÍES', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(271, 'RIOBAMBA', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(272, 'CACHA (CAB. EN MACHÁNGARA)', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(273, 'CALPI', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(274, 'CUBIJÍES', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(275, 'FLORES', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(276, 'LICÁN', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(277, 'LICTO', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(278, 'PUNGALÁ', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(279, 'PUNÍN', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(280, 'QUIMIAG', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(281, 'SAN JUAN', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(282, 'SAN LUIS', 43, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(283, 'ALAUSÍ', 44, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(284, 'ACHUPALLAS', 44, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(285, 'CUMANDÁ', 44, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(286, 'GUASUNTOS', 44, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(287, 'HUIGRA', 44, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(288, 'MULTITUD', 44, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(289, 'PISTISHÍ (NARIZ DEL DIABLO)', 44, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(290, 'PUMALLACTA', 44, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(291, 'SEVILLA', 44, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(292, 'SIBAMBE', 44, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(293, 'TIXÁN', 44, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(294, 'CAJABAMBA', 45, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(295, 'SICALPA', 45, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(296, 'VILLA LA UNIÓN (CAJABAMBA)', 45, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(297, 'CAÑI', 45, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(298, 'COLUMBE', 45, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(299, 'JUAN DE VELASCO (PANGOR)', 45, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(300, 'SANTIAGO DE QUITO (CAB. EN SAN ANTONIO DE QUITO)', 45, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(301, 'CHAMBO', 46, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(302, 'CHUNCHI', 47, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(303, 'CAPZOL', 47, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(304, 'COMPUD', 47, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(305, 'GONZOL', 47, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(306, 'LLAGOS', 47, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(307, 'GUAMOTE', 48, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(308, 'CEBADAS', 48, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(309, 'PALMIRA', 48, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(310, 'EL ROSARIO', 49, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(311, 'LA MATRIZ', 49, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(312, 'GUANO', 49, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(313, 'GUANANDO', 49, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(314, 'ILAPO', 49, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(315, 'LA PROVIDENCIA', 49, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(316, 'SAN ANDRÉS', 49, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(317, 'SAN GERARDO DE PACAICAGUÁN', 49, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(318, 'SAN ISIDRO DE PATULÚ', 49, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(319, 'SAN JOSÉ DEL CHAZO', 49, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(320, 'SANTA FÉ DE GALÁN', 49, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(321, 'VALPARAÍSO', 49, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(322, 'PALLATANGA', 50, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(323, 'PENIPE', 51, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(324, 'EL ALTAR', 51, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(325, 'MATUS', 51, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(326, 'PUELA', 51, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(327, 'SAN ANTONIO DE BAYUSHIG', 51, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(328, 'LA CANDELARIA', 51, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(329, 'BILBAO (CAB.EN QUILLUYACU)', 51, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(330, 'CUMANDÁ', 52, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(331, 'LA PROVIDENCIA', 53, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(332, 'MACHALA', 53, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(333, 'PUERTO BOLÍVAR', 53, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(334, 'NUEVE DE MAYO', 53, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(335, 'EL CAMBIO', 53, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(336, 'EL RETIRO', 53, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(337, 'ARENILLAS', 54, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(338, 'CHACRAS', 54, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(339, 'LA LIBERTAD', 54, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(340, 'LAS LAJAS (CAB. EN LA VICTORIA)', 54, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(341, 'PALMALES', 54, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(342, 'CARCABÓN', 54, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(343, 'PACCHA', 55, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(344, 'AYAPAMBA', 55, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(345, 'CORDONCILLO', 55, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(346, 'MILAGRO', 55, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(347, 'SAN JOSÉ', 55, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(348, 'SAN JUAN DE CERRO AZUL', 55, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(349, 'BALSAS', 56, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(350, 'BELLAMARÍA', 56, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(351, 'CHILLA', 57, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(352, 'EL GUABO', 58, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(353, 'BARBONES (SUCRE)', 58, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(354, 'LA IBERIA', 58, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(355, 'TENDALES (CAB.EN PUERTO TENDALES)', 58, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(356, 'RÍO BONITO', 58, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(357, 'ECUADOR', 59, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(358, 'EL PARAÍSO', 59, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(359, 'HUALTACO', 59, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(360, 'MILTON REYES', 59, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(361, 'UNIÓN LOJANA', 59, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(362, 'HUAQUILLAS', 59, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(363, 'MARCABELÍ', 60, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(364, 'EL INGENIO', 60, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(365, 'BOLÍVAR', 61, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(366, 'LOMA DE FRANCO', 61, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(367, 'OCHOA LEÓN (MATRIZ)', 61, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(368, 'TRES CERRITOS', 61, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(369, 'PASAJE', 61, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(370, 'BUENAVISTA', 61, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(371, 'CASACAY', 61, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(372, 'LA PEAÑA', 61, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(373, 'PROGRESO', 61, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(374, 'UZHCURRUMI', 61, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(375, 'CAÑAQUEMADA', 61, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(376, 'LA MATRIZ', 62, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(377, 'LA SUSAYA', 62, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(378, 'PIÑAS GRANDE', 62, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(379, 'PIÑAS', 62, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(380, 'CAPIRO (CAB. EN LA CAPILLA DE CAPIRO)', 62, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(381, 'LA BOCANA', 62, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(382, 'MOROMORO (CAB. EN EL VADO)', 62, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(383, 'PIEDRAS', 62, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(384, 'SAN ROQUE (AMBROSIO MALDONADO)', 62, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(385, 'SARACAY', 62, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(386, 'PORTOVELO', 63, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(387, 'CURTINCAPA', 63, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(388, 'MORALES', 63, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(389, 'SALATÍ', 63, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(390, 'SANTA ROSA', 64, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(391, 'PUERTO JELÍ', 64, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(392, 'BALNEARIO JAMBELÍ (SATÉLITE)', 64, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(393, 'JUMÓN (SATÉLITE)', 64, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(394, 'NUEVO SANTA ROSA', 64, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(395, 'BELLAVISTA', 64, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(396, 'JAMBELÍ', 64, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(397, 'LA AVANZADA', 64, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(398, 'SAN ANTONIO', 64, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(399, 'TORATA', 64, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(400, 'VICTORIA', 64, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(401, 'BELLAMARÍA', 64, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(402, 'ZARUMA', 65, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(403, 'ABAÑÍN', 65, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(404, 'ARCAPAMBA', 65, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(405, 'GUANAZÁN', 65, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(406, 'GUIZHAGUIÑA', 65, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(407, 'HUERTAS', 65, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(408, 'MALVAS', 65, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(409, 'MULUNCAY GRANDE', 65, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(410, 'SINSAO', 65, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(411, 'SALVIAS', 65, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(412, 'LA VICTORIA', 66, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(413, 'PLATANILLOS', 66, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(414, 'VALLE HERMOSO', 66, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(415, 'LA LIBERTAD', 66, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(416, 'EL PARAÍSO', 66, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(417, 'SAN ISIDRO', 66, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(418, 'BARTOLOMÉ RUIZ (CÉSAR FRANCO CARRIÓN)', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(419, '5 DE AGOSTO', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(420, 'ESMERALDAS', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(421, 'LUIS TELLO (LAS PALMAS)', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(422, 'SIMÓN PLATA TORRES', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(423, 'ATACAMES', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(424, 'CAMARONES (CAB. EN SAN VICENTE)', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(425, 'CRNEL. CARLOS CONCHA TORRES (CAB.EN HUELE)', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(426, 'CHINCA', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(427, 'CHONTADURO', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(428, 'CHUMUNDÉ', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(429, 'LAGARTO', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(430, 'LA UNIÓN', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(431, 'MAJUA', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(432, 'MONTALVO (CAB. EN HORQUETA)', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(433, 'RÍO VERDE', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(434, 'ROCAFUERTE', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(435, 'SAN MATEO', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(436, 'SÚA (CAB. EN LA BOCANA)', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(437, 'TABIAZO', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(438, 'TACHINA', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(439, 'TONCHIGÜE', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(440, 'VUELTA LARGA', 67, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(441, 'VALDEZ (LIMONES)', 68, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(442, 'ANCHAYACU', 68, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(443, 'ATAHUALPA (CAB. EN CAMARONES)', 68, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(444, 'BORBÓN', 68, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(445, 'LA TOLA', 68, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(446, 'LUIS VARGAS TORRES (CAB. EN PLAYA DE ORO)', 68, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(447, 'MALDONADO', 68, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(448, 'PAMPANAL DE BOLÍVAR', 68, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(449, 'SAN FRANCISCO DE ONZOLE', 68, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(450, 'SANTO DOMINGO DE ONZOLE', 68, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(451, 'SELVA ALEGRE', 68, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(452, 'TELEMBÍ', 68, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(453, 'COLÓN ELOY DEL MARÍA', 68, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(454, 'SAN JOSÉ DE CAYAPAS', 68, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(455, 'TIMBIRÉ', 68, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(456, 'MUISNE', 69, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(457, 'BOLÍVAR', 69, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(458, 'DAULE', 69, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(459, 'GALERA', 69, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(460, 'QUINGUE (OLMEDO PERDOMO FRANCO)', 69, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(461, 'SALIMA', 69, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(462, 'SAN FRANCISCO', 69, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(463, 'SAN GREGORIO', 69, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(464, 'SAN JOSÉ DE CHAMANGA (CAB.EN CHAMANGA)', 69, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(465, 'ROSA ZÁRATE (QUININDÉ)', 70, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(466, 'CUBE', 70, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(467, 'CHURA (CHANCAMA) (CAB. EN EL YERBERO)', 70, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(468, 'MALIMPIA', 70, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(469, 'VICHE', 70, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(470, 'LA UNIÓN', 70, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(471, 'SAN LORENZO', 71, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(472, 'ALTO TAMBO (CAB. EN GUADUAL)', 71, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(473, 'ANCÓN (PICHANGAL) (CAB. EN PALMA REAL)', 71, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(474, 'CALDERÓN', 71, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(475, 'CARONDELET', 71, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(476, '5 DE JUNIO (CAB. EN UIMBI)', 71, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(477, 'CONCEPCIÓN', 71, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(478, 'MATAJE (CAB. EN SANTANDER)', 71, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(479, 'SAN JAVIER DE CACHAVÍ (CAB. EN SAN JAVIER)', 71, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(480, 'SANTA RITA', 71, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(481, 'TAMBILLO', 71, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(482, 'TULULBÍ (CAB. EN RICAURTE)', 71, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(483, 'URBINA', 71, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(484, 'ATACAMES', 72, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(485, 'LA UNIÓN', 72, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(486, 'SÚA (CAB. EN LA BOCANA)', 72, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(487, 'TONCHIGÜE', 72, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(488, 'TONSUPA', 72, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(489, 'RIOVERDE', 73, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(490, 'CHONTADURO', 73, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(491, 'CHUMUNDÉ', 73, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(492, 'LAGARTO', 73, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(493, 'MONTALVO (CAB. EN HORQUETA)', 73, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(494, 'ROCAFUERTE', 73, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(495, 'LA CONCORDIA', 74, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(496, 'MONTERREY', 74, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(497, 'LA VILLEGAS', 74, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(498, 'PLAN PILOTO', 74, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(499, 'AYACUCHO', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(500, 'BOLÍVAR (SAGRARIO)', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(501, 'CARBO (CONCEPCIÓN)', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(502, 'FEBRES CORDERO', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(503, 'GARCÍA MORENO', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(504, 'LETAMENDI', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(505, 'NUEVE DE OCTUBRE', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(506, 'OLMEDO (SAN ALEJO)', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(507, 'ROCA', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(508, 'ROCAFUERTE', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(509, 'SUCRE', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(510, 'TARQUI', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(511, 'URDANETA', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(512, 'XIMENA', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(513, 'PASCUALES', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(514, 'GUAYAQUIL', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(515, 'CHONGÓN', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(516, 'JUAN GÓMEZ RENDÓN (PROGRESO)', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(517, 'MORRO', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(518, 'PLAYAS (GRAL. VILLAMIL)', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(519, 'POSORJA', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(520, 'PUNÁ', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(521, 'TENGUEL', 75, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(522, 'ALFREDO BAQUERIZO MORENO (JUJÁN)', 76, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(523, 'BALAO', 77, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(524, 'BALZAR', 78, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(525, 'COLIMES', 79, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(526, 'SAN JACINTO', 79, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(527, 'DAULE', 80, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(528, 'LA AURORA (SATÉLITE)', 80, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(529, 'BANIFE', 80, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(530, 'EMILIANO CAICEDO MARCOS', 80, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(531, 'MAGRO', 80, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(532, 'PADRE JUAN BAUTISTA AGUIRRE', 80, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(533, 'SANTA CLARA', 80, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(534, 'VICENTE PIEDRAHITA', 80, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(535, 'ISIDRO AYORA (SOLEDAD)', 80, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(536, 'JUAN BAUTISTA AGUIRRE (LOS TINTOS)', 80, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(537, 'LAUREL', 80, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(538, 'LIMONAL', 80, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(539, 'LOMAS DE SARGENTILLO', 80, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(540, 'LOS LOJAS (ENRIQUE BAQUERIZO MORENO)', 80, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(541, 'PIEDRAHITA (NOBOL)', 80, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(542, 'ELOY ALFARO (DURÁN)', 81, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(543, 'EL RECREO', 81, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(544, 'VELASCO IBARRA (EL EMPALME)', 82, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(545, 'GUAYAS (PUEBLO NUEVO)', 82, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(546, 'EL ROSARIO', 82, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(547, 'EL TRIUNFO', 83, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(548, 'MILAGRO', 84, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(549, 'CHOBO', 84, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(550, 'GENERAL ELIZALDE (BUCAY)', 84, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(551, 'MARISCAL SUCRE (HUAQUES)', 84, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(552, 'ROBERTO ASTUDILLO (CAB. EN CRUCE DE VENECIA)', 84, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(553, 'NARANJAL', 85, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(554, 'JESÚS MARÍA', 85, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(555, 'SAN CARLOS', 85, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(556, 'SANTA ROSA DE FLANDES', 85, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(557, 'TAURA', 85, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(558, 'NARANJITO', 86, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(559, 'PALESTINA', 87, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(560, 'PEDRO CARBO', 88, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(561, 'VALLE DE LA VIRGEN', 88, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(562, 'SABANILLA', 88, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(563, 'SAMBORONDÓN', 89, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(564, 'LA PUNTILLA (SATÉLITE)', 89, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(565, 'TARIFA', 89, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(566, 'SANTA LUCÍA', 90, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(567, 'BOCANA', 91, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(568, 'CANDILEJOS', 91, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(569, 'CENTRAL', 91, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(570, 'PARAÍSO', 91, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(571, 'SAN MATEO', 91, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(572, 'EL SALITRE (LAS RAMAS)', 91, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(573, 'GRAL. VERNAZA (DOS ESTEROS)', 91, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(574, 'LA VICTORIA (ÑAUZA)', 91, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(575, 'JUNQUILLAL', 91, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(576, 'SAN JACINTO DE YAGUACHI', 92, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(577, 'CRNEL. LORENZO DE GARAICOA (PEDREGAL)', 92, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(578, 'CRNEL. MARCELINO MARIDUEÑA (SAN CARLOS)', 92, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(579, 'GRAL. PEDRO J. MONTERO (BOLICHE)', 92, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(580, 'SIMÓN BOLÍVAR', 92, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(581, 'YAGUACHI VIEJO (CONE)', 92, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(582, 'VIRGEN DE FÁTIMA', 92, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(583, 'GENERAL VILLAMIL (PLAYAS)', 93, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(584, 'SIMÓN BOLÍVAR', 94, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(585, 'CRNEL.LORENZO DE GARAICOA (PEDREGAL)', 94, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(586, 'CORONEL MARCELINO MARIDUEÑA (SAN CARLOS)', 95, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(587, 'LOMAS DE SARGENTILLO', 96, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(588, 'ISIDRO AYORA (SOLEDAD)', 96, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(589, 'NARCISA DE JESÚS', 97, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(590, 'GENERAL ANTONIO ELIZALDE (BUCAY)', 98, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(591, 'ISIDRO AYORA', 99, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(592, 'CARANQUI', 100, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(593, 'GUAYAQUIL DE ALPACHACA', 100, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(594, 'SAGRARIO', 100, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(595, 'SAN FRANCISCO', 100, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(596, 'LA DOLOROSA DEL PRIORATO', 100, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(597, 'SAN MIGUEL DE IBARRA', 100, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(598, 'AMBUQUÍ', 100, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(599, 'ANGOCHAGUA', 100, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(600, 'CAROLINA', 100, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(601, 'LA ESPERANZA', 100, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(602, 'LITA', 100, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(603, 'SALINAS', 100, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(604, 'SAN ANTONIO', 100, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(605, 'ANDRADE MARÍN (LOURDES)', 101, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(606, 'ATUNTAQUI', 101, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(607, 'IMBAYA (SAN LUIS DE COBUENDO)', 101, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(608, 'SAN FRANCISCO DE NATABUELA', 101, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(609, 'SAN JOSÉ DE CHALTURA', 101, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(610, 'SAN ROQUE', 101, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(611, 'SAGRARIO', 102, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(612, 'SAN FRANCISCO', 102, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(613, 'COTACACHI', 102, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(614, 'APUELA', 102, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(615, 'GARCÍA MORENO (LLURIMAGUA)', 102, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(616, 'IMANTAG', 102, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(617, 'PEÑAHERRERA', 102, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(618, 'PLAZA GUTIÉRREZ (CALVARIO)', 102, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(619, 'QUIROGA', 102, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(620, '6 DE JULIO DE CUELLAJE (CAB. EN CUELLAJE)', 102, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(621, 'VACAS GALINDO (EL CHURO) (CAB.EN SAN MIGUEL ALTO', 102, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(622, 'JORDÁN', 103, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(623, 'SAN LUIS', 103, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(624, 'OTAVALO', 103, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(625, 'DR. MIGUEL EGAS CABEZAS (PEGUCHE)', 103, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(626, 'EUGENIO ESPEJO (CALPAQUÍ)', 103, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(627, 'GONZÁLEZ SUÁREZ', 103, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(628, 'PATAQUÍ', 103, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(629, 'SAN JOSÉ DE QUICHINCHE', 103, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(630, 'SAN JUAN DE ILUMÁN', 103, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(631, 'SAN PABLO', 103, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(632, 'SAN RAFAEL', 103, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(633, 'SELVA ALEGRE (CAB.EN SAN MIGUEL DE PAMPLONA)', 103, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(634, 'PIMAMPIRO', 104, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(635, 'CHUGÁ', 104, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(636, 'MARIANO ACOSTA', 104, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(637, 'SAN FRANCISCO DE SIGSIPAMBA', 104, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(638, 'URCUQUÍ CABECERA CANTONAL', 105, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(639, 'CAHUASQUÍ', 105, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(640, 'LA MERCED DE BUENOS AIRES', 105, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(641, 'PABLO ARENAS', 105, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(642, 'SAN BLAS', 105, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(643, 'TUMBABIRO', 105, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(644, 'EL SAGRARIO', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(645, 'SAN SEBASTIÁN', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(646, 'SUCRE', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(647, 'VALLE', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(648, 'LOJA', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(649, 'CHANTACO', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(650, 'CHUQUIRIBAMBA', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(651, 'EL CISNE', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(652, 'GUALEL', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(653, 'JIMBILLA', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(654, 'MALACATOS (VALLADOLID)', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(655, 'SAN LUCAS', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(656, 'SAN PEDRO DE VILCABAMBA', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(657, 'SANTIAGO', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(658, 'TAQUIL (MIGUEL RIOFRÍO)', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(659, 'VILCABAMBA (VICTORIA)', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(660, 'YANGANA (ARSENIO CASTILLO)', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(661, 'QUINARA', 106, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(662, 'CARIAMANGA', 107, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(663, 'CHILE', 107, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(664, 'SAN VICENTE', 107, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(665, 'COLAISACA', 107, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(666, 'EL LUCERO', 107, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(667, 'UTUANA', 107, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(668, 'SANGUILLÍN', 107, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(669, 'CATAMAYO', 108, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(670, 'SAN JOSÉ', 108, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(671, 'CATAMAYO (LA TOMA)', 108, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(672, 'EL TAMBO', 108, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(673, 'GUAYQUICHUMA', 108, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(674, 'SAN PEDRO DE LA BENDITA', 108, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(675, 'ZAMBI', 108, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(676, 'CELICA', 109, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(677, 'CRUZPAMBA (CAB. EN CARLOS BUSTAMANTE)', 109, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(678, 'CHAQUINAL', 109, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(679, '12 DE DICIEMBRE (CAB. EN ACHIOTES)', 109, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(680, 'PINDAL (FEDERICO PÁEZ)', 109, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(681, 'POZUL (SAN JUAN DE POZUL)', 109, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(682, 'SABANILLA', 109, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(683, 'TNTE. MAXIMILIANO RODRÍGUEZ LOAIZA', 109, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(684, 'CHAGUARPAMBA', 110, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(685, 'BUENAVISTA', 110, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(686, 'EL ROSARIO', 110, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(687, 'SANTA RUFINA', 110, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(688, 'AMARILLOS', 110, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(689, 'AMALUZA', 111, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(690, 'BELLAVISTA', 111, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(691, 'JIMBURA', 111, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(692, 'SANTA TERESITA', 111, '2025-06-23 23:28:44', '2025-06-23 23:28:44');
INSERT INTO `CAT_PARROQUIAS` (`id`, `nombre`, `canton_id`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(693, '27 DE ABRIL (CAB. EN LA NARANJA)', 111, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(694, 'EL INGENIO', 111, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(695, 'EL AIRO', 111, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(696, 'GONZANAMÁ', 112, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(697, 'CHANGAIMINA (LA LIBERTAD)', 112, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(698, 'FUNDOCHAMBA', 112, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(699, 'NAMBACOLA', 112, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(700, 'PURUNUMA (EGUIGUREN)', 112, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(701, 'QUILANGA (LA PAZ)', 112, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(702, 'SACAPALCA', 112, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(703, 'SAN ANTONIO DE LAS ARADAS (CAB. EN LAS ARADAS)', 112, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(704, 'GENERAL ELOY ALFARO (SAN SEBASTIÁN)', 113, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(705, 'MACARÁ (MANUEL ENRIQUE RENGEL SUQUILANDA)', 113, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(706, 'MACARÁ', 113, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(707, 'LARAMA', 113, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(708, 'LA VICTORIA', 113, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(709, 'SABIANGO (LA CAPILLA)', 113, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(710, 'CATACOCHA', 114, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(711, 'LOURDES', 114, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(712, 'CANGONAMÁ', 114, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(713, 'GUACHANAMÁ', 114, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(714, 'LA TINGUE', 114, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(715, 'LAURO GUERRERO', 114, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(716, 'OLMEDO (SANTA BÁRBARA)', 114, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(717, 'ORIANGA', 114, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(718, 'SAN ANTONIO', 114, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(719, 'CASANGA', 114, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(720, 'YAMANA', 114, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(721, 'ALAMOR', 115, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(722, 'CIANO', 115, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(723, 'EL ARENAL', 115, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(724, 'EL LIMO (MARIANA DE JESÚS)', 115, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(725, 'MERCADILLO', 115, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(726, 'VICENTINO', 115, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(727, 'SARAGURO', 116, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(728, 'EL PARAÍSO DE CELÉN', 116, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(729, 'EL TABLÓN', 116, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(730, 'LLUZHAPA', 116, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(731, 'MANÚ', 116, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(732, 'SAN ANTONIO DE QUMBE (CUMBE)', 116, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(733, 'SAN PABLO DE TENTA', 116, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(734, 'SAN SEBASTIÁN DE YÚLUC', 116, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(735, 'SELVA ALEGRE', 116, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(736, 'URDANETA (PAQUISHAPA)', 116, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(737, 'SUMAYPAMBA', 116, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(738, 'SOZORANGA', 117, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(739, 'NUEVA FÁTIMA', 117, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(740, 'TACAMOROS', 117, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(741, 'ZAPOTILLO', 118, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(742, 'MANGAHURCO (CAZADEROS)', 118, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(743, 'GARZAREAL', 118, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(744, 'LIMONES', 118, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(745, 'PALETILLAS', 118, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(746, 'BOLASPAMBA', 118, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(747, 'PINDAL', 119, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(748, 'CHAQUINAL', 119, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(749, '12 DE DICIEMBRE (CAB.EN ACHIOTES)', 119, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(750, 'MILAGROS', 119, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(751, 'QUILANGA', 120, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(752, 'FUNDOCHAMBA', 120, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(753, 'SAN ANTONIO DE LAS ARADAS (CAB. EN LAS ARADAS)', 120, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(754, 'OLMEDO', 121, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(755, 'LA TINGUE', 121, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(756, 'CLEMENTE BAQUERIZO', 122, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(757, 'DR. CAMILO PONCE', 122, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(758, 'BARREIRO', 122, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(759, 'EL SALTO', 122, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(760, 'BABAHOYO', 122, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(761, 'BARREIRO (SANTA RITA)', 122, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(762, 'CARACOL', 122, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(763, 'FEBRES CORDERO (LAS JUNTAS)', 122, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(764, 'PIMOCHA', 122, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(765, 'LA UNIÓN', 122, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(766, 'BABA', 123, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(767, 'GUARE', 123, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(768, 'ISLA DE BEJUCAL', 123, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(769, 'MONTALVO', 124, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(770, 'PUEBLOVIEJO', 125, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(771, 'PUERTO PECHICHE', 125, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(772, 'SAN JUAN', 125, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(773, 'QUEVEDO', 126, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(774, 'SAN CAMILO', 126, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(775, 'SAN JOSÉ', 126, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(776, 'GUAYACÁN', 126, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(777, 'NICOLÁS INFANTE DÍAZ', 126, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(778, 'SAN CRISTÓBAL', 126, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(779, 'SIETE DE OCTUBRE', 126, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(780, '24 DE MAYO', 126, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(781, 'VENUS DEL RÍO QUEVEDO', 126, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(782, 'VIVA ALFARO', 126, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(783, 'BUENA FÉ', 126, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(784, 'MOCACHE', 126, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(785, 'SAN CARLOS', 126, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(786, 'VALENCIA', 126, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(787, 'LA ESPERANZA', 126, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(788, 'CATARAMA', 127, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(789, 'RICAURTE', 127, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(790, '10 DE NOVIEMBRE', 128, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(791, 'VENTANAS', 128, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(792, 'QUINSALOMA', 128, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(793, 'ZAPOTAL', 128, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(794, 'CHACARITA', 128, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(795, 'LOS ÁNGELES', 128, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(796, 'VINCES', 129, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(797, 'ANTONIO SOTOMAYOR (CAB. EN PLAYAS DE VINCES)', 129, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(798, 'PALENQUE', 129, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(799, 'PALENQUE', 130, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(800, 'SAN JACINTO DE BUENA FÉ', 131, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(801, '7 DE AGOSTO', 131, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(802, '11 DE OCTUBRE', 131, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(803, 'PATRICIA PILAR', 131, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(804, 'VALENCIA', 132, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(805, 'MOCACHE', 133, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(806, 'QUINSALOMA', 134, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(807, 'PORTOVIEJO', 135, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(808, '12 DE MARZO', 135, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(809, 'COLÓN', 135, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(810, 'PICOAZÁ', 135, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(811, 'SAN PABLO', 135, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(812, 'ANDRÉS DE VERA', 135, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(813, 'FRANCISCO PACHECO', 135, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(814, '18 DE OCTUBRE', 135, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(815, 'SIMÓN BOLÍVAR', 135, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(816, 'ABDÓN CALDERÓN (SAN FRANCISCO)', 135, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(817, 'ALHAJUELA (BAJO GRANDE)', 135, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(818, 'CRUCITA', 135, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(819, 'PUEBLO NUEVO', 135, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(820, 'RIOCHICO (RÍO CHICO)', 135, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(821, 'SAN PLÁCIDO', 135, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(822, 'CHIRIJOS', 135, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(823, 'CALCETA', 136, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(824, 'MEMBRILLO', 136, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(825, 'QUIROGA', 136, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(826, 'CHONE', 137, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(827, 'SANTA RITA', 137, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(828, 'BOYACÁ', 137, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(829, 'CANUTO', 137, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(830, 'CONVENTO', 137, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(831, 'CHIBUNGA', 137, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(832, 'ELOY ALFARO', 137, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(833, 'RICAURTE', 137, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(834, 'SAN ANTONIO', 137, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(835, 'EL CARMEN', 138, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(836, '4 DE DICIEMBRE', 138, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(837, 'WILFRIDO LOOR MOREIRA (MAICITO)', 138, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(838, 'SAN PEDRO DE SUMA', 138, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(839, 'FLAVIO ALFARO', 139, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(840, 'SAN FRANCISCO DE NOVILLO (CAB. EN', 139, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(841, 'ZAPALLO', 139, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(842, 'DR. MIGUEL MORÁN LUCIO', 140, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(843, 'MANUEL INOCENCIO PARRALES Y GUALE', 140, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(844, 'SAN LORENZO DE JIPIJAPA', 140, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(845, 'JIPIJAPA', 140, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(846, 'AMÉRICA', 140, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(847, 'EL ANEGADO (CAB. EN ELOY ALFARO)', 140, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(848, 'JULCUY', 140, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(849, 'LA UNIÓN', 140, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(850, 'MACHALILLA', 140, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(851, 'MEMBRILLAL', 140, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(852, 'PEDRO PABLO GÓMEZ', 140, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(853, 'PUERTO DE CAYO', 140, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(854, 'PUERTO LÓPEZ', 140, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(855, 'JUNÍN', 141, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(856, 'LOS ESTEROS', 142, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(857, 'MANTA', 142, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(858, 'SAN MATEO', 142, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(859, 'TARQUI', 142, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(860, 'ELOY ALFARO', 142, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(861, 'SAN LORENZO', 142, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(862, 'SANTA MARIANITA (BOCA DE PACOCHE)', 142, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(863, 'ANIBAL SAN ANDRÉS', 143, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(864, 'MONTECRISTI', 143, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(865, 'EL COLORADO', 143, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(866, 'GENERAL ELOY ALFARO', 143, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(867, 'LEONIDAS PROAÑO', 143, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(868, 'JARAMIJÓ', 143, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(869, 'LA PILA', 143, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(870, 'PAJÁN', 144, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(871, 'CAMPOZANO (LA PALMA DE PAJÁN)', 144, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(872, 'CASCOL', 144, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(873, 'GUALE', 144, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(874, 'LASCANO', 144, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(875, 'PICHINCHA', 145, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(876, 'BARRAGANETE', 145, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(877, 'SAN SEBASTIÁN', 145, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(878, 'ROCAFUERTE', 146, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(879, 'SANTA ANA', 147, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(880, 'LODANA', 147, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(881, 'SANTA ANA DE VUELTA LARGA', 147, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(882, 'AYACUCHO', 147, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(883, 'HONORATO VÁSQUEZ (CAB. EN VÁSQUEZ)', 147, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(884, 'LA UNIÓN', 147, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(885, 'OLMEDO', 147, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(886, 'SAN PABLO (CAB. EN PUEBLO NUEVO)', 147, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(887, 'BAHÍA DE CARÁQUEZ', 148, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(888, 'LEONIDAS PLAZA GUTIÉRREZ', 148, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(889, 'CANOA', 148, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(890, 'COJIMÍES', 148, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(891, 'CHARAPOTÓ', 148, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(892, '10 DE AGOSTO', 148, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(893, 'JAMA', 148, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(894, 'PEDERNALES', 148, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(895, 'SAN ISIDRO', 148, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(896, 'SAN VICENTE', 148, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(897, 'TOSAGUA', 149, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(898, 'BACHILLERO', 149, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(899, 'ANGEL PEDRO GILER (LA ESTANCILLA)', 149, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(900, 'SUCRE', 150, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(901, 'BELLAVISTA', 150, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(902, 'NOBOA', 150, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(903, 'ARQ. SIXTO DURÁN BALLÉN', 150, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(904, 'PEDERNALES', 151, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(905, 'COJIMÍES', 151, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(906, '10 DE AGOSTO', 151, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(907, 'ATAHUALPA', 151, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(908, 'OLMEDO', 152, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(909, 'PUERTO LÓPEZ', 153, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(910, 'MACHALILLA', 153, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(911, 'SALANGO', 153, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(912, 'JAMA', 154, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(913, 'JARAMIJÓ', 155, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(914, 'SAN VICENTE', 156, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(915, 'CANOA', 156, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(916, 'MACAS', 157, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(917, 'ALSHI (CAB. EN 9 DE OCTUBRE)', 157, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(918, 'CHIGUAZA', 157, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(919, 'GENERAL PROAÑO', 157, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(920, 'HUASAGA (CAB.EN WAMPUIK)', 157, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(921, 'MACUMA', 157, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(922, 'SAN ISIDRO', 157, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(923, 'SEVILLA DON BOSCO', 157, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(924, 'SINAÍ', 157, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(925, 'TAISHA', 157, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(926, 'ZUÑA (ZÚÑAC)', 157, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(927, 'TUUTINENTZA', 157, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(928, 'CUCHAENTZA', 157, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(929, 'SAN JOSÉ DE MORONA', 157, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(930, 'RÍO BLANCO', 157, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(931, 'GUALAQUIZA', 158, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(932, 'MERCEDES MOLINA', 158, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(933, 'AMAZONAS (ROSARIO DE CUYES)', 158, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(934, 'BERMEJOS', 158, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(935, 'BOMBOIZA', 158, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(936, 'CHIGÜINDA', 158, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(937, 'EL ROSARIO', 158, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(938, 'NUEVA TARQUI', 158, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(939, 'SAN MIGUEL DE CUYES', 158, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(940, 'EL IDEAL', 158, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(941, 'GENERAL LEONIDAS PLAZA GUTIÉRREZ (LIMÓN)', 159, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(942, 'INDANZA', 159, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(943, 'PAN DE AZÚCAR', 159, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(944, 'SAN ANTONIO (CAB. EN SAN ANTONIO CENTRO', 159, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(945, 'SAN CARLOS DE LIMÓN (SAN CARLOS DEL', 159, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(946, 'SAN JUAN BOSCO', 159, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(947, 'SAN MIGUEL DE CONCHAY', 159, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(948, 'SANTA SUSANA DE CHIVIAZA (CAB. EN CHIVIAZA)', 159, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(949, 'YUNGANZA (CAB. EN EL ROSARIO)', 159, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(950, 'PALORA (METZERA)', 160, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(951, 'ARAPICOS', 160, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(952, 'CUMANDÁ (CAB. EN COLONIA AGRÍCOLA SEVILLA DEL ORO)', 160, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(953, 'HUAMBOYA', 160, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(954, 'SANGAY (CAB. EN NAYAMANACA)', 160, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(955, 'SANTIAGO DE MÉNDEZ', 161, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(956, 'COPAL', 161, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(957, 'CHUPIANZA', 161, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(958, 'PATUCA', 161, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(959, 'SAN LUIS DE EL ACHO (CAB. EN EL ACHO)', 161, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(960, 'SANTIAGO', 161, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(961, 'TAYUZA', 161, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(962, 'SAN FRANCISCO DE CHINIMBIMI', 161, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(963, 'SUCÚA', 162, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(964, 'ASUNCIÓN', 162, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(965, 'HUAMBI', 162, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(966, 'LOGROÑO', 162, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(967, 'YAUPI', 162, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(968, 'SANTA MARIANITA DE JESÚS', 162, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(969, 'HUAMBOYA', 163, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(970, 'CHIGUAZA', 163, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(971, 'PABLO SEXTO', 163, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(972, 'SAN JUAN BOSCO', 164, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(973, 'PAN DE AZÚCAR', 164, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(974, 'SAN CARLOS DE LIMÓN', 164, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(975, 'SAN JACINTO DE WAKAMBEIS', 164, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(976, 'SANTIAGO DE PANANZA', 164, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(977, 'TAISHA', 165, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(978, 'HUASAGA (CAB. EN WAMPUIK)', 165, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(979, 'MACUMA', 165, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(980, 'TUUTINENTZA', 165, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(981, 'PUMPUENTSA', 165, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(982, 'LOGROÑO', 166, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(983, 'YAUPI', 166, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(984, 'SHIMPIS', 166, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(985, 'PABLO SEXTO', 167, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(986, 'SANTIAGO', 168, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(987, 'SAN JOSÉ DE MORONA', 168, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(988, 'TENA', 169, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(989, 'AHUANO', 169, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(990, 'CARLOS JULIO AROSEMENA TOLA (ZATZA-YACU)', 169, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(991, 'CHONTAPUNTA', 169, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(992, 'PANO', 169, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(993, 'PUERTO MISAHUALLI', 169, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(994, 'PUERTO NAPO', 169, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(995, 'TÁLAG', 169, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(996, 'SAN JUAN DE MUYUNA', 169, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(997, 'ARCHIDONA', 170, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(998, 'AVILA', 170, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(999, 'COTUNDO', 170, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1000, 'LORETO', 170, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1001, 'SAN PABLO DE USHPAYACU', 170, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1002, 'PUERTO MURIALDO', 170, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1003, 'EL CHACO', 171, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1004, 'GONZALO DíAZ DE PINEDA (EL BOMBÓN)', 171, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1005, 'LINARES', 171, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1006, 'OYACACHI', 171, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1007, 'SANTA ROSA', 171, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1008, 'SARDINAS', 171, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1009, 'BAEZA', 172, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1010, 'COSANGA', 172, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1011, 'CUYUJA', 172, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1012, 'PAPALLACTA', 172, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1013, 'SAN FRANCISCO DE BORJA (VIRGILIO DÁVILA)', 172, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1014, 'SAN JOSÉ DEL PAYAMINO', 172, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1015, 'SUMACO', 172, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1016, 'CARLOS JULIO AROSEMENA TOLA', 173, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1017, 'PUYO', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1018, 'ARAJUNO', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1019, 'CANELOS', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1020, 'CURARAY', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1021, 'DIEZ DE AGOSTO', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1022, 'FÁTIMA', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1023, 'MONTALVO (ANDOAS)', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1024, 'POMONA', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1025, 'RÍO CORRIENTES', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1026, 'RÍO TIGRE', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1027, 'SANTA CLARA', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1028, 'SARAYACU', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1029, 'SIMÓN BOLÍVAR (CAB. EN MUSHULLACTA)', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1030, 'TARQUI', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1031, 'TENIENTE HUGO ORTIZ', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1032, 'VERACRUZ (INDILLAMA) (CAB. EN INDILLAMA)', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1033, 'EL TRIUNFO', 174, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1034, 'MERA', 175, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1035, 'MADRE TIERRA', 175, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1036, 'SHELL', 175, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1037, 'SANTA CLARA', 176, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1038, 'SAN JOSÉ', 176, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1039, 'ARAJUNO', 177, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1040, 'CURARAY', 177, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1041, 'BELISARIO QUEVEDO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1042, 'CARCELÉN', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1043, 'CENTRO HISTÓRICO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1044, 'COCHAPAMBA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1045, 'COMITÉ DEL PUEBLO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1046, 'COTOCOLLAO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1047, 'CHILIBULO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1048, 'CHILLOGALLO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1049, 'CHIMBACALLE', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1050, 'EL CONDADO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1051, 'GUAMANÍ', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1052, 'IÑAQUITO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1053, 'ITCHIMBÍA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1054, 'JIPIJAPA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1055, 'KENNEDY', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1056, 'LA ARGELIA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1057, 'LA CONCEPCIÓN', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1058, 'LA ECUATORIANA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1059, 'LA FERROVIARIA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1060, 'LA LIBERTAD', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1061, 'LA MAGDALENA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1062, 'LA MENA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1063, 'MARISCAL SUCRE', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1064, 'PONCEANO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1065, 'PUENGASÍ', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1066, 'QUITUMBE', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1067, 'RUMIPAMBA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1068, 'SAN BARTOLO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1069, 'SAN ISIDRO DEL INCA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1070, 'SAN JUAN', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1071, 'SOLANDA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1072, 'TURUBAMBA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1073, 'QUITO DISTRITO METROPOLITANO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1074, 'ALANGASÍ', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1075, 'AMAGUAÑA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1076, 'ATAHUALPA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1077, 'CALACALÍ', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1078, 'CALDERÓN', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1079, 'CONOCOTO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1080, 'CUMBAYÁ', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1081, 'CHAVEZPAMBA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1082, 'CHECA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1083, 'EL QUINCHE', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1084, 'GUALEA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1085, 'GUANGOPOLO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1086, 'GUAYLLABAMBA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1087, 'LA MERCED', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1088, 'LLANO CHICO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1089, 'LLOA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1090, 'MINDO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1091, 'NANEGAL', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1092, 'NANEGALITO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1093, 'NAYÓN', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1094, 'NONO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1095, 'PACTO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1096, 'PEDRO VICENTE MALDONADO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1097, 'PERUCHO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1098, 'PIFO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1099, 'PÍNTAG', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1100, 'POMASQUI', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1101, 'PUÉLLARO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1102, 'PUEMBO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1103, 'SAN ANTONIO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1104, 'SAN JOSÉ DE MINAS', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1105, 'SAN MIGUEL DE LOS BANCOS', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1106, 'TABABELA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1107, 'TUMBACO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1108, 'YARUQUÍ', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1109, 'ZAMBIZA', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1110, 'PUERTO QUITO', 178, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1111, 'AYORA', 179, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1112, 'CAYAMBE', 179, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1113, 'JUAN MONTALVO', 179, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1114, 'ASCÁZUBI', 179, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1115, 'CANGAHUA', 179, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1116, 'OLMEDO (PESILLO)', 179, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1117, 'OTÓN', 179, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1118, 'SANTA ROSA DE CUZUBAMBA', 179, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1119, 'MACHACHI', 180, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1120, 'ALÓAG', 180, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1121, 'ALOASÍ', 180, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1122, 'CUTUGLAHUA', 180, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1123, 'EL CHAUPI', 180, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1124, 'MANUEL CORNEJO ASTORGA (TANDAPI)', 180, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1125, 'TAMBILLO', 180, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1126, 'UYUMBICHO', 180, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1127, 'TABACUNDO', 181, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1128, 'LA ESPERANZA', 181, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1129, 'MALCHINGUÍ', 181, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1130, 'TOCACHI', 181, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1131, 'TUPIGACHI', 181, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1132, 'SANGOLQUÍ', 182, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1133, 'SAN PEDRO DE TABOADA', 182, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1134, 'SAN RAFAEL', 182, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1135, 'COTOGCHOA', 182, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1136, 'RUMIPAMBA', 182, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1137, 'SAN MIGUEL DE LOS BANCOS', 183, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1138, 'MINDO', 183, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1139, 'PEDRO VICENTE MALDONADO', 183, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1140, 'PUERTO QUITO', 183, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1141, 'PEDRO VICENTE MALDONADO', 184, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1142, 'PUERTO QUITO', 185, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1143, 'ATOCHA – FICOA', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1144, 'CELIANO MONGE', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1145, 'HUACHI CHICO', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1146, 'HUACHI LORETO', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1147, 'LA MERCED', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1148, 'LA PENÍNSULA', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1149, 'MATRIZ', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1150, 'PISHILATA', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1151, 'SAN FRANCISCO', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1152, 'AMBATO', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1153, 'AMBATILLO', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1154, 'ATAHUALPA (CHISALATA)', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1155, 'AUGUSTO N. MARTÍNEZ (MUNDUGLEO)', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1156, 'CONSTANTINO FERNÁNDEZ (CAB. EN CULLITAHUA)', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1157, 'HUACHI GRANDE', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1158, 'IZAMBA', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1159, 'JUAN BENIGNO VELA', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1160, 'MONTALVO', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1161, 'PASA', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1162, 'PICAIGUA', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1163, 'PILAGÜÍN (PILAHÜÍN)', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1164, 'QUISAPINCHA (QUIZAPINCHA)', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1165, 'SAN BARTOLOMÉ DE PINLLOG', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1166, 'SAN FERNANDO (PASA SAN FERNANDO)', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1167, 'SANTA ROSA', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1168, 'TOTORAS', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1169, 'CUNCHIBAMBA', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1170, 'UNAMUNCHO', 186, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1171, 'BAÑOS DE AGUA SANTA', 187, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1172, 'LLIGUA', 187, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1173, 'RÍO NEGRO', 187, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1174, 'RÍO VERDE', 187, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1175, 'ULBA', 187, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1176, 'CEVALLOS', 188, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1177, 'MOCHA', 189, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1178, 'PINGUILÍ', 189, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1179, 'PATATE', 190, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1180, 'EL TRIUNFO', 190, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1181, 'LOS ANDES (CAB. EN POATUG)', 190, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1182, 'SUCRE (CAB. EN SUCRE-PATATE URCU)', 190, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1183, 'QUERO', 191, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1184, 'RUMIPAMBA', 191, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1185, 'YANAYACU - MOCHAPATA (CAB. EN YANAYACU)', 191, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1186, 'PELILEO', 192, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1187, 'PELILEO GRANDE', 192, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1188, 'BENÍTEZ (PACHANLICA)', 192, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1189, 'BOLÍVAR', 192, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1190, 'COTALÓ', 192, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1191, 'CHIQUICHA (CAB. EN CHIQUICHA GRANDE)', 192, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1192, 'EL ROSARIO (RUMICHACA)', 192, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1193, 'GARCÍA MORENO (CHUMAQUI)', 192, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1194, 'GUAMBALÓ (HUAMBALÓ)', 192, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1195, 'SALASACA', 192, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1196, 'CIUDAD NUEVA', 193, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1197, 'PÍLLARO', 193, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1198, 'BAQUERIZO MORENO', 193, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1199, 'EMILIO MARÍA TERÁN (RUMIPAMBA)', 193, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1200, 'MARCOS ESPINEL (CHACATA)', 193, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1201, 'PRESIDENTE URBINA (CHAGRAPAMBA -PATZUCUL)', 193, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1202, 'SAN ANDRÉS', 193, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1203, 'SAN JOSÉ DE POALÓ', 193, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1204, 'SAN MIGUELITO', 193, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1205, 'TISALEO', 194, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1206, 'QUINCHICOTO', 194, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1207, 'EL LIMÓN', 195, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1208, 'ZAMORA', 195, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1209, 'CUMBARATZA', 195, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1210, 'GUADALUPE', 195, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1211, 'IMBANA (LA VICTORIA DE IMBANA)', 195, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1212, 'PAQUISHA', 195, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1213, 'SABANILLA', 195, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1214, 'TIMBARA', 195, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1215, 'ZUMBI', 195, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1216, 'SAN CARLOS DE LAS MINAS', 195, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1217, 'ZUMBA', 196, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1218, 'CHITO', 196, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1219, 'EL CHORRO', 196, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1220, 'EL PORVENIR DEL CARMEN', 196, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1221, 'LA CHONTA', 196, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1222, 'PALANDA', 196, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1223, 'PUCAPAMBA', 196, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1224, 'SAN FRANCISCO DEL VERGEL', 196, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1225, 'VALLADOLID', 196, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1226, 'SAN ANDRÉS', 196, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1227, 'GUAYZIMI', 197, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1228, 'ZURMI', 197, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1229, 'NUEVO PARAÍSO', 197, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1230, '28 DE MAYO (SAN JOSÉ DE YACUAMBI)', 198, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1231, 'LA PAZ', 198, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1232, 'TUTUPALI', 198, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1233, 'YANTZAZA (YANZATZA)', 199, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1234, 'CHICAÑA', 199, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1235, 'EL PANGUI', 199, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1236, 'LOS ENCUENTROS', 199, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1237, 'EL PANGUI', 200, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1238, 'EL GUISME', 200, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1239, 'PACHICUTZA', 200, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1240, 'TUNDAYME', 200, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1241, 'ZUMBI', 201, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1242, 'PAQUISHA', 201, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1243, 'TRIUNFO-DORADO', 201, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1244, 'PANGUINTZA', 201, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1245, 'PALANDA', 202, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1246, 'EL PORVENIR DEL CARMEN', 202, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1247, 'SAN FRANCISCO DEL VERGEL', 202, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1248, 'VALLADOLID', 202, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1249, 'LA CANELA', 202, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1250, 'PAQUISHA', 203, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1251, 'BELLAVISTA', 203, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1252, 'NUEVO QUITO', 203, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1253, 'PUERTO BAQUERIZO MORENO', 204, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1254, 'EL PROGRESO', 204, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1255, 'L', 204, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1256, 'PUERTO VILLAMIL', 205, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1257, 'TOMÁS DE BERLANGA (SANTO TOMÁS)', 205, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1258, 'PUERTO AYORA', 206, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1259, 'BELLAVISTA', 206, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1260, 'SANTA ROSA (INCLUYE LA ISLA BALTRA)', 206, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1261, 'NUEVA LOJA', 207, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1262, 'CUYABENO', 207, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1263, 'DURENO', 207, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1264, 'GENERAL FARFÁN', 207, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1265, 'TARAPOA', 207, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1266, 'EL ENO', 207, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1267, 'PACAYACU', 207, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1268, 'JAMBELÍ', 207, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1269, 'SANTA CECILIA', 207, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1270, 'AGUAS NEGRAS', 207, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1271, 'EL DORADO DE CASCALES', 208, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1272, 'EL REVENTADOR', 208, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1273, 'GONZALO PIZARRO', 208, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1274, 'LUMBAQUÍ', 208, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1275, 'PUERTO LIBRE', 208, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1276, 'SANTA ROSA DE SUCUMBÍOS', 208, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1277, 'PUERTO EL CARMEN DEL PUTUMAYO', 209, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1278, 'PALMA ROJA', 209, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1279, 'PUERTO BOLÍVAR (PUERTO MONTÚFAR)', 209, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1280, 'PUERTO RODRÍGUEZ', 209, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1281, 'SANTA ELENA', 209, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1282, 'SHUSHUFINDI', 210, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1283, 'LIMONCOCHA', 210, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1284, 'PAÑACOCHA', 210, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1285, 'SAN ROQUE (CAB. EN SAN VICENTE)', 210, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1286, 'SAN PEDRO DE LOS COFANES', 210, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1287, 'SIETE DE JULIO', 210, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1288, 'LA BONITA', 211, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1289, 'EL PLAYÓN DE SAN FRANCISCO', 211, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1290, 'LA SOFÍA', 211, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1291, 'ROSA FLORIDA', 211, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1292, 'SANTA BÁRBARA', 211, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1293, 'EL DORADO DE CASCALES', 212, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1294, 'SANTA ROSA DE SUCUMBÍOS', 212, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1295, 'SEVILLA', 212, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1296, 'TARAPOA', 213, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1297, 'CUYABENO', 213, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1298, 'AGUAS NEGRAS', 213, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1299, 'PUERTO FRANCISCO DE ORELLANA (EL COCA)', 214, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1300, 'DAYUMA', 214, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1301, 'TARACOA (NUEVA ESPERANZA: YUCA)', 214, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1302, 'ALEJANDRO LABAKA', 214, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1303, 'EL DORADO', 214, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1304, 'EL EDÉN', 214, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1305, 'GARCÍA MORENO', 214, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1306, 'INÉS ARANGO (CAB. EN WESTERN)', 214, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1307, 'LA BELLEZA', 214, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1308, 'NUEVO PARAÍSO (CAB. EN UNIÓN', 214, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1309, 'SAN JOSÉ DE GUAYUSA', 214, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1310, 'SAN LUIS DE ARMENIA', 214, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1311, 'TIPITINI', 215, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1312, 'NUEVO ROCAFUERTE', 215, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1313, 'CAPITÁN AUGUSTO RIVADENEYRA', 215, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1314, 'CONONACO', 215, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1315, 'SANTA MARÍA DE HUIRIRIMA', 215, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1316, 'TIPUTINI', 215, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1317, 'YASUNÍ', 215, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1318, 'LA JOYA DE LOS SACHAS', 216, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1319, 'ENOKANQUI', 216, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1320, 'POMPEYA', 216, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1321, 'SAN CARLOS', 216, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1322, 'SAN SEBASTIÁN DEL COCA', 216, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1323, 'LAGO SAN PEDRO', 216, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1324, 'RUMIPAMBA', 216, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1325, 'TRES DE NOVIEMBRE', 216, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1326, 'UNIÓN MILAGREÑA', 216, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1327, 'LORETO', 217, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1328, 'AVILA (CAB. EN HUIRUNO)', 217, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1329, 'PUERTO MURIALDO', 217, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1330, 'SAN JOSÉ DE PAYAMINO', 217, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1331, 'SAN JOSÉ DE DAHUANO', 217, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1332, 'SAN VICENTE DE HUATICOCHA', 217, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1333, 'ABRAHAM CALAZACÓN', 218, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1334, 'BOMBOLÍ', 218, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1335, 'CHIGUILPE', 218, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1336, 'RÍO TOACHI', 218, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1337, 'RÍO VERDE', 218, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1338, 'SANTO DOMINGO DE LOS COLORADOS', 218, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1339, 'ZARACAY', 218, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1340, 'ALLURIQUÍN', 218, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1341, 'PUERTO LIMÓN', 218, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1342, 'LUZ DE AMÉRICA', 218, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1343, 'SAN JACINTO DEL BÚA', 218, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1344, 'VALLE HERMOSO', 218, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1345, 'EL ESFUERZO', 218, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1346, 'SANTA MARÍA DEL TOACHI', 218, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1347, 'BALLENITA', 219, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1348, 'SANTA ELENA', 219, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1349, 'ATAHUALPA', 219, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1350, 'COLONCHE', 219, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1351, 'CHANDUY', 219, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1352, 'MANGLARALTO', 219, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1353, 'SIMÓN BOLÍVAR (JULIO MORENO)', 219, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1354, 'SAN JOSÉ DE ANCÓN', 219, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1355, 'LA LIBERTAD', 220, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1356, 'CARLOS ESPINOZA LARREA', 221, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1357, 'GRAL. ALBERTO ENRÍQUEZ GALLO', 221, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1358, 'VICENTE ROCAFUERTE', 221, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1359, 'SANTA ROSA', 221, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1360, 'SALINAS', 221, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1361, 'ANCONCITO', 221, '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(1362, 'JOSÉ LUIS TAMAYO (MUEY)', 221, '2025-06-23 23:28:44', '2025-06-23 23:28:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_PROCEDIMIENTOS_EMERGENCIA`
--

CREATE TABLE `CAT_PROCEDIMIENTOS_EMERGENCIA` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_PROCEDIMIENTOS_EMERGENCIA`
--

INSERT INTO `CAT_PROCEDIMIENTOS_EMERGENCIA` (`id`, `nombre`) VALUES
(10, 'Canalización'),
(17, 'Colocación de Sonda'),
(20, 'Colocación de Sonda Vesical'),
(6, 'Curaciones'),
(16, 'Drenaje de Acceso'),
(11, 'Glicemia'),
(5, 'Hidratación'),
(15, 'Involución Uterina'),
(2, 'Inyección Dérmica'),
(4, 'Inyección Intramuscular'),
(1, 'Inyección Intravenosa'),
(3, 'Inyección Subcutánea'),
(23, 'Medicación Inhalatoria'),
(14, 'Medicación Intrarrectal'),
(12, 'Medicación Vía Oral'),
(24, 'Medicina Intravaginal'),
(13, 'Medio Físico'),
(9, 'Nebulización'),
(18, 'Oxígeno'),
(22, 'Pruebas Rápidas'),
(19, 'Retiro de Cuerpo Extraño'),
(8, 'Retiro de Puntos'),
(7, 'Sutura'),
(21, 'Vacunación');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_PROVINCIAS`
--

CREATE TABLE `CAT_PROVINCIAS` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `CAT_PROVINCIAS`
--

INSERT INTO `CAT_PROVINCIAS` (`id`, `nombre`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'AZUAY', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(2, 'BOLIVAR', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(3, 'CAÑAR', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(4, 'CARCHI', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(5, 'COTOPAXI', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(6, 'CHIMBORAZO', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(7, 'EL ORO', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(8, 'ESMERALDAS', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(9, 'GUAYAS', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(10, 'IMBABURA', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(11, 'LOJA', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(12, 'LOS RIOS', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(13, 'MANABI', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(14, 'MORONA SANTIAGO', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(15, 'NAPO', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(16, 'PASTAZA', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(17, 'PICHINCHA', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(18, 'TUNGURAHUA', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(19, 'ZAMORA CHINCHIPE', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(20, 'GALAPAGOS', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(21, 'SUCUMBIOS', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(22, 'ORELLANA', '2025-06-23 23:28:44', '2025-06-23 23:28:44'),
(23, 'SANTO DOMINGO DE LOS TSACHILAS', '2025-06-23 23:28:44', '2025-07-10 21:30:24'),
(24, 'SANTA ELENA', '2025-06-23 23:28:44', '2025-06-23 23:28:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_PUEBLOS_KICHWA`
--

CREATE TABLE `CAT_PUEBLOS_KICHWA` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_PUEBLOS_KICHWA`
--

INSERT INTO `CAT_PUEBLOS_KICHWA` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Chibuleo', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'Cañari', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(3, 'Karanki', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(4, 'Kayambi', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(5, 'Kichwa Amazónico', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(6, 'Kisapincha', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(7, 'Kitukara', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(8, 'Natabuela', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(9, 'No sabemos/No responde', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(10, 'Otavalo', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(11, 'Paltas', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(12, 'Panzaleo', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(13, 'Pastos', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(14, 'Puruhá', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(15, 'Salasaka', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(16, 'Saraguro', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(17, 'Tomabela', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(18, 'Waramka', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_SEGUROS_SALUD`
--

CREATE TABLE `CAT_SEGUROS_SALUD` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_SEGUROS_SALUD`
--

INSERT INTO `CAT_SEGUROS_SALUD` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Seguro General', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'Seguro Campesino', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(3, 'Montepio', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(4, 'Afiliado Voluntario', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(5, 'No Aporta', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(6, 'ISSFA', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(7, 'ISSPOL', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(8, 'Otro', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_SEXOS`
--

CREATE TABLE `CAT_SEXOS` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_SEXOS`
--

INSERT INTO `CAT_SEXOS` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Hombre', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'Mujer', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_TIENE_DISCAPACIDAD`
--

CREATE TABLE `CAT_TIENE_DISCAPACIDAD` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_TIENE_DISCAPACIDAD`
--

INSERT INTO `CAT_TIENE_DISCAPACIDAD` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Sí', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'No', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_TIPOS_BONO`
--

CREATE TABLE `CAT_TIPOS_BONO` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_TIPOS_BONO`
--

INSERT INTO `CAT_TIPOS_BONO` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Desarrollo Humano', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'Joaquín Gallegos Lara', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(3, 'Manuela Espejo', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(4, 'Ninguno', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_TIPOS_DISCAPACIDAD`
--

CREATE TABLE `CAT_TIPOS_DISCAPACIDAD` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_TIPOS_DISCAPACIDAD`
--

INSERT INTO `CAT_TIPOS_DISCAPACIDAD` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Física', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'Intelectual', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(3, 'Visual', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(4, 'Auditiva', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(5, 'Psicosocial', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_TIPOS_EMPRESA_TRABAJO`
--

CREATE TABLE `CAT_TIPOS_EMPRESA_TRABAJO` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_TIPOS_EMPRESA_TRABAJO`
--

INSERT INTO `CAT_TIPOS_EMPRESA_TRABAJO` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Pública', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'Privada', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(3, 'Ninguna', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_TIPOS_IDENTIFICACION`
--

CREATE TABLE `CAT_TIPOS_IDENTIFICACION` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_TIPOS_IDENTIFICACION`
--

INSERT INTO `CAT_TIPOS_IDENTIFICACION` (`id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Cedula de Identidad', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46'),
(2, 'NoIdentificado', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CAT_TRIAJE`
--

CREATE TABLE `CAT_TRIAJE` (
  `id` int(11) NOT NULL,
  `color` varchar(255) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CAT_TRIAJE`
--

INSERT INTO `CAT_TRIAJE` (`id`, `color`, `nombre`, `descripcion`) VALUES
(1, 'Rojo', 'RESUCITACIÓN', NULL),
(2, 'Naranja', 'EMERGENCIA', NULL),
(3, 'Amarillo', 'URGENCIA', NULL),
(4, 'Verde', 'URGENCIA MENOR', NULL),
(5, 'Azul', 'SIN URGENCIA', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CONTACTOS_EMERGENCIA`
--

CREATE TABLE `CONTACTOS_EMERGENCIA` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `nombre_contacto` varchar(255) NOT NULL,
  `parentesco_contacto_id` int(11) NOT NULL,
  `telefono_contacto` varchar(20) NOT NULL,
  `direccion_contacto` varchar(255) NOT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `CONTACTOS_EMERGENCIA`
--

INSERT INTO `CONTACTOS_EMERGENCIA` (`id`, `paciente_id`, `nombre_contacto`, `parentesco_contacto_id`, `telefono_contacto`, `direccion_contacto`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(64, 77, 'ROXANA ALCIVAR MUÑOZ', 4, '0983476078', 'CIUDADELA LOS CHOFERES', '2025-09-27 21:53:33', '2025-09-27 21:53:33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `CUMPLIMIENTO_PROCEDIMIENTOS`
--

CREATE TABLE `CUMPLIMIENTO_PROCEDIMIENTOS` (
  `id` int(11) NOT NULL,
  `admision_id` int(11) NOT NULL,
  `procedimiento_cat_id` int(11) NOT NULL,
  `usuario_enfermeria_id` int(11) DEFAULT NULL,
  `observacion_hallazgo` text DEFAULT NULL,
  `alerta_medica` tinyint(1) DEFAULT 0,
  `fecha_hora` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `DATOS_ADICIONALES_PACIENTE`
--

CREATE TABLE `DATOS_ADICIONALES_PACIENTE` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `telefono` varchar(255) DEFAULT NULL,
  `celular` varchar(255) NOT NULL,
  `correo_electronico` varchar(255) DEFAULT NULL,
  `autoidentificacion_etnica_id` int(11) NOT NULL,
  `nacionalidad_pueblos_id` int(11) DEFAULT NULL,
  `pueblo_kichwa_id` int(11) DEFAULT NULL,
  `nivel_educacion_id` int(11) NOT NULL,
  `grado_nivel_educacion_id` int(11) NOT NULL,
  `tipo_empresa_trabajo_id` int(11) NOT NULL,
  `ocupacion_profesion_principal_id` int(11) NOT NULL,
  `seguro_salud_principal_id` int(11) NOT NULL,
  `tipo_bono_recibe_id` int(11) NOT NULL,
  `tiene_discapacidad_id` int(11) NOT NULL,
  `tipo_discapacidad_id` int(11) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `DATOS_ADICIONALES_PACIENTE`
--

INSERT INTO `DATOS_ADICIONALES_PACIENTE` (`id`, `paciente_id`, `telefono`, `celular`, `correo_electronico`, `autoidentificacion_etnica_id`, `nacionalidad_pueblos_id`, `pueblo_kichwa_id`, `nivel_educacion_id`, `grado_nivel_educacion_id`, `tipo_empresa_trabajo_id`, `ocupacion_profesion_principal_id`, `seguro_salud_principal_id`, `tipo_bono_recibe_id`, `tiene_discapacidad_id`, `tipo_discapacidad_id`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(71, 77, '', '0986382910', '', 6, NULL, NULL, 7, 2, 1, 6, 1, 4, 2, NULL, '2025-09-27 21:53:33', '2025-09-27 21:53:33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `MEDICAMENTOS`
--

CREATE TABLE `MEDICAMENTOS` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 0,
  `unidad_medida` varchar(50) DEFAULT NULL,
  `fecha_caducidad` date DEFAULT NULL,
  `lote` varchar(100) DEFAULT NULL,
  `proveedor` varchar(255) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ORDENES_EXAMEN`
--

CREATE TABLE `ORDENES_EXAMEN` (
  `id` int(11) NOT NULL,
  `admisionId` int(11) NOT NULL,
  `usuarioId` int(11) NOT NULL,
  `fechaEmision` date NOT NULL DEFAULT curdate(),
  `tipoExamen` varchar(255) NOT NULL,
  `observaciones` text DEFAULT NULL,
  `firmaElectronica` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL,
  `updatedAt` timestamp NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ORDENES_IMAGEN`
--

CREATE TABLE `ORDENES_IMAGEN` (
  `id` int(11) NOT NULL,
  `admisionId` int(11) NOT NULL,
  `usuarioId` int(11) NOT NULL,
  `fechaEmision` date NOT NULL DEFAULT curdate(),
  `tipoImagen` varchar(255) NOT NULL,
  `observaciones` text DEFAULT NULL,
  `firmaElectronica` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL,
  `updatedAt` timestamp NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `PACIENTES`
--

CREATE TABLE `PACIENTES` (
  `id` int(11) NOT NULL,
  `tipo_identificacion_id` int(11) NOT NULL,
  `numero_identificacion` varchar(255) NOT NULL,
  `primer_apellido` varchar(255) NOT NULL,
  `segundo_apellido` varchar(255) DEFAULT NULL,
  `primer_nombre` varchar(255) NOT NULL,
  `segundo_nombre` varchar(255) DEFAULT NULL,
  `estado_civil_id` int(11) NOT NULL,
  `sexo_id` int(11) NOT NULL,
  `residencia_id` int(11) DEFAULT NULL,
  `nacionalidad_id` int(11) NOT NULL,
  `fecha_nacimiento` datetime NOT NULL,
  `provincia_nacimiento_id` int(11) DEFAULT NULL,
  `canton_nacimiento_id` int(11) DEFAULT NULL,
  `parroquia_nacimiento_id` int(11) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `PACIENTES`
--

INSERT INTO `PACIENTES` (`id`, `tipo_identificacion_id`, `numero_identificacion`, `primer_apellido`, `segundo_apellido`, `primer_nombre`, `segundo_nombre`, `estado_civil_id`, `sexo_id`, `residencia_id`, `nacionalidad_id`, `fecha_nacimiento`, `provincia_nacimiento_id`, `canton_nacimiento_id`, `parroquia_nacimiento_id`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(76, 1, '1304990722', 'ALCIVAR', 'ALCIVAR', 'PABLO', 'ANDRES', 2, 1, 110, 1, '1965-11-30 00:00:00', 13, 137, 826, '2025-07-07 02:10:31', '2025-07-07 02:10:31'),
(77, 1, '1314783083', 'ALCIVAR', 'RIVERO', 'ANDRES', 'ALEJANDRO', 1, 1, 119, 1, '1994-05-06 00:00:00', 13, 137, 826, '2025-07-09 16:30:27', '2025-09-27 21:53:33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `PARTOS`
--

CREATE TABLE `PARTOS` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `fecha_parto` datetime NOT NULL,
  `atendido_en_centro_salud` tinyint(1) NOT NULL,
  `hora_parto` time DEFAULT NULL,
  `edad_en_horas_al_ingreso` int(11) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `PROCEDIMIENTOS_EMERGENCIA`
--

CREATE TABLE `PROCEDIMIENTOS_EMERGENCIA` (
  `id` int(11) NOT NULL,
  `pacienteId` int(11) NOT NULL,
  `admisionId` int(11) NOT NULL,
  `nombreProcedimiento` varchar(255) NOT NULL,
  `horaRealizacion` datetime NOT NULL,
  `observacion` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `usuarioId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `PROCEDIMIENTOS_EMERGENCIA`
--

INSERT INTO `PROCEDIMIENTOS_EMERGENCIA` (`id`, `pacienteId`, `admisionId`, `nombreProcedimiento`, `horaRealizacion`, `observacion`, `createdAt`, `updatedAt`, `usuarioId`) VALUES
(40, 77, 120, 'Toma de Signos Vitales', '2025-09-28 00:00:27', 'Registro automático por toma de signos vitales.', '2025-09-28 00:00:27', '2025-09-28 00:00:27', 7),
(41, 77, 121, 'Toma de Signos Vitales', '2025-09-30 02:45:26', 'Registro automático por toma de signos vitales.', '2025-09-30 02:45:26', '2025-09-30 02:45:26', 7),
(42, 77, 123, 'Toma de Signos Vitales', '2026-01-24 05:59:08', 'Registro automático por toma de signos vitales.', '2026-01-24 05:59:08', '2026-01-24 05:59:08', 7);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `RECETAS_MEDICAS`
--

CREATE TABLE `RECETAS_MEDICAS` (
  `id` int(11) NOT NULL,
  `admisionId` int(11) NOT NULL,
  `usuarioId` int(11) NOT NULL,
  `fechaEmision` date NOT NULL DEFAULT curdate(),
  `medicamentos` text NOT NULL,
  `observaciones` text DEFAULT NULL,
  `firmaElectronica` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL,
  `updatedAt` timestamp NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `REPRESENTANTES`
--

CREATE TABLE `REPRESENTANTES` (
  `id` int(11) NOT NULL,
  `parentesco_id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `cedula_representante` varchar(255) NOT NULL,
  `apellidos_nombres_representante` varchar(255) NOT NULL,
  `parentesco_representante_id` int(11) NOT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `RESIDENCIAS`
--

CREATE TABLE `RESIDENCIAS` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) DEFAULT NULL,
  `pais_residencia` varchar(255) NOT NULL,
  `provincia_residencia_id` int(11) DEFAULT NULL,
  `canton_residencia_id` int(11) DEFAULT NULL,
  `parroquia_residencia_id` int(11) DEFAULT NULL,
  `calle_principal` varchar(255) NOT NULL,
  `calle_secundaria` varchar(255) DEFAULT NULL,
  `barrio_residencia` varchar(255) NOT NULL,
  `referencia_residencia` varchar(255) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `RESIDENCIAS`
--

INSERT INTO `RESIDENCIAS` (`id`, `paciente_id`, `pais_residencia`, `provincia_residencia_id`, `canton_residencia_id`, `parroquia_residencia_id`, `calle_principal`, `calle_secundaria`, `barrio_residencia`, `referencia_residencia`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(119, 77, 'Ecuador', 4, 30, 188, 'ENTRADA PRINCIPAL', '', 'CIUDADELA LOS CHOFERES', 'POR EL PARQUE', '2025-09-27 21:53:33', '2026-01-24 05:56:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ROLES`
--

CREATE TABLE `ROLES` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ROLES`
--

INSERT INTO `ROLES` (`id`, `nombre`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Medico', '2025-06-23 23:28:44', '2025-07-03 13:48:06'),
(2, 'Obstetra', '2025-06-23 23:28:44', '2025-07-03 13:48:12'),
(3, 'Enfermeria', '2025-06-23 23:28:44', '2025-07-10 13:45:27'),
(4, 'Estadistico', '2025-06-23 23:28:44', '2025-07-03 13:48:23'),
(5, 'Administrador', '2025-06-23 23:28:44', '2025-07-03 13:48:27'),
(8, 'Farmacia', '2025-07-03 18:39:42', '2025-07-03 18:39:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `SIGNOS_VITALES`
--

CREATE TABLE `SIGNOS_VITALES` (
  `id` int(11) NOT NULL,
  `temperatura` decimal(5,2) DEFAULT NULL,
  `presion_arterial` varchar(20) DEFAULT NULL,
  `frecuencia_cardiaca` int(11) DEFAULT NULL,
  `frecuencia_respiratoria` int(11) DEFAULT NULL,
  `saturacion_oxigeno` decimal(5,2) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `fecha_hora_registro` datetime NOT NULL,
  `admisionId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `sin_constantes_vitales` tinyint(1) DEFAULT 0,
  `peso` decimal(5,2) DEFAULT NULL,
  `talla` decimal(5,2) DEFAULT NULL,
  `perimetro_cefalico` decimal(5,2) DEFAULT NULL,
  `glicemia_capilar` decimal(5,2) DEFAULT NULL,
  `glasgow_ocular` int(11) DEFAULT NULL,
  `glasgow_verbal` int(11) DEFAULT NULL,
  `glasgow_motora` int(11) DEFAULT NULL,
  `usuarioId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `SIGNOS_VITALES`
--

INSERT INTO `SIGNOS_VITALES` (`id`, `temperatura`, `presion_arterial`, `frecuencia_cardiaca`, `frecuencia_respiratoria`, `saturacion_oxigeno`, `observaciones`, `fecha_hora_registro`, `admisionId`, `createdAt`, `updatedAt`, `sin_constantes_vitales`, `peso`, `talla`, `perimetro_cefalico`, `glicemia_capilar`, `glasgow_ocular`, `glasgow_verbal`, `glasgow_motora`, `usuarioId`) VALUES
(39, 37.00, '120/80', 80, 18, 89.00, NULL, '2025-09-27 23:49:11', 120, '2025-09-27 23:49:11', '2025-09-27 23:49:11', 0, 100.00, 174.90, NULL, NULL, NULL, NULL, NULL, 7),
(40, 37.00, '120/80', 80, 18, 89.00, NULL, '2025-09-27 23:57:01', 120, '2025-09-27 23:57:01', '2025-09-27 23:57:01', 0, 100.00, 174.90, NULL, NULL, NULL, NULL, NULL, 7),
(43, 37.00, '120/80', 80, 18, 89.00, NULL, '2025-09-27 23:58:24', 120, '2025-09-27 23:58:24', '2025-09-27 23:58:24', 0, 100.00, 174.90, NULL, NULL, NULL, NULL, NULL, 7),
(46, 37.00, '120/80', 80, 18, 89.00, NULL, '2025-09-28 00:00:27', 120, '2025-09-28 00:00:27', '2025-09-28 00:00:27', 0, 100.00, 174.90, NULL, NULL, NULL, NULL, NULL, 7),
(47, 37.00, '120/80', 80, 20, 98.00, NULL, '2025-09-30 02:45:26', 121, '2025-09-30 02:45:26', '2025-09-30 02:45:26', 0, 103.00, 175.00, NULL, NULL, NULL, NULL, NULL, 7),
(48, 38.00, '160/80', 98, 20, 99.00, NULL, '2026-01-24 05:59:08', 123, '2026-01-24 05:59:08', '2026-01-24 05:59:08', 0, 105.00, 175.00, NULL, NULL, NULL, NULL, NULL, 7);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `TOKENS_RECUPERACION`
--

CREATE TABLE `TOKENS_RECUPERACION` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expiracion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `USUARIOS_SISTEMA`
--

CREATE TABLE `USUARIOS_SISTEMA` (
  `id` int(11) NOT NULL,
  `cedula` varchar(10) NOT NULL,
  `nombres` varchar(255) NOT NULL,
  `apellidos` varchar(255) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `sexo` varchar(255) NOT NULL,
  `correo` varchar(255) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `rol_id` int(11) NOT NULL,
  `activo` tinyint(1) DEFAULT 0,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `telefono` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `USUARIOS_SISTEMA`
--

INSERT INTO `USUARIOS_SISTEMA` (`id`, `cedula`, `nombres`, `apellidos`, `fecha_nacimiento`, `sexo`, `correo`, `contrasena`, `rol_id`, `activo`, `fecha_creacion`, `fecha_actualizacion`, `telefono`) VALUES
(6, '1234567890', 'Admin', 'User', '1990-01-01', 'Hombre', 'estadisticachonetipoc@gmail.com', '$2a$10$kf38gqby0Wmniw2UdLHx2e7X9wvxupeuevhaai1S99OlG7.pnDol.', 5, 1, '2025-06-23 23:28:44', '2026-01-08 00:20:53', NULL),
(7, '1311820987', 'ROXANA', 'ALCIVAR', '1982-10-21', 'Mujer', 'andres.alcivar@13d07.mspz4.gob.ec', '$2a$10$nTvEJlHbmrbElV/vcaeKoe8xZ/uctIeg3W7j.RgCSy9q8DcsInBNi', 3, 1, '2025-06-23 23:28:44', '2025-07-03 14:03:40', NULL),
(8, '1314783083', 'ANDRES ALEJANDRO', 'ALCIVAR RIVERO', '1994-05-06', 'Hombre', 'alejandro_alcivar_rivero@outlook.com', '$2a$10$.9tWmXWey7BJNxQ6kDeZDupbmAY3htLS/19lhu.pUhxU/5Y1..aZ2', 1, 1, '2025-07-09 18:31:33', '2025-07-09 18:31:54', '0986382910');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `ADMISIONES`
--
ALTER TABLE `ADMISIONES`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_admision_id` (`usuario_admision_id`),
  ADD KEY `ADMISIONES_ibfk_1` (`paciente_id`),
  ADD KEY `fk_admisiones_estado_paciente` (`estado_paciente_id`),
  ADD KEY `fk_admisiones_triaje` (`triaje_id`),
  ADD KEY `fk_motivo_consulta_sintoma` (`motivo_consulta_sintoma_id`),
  ADD KEY `triaje_preliminar_id` (`triaje_preliminar_id`),
  ADD KEY `triaje_definitivo_id` (`triaje_definitivo_id`);

--
-- Indices de la tabla `ATENCION_EMERGENCIA`
--
ALTER TABLE `ATENCION_EMERGENCIA`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pacienteId` (`pacienteId`),
  ADD KEY `admisionId` (`admisionId`),
  ADD KEY `usuarioId` (`usuarioId`);

--
-- Indices de la tabla `ATENCION_PACIENTE_ESTADO`
--
ALTER TABLE `ATENCION_PACIENTE_ESTADO`
  ADD PRIMARY KEY (`id`),
  ADD KEY `medicoAsignadoId` (`usuario_responsable_id`),
  ADD KEY `fk_atencion_paciente_estado_estado` (`estado_id`),
  ADD KEY `fk_atencion_paciente_estado_usuario` (`usuario_id`),
  ADD KEY `fk_rol` (`rol_id`);

--
-- Indices de la tabla `CAT_AUTOIDENTIFICACION_ETNICA`
--
ALTER TABLE `CAT_AUTOIDENTIFICACION_ETNICA`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_CANTONES`
--
ALTER TABLE `CAT_CANTONES`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`,`provincia_id`),
  ADD KEY `provincia_id` (`provincia_id`);

--
-- Indices de la tabla `CAT_CIE10`
--
ALTER TABLE `CAT_CIE10`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Indices de la tabla `CAT_ESTADOS_CIVILES`
--
ALTER TABLE `CAT_ESTADOS_CIVILES`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_ESTADO_PACIENTE`
--
ALTER TABLE `CAT_ESTADO_PACIENTE`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_FORMAS_LLEGADA`
--
ALTER TABLE `CAT_FORMAS_LLEGADA`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_FUENTES_INFORMACION`
--
ALTER TABLE `CAT_FUENTES_INFORMACION`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_GRADOS_NIVELES_EDUCACION`
--
ALTER TABLE `CAT_GRADOS_NIVELES_EDUCACION`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_MOTIVO_CONSULTA_SINTOMAS`
--
ALTER TABLE `CAT_MOTIVO_CONSULTA_SINTOMAS`
  ADD PRIMARY KEY (`Codigo`),
  ADD KEY `fk_codigo_triaje` (`Codigo_Triaje`);

--
-- Indices de la tabla `CAT_NACIONALIDADES`
--
ALTER TABLE `CAT_NACIONALIDADES`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_NACIONALIDADES_PUEBLOS`
--
ALTER TABLE `CAT_NACIONALIDADES_PUEBLOS`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_NIVELES_EDUCACION`
--
ALTER TABLE `CAT_NIVELES_EDUCACION`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_OCUPACIONES_PROFESIONES`
--
ALTER TABLE `CAT_OCUPACIONES_PROFESIONES`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_PAISES_RESIDENCIA`
--
ALTER TABLE `CAT_PAISES_RESIDENCIA`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_PARENTESCOS`
--
ALTER TABLE `CAT_PARENTESCOS`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_PARROQUIAS`
--
ALTER TABLE `CAT_PARROQUIAS`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`,`canton_id`),
  ADD KEY `canton_id` (`canton_id`);

--
-- Indices de la tabla `CAT_PROCEDIMIENTOS_EMERGENCIA`
--
ALTER TABLE `CAT_PROCEDIMIENTOS_EMERGENCIA`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_PROVINCIAS`
--
ALTER TABLE `CAT_PROVINCIAS`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_PUEBLOS_KICHWA`
--
ALTER TABLE `CAT_PUEBLOS_KICHWA`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_SEGUROS_SALUD`
--
ALTER TABLE `CAT_SEGUROS_SALUD`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_SEXOS`
--
ALTER TABLE `CAT_SEXOS`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_TIENE_DISCAPACIDAD`
--
ALTER TABLE `CAT_TIENE_DISCAPACIDAD`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_TIPOS_BONO`
--
ALTER TABLE `CAT_TIPOS_BONO`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_TIPOS_DISCAPACIDAD`
--
ALTER TABLE `CAT_TIPOS_DISCAPACIDAD`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_TIPOS_EMPRESA_TRABAJO`
--
ALTER TABLE `CAT_TIPOS_EMPRESA_TRABAJO`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_TIPOS_IDENTIFICACION`
--
ALTER TABLE `CAT_TIPOS_IDENTIFICACION`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CAT_TRIAJE`
--
ALTER TABLE `CAT_TRIAJE`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `color` (`color`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `CONTACTOS_EMERGENCIA`
--
ALTER TABLE `CONTACTOS_EMERGENCIA`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `paciente_id` (`paciente_id`),
  ADD KEY `parentesco_contacto_id` (`parentesco_contacto_id`);

--
-- Indices de la tabla `CUMPLIMIENTO_PROCEDIMIENTOS`
--
ALTER TABLE `CUMPLIMIENTO_PROCEDIMIENTOS`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `DATOS_ADICIONALES_PACIENTE`
--
ALTER TABLE `DATOS_ADICIONALES_PACIENTE`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `paciente_id` (`paciente_id`),
  ADD KEY `autoidentificacion_etnica_id` (`autoidentificacion_etnica_id`),
  ADD KEY `nacionalidad_pueblos_id` (`nacionalidad_pueblos_id`),
  ADD KEY `pueblo_kichwa_id` (`pueblo_kichwa_id`),
  ADD KEY `nivel_educacion_id` (`nivel_educacion_id`),
  ADD KEY `grado_nivel_educacion_id` (`grado_nivel_educacion_id`),
  ADD KEY `tipo_empresa_trabajo_id` (`tipo_empresa_trabajo_id`),
  ADD KEY `ocupacion_profesion_principal_id` (`ocupacion_profesion_principal_id`),
  ADD KEY `seguro_salud_principal_id` (`seguro_salud_principal_id`),
  ADD KEY `tipo_bono_recibe_id` (`tipo_bono_recibe_id`),
  ADD KEY `tiene_discapacidad_id` (`tiene_discapacidad_id`),
  ADD KEY `tipo_discapacidad_id` (`tipo_discapacidad_id`);

--
-- Indices de la tabla `MEDICAMENTOS`
--
ALTER TABLE `MEDICAMENTOS`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `ORDENES_EXAMEN`
--
ALTER TABLE `ORDENES_EXAMEN`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admisionId` (`admisionId`),
  ADD KEY `usuarioId` (`usuarioId`);

--
-- Indices de la tabla `ORDENES_IMAGEN`
--
ALTER TABLE `ORDENES_IMAGEN`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admisionId` (`admisionId`),
  ADD KEY `usuarioId` (`usuarioId`);

--
-- Indices de la tabla `PACIENTES`
--
ALTER TABLE `PACIENTES`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_identificacion` (`numero_identificacion`),
  ADD KEY `tipo_identificacion_id` (`tipo_identificacion_id`),
  ADD KEY `estado_civil_id` (`estado_civil_id`),
  ADD KEY `sexo_id` (`sexo_id`),
  ADD KEY `nacionalidad_id` (`nacionalidad_id`),
  ADD KEY `provincia_nacimiento_id` (`provincia_nacimiento_id`),
  ADD KEY `canton_nacimiento_id` (`canton_nacimiento_id`),
  ADD KEY `parroquia_nacimiento_id` (`parroquia_nacimiento_id`);

--
-- Indices de la tabla `PARTOS`
--
ALTER TABLE `PARTOS`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `paciente_id` (`paciente_id`);

--
-- Indices de la tabla `PROCEDIMIENTOS_EMERGENCIA`
--
ALTER TABLE `PROCEDIMIENTOS_EMERGENCIA`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pacienteId` (`pacienteId`),
  ADD KEY `admisionId` (`admisionId`),
  ADD KEY `fk_usuario` (`usuarioId`);

--
-- Indices de la tabla `RECETAS_MEDICAS`
--
ALTER TABLE `RECETAS_MEDICAS`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admisionId` (`admisionId`),
  ADD KEY `usuarioId` (`usuarioId`);

--
-- Indices de la tabla `REPRESENTANTES`
--
ALTER TABLE `REPRESENTANTES`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `paciente_id` (`paciente_id`),
  ADD KEY `parentesco_representante_id` (`parentesco_representante_id`);

--
-- Indices de la tabla `RESIDENCIAS`
--
ALTER TABLE `RESIDENCIAS`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `paciente_id` (`paciente_id`),
  ADD KEY `provincia_residencia_id` (`provincia_residencia_id`),
  ADD KEY `canton_residencia_id` (`canton_residencia_id`),
  ADD KEY `parroquia_residencia_id` (`parroquia_residencia_id`);

--
-- Indices de la tabla `ROLES`
--
ALTER TABLE `ROLES`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`),
  ADD UNIQUE KEY `nombre_2` (`nombre`),
  ADD UNIQUE KEY `nombre_3` (`nombre`),
  ADD UNIQUE KEY `nombre_4` (`nombre`),
  ADD UNIQUE KEY `nombre_5` (`nombre`),
  ADD UNIQUE KEY `nombre_6` (`nombre`),
  ADD UNIQUE KEY `nombre_7` (`nombre`),
  ADD UNIQUE KEY `nombre_8` (`nombre`),
  ADD UNIQUE KEY `nombre_9` (`nombre`),
  ADD UNIQUE KEY `nombre_10` (`nombre`),
  ADD UNIQUE KEY `nombre_11` (`nombre`),
  ADD UNIQUE KEY `nombre_12` (`nombre`),
  ADD UNIQUE KEY `nombre_13` (`nombre`),
  ADD UNIQUE KEY `nombre_14` (`nombre`),
  ADD UNIQUE KEY `nombre_15` (`nombre`),
  ADD UNIQUE KEY `nombre_16` (`nombre`),
  ADD UNIQUE KEY `nombre_17` (`nombre`),
  ADD UNIQUE KEY `nombre_18` (`nombre`),
  ADD UNIQUE KEY `nombre_19` (`nombre`),
  ADD UNIQUE KEY `nombre_20` (`nombre`),
  ADD UNIQUE KEY `nombre_21` (`nombre`),
  ADD UNIQUE KEY `nombre_22` (`nombre`),
  ADD UNIQUE KEY `nombre_23` (`nombre`),
  ADD UNIQUE KEY `nombre_24` (`nombre`),
  ADD UNIQUE KEY `nombre_25` (`nombre`),
  ADD UNIQUE KEY `nombre_26` (`nombre`),
  ADD UNIQUE KEY `nombre_27` (`nombre`),
  ADD UNIQUE KEY `nombre_28` (`nombre`),
  ADD UNIQUE KEY `nombre_29` (`nombre`),
  ADD UNIQUE KEY `nombre_30` (`nombre`),
  ADD UNIQUE KEY `nombre_31` (`nombre`),
  ADD UNIQUE KEY `nombre_32` (`nombre`),
  ADD UNIQUE KEY `nombre_33` (`nombre`),
  ADD UNIQUE KEY `nombre_34` (`nombre`),
  ADD UNIQUE KEY `nombre_35` (`nombre`),
  ADD UNIQUE KEY `nombre_36` (`nombre`),
  ADD UNIQUE KEY `nombre_37` (`nombre`),
  ADD UNIQUE KEY `nombre_38` (`nombre`);

--
-- Indices de la tabla `SIGNOS_VITALES`
--
ALTER TABLE `SIGNOS_VITALES`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_signos_vitales_usuario` (`usuarioId`);

--
-- Indices de la tabla `TOKENS_RECUPERACION`
--
ALTER TABLE `TOKENS_RECUPERACION`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `USUARIOS_SISTEMA`
--
ALTER TABLE `USUARIOS_SISTEMA`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cedula` (`cedula`),
  ADD UNIQUE KEY `correo` (`correo`),
  ADD UNIQUE KEY `cedula_2` (`cedula`),
  ADD UNIQUE KEY `cedula_3` (`cedula`),
  ADD UNIQUE KEY `cedula_4` (`cedula`),
  ADD UNIQUE KEY `correo_2` (`correo`),
  ADD UNIQUE KEY `cedula_5` (`cedula`),
  ADD UNIQUE KEY `correo_3` (`correo`),
  ADD UNIQUE KEY `cedula_6` (`cedula`),
  ADD UNIQUE KEY `correo_4` (`correo`),
  ADD UNIQUE KEY `cedula_7` (`cedula`),
  ADD UNIQUE KEY `correo_5` (`correo`),
  ADD UNIQUE KEY `cedula_8` (`cedula`),
  ADD UNIQUE KEY `correo_6` (`correo`),
  ADD UNIQUE KEY `cedula_9` (`cedula`),
  ADD UNIQUE KEY `correo_7` (`correo`),
  ADD UNIQUE KEY `cedula_10` (`cedula`),
  ADD UNIQUE KEY `correo_8` (`correo`),
  ADD UNIQUE KEY `cedula_11` (`cedula`),
  ADD UNIQUE KEY `correo_9` (`correo`),
  ADD UNIQUE KEY `cedula_12` (`cedula`),
  ADD UNIQUE KEY `correo_10` (`correo`),
  ADD UNIQUE KEY `cedula_13` (`cedula`),
  ADD UNIQUE KEY `correo_11` (`correo`),
  ADD UNIQUE KEY `cedula_14` (`cedula`),
  ADD UNIQUE KEY `correo_12` (`correo`),
  ADD UNIQUE KEY `cedula_15` (`cedula`),
  ADD UNIQUE KEY `correo_13` (`correo`),
  ADD UNIQUE KEY `cedula_16` (`cedula`),
  ADD UNIQUE KEY `correo_14` (`correo`),
  ADD UNIQUE KEY `cedula_17` (`cedula`),
  ADD UNIQUE KEY `correo_15` (`correo`),
  ADD UNIQUE KEY `cedula_18` (`cedula`),
  ADD UNIQUE KEY `correo_16` (`correo`),
  ADD UNIQUE KEY `cedula_19` (`cedula`),
  ADD UNIQUE KEY `correo_17` (`correo`),
  ADD UNIQUE KEY `cedula_20` (`cedula`),
  ADD UNIQUE KEY `correo_18` (`correo`),
  ADD UNIQUE KEY `cedula_21` (`cedula`),
  ADD UNIQUE KEY `correo_19` (`correo`),
  ADD UNIQUE KEY `cedula_22` (`cedula`),
  ADD UNIQUE KEY `correo_20` (`correo`),
  ADD UNIQUE KEY `cedula_23` (`cedula`),
  ADD UNIQUE KEY `correo_21` (`correo`),
  ADD UNIQUE KEY `cedula_24` (`cedula`),
  ADD UNIQUE KEY `correo_22` (`correo`),
  ADD UNIQUE KEY `cedula_25` (`cedula`),
  ADD UNIQUE KEY `correo_23` (`correo`),
  ADD UNIQUE KEY `cedula_26` (`cedula`),
  ADD UNIQUE KEY `correo_24` (`correo`),
  ADD UNIQUE KEY `cedula_27` (`cedula`),
  ADD UNIQUE KEY `correo_25` (`correo`),
  ADD UNIQUE KEY `cedula_28` (`cedula`),
  ADD UNIQUE KEY `correo_26` (`correo`),
  ADD UNIQUE KEY `cedula_29` (`cedula`),
  ADD UNIQUE KEY `correo_27` (`correo`),
  ADD UNIQUE KEY `cedula_30` (`cedula`),
  ADD UNIQUE KEY `correo_28` (`correo`),
  ADD UNIQUE KEY `cedula_31` (`cedula`),
  ADD UNIQUE KEY `correo_29` (`correo`),
  ADD UNIQUE KEY `cedula_32` (`cedula`),
  ADD UNIQUE KEY `correo_30` (`correo`),
  ADD KEY `rol_id` (`rol_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `ADMISIONES`
--
ALTER TABLE `ADMISIONES`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=124;

--
-- AUTO_INCREMENT de la tabla `ATENCION_EMERGENCIA`
--
ALTER TABLE `ATENCION_EMERGENCIA`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ATENCION_PACIENTE_ESTADO`
--
ALTER TABLE `ATENCION_PACIENTE_ESTADO`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT de la tabla `CAT_AUTOIDENTIFICACION_ETNICA`
--
ALTER TABLE `CAT_AUTOIDENTIFICACION_ETNICA`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `CAT_CANTONES`
--
ALTER TABLE `CAT_CANTONES`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=222;

--
-- AUTO_INCREMENT de la tabla `CAT_CIE10`
--
ALTER TABLE `CAT_CIE10`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `CAT_ESTADOS_CIVILES`
--
ALTER TABLE `CAT_ESTADOS_CIVILES`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `CAT_ESTADO_PACIENTE`
--
ALTER TABLE `CAT_ESTADO_PACIENTE`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `CAT_FORMAS_LLEGADA`
--
ALTER TABLE `CAT_FORMAS_LLEGADA`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `CAT_FUENTES_INFORMACION`
--
ALTER TABLE `CAT_FUENTES_INFORMACION`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `CAT_GRADOS_NIVELES_EDUCACION`
--
ALTER TABLE `CAT_GRADOS_NIVELES_EDUCACION`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `CAT_MOTIVO_CONSULTA_SINTOMAS`
--
ALTER TABLE `CAT_MOTIVO_CONSULTA_SINTOMAS`
  MODIFY `Codigo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1516;

--
-- AUTO_INCREMENT de la tabla `CAT_NACIONALIDADES`
--
ALTER TABLE `CAT_NACIONALIDADES`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de la tabla `CAT_NACIONALIDADES_PUEBLOS`
--
ALTER TABLE `CAT_NACIONALIDADES_PUEBLOS`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `CAT_NIVELES_EDUCACION`
--
ALTER TABLE `CAT_NIVELES_EDUCACION`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `CAT_OCUPACIONES_PROFESIONES`
--
ALTER TABLE `CAT_OCUPACIONES_PROFESIONES`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `CAT_PAISES_RESIDENCIA`
--
ALTER TABLE `CAT_PAISES_RESIDENCIA`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `CAT_PARENTESCOS`
--
ALTER TABLE `CAT_PARENTESCOS`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `CAT_PARROQUIAS`
--
ALTER TABLE `CAT_PARROQUIAS`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2048;

--
-- AUTO_INCREMENT de la tabla `CAT_PROCEDIMIENTOS_EMERGENCIA`
--
ALTER TABLE `CAT_PROCEDIMIENTOS_EMERGENCIA`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `CAT_PROVINCIAS`
--
ALTER TABLE `CAT_PROVINCIAS`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `CAT_PUEBLOS_KICHWA`
--
ALTER TABLE `CAT_PUEBLOS_KICHWA`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `CAT_SEGUROS_SALUD`
--
ALTER TABLE `CAT_SEGUROS_SALUD`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `CAT_SEXOS`
--
ALTER TABLE `CAT_SEXOS`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `CAT_TIENE_DISCAPACIDAD`
--
ALTER TABLE `CAT_TIENE_DISCAPACIDAD`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `CAT_TIPOS_BONO`
--
ALTER TABLE `CAT_TIPOS_BONO`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `CAT_TIPOS_DISCAPACIDAD`
--
ALTER TABLE `CAT_TIPOS_DISCAPACIDAD`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `CAT_TIPOS_EMPRESA_TRABAJO`
--
ALTER TABLE `CAT_TIPOS_EMPRESA_TRABAJO`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `CAT_TIPOS_IDENTIFICACION`
--
ALTER TABLE `CAT_TIPOS_IDENTIFICACION`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `CAT_TRIAJE`
--
ALTER TABLE `CAT_TRIAJE`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `CONTACTOS_EMERGENCIA`
--
ALTER TABLE `CONTACTOS_EMERGENCIA`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT de la tabla `CUMPLIMIENTO_PROCEDIMIENTOS`
--
ALTER TABLE `CUMPLIMIENTO_PROCEDIMIENTOS`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `DATOS_ADICIONALES_PACIENTE`
--
ALTER TABLE `DATOS_ADICIONALES_PACIENTE`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT de la tabla `MEDICAMENTOS`
--
ALTER TABLE `MEDICAMENTOS`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ORDENES_EXAMEN`
--
ALTER TABLE `ORDENES_EXAMEN`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ORDENES_IMAGEN`
--
ALTER TABLE `ORDENES_IMAGEN`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `PACIENTES`
--
ALTER TABLE `PACIENTES`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=89;

--
-- AUTO_INCREMENT de la tabla `PARTOS`
--
ALTER TABLE `PARTOS`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `PROCEDIMIENTOS_EMERGENCIA`
--
ALTER TABLE `PROCEDIMIENTOS_EMERGENCIA`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT de la tabla `RECETAS_MEDICAS`
--
ALTER TABLE `RECETAS_MEDICAS`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `REPRESENTANTES`
--
ALTER TABLE `REPRESENTANTES`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `RESIDENCIAS`
--
ALTER TABLE `RESIDENCIAS`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=120;

--
-- AUTO_INCREMENT de la tabla `ROLES`
--
ALTER TABLE `ROLES`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `SIGNOS_VITALES`
--
ALTER TABLE `SIGNOS_VITALES`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT de la tabla `TOKENS_RECUPERACION`
--
ALTER TABLE `TOKENS_RECUPERACION`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `USUARIOS_SISTEMA`
--
ALTER TABLE `USUARIOS_SISTEMA`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `ADMISIONES`
--
ALTER TABLE `ADMISIONES`
  ADD CONSTRAINT `ADMISIONES_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `PACIENTES` (`id`),
  ADD CONSTRAINT `ADMISIONES_ibfk_2` FOREIGN KEY (`triaje_preliminar_id`) REFERENCES `CAT_TRIAJE` (`id`),
  ADD CONSTRAINT `ADMISIONES_ibfk_3` FOREIGN KEY (`triaje_definitivo_id`) REFERENCES `CAT_TRIAJE` (`id`),
  ADD CONSTRAINT `fk_admisiones_estado_paciente` FOREIGN KEY (`estado_paciente_id`) REFERENCES `CAT_ESTADO_PACIENTE` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_admisiones_triaje` FOREIGN KEY (`triaje_id`) REFERENCES `CAT_TRIAJE` (`id`),
  ADD CONSTRAINT `fk_motivo_consulta_sintoma` FOREIGN KEY (`motivo_consulta_sintoma_id`) REFERENCES `CAT_MOTIVO_CONSULTA_SINTOMAS` (`Codigo`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `ATENCION_EMERGENCIA`
--
ALTER TABLE `ATENCION_EMERGENCIA`
  ADD CONSTRAINT `ATENCION_EMERGENCIA_ibfk_1` FOREIGN KEY (`pacienteId`) REFERENCES `PACIENTES` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ATENCION_EMERGENCIA_ibfk_2` FOREIGN KEY (`admisionId`) REFERENCES `ADMISIONES` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ATENCION_EMERGENCIA_ibfk_3` FOREIGN KEY (`usuarioId`) REFERENCES `USUARIOS_SISTEMA` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `ATENCION_PACIENTE_ESTADO`
--
ALTER TABLE `ATENCION_PACIENTE_ESTADO`
  ADD CONSTRAINT `ATENCION_PACIENTE_ESTADO_ibfk_2` FOREIGN KEY (`usuario_responsable_id`) REFERENCES `USUARIOS_SISTEMA` (`id`),
  ADD CONSTRAINT `fk_atencion_paciente_estado_estado` FOREIGN KEY (`estado_id`) REFERENCES `CAT_ESTADO_PACIENTE` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_atencion_paciente_estado_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `USUARIOS_SISTEMA` (`id`),
  ADD CONSTRAINT `fk_rol` FOREIGN KEY (`rol_id`) REFERENCES `ROLES` (`id`);

--
-- Filtros para la tabla `CAT_CANTONES`
--
ALTER TABLE `CAT_CANTONES`
  ADD CONSTRAINT `CAT_CANTONES_ibfk_1` FOREIGN KEY (`provincia_id`) REFERENCES `CAT_PROVINCIAS` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Filtros para la tabla `CAT_MOTIVO_CONSULTA_SINTOMAS`
--
ALTER TABLE `CAT_MOTIVO_CONSULTA_SINTOMAS`
  ADD CONSTRAINT `fk_codigo_triaje` FOREIGN KEY (`Codigo_Triaje`) REFERENCES `CAT_TRIAJE` (`id`);

--
-- Filtros para la tabla `CAT_PARROQUIAS`
--
ALTER TABLE `CAT_PARROQUIAS`
  ADD CONSTRAINT `CAT_PARROQUIAS_ibfk_1` FOREIGN KEY (`canton_id`) REFERENCES `CAT_CANTONES` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Filtros para la tabla `CONTACTOS_EMERGENCIA`
--
ALTER TABLE `CONTACTOS_EMERGENCIA`
  ADD CONSTRAINT `CONTACTOS_EMERGENCIA_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `PACIENTES` (`id`),
  ADD CONSTRAINT `CONTACTOS_EMERGENCIA_ibfk_2` FOREIGN KEY (`parentesco_contacto_id`) REFERENCES `CAT_PARENTESCOS` (`id`);

--
-- Filtros para la tabla `DATOS_ADICIONALES_PACIENTE`
--
ALTER TABLE `DATOS_ADICIONALES_PACIENTE`
  ADD CONSTRAINT `DATOS_ADICIONALES_PACIENTE_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `PACIENTES` (`id`),
  ADD CONSTRAINT `DATOS_ADICIONALES_PACIENTE_ibfk_10` FOREIGN KEY (`tipo_bono_recibe_id`) REFERENCES `CAT_TIPOS_BONO` (`id`),
  ADD CONSTRAINT `DATOS_ADICIONALES_PACIENTE_ibfk_11` FOREIGN KEY (`tiene_discapacidad_id`) REFERENCES `CAT_TIENE_DISCAPACIDAD` (`id`),
  ADD CONSTRAINT `DATOS_ADICIONALES_PACIENTE_ibfk_12` FOREIGN KEY (`tipo_discapacidad_id`) REFERENCES `CAT_TIPOS_DISCAPACIDAD` (`id`),
  ADD CONSTRAINT `DATOS_ADICIONALES_PACIENTE_ibfk_2` FOREIGN KEY (`autoidentificacion_etnica_id`) REFERENCES `CAT_AUTOIDENTIFICACION_ETNICA` (`id`),
  ADD CONSTRAINT `DATOS_ADICIONALES_PACIENTE_ibfk_3` FOREIGN KEY (`nacionalidad_pueblos_id`) REFERENCES `CAT_NACIONALIDADES_PUEBLOS` (`id`),
  ADD CONSTRAINT `DATOS_ADICIONALES_PACIENTE_ibfk_4` FOREIGN KEY (`pueblo_kichwa_id`) REFERENCES `CAT_PUEBLOS_KICHWA` (`id`),
  ADD CONSTRAINT `DATOS_ADICIONALES_PACIENTE_ibfk_5` FOREIGN KEY (`nivel_educacion_id`) REFERENCES `CAT_NIVELES_EDUCACION` (`id`),
  ADD CONSTRAINT `DATOS_ADICIONALES_PACIENTE_ibfk_6` FOREIGN KEY (`grado_nivel_educacion_id`) REFERENCES `CAT_GRADOS_NIVELES_EDUCACION` (`id`),
  ADD CONSTRAINT `DATOS_ADICIONALES_PACIENTE_ibfk_7` FOREIGN KEY (`tipo_empresa_trabajo_id`) REFERENCES `CAT_TIPOS_EMPRESA_TRABAJO` (`id`),
  ADD CONSTRAINT `DATOS_ADICIONALES_PACIENTE_ibfk_8` FOREIGN KEY (`ocupacion_profesion_principal_id`) REFERENCES `CAT_OCUPACIONES_PROFESIONES` (`id`),
  ADD CONSTRAINT `DATOS_ADICIONALES_PACIENTE_ibfk_9` FOREIGN KEY (`seguro_salud_principal_id`) REFERENCES `CAT_SEGUROS_SALUD` (`id`);

--
-- Filtros para la tabla `ORDENES_EXAMEN`
--
ALTER TABLE `ORDENES_EXAMEN`
  ADD CONSTRAINT `ORDENES_EXAMEN_ibfk_1` FOREIGN KEY (`admisionId`) REFERENCES `ADMISIONES` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ORDENES_EXAMEN_ibfk_2` FOREIGN KEY (`usuarioId`) REFERENCES `USUARIOS_SISTEMA` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `ORDENES_IMAGEN`
--
ALTER TABLE `ORDENES_IMAGEN`
  ADD CONSTRAINT `ORDENES_IMAGEN_ibfk_1` FOREIGN KEY (`admisionId`) REFERENCES `ADMISIONES` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ORDENES_IMAGEN_ibfk_2` FOREIGN KEY (`usuarioId`) REFERENCES `USUARIOS_SISTEMA` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `PACIENTES`
--
ALTER TABLE `PACIENTES`
  ADD CONSTRAINT `PACIENTES_ibfk_1` FOREIGN KEY (`tipo_identificacion_id`) REFERENCES `CAT_TIPOS_IDENTIFICACION` (`id`),
  ADD CONSTRAINT `PACIENTES_ibfk_2` FOREIGN KEY (`estado_civil_id`) REFERENCES `CAT_ESTADOS_CIVILES` (`id`),
  ADD CONSTRAINT `PACIENTES_ibfk_3` FOREIGN KEY (`sexo_id`) REFERENCES `CAT_SEXOS` (`id`),
  ADD CONSTRAINT `PACIENTES_ibfk_4` FOREIGN KEY (`nacionalidad_id`) REFERENCES `CAT_NACIONALIDADES` (`id`),
  ADD CONSTRAINT `PACIENTES_ibfk_5` FOREIGN KEY (`provincia_nacimiento_id`) REFERENCES `CAT_PROVINCIAS` (`id`),
  ADD CONSTRAINT `PACIENTES_ibfk_6` FOREIGN KEY (`canton_nacimiento_id`) REFERENCES `CAT_CANTONES` (`id`),
  ADD CONSTRAINT `PACIENTES_ibfk_7` FOREIGN KEY (`parroquia_nacimiento_id`) REFERENCES `CAT_PARROQUIAS` (`id`);

--
-- Filtros para la tabla `PARTOS`
--
ALTER TABLE `PARTOS`
  ADD CONSTRAINT `PARTOS_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `PACIENTES` (`id`);

--
-- Filtros para la tabla `PROCEDIMIENTOS_EMERGENCIA`
--
ALTER TABLE `PROCEDIMIENTOS_EMERGENCIA`
  ADD CONSTRAINT `PROCEDIMIENTOS_EMERGENCIA_ibfk_1` FOREIGN KEY (`pacienteId`) REFERENCES `PACIENTES` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `PROCEDIMIENTOS_EMERGENCIA_ibfk_2` FOREIGN KEY (`admisionId`) REFERENCES `ADMISIONES` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_usuario` FOREIGN KEY (`usuarioId`) REFERENCES `USUARIOS_SISTEMA` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `RECETAS_MEDICAS`
--
ALTER TABLE `RECETAS_MEDICAS`
  ADD CONSTRAINT `RECETAS_MEDICAS_ibfk_1` FOREIGN KEY (`admisionId`) REFERENCES `ADMISIONES` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `RECETAS_MEDICAS_ibfk_2` FOREIGN KEY (`usuarioId`) REFERENCES `USUARIOS_SISTEMA` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `REPRESENTANTES`
--
ALTER TABLE `REPRESENTANTES`
  ADD CONSTRAINT `REPRESENTANTES_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `PACIENTES` (`id`),
  ADD CONSTRAINT `REPRESENTANTES_ibfk_2` FOREIGN KEY (`parentesco_representante_id`) REFERENCES `CAT_PARENTESCOS` (`id`);

--
-- Filtros para la tabla `RESIDENCIAS`
--
ALTER TABLE `RESIDENCIAS`
  ADD CONSTRAINT `RESIDENCIAS_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `PACIENTES` (`id`),
  ADD CONSTRAINT `RESIDENCIAS_ibfk_2` FOREIGN KEY (`provincia_residencia_id`) REFERENCES `CAT_PROVINCIAS` (`id`),
  ADD CONSTRAINT `RESIDENCIAS_ibfk_3` FOREIGN KEY (`canton_residencia_id`) REFERENCES `CAT_CANTONES` (`id`),
  ADD CONSTRAINT `RESIDENCIAS_ibfk_4` FOREIGN KEY (`parroquia_residencia_id`) REFERENCES `CAT_PARROQUIAS` (`id`);

--
-- Filtros para la tabla `SIGNOS_VITALES`
--
ALTER TABLE `SIGNOS_VITALES`
  ADD CONSTRAINT `fk_signos_vitales_usuario` FOREIGN KEY (`usuarioId`) REFERENCES `USUARIOS_SISTEMA` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `TOKENS_RECUPERACION`
--
ALTER TABLE `TOKENS_RECUPERACION`
  ADD CONSTRAINT `TOKENS_RECUPERACION_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `USUARIOS_SISTEMA` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `USUARIOS_SISTEMA`
--
ALTER TABLE `USUARIOS_SISTEMA`
  ADD CONSTRAINT `USUARIOS_SISTEMA_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `ROLES` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
