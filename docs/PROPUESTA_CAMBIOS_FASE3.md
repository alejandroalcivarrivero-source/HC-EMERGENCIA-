# PROPUESTA DE CAMBIOS - FASE 3: LÓGICA DE ESTADOS ROBUSTA

## Fecha: 2026-01-25
## Objetivo: Implementar lógica de estados robusta para el Sistema de Emergencias

---

## 1. CAMBIOS EN BASE DE DATOS

### 1.1 Columnas a Agregar en ADMISIONES

Las columnas `intentos_llamado` y `observacion_cierre` ya están definidas en el modelo Sequelize (`backend/models/admisiones.js`), pero necesitamos verificar que existan en la base de datos física.

**Script SQL:** `scripts/fase3_mejoras_estados.sql` (ya existe)

```sql
-- Agregar columna intentos_llamado
ALTER TABLE ADMISIONES 
ADD COLUMN IF NOT EXISTS intentos_llamado INT DEFAULT 0 
COMMENT 'Número de intentos de llamado al paciente' 
AFTER fecha_actualizacion;

-- Agregar columna observacion_cierre
ALTER TABLE ADMISIONES 
ADD COLUMN IF NOT EXISTS observacion_cierre TEXT NULL 
COMMENT 'Observación al cerrar la admisión (alta voluntaria, inactividad, etc.)' 
AFTER intentos_llamado;
```

**Estado:** ✅ Ya implementado en el modelo Sequelize. Solo falta ejecutar el script SQL si las columnas no existen en la BD física.

---

## 2. CAMBIOS EN CONTROLADORES (BACKEND)

### 2.1 Nuevo Endpoint: Incrementar Intentos de Llamado

**Archivo:** `backend/controllers/admisionesController.js`

**Nueva función:**
```javascript
const incrementarIntentosLlamado = async (req, res) => {
  try {
    const { id } = req.params; // ID de la admisión
    
    const admision = await Admision.findByPk(id);
    if (!admision) {
      return res.status(404).json({ message: 'Admisión no encontrada.' });
    }
    
    // Incrementar intentos_llamado
    const nuevosIntentos = (admision.intentos_llamado || 0) + 1;
    await admision.update({ 
      intentos_llamado: nuevosIntentos,
      fecha_ultima_actividad: new Date()
    });
    
    // Si alcanza 3 intentos, marcar visualmente (el frontend lo manejará)
    const requiereAtencion = nuevosIntentos >= 3;
    
    res.status(200).json({
      message: `Intentos de llamado actualizados: ${nuevosIntentos}`,
      intentos_llamado: nuevosIntentos,
      requiereAtencion: requiereAtencion // Flag para el frontend
    });
  } catch (error) {
    console.error('Error al incrementar intentos de llamado:', error);
    res.status(500).json({ message: 'Error al incrementar intentos de llamado.' });
  }
};
```

**Ruta a agregar:** `backend/routes/admisiones.js`
```javascript
router.put('/:id/incrementar-llamado', validarToken, admisionesController.incrementarIntentosLlamado);
```

---

### 2.2 Modificar Controlador de Procedimientos

**Archivo:** `backend/controllers/cumplimientoProcedimientosController.js`

**Cambios en `createCumplimientoProcedimiento`:**

1. **Validación de hora de realización:**
   - Ya existe validación de que no sea menor a `fecha_hora_admision` ✅
   - Ya existe validación de que no sea mayor a hora actual ✅

2. **Cambio de estado a PROCEDIMIENTOS:**
   - Ya existe lógica para cambiar estado cuando `alertaMedica = true` ✅
   - Ya actualiza `estado_paciente_id` a 3 (PROCEDIMIENTOS) ✅
   - Ya crea registro en `ATENCION_PACIENTE_ESTADO` ✅

3. **Redirección a Signos Vitales:**
   - Ya existe lógica para redirigir cuando se requiere signos vitales ✅
   - Al finalizar signos vitales, el estado cambia a SIGNOS_VITALES (ID: 2) ✅

**Estado:** ✅ La lógica ya está implementada correctamente.

---

### 2.3 Modificar Controlador de Signos Vitales

**Archivo:** `backend/controllers/signosVitalesController.js`

**Cambios en `saveSignosVitalesAndTriaje`:**

