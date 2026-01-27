# 🚨 ESCALAMIENTO AUTOMÁTICO EN ADMISIÓN
**Sistema de Emergencias - Centro de Salud Chone Tipo C**
**Fecha**: 25 de Enero de 2026

---

## 🎯 OBJETIVO

Implementar **escalamiento automático** de pacientes con motivos de consulta críticos (Triaje ROJO) directamente desde el momento de la admisión, sin esperar intervención manual de enfermería.

---

## 🏥 FUNDAMENTO MÉDICO

En casos de **EMERGENCIAS VITALES** (Triaje ROJO - RESUCITACIÓN), el paciente debe ser atendido por el médico **INMEDIATAMENTE**, sin pasar por el flujo completo de enfermería.

**Ejemplos de motivos críticos**:
- Paro cardiorrespiratorio
- Dificultad respiratoria severa
- Traumatismo craneoencefálico grave
- Hemorragia masiva
- Shock
- Convulsiones activas
- Pérdida de consciencia

---

## 🔄 FLUJO IMPLEMENTADO

### **Flujo Anterior (Sin escalamiento automático)**
```
1. Admisionista/Enfermería registra paciente
2. Selecciona motivo: "Paro cardiorrespiratorio"
3. Sistema asigna triaje preliminar: ROJO
4. Estado: ADMITIDO
5. ❌ Paciente queda esperando...
6. Enfermería debe tomar signos vitales
7. Enfermería debe registrar procedimiento
8. Enfermería debe marcar "Alerta médica"
9. Recién ahí aparece en lista del médico
```

**Problema**: Demora crítica en emergencias vitales

---

### **Flujo Nuevo (Con escalamiento automático)**
```
1. Admisionista/Enfermería registra paciente
2. Selecciona motivo: "Paro cardiorrespiratorio"
3. Sistema detecta: Codigo_Triaje = 1 (ROJO)
4. ⚠️ ESCALAMIENTO AUTOMÁTICO:
   └─ prioridad_enfermeria = 1
   └─ observacion_escalamiento = "Escalamiento automático: Paro cardiorrespiratorio"
5. ✅ Paciente aparece INMEDIATAMENTE en lista del médico
6. Médico ve alerta roja y puede atender de inmediato
7. (Signos vitales se toman durante o después de la atención)
```

**Beneficio**: Atención inmediata en casos críticos ✅

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### **Archivos Modificados (2)**

#### 1. `backend/controllers/usuariosController.js`
**Función**: `crearRegistroAdmision`
**Líneas**: ~490-505, ~920-935

**Lógica agregada**:
```javascript
// Después de obtener motivoConsultaSintomaObj
let prioridadEnfermeria = 0;
let observacionEscalamientoAuto = null;

if (motivoConsultaSintomaObj && motivoConsultaSintomaObj.Codigo_Triaje === 1) {
  prioridadEnfermeria = 1;
  observacionEscalamientoAuto = `⚠️ ESCALAMIENTO AUTOMÁTICO: Motivo crítico - "${motivoConsultaSintomaObj.Motivo_Consulta_Sintoma}"...`;
  console.log('⚠️ ESCALAMIENTO AUTOMÁTICO activado');
}

// Al crear admisión, incluir:
const admisionData = {
  // ... campos existentes ...
  prioridad_enfermeria: prioridadEnfermeria,
  observacion_escalamiento: observacionEscalamientoAuto
};
```

---

#### 2. `backend/controllers/admisionesController.js`
**Función**: `createAdmision`
**Líneas**: ~90-118

**Lógica agregada**: Idéntica a usuariosController.js

---

## 📊 TABLA: CAT_MOTIVO_CONSULTA_SINTOMAS

### **Estructura**:
```sql
CREATE TABLE `CAT_MOTIVO_CONSULTA_SINTOMAS` (
  `Codigo` int(11) PRIMARY KEY,
  `Motivo_Consulta_Sintoma` varchar(255),
  `Categoria` varchar(100),
  `Codigo_Triaje` int(11) NOT NULL FK → CAT_TRIAJE
)
```

### **Ejemplos de datos**:
| Codigo | Motivo | Categoria | Codigo_Triaje | Escalamiento |
|--------|--------|-----------|---------------|--------------|
| 891 | Dolor (agudo) | General | 2 (NARANJA) | ❌ No |
| ??? | Paro cardíaco | Cardiovascular | 1 (ROJO) | ✅ **SÍ** |
| ??? | Traumatismo severo | Trauma | 1 (ROJO) | ✅ **SÍ** |
| 878 | Fiebre (aguda) | General | 3 (AMARILLO) | ❌ No |

