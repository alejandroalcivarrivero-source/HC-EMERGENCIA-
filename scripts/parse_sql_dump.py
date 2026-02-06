import re
import json

def parse_sql_dump(sql_content):
    tables_data = {}
    current_table = None
    
    # Regex para encontrar CREATE TABLE statements
    create_table_regex = re.compile(r"CREATE TABLE `(.*?)` \((\n.*?)\) ENGINE=InnoDB")
    
    # Regex para encontrar INSERT INTO statements
    insert_into_regex = re.compile(r"INSERT INTO `(.*?)` \(`(.*?)`\) VALUES\\n(.*?)(?=\\n-- \-|ALTER TABLE|COMMIT)", re.DOTALL)

    lines = sql_content.splitlines()
    
    for i, line in enumerate(lines):
        # Buscar CREATE TABLE
        create_match = create_table_regex.search(line)
        if create_match:
            table_name = create_match.group(1)
            # Extract columns (simplified, just getting names for now)
            # This part can be enhanced to parse column types, etc. if needed
            columns_str = create_match.group(2)
            column_names = re.findall(r"`([^`]+)`", columns_str)
            tables_data[table_name] = {"columns": column_names, "rows": []}
            current_table = table_name
            continue

        # Buscar INSERT INTO
        insert_match = insert_into_regex.search(line)
        if insert_match:
            table_name = insert_match.group(1)
            columns_str = insert_match.group(2)
            values_str = insert_match.group(3)

            insert_columns = [col.strip().strip('`') for col in columns_str.split(',')]
            
            # Dividir los valores por bloques de registros
            values_blocks = re.findall(r"\((.*?)\)(?:,\\n|;)", values_str)
            
            rows = []
            for block in values_blocks:
                # Dividir los valores individuales, teniendo en cuenta comas dentro de strings
                # Esto es una simplificación y puede fallar con strings complejos o escapes
                raw_values = re.findall(r"'[^']*'|[^,]+ ", block)
                parsed_values = []
                for val in raw_values:
                    val = val.strip()
                    if val.startswith("'") and val.endswith("'"):
                        parsed_values.append(val.strip("'"))
                    elif val.isdigit():
                        parsed_values.append(int(val))
                    elif val == "NULL":
                        parsed_values.append(None)
                    else:
                        try:
                            parsed_values.append(float(val))
                        except ValueError:
                            parsed_values.append(val)

                row_dict = dict(zip(insert_columns, parsed_values))
                rows.append(row_dict)
            
            if table_name in tables_data:
                tables_data[table_name]["rows"].extend(rows)
            else:
                # Fallback if CREATE TABLE wasn't found (less likely with sequential parsing)
                tables_data[table_name] = {"columns": insert_columns, "rows": rows}

            current_table = None # Reset after processing INSERT
            
    return tables_data

# Main execution
if __name__ == "__main__":
    # Replace this with the actual content of your SQL dump file
    sql_dump_content = """
-- phpMyAdmin SQL Dump
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
(2, 'Afroecuatoriano/Afrodescendiente', 1, '2025-06-23 23:28:46', '2025-06-23 23:28:46');

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
(2, 'GIRÓN', 1, '2025-06-23 23:28:44', '2025-06-23 23:28:44');

-- Estructura de tabla para la tabla `CAT_CIE10`
--
CREATE TABLE `CAT_CIE10` (
  `id` int(11) NOT NULL,
  `codigo` varchar(10) NOT NULL,
  `descripcion` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
--
-- Volcado de datos para la tabla `CAT_CIE10`
--
INSERT INTO `CAT_CIE10` (`id`, `codigo`, `descripcion`) VALUES
(1, 'A000', 'COLERA DEBIDO A VIBRIO CHOLERAE 01, BIOTIPO CHOLERAE'),
(2, 'A001', 'COLERA DEBIDO A VIBRIO CHOLERAE 01, BIOTIPO EL TOR');

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
(2, 'BOLIVAR', '2025-06-23 23:28:44', '2025-06-23 23:28:44');

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
--
-- Volcado de datos para la tabla `MEDICAMENTOS`
--
INSERT INTO `MEDICAMENTOS` (`id`, `nombre`, `cantidad`, `unidad_medida`, `fecha_caducidad`, `lote`, `proveedor`, `descripcion`, `createdAt`, `updatedAt`) VALUES
(1, 'Paracetamol 500mg', 1000, 'pastillas', '2026-12-31', 'LOTE001', 'Proveedor A', 'Analgésico y antipirético', '2025-01-01 00:00:00', '2025-01-01 00:00:00'),
(2, 'Ibuprofeno 400mg', 500, 'pastillas', '2027-06-30', 'LOTE002', 'Proveedor B', 'Antiinflamatorio no esteroideo', '2025-01-01 00:00:00', '2025-01-01 00:00:00');

    """
    
    # En el entorno real, cargarías el contenido del archivo:
    # with open("backups/EMERGENCIA_RESPALDO.sql", "r", encoding="utf8") as f:
    #     sql_dump_content = f.read()

    parsed_data = parse_sql_dump(sql_dump_content)
    # print(json.dumps(parsed_data, indent=2))
    # Guardar en un archivo JSON para inspección
    with open("scripts/parsed_sql_data.json", "w", encoding="utf8") as f:
        json.dump(parsed_data, f, indent=2, ensure_ascii=False)
    
    print("Datos SQL parseados y guardados en scripts/parsed_sql_data.json")