1. **Cambio de estado a SIGNOS_VITALES:**
   - Ya existe lógica para cambiar estado a SIGNOS_VITALES (ID: 2) ✅
   - Ya actualiza `estado_paciente_id` en la admisión ✅
   - Ya crea/actualiza registro en `ATENCION_PACIENTE_ESTADO` ✅

**Estado:** ✅ La lógica ya está implementada correctamente.

---

### 2.4 Mejorar Tarea Cron de Verificación de Estados

**Archivo:** `backend/tasks/checkPatientStatus.js`

**Cambios propuestos:**

1. **Marcar como Inactivo (> 4 horas sin actividad):**
   ```javascript
   // Agregar después de la línea 133
   const horas4 = 4 * 60 * 60 * 1000;
   const esInactivo = tiempoDesdeUltimaActividad >= horas4 && tiempoDesdeUltimaActividad < horas24;
   
   // Esto se manejará visualmente en el frontend
   // No requiere cambio de estado, solo marcado visual
   ```

2. **Cierre Automático (> 24 horas de inactividad):**
   - Ya existe lógica para cerrar automáticamente a ALTA_VOLUNTARIA ✅
   - Ya actualiza `observacion_cierre` con 'Cierre automático por inactividad' ✅
   - Ya actualiza `fecha_hora_retiro` ✅

**Mejora propuesta:** Agregar lógica para marcar visualmente como "Inactivo" cuando pasan > 4 horas pero < 24 horas.

---

## 3. CAMBIOS EN FRONTEND

### 3.1 Modificar Formulario de Admisión

**Archivo:** `frontend/src/components/AdmisionForm.jsx`

**Cambio requerido:**
- Cambiar etiqueta del checkbox de "Requiere valoración médica inmediata" a "Sugerir revisión médica"
- Buscar el campo `prioridad_enfermeria` y cambiar su etiqueta

**Búsqueda:** Buscar `prioridad_enfermeria` o `Requiere valoración médica`

---

### 3.2 Modificar Formulario de Procedimientos

**Archivo:** `frontend/src/components/ProcedimientoEmergenciaForm.jsx`

**Estado actual:**
- ✅ Ya tiene el checkbox "Sugerir revisión médica" (línea 519)
- ✅ Ya maneja la redirección a signos vitales
- ✅ Ya guarda el procedimiento independientemente

**No requiere cambios adicionales.**

---

### 3.3 Agregar Función de Llamado en Lista de Pacientes

**Archivo:** `frontend/src/pages/ListaPacientes.jsx` o `frontend/src/pages/ListaEspera.jsx`

**Cambios propuestos:**

1. **Agregar botón "Registrar Llamado"** en cada fila de paciente
2. **Mostrar indicador visual** cuando `intentos_llamado >= 3`:
   - Badge rojo con texto "No responde"
   - Resaltar la fila con fondo amarillo/naranja

3. **Mostrar indicador de "Inactivo"** cuando pasan > 4 horas sin actividad:
   - Badge gris con texto "Inactivo"
   - Resaltar la fila con fondo gris claro

**Ejemplo de código:**
```jsx
// En la lista de pacientes
{admision.intentos_llamado >= 3 && (
  <span className="badge bg-danger">No responde</span>
)}

// Función para incrementar intentos
const handleIncrementarLlamado = async (admisionId) => {
  try {
    const response = await axios.put(
      `/api/admisiones/${admisionId}/incrementar-llamado`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Actualizar estado local
    // Mostrar mensaje de éxito
  } catch (error) {
    // Manejar error
  }
};
```

---

### 3.4 Mostrar Estado de Inactividad en Lista

**Archivo:** `frontend/src/pages/ListaPacientes.jsx` o `frontend/src/pages/ListaEspera.jsx`

**Lógica propuesta:**

```javascript
// Función para calcular si está inactivo
const calcularEstadoInactividad = (fechaUltimaActividad) => {
  if (!fechaUltimaActividad) return { esInactivo: false, esCierreAutomatico: false };
  
  const ahora = new Date();
  const ultimaActividad = new Date(fechaUltimaActividad);
  const horasSinActividad = (ahora - ultimaActividad) / (1000 * 60 * 60);
  
  return {
    esInactivo: horasSinActividad > 4 && horasSinActividad < 24,
    esCierreAutomatico: horasSinActividad >= 24
  };
};

// En el renderizado
const estadoInactividad = calcularEstadoInactividad(admision.fecha_ultima_actividad);
{estadoInactividad.esInactivo && (
  <span className="badge bg-secondary">Inactivo</span>
)}
```

