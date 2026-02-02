# Resumen de Estado del Proyecto - Historia Clínica de Emergencia

## 1. Arquitectura Actual

El proyecto opera bajo una arquitectura de tres capas (Frontend, Backend, Base de Datos) con capacidad de comunicación en tiempo real.

| Componente | Descripción |
| :--- | :--- |
| **Backend** | Node.js con Express.js. Servidor API en el puerto 3001. |
| **Frontend** | Entorno de desarrollo basado en Vite. |
| **ORM/DB** | Sequelize como ORM, conectado a MariaDB (o MySQL). |
| **Tiempo Real** | Implementación de Socket.io (Rutas `/socket/*`) para el turnero digital, alertas de triaje y estados de atención, esencial para la operatividad de emergencia. |

**Rutas Principales (Endpoints):**
Las rutas están bien definidas y separadas por módulo, prefijadas con `/api/`.

*   `/api/admisiones` (Registro F001, Triaje preliminar).
*   `/api/atencion-emergencia` (Registro F008, Historia Clínica Médica).
*   `/api/cumplimiento-procedimientos` (Registro de Enfermería y escalamiento de alertas).
*   `/api/signos-vitales` (Registro de Signos Vitales).
*   `/api/diagnosticos`, `/api/recetas-medicas`, `/api/ordenes-examen`, `/api/ordenes-imagen` (Módulos de tratamiento y órdenes médicas).
*   `/api/reportes` (Extracción de información para BI).

## 2. Estado de Formularios 001 y 008 (Estándar MSP)

### Formulario 001 (Filiación)
**Estado:** Cobertura alta.
**Modelos:** `Pacientes`, `DatosAdicionalesPaciente`, `Residencias`, `ContactoEmergencia`, `Representante`.
**Campos Mapeados:** Se cubren extensamente los datos demográficos y socioeconómicos (etnia, discapacidad, seguro, ocupación, educación, residencia, etc.) a través de múltiples tablas de catálogo, lo que indica un mapeo detallado de los campos de filiación requeridos.

**Campos Faltantes (Observación):**
No se identificaron campos de filiación *críticos* faltantes a nivel de estructura, pero la implementación del **Formulario 001 completo** podría requerir una validación de la capa de *presentación* (Frontend) para asegurar que todos los campos del estándar MSP estén siendo capturados y no solo la estructura básica encontrada en los modelos.

### Formulario 008 (Atención de Emergencia)
**Estado:** Mapeo funcional, pero con riesgo de Normalización.
**Modelo:** `AtencionEmergencia`.
**Campos Mapeados:** Todas las secciones principales del F008 (Condición de llegada, Motivo, Accidentes/Violencia/Intoxicación, Antecedentes, Enfermedad Actual, Examen Físico, Embarazo/Parto, Diagnósticos, Plan de Tratamiento, Condición de Egreso) están representadas como columnas en el modelo.

**Campos Faltantes (Riesgo Estructural):**
Las secciones de mayor detalle (Antecedentes, Examen Físico, Diagnósticos, Plan de Tratamiento) se almacenan como `TEXT` (JSON strings) en el modelo [`backend/models/atencionEmergencia.js:92`].
*   **Riesgo:** Esta serialización dificulta la búsqueda, la agregación y el BI sin deserialización a nivel de aplicación.
*   **Mejora:** Los diagnósticos (Presuntivos/Definitivos) deberían estar en una tabla relacional separada (`DetalleDiagnosticos` existe para esto, pero `diagnosticosPresuntivos` y `diagnosticosDefinitivos` en `AtencionEmergencia` sugieren una posible redundancia o uso inconsistente).

## 3. Lógica de Triaje y Enfermería

| Lógica | Detalle | Evaluación |
| :--- | :--- | :--- |
| **Cálculo de Prioridad** | **Triaje Preliminar:** Se realiza un **Escalamiento Automático** simple basado en el `motivo_consulta_sintoma_id`. Si el motivo se asocia con `Codigo_Triaje = 1` (Rojo - Resucitación), se fuerza `prioridad_enfermeria: 1` en la admisión. | **Simple.** Funcional para casos de riesgo vital inicial. Requiere confirmación de la lógica completa de Triaje. |
| **Procedimientos Enfermería** | Se almacenan en la tabla `CUMPLIMIENTO_PROCEDIMIENTOS`. Si se registra con `alerta_medica: 1`, el paciente es escalado a estado `PROCEDIMIENTOS` y se establece `prioridad_enfermeria: 1` (Escalamiento efectivo). | **Robusto.** La implementación incluye validaciones estrictas de tiempo y estado (`<6 horas de antigüedad`, `> Hora Admisión`, `!= Fallecido`). |
| **Validación Signos Vitales** | Existe una validación clínica clave: Si se activa una alerta médica, se exige el registro de Signos Vitales previos, excepto si el triaje definitivo es ROJO (Resucitación). | **Excelente.** Garantiza que el escalamiento de enfermería esté respaldado por datos clínicos recientes. |

## 4. Análisis de Validaciones

