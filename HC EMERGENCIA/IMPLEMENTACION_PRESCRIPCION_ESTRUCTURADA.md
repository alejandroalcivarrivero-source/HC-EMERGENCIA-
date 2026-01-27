# Implementación de Prescripción Médica Estructurada

## 📋 Resumen

Se ha implementado un componente completo de prescripción médica estructurada para el Plan de Tratamiento del Formulario 008. Este componente permite recetar medicamentos y procedimientos de forma estructurada, con todos los campos requeridos según las normas del MSP Ecuador.

## ✅ Funcionalidades Implementadas

### 1. Componente de Prescripción Estructurada

**Archivo:** `frontend/src/components/PrescripcionMedicaEstructurada.jsx`

#### Características:

- **Tres tipos de prescripciones:**
  - Medicamentos (con todos los campos requeridos)
  - Procedimientos de Laboratorio (con flag para Formulario 010)
  - Procedimientos de Imagenología (con flag para Formulario 012)

- **Campos para Medicamentos:**
  - Nombre Comercial / Vademecum
  - Nombre Genérico
  - Concentración (obligatorio)
  - Forma Farmacéutica (obligatorio)
  - Dosis (obligatorio)
  - Frecuencia (obligatorio)
  - Vía de Administración (obligatorio)
  - Duración (obligatorio) + Unidad (días/semanas/meses)
  - Indicaciones Especiales

- **Campos para Procedimientos:**
  - Tipo de Procedimiento (obligatorio)
  - Nombre del Procedimiento (si es "Otro")
  - Observaciones
  - Flag "Requiere Orden" (para generar Formulario 010/012)

### 2. Integración con Formulario 008

**Archivo:** `frontend/src/components/AtencionEmergenciaForm.jsx`

- El componente reemplaza el sistema anterior de plan de tratamiento
- Se integra en la pestaña "Plan de Tratamiento"
- Mantiene compatibilidad con datos antiguos (normalización automática)

### 3. Validación Pre-Firma

**Archivo:** `backend/services/validacionPreFirmaService.js`

- Nueva función `validarPlanTratamiento()` que verifica:
  - Que exista al menos una prescripción
  - Que cada medicamento tenga todos los campos obligatorios
  - Que cada procedimiento tenga tipo o nombre
- Integrada en `validarPreFirmaFormulario008()`

### 4. Generación de PDF

**Archivo:** `backend/controllers/firmaElectronicaController.js`

- Actualizado para mostrar correctamente:
  - Medicamentos con todos sus campos
  - Procedimientos de laboratorio e imagenología
  - Flags de órdenes requeridas (010/012)
  - Observaciones adicionales

## 📊 Estructura de Datos

### Formato de Prescripción (JSON)

```json
{
  "tipo": "medicamento" | "procedimiento_lab" | "procedimiento_imagen",
  
  // Campos para medicamento
  "nombre": "Paracetamol 500mg",
  "nombreGenerico": "Acetaminofén",
  "concentracion": "500mg",
  "formaFarmaceutica": "Tableta",
  "dosis": "1 tableta",
  "frecuencia": "Cada 8 horas",
  "viaAdministracion": "Oral",
  "duracion": "7",
  "duracionUnidad": "días",
  "indicaciones": "Tomar con alimentos",
  
  // Campos para procedimiento
  "nombreProcedimiento": "Hemograma completo",
  "tipoProcedimiento": "Hemograma completo",
  "observaciones": "En ayunas",
  "requiereOrden": true
}
```

### Almacenamiento

Las prescripciones se almacenan en `ATENCION_EMERGENCIA.planTratamiento` como JSON string:

```sql
planTratamiento TEXT -- JSON string de array de objetos
```

## 🔍 Validaciones Implementadas

### Validación de Medicamentos

| Campo | Requerido | Validación |
|-------|-----------|------------|
| Concentración | ✅ | No puede estar vacío |
| Forma Farmacéutica | ✅ | Debe seleccionarse de la lista |
| Dosis | ✅ | No puede estar vacío |
| Frecuencia | ✅ | Debe seleccionarse de la lista |
| Vía de Administración | ✅ | Debe seleccionarse de la lista |
| Duración | ✅ | Debe ser un número > 0 |