---

## 4. FLUJO DE ESTADOS PROPUESTO

### 4.1 Flujo Normal

```
ADMITIDO (ID: 1)
  ↓
  [Opcional: PROCEDIMIENTOS (ID: 3) - si se marca "Sugerir revisión médica"]
  ↓
SIGNOS_VITALES (ID: 2)
  ↓
ESPERA_ATENCION (si aplica)
  ↓
EN_ATENCION (ID: 5)
  ↓
ATENDIDO (ID: 6) / ALTA_MEDICA (ID: 7) / ALTA_VOLUNTARIA (ID: 4)
```

### 4.2 Flujo con Procedimientos

1. Usuario registra procedimiento
2. Si marca "Sugerir revisión médica":
   - Se guarda el procedimiento en `CUMPLIMIENTO_PROCEDIMIENTOS`
   - Se actualiza `estado_paciente_id` a 3 (PROCEDIMIENTOS)
   - Se crea registro en `ATENCION_PACIENTE_ESTADO` con estado PROCEDIMIENTOS
   - Se actualiza `prioridad_enfermeria` a 1
   - Se guarda `observacion_escalamiento`
3. Si el usuario elige "Tomar Signos Vitales":
   - Redirige al módulo de signos vitales
   - Al finalizar, cambia estado a SIGNOS_VITALES (ID: 2)
   - Se actualiza `estado_paciente_id` a 2

---

## 5. GESTIÓN DE PACIENTES AUSENTES E INACTIVOS

### 5.1 Intentos de Llamado

- **Función:** `incrementarIntentosLlamado` (nueva)
- **Límite:** 3 intentos
- **Acción:** Marcar visualmente como "No responde" en la lista
- **Endpoint:** `PUT /api/admisiones/:id/incrementar-llamado`

### 5.2 Cierre Automático por Inactividad

- **> 4 horas sin actividad:** Marcar visualmente como "Inactivo" (no cambia estado)
- **> 24 horas sin actividad:** Cambiar automáticamente a ALTA_VOLUNTARIA (ID: 4)
- **Observación:** "Cierre automático por inactividad"
- **Tarea Cron:** Ya implementada en `checkPatientStatus.js` ✅

---

## 6. VALIDACIONES

### 6.1 Validación de Hora de Procedimiento

- ✅ No puede ser menor a `fecha_hora_admision`
- ✅ No puede ser mayor a la hora actual
- ✅ Ya implementada en `cumplimientoProcedimientosController.js`

---

## 7. RESUMEN DE CAMBIOS REQUERIDOS

### Backend:
1. ✅ Agregar función `incrementarIntentosLlamado` en `admisionesController.js`
2. ✅ Agregar ruta para incrementar intentos de llamado
3. ✅ Mejorar tarea cron para marcar visualmente como "Inactivo" (> 4h)
4. ✅ Verificar que las columnas existan en BD (ejecutar script SQL si es necesario)

### Frontend:
1. ⚠️ Cambiar etiqueta en formulario de admisión (si existe)
2. ✅ Agregar botón "Registrar Llamado" en lista de pacientes
3. ✅ Mostrar indicador "No responde" cuando `intentos_llamado >= 3`
4. ✅ Mostrar indicador "Inactivo" cuando pasan > 4 horas sin actividad
5. ✅ Resaltar visualmente pacientes con problemas

### Base de Datos:
1. ✅ Ejecutar script `fase3_mejoras_estados.sql` si las columnas no existen

---

## 8. PRÓXIMOS PASOS

1. Revisar esta propuesta
2. Aprobar cambios
3. Implementar cambios pendientes
4. Probar flujo completo
5. Documentar cambios finales

---

**Nota:** Muchos de los cambios ya están implementados. Solo faltan:
- Función de incrementar intentos de llamado
- Cambios visuales en el frontend
- Mejora en la tarea cron para marcar como "Inactivo"
