# Hoja de Ruta Técnica: Formulario 008 como Núcleo del Sistema Médico

**Proyecto:** Módulo Médico - Centro de Salud Chone  
**Objetivo:** Implementar Formulario 008 (Emergencia) como núcleo escalable para ecosistema de formularios MSP Ecuador  
**Fecha:** Enero 2026

---

## 📊 1. ANÁLISIS DEL ESTADO ACTUAL

### 1.1. Estructura de Navegación Actual

#### ✅ **Implementado:**
- **Dashboard Principal** (`/dashboard`)
  - KPIs: Pacientes en espera, Atenciones abiertas, Por firmar
  - Lista de atenciones en curso con acceso rápido
  
- **Atenciones en Curso** (`/atenciones-en-curso`)
  - Lista persistente de atenciones abiertas del médico
  - Permite continuar donde se dejó
  
- **Bandeja de Pendientes** (`/pendientes-firma`)
  - Filtrado por médico (admin ve todas)
  - Alertas para atenciones > 24 horas
  - Acciones: Continuar / Firmar directamente

#### ⚠️ **Flujo "Continuar Atención":**
- ✅ Redirige a `/atencion-emergencia-page/:admisionId`
- ✅ Carga datos existentes si hay atención previa
- ✅ Pre-llenado automático desde `ADMISIONES` (motivo de consulta)
- ⚠️ **FALTA:** Validación de bloques obligatorios antes de permitir navegación entre pestañas

### 1.2. Bloques del Formulario 008 - Estado de Implementación

| Bloque | Estado | Observaciones |
|--------|--------|---------------|
| **C. Registro de Admisión** | ✅ Implementado | Pre-llenado desde `ADMISIONES` |
| **C. Inicio de Atención** | ✅ Implementado | Fecha/hora automáticas, condición de llegada |
| **C. Triage** | ✅ Implementado | Visualización desde `TRIAGE_DEFINITIVO` |
| **F. Anamnesis** | ✅ Implementado | Enfermedad/Problema Actual |
| **E. Antecedentes Patológicos** | ✅ Implementado | JSON estructurado |
| **H. Examen Físico** | ✅ Implementado | JSON con Glasgow |
| **I. Examen Traumatológico** | ✅ Implementado | Campo de texto |
| **J. Obstetricia** | ✅ Implementado | JSON estructurado |
| **K. Exámenes Complementarios** | ✅ Implementado | Array JSON |
| **L/M. Diagnóstico CIE-10** | ✅ Implementado | Tabla `DETALLE_DIAGNOSTICOS`, regla Z |
| **N. Plan de Tratamiento** | ⚠️ Parcial | Existe `planTratamiento` JSON, pero falta integración con prescripción |
| **O. Condición al Egreso** | ✅ Implementado | Enum con opciones MSP |

### 1.3. Funcionalidades Transversales

| Funcionalidad | Estado | Detalles |
|--------------|--------|----------|
| **Auto-guardado** | ✅ Implementado | Debounce 2s, guardado al cambiar pestaña |
| **Firma Electrónica** | ✅ Implementado | Certificado .p12, PDF firmado, bloqueo Read-Only |
| **Reasignación** | ✅ Implementado | Modal, log en `LOG_REASIGNACIONES_MEDICAS` |
| **Diagnósticos CIE-10** | ✅ Implementado | Búsqueda básica, regla Z, validación pre-firma |
| **Prescripción (Recetas)** | ⚠️ Desconectado | Existe `RecetaMedicaForm` pero no integrado en flujo 008 |
| **Órdenes de Exámenes** | ⚠️ Desconectado | Existe `OrdenExamenForm` pero no integrado en flujo 008 |

---

## 🏗️ 2. DISEÑO DE ARQUITECTURA ESCALABLE

### 2.1. Patrón de Diseño: Form Renderer Centralizado

#### **Concepto:**
El Formulario 008 será el **documento maestro** de la sesión de atención. Los demás formularios (005, 006, 053, etc.) serán **documentos derivados** que pueden:
- Heredar datos del 008 (evitar doble carga)
- Agregar información específica
- Mantener referencias al 008 padre

#### **Arquitectura Propuesta:**