---

## 🎨 EXPERIENCIA DEL USUARIO

### **Para Admisionista/Enfermería:**

**Al admitir con motivo crítico**:
1. Selecciona: "Paro cardiorrespiratorio"
2. Sistema detecta automáticamente: Triaje ROJO
3. (Opcional) Mensaje visual: "⚠️ Este motivo activa escalamiento automático"
4. Guarda admisión
5. Sistema escala automáticamente
6. ✅ Listo - No necesita hacer nada más

---

### **Para el Médico:**

**Vista en Lista de Espera**:
```
┌─────────────────────────────────────────────────┐
│ 🔴 FONDO ROJO - PRIORIDAD MÁXIMA                │
├─────────────────────────────────────────────────┤
│ JUAN PÉREZ GÓMEZ                                │
│ Cédula: 1234567890                              │
│ Triaje: [ROJO] RESUCITACIÓN                     │
│                                                 │
│ ⚠️ VALORACIÓN URGENTE (Pulsando)                │
│                                                 │
│ 📋 Observación:                                 │
│ "⚠️ ESCALAMIENTO AUTOMÁTICO:                    │
│  Motivo de consulta crítico -                   │
│  'Paro cardiorrespiratorio'                     │
│  (Categoría: Cardiovascular).                   │
│  Requiere valoración médica inmediata."         │
│                                                 │
│ [Atender Inmediatamente]                        │
└─────────────────────────────────────────────────┘
```

**Orden en lista**:
1. **PRIMERO**: Pacientes escalados automáticamente (prioridad_enfermeria = 1)
2. Segundo: Otros triajes por color
3. Tercero: Por hora de llegada

---

## 🔄 FLUJOS COMBINADOS

### **Flujo A: Escalamiento Automático (Admisión con Triaje ROJO)**
```
ADMISIÓN con motivo ROJO
  ↓
prioridad_enfermeria = 1 (automático)
  ↓
Estado: ADMITIDO
  ↓
Aparece en lista del médico CON alerta roja
  ↓
Médico puede atender INMEDIATAMENTE
```

---

### **Flujo B: Escalamiento Manual (Procedimiento con complicaciones)**
```
ADMISIÓN normal
  ↓
Estado: ADMITIDO
  ↓
Enfermería toma signos vitales
  ↓
Estado: SIGNOS_VITALES
  ↓
Enfermería registra procedimiento
  ↓
Durante procedimiento detecta complicación
  ↓
Marca checkbox "Alerta médica"
  ↓
prioridad_enfermeria = 1 (manual)
  ↓
Aparece en lista del médico CON alerta roja
```

---

### **Flujo C: Escalamiento Rechazado (Sin signos vitales + Triaje NO rojo)**
```
ADMISIÓN con triaje AMARILLO
  ↓
Estado: ADMITIDO
  ↓
Enfermería intenta escalar sin tomar signos vitales
  ↓
Sistema bloquea y muestra modal
  ↓
"Debe tomar signos vitales primero"
  ↓
[Ir a Tomar Signos Vitales]
```

---

## ✅ MATRIZ DE DECISIÓN

| Origen | Triaje | Tiene S.V. | Escalamiento | Automático/Manual |
|--------|--------|------------|--------------|-------------------|
| Admisión | ROJO (1) | N/A | ✅ SÍ | ⚡ Automático |
| Admisión | NARANJA-AZUL | N/A | ❌ No | - |
| Procedimiento | ROJO | NO | ✅ SÍ | 👤 Manual |
| Procedimiento | NARANJA-AZUL | SÍ | ✅ SÍ | 👤 Manual |
| Procedimiento | NARANJA-AZUL | NO | ❌ No | ⚠️ Bloqueado |

---

## 🧪 PRUEBAS A REALIZAR

### **Prueba 1: Escalamiento Automático en Admisión**

**Preparación**: Buscar en tu catálogo un motivo con `Codigo_Triaje = 1`

```sql
-- Buscar motivos críticos
SELECT Codigo, Motivo_Consulta_Sintoma, Categoria, Codigo_Triaje
FROM CAT_MOTIVO_CONSULTA_SINTOMAS
WHERE Codigo_Triaje = 1
LIMIT 5;
```