### Validación de Procedimientos

| Campo | Requerido | Validación |
|-------|-----------|------------|
| Tipo de Procedimiento | ✅ | Debe seleccionarse de la lista |
| Nombre del Procedimiento | ⚠️ | Requerido si tipo es "Otro" |

### Validación Pre-Firma

- ✅ Debe existir al menos una prescripción
- ✅ Cada medicamento debe tener todos los campos obligatorios
- ✅ Cada procedimiento debe tener tipo o nombre

## 🎯 Preparación para Formularios 010/012

### Flags de Procedimientos

Cuando se agrega un procedimiento de laboratorio o imagenología, se puede marcar con `requiereOrden: true`. Esto permite:

1. **Identificar procedimientos pendientes:**
   ```javascript
   const procedimientosPendientes = planTratamiento.filter(p => 
     (p.tipo === 'procedimiento_lab' || p.tipo === 'procedimiento_imagen') && 
     p.requiereOrden === true
   );
   ```

2. **Generar órdenes automáticamente:**
   - Procedimientos con `tipo: 'procedimiento_lab'` y `requiereOrden: true` → Formulario 010
   - Procedimientos con `tipo: 'procedimiento_imagen'` y `requiereOrden: true` → Formulario 012

3. **Mostrar en el PDF:**
   - Se indica claramente cuando un procedimiento requiere orden
   - Se muestra el tipo de formulario necesario (010 o 012)

## 📝 Ejemplo de Uso

### Agregar un Medicamento

1. Click en "Agregar Prescripción"
2. Seleccionar tipo "Medicamento"
3. Completar campos obligatorios:
   - Nombre: "Paracetamol 500mg"
   - Concentración: "500mg"
   - Forma Farmacéutica: "Tableta"
   - Dosis: "1 tableta"
   - Frecuencia: "Cada 8 horas"
   - Vía: "Oral"
   - Duración: "7" días
4. Click en "Agregar Prescripción"

### Agregar un Procedimiento de Laboratorio

1. Click en "Agregar Prescripción"
2. Seleccionar tipo "Laboratorio"
3. Seleccionar "Hemograma completo"
4. Marcar "Generar Orden de Laboratorio (Formulario 010)"
5. Agregar observaciones si es necesario
6. Click en "Agregar Prescripción"

## 🔄 Compatibilidad con Datos Antiguos

El componente incluye normalización automática para compatibilidad con el formato anterior:

```javascript
// Formato antiguo
{
  medicamento: "Paracetamol",
  via: "Oral",
  dosis: "500mg",
  posologia: "Cada 8 horas",
  dias: 7
}

// Se convierte automáticamente a:
{
  tipo: "medicamento",
  nombre: "Paracetamol",
  dosis: "500mg",
  frecuencia: "Cada 8 horas",
  viaAdministracion: "Oral",
  duracion: "7",
  duracionUnidad: "días"
}
```

## 📄 Resumen para Formulario 008

El componente genera automáticamente un resumen formateado que se muestra en la sección 11 (Plan de Tratamiento) del Formulario 008:

**Ejemplo:**
```
1. Paracetamol 500mg Tableta - 1 tableta Cada 8 horas - Oral - 7 días
2. LAB: Hemograma completo
3. IMG: Radiografía de tórax
```

## 🚀 Próximos Pasos (Opcional)

- [ ] Integración con catálogo de medicamentos del MSP
- [ ] Búsqueda inteligente de medicamentos por nombre genérico
- [ ] Validación de interacciones medicamentosas
- [ ] Generación automática de órdenes 010/012 desde el flag
- [ ] Impresión de receta en formato estándar MSP
- [ ] Historial de prescripciones del paciente

## 📚 Referencias

- **Norma Técnica MSP Ecuador:** Formulario 008 - Sección 11 (Plan de Tratamiento)
- **Vademecum Nacional:** Catálogo de medicamentos
- **Formulario 010:** Orden de Laboratorio
- **Formulario 012:** Orden de Imagenología

---

**Fecha de implementación:** Enero 2026  
**Versión:** 1.0