```
┌─────────────────────────────────────────────────────────────┐
│                    ATENCIÓN MÉDICA (Sesión)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Formulario 008 (Documento Maestro)                  │  │
│  │  - Datos base: Paciente, Admisión, Triage            │  │
│  │  - Bloque obligatorio: Diagnóstico, Plan Tratamiento │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│        ┌──────────────────┼──────────────────┐               │
│        │                  │                  │               │
│  ┌─────▼─────┐    ┌──────▼──────┐   ┌──────▼──────┐        │
│  │ Form 005  │    │  Form 053   │   │  Form 012   │        │
│  │ Evolución │    │ Referencia  │   │  Otro...    │        │
│  └───────────┘    └─────────────┘   └─────────────┘        │
│  Hereda:          Hereda:            Hereda:                │
│  - Diagnósticos   - Datos paciente  - Datos base           │
│  - Plan actual    - Motivo consulta                         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2. Estructura de Base de Datos Escalable

#### **Tabla Maestra: `ATENCION_MEDICA` (Nueva)**

```sql
CREATE TABLE `ATENCION_MEDICA` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `paciente_id` INT(11) NOT NULL,
  `admision_id` INT(11) NOT NULL,
  `usuario_id` INT(11) NOT NULL,
  `usuario_responsable_id` INT(11) DEFAULT NULL,
  `tipo_atencion` ENUM('EMERGENCIA', 'CONSULTA', 'HOSPITALIZACION') NOT NULL,
  `fecha_inicio` DATETIME NOT NULL,
  `fecha_fin` DATETIME DEFAULT NULL,
  `estado` ENUM('EN_CURSO', 'COMPLETADA', 'CANCELADA') DEFAULT 'EN_CURSO',
  `estado_firma` ENUM('PENDIENTE', 'FIRMADO') DEFAULT 'PENDIENTE',
  `es_valida` BOOLEAN DEFAULT TRUE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_atencion_paciente` (`paciente_id`),
  KEY `fk_atencion_admision` (`admision_id`),
  KEY `fk_atencion_usuario` (`usuario_id`),
  CONSTRAINT `fk_atencion_paciente` FOREIGN KEY (`paciente_id`) REFERENCES `PACIENTES` (`id`),
  CONSTRAINT `fk_atencion_admision` FOREIGN KEY (`admision_id`) REFERENCES `ADMISIONES` (`id`),
  CONSTRAINT `fk_atencion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `USUARIOS_SISTEMA` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### **Tabla de Formularios: `FORMULARIOS_ATENCION` (Nueva)**

```sql
CREATE TABLE `FORMULARIOS_ATENCION` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `atencion_medica_id` INT(11) NOT NULL,
  `tipo_formulario` ENUM('008', '005', '006', '007', '010', '012', '016', '020', '022', '024', '051', '053', '117') NOT NULL,
  `formulario_padre_id` INT(11) DEFAULT NULL, -- Referencia al 008 si es derivado
  `datos_formulario` JSON NOT NULL, -- Estructura flexible por formulario
  `estado` ENUM('BORRADOR', 'COMPLETADO', 'FIRMADO') DEFAULT 'BORRADOR',
  `estado_firma` ENUM('PENDIENTE', 'FIRMADO') DEFAULT 'PENDIENTE',
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_firma` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_formulario_atencion` (`atencion_medica_id`),
  KEY `fk_formulario_padre` (`formulario_padre_id`),
  CONSTRAINT `fk_formulario_atencion` FOREIGN KEY (`atencion_medica_id`) REFERENCES `ATENCION_MEDICA` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_formulario_padre` FOREIGN KEY (`formulario_padre_id`) REFERENCES `FORMULARIOS_ATENCION` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### **Migración de Datos Existentes:**

```sql
-- Migrar ATENCION_EMERGENCIA a nueva estructura
INSERT INTO ATENCION_MEDICA (paciente_id, admision_id, usuario_id, usuario_responsable_id, tipo_atencion, fecha_inicio, estado, estado_firma, es_valida)
SELECT pacienteId, admisionId, usuarioId, usuarioResponsableId, 'EMERGENCIA', 
       CONCAT(fechaAtencion, ' ', horaAtencion), 
       CASE WHEN estadoFirma = 'FIRMADO' THEN 'COMPLETADA' ELSE 'EN_CURSO' END,
       estadoFirma, esValida
FROM ATENCION_EMERGENCIA;

INSERT INTO FORMULARIOS_ATENCION (atencion_medica_id, tipo_formulario, datos_formulario, estado, estado_firma)
SELECT am.id, '008', 
       JSON_OBJECT(
         'fechaAtencion', ae.fechaAtencion,
         'horaAtencion', ae.horaAtencion,
         'condicionLlegada', ae.condicionLlegada,
         'motivoAtencion', ae.motivoAtencion,
         'antecedentesPatologicos', ae.antecedentesPatologicos,
         'enfermedadProblemaActual', ae.enfermedadProblemaActual,
         'examenFisico', ae.examenFisico,
         'planTratamiento', ae.planTratamiento,
         -- ... todos los campos
       ),
       CASE WHEN ae.estadoFirma = 'FIRMADO' THEN 'FIRMADO' ELSE 'BORRADOR' END,
       ae.estadoFirma
FROM ATENCION_EMERGENCIA ae
INNER JOIN ATENCION_MEDICA am ON am.admision_id = ae.admisionId;
```

