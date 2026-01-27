# 📋 MAPEO DE CAMPOS - CUMPLIMIENTO_PROCEDIMIENTOS
**Sistema de Emergencias - Centro de Salud Chone Tipo C**
**Fecha**: 25 de Enero de 2026

---

## 🔄 CORRECCIÓN DE NOMBRES DE CAMPOS

### **Tabla: `CUMPLIMIENTO_PROCEDIMIENTOS`**

| Campo en BD (Real) | Campo en Código Original | Campo Corregido | Estado |
|-------------------|-------------------------|-----------------|--------|
| `procedimiento_cat_id` | `procedimiento_id` ❌ | `procedimiento_cat_id` ✅ | Corregido |
| `usuario_enfermeria_id` | `usuario_id` ❌ | `usuario_enfermeria_id` ✅ | Corregido |
| `observacion_hallazgo` | `observaciones` ❌ | `observacion_hallazgo` ✅ | Corregido |
| `alerta_medica` | `requiere_valoracion_medica` ❌ | `alerta_medica` ✅ | Corregido |
| `fecha_hora` | `fecha_hora_registro` ❌ | `fecha_hora` ✅ | Corregido |
| `observacion_escalamiento` | ✅ (nuevo) | `observacion_escalamiento` ✅ | Agregado en BD |
| `createdAt` | ✅ (nuevo) | `createdAt` ✅ | Agregado en BD |
| `updatedAt` | ✅ (nuevo) | `updatedAt` ✅ | Agregado en BD |

---

### **Tabla: `ADMISIONES`**

| Campo en BD | Estado en Esquema | Campo en Código | Estado |
|-------------|-------------------|-----------------|--------|
| `prioridad_enfermeria` | ✅ Existe | `prioridad_enfermeria` ✅ | Correcto |
| `observacion_escalamiento` | ⚠️ Por agregar | `observacion_escalamiento` ✅ | Agregado en BD |

---

## 📦 ARCHIVOS CORREGIDOS

### **Backend (3 archivos)**

#### 1. `backend/models/cumplimientoProcedimientos.js`
**Cambios**:
- `procedimiento_id` → `procedimiento_cat_id`
- `usuario_id` → `usuario_enfermeria_id`
- `fecha_hora_registro` → `fecha_hora`
- `observaciones` → `observacion_hallazgo`
- `requiere_valoracion_medica` → `alerta_medica`
- Agregado campo explícito: `observacion_escalamiento`
- Agregados campos explícitos: `createdAt`, `updatedAt`

**Asociaciones actualizadas**:
- `foreignKey: 'procedimiento_cat_id'` (corregido)
- `foreignKey: 'usuario_enfermeria_id'` (corregido)
- `as: 'UsuarioEnfermeria'` (corregido)

---

#### 2. `backend/controllers/cumplimientoProcedimientosController.js`
**Cambios en parámetros**:
- `procedimientoId` → `procedimientoCatId`
- `observaciones` → `observacionHallazgo`
- `requiereValoracionMedica` → `alertaMedica`
- `usuarioId` → `usuarioEnfermeriaId`

**Cambios en create()**:
```javascript
// ANTES:
{
  procedimiento_id: procedimientoId,
  usuario_id: usuarioId,
  fecha_hora_registro: new Date(),
  observaciones: observaciones,
  requiere_valoracion_medica: requiereValoracionMedica ? 1 : 0
}

// AHORA:
{
  procedimiento_cat_id: procedimientoCatId,
  usuario_enfermeria_id: usuarioEnfermeriaId,
  fecha_hora: new Date(),
  observacion_hallazgo: observacionHallazgo,
  alerta_medica: alertaMedica ? 1 : 0,
  observacion_escalamiento: alertaMedica ? observacionEscalamiento : null
}
```

**Alias en include actualizados**:
- `as: 'Usuario'` → `as: 'UsuarioEnfermeria'`

---

#### 3. `backend/models/init-associations.js`
**Cambios**:
- `foreignKey: 'procedimiento_id'` → `foreignKey: 'procedimiento_cat_id'`
- `foreignKey: 'usuario_id'` → `foreignKey: 'usuario_enfermeria_id'`
- `as: 'Usuario'` → `as: 'UsuarioEnfermeria'`

---

### **Frontend (1 archivo)**

#### 1. `frontend/src/components/ProcedimientoEmergenciaForm.jsx`
**Cambios en datos enviados al backend**:
```javascript
// ANTES:
const cumplimientoData = {
  admisionId,
  procedimientoId: procedimientoSeleccionado.id,
  observaciones: observacion,
  requiereValoracionMedica: requiereValoracionMedica ? 1 : 0,
  observacionEscalamiento: requiereValoracionMedica ? observacionEscalamiento : null
};

// AHORA:
const cumplimientoData = {
  admisionId,
  procedimientoCatId: procedimientoSeleccionado.id,
  observacionHallazgo: observacion,
  alertaMedica: requiereValoracionMedica ? 1 : 0,
  observacionEscalamiento: requiereValoracionMedica ? observacionEscalamiento : null
};
```

---

## 🎯 FLUJO TÉCNICO ACTUALIZADO

### **Request del Frontend al Backend**
```json
POST /api/cumplimiento-procedimientos
{
  "admisionId": 123,
  "procedimientoCatId": 5,
  "observacionHallazgo": "Curación realizada sin complicaciones",
  "alertaMedica": 1,
  "observacionEscalamiento": "Signos de infección, eritema extendido, fiebre 38.8°C"
}
```

