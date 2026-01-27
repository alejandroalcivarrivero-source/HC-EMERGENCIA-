# Implementación de Validación Pre-Firma con FormValidator

## 📋 Resumen

Se ha implementado la integración del sistema de validación con el proceso de firma del Formulario 008. Ahora el médico **NO puede firmar** si los bloques obligatorios de **Anamnesis** y **Diagnóstico CIE-10** están incompletos según las reglas definidas en la norma técnica del MSP.

## ✅ Cambios Implementados

### 1. Servicio de Validación Pre-Firma (`backend/services/validacionPreFirmaService.js`)

**Nuevo archivo creado** que centraliza toda la lógica de validación pre-firma:

- **`validarAnamnesis(atencion)`**: Valida que el campo `enfermedadProblemaActual`:
  - Exista (no sea null/undefined)
  - Tenga al menos 10 caracteres (mínimo según norma MSP)
  - Se recomienda 20 caracteres para mayor detalle

- **`validarDiagnosticos(atencionId)`**: Valida que:
  - Exista al menos un diagnóstico CIE-10
  - Exista al menos un diagnóstico DEFINITIVO (excepto códigos Z)
  - Todos los diagnósticos tengan código válido

- **`validarPreFirmaFormulario008(atencionId)`**: Función principal que:
  - Obtiene la atención completa
  - Valida ambos bloques (Anamnesis y Diagnósticos)
  - Retorna un objeto detallado con errores y estado de cada bloque

### 2. Actualización del Controlador de Diagnósticos

**Archivo:** `backend/controllers/diagnosticosController.js`

- El endpoint `GET /api/diagnosticos/validar-firma/:atencionId` ahora usa el servicio de validación pre-firma
- Retorna información detallada sobre:
  - Si puede firmar o no
  - Errores críticos y advertencias
  - Detalles del estado de cada bloque (Anamnesis y Diagnósticos)

### 3. Actualización del Controlador de Firma Electrónica

**Archivo:** `backend/controllers/firmaElectronicaController.js`

- La función `validarPuedeFirmar()` ahora usa el servicio de validación pre-firma
- El endpoint de firma valida ambos bloques antes de permitir la firma
- Retorna errores detallados si la validación falla

### 4. Mejoras en el Componente de Firma

**Archivo:** `frontend/src/components/FirmaElectronica.jsx`

#### Cambios Visuales:

1. **Mensaje de Error Mejorado:**
   - Muestra claramente qué bloques están incompletos
   - Lista todos los errores encontrados
   - Muestra detalles del estado de cada bloque

2. **Información Detallada:**
   - Estado de Anamnesis (completa/incompleta, longitud)
   - Estado de Diagnósticos (válidos/inválidos, cantidad, si tiene definitivo)

3. **Revalidación Automática:**
   - Revalida cada 5 segundos cuando hay errores (para detectar cambios)
   - Botón "Revalidar requisitos" para validación manual

4. **Mensajes de Ayuda:**
   - Instrucciones claras sobre qué hacer para completar los requisitos

## 🔍 Reglas de Validación Implementadas

### Bloque: Anamnesis (Enfermedad o Problema Actual)

| Regla | Validación | Mensaje de Error |
|-------|-----------|------------------|
| Campo obligatorio | `enfermedadProblemaActual` no puede ser null/undefined/vacío | "La anamnesis (enfermedad o problema actual) es obligatoria" |
| Longitud mínima | Debe tener al menos 10 caracteres | "La anamnesis debe tener al menos 10 caracteres" |
| Recomendación | Se recomienda al menos 20 caracteres | "Se recomienda que la anamnesis tenga al menos 20 caracteres para mayor detalle" (advertencia) |

### Bloque: Diagnósticos CIE-10

| Regla | Validación | Mensaje de Error |
|-------|-----------|------------------|
| Al menos un diagnóstico | Debe existir al menos un diagnóstico | "Debe existir al menos un diagnóstico CIE-10" |
| Diagnóstico DEFINITIVO | Debe existir al menos un diagnóstico DEFINITIVO (excepto códigos Z) | "Debe existir al menos un diagnóstico DEFINITIVO (excepto códigos Z)" |
| Código válido | Todos los diagnósticos deben tener código CIE-10 válido | "Hay X diagnóstico(s) sin código CIE-10 válido" |

## 📡 API Endpoints

### GET `/api/diagnosticos/validar-firma/:atencionId`

**Respuesta exitosa (200):**

