# RESUMEN DE CAMBIOS IMPLEMENTADOS - FASE 3

## Fecha: 2026-01-25
## Estado: ✅ Backend completado | ⚠️ Frontend pendiente

---

## ✅ CAMBIOS IMPLEMENTADOS EN BACKEND

### 1. Nueva Función: Incrementar Intentos de Llamado

**Archivo:** `backend/controllers/admisionesController.js`

**Función agregada:**
- `incrementarIntentosLlamado`: Incrementa el contador de intentos de llamado para una admisión
- Después de 3 intentos, retorna flag `requiereAtencion: true` para que el frontend marque visualmente como "No responde"
- Actualiza `fecha_ultima_actividad` automáticamente

**Endpoint creado:**
- `PUT /api/admisiones/:id/incrementar-llamado`
- Requiere autenticación (`validarToken`)
- Retorna: `{ intentos_llamado, requiereAtencion }`

**Archivo modificado:** `backend/routes/admisiones.js`
- Ruta agregada: `router.put('/:id/incrementar-llamado', validarToken, admisionesController.incrementarIntentosLlamado);`

---

### 2. Validaciones de Procedimientos

**Archivo:** `backend/controllers/cumplimientoProcedimientosController.js`

**Estado:** ✅ Ya implementado correctamente
- ✅ Validación de que hora de procedimiento no sea menor a `fecha_hora_admision`
- ✅ Validación de que hora de procedimiento no sea mayor a hora actual
- ✅ Cambio automático de estado a PROCEDIMIENTOS (ID: 3) cuando se marca "Sugerir revisión médica"
- ✅ Actualización de `prioridad_enfermeria` y `observacion_escalamiento`
- ✅ Creación de registro en `ATENCION_PACIENTE_ESTADO`

---

### 3. Cambio de Estado a SIGNOS_VITALES

**Archivo:** `backend/controllers/signosVitalesController.js`

**Estado:** ✅ Ya implementado correctamente
- ✅ Al finalizar signos vitales, cambia estado a SIGNOS_VITALES (ID: 2)
- ✅ Actualiza `estado_paciente_id` en la admisión
- ✅ Crea/actualiza registro en `ATENCION_PACIENTE_ESTADO`

---

### 4. Cierre Automático por Inactividad

**Archivo:** `backend/tasks/checkPatientStatus.js`

**Estado:** ✅ Ya implementado correctamente
- ✅ Cierre automático a ALTA_VOLUNTARIA después de 24 horas de inactividad
- ✅ Actualiza `observacion_cierre` con "Cierre automático por inactividad"
- ✅ Actualiza `fecha_hora_retiro`
- ✅ Maneja diferentes estados: ADMITIDO, PROCEDIMIENTOS, SIGNOS_VITALES, EN_ATENCION

**Nota:** El marcado visual de "Inactivo" (> 4 horas pero < 24 horas) se manejará en el frontend, no requiere cambios en la tarea cron.

---

### 5. Modelo de Admisiones

**Archivo:** `backend/models/admisiones.js`

**Estado:** ✅ Columnas ya definidas en el modelo Sequelize
- ✅ `intentos_llamado` (INT, default 0)
- ✅ `observacion_cierre` (TEXT, nullable)

**Nota:** Verificar que las columnas existan en la BD física ejecutando el script SQL.

---

## ⚠️ CAMBIOS PENDIENTES EN FRONTEND

### 1. Agregar Botón "Registrar Llamado"

**Archivos a modificar:**
- `frontend/src/pages/ListaPacientes.jsx` o `frontend/src/pages/ListaEspera.jsx`

**Implementación requerida:**
```jsx
// Función para incrementar intentos de llamado
const handleIncrementarLlamado = async (admisionId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `http://localhost:3001/api/admisiones/${admisionId}/incrementar-llamado`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Actualizar estado local de la lista
    // Mostrar mensaje de éxito
    alert(`Intentos de llamado: ${response.data.intentos_llamado}`);
    
    if (response.data.requiereAtencion) {
      alert('⚠️ Paciente marcado como "No responde" (3+ intentos)');
    }
  } catch (error) {
    console.error('Error al incrementar intentos de llamado:', error);
    alert('Error al registrar el llamado');
  }
};

// En la tabla, agregar botón:
<button 
  onClick={() => handleIncrementarLlamado(admision.id)}
  className="btn btn-sm btn-outline-primary"
  title="Registrar intento de llamado"
>
  📞 Llamar
</button>
```

---

### 2. Mostrar Indicador "No Responde"

**Archivos a modificar:**
- `frontend/src/pages/ListaPacientes.jsx` o `frontend/src/pages/ListaEspera.jsx`

**Implementación requerida:**
```jsx
// En la fila de cada paciente:
{admision.intentos_llamado >= 3 && (
  <span className="badge bg-danger ms-2">
    ⚠️ No responde ({admision.intentos_llamado} intentos)
  </span>
)}

