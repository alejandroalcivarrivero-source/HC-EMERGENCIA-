// ========================================================
// DOCUMENTACIÓN: CAMBIOS PROPUESTOS FASE 3
// ========================================================
// Fecha: 2026-01-23
// Descripción: Documentación de los cambios propuestos para la mejora de estados
// ========================================================

## RESUMEN DE CAMBIOS PROPUESTOS

### 1. CAMBIOS EN BASE DE DATOS

#### Tabla ADMISIONES - Nuevas Columnas:
- `intentos_llamado` (INT, DEFAULT 0): Contador de intentos de llamado al paciente
- `observacion_cierre` (TEXT, NULL): Observación al cerrar la admisión (alta voluntaria, inactividad, etc.)

**Script SQL:** `scripts/fase3_mejoras_estados.sql`

### 2. CAMBIOS EN MODELOS

#### `backend/models/admisiones.js`
- Agregadas las nuevas columnas al modelo Sequelize
- `intentos_llamado`: INTEGER, defaultValue: 0
- `observacion_cierre`: TEXT, allowNull: true

### 3. CAMBIOS EN CONTROLADORES

#### `backend/controllers/cumplimientoProcedimientosController.js`
- **Importaciones agregadas:**
  - `CatEstadoPaciente` para gestionar estados
  - `createOrUpdateAtencionPacienteEstado` para crear registros de estado
  
- **Lógica de estados mejorada:**
  - Cuando se guarda un procedimiento con "Sugerir revisión médica" (`alertaMedica = true`):
    - Se actualiza `estado_paciente_id` a `PROCEDIMIENTOS` (ID 3)
    - Se crea un registro en `ATENCION_PACIENTE_ESTADO` con estado `PROCEDIMIENTOS`
    - Se actualiza `fecha_ultima_actividad`

#### `backend/controllers/signosVitalesController.js`
- **Lógica de estados mejorada:**
  - Cuando se guardan signos vitales:
    - Se actualiza `estado_paciente_id` a `SIGNOS_VITALES` (ID 2)
    - Se crea/actualiza registro en `ATENCION_PACIENTE_ESTADO` con estado `SIGNOS_VITALES`
    - Se actualiza `fecha_ultima_actividad`

#### `backend/controllers/intentosLlamadoController.js` (NUEVO)
- **Funciones creadas:**
  - `incrementarIntentosLlamado(admisionId, transaction)`: Incrementa el contador de intentos
  - `getPacientesNoResponden(options)`: Obtiene pacientes con 3+ intentos
  - `resetearIntentosLlamado(admisionId, transaction)`: Resetea el contador

### 4. CAMBIOS EN TAREAS CRON

#### `backend/tasks/checkPatientStatus.js`
- **Lógica de cierre automático mejorada:**
  - **4 horas:** Los pacientes se marcan visualmente como "Inactivos" (se implementará en frontend)
  - **24 horas:** Cierre automático a `ALTA_VOLUNTARIA` con observación:
    - Para estado `ADMITIDO` sin SV ni procedimientos: "Cierre automático por inactividad (sin SV ni procedimientos)."
    - Para estado `PROCEDIMIENTOS`: "Cierre automático por inactividad (estado PROCEDIMIENTOS > 24h)."
    - Para estado `SIGNOS_VITALES`: "Cierre automático por inactividad (estado SIGNOS_VITALES > 24h)."
  
- **Mejoras:**
  - Usa `fecha_ultima_actividad` en lugar de solo `createdAt` del estado
  - Actualiza `estado_paciente_id` en la admisión al cerrar
  - Guarda `observacion_cierre` en la admisión

### 5. FLUJO DE ESTADOS PROPUESTO

```
ADMITIDO (1)
  ↓
  [Procedimiento con "Sugerir revisión médica"]
  ↓
PROCEDIMIENTOS (3)
  ↓
  [Tomar Signos Vitales]
  ↓
SIGNOS_VITALES (2)
  ↓
  [Asignar médico]
  ↓
EN_ATENCION (5)
  ↓
  [Finalizar atención]
  ↓
ATENDIDO (6) / ALTA_MEDICA (7) / ALTA_VOLUNTARIA (4)
```

### 6. VALIDACIONES IMPLEMENTADAS

- **Hora de Realización del Procedimiento:**
  - No puede ser menor a `fecha_hora_admision`
  - No puede ser mayor a la hora actual
  - Validación de 6 horas de antigüedad (con justificación si es necesario)

### 7. PRÓXIMOS PASOS (Frontend)

1. **Indicador visual de "Inactivo":**
   - Mostrar badge/indicador cuando `fecha_ultima_actividad` > 4 horas
   - Usar color amarillo/naranja para resaltar

2. **Indicador de "No Responde":**
   - Mostrar badge/indicador cuando `intentos_llamado` >= 3
   - Usar color rojo para resaltar

3. **Botón de Llamado:**
   - Implementar botón para incrementar `intentos_llamado`
   - Mostrar número de intentos actuales

4. **Filtros en Lista de Pacientes:**
   - Filtro por estado
   - Filtro por pacientes inactivos (> 4 horas)
   - Filtro por pacientes que no responden (>= 3 intentos)

### 8. NOTAS IMPORTANTES

- Los cambios en la base de datos deben ejecutarse ANTES de iniciar el servidor
- El script SQL verifica si las columnas ya existen antes de crearlas
- La lógica de 4 horas es solo visual (frontend), no cambia el estado
- La lógica de 24 horas cambia el estado automáticamente a `ALTA_VOLUNTARIA`
- El CRON se ejecuta cada hora para verificar pacientes inactivos