**Pasos**:
1. Abrir formulario de admisión
2. Completar datos del paciente
3. En "Motivo de Consulta", seleccionar uno con Triaje ROJO
4. Guardar admisión
5. **Verificar en BD**:
```sql
SELECT id, prioridad_enfermeria, observacion_escalamiento 
FROM ADMISIONES 
ORDER BY id DESC 
LIMIT 1;
```
   - `prioridad_enfermeria` debe ser **1**
   - `observacion_escalamiento` debe contener texto del escalamiento automático

6. **Login como médico**
7. Ir a "Lista de Espera"
8. **Verificar**: Paciente aparece PRIMERO con alerta roja
9. **Verificar**: Observación dice "⚠️ ESCALAMIENTO AUTOMÁTICO: Motivo de consulta crítico..."

---

### **Prueba 2: Sin Escalamiento (Motivo Normal)**

**Pasos**:
1. Admitir paciente con motivo NO crítico (ej: "Fiebre")
2. **Verificar en BD**: `prioridad_enfermeria = 0`
3. **Verificar**: Paciente NO aparece en lista del médico hasta tener signos vitales

---

### **Prueba 3: Flujo Completo con Escalamiento Automático**

**Escenario**: Paciente con paro cardíaco

```
1. ADMISIÓN (Admisionista)
   └─ Motivo: "Paro cardiorrespiratorio" (Triaje ROJO)
   └─ Sistema escala automáticamente ⚡
   └─ prioridad_enfermeria = 1

2. LISTA DE ESPERA (Médico)
   └─ Ve paciente CON alerta roja INMEDIATAMENTE
   └─ Sin necesidad de signos vitales previos
   └─ Hace clic en "Atender"

3. ATENCIÓN (Médico)
   └─ Estado: EN_ATENCION
   └─ prioridad_enfermeria vuelve a 0
   └─ Médico atiende emergencia
   └─ (Signos vitales se toman durante la atención)
```

---

## 📋 CAMPOS INVOLUCRADOS

### **En `ADMISIONES`:**
- `motivo_consulta_sintoma_id` (FK) → Motivo seleccionado
- `triajePreliminarId` (FK) → Triaje del motivo (1=ROJO, 2=NARANJA, etc.)
- `prioridad_enfermeria` (TINYINT) → 0 o 1 (0=normal, 1=escalado)
- `observacion_escalamiento` (TEXT) → Razón del escalamiento

### **En `CAT_MOTIVO_CONSULTA_SINTOMAS`:**
- `Codigo` (PK)
- `Motivo_Consulta_Sintoma` (TEXT)
- `Categoria` (TEXT)
- `Codigo_Triaje` (FK → CAT_TRIAJE) ← **Campo clave**

### **En `CAT_TRIAJE`:**
- `id` (1=RESUCITACIÓN/ROJO, 2=EMERGENCIA/NARANJA, etc.)
- `nombre`
- `color`

---

## 🔐 SEGURIDAD Y AUDITORÍA

### **Trazabilidad**:
- ✅ Se registra en logs: `[createAdmision] ⚠️ ESCALAMIENTO AUTOMÁTICO activado`
- ✅ Observación indica claramente que es automático: "⚠️ ESCALAMIENTO AUTOMÁTICO: ..."
- ✅ Se mantiene el motivo de consulta original en `motivo_consulta_sintoma_id`

### **Auditoría**:
```sql
-- Ver todos los escalamientos automáticos
SELECT 
    a.id,
    a.fecha_hora_admision,
    p.primer_nombre,
    p.primer_apellido,
    m.Motivo_Consulta_Sintoma,
    m.Codigo_Triaje,
    a.prioridad_enfermeria,
    a.observacion_escalamiento
FROM ADMISIONES a
JOIN PACIENTES p ON a.paciente_id = p.id
LEFT JOIN CAT_MOTIVO_CONSULTA_SINTOMAS m ON a.motivo_consulta_sintoma_id = m.Codigo
WHERE a.prioridad_enfermeria = 1
  AND a.observacion_escalamiento LIKE '%ESCALAMIENTO AUTOMÁTICO%'
ORDER BY a.fecha_hora_admision DESC;
```

---

## 🎨 INDICADOR VISUAL MEJORADO