### 2.3. Herencia de Datos entre Formularios

#### **Estrategia de Pre-llenado:**

```javascript
// Ejemplo: Formulario 005 (Evolución) hereda del 008
class Formulario005Service {
  static async prellenarDesde008(atencionMedicaId) {
    const formulario008 = await FormulariosAtencion.findOne({
      where: {
        atencion_medica_id: atencionMedicaId,
        tipo_formulario: '008'
      }
    });

    if (!formulario008) {
      throw new Error('No existe Formulario 008 para esta atención');
    }

    const datos008 = JSON.parse(formulario008.datos_formulario);
    
    // Heredar datos relevantes
    return {
      pacienteId: datos008.pacienteId,
      diagnosticos: datos008.diagnosticos, // Desde DETALLE_DIAGNOSTICOS
      planTratamientoActual: datos008.planTratamiento,
      motivoConsultaInicial: datos008.motivoAtencion,
      // ... otros campos heredables
    };
  }
}
```

---

## 📁 3. ESTRUCTURA DE CARPETAS Y COMPONENTES

### 3.1. Organización Propuesta

```
frontend/src/
├── modules/
│   └── medical/
│       ├── forms/                          # Módulo de formularios
│       │   ├── core/                       # Componentes base
│       │   │   ├── FormRenderer.jsx        # Renderizador central
│       │   │   ├── FormValidator.js        # Validador genérico
│       │   │   ├── FormStateManager.js     # Gestor de estado
│       │   │   └── FormNavigation.jsx      # Navegación entre bloques
│       │   │
│       │   ├── formulario008/              # Formulario 008
│       │   │   ├── Formulario008.jsx       # Componente principal
│       │   │   ├── blocks/                 # Bloques del formulario
│       │   │   │   ├── InicioAtencion.jsx
│       │   │   │   ├── Anamnesis.jsx
│       │   │   │   ├── Antecedentes.jsx
│       │   │   │   ├── ExamenFisico.jsx
│       │   │   │   ├── Diagnosticos.jsx
│       │   │   │   ├── PlanTratamiento.jsx
│       │   │   │   └── CondicionEgreso.jsx
│       │   │   ├── validations/
│       │   │   │   └── formulario008Rules.js  # Reglas MSP
│       │   │   └── config/
│       │   │       └── formulario008Config.js # Configuración
│       │   │
│       │   ├── formulario005/              # Formulario 005 (Evolución)
│       │   │   ├── Formulario005.jsx
│       │   │   ├── blocks/
│       │   │   └── validations/
│       │   │
│       │   ├── formulario053/              # Formulario 053 (Referencia)
│       │   │   ├── Formulario053.jsx
│       │   │   └── ...
│       │   │
│       │   └── shared/                      # Componentes compartidos
│       │       ├── DiagnosticosCIE10.jsx    # Ya existe, mover aquí
│       │       ├── PrescripcionMedica.jsx   # Nuevo componente unificado
│       │       ├── OrdenExamen.jsx           # Ya existe, mover aquí
│       │       └── BuscadorCIE10.jsx        # Motor mejorado
│       │
│       ├── services/                        # Servicios de negocio
│       │   ├── atencionMedicaService.js     # Gestión de atención
│       │   ├── formularioService.js         # CRUD formularios
│       │   ├── herenciaDatosService.js      # Lógica de herencia
│       │   └── validacionMSPService.js      # Validaciones normativas
│       │
│       ├── hooks/                           # Custom hooks
│       │   ├── useFormulario.js             # Hook genérico para formularios
│       │   ├── useValidacionMSP.js          # Hook de validación
│       │   └── useHerenciaDatos.js          # Hook de herencia
│       │
│       └── store/                            # Estado global (Zustand/Redux)
│           ├── atencionMedicaStore.js       # Estado de atención
│           ├── formularioStore.js            # Estado de formularios
│           └── validacionStore.js            # Estado de validaciones
│
└── components/                               # Componentes globales (mantener)
    ├── Header.jsx
    ├── PatientBanner.jsx
    └── ...
```