### **Procesamiento en Backend**
```javascript
// 1. Validar alerta médica requiere observación
if (alertaMedica && !observacionEscalamiento) {
  return error 400
}

// 2. Crear en CUMPLIMIENTO_PROCEDIMIENTOS
INSERT INTO CUMPLIMIENTO_PROCEDIMIENTOS (
  admision_id,
  procedimiento_cat_id,
  usuario_enfermeria_id,
  fecha_hora,
  observacion_hallazgo,
  alerta_medica,
  observacion_escalamiento,
  createdAt,
  updatedAt
) VALUES (123, 5, 7, NOW(), '...', 1, 'Signos de infección...', NOW(), NOW())

// 3. Si alerta_medica = 1, actualizar ADMISIONES
UPDATE ADMISIONES 
SET prioridad_enfermeria = 1,
    observacion_escalamiento = 'Signos de infección...',
    fecha_ultima_actividad = NOW()
WHERE id = 123
```

### **Response al Frontend**
```json
{
  "message": "Procedimiento registrado y paciente escalado a valoración médica.",
  "cumplimiento": {
    "id": 45,
    "admision_id": 123,
    "procedimiento_cat_id": 5,
    "alerta_medica": 1,
    "observacion_escalamiento": "Signos de infección...",
    "Procedimiento": { "nombre": "Curaciones" },
    "UsuarioEnfermeria": { "nombres": "ROXANA", "apellidos": "ALCIVAR" }
  },
  "escalado": true
}
```

---

## ✅ CAMPOS AGREGADOS EN BD (Script de mejoras)

### **En `CUMPLIMIENTO_PROCEDIMIENTOS`:**
- ✅ `observacion_escalamiento` TEXT NULL
- ✅ `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- ✅ `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- ✅ `usuario_enfermeria_id` cambiado a NOT NULL
- ✅ Índices: idx_admision_id, idx_alerta_medica, idx_fecha_hora, idx_usuario_enfermeria
- ✅ Foreign Keys: fk_cumplimiento_admision, fk_cumplimiento_procedimiento, fk_cumplimiento_usuario

### **En `ADMISIONES`:**
- ✅ `observacion_escalamiento` TEXT NULL (si no existe)
- ✅ Índice: idx_prioridad_enfermeria

---

## 🔍 COMPARATIVA VISUAL

### **ANTES (Nombres Incorrectos)**
```
cumplimientoProcedimientos {
  procedimiento_id ❌
  usuario_id ❌
  observaciones ❌
  requiere_valoracion_medica ❌
  fecha_hora_registro ❌
}
```

### **AHORA (Nombres Correctos)**
```
cumplimientoProcedimientos {
  procedimiento_cat_id ✅
  usuario_enfermeria_id ✅
  observacion_hallazgo ✅
  alerta_medica ✅
  fecha_hora ✅
  observacion_escalamiento ✅
  createdAt ✅
  updatedAt ✅
}
```

---

## 📊 COMPATIBILIDAD CON ESQUEMA REAL

| Componente | Esquema Real | Código Implementado | Estado |
|------------|--------------|---------------------|--------|
| Nombre de tabla | `CUMPLIMIENTO_PROCEDIMIENTOS` | `CUMPLIMIENTO_PROCEDIMIENTOS` | ✅ Compatible |
| Campo procedimiento | `procedimiento_cat_id` | `procedimiento_cat_id` | ✅ Corregido |
| Campo usuario | `usuario_enfermeria_id` | `usuario_enfermeria_id` | ✅ Corregido |
| Campo observación | `observacion_hallazgo` | `observacion_hallazgo` | ✅ Corregido |
| Campo alerta | `alerta_medica` | `alerta_medica` | ✅ Corregido |
| Campo fecha | `fecha_hora` | `fecha_hora` | ✅ Corregido |
| Campo escalamiento | ⚠️ Por agregar | `observacion_escalamiento` | ⏳ En script SQL |
| Timestamps | ⚠️ Por agregar | `createdAt`, `updatedAt` | ⏳ En script SQL |

---

## 🚀 PRÓXIMOS PASOS

### **1. Ejecutar Script de Mejoras de BD** ⏳
```bash
# Abrir en tu gestor de BD:
scripts/mejoras_bd_cumplimiento_procedimientos.sql
```

**Verificar**:
- ✅ Todos los campos se agregan sin errores
- ✅ Índices se crean correctamente
- ✅ Foreign keys se aplican sin problemas
- ✅ Ejecutar `COMMIT;` al final

### **2. Reiniciar Backend** ⏳
```bash
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\backend"
Ctrl + C
npm start
```

**Verificar logs**:
- ✅ Conexión a BD establecida
- ✅ Sin errores de Sequelize
- ✅ Asociaciones inicializadas correctamente

### **3. Limpiar Caché Frontend** ⏳
```bash
Ctrl + F5 en el navegador
```

### **4. Probar Flujo Completo** ⏳
Ver checklist en `FASE2_MODULO_PROCEDIMIENTOS_ESCALAMIENTO.md`

---

**Fin del documento**
**Todos los nombres de campos ahora coinciden EXACTAMENTE con tu esquema de BD** ✅
