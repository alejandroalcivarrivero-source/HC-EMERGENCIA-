# Resumen Técnico y Ejecutivo: Estado de Implementación HC-EMERGENCIA

**Fecha:** 05 de Febrero de 2026  
**Contexto:** Informe de estado para consulta técnica con LLM (Gemini Pro).  
**Stack Tecnológico:** Node.js (Sequelize ORM), React (Vite), MariaDB/MySQL.

---

## 1. Módulo de Signos Vitales (Refactorización y Persistencia Dual)

El módulo de signos vitales ha evolucionado de un almacenamiento simple de cadenas a un modelo híbrido optimizado para análisis de datos y alertas en tiempo real.

### Backend (`signos_vitales.js` y `signosVitalesController.js`)
*   **Persistencia Dual de Presión Arterial:**
    *   **Legacy/Compatibilidad:** Se mantiene el campo `presion_arterial` (VARCHAR) para compatibilidad con la visualización existente ("120/80").
    *   **Segmentación Numérica:** Se han introducido los campos `presion_sistolica` (INT) y `presion_diastolica` (INT).
    *   **Lógica de Controlador:** En el método `saveSignosVitalesAndTriaje`, el controlador parsea automáticamente la cadena `presion_arterial`. Si es válida, popula los campos numéricos individuales.
*   **Alertas Clínicas:** Se implementó una lógica post-guardado que evalúa `presion_sistolica`. Si supera los **140 mmHg**, se dispara una alerta (actualmente registrada como advertencia en logs del servidor, preparada para integración con sistemas de notificación).
*   **Validaciones:** Se aplican validaciones de rango y completitud antes de la persistencia transaccional.

### Flujo de Datos
1.  **Frontend:** Envía el objeto JSON con `presion_arterial` como string concatenado.
2.  **Controller:** Intercepta el payload, descompone la presión arterial, inicia una transacción DB, guarda el registro principal y actualiza el estado de la admisión.

---

## 2. Gestión de Diagnósticos (CIE-10)

Sistema robusto para la codificación clínica cumpliendo normativas del MSP (Formulario 008).

### Backend (`DetalleDiagnostico.js` y `diagnosticosController.js`)
*   **Modelo Relacional:** `DetalleDiagnostico` implementa una relación recursiva (`padreId`) para vincular diagnósticos de trauma (Códigos S/T) con sus respectivas Causas Externas (Códigos V-Y).
*   **Atributos Clave:**
    *   `tipoDiagnostico`: ENUM ('PRESUNTIVO', 'DEFINITIVO', 'NO APLICA').
    *   `condicion`: ENUM ('Presuntivo', 'Definitivo Inicial', 'Definitivo Inicial por Laboratorio', etc.).
    *   `esCausaExterna`: Flag booleano para fácil identificación.
*   **Lógica de Negocio:**
    *   Validación estricta: No permite guardar códigos de trauma sin una causa externa asociada.
    *   Normalización automática de la "Condición" basada en el "Tipo".

### Frontend (`DiagnosticosCIE10.jsx`)
*   **Interfaz de Usuario:** Componente React que consume la API de búsqueda de CIE-10.
*   **Validación Client-Side:**
    *   Impide agregar más de 3 diagnósticos presuntivos o 3 definitivos (regla de negocio).
    *   Detecta automáticamente si el código seleccionado requiere una causa externa y despliega un sub-formulario condicional.
    *   Visualización jerárquica en tabla (Causa Externa indentada bajo su diagnóstico principal).

---

## 3. Orquestación de Atención (`atencionEmergenciaController.js`)

Este controlador actúa como el núcleo transaccional del sistema, asegurando la integridad referencial y la consistencia del estado del paciente.

### Arquitectura Transaccional (ACID)
Recientemente refactorizado para utilizar `sequelize.transaction` en operaciones críticas (`createAtencionEmergencia`, `updateAtencionEmergencia`).

### Flujo de Creación de Atención:
1.  **Inicio de Transacción.**
2.  **Persistencia:** Crea el registro en `ATENCION_EMERGENCIA` con los datos clínicos, `usuarioResponsableId` y campos de fallecimiento sanitizados.
3.  **Sincronización de Admisión:** Actualiza la tabla `ADMISIONES`, cambiando el estado del paciente a `EN_ATENCION` y actualizando `fecha_ultima_actividad`.
4.  **Traza de Auditoría:** Genera un registro en `ATENCION_PACIENTE_ESTADO` para el historial de movimientos del paciente.
5.  **Commit/Rollback:** Si cualquiera de los pasos falla, se revierten todos los cambios para evitar registros huérfanos (e.g., una atención creada sin actualizar el estado del paciente).

---

## 4. Base de Datos e Impacto

### Cambios de Esquema Recientes (`split_bp_columns.sql`)
*   **DDL:**
    ```sql
    ALTER TABLE SIGNOS_VITALES ADD COLUMN presion_sistolica INT NULL, presion_diastolica INT NULL;
    CREATE INDEX idx_presion_sistolica ON SIGNOS_VITALES (presion_sistolica);
    CREATE INDEX idx_presion_diastolica ON SIGNOS_VITALES (presion_diastolica);
    ```

### Impacto en Rendimiento y BI
*   **Consultas Analíticas:** Los nuevos índices permiten realizar consultas de agregación (promedios, detección de hipertensión) en tiempo O(log n) en lugar de realizar escaneos completos de tabla con procesamiento de cadenas (regex/substring), reduciendo drásticamente la latencia en reportes de Business Intelligence.
*   **Integridad:** La separación de campos elimina errores de formato en análisis estadísticos posteriores.

---

**Resumen:** El sistema ha migrado hacia una arquitectura más resiliente y orientada a datos, con transacciones atómicas para flujos críticos y estructuras de datos optimizadas para análisis, manteniendo al mismo tiempo la compatibilidad con los flujos de trabajo existentes en el frontend.