### 3.2. Componente FormRenderer Central

```javascript
// modules/medical/forms/core/FormRenderer.jsx
import React from 'react';
import { useFormulario } from '../../hooks/useFormulario';
import { useValidacionMSP } from '../../hooks/useValidacionMSP';

const FormRenderer = ({ tipoFormulario, atencionMedicaId, formularioId }) => {
  const { 
    datos, 
    bloques, 
    bloqueActivo, 
    cambiarBloque,
    guardar,
    cargarDatos 
  } = useFormulario(tipoFormulario, atencionMedicaId, formularioId);

  const { 
    validarBloque, 
    errores, 
    bloquesCompletos 
  } = useValidacionMSP(tipoFormulario, datos);

  // Cargar componente del formulario dinámicamente
  const FormularioComponent = React.lazy(() => 
    import(`../formulario${tipoFormulario}/Formulario${tipoFormulario}.jsx`)
  );

  return (
    <React.Suspense fallback={<div>Cargando formulario...</div>}>
      <FormularioComponent
        datos={datos}
        bloques={bloques}
        bloqueActivo={bloqueActivo}
        cambiarBloque={cambiarBloque}
        guardar={guardar}
        validarBloque={validarBloque}
        errores={errores}
        bloquesCompletos={bloquesCompletos}
      />
    </React.Suspense>
  );
};

export default FormRenderer;
```

### 3.3. Configuración de Formularios

```javascript
// modules/medical/forms/formulario008/config/formulario008Config.js
export const formulario008Config = {
  tipo: '008',
  nombre: 'Formulario 008 - Emergencia',
  esDocumentoMaestro: true,
  bloques: [
    {
      id: 'inicioAtencion',
      nombre: 'Inicio de Atención',
      obligatorio: true,
      orden: 1,
      componente: 'InicioAtencion'
    },
    {
      id: 'anamnesis',
      nombre: 'Anamnesis',
      obligatorio: true,
      orden: 2,
      componente: 'Anamnesis'
    },
    {
      id: 'antecedentes',
      nombre: 'Antecedentes',
      obligatorio: false,
      orden: 3,
      componente: 'Antecedentes'
    },
    {
      id: 'examenFisico',
      nombre: 'Examen Físico',
      obligatorio: true,
      orden: 4,
      componente: 'ExamenFisico'
    },
    {
      id: 'diagnosticos',
      nombre: 'Diagnósticos CIE-10',
      obligatorio: true,
      orden: 5,
      componente: 'Diagnosticos',
      validacionPreFirma: true // Requiere al menos 1 diagnóstico DEFINITIVO
    },
    {
      id: 'planTratamiento',
      nombre: 'Plan de Tratamiento',
      obligatorio: true,
      orden: 6,
      componente: 'PlanTratamiento'
    },
    {
      id: 'condicionEgreso',
      nombre: 'Condición al Egreso',
      obligatorio: true,
      orden: 7,
      componente: 'CondicionEgreso'
    }
  ],
  validaciones: {
    // Se define en formulario008Rules.js
  },
  datosHeredables: [
    'pacienteId',
    'admisionId',
    'diagnosticos',
    'planTratamiento',
    'motivoAtencion'
  ]
};
```

---

## 🔍 4. ANÁLISIS: LO QUE HACE vs LO QUE FALTA

### 4.1. ✅ Lo que HACE (Funcionalidades Implementadas)

| Funcionalidad | Estado | Ubicación |
|--------------|--------|-----------|
| Dashboard de pendientes | ✅ Completo | `pages/DashboardPendientes.jsx` |
| Atenciones en curso | ✅ Completo | `pages/AtencionesEnCurso.jsx` |
| Pre-llenado desde admisión | ✅ Completo | `AtencionEmergenciaPage.jsx` |
| Auto-guardado por pestaña | ✅ Completo | `AtencionEmergenciaForm.jsx` |
| Diagnósticos CIE-10 | ✅ Completo | `components/DiagnosticosCIE10.jsx` |
| Regla de la letra Z | ✅ Implementada | `DiagnosticosCIE10.jsx:68-70` |
| Firma electrónica | ✅ Completo | `components/FirmaElectronica.jsx` |
| Reasignación de pacientes | ✅ Completo | `components/ReasignarPacienteModal.jsx` |
| Visualización de signos vitales | ✅ Completo | `PatientBanner.jsx` |
| Historial de atenciones | ✅ Completo | `AtencionEmergenciaPage.jsx` |

