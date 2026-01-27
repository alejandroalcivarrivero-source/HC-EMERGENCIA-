# Implementación del Generador de PDF para Formulario 008

## 📋 Resumen

Se ha implementado un generador completo de PDF para el Formulario 008 del MSP Ecuador, cumpliendo estrictamente con la norma técnica SNS-MSP / HCU-form.008 / 2008.

## ✅ Funcionalidades Implementadas

### 1. Servicio Generador de PDF

**Archivo:** `frontend/src/services/generadorPDFFormulario008.js`

#### Características:

- **Formato A4:** Orientación vertical, márgenes de 10mm
- **Tipografía:** Helvetica (Arial compatible)
  - Tamaños: 8pt para etiquetas, 9pt para títulos, 10pt para encabezado
- **Encabezado Oficial:**
  - Texto legal: "SNS-MSP / HCU-form.008 / 2008"
  - Título: "FORMULARIO 008 - ATENCIÓN DE EMERGENCIA"
  - Institución: SERVICIO NACIONAL DE SALUD
  - Unidad Operativa: CENTRO DE SALUD CHONE TIPO C
  - Cantón: CHONE
  - Provincia: MANABÍ
  - Número de Historia Clínica (desde ID del paciente)

### 2. Bloques Implementados

#### Bloque 1: Datos del Paciente
- Nombre completo
- Identificación
- Fecha de nacimiento (formateada)
- Sexo

#### Bloque 2: Datos de Admisión
- Fecha y hora de admisión (formateada)
- Forma de llegada

#### Bloque 3: Motivo de Consulta
- Texto completo del motivo

#### Bloque 4: Triage
- Nivel de prioridad
- Observaciones (si aplica)
- Espacio en blanco marcado si no aplica

#### Bloque 5: Signos Vitales
- Tabla estructurada con:
  - Temperatura
  - Presión Arterial
  - Frecuencia Cardíaca
  - Frecuencia Respiratoria
  - Saturación de Oxígeno
  - Glicemia Capilar
- Manejo de "Sin constantes vitales"
- Espacio en blanco marcado si no hay datos

#### Bloque 6: Examen Físico
- Tabla estructurada con todos los sistemas:
  - Piel y Faneras
  - Cabeza, Ojos, Oídos, Nariz, Boca
  - Orofaringe, Cuello
  - Tórax, Abdomen
  - Miembros Superiores e Inferiores
  - Escala de Glasgow (si aplica)
- Espacio en blanco marcado si no hay datos

#### Bloque 7: Anamnesis (Enfermedad o Problema Actual)
- Texto completo con ajuste automático de líneas
- Espacio en blanco marcado si no hay datos

#### Bloque 8: Antecedentes Patológicos
- Tabla estructurada con tipos:
  - Alérgicos
  - Clínicos
  - Quirúrgicos
  - Traumáticos
  - Farmacológicos
  - Familiares
  - Otros
- Espacio en blanco marcado si no hay datos

#### Bloque 9: Evento Traumático (Condicional)
- Solo se muestra si hay evento traumático
- Tipo de evento
- Lugar
- Observaciones

#### Bloque 10: Diagnósticos CIE-10
- Tabla estructurada con:
  - Número de orden
  - Código CIE-10
  - Descripción
  - Tipo (PRESUNTIVO/DEFINITIVO/NO APLICA)
- Espacio en blanco marcado si no hay diagnósticos

#### Bloque 11: Plan de Tratamiento ⭐
- **Tabla estructurada** con prescripciones del componente `PrescripcionMedicaEstructurada`:
  - **Medicamentos:**
    - Nombre completo (comercial/genérico)
    - Concentración
    - Forma farmacéutica
    - Dosis
    - Frecuencia
    - Vía de administración
    - Duración
  - **Procedimientos de Laboratorio:**
    - Marcado con [LAB]
    - Indica si requiere Orden 010
  - **Procedimientos de Imagenología:**
    - Marcado con [IMG]
    - Indica si requiere Orden 012
- Observaciones adicionales (si existen)
- Espacio en blanco marcado si no hay prescripciones

#### Bloque 12: Firma Electrónica
- Nombre del médico responsable
- Cédula del médico
- Espacio para firma electrónica / código QR (60x20mm)
- Indicador de estado de firma:
  - Si está firmado: "✓ FIRMADO ELECTRÓNICAMENTE" + fecha
  - Si no está firmado: Línea diagonal en el espacio

### 3. Componente Botón de Impresión

**Archivo:** `frontend/src/components/BotonImprimirFormulario008.jsx`

#### Características:

- **Dos acciones:**
  - **Imprimir:** Genera PDF y abre ventana de impresión
  - **Descargar:** Genera PDF y lo descarga
- **Carga automática de datos:**
  - Obtiene diagnósticos desde API
  - Obtiene datos completos de la atención (incluyendo Usuario/médico)
  - Estructura todos los datos para el generador
- **Manejo de errores:** Muestra mensajes claros si falla
- **Estados de carga:** Indicador visual mientras genera

### 4. Integración en la Vista