| Tipo de Validación | Ubicación y Estado | Observación |
| :--- | :--- | :--- |
| **Campos Obligatorios** | Modelos Sequelize (`allowNull: false`) y Capa de Base de Datos. | **Presente.** Se confía en el ORM/DB para esta validación. |
| **Validación de Cédula** | No visible en el controlador de Admisiones del Backend. | **Brecha.** Se infiere que esta validación se realiza exclusivamente en el Frontend, lo cual es un riesgo de seguridad de la información. Debe implementarse una validación de cédula/identificación a nivel de Backend. |
| **Tipos de Datos** | Modelos Sequelize (`DataTypes.STRING`, `DataTypes.INTEGER`, `DataTypes.DATEONLY`, `DataTypes.ENUM`). | **Presente.** Tipos de datos definidos correctamente. |
| **Validaciones de Negocio** | Controlador de Admisiones (`Escalamiento Automático`), Controlador de Procedimientos (`Reglas de Tiempo y Estado`). | **Robusto.** Excelentes validaciones clínicas de tiempo y flujo. |

## 5. Base de Datos (MariaDB)

| Aspecto | Descripción y Análisis |
| :--- | :--- |
| **Tablas Actuales** | Estructura centrada en `PACIENTES` y `ADMISIONES` como principales claves de negocio. Amplio uso de tablas de catálogo (`CAT_*`) para datos maestros (sexos, etnias, seguros, etc.). Implementación de tablas de seguimiento (`ATENCION_PACIENTE_ESTADO`, `LOG_REASIGNACIONES_MEDICAS`). |
| **Relaciones** | Relaciones bien definidas (ej. 1:N entre `Admision` y `SignosVitales`/`CumplimientoProcedimientos`/`RecetasMedicas`). Uso consistente de `belongsTo`/`hasMany` en [backend/models/init-associations.js:46]. |
| **Redundancia/Normalización** | **Riesgo Identificado (Normalización 1NF/2NF):** El modelo [`backend/models/atencionEmergencia.js:1`](backend/models/atencionEmergencia.js) almacena información estructurada (diagnósticos, antecedentes, plan de tratamiento) como `TEXT`/JSON strings. Esto viola la primera forma normal (1NF) y dificulta la integridad de los datos y las consultas directas en SQL. |

## 6. Capacidad de BI

**Evaluación:** **Buena base de datos, pero el potencial de BI se ve limitado por la serialización de datos clínicos.**

| Métrica de BI | Evaluación de Capacidad |
| :--- | :--- |
| **Tiempos de Espera** | **ALTA Capacidad.** La tabla `ATENCION_PACIENTE_ESTADO` registra de forma secuencial el tiempo de permanencia en cada estado de la atención (ej. `ADMITIDO`, `EN_TRIAGE`, `EN_ATENCION`). Esto permite calcular con precisión el tiempo de espera hasta el triaje, la atención médica y el egreso. |
| **Saturación de Emergencia** | **ALTA Capacidad.** Se puede medir la producción/saturación por estado, usuario o rol (gracias a `usuarioResponsableId` y `rolId` en `AtencionPacienteEstado`). |
| **Reportes Clínicos/Diagnósticos** | **BAJA Capacidad.** La serialización de diagnósticos en `ATENCION_EMERGENCIA` impide crear reportes rápidos y precisos basados en CIE-10 (ej. Tasa de Incidencia de Ciertas Enfermedades) sin una capa de ETL o deserialización compleja en la aplicación. |

## 7. Brecha de Desarrollo

| Área | Faltante para el 100% / Escalamiento | Tarea Clave de Desarrollo |
| :--- | :--- | :--- |
| **Formulario 008 (Fidelidad)** | **Desnormalización de datos clínicos:** Los diagnósticos, plan de tratamiento y antecedentes serializados limitan el BI y la integridad. | **Prioridad 1:** Desnormalizar los campos JSON/TEXT del modelo `AtencionEmergencia` a tablas relacionales (ej. `DetalleDiagnosticos` debe ser la única fuente de diagnósticos). |
| **Validaciones** | **Validación de Cédula/Identificación:** La falta de validación de formato a nivel de Backend es una vulnerabilidad. | **Prioridad 2:** Implementar un middleware o función de validación de cédula y tipos de identificación a nivel de Backend antes de la creación de `Pacientes`. |
| **Escalabilidad (F005, F010, F024)** | **Preparación media.** El sistema tiene un buen esqueleto de admisión (`Admision`) y tratamiento (`RecetaMedica`, `OrdenExamen`), lo cual es una base sólida. | **Planificación:** Los formularios F005 (Interconsulta), F010 (Referencia) y F024 (Epicrisis) requerirán la extensión de los modelos de `Admision` y `AtencionEmergencia` (ej. tabla `Epicrisis` que relacione los diagnósticos y el egreso) pero la arquitectura actual lo soporta. |

## Plan de Acción Recomendado

Basado en la auditoría, la prioridad es mitigar los riesgos de integridad de datos y mejorar la capacidad de BI.

| Prioridad | Tarea |
| :--- | :--- |
| **1 (Crítica)** | Desnormalizar los campos JSON/TEXT de diagnósticos, antecedentes y plan de tratamiento en el modelo `AtencionEmergencia` a nuevas tablas relacionales. |
| **2 (Alta)** | Implementar la validación de formato de Cédula y Tipos de Identificación a nivel del Backend (en el controlador o como un middleware de validación). |
| **3 (Media)** | Revisar y estandarizar el uso de los campos de diagnóstico: asegurar que `DetalleDiagnosticos` sea la única fuente de verdad para los CIE-10. |

Solicito su aprobación para comenzar con la implementación de estos puntos.