// Resaltar la fila con fondo amarillo/naranja si tiene 3+ intentos
<tr className={admision.intentos_llamado >= 3 ? 'table-warning' : ''}>
  {/* Contenido de la fila */}
</tr>
```

---

### 3. Mostrar Indicador "Inactivo"

**Archivos a modificar:**
- `frontend/src/pages/ListaPacientes.jsx` o `frontend/src/pages/ListaEspera.jsx`

**Implementación requerida:**
```jsx
// Función para calcular estado de inactividad
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

// En la fila de cada paciente:
const estadoInactividad = calcularEstadoInactividad(admision.fecha_ultima_actividad);

{estadoInactividad.esInactivo && (
  <span className="badge bg-secondary ms-2">
    ⏸️ Inactivo
  </span>
)}

// Resaltar la fila con fondo gris claro si está inactivo
<tr className={estadoInactividad.esInactivo ? 'table-secondary' : ''}>
  {/* Contenido de la fila */}
</tr>
```

---

### 4. Incluir Campos en Consultas de Admisiones

**Archivos a modificar:**
- `frontend/src/pages/ListaPacientes.jsx` o `frontend/src/pages/ListaEspera.jsx`

**Verificar que las consultas incluyan:**
- `intentos_llamado`
- `fecha_ultima_actividad` (o `fecha_actualizacion` según el nombre en BD)

**Ejemplo:**
```javascript
// En la consulta de admisiones, asegurarse de incluir estos campos
const response = await axios.get('/api/admisiones', {
  params: { /* filtros */ }
});

// Los datos deberían incluir:
// - admision.intentos_llamado
// - admision.fecha_ultima_actividad (o fecha_actualizacion)
```

---

## 📋 SCRIPT SQL PARA BASE DE DATOS

**Archivo:** `scripts/fase3_mejoras_estados.sql`

**Estado:** ✅ Ya existe

**Acción requerida:** Ejecutar el script si las columnas no existen en la BD física.

```sql
-- Verificar estructura actual
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'ADMISIONES'
  AND COLUMN_NAME IN ('intentos_llamado', 'observacion_cierre');

-- Si no existen, ejecutar:
ALTER TABLE ADMISIONES 
ADD COLUMN IF NOT EXISTS intentos_llamado INT DEFAULT 0 
COMMENT 'Número de intentos de llamado al paciente' 
AFTER fecha_actualizacion;

ALTER TABLE ADMISIONES 
ADD COLUMN IF NOT EXISTS observacion_cierre TEXT NULL 
COMMENT 'Observación al cerrar la admisión (alta voluntaria, inactividad, etc.)' 
AFTER intentos_llamado;
```

---

## 🔄 FLUJO DE ESTADOS IMPLEMENTADO

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

---

## ✅ VALIDACIONES IMPLEMENTADAS

1. ✅ Hora de procedimiento no puede ser menor a `fecha_hora_admision`
2. ✅ Hora de procedimiento no puede ser mayor a hora actual
3. ✅ Cambio automático de estado a PROCEDIMIENTOS cuando se marca "Sugerir revisión médica"
4. ✅ Cambio automático de estado a SIGNOS_VITALES al finalizar signos vitales
5. ✅ Cierre automático a ALTA_VOLUNTARIA después de 24 horas de inactividad
6. ✅ Incremento de intentos de llamado con límite de 3 para marcado visual

---

## 📝 NOTAS IMPORTANTES

1. **Campo `fecha_ultima_actividad`:** En el modelo Sequelize está mapeado como `fecha_actualizacion` en la BD. Verificar el nombre correcto en las consultas del frontend.

2. **Formulario de Admisión:** No se encontró un checkbox de "Requiere valoración médica inmediata" en el formulario de admisión. Si existe, cambiar la etiqueta a "Sugerir revisión médica".

3. **Formulario de Procedimientos:** Ya tiene el checkbox "Sugerir revisión médica" implementado correctamente.

4. **Tarea Cron:** Se ejecuta cada 5 minutos. Verificar que esté activa en el servidor.

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Ejecutar script SQL si las columnas no existen en BD
2. ⚠️ Implementar cambios en frontend (botón de llamado, indicadores visuales)
3. ⚠️ Probar flujo completo de estados
4. ⚠️ Documentar cambios finales

---

## 📊 RESUMEN DE ARCHIVOS MODIFICADOS

### Backend:
- ✅ `backend/controllers/admisionesController.js` - Nueva función `incrementarIntentosLlamado`
- ✅ `backend/routes/admisiones.js` - Nueva ruta para incrementar intentos

### Frontend:
- ⚠️ `frontend/src/pages/ListaPacientes.jsx` - Pendiente: agregar botón y indicadores
- ⚠️ `frontend/src/pages/ListaEspera.jsx` - Pendiente: agregar botón y indicadores

### Base de Datos:
- ✅ `scripts/fase3_mejoras_estados.sql` - Script listo para ejecutar

---

**Estado General:** Backend completado al 100%. Frontend requiere implementación de indicadores visuales y botón de llamado.