### 4.2. ❌ Lo que FALTA (Por Implementar)

#### **A. Validaciones según Norma Técnica MSP**

**Prioridad: ALTA**

```javascript
// modules/medical/forms/formulario008/validations/formulario008Rules.js

export const formulario008Rules = {
  inicioAtencion: {
    fechaAtencion: {
      required: true,
      message: 'La fecha de atención es obligatoria'
    },
    horaAtencion: {
      required: true,
      pattern: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
      message: 'La hora debe estar en formato HH:mm'
    },
    condicionLlegada: {
      required: true,
      enum: ['ESTABLE', 'INESTABLE', 'FALLECIDO'],
      message: 'La condición de llegada es obligatoria'
    }
  },
  anamnesis: {
    enfermedadProblemaActual: {
      required: true,
      minLength: 10,
      message: 'La anamnesis debe tener al menos 10 caracteres'
    }
  },
  examenFisico: {
    // Validaciones según tipo de paciente
    glasgow: {
      conditional: (datos) => {
        // Si condiciónLlegada es INESTABLE, Glasgow es obligatorio
        if (datos.condicionLlegada === 'INESTABLE') {
          return {
            required: true,
            message: 'El Glasgow es obligatorio para pacientes inestables'
          };
        }
        return { required: false };
      }
    }
  },
  diagnosticos: {
    alMenosUnoDefinitivo: {
      required: true,
      validator: (diagnosticos) => {
        const tieneDefinitivo = diagnosticos.some(d => 
          d.tipoDiagnostico === 'DEFINITIVO' && 
          !d.codigoCIE10.startsWith('Z')
        );
        if (!tieneDefinitivo) {
          return 'Debe existir al menos un diagnóstico DEFINITIVO (excepto códigos Z)';
        }
        return true;
      }
    }
  },
  planTratamiento: {
    // Validación: Si hay diagnóstico, debe haber plan
    requeridoSiHayDiagnostico: {
      conditional: (datos) => {
        if (datos.diagnosticos && datos.diagnosticos.length > 0) {
          return {
            required: true,
            message: 'El plan de tratamiento es obligatorio cuando hay diagnósticos'
          };
        }
        return { required: false };
      }
    }
  }
};
```

**Implementación:**

```javascript
// modules/medical/forms/core/FormValidator.js
import { formulario008Rules } from '../formulario008/validations/formulario008Rules';

export class FormValidator {
  static validarBloque(tipoFormulario, bloqueId, datos) {
    const rules = this.getRules(tipoFormulario);
    const bloqueRules = rules[bloqueId];
    
    if (!bloqueRules) return { valido: true, errores: [] };

    const errores = [];
    
    for (const [campo, regla] of Object.entries(bloqueRules)) {
      const valor = datos[campo];
      
      // Validación condicional
      if (regla.conditional) {
        const reglaCondicional = regla.conditional(datos);
        if (reglaCondicional.required && !valor) {
          errores.push({
            campo,
            mensaje: reglaCondicional.message
          });
        }
      }
      
      // Validación requerida
      if (regla.required && !valor) {
        errores.push({
          campo,
          mensaje: regla.message
        });
      }
      
      // Validación de patrón
      if (regla.pattern && valor && !regla.pattern.test(valor)) {
        errores.push({
          campo,
          mensaje: regla.message
        });
      }
      
      // Validación custom
      if (regla.validator) {
        const resultado = regla.validator(valor);
        if (resultado !== true) {
          errores.push({
            campo,
            mensaje: resultado
          });
        }
      }
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  }
  
  static getRules(tipoFormulario) {
    const rulesMap = {
      '008': formulario008Rules,
      // '005': formulario005Rules,
      // ...
    };
    return rulesMap[tipoFormulario] || {};
  }
}
```

#### **B. Motor de Búsqueda CIE-10 Mejorado**

**Prioridad: ALTA**

**Problema Actual:**
- Búsqueda básica por término (línea 40-56 en `DiagnosticosCIE10.jsx`)
- Solo muestra 10 resultados
- No hay búsqueda por código
- No hay sugerencias inteligentes

**Solución Propuesta:**