```json
{
  "puedeFirmar": false,
  "motivo": "La anamnesis debe tener al menos 10 caracteres; Debe existir al menos un diagnóstico DEFINITIVO (excepto códigos Z)",
  "errores": [
    {
      "bloque": "anamnesis",
      "campo": "enfermedadProblemaActual",
      "mensaje": "La anamnesis debe tener al menos 10 caracteres"
    },
    {
      "bloque": "diagnosticos",
      "campo": "diagnosticos",
      "mensaje": "Debe existir al menos un diagnóstico DEFINITIVO (excepto códigos Z)"
    }
  ],
  "erroresCriticos": [
    {
      "bloque": "anamnesis",
      "campo": "enfermedadProblemaActual",
      "mensaje": "La anamnesis debe tener al menos 10 caracteres"
    },
    {
      "bloque": "diagnosticos",
      "campo": "diagnosticos",
      "mensaje": "Debe existir al menos un diagnóstico DEFINITIVO (excepto códigos Z)"
    }
  ],
  "detalles": {
    "anamnesis": {
      "valido": false,
      "tieneContenido": true,
      "longitud": 5
    },
    "diagnosticos": {
      "valido": false,
      "totalDiagnosticos": 2,
      "tieneDefinitivo": false
    }
  },
  "tieneDefinitivo": false,
  "totalDiagnosticos": 2
}
```

## 🎯 Flujo de Validación

```
1. Usuario intenta firmar
   ↓
2. Frontend llama a GET /api/diagnosticos/validar-firma/:atencionId
   ↓
3. Backend ejecuta validarPreFirmaFormulario008()
   ↓
4. Se valida Anamnesis:
   - ¿Existe el campo?
   - ¿Tiene al menos 10 caracteres?
   ↓
5. Se valida Diagnósticos:
   - ¿Existe al menos un diagnóstico?
   - ¿Existe al menos un DEFINITIVO (excepto Z)?
   ↓
6. Si todas las validaciones pasan → puedeFirmar = true
   Si alguna falla → puedeFirmar = false + lista de errores
   ↓
7. Frontend muestra mensaje según resultado
   - Si puedeFirmar: Muestra formulario de certificado
   - Si no puedeFirmar: Muestra errores detallados
```

## 🧪 Casos de Prueba

### Caso 1: Anamnesis Incompleta
- **Estado:** `enfermedadProblemaActual = ""` o `null`
- **Resultado esperado:** `puedeFirmar = false`, error: "La anamnesis (enfermedad o problema actual) es obligatoria"

### Caso 2: Anamnesis Muy Corta
- **Estado:** `enfermedadProblemaActual = "Dolor"` (5 caracteres)
- **Resultado esperado:** `puedeFirmar = false`, error: "La anamnesis debe tener al menos 10 caracteres"

### Caso 3: Sin Diagnósticos
- **Estado:** No hay diagnósticos registrados
- **Resultado esperado:** `puedeFirmar = false`, error: "Debe existir al menos un diagnóstico CIE-10"

### Caso 4: Solo Diagnósticos Presuntivos
- **Estado:** Hay 2 diagnósticos, ambos PRESUNTIVOS (no Z)
- **Resultado esperado:** `puedeFirmar = false`, error: "Debe existir al menos un diagnóstico DEFINITIVO (excepto códigos Z)"

### Caso 5: Diagnóstico DEFINITIVO con Código Z
- **Estado:** Hay 1 diagnóstico DEFINITIVO con código Z00.0
- **Resultado esperado:** `puedeFirmar = false`, error: "Debe existir al menos un diagnóstico DEFINITIVO (excepto códigos Z)"

### Caso 6: Todo Correcto
- **Estado:** 
  - Anamnesis con 25 caracteres
  - Al menos 1 diagnóstico DEFINITIVO (no Z)
- **Resultado esperado:** `puedeFirmar = true`

## 🔄 Revalidación Automática

El componente `FirmaElectronica` ahora:
- Revalida automáticamente cada 5 segundos cuando hay errores
- Permite revalidación manual con el botón "Revalidar requisitos"
- Se actualiza automáticamente cuando el usuario completa los bloques

## 📝 Notas Técnicas

1. **Compatibilidad:** El endpoint mantiene compatibilidad con el código anterior (campos `tieneDefinitivo` y `totalDiagnosticos`)

2. **Advertencias vs Errores:** Las advertencias (como "recomendación de 20 caracteres") no bloquean la firma, solo los errores críticos

3. **Performance:** La validación es rápida y no requiere consultas pesadas a la base de datos

4. **Extensibilidad:** El servicio puede extenderse fácilmente para validar otros bloques en el futuro

## 🚀 Próximos Pasos (Opcional)

- [ ] Agregar validación de otros bloques obligatorios (Examen Físico, Plan de Tratamiento)
- [ ] Implementar validación en tiempo real mientras el usuario escribe
- [ ] Agregar indicadores visuales en los bloques del formulario cuando hay errores
- [ ] Crear tests unitarios para el servicio de validación

---

**Fecha de implementación:** Enero 2026  
**Versión:** 1.0