**Archivo:** `frontend/src/pages/AtencionEmergenciaPage.jsx`

- Botón integrado después de los diagnósticos
- Disponible siempre que exista una atención
- Se muestra antes del bloque de firma

### 5. Endpoint Backend Actualizado

**Archivo:** `backend/controllers/atencionEmergenciaController.js`

- Nuevo endpoint: `GET /api/atencion-emergencia/:id`
- Incluye Usuario con cédula para la firma
- Incluye todos los datos necesarios para el PDF

## 🎨 Características de Diseño

### Espacios en Blanco

Según la norma MSP, los espacios no utilizados deben estar claramente identificados:

- **Línea diagonal:** Se dibuja una línea diagonal gris en espacios vacíos
- **Texto "(No registrado)":** En cursiva y color gris
- **Prevención de adiciones manuales:** La línea diagonal evita que se agregue texto después

### Formato de Tablas

- **Tema:** Grid (bordes visibles)
- **Encabezados:** Fondo gris claro, texto en negrita
- **Celdas:** Padding mínimo (2mm) para optimizar espacio
- **Fuente:** 8pt para máximo contenido

### Pie de Página

- Texto legal: "SNS-MSP / HCU-form.008 / 2008"
- Centrado
- Color gris
- Tamaño 7pt

## 📊 Estructura de Datos Requerida

El generador espera un objeto con la siguiente estructura:

```javascript
{
  paciente: {
    id: number,
    primer_nombre: string,
    segundo_nombre: string,
    primer_apellido: string,
    segundo_apellido: string,
    numero_identificacion: string,
    fecha_nacimiento: string,
    sexo: string
  },
  admision: {
    id: number,
    fecha_hora_admision: string,
    formaLlegada: string
  },
  atencion: {
    id: number,
    enfermedadProblemaActual: string,
    antecedentesPatologicos: object | string (JSON),
    examenFisico: object | string (JSON),
    planTratamiento: array | string (JSON),
    observacionesPlanTratamiento: string,
    estadoFirma: 'PENDIENTE' | 'FIRMADO',
    Usuario: {
      nombres: string,
      apellidos: string,
      cedula: string
    }
  },
  signosVitales: {
    temperatura: number,
    presion_arterial_sistolica: number,
    presion_arterial_diastolica: number,
    frecuencia_cardiaca: number,
    frecuencia_respiratoria: number,
    saturacion_oxigeno: number,
    glicemia_capilar: number,
    sin_constantes_vitales: boolean
  },
  triaje: {
    nombre: string,
    observaciones: string
  },
  motivoConsulta: string,
  diagnosticos: [
    {
      codigoCIE10: string,
      tipo_diagnostico: string,
      descripcion: string,
      CIE10: {
        codigo: string,
        descripcion: string
      }
    }
  ],
  medico: {
    nombres: string,
    apellidos: string,
    cedula: string
  }
}
```

## 🔧 Uso

### Desde el Componente

```jsx
<BotonImprimirFormulario008
  atencionId={atencion.id}
  admisionId={admisionId}
  paciente={paciente}
  admision={admisionDetails}
  atencion={atencion}
  signosVitales={signosVitalesDetails}
  triaje={triaje}
  motivoConsulta={motivoConsulta}
/>
```

### Desde Código

```javascript
import { imprimirPDFFormulario008, descargarPDFFormulario008 } from '../services/generadorPDFFormulario008';

// Imprimir (abre ventana de impresión)
imprimirPDFFormulario008(datosCompletos);

// Descargar
descargarPDFFormulario008(datosCompletos, 'formulario_008_paciente_123.pdf');
```

## 📝 Ejemplo de Salida

El PDF generado incluye:

1. **Página 1:**
   - Encabezado oficial
   - Bloques 1-8 (Datos paciente hasta Antecedentes)
   - Inicio de Bloque 9-10 (si aplica)

2. **Página 2 (si es necesario):**
   - Continuación de bloques
   - Bloque 11 (Plan de Tratamiento) - Tabla completa
   - Bloque 12 (Firma Electrónica)
   - Pie de página

## 🎯 Cumplimiento con Norma MSP

✅ **Formato oficial:** SNS-MSP / HCU-form.008 / 2008  
✅ **Encabezado completo:** Institución, Unidad Operativa, Cantón, Provincia, N° HC  
✅ **Todos los bloques:** 1-12 implementados  
✅ **Espacios en blanco:** Marcados con línea diagonal  
✅ **Firma electrónica:** Espacio reservado con indicador de estado  
✅ **Tipografía:** Helvetica/Arial, tamaños según norma  
✅ **Pie de página:** Texto legal incluido  

## 🚀 Próximos Pasos (Opcional)

- [ ] Agregar código QR real de la firma electrónica
- [ ] Integración con impresora térmica para recetas
- [ ] Generación automática al firmar
- [ ] Almacenamiento del PDF firmado en servidor
- [ ] Vista previa antes de imprimir

---

**Fecha de implementación:** Enero 2026  
**Versión:** 1.0  
**Librerías utilizadas:** jsPDF 2.x, jspdf-autotable