```javascript
// modules/medical/forms/shared/BuscadorCIE10.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, Code, FileText } from 'lucide-react';

const BuscadorCIE10 = ({ onSelect, valorInicial = '' }) => {
  const [termino, setTermino] = useState(valorInicial);
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modoBusqueda, setModoBusqueda] = useState('descripcion'); // 'descripcion' | 'codigo'

  // Debounce para búsqueda
  const buscarCIE10 = useMemo(
    () => debounce(async (texto, modo) => {
      if (texto.length < 2) {
        setResultados([]);
        return;
      }

      setCargando(true);
      try {
        const token = localStorage.getItem('token');
        let url = `http://localhost:3001/api/cat-cie10?`;
        
        if (modo === 'codigo') {
          url += `codigo=${texto}&limit=20`;
        } else {
          url += `search=${texto}&limit=20&fuzzy=true`; // Búsqueda difusa
        }

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setResultados(response.data);
      } catch (error) {
        console.error('Error al buscar CIE-10:', error);
      } finally {
        setCargando(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    buscarCIE10(termino, modoBusqueda);
  }, [termino, modoBusqueda]);

  const handleSelect = (cie10) => {
    onSelect(cie10);
    setTermino(cie10.codigo);
    setResultados([]);
  };

  return (
    <div className="relative">
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setModoBusqueda('descripcion')}
          className={`px-3 py-1 rounded ${modoBusqueda === 'descripcion' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          <FileText className="w-4 h-4 inline mr-1" />
          Descripción
        </button>
        <button
          onClick={() => setModoBusqueda('codigo')}
          className={`px-3 py-1 rounded ${modoBusqueda === 'codigo' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          <Code className="w-4 h-4 inline mr-1" />
          Código
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          placeholder={modoBusqueda === 'codigo' ? 'Ej: A00.0' : 'Buscar por descripción...'}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {cargando && (
          <div className="absolute right-3 top-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {resultados.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {resultados.map((cie10) => (
            <div
              key={cie10.codigo}
              onClick={() => handleSelect(cie10)}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b"
            >
              <div className="font-semibold text-blue-600">{cie10.codigo}</div>
              <div className="text-sm text-gray-600">{cie10.descripcion}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default BuscadorCIE10;
```

**Backend - Mejoras en el Controlador:**

```javascript
// backend/controllers/catCie10Controller.js
exports.buscarCIE10 = async (req, res) => {
  try {
    const { search, codigo, limit = 20, fuzzy = false } = req.query;
    
    let whereClause = {};
    
    if (codigo) {
      // Búsqueda exacta o por prefijo de código
      whereClause.codigo = {
        [Op.like]: `${codigo}%`
      };
    } else if (search) {
      if (fuzzy) {
        // Búsqueda difusa (permite errores de tipeo)
        whereClause[Op.or] = [
          { descripcion: { [Op.like]: `%${search}%` } },
          { codigo: { [Op.like]: `%${search}%` } }
        ];
      } else {
        // Búsqueda exacta
        whereClause.descripcion = {
          [Op.like]: `%${search}%`
        };
      }
    } else {
      return res.status(400).json({ message: 'Se requiere search o codigo' });
    }
    
    const resultados = await CatCie10.findAll({
      where: whereClause,
      limit: parseInt(limit),
      order: [
        // Priorizar códigos que empiezan con el término
        [sequelize.literal(`CASE WHEN codigo LIKE '${codigo || search}%' THEN 0 ELSE 1 END`), 'ASC'],
        ['codigo', 'ASC']
      ]
    });
    
    res.json(resultados);
  } catch (error) {
    console.error('Error al buscar CIE-10:', error);
    res.status(500).json({ message: 'Error al buscar CIE-10', error: error.message });
  }
};
```

#### **C. Integración de Prescripción en Flujo 008**

**Prioridad: MEDIA-ALTA**

**Problema Actual:**
- `RecetaMedicaForm` existe pero está desconectado
- `OrdenExamenForm` existe pero está desconectado
- No hay integración con el bloque "Plan de Tratamiento"

**Solución: Integrar en bloque "Plan de Tratamiento"**

```javascript
// modules/medical/forms/formulario008/blocks/PlanTratamiento.jsx
import React, { useState } from 'react';
import PrescripcionMedica from '../../shared/PrescripcionMedica';
import OrdenExamen from '../../shared/OrdenExamen';
import OrdenImagen from '../../shared/OrdenImagen';

const PlanTratamiento = ({ datos, onChange, errores, readOnly }) => {
  const [mostrarPrescripcion, setMostrarPrescripcion] = useState(false);
  const [mostrarOrdenExamen, setMostrarOrdenExamen] = useState(false);
  const [mostrarOrdenImagen, setMostrarOrdenImagen] = useState(false);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Plan de Tratamiento</h3>

      {/* Plan de Tratamiento Textual (Actual) */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Observaciones del Plan de Tratamiento
        </label>
        <textarea
          value={datos.observacionesPlanTratamiento || ''}
          onChange={(e) => onChange('observacionesPlanTratamiento', e.target.value)}
          className="w-full px-4 py-2 border rounded-md"
          rows={4}
          readOnly={readOnly}
        />
      </div>

      {/* Acciones de Prescripción */}
      {!readOnly && (
        <div className="flex gap-4">
          <button
            onClick={() => setMostrarPrescripcion(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            + Receta Médica
          </button>
          <button
            onClick={() => setMostrarOrdenExamen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Orden de Examen
          </button>
          <button
            onClick={() => setMostrarOrdenImagen(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            + Orden de Imagen
          </button>
        </div>
      )}

      {/* Lista de Prescripciones/Órdenes */}
      <div className="space-y-2">
        {/* Mostrar recetas, órdenes existentes */}
      </div>

      {/* Modales */}
      {mostrarPrescripcion && (
        <PrescripcionMedica
          admisionId={datos.admisionId}
          onClose={() => setMostrarPrescripcion(false)}
          onGuardar={(receta) => {
            // Agregar receta al plan de tratamiento
            const nuevoPlan = [...(datos.planTratamiento || []), {
              tipo: 'RECETA',
              ...receta
            }];
            onChange('planTratamiento', nuevoPlan);
            setMostrarPrescripcion(false);
          }}
        />
      )}

      {/* Similar para OrdenExamen y OrdenImagen */}
    </div>
  );
};

export default PlanTratamiento;
```

#### **D. Cierre de Atención con Firma Electrónica**

**Prioridad: ALTA** (Ya implementado, pero mejorar validaciones)

**Mejoras Propuestas:**

```javascript
// modules/medical/forms/core/ValidacionPreFirma.js
export class ValidacionPreFirma {
  static async validarFormulario008(formularioId) {
    const errores = [];

    // 1. Validar bloques obligatorios completos
    const bloquesObligatorios = ['inicioAtencion', 'anamnesis', 'examenFisico', 'diagnosticos', 'planTratamiento', 'condicionEgreso'];
    for (const bloque of bloquesObligatorios) {
      const validacion = await FormValidator.validarBloque('008', bloque, datos);
      if (!validacion.valido) {
        errores.push(...validacion.errores);
      }
    }

    // 2. Validar diagnósticos
    const diagnosticos = await obtenerDiagnosticos(formularioId);
    const tieneDefinitivo = diagnosticos.some(d => 
      d.tipoDiagnostico === 'DEFINITIVO' && 
      !d.codigoCIE10.startsWith('Z')
    );
    if (!tieneDefinitivo) {
      errores.push({
        bloque: 'diagnosticos',
        mensaje: 'Debe existir al menos un diagnóstico DEFINITIVO (excepto códigos Z)'
      });
    }

    // 3. Validar plan de tratamiento
    if (diagnosticos.length > 0 && (!datos.planTratamiento || datos.planTratamiento.length === 0)) {
      errores.push({
        bloque: 'planTratamiento',
        mensaje: 'El plan de tratamiento es obligatorio cuando hay diagnósticos'
      });
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }
}
```

---

## 🔄 5. ESTRATEGIA DE ESTADO GLOBAL

### 5.1. Opción Recomendada: Zustand (Ligero y Simple)

```javascript
// modules/medical/store/atencionMedicaStore.js
import create from 'zustand';
import { persist } from 'zustand/middleware';

export const useAtencionMedicaStore = create(
  persist(
    (set, get) => ({
      // Estado
      atencionActiva: null,
      formularios: [],
      bloqueActivo: null,
      datosFormulario: {},
      validaciones: {},
      errores: {},

      // Acciones
      setAtencionActiva: (atencion) => set({ atencionActiva: atencion }),
      
      agregarFormulario: (formulario) => set((state) => ({
        formularios: [...state.formularios, formulario]
      })),
      
      actualizarDatosFormulario: (tipoFormulario, datos) => set((state) => ({
        datosFormulario: {
          ...state.datosFormulario,
          [tipoFormulario]: datos
        }
      })),
      
      setBloqueActivo: (bloque) => set({ bloqueActivo: bloque }),
      
      agregarError: (bloque, error) => set((state) => ({
        errores: {
          ...state.errores,
          [bloque]: [...(state.errores[bloque] || []), error]
        }
      })),
      
      limpiarErrores: (bloque) => set((state) => {
        const nuevosErrores = { ...state.errores };
        delete nuevosErrores[bloque];
        return { errores: nuevosErrores };
      }),
      
      reset: () => set({
        atencionActiva: null,
        formularios: [],
        bloqueActivo: null,
        datosFormulario: {},
        validaciones: {},
        errores: {}
      })
    }),
    {
      name: 'atencion-medica-storage',
      partialize: (state) => ({
        atencionActiva: state.atencionActiva,
        bloqueActivo: state.bloqueActivo,
        datosFormulario: state.datosFormulario
      })
    }
  )
);
```

### 5.2. Uso en Componentes

```javascript
// modules/medical/forms/formulario008/Formulario008.jsx
import { useAtencionMedicaStore } from '../../store/atencionMedicaStore';

const Formulario008 = ({ atencionMedicaId }) => {
  const {
    datosFormulario,
    bloqueActivo,
    actualizarDatosFormulario,
    setBloqueActivo,
    agregarError,
    limpiarErrores
  } = useAtencionMedicaStore();

  const datos = datosFormulario['008'] || {};

  const handleCambiarBloque = async (nuevoBloque) => {
    // Validar bloque actual antes de cambiar
    const validacion = FormValidator.validarBloque('008', bloqueActivo, datos);
    if (!validacion.valido) {
      validacion.errores.forEach(error => agregarError(bloqueActivo, error));
      return; // No permitir cambio
    }

    limpiarErrores(bloqueActivo);
    setBloqueActivo(nuevoBloque);
  };

  return (
    // JSX del formulario
  );
};
```

---

## 📋 6. PLAN DE IMPLEMENTACIÓN

### Fase 1: Completar Formulario 008 (Prioridad Inmediata)

**Sprint 1 (2 semanas):**
- [ ] Implementar validaciones MSP completas
- [ ] Mejorar motor de búsqueda CIE-10
- [ ] Integrar prescripción en Plan de Tratamiento
- [ ] Mejorar validación pre-firma

**Sprint 2 (1 semana):**
- [ ] Testing completo del Formulario 008
- [ ] Documentación de uso
- [ ] Capacitación a usuarios

### Fase 2: Arquitectura Escalable (Preparación para Futuros Formularios)

**Sprint 3 (2 semanas):**
- [ ] Crear estructura de carpetas propuesta
- [ ] Implementar `FormRenderer` central
- [ ] Migrar Formulario 008 a nueva estructura
- [ ] Crear `FormValidator` genérico

**Sprint 4 (1 semana):**
- [ ] Implementar tablas `ATENCION_MEDICA` y `FORMULARIOS_ATENCION`
- [ ] Migrar datos existentes
- [ ] Crear servicios de herencia de datos

### Fase 3: Implementación de Formularios Adicionales

**Sprint 5+ (Por formulario, 1-2 semanas cada uno):**
- [ ] Formulario 005 (Evolución)
- [ ] Formulario 053 (Referencia/Contrareferencia)
- [ ] Formularios 006, 007, 010, 012, 016, 020, 022, 024, 051, 117

---

## 🎯 7. PRIORIDADES Y CRITERIOS DE ÉXITO

### Prioridades:

1. **ALTA:** Completar validaciones MSP del Formulario 008
2. **ALTA:** Mejorar motor de búsqueda CIE-10
3. **ALTA:** Integrar prescripción en flujo 008
4. **MEDIA:** Implementar arquitectura escalable
5. **MEDIA:** Migrar a nueva estructura de BD
6. **BAJA:** Implementar formularios adicionales

### Criterios de Éxito:

- ✅ Formulario 008 funcional al 100% con todas las validaciones MSP
- ✅ Código no rígido: fácil agregar nuevos formularios
- ✅ Herencia de datos funcionando entre formularios
- ✅ Estado global manejando sesiones de atención
- ✅ Documentación técnica completa

---

## 📚 8. REFERENCIAS Y DOCUMENTACIÓN

- **Norma Técnica MSP Ecuador:** Formulario 008 - Atención de Emergencia
- **CIE-10:** Clasificación Internacional de Enfermedades, 10ª Revisión
- **Documentación Actual:**
  - `FORMULARIO_008_README.md`
  - `ARCHITECTURE_DECISION.md`

---

**Documento generado:** Enero 2026  
**Versión:** 1.0  
**Autor:** Arquitecto de Software - Cursor AI