**Diferencia entre escalamientos**:

### **Escalamiento Automático (desde admisión)**:
```
┌────────────────────────────────────────┐
│ 🔴 PRIORIDAD MÁXIMA                   │
│ ⚠️ VALORACIÓN URGENTE                 │
│                                        │
│ 📋 ⚡ ESCALAMIENTO AUTOMÁTICO:         │
│ Motivo de consulta crítico -          │
│ "Paro cardiorrespiratorio"            │
│ Requiere valoración inmediata.        │
└────────────────────────────────────────┘
```

### **Escalamiento Manual (desde procedimiento)**:
```
┌────────────────────────────────────────┐
│ 🔴 PRIORIDAD ALTA                     │
│ ⚠️ VALORACIÓN URGENTE                 │
│                                        │
│ 📋 👤 Observación de Enfermería:      │
│ "Signos de infección local, eritema   │
│ extendido, fiebre 39.5°C..."          │
└────────────────────────────────────────┘
```

---

## ⚙️ CONFIGURACIÓN

### **¿Qué triajes activan escalamiento automático?**

Actualmente configurado: **Solo ID 1 (RESUCITACIÓN - ROJO)**

Para cambiar en el futuro:
```javascript
// En usuariosController.js y admisionesController.js
// Línea ~495 y ~95

// OPCIÓN A: Solo ROJO (actual)
if (motivoConsulta.Codigo_Triaje === 1) {

// OPCIÓN B: ROJO y NARANJA
if (motivoConsulta.Codigo_Triaje === 1 || motivoConsulta.Codigo_Triaje === 2) {

// OPCIÓN C: ROJO, NARANJA y AMARILLO
if (motivoConsulta.Codigo_Triaje <= 3) {
```

---

## 📊 IMPACTO ESPERADO

### **Métricas a monitorear**:
- 📈 Tiempo promedio de atención en casos críticos
- 📉 Reducción de demoras en emergencias vitales
- 📊 % de pacientes con escalamiento automático vs manual
- ⏱️ Tiempo desde admisión hasta asignación de médico

### **Esperado**:
- ⏱️ **Tiempo de respuesta**: Reducción de ~10-15 minutos a ~2-3 minutos
- 🎯 **Cumplimiento**: 100% de casos críticos llegan inmediatamente al médico
- 🔒 **Seguridad**: Cero casos críticos sin atención oportuna

---

## ⚠️ CASOS ESPECIALES

### **Caso 1: Paciente llega inconsciente**
- Se admite con motivo crítico
- Escalamiento automático ✅
- Médico atiende inmediatamente
- Signos vitales se toman durante reanimación

### **Caso 2: Escalamiento doble (Automático + Manual)**
- Se admite con motivo ROJO → `prioridad_enfermeria = 1`
- Enfermería registra procedimiento con alerta
- Sistema mantiene `prioridad_enfermeria = 1` (no duplica)
- Observación se puede actualizar si enfermería agrega más info

---

## 🚀 INSTRUCCIONES DE PRUEBA

### **PASO 1: Reiniciar Backend** ⏳
```bash
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\backend"
Ctrl + C
npm start
```

### **PASO 2: Buscar Motivos Críticos en BD** ⏳
```sql
SELECT Codigo, Motivo_Consulta_Sintoma, Categoria, Codigo_Triaje
FROM CAT_MOTIVO_CONSULTA_SINTOMAS
WHERE Codigo_Triaje = 1
LIMIT 10;
```

Si no hay motivos con `Codigo_Triaje = 1`, crear uno de prueba:
```sql
INSERT INTO CAT_MOTIVO_CONSULTA_SINTOMAS 
(Codigo, Motivo_Consulta_Sintoma, Categoria, Codigo_Triaje)
VALUES 
(9999, 'PRUEBA - Paro cardiorrespiratorio', 'Prueba', 1);
```

### **PASO 3: Probar Admisión con Motivo Crítico** ⏳
1. Ir a formulario de admisión
2. Completar datos
3. Seleccionar motivo con triaje ROJO
4. Guardar
5. Verificar en BD: `prioridad_enfermeria = 1`
6. Login como médico
7. Verificar en lista: Paciente con alerta roja
8. Verificar observación: "⚠️ ESCALAMIENTO AUTOMÁTICO..."

---

**Fin del documento**
**Sistema listo para escalar automáticamente casos críticos** 🚨
